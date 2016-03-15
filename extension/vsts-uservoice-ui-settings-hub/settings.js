define(["require", "exports", "q"], function (require, exports, Q) {
    var UVizSettings = (function () {
        function UVizSettings(accountName, apiKey) {
            this.accountName = accountName;
            this.apiKey = apiKey;
        }
        return UVizSettings;
    })();
    exports.UVizSettings = UVizSettings;
    var Settings = (function () {
        function Settings() {
            this.scope = "Default";
            this.accountNameSetting = "accountname";
            this.apiKeySetting = "apikey";
            this.unknownValue = "<unknown>";
            this.accountNameSelector = "#account-name";
            this.apiKeySelector = "#api-key";
            this.saveButtonSelector = "#save-button";
            this.saveResultSelector = "#save-result";
        }
        Settings.prototype.initializeUI = function () {
            var _this = this;
            $(this.saveButtonSelector).on('click', function (eventObject) {
                _this._saveSettings();
            });
            this._populate();
        };
        Settings.prototype.urlToConfigureSettings = function () {
            return VSS.getWebContext().collection.uri + "_admin/_apps/hub/ms-devlabs.vsts-uservoice-ui.vsts-uservoice-ui-settings-hub";
        };
        Settings.prototype.getSettings = function (rejectOnSettingNotAvailable) {
            var _this = this;
            var defer = Q.defer();
            var resetUnknownValue = function (value) { return value === _this.unknownValue ? "" : value; };
            VSS.getService(VSS.ServiceIds.ExtensionData).then(function (dataService) {
                Q.all([
                    dataService.getValue(_this.accountNameSetting, { scopeType: _this.scope, defaultValue: _this.unknownValue }),
                    dataService.getValue(_this.apiKeySetting, { scopeType: _this.scope, defaultValue: _this.unknownValue })
                ]).spread(function (accountName, apiKey) {
                    if (rejectOnSettingNotAvailable && (accountName === _this.unknownValue || apiKey === _this.unknownValue)) {
                        defer.reject("You need to <a target=\"_blank\" href=\"" + _this.urlToConfigureSettings() + "\">configure this extension</a> before you can use it.");
                    }
                    else {
                        defer.resolve(new UVizSettings(resetUnknownValue(accountName), resetUnknownValue(apiKey)));
                    }
                }).fail(function (reason) {
                    defer.reject(reason);
                });
            });
            return defer.promise;
        };
        Settings.prototype._saveSettings = function () {
            var _this = this;
            $(this.saveResultSelector).text("Saving settings...");
            var accountName = $(this.accountNameSelector).val();
            var apiKey = $(this.apiKeySelector).val();
            VSS.getService(VSS.ServiceIds.ExtensionData).then(function (dataService) {
                dataService.setValue(_this.accountNameSetting, accountName, { scopeType: _this.scope }).then(function (value) { });
                dataService.setValue(_this.apiKeySetting, apiKey, { scopeType: _this.scope }).then(function (value) { });
                $(_this.saveResultSelector).text("The settings are saved.");
                setTimeout(function () { $(_this.saveResultSelector).text(""); }, 2000);
            });
        };
        Settings.prototype._populate = function () {
            var _this = this;
            this.getSettings(false).done(function (settings) {
                $(_this.accountNameSelector).val(settings.accountName).prop("disabled", false);
                $(_this.apiKeySelector).val(settings.apiKey).prop("disabled", false);
                $(_this.saveResultSelector).text("");
                $(_this.saveButtonSelector).prop("disabled", false);
            });
        };
        return Settings;
    })();
    exports.Settings = Settings;
});
