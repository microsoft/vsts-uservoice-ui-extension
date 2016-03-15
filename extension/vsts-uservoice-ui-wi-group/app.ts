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
            }
        }
    });
    
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