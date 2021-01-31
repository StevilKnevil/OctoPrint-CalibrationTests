$(function() {
	function CalibrationTestsViewModel(parameters) {
		var self = this;

		self.settings = parameters[0];

		self.printerIsReady = ko.observable();

		//self.amountToExtrude = 100;
		self.amountToExtrude = 10;
		self.lengthRemaining = ko.observable();
		self.currentESteps = ko.observable();
		self.extrudedMaterial = ko.computed(function(){
			return self.amountToExtrude - self.lengthRemaining();
		});
		self.calculatedESteps = ko.computed(function(){
			return self.currentESteps();
		});
		
		self.updatePrinterIsReady = function() {
			OctoPrint.get("api/connection").done(function(response) {
				if (response.current.state == "operational")
				{
					// we have a connection, is the printer ready?
					OctoPrint.get("api/printer").done(function(response){
						self.printerIsReady(response.state.flags.ready);
					})
				}
			})
		};

		self.updateCurrentESteps = function() {
			OctoPrint.simpleApiGet("calibrationtests", {"command": "getPrinterSettings"})
				.done(function(response) {
					if (!isNaN(response.ESteps))
						self.currentESteps(response.ESteps);
				});
			/*
			$.ajax({
				url:         "/api/printer",
				type:        "GET",
				contentType: "application/json",
				dataType:    "json",
				success: function (result) {
					log.info(result.state.flags.ready);
				},
				error: function() {
					log.error("Error getting status of printer");
				}
			});
			*/
		};

		self.doExtrude = function() {
			$.ajax({
				url:         "/api/printer",
				type:        "GET",
				contentType: "application/json",
				dataType:    "json",
				headers:     {"X-Api-Key": UI_API_KEY},
				data:        JSON.stringify({"command": "target", "tool0": "220"}),
				success: function (result) {
					log.info("temperature set");
				},
				error: function() {
					log.error("Failed to set Temperature");
				}
			});
		};

		// This will get called before the CalibrationTestsViewModel gets bound to the DOM, but after its
		// dependencies have already been initialized. It is especially guaranteed that this method
		// gets called _after_ the settings have been retrieved from the OctoPrint backend and thus
		// the SettingsViewModel been properly populated.
		self.onBeforeBinding = function() {
			// Ensure we update with current printers settings
			var t = setInterval(self.updatePrinterIsReady, 1000)
			var t = setInterval(self.updateCurrentESteps, 1000)
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
