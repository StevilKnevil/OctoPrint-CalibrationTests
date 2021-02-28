$.dialog = {
    confirm: function(options) {
		var $modal = $('#confirmGCode');
		var $textArea = $('#gCodePreivewTextArea');
        $textArea.val(options.message);
        
        $modal.off('click.dialog', '.btn, .close')
            .off('hidden')
            .on('click.dialog', '.btn, .close', function() {
				$(this).addClass('modal-result');
			}).on('hidden', function() {
				var result = $(this).find('.modal-result').filter('.btn-danger').length > 0;
				$(this).find('.modal-result').removeClass('modal-result');
				options.callback(result, $textArea.val());
	        });
        
        $modal.modal();
    }        
};

$(function() {
	function EStepsTestViewModel(parameters) {
		var self = this;

		self.settings = parameters[0];
		self.printerState = parameters[1];
		self.terminal = parameters[2];

		// Settings shortcuts: set in onBeforeBinding()
		self.pluginSettings = null;
		self.testSettings = null;
		// Shortcuts to used plugin settings
		self.confirmAllGcode = null;
		self.hotEndTemp = null;
		// Shortcuts to per-test settings
		self.lengthToExtrude = null;
		self.initialDistanceToMark = null;

		self.enable_buttons = ko.pureComputed(function () {
			return (
				!self.printerState.isBusy() &&
				self.printerState.isReady()
			);
		});

		self.currentESteps = ko.observable();

		self.remainingDistanceToMark = ko.observable("");
		self.extrudedMaterial = ko.computed(function(){
			if (self.remainingDistanceToMark() == "")
			    return ""			
			return self.initialDistanceToMark() - self.remainingDistanceToMark();
		});
		self.calculatedESteps = ko.computed(function(){
			if (self.extrudedMaterial() == "")
			    return ""				
			let numSteps = self.currentESteps() * self.lengthToExtrude();
			return numSteps/self.extrudedMaterial();
		});
		
		self.setESteps = function() {
			// Write the new value, save the setting and read back the data to check
			commands = [
				"; Set ESteps to "+self.calculatedESteps(),
				"M92 E"+self.calculatedESteps(),
				"; Save setting to EEPROM",
				"M500",
				"; Read new settings to check it worked",
				"M503"
			];
			self.sendGcode(commands, ()=>{})
		};

		var isExtruding = false
		self.doExtrude = function() {
			// Ignore requests to extrude if we're already running the test
			if (!isExtruding) {
				isExtruding = true;
				commands = [
					"; Pre-heat hotend to " + self.hotEndTemp() + " & wait",
					"M109 S" + self.hotEndTemp(),
					"; Set relative positioning",
					"G91",
					"; Extrude" + self.lengthToExtrude() + "mm of filament",
					"G1 E" + self.lengthToExtrude(),
					"; Set hot-end temp to zero",
					"M104 S0"
				];
				self.sendGcode(commands, ()=>{isExtruding = false;})
			}
		};

		self.sendGcode = function(commandArray, onDone)
		{
			if (self.confirmAllGcode())
			{
				$.dialog.confirm({message: commandArray.join("\n"), callback: function(result) {
					if (result)
						OctoPrint.postJson("api/printer/command", {commands: commandArray}).done(onDone)
					else
						onDone()
				}
			  });				
			}
			else
			{
				OctoPrint.postJson("api/printer/command", {commands: commandArray}).done(onDone)
			}
		}

		// This will get called before the CalibrationTestsViewModel gets bound to the DOM, but after its
		// dependencies have already been initialized. It is especially guaranteed that this method
		// gets called _after_ the settings have been retrieved from the OctoPrint backend and thus
		// the SettingsViewModel been properly populated.
		self.onBeforeBinding = function() {
			self.pluginSettings = self.settings.settings.plugins.calibrationtests
			self.testSettings = self.settings.settings.plugins.calibrationtests.e_steps_test
			// Shortcuts to used settings
			self.confirmAllGcode = self.pluginSettings.confirmAllGcode
			self.hotEndTemp = self.pluginSettings.hotEndTemp
			// Shortcuts to per-test settings
			self.lengthToExtrude = self.testSettings.lengthToExtrude
			self.initialDistanceToMark = self.testSettings.initialDistanceToMark

			// TODO: Move the plugin settings into a setting that is saved whenever gcode is generated
		}

		// Bind subscriptions to view models
        self.onAllBound = function() {
			self.printerState.stateString.subscribe(self.onPrinterStateChange);
            self.terminal.log.subscribe(self.onLogChange, null, "arrayChange");
		}

		self.onPrinterStateChange = function(newValue) {
			if (newValue == "Operational"){
				// We have a newly operational printer, query it for it's settings
				commandArray = [
					"; Check machine settings",
					"M503"
				];
				OctoPrint.postJson("api/printer/command", {commands: commandArray})
			}			
		}

		self.onLogChange = function(changes) {
			// Monitor log for printer setting reports
			changes.forEach(change => {
				// Check for steps settings: "Recv: echo: M92 X80.0 Y80.0 Z800.0 E77.05"
				// Note: Regex for (signed) float: -?\d*\.?\d*
				const regex = /Recv: echo: M92 X(-?\d*\.?\d*) Y(-?\d*\.?\d*) Z(-?\d*\.?\d*) E(-?\d*\.?\d*)/g;
				let array = [...change.value.line.matchAll(regex)];
				if (array.length > 0 && array[0].length == 5)
				{
					self.currentESteps(array[0][4]);
				}
			});
		}
	}

	// This is how our plugin registers itself with the application, by adding some configuration
	// information to the global variable OCTOPRINT_VIEWMODELS
	OCTOPRINT_VIEWMODELS.push({
		// This is the constructor to call for instantiating the plugin
		construct: EStepsTestViewModel,

		// This is a list of dependencies to inject into the plugin, the order which you request
		// here is the order in which the dependencies will be injected into your view model upon
		// instantiation via the parameters argument
		dependencies: ["settingsViewModel", "printerStateViewModel", "terminalViewModel"],

		// Finally, this is the list of selectors for all elements we want this view model to be bound to.
		elements: ["#e_steps_test"]
	});
});
