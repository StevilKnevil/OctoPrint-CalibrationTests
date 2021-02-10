$(function() {
	function CoolingTestViewModel(parameters) {
		var self = this;

		self.settings = parameters[0];
		self.printerState = parameters[1];

		// Settings shortcuts: set in onBeforeBinding()
		self.pluginSettings = null;
		self.testSettings = null;
		// Shortcuts to used plugin settings
		self.confirmAllGcode = null;
		self.hotEndTemp = null;
		// Shortcuts to per-test settings
		self.initialLayerTime = ko.observable(10);
		self.finalLayerTime = ko.observable(1);
		self.numTimeSteps = ko.observable(9);

		self.enable_buttons = ko.pureComputed(function () {
			return (
				!self.printerState.isBusy() &&
				self.printerState.isReady()
			);
		});

		self.runTest = function() {
			var gCode = buildGcode()
			//var wnd = window.open("about:blank", "", "_blank");
			//wnd.document.write(gCode);
			console.log(gCode)
			//var commandArray = gCode.split("\n");
			//self.sendGcode(commandArray)
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
			//self.lengthToExtrude = self.testSettings.lengthToExtrude
			//self.initialDistanceToMark = self.testSettings.initialDistanceToMark
		}

		// Bind subscriptions to view models
        self.onAllBound = function() {
			self.printerState.stateString.subscribe(self.onPrinterStateChange);
		}

		self.onPrinterStateChange = function(newValue) {
			if (newValue == "Operational"){
				// We havea newly operational printer, query it for it's settings
				commandArray = [
					"; Check machine settings",
					"M503"
				];
				OctoPrint.postJson("api/printer/command", {commands: commandArray})
			}			
		}

	}

	// This is how our plugin registers itself with the application, by adding some configuration
	// information to the global variable OCTOPRINT_VIEWMODELS
	OCTOPRINT_VIEWMODELS.push({
		// This is the constructor to call for instantiating the plugin
		construct: CoolingTestViewModel,

		// This is a list of dependencies to inject into the plugin, the order which you request
		// here is the order in which the dependencies will be injected into your view model upon
		// instantiation via the parameters argument
		dependencies: ["settingsViewModel", "printerStateViewModel"],

		// Finally, this is the list of selectors for all elements we want this view model to be bound to.
		elements: ["#cooling_test"]
	});
});

function buildGcode(){
	var init = `
M140 S60 ; set bed temp
M105 ; report temps
M190 S60 ; wait for bed temp
M104 S200 ; set for Extruder temp
M105 ; report temps
M109 S200 ; wait for Extruder temp
M82 ; absolute extrusion mode

G92 E0 ; Reset Extruder

G90 ; Absolute positioning

G0 F20000 X100 Y100 Z0.2 ; Set start position

M106 S255; turn on fan

G91 ; relative positioning

; Skirt
; Assume wall thickness = nozle width!
G0 F20000 X-10 Y-10;
G0 F3000 ; Print at 50mm/s
G1 X30 Y0 E1.00;
G1 X0 Y30 E1.00;
G1 X-30 Y0 E1.00;
G1 X0 Y-30 E1.00;
G0 F20000 X-0.2 Y-0.2;
G1 X30.04 Y0 E1.00;
G1 X0 Y30.04 E1.00;
G1 X-30.04 Y0 E1.00;
G1 X0 Y-30.04 E1.00;
G0 F20000 X-0.2 Y-0.2;
G1 X30.06 Y0 E1.00;
G1 X0 Y30.06 E1.00;
G1 X-30.06 Y0 E1.00;
G1 X0 Y-30.06 E1.00;

; Go back to start
G1 E-4 ;retract a little
G90 ; Absolute positioning
G0 F20000 X100 Y100 Z0.2 ; Set start position
G91 ; relative positioning

;LAYER_COUNT:100
`	

var term = `
G91 ;Relative positioning
G1 E-2 F2700 ;Retract a bit
G1 E-2 Z0.2 F2400 ;Retract and raise Z
G1 X5 Y5 F3000 ;Wipe out
G1 Z10 ;Raise Z more
G90 ;Absolute positionning

G1 X0 Y220 ;Present print
M106 S0 ;Turn-off fan
M104 S0 ;Turn-off hotend
M140 S0 ;Turn-off bed

M84 X Y E ;Disable all steppers but Z

M82 ;absolute extrusion mode
M104 S0`

var shape = `
;LAYER:0
G1 E4 ;undo retraction
M106 S255; turn on fan
G1 F3000 ; Print at 50mm/s
G1 X10 Y0 E0.33;
G1 X0 Y10 E0.33;
G1 X-10 Y0 E0.33;
G1 X0 Y-10 E0.33;

M107 ; turn off fan
G0 Z0.2 ; move up to next layer
G4 P200 ; we have printed 40mm of material @ 50mm/sec, so wait for layertime to elapse
; Next layer
`
	retval = init;

	let layerHeight = 0.2
	let stepHeight = 5
	let layersPerStep = stepHeight/layerHeight

	let initTime = 5;
	let finalTime = 1;
	let timeStep = -1;

	for (t = initTime; t >= finalTime; t+= timeStep)
	{
		for (l = 0; l<layersPerStep; l++)
		{
			retval += shape
			// add an extra pause depending on which step it is
			let pauseTime = t-1; // Note that drawing the shape takes 1 second
			retval += `G4 S`+pauseTime
		}
	}

	retval += term

	return retval
}