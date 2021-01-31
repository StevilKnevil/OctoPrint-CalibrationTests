$(function() {
	function CalibrationTestsViewModel(parameters) {
		var self = this;

		self.settings = parameters[0];

		self.printerIsReady = ko.observable(false);

		self.amountToExtrude = 100;
		self.lengthRemaining = ko.observable(20);
		self.currentESteps = ko.observable();
		self.extrudedMaterial = ko.computed(function(){
			return (self.amountToExtrude+20) - self.lengthRemaining();
		});
		self.calculatedESteps = ko.computed(function(){
			let numSteps = self.currentESteps() * self.amountToExtrude;
			return numSteps/self.extrudedMaterial();
		});
		
		self.refreshPrinterIsReady = function() {
			OctoPrint.get("api/connection").done(function(response) {
				if (response.current.state == "Operational")
				{
					// we have a connection, is the printer ready?
					OctoPrint.get("api/printer").done(function(response){
						self.printerIsReady(response.state.flags.ready);
					})
				}
				else
				{
					self.printerIsReady(false);
				}
			})
		};

		self.refreshCurrentESteps = function() {
			OctoPrint.simpleApiGet("calibrationtests", {"command": "getPrinterSettings"})
				.done(function(response) {
					if (!isNaN(response.ESteps))
						self.currentESteps(response.ESteps);
				});
		};

		self.setESteps = function() {
			// Write the new value, save the setting and read back the data to check
			commands = {commands: [
				"M92 E"+self.calculatedESteps(),
				"M500",
				"M503"
			]}
			OctoPrint.postJson("api/printer/command", commands)
		};

		var isExtruding = false
		self.doExtrude = function() {
			// Ignore requests to extrude if we're already running the test
			if (!isExtruding) {
				isExtruding = true
				commands = {commands: [
					"M109 S200",
					"G1 E" + self.amountToExtrude,
					"M104 S0"
				]}
				OctoPrint.postJson("api/printer/command", commands).done(()=>{isExtruding = false})
			}
		};

		// This will get called before the CalibrationTestsViewModel gets bound to the DOM, but after its
		// dependencies have already been initialized. It is especially guaranteed that this method
		// gets called _after_ the settings have been retrieved from the OctoPrint backend and thus
		// the SettingsViewModel been properly populated.
		self.onBeforeBinding = function() {
			// Ensure we update with current printers settings
			var t = setInterval(self.refreshPrinterIsReady, 1000)
			var t = setInterval(self.refreshCurrentESteps, 1000)
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
