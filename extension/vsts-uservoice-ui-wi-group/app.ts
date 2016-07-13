/// <reference path='../typings/tsd.d.ts' />

import WitServices = require("TFS/WorkItemTracking/Services");
import UV = require("vsts-uservoice-ui-wi-group/UV");
import Settings = require("vsts-uservoice-ui-settings-hub/settings");

    // Register a listener for the work item group contribution.
    VSS.register("vsts-uservoice-ui-wi-group", function () {
        return {
            // Called when a new work item is being loaded in the UI
            onLoaded: function (args) {
                render();                
            },

            // Called after the work item has been saved
            onSaved: function (args) {
                render();                
            },

            // Called when the work item is reset to its unmodified state (undo)
            onReset: function (args) {
                render();                
            },

            // Called when the work item has been refreshed from the server
            onRefreshed: function (args) {
                render();                
            },

            // Called when a field is changed on the work item
            onFieldChanged: function (args) {
                // When adding a link
                if (args.changedFields["System.LinkedFiles"] === "") {
                    // add the defined tag when one of the links is a user voice suggestion
                    addTag();
                }
            }
        }
    });

    /**
     * Adds the tag as specified in the settings to the current work item. If no tag is configured, nothing happens. 
     */
    function addTag() {
        var settings = new Settings.Settings();

        WitServices.WorkItemFormService.getService().then(wi => {
            var UVServices = new UV.Services(wi);
            UVServices.linkedUVSuggestions().then(linkedUVSuggestions => {
                // when there are linked user voice suggestions
                if (linkedUVSuggestions.length > 0) {
                    settings.getSettings(false).done((settings: Settings.UVizSettings) => { 
                        // when the tag is specified in the settings
                        if (settings.tag) {
                            // get the current value of the tags which gives back the list of tags in a ;-separated string
                            (<IPromise<string>>wi.getFieldValue("System.Tags")).then(tagString => {
                                // convert the string into an array
                                let tags = tagString
                                    .split(";")
                                    .map(t => t.trim())
                                    .filter(t => !!t);
                                
                                // add the tag as specified in the settings to the array when it doesn't exist yet and convert it into a ;-separated list again
                                // and finally add the tags to the work item
                                if (tags.indexOf(settings.tag) === -1) {                                    
                                    wi.setFieldValue("System.Tags", 
                                        tags.concat([settings.tag])
                                            .join(";"));
                                }
                            });
                        }
                    })
                }        
            })
        })        
    }

    function render() {
        WitServices.WorkItemFormService.getService().then(service => {

            var UVServices = new UV.Services(service);
            
            UVServices.linkedUVSuggestions()
                .then(linkedUVSuggestions => {
                    
                    // sort the suggestion descending by its votes
                    linkedUVSuggestions = linkedUVSuggestions.sort((a: UV.UserVoiceSuggestion, b: UV.UserVoiceSuggestion): number => { return b.votes - a.votes})
                    
                    // remove all existing items and start a table
                    $("#items").empty().append("<table/>");

                    // show the 2 user voice items with the most votes
                    $.each(linkedUVSuggestions.slice(0, 2), (idx: number, UVSuggestion: UV.UserVoiceSuggestion) => {
                        $("#items table").append($(`<tr class="suggestion"/>`).html(
                            `<td class="votes-status">
                                <div class="votes">${formatNumber(UVSuggestion.votes)}</div>
                                <div class="status" style="background-color: ${UVSuggestion.status.hex_color || "rgb(207, 215, 230)"}">${UVSuggestion.status.name || "no state"}</div>
                            </td>
                            <td class="title"><a target="_blank" href="${UVSuggestion.url}">${UVSuggestion.title}</a></td>
                            `));
                    });

                    // when there are no items linked provide a help text
                    if (linkedUVSuggestions.length === 0) {
                        var settings = new Settings.Settings();
                        settings.getSettings(true).then((settings: Settings.UVizSettings) => {
                            $("#items").empty().append($(`<span class="no-linked-suggestions" />`).html(`No suggestions linked to this work item. Find some in <a target="_blank" href="http://${settings.accountName}.uservoice.com">your User Voice forum</a>`));
                        });
                    }
                    
                    // when there are more than 2 items, add a text to indicate there are more
                    if (linkedUVSuggestions.length > 2) {
                        $("#items").append($("<div />").html(`${linkedUVSuggestions.length - 2} more suggestion${linkedUVSuggestions.length === 3 ? "" : "s"} linked`))
                    }
                })
                .fail((reason: any): void => {

                    // remove all existing items
                    $("#items").empty();
                    $("#items").append($("<div/>").html(reason ? reason.toString() : "Unknown error"));
                    
                });
        });
    }
    
    function formatNumber(value: number): string {
        var stringValue = value.toFixed(0);
        var rgx = /(\d+)(\d{3})/;
        while (rgx.test(stringValue)) {
            stringValue = stringValue.replace(rgx, '$1' + ',' + '$2');
        }
        return stringValue;
    }    