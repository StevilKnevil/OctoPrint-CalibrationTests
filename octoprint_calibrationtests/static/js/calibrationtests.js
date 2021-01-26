$(function() {
    function CalibrationTestsViewModel(parameters) {
        var self = this;

        self.settings = parameters[0];

        // this will hold the URL currently displayed by the iframe
        self.currentUrl = ko.observable();

        // this will hold the URL entered in the text field
        self.newUrl = ko.observable();

        // this will be called when the user clicks the "Go" button and set the iframe's URL to
        // the entered URL
        self.goToUrl = function() {
            self.currentUrl(self.newUrl());
        };

        self.test = function() {
            $.ajax({
                url:         "/api/printer",
                type:        "GET",
                contentType: "application/json",
                dataType:    "json",
//                headers:     {"X-Api-Key": UI_API_KEY},
//                data:        JSON.stringify({"command": "git", "arg1": "pull"}),
                success: function (result) {
                    log.info(result.state.flags.ready);
                },
                error: function() {
                    log.error("Error getting status of printer");
                }
            });
        };

        // This will get called before the CalibrationTestsViewModel gets bound to the DOM, but after its
        // dependencies have already been initialized. It is especially guaranteed that this method
        // gets called _after_ the settings have been retrieved from the OctoPrint backend and thus
        // the SettingsViewModel been properly populated.
        self.onBeforeBinding = function() {
            self.newUrl(self.settings.settings.plugins.calibrationtests.url());
            self.goToUrl();
        }
    }

    // This is how our plugin registers itself with the application, by adding some configuration
    // information to the global variable OCTOPRINT_VIEWMODELS
    OCTOPRINT_VIEWMODELS.push([
        // This is the constructor to call for instantiating the plugin
        CalibrationTestsViewModel,

        // This is a list of dependencies to inject into the plugin, the order which you request
        // here is the order in which the dependencies will be injected into your view model upon
        // instantiation via the parameters argument
        ["settingsViewModel"],

        // Finally, this is the list of selectors for all elements we want this view model to be bound to.
        ["#tab_plugin_calibrationtests"]
    ]);
});
