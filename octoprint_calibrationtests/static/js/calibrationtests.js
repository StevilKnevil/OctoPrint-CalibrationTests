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

		self.confirmAllGcode = ko.observable(undefined);
		self.hotEndTemp = ko.observable(undefined);

		self.saveSettings = function() {
			// Save them
			OctoPrint.settings.savePluginSettings("calibrationtests", 
				{
					confirmAllGcode: self.confirmAllGcode(),
					hotEndTemp: self.hotEndTemp(),
				}, null);
			self.isDirty(false);
		};

		self.resetSettings = function() {
			// Save them
			OctoPrint.settings.getPluginSettings("calibrationtests", null).done(function(data){
				self.confirmAllGcode(data.confirmAllGcode);
				self.hotEndTemp(data.hotEndTemp);
			});
			self.isDirty(false);			
			//alert("TODO")
		}

		self.setDirty = function() {
			self.isDirty(true);
		}

		self.onBeforeBinding = function() {
			self.confirmAllGcode(self.settings.settings.plugins.calibrationtests.confirmAllGcode());
			self.hotEndTemp(self.settings.settings.plugins.calibrationtests.hotEndTemp());

			var confirmAllGcodeSubscription = self.confirmAllGcode.subscribe(self.setDirty);
			var hotEndTempSubscription = self.hotEndTemp.subscribe(self.setDirty);
			
			self.settings.settings.plugins.calibrationtests.confirmAllGcode.subscribe(function(val) {
				// Temp disable the subscription
				confirmAllGcodeSubscription.dispose();
				self.confirmAllGcode(val);
				hotEndTempSubscription = self.hotEndTemp.subscribe(self.setDirty);
			});
			self.settings.settings.plugins.calibrationtests.hotEndTemp.subscribe(function(val) {
				// Temp disable the subscription
				hotEndTempSubscription.dispose();
				self.hotEndTemp(val);
				hotEndTempSubscription = self.hotEndTemp.subscribe(self.setDirty);
			});
		}

		self.onSettingsBeforeSave = function() {
			// Sync our settings with the settings view model

			// Make sure buttons are appropriately enabled
			
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
