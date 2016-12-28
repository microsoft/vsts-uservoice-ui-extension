/// <reference path='../typings/tsd.d.ts' />

import WitServices = require("TFS/WorkItemTracking/Services");
import WitContracts = require("TFS/WorkItemTracking/Contracts");
import UV = require("vsts-uservoice-ui-wi-group/UV");
import Settings = require("vsts-uservoice-ui-settings-hub/settings");
import Controls = require("VSS/Controls");
import StatusIndicator = require("VSS/Controls/StatusIndicator");

    // Register a listener for the work item group contribution.
    VSS.register("vsts-uservoice-ui-wi-group", function () {
        return {
            // Called when a new work item is being loaded in the UI
            onLoaded: function (args) {
                render();

                // Register the event to add a link to the entered the User Voice item ID
                // when hitting {Enter}
                $("#add-item-id").keypress((e) => {
                    
                    // when it is the Enter key
                    var key = e.which;
                    if (key === 13) {

                        // read the value from the input control
                        var suggestionIdOrUrl = $("#add-item-id").val();

                        // set the flag to indicate the form should not render on every
                        // link that is added. We will render the changes explicitly
                        addingIds = true;

                        // verify the input and add the link
                        addUserVoiceSuggestion(suggestionIdOrUrl)

                        // reset the flag so any link that is added to the work item will
                        // result in a rerender of the control
                        addingIds = false;

                        // add the UserVoice tag and render the control to reflect the changes
                        addTag();
                        render();
                    }
                })
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
                if (!addingIds && args.changedFields["System.LinkedFiles"] === "") {
                    // add the defined tag when one of the links is a user voice suggestion
                    addTag();
                    render();
                }
            }
        }
    });

    /**
     * Adds a link to the work item based on the ID of the User Voice item entered through the add-item input 
     */
    function addUserVoiceSuggestion(idOrUrls: string): void {
        var waitcontrol = startWaitControl();

        // function to show something went wrong, and return false
        var returnInvalidId = (reason: string, clearValue: boolean) => {
            
            // show the error message
            $("#invalid-item-id").text(reason).show();
            
            // hide the message after 2 seconds
            setTimeout(() =>  {
                $("#invalid-item-id").hide();
            }, 2000);

            // when the link was added succesfully, clear the input control
            if (clearValue) {
                $("#add-item-id").val("");
            }

            endWaitControl(waitcontrol);
        }

        // function to add the UV suggestion as a link
        var addLink = (suggestion: UV.UserVoiceSuggestion) => {
            WitServices.WorkItemFormService.getService().then((wi: WitServices.IWorkItemFormService) => {
                
                // get the relations of the work item 
                wi.getWorkItemRelations().then((relations: WitContracts.WorkItemRelation[]) => {
                    
                    // don't add the link if it already exists
                    var linkExists = relations.some((relation: WitContracts.WorkItemRelation) => {
                        return relation.url === suggestion.url;
                    });
                    
                    if (!linkExists) {

                        // Add a hyperlink work item link
                        wi.addWorkItemRelations([
                            {
                                attributes: {
                                    key: suggestion.title // the comment of the work item link
                                },
                                rel: "Hyperlink", // valid values are: 'Hyperlink', 'ArtifactLink' (e.g. git commit), any valid linktype name (e.g. 'Child', 'Parent')
                                title: undefined, // the title is ignored for work item links 
                                url: suggestion.url // the url for the Hyperlink, git commit, or work item
                            }]);

                        // the link has been added succesfully, hide any error message and clear the input control   
                        $("#invalid-item-id").hide();
                        $("#add-item-id").val("");

                        endWaitControl(waitcontrol);
                    } else {

                        returnInvalidId("User Voice suggestion is already linked", true);

                    }
                    
                });
            });
        }

        // when the idOrUrl is a valid number (parseInt), then use it. Else try to 
        // extract the id from the url.
        $.each(idOrUrls.split(","), (idx:number, idOrUrl: string) => {
            var id = parseInt(idOrUrl) || UV.Services.extractIdFromUrl(idOrUrl).id;

            if (!id) {
                returnInvalidId("ID is not a number or a valid URL", false);
            } else {
                var UVServices = new UV.Services();
                UVServices.idExists(id.toString()).done(
                    (suggestion: UV.UserVoiceSuggestion) => {
                        if (suggestion) {
                            // when the id is a valid User Voice ID, then hide the error 
                            // text, add the link and indicate it was succesful to clear 
                            // the value from the input
                            addLink(suggestion);
                        } else {
                            // Not a valid User Voice ID
                            returnInvalidId("Not a valid User Voice item ID", false);
                        } 
                    },
                    (reason: string) => {
                        // Something went wrong
                        returnInvalidId(reason ? reason.toString() : "Unknown error", false);
                    } 
                ); 
            }
        });
    }

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

    var addingIds: boolean = false;

    function render() {
        var waitcontrol = startWaitControl();

        WitServices.WorkItemFormService.getService().then(service => {

            var UVServices = new UV.Services(service);
            
            UVServices.linkedUVSuggestions()
                .then(linkedUVSuggestions => {
                    
                    // when there are no items linked provide a help text
                    if (linkedUVSuggestions.length === 0) {
                        var settings = new Settings.Settings();
                        settings.getSettings(true).then((settings: Settings.UVizSettings) => {
                            $("#items").empty();
                            $("#message").empty().append($(`
                            <span class="no-linked-suggestions" />`).html(`
                                <p>
                                    No suggestions linked to this work item. Find some in <a target="_blank" href="http://${settings.accountName}.uservoice.com">your User Voice forum</a>. 
                                </p>`));
                        });
                    } else {

                        $("#message").empty();
                        // start a table
                        $("#items").empty().append("<table/>");
                   
                        // sort the suggestion descending by its votes
                        linkedUVSuggestions = linkedUVSuggestions.sort((a: UV.UserVoiceSuggestion, b: UV.UserVoiceSuggestion): number => { return b.votes - a.votes})
                        
                        // show all user voice items sorted by most votes
                        $.each(linkedUVSuggestions, (idx: number, UVSuggestion: UV.UserVoiceSuggestion) => {
                            $("#items table").append(
                                $(`<tr class="suggestion"/>`).html(
                                    `<td class="votes-status">
                                        <div class="votes">
                                            ${formatNumber(UVSuggestion.votes)}
                                        </div>
                                        <div 
                                                class="status" 
                                                style="background-color: ${UVSuggestion.status.hex_color || "rgb(207, 215, 230)"}" 
                                                ${UVSuggestion.response ? `title="${UVSuggestion.response_date}&#013;-----------------&#013;&#013;${UVSuggestion.response}"` : ""}>
                                            ${UVSuggestion.status.name || "no state"}
                                        </div>
                                    </td>
                                    <td class="title-cell">
                                        <a class="title" target="_blank" href="${UVSuggestion.url}" title="${UVSuggestion.description}">
                                            ${UVSuggestion.title}
                                        </a>
                                        ${UVSuggestion.total_comments === 0
                                            ? "" 
                                            : ` <div class="comments" title="${renderComments(UVSuggestion)}">
                                                    <span class="bowtie-icon bowtie-comment-discussion"></span>
                                                    <div class="commentcount">
                                                        <span>${UVSuggestion.total_comments}</span>
                                                </div>`
                                        }
                                    </td>`
                                )
                            );
                        });

                        var newHeight = $("#add-item").height() + $("#message").height(); 
                        $("#items table td").each((idx: number, elt: Element) => {
                            newHeight += $(elt).height();
                        });
                        // resize the control to fit the contents
                        VSS.resize(null, newHeight);
                    }
                })
                .fail((reason: any): void => {

                    // remove all existing items and show error
                    $("#items").empty().append($("<div style='color:red'/>").html(reason ? reason.toString() : "Unknown error"));
                    
                })
                .finally(() => {
                    endWaitControl(waitcontrol);
                });
                
        });
    }

    function renderComments(UVSuggestion: UV.UserVoiceSuggestion): string {
        if (UVSuggestion.total_comments === 0) {
            return "";
        } else {
            var ret: string = ``;
            
            for (var i = 0; i < UVSuggestion.most_recent_comments.length; i++ ){
                if (i > 0) {
                    ret += "&#013;&#013";
                } 
                ret += `${UVSuggestion.most_recent_comments[i].created_by}` +
                    ` (${UVSuggestion.most_recent_comments[i].created_at})` +
                    `: ${UVSuggestion.most_recent_comments[i].text}`
            }

            return ret;
        }
    }
    
    function formatNumber(value: number): string {
        var stringValue = value.toFixed(0);
        var rgx = /(\d+)(\d{3})/;
        while (rgx.test(stringValue)) {
            stringValue = stringValue.replace(rgx, '$1' + ',' + '$2');
        }
        return stringValue;
    }    

    /**
     * Starts the wait control. When there is already a wait control running, null is returned
     */
    function startWaitControl(): StatusIndicator.WaitControl {
        var isAlreadyRunning = $("#waitcontrol").attr("running") === "true";

        if (isAlreadyRunning) {
            return null;
        } else {
            // create and start the wait control
            var waitControlOptions: StatusIndicator.IWaitControlOptions = {
                target: $("#container"),
                message: "Reaching out to UserVoice.com...",
                backgroundColor: "transparent"
            };
            var waitcontrol = Controls.create<StatusIndicator.WaitControl, StatusIndicator.IWaitControlOptions>(StatusIndicator.WaitControl, $("#container"), waitControlOptions);
            waitcontrol.startWait();

            // indicate the wait control is running
            $("#waitcontrol").attr("running", "true")

            return waitcontrol;
        }
    }

    /**
     * Ends the wait control.
     */
    function endWaitControl(waitcontrol: StatusIndicator.WaitControl) {
        if (waitcontrol) {
            waitcontrol.endWait();

            // indicate the wait control is running
            $("#waitcontrol").attr("running", "false");
        }
    }