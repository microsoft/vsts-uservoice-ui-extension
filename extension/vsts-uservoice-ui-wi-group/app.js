define(["require", "exports", "TFS/WorkItemTracking/Services", "vsts-uservoice-ui-wi-group/UV", "vsts-uservoice-ui-settings-hub/settings", "VSS/Controls", "VSS/Controls/StatusIndicator"], function (require, exports, WitServices, UV, Settings, Controls, StatusIndicator) {
    "use strict";
    VSS.register("vsts-uservoice-ui-wi-group", function () {
        return {
            onLoaded: function (args) {
                render();
                $("#add-item-id").keypress(function (e) {
                    var key = e.which;
                    if (key === 13) {
                        var suggestionIdOrUrl = $("#add-item-id").val();
                        addUserVoiceSuggestion(suggestionIdOrUrl);
                    }
                });
            },
            onSaved: function (args) {
                render();
            },
            onReset: function (args) {
                render();
            },
            onRefreshed: function (args) {
                render();
            },
            onFieldChanged: function (args) {
                if (args.changedFields["System.LinkedFiles"] === "") {
                    addTag();
                    render();
                }
            }
        };
    });
    function addUserVoiceSuggestion(idOrUrl) {
        var waitcontrol = startWaitControl();
        var returnInvalidId = function (reason, clearValue) {
            $("#invalid-item-id").text(reason).show();
            setTimeout(function () {
                $("#invalid-item-id").hide();
            }, 2000);
            if (clearValue) {
                $("#add-item-id").val("");
            }
            endWaitControl(waitcontrol);
        };
        var addLink = function (suggestion) {
            WitServices.WorkItemFormService.getService().then(function (wi) {
                wi.getWorkItemRelations().then(function (relations) {
                    var linkExists = relations.some(function (relation) {
                        return relation.url === suggestion.url;
                    });
                    if (!linkExists) {
                        wi.addWorkItemRelations([
                            {
                                attributes: {
                                    key: suggestion.title
                                },
                                rel: "Hyperlink",
                                title: undefined,
                                url: suggestion.url
                            }]);
                        $("#invalid-item-id").hide();
                        $("#add-item-id").val("");
                        endWaitControl(waitcontrol);
                    }
                    else {
                        returnInvalidId("User Voice suggestion is already linked", true);
                    }
                });
            });
        };
        var id = parseInt(idOrUrl) || UV.Services.extractIdFromUrl(idOrUrl).id;
        if (!id) {
            returnInvalidId("ID is not a number or a valid URL", false);
        }
        else {
            var UVServices = new UV.Services();
            UVServices.idExists(id.toString()).done(function (suggestion) {
                if (suggestion) {
                    addLink(suggestion);
                }
                else {
                    returnInvalidId("Not a valid User Voice item ID", false);
                }
            }, function (reason) {
                returnInvalidId(reason ? reason.toString() : "Unknown error", false);
            });
        }
    }
    function addTag() {
        var settings = new Settings.Settings();
        WitServices.WorkItemFormService.getService().then(function (wi) {
            var UVServices = new UV.Services(wi);
            UVServices.linkedUVSuggestions().then(function (linkedUVSuggestions) {
                if (linkedUVSuggestions.length > 0) {
                    settings.getSettings(false).done(function (settings) {
                        if (settings.tag) {
                            wi.getFieldValue("System.Tags").then(function (tagString) {
                                var tags = tagString
                                    .split(";")
                                    .map(function (t) { return t.trim(); })
                                    .filter(function (t) { return !!t; });
                                if (tags.indexOf(settings.tag) === -1) {
                                    wi.setFieldValue("System.Tags", tags.concat([settings.tag])
                                        .join(";"));
                                }
                            });
                        }
                    });
                }
            });
        });
    }
    function render() {
        var waitcontrol = startWaitControl();
        WitServices.WorkItemFormService.getService().then(function (service) {
            var UVServices = new UV.Services(service);
            UVServices.linkedUVSuggestions()
                .then(function (linkedUVSuggestions) {
                if (linkedUVSuggestions.length === 0) {
                    var settings = new Settings.Settings();
                    settings.getSettings(true).then(function (settings) {
                        $("#items").empty();
                        $("#message").empty().append($("\n                            <span class=\"no-linked-suggestions\" />").html("\n                                <p>\n                                    No suggestions linked to this work item. Find some in <a target=\"_blank\" href=\"http://" + settings.accountName + ".uservoice.com\">your User Voice forum</a>. \n                                </p>"));
                    });
                }
                else {
                    $("#message").empty();
                    $("#items").empty().append("<table/>");
                    linkedUVSuggestions = linkedUVSuggestions.sort(function (a, b) { return b.votes - a.votes; });
                    $.each(linkedUVSuggestions, function (idx, UVSuggestion) {
                        $("#items table").append($("<tr class=\"suggestion\"/>").html("<td class=\"votes-status\">\n                                        <div class=\"votes\">\n                                            " + formatNumber(UVSuggestion.votes) + "\n                                        </div>\n                                        <div \n                                                class=\"status\" \n                                                style=\"background-color: " + (UVSuggestion.status.hex_color || "rgb(207, 215, 230)") + "\" \n                                                " + (UVSuggestion.response ? "title=\"" + UVSuggestion.response_date + "&#013;-----------------&#013;&#013;" + UVSuggestion.response + "\"" : "") + ">\n                                            " + (UVSuggestion.status.name || "no state") + "\n                                        </div>\n                                    </td>\n                                    <td class=\"title-cell\">\n                                        <a class=\"title\" target=\"_blank\" href=\"" + UVSuggestion.url + "\" title=\"" + UVSuggestion.description + "\">\n                                            " + UVSuggestion.title + "\n                                        </a>\n                                        " + (UVSuggestion.total_comments === 0
                            ? ""
                            : " <div class=\"comments\" title=\"" + renderComments(UVSuggestion) + "\">\n                                                    <span class=\"bowtie-icon bowtie-comment-discussion\"></span>\n                                                    <div class=\"commentcount\">\n                                                        <span>" + UVSuggestion.total_comments + "</span>\n                                                </div>") + "\n                                    </td>"));
                    });
                    var newHeight = $("#add-item").height() + $("#message").height();
                    $("#items table td").each(function (idx, elt) {
                        newHeight += $(elt).height();
                    });
                    VSS.resize(null, newHeight);
                }
            })
                .fail(function (reason) {
                $("#items").empty().append($("<div style='color:red'/>").html(reason ? reason.toString() : "Unknown error"));
            })
                .finally(function () {
                endWaitControl(waitcontrol);
            });
        });
    }
    function renderComments(UVSuggestion) {
        if (UVSuggestion.total_comments === 0) {
            return "";
        }
        else {
            var ret = "";
            for (var i = 0; i < UVSuggestion.most_recent_comments.length; i++) {
                if (i > 0) {
                    ret += "&#013;&#013";
                }
                ret += ("" + UVSuggestion.most_recent_comments[i].created_by) +
                    (" (" + UVSuggestion.most_recent_comments[i].created_at + ")") +
                    (": " + UVSuggestion.most_recent_comments[i].text);
            }
            return ret;
        }
    }
    function formatNumber(value) {
        var stringValue = value.toFixed(0);
        var rgx = /(\d+)(\d{3})/;
        while (rgx.test(stringValue)) {
            stringValue = stringValue.replace(rgx, '$1' + ',' + '$2');
        }
        return stringValue;
    }
    function startWaitControl() {
        var isAlreadyRunning = $("#waitcontrol").attr("running") === "true";
        if (isAlreadyRunning) {
            return null;
        }
        else {
            var waitControlOptions = {
                target: $("#container"),
                message: "Reaching out to UserVoice.com...",
                backgroundColor: "transparent"
            };
            var waitcontrol = Controls.create(StatusIndicator.WaitControl, $("#container"), waitControlOptions);
            waitcontrol.startWait();
            $("#waitcontrol").attr("running", "true");
            return waitcontrol;
        }
    }
    function endWaitControl(waitcontrol) {
        if (waitcontrol) {
            waitcontrol.endWait();
            $("#waitcontrol").attr("running", "false");
        }
    }
});
