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
        public url: string,
        public votes: number,
        public status: {
            name: string;
            hex_color: string;
        }
    ) { }

}

export class Services {

    constructor(public workItemFormService: WitServices.IWorkItemFormService) {
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
                    var pattern = `http[s]*:\/\/${settings.accountName}.uservoice.com\/forums/.+/suggestions/([0-9]+)`;
                    var matches = relation.url.match(pattern);
                    if ( matches && matches.length > 1 ) {
                        return {id: matches[1]};
                    } else {
                        return {id: null};
                    }
                })
                // exclude invalid uservoice urls 
                .filter((item: {id: string}) => {
                    return item.id !== null; 
                })
                // retrieve the data from the user voice site (which is a promise) 
                .map((item: {id: string}) => {
                    return this._getUserVoiceInfo(settings.accountName, settings.apiKey, item.id);
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
    
    private _getUserVoiceInfo(accountName: string, apiKey: string, id: string): Q.Promise<UserVoiceSuggestion> {
        var defer = Q.defer<UserVoiceSuggestion>();

        // call the UViz-API web api (which is hosted in the api subfolder in Azure) to overcome Cross-Domain scripting
        // which is not supported in the User Voice API v1        
        $.ajax({
            type: "GET",
            url: `../api/Suggestion/${id}?accountName=${accountName}&apikey=${apiKey}`
        }).done((data: any) => {
            
            if (data.id) {            
                // when the id is set, the call was successful and return the data
                defer.resolve(new UserVoiceSuggestion(
                    data.id, 
                    data.title, 
                    data.url,
                    data.votes, 
                    {
                        name: data.status.name, 
                        hex_color: data.status.hex_color
                    })
                );
            } else {
                // something went wrong, and inform the user
                var settings = new Settings.Settings;
                var reason = `Unable to retrieve the data from User Voice (reason: ${data.title}). Please make sure the <a target="_blank" href="${settings.urlToConfigureSettings()}">api key is configured</a> correctly`;
                defer.reject(reason);
            }
        });
        
        return defer.promise;
    }
    
}
