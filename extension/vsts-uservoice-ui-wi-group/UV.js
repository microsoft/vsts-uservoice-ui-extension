define(["require", "exports", "q", "vsts-uservoice-ui-settings-hub/settings"], function (require, exports, Q, Settings) {
    var UserVoiceSuggestion = (function () {
        function UserVoiceSuggestion(id, title, url, votes, status) {
            this.id = id;
            this.title = title;
            this.url = url;
            this.votes = votes;
            this.status = status;
        }
        return UserVoiceSuggestion;
    })();
    exports.UserVoiceSuggestion = UserVoiceSuggestion;
    var Services = (function () {
        function Services(workItemFormService) {
            this.workItemFormService = workItemFormService;
        }
        Services.prototype.linkedUVSuggestions = function () {
            var _this = this;
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
                    var pattern = "http[s]*://" + settings.accountName + ".uservoice.com/forums/.+/suggestions/([0-9]+)";
                    var matches = relation.url.match(pattern);
                    if (matches && matches.length > 1) {
                        return { id: matches[1] };
                    }
                    else {
                        return { id: null };
                    }
                })
                    .filter(function (item) {
                    return item.id !== null;
                })
                    .map(function (item) {
                    return _this._getUserVoiceInfo(settings.accountName, settings.apiKey, item.id);
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
        Services.prototype._getUserVoiceInfo = function (accountName, apiKey, id) {
            var defer = Q.defer();
            $.ajax({
                type: "GET",
                url: "../api/Suggestion/" + id + "?accountName=" + accountName + "&apikey=" + apiKey
            }).done(function (data) {
                if (data.id) {
                    defer.resolve(new UserVoiceSuggestion(data.id, data.title, data.url, data.votes, {
                        name: data.status.name,
                        hex_color: data.status.hex_color
                    }));
                }
                else {
                    var settings = new Settings.Settings;
                    var reason = "Unable to retrieve the data from User Voice (reason: " + data.title + "). Please make sure the <a target=\"_blank\" href=\"" + settings.urlToConfigureSettings() + "\">api key is configured</a> correctly";
                    defer.reject(reason);
                }
            });
            return defer.promise;
        };
        return Services;
    })();
    exports.Services = Services;
});
