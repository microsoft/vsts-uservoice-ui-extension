/// <reference path='../typings/tsd.d.ts' />
/// <reference path='../typings/jquery/jquery.d.ts' />

import WitServices = require("TFS/WorkItemTracking/Services");
import WitContracts = require("TFS/WorkItemTracking/Contracts");
import Q = require("q");
import Settings = require("vsts-uservoice-ui-settings-hub/settings");

export class UserVoiceSuggestion {

    public constructor(
        public id: number,
        public title: string,
        public description: string,
        public description_html: string,
        public url: string,
        public votes: number,
        public status: {
            name: string;
            hex_color: string;
        },
        public response: string,
        public response_html: string,
        public response_date: string,
        public total_comments: number,
        public most_recent_comments: UserVoiceComment[]
    ) { }

}

export class UserVoiceComment {

    public constructor(
        public created_by: string,
        public created_at: string,
        public text: string,
        public html: string
    ) { }

}

export class Services {

    constructor(public workItemFormService?: WitServices.IWorkItemFormService) {
    }
    
    public linkedUVSuggestions(): Q.Promise<UserVoiceSuggestion[]> {
        var self = this;
        var defer = Q.defer<UserVoiceSuggestion[]>();
        var settings = new Settings.Settings();

        // load the settings and get the work item relations
        var q = Q.all([
            settings.getSettings(true), 
            (<any>this.workItemFormService.getWorkItemRelations())
        ])
        // when both are done then
        .spread((settings: Settings.UVizSettings, relations: WitContracts.WorkItemRelation[]) => {

            var userVoiceItems = relations
                // extract the id from the url. when the url is not a valid uservoice url, then the id will be null  
                .map((relation: WitContracts.WorkItemRelation): {id: string} => {
                    return Services.extractIdFromUrl(relation.url);
                })
                // exclude invalid uservoice urls 
                .filter((item: {id: string}) => {
                    return item.id !== null; 
                })
                // retrieve the data from the user voice site (which is a promise) 
                .map((item: {id: string}) => {
                    return self._getUserVoiceInfo(settings.accountName, settings.apiKey, item.id);
                });

            // wait until the data for all user voice items is retrieved                
            Q.all(userVoiceItems).then((suggestions: UserVoiceSuggestion[]) => {
                // and then resolve the promise to inform the caller to show the user voice data in the UI
                defer.resolve(suggestions);
            }).fail((reason: any): void => {
                // the call to get the user voice information failed
                defer.reject(reason);
            })
        })
        .fail((reason: any): void => {
            // the work item relations could not be retrieved
            defer.reject(reason);
        });
        
        return defer.promise;
    }

    /** 
     * Parses the url and returns the User Voice suggestion ID from 
     * the url. Will return null when the url is not a valid User Voice
     * url. 
     */
    public static extractIdFromUrl(url: string): {id: string} {
        var pattern = `\/forums/[0-9]+.*/suggestions/([0-9]+)|/admin/v[23]/suggestions/([0-9]+)`;
        var matches = url.match(pattern);
        if ( matches && matches.length > 2 ) {
            // matches[1] is for the public facing url
            // matches[2] is for the admin url
            return {id: matches[1]||matches[2]};
        } else {
            return {id: null};
        }
    }

    /**
     * Validates if the given ID is a valid User Voice item in the forum. It returns the 
     * UserVoiceSuggestion object when found, else null.
     */
    public idExists(id: string): Q.Promise<UserVoiceSuggestion> {
        var self = this;
        var defer = Q.defer<UserVoiceSuggestion>();
        var settings = new Settings.Settings();

        // load the settings and get the work item relations
        var q = Q.all([
            settings.getSettings(true) 
        ])
        // when both are done then
        .spread((settings: Settings.UVizSettings) => {
             self._getUserVoiceInfo(settings.accountName, settings.apiKey, id)
                .done(
                    (suggestion: UserVoiceSuggestion) => {defer.resolve(suggestion)}, // the _getUserVoiceInfo will resolve the promise when the id is found, then return suggestion 
                    () => {defer.resolve(null)}); // the _getUserVoiceInfo will reject the promise when the id is NOT found, then return null
        })
        .fail((reason: any): void => {
            // the work item relations could not be retrieved
            defer.reject(reason);
        });
        
        return defer.promise;
        
    }
    
    private _getUserVoiceInfo(accountName: string, apiKey: string, id: string): Q.Promise<UserVoiceSuggestion> {
        var defer = Q.defer<UserVoiceSuggestion>();

        // call the UViz-API web api (which is hosted in the api subfolder in Azure) to overcome Cross-Domain scripting
        // which is not supported in the User Voice API v1        
        $.ajax({
            type: "GET",
            url: `../api/Suggestion/${id}?accountName=${accountName}&apikey=${apiKey}`
        }).done((data: any) => {
            
            if (!data.url) {
                // the item is not found
                defer.reject("item is not found");
            } else if (data.id) {            
                // when the id is set, the call was successful and return the data
                defer.resolve(new UserVoiceSuggestion(
                    data.id, 
                    data.title, 
                    data.description,
                    data.description_html,
                    data.url,
                    data.votes, 
                    {
                        name: data.status.name, 
                        hex_color: data.status.hex_color
                    },
                    data.response,
                    data.response_html,
                    data.response_date,
                    data.total_comments,
                    data.most_recent_comments)
                );
            } else {
                // something went wrong, and inform the user
                var settings = new Settings.Settings;
                var reason = `Unable to retrieve the data from User Voice (reason: ${data.title}). Please make sure the <a target="_blank" href="${settings.urlToConfigureSettings()}">api key is configured</a> correctly`;
                defer.reject(reason);
            }
        }).fail((error: any) => {
            defer.reject(error.responseText);
        });
        
        return defer.promise;
    }
    
}
