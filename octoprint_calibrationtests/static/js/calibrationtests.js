$('#testSelector').on('change', function () {
    //console.log(this.value)
    Array.from($(".calibration-test")).forEach(element => {
        if (element.id == this.value)
        {
            $('#'+element.id).show();
        }
        else
        {
            $('#'+element.id).hide();
        }
    });
});


$(function() {
	function GeneralSettingsViewModel(parameters) {
		var self = this;
		self.settings = parameters[0];

		self.isDirty = ko.observable(false);
		self.saveSettings = function() {
			// Save them
			OctoPrint.settings.savePluginSettings("calibrationtests", 
				{
					confirmAllGcode: self.settings.settings.plugins.calibrationtests.confirmAllGcode(),
					hotEndTemp: self.settings.settings.plugins.calibrationtests.hotEndTemp(),
				}, null);
			self.isDirty(false);
		};	
		self.resetSettings = function() {
			alert("TODO")
		}

		self.onBeforeBinding = function() {
			// TODO: This shouldn't update unless the settings are changed from here. I.e. if the user changes a setting in a different dialog, then this button shouldn't become active.
			// Add a layer of indirection here?
			self.settings.settings.plugins.calibrationtests.confirmAllGcode.subscribe(function () {
				self.isDirty(true);
			});
			self.settings.settings.plugins.calibrationtests.hotEndTemp.subscribe(function () {
				self.isDirty(true);
			});
		}
	}

	// This is how our plugin registers itself with the application, by adding some configuration
	// information to the global variable OCTOPRINT_VIEWMODELS
	OCTOPRINT_VIEWMODELS.push({
		// This is the constructor to call for instantiating the plugin
		construct: GeneralSettingsViewModel,

		// This is a list of dependencies to inject into the plugin, the order which you request
		// here is the order in which the dependencies will be injected into your view model upon
		// instantiation via the parameters argument
		dependencies: ["settingsViewModel"],

		// Finally, this is the list of selectors for all elements we want this view model to be bound to.
		elements: ["#general_configuration"]
	});
});
