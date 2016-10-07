define(["require", "exports", "q", "vsts-uservoice-ui-settings-hub/settings"], function (require, exports, Q, Settings) {
    "use strict";
    var UserVoiceSuggestion = (function () {
        function UserVoiceSuggestion(id, title, description, description_html, url, votes, status, response, response_html, response_date, total_comments, most_recent_comments) {
            this.id = id;
            this.title = title;
            this.description = description;
            this.description_html = description_html;
            this.url = url;
            this.votes = votes;
            this.status = status;
            this.response = response;
            this.response_html = response_html;
            this.response_date = response_date;
            this.total_comments = total_comments;
            this.most_recent_comments = most_recent_comments;
        }
        return UserVoiceSuggestion;
    }());
    exports.UserVoiceSuggestion = UserVoiceSuggestion;
    var UserVoiceComment = (function () {
        function UserVoiceComment(created_by, created_at, text, html) {
            this.created_by = created_by;
            this.created_at = created_at;
            this.text = text;
            this.html = html;
        }
        return UserVoiceComment;
    }());
    exports.UserVoiceComment = UserVoiceComment;
    var Services = (function () {
        function Services(workItemFormService) {
            this.workItemFormService = workItemFormService;
        }
        Services.prototype.linkedUVSuggestions = function () {
            var self = this;
            var defer = Q.defer();
            var settings = new Settings.Settings();
            var q = Q.all([
                settings.getSettings(true),
                this.workItemFormService.getWorkItemRelations()
            ])
                .spread(function (settings, relations) {
                var userVoiceItems = relations
                    .map(function (relation) {
                    return Services.extractIdFromUrl(relation.url);
                })
                    .filter(function (item) {
                    return item.id !== null;
                })
                    .map(function (item) {
                    return self._getUserVoiceInfo(settings.accountName, settings.apiKey, item.id);
                });
                Q.all(userVoiceItems).then(function (suggestions) {
                    defer.resolve(suggestions);
                }).fail(function (reason) {
                    defer.reject(reason);
                });
            })
                .fail(function (reason) {
                defer.reject(reason);
            });
            return defer.promise;
        };
        Services.extractIdFromUrl = function (url) {
            var pattern = "/forums/[0-9]+.*/suggestions/([0-9]+)|/admin/v[23]/suggestions/([0-9]+)";
            var matches = url.match(pattern);
            if (matches && matches.length > 2) {
                return { id: matches[1] || matches[2] };
            }
            else {
                return { id: null };
            }
        };
        Services.prototype.idExists = function (id) {
            var self = this;
            var defer = Q.defer();
            var settings = new Settings.Settings();
            var q = Q.all([
                settings.getSettings(true)
            ])
                .spread(function (settings) {
                self._getUserVoiceInfo(settings.accountName, settings.apiKey, id)
                    .done(function (suggestion) { defer.resolve(suggestion); }, function () { defer.resolve(null); });
            })
                .fail(function (reason) {
                defer.reject(reason);
            });
            return defer.promise;
        };
        Services.prototype._getUserVoiceInfo = function (accountName, apiKey, id) {
            var defer = Q.defer();
            $.ajax({
                type: "GET",
                url: "../api/Suggestion/" + id + "?accountName=" + accountName + "&apikey=" + apiKey
            }).done(function (data) {
                if (!data.url) {
                    defer.reject("item is not found");
                }
                else if (data.id) {
                    defer.resolve(new UserVoiceSuggestion(data.id, data.title, data.description, data.description_html, data.url, data.votes, {
                        name: data.status.name,
                        hex_color: data.status.hex_color
                    }, data.response, data.response_html, data.response_date, data.total_comments, data.most_recent_comments));
                }
                else {
                    var settings = new Settings.Settings;
                    var reason = "Unable to retrieve the data from User Voice (reason: " + data.title + "). Please make sure the <a target=\"_blank\" href=\"" + settings.urlToConfigureSettings() + "\">api key is configured</a> correctly";
                    defer.reject(reason);
                }
            }).fail(function (error) {
                defer.reject(error.responseText);
            });
            return defer.promise;
        };
        return Services;
    }());
    exports.Services = Services;
});
