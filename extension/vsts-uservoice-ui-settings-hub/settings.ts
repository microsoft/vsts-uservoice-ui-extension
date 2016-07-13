/// <reference path='../typings/tsd.d.ts' />

import Extension_Data = require("VSS/SDK/Services/ExtensionData");
import Q = require("q");

export class UVizSettings {
    
    constructor(
        public accountName: string, 
        public apiKey: string,
        public tag: string
    ) { }

}
    
export class Settings {

    private scope = "Default"; // can either be User or Default 
    private accountNameSetting = "accountname";
    private apiKeySetting = "apikey";
    private tagSetting = "tag";
    private unknownValue = "<unknown>";
    private accountNameSelector = "#account-name";
    private apiKeySelector = "#api-key";
    private tagSelector = "#tag";
    private saveButtonSelector = "#save-button";
    private saveResultSelector = "#save-result";
    
    /**
     * Register the eventhandler for the save button and populate the input controls
     * with the previously stored settings
     */
    public initializeUI(): void {
        // register the event handler for the Save button
        $(this.saveButtonSelector).on('click', (eventObject) => {
            this._saveSettings();
        });
        
        // populate the input controls when the page loads
        this._populate();
    }
    
    public urlToConfigureSettings(): string {
        return `${VSS.getWebContext().collection.uri}_admin/_apps/hub/ms-devlabs.vsts-uservoice-ui.vsts-uservoice-ui-settings-hub`;
    }
    
    /**
     * Get the retrieval of the settings started and return the promise.
     * 
     * @rejectOnSettingNotAvailable: when true, the promise is rejected when the setting is not configured yet. Else just give back the value. 
     */        
    public getSettings(rejectOnSettingNotAvailable: boolean): Q.Promise<UVizSettings> {
        var defer = Q.defer<UVizSettings>();

        // function that return the empty string when the setting wasn't set yet        
        var resetUnknownValue = (value: string): string => {return value === this.unknownValue ? "" : value}
        
        VSS.getService(VSS.ServiceIds.ExtensionData).then((dataService: Extension_Data.ExtensionDataService) => {
            
            // get the value of both settings, and when the value for the setting isn't set yet, then return the default value which is <unknown> 
            Q.all([
                dataService.getValue<string>(this.accountNameSetting, {scopeType: this.scope, defaultValue: this.unknownValue}),
                dataService.getValue<string>(this.apiKeySetting, {scopeType: this.scope, defaultValue: this.unknownValue}),
                dataService.getValue<string>(this.tagSetting, {scopeType: this.scope, defaultValue: ""})
            ]).spread((accountName: string, apiKey: string, tag: string) => {
                
                // when the caller wants to reject the promise when the setting is not configured yet (which is the contribution on the work item form)
                if (rejectOnSettingNotAvailable && (accountName === this.unknownValue || apiKey === this.unknownValue)) {
                    
                    // then reject the promise and provide actionable information, to navigate to the admin page to configure the settings
                    defer.reject(`You need to <a target="_blank" href="${this.urlToConfigureSettings()}">configure this extension</a> before you can use it.`)
                    
                } else {
                    
                    // if either the caller wants to get settings even when it doesn't exist yet (which is the admin page to configure the 
                    // settings), or when the settings are successfully retrieved, resolve the promise
                    defer.resolve(new UVizSettings(resetUnknownValue(accountName), resetUnknownValue(apiKey), tag));
                }
            }).fail((reason: any): void => {
                defer.reject(reason);
            });
        });
        
        return defer.promise;
    }

    /**
     * Save the settings in the data storage
     */
    private _saveSettings() {
        
        // give the user feedback the settings are being saved
        $(this.saveResultSelector).text("Saving settings...");

        // get the value of the input controls
        const accountName = $(this.accountNameSelector).val();
        const apiKey = $(this.apiKeySelector).val();
        const tag = $(this.tagSelector).val();
        
        // store the values
        VSS.getService(VSS.ServiceIds.ExtensionData).then((dataService: Extension_Data.ExtensionDataService) => {  
            dataService.setValue(this.accountNameSetting, accountName, {scopeType: this.scope}).then((value: string) => {});
            dataService.setValue(this.apiKeySetting, apiKey, {scopeType: this.scope}).then((value: string) => {});
            dataService.setValue(this.tagSetting, tag, {scopeType: this.scope}).then((value: string) => {});
            
            $(this.saveResultSelector).text("The settings are saved.");
            setTimeout(() => {$(this.saveResultSelector).text(""); }, 2000);
        });
    }

    /**
     * Get the settings from the data storage. When the settings are retrieved, populate the
     * input controls and enable them as well as the save button 
     */
    private _populate() {
        // retrieve the settings async, and when retrieved ...
        this.getSettings(false).done((settings: UVizSettings) => {

            // ... then set the values and enable the inputs ... 
            $(this.accountNameSelector).val(settings.accountName).prop("disabled", false);
            $(this.apiKeySelector).val(settings.apiKey).prop("disabled", false);
            $(this.tagSelector).val(settings.tag).prop("disabled", false);
            
            // ... and enable the save button
            $(this.saveResultSelector).text("");
            $(this.saveButtonSelector).prop("disabled", false);
        });
    }
}