define(["require", "exports", "TFS/WorkItemTracking/Services", "vsts-uservoice-ui-wi-group/UV", "vsts-uservoice-ui-settings-hub/settings"], function (require, exports, WitServices, UV, Settings) {
    "use strict";
    VSS.register("vsts-uservoice-ui-wi-group", function () {
        return {
            onLoaded: function (args) {
                render();
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
                }
            }
        };
    });
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
        WitServices.WorkItemFormService.getService().then(function (service) {
            var UVServices = new UV.Services(service);
            UVServices.linkedUVSuggestions()
                .then(function (linkedUVSuggestions) {
                linkedUVSuggestions = linkedUVSuggestions.sort(function (a, b) { return b.votes - a.votes; });
                $("#items").empty().append("<table/>");
                $.each(linkedUVSuggestions.slice(0, 2), function (idx, UVSuggestion) {
                    $("#items table").append($("<tr class=\"suggestion\"/>").html("<td class=\"votes-status\">\n                                <div class=\"votes\">" + formatNumber(UVSuggestion.votes) + "</div>\n                                <div class=\"status\" style=\"background-color: " + (UVSuggestion.status.hex_color || "rgb(207, 215, 230)") + "\">" + (UVSuggestion.status.name || "no state") + "</div>\n                            </td>\n                            <td class=\"title\"><a target=\"_blank\" href=\"" + UVSuggestion.url + "\">" + UVSuggestion.title + "</a></td>\n                            "));
                });
                if (linkedUVSuggestions.length === 0) {
                    var settings = new Settings.Settings();
                    settings.getSettings(true).then(function (settings) {
                        $("#items").empty().append($("<span class=\"no-linked-suggestions\" />").html("No suggestions linked to this work item. Find some in <a target=\"_blank\" href=\"http://" + settings.accountName + ".uservoice.com\">your User Voice forum</a>"));
                    });
                }
                if (linkedUVSuggestions.length > 2) {
                    $("#items").append($("<div />").html((linkedUVSuggestions.length - 2) + " more suggestion" + (linkedUVSuggestions.length === 3 ? "" : "s") + " linked"));
                }
            })
                .fail(function (reason) {
                $("#items").empty();
                $("#items").append($("<div/>").html(reason ? reason.toString() : "Unknown error"));
            });
        });
    }
    function formatNumber(value) {
        var stringValue = value.toFixed(0);
        var rgx = /(\d+)(\d{3})/;
        while (rgx.test(stringValue)) {
            stringValue = stringValue.replace(rgx, '$1' + ',' + '$2');
        }
        return stringValue;
    }
});
