$(function() {
	function RetractionTestViewModel(parameters) {
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
		self.initialRetraction = ko.observable(0);
		self.finalRetraction = ko.observable(5);
		self.numSteps = ko.observable(9);

		self.enable_buttons = ko.pureComputed(function () {
			return (
				!self.printerState.isBusy() &&
				self.printerState.isReady()
			);
		});

		self.runTest = function() {
			var gCode = buildGcode()
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
		construct: RetractionTestViewModel,

		// This is a list of dependencies to inject into the plugin, the order which you request
		// here is the order in which the dependencies will be injected into your view model upon
		// instantiation via the parameters argument
		dependencies: ["settingsViewModel", "printerStateViewModel"],

		// Finally, this is the list of selectors for all elements we want this view model to be bound to.
		elements: ["#retraction_test"]
	});
});

function buildGcode(){
	$.get( "gcode/retraction_test_without_abl.gcode", function( data ) {
		console.log(data);
	  });

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

; build a raft
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
; layer X
G4 P1
; inner perimeter
G1 X109.982 Y119.710 F6000
>>> G1 Z18.980 F1000
G1 E0.0000 F1800
G92 E0
G1 X110.054 Y119.715 E0.0027 F630
G1 X110.124 Y119.737 E0.0054
G1 X110.185 Y119.776 E0.0081
G1 X110.235 Y119.829 E0.0108
G1 X110.270 Y119.893 E0.0135
G1 X110.298 Y120.000 E0.0176
G1 X110.270 Y120.107 E0.0217
G1 X110.235 Y120.171 E0.0244
G1 X110.185 Y120.224 E0.0271
G1 X110.124 Y120.263 E0.0298
G1 X110.054 Y120.285 E0.0325
G1 X109.982 Y120.290 E0.0352
G1 X109.910 Y120.276 E0.0379
G1 X109.844 Y120.245 E0.0406
G1 X109.788 Y120.199 E0.0433
G1 X109.745 Y120.140 E0.0460
G1 X109.719 Y120.072 E0.0487
G1 X109.710 Y120.000 E0.0514
G1 X109.714 Y119.963 E0.0528
G1 X109.719 Y119.928 F630
G1 X109.745 Y119.860 F630
G1 X109.788 Y119.801 F630
G1 X109.844 Y119.755 F630
G1 X109.910 Y119.724 F630
G1 X109.982 Y119.710 F630
G1 X109.951 Y119.227 F6000
G92 E0
G1 X110.145 Y119.239 E0.0072 F630
G1 X110.330 Y119.299 E0.0144
G1 X110.494 Y119.403 E0.0216
G1 X110.626 Y119.545 E0.0288
G1 X110.720 Y119.715 E0.0360
G1 X110.774 Y119.925 E0.0441
G1 X110.779 Y120.000 E0.0469
G1 X110.774 Y120.075 E0.0496
G1 X110.720 Y120.285 E0.0577
G1 X110.626 Y120.455 E0.0649
G1 X110.494 Y120.597 E0.0721
G1 X110.330 Y120.701 E0.0793
G1 X110.145 Y120.761 E0.0865
G1 X109.951 Y120.773 E0.0937
G1 X109.761 Y120.736 E0.1009
G1 X109.585 Y120.654 E0.1081
G1 X109.436 Y120.530 E0.1153
G1 X109.321 Y120.373 E0.1225
G1 X109.250 Y120.193 E0.1297
G1 X109.226 Y120.000 E0.1369
G1 X109.250 Y119.807 E0.1441
G1 X109.321 Y119.627 E0.1514
G1 X109.436 Y119.470 E0.1586
G1 X109.576 Y119.354 E0.1653
G1 X109.585 Y119.346 F630
G1 X109.761 Y119.264 F630
G1 X109.951 Y119.227 F630
; outer perimeter
G1 X109.921 Y118.744 F6000
G92 E0
G1 X110.236 Y118.764 E0.0117 F420
G1 X110.536 Y118.862 E0.0234
G1 X110.802 Y119.031 E0.0351
G1 X111.018 Y119.261 E0.0468
G1 X111.170 Y119.537 E0.0585
G1 X111.250 Y119.850 E0.0705
G1 X111.260 Y120.000 E0.0761
G1 X111.250 Y120.150 E0.0817
G1 X111.170 Y120.463 E0.0937
G1 X111.018 Y120.739 E0.1054
G1 X110.802 Y120.969 E0.1171
G1 X110.536 Y121.138 E0.1288
G1 X110.236 Y121.236 E0.1405
G1 X109.921 Y121.256 E0.1522
G1 X109.611 Y121.197 E0.1639
G1 X109.326 Y121.062 E0.1756
G1 X109.083 Y120.861 E0.1873
G1 X108.898 Y120.606 E0.1990
G1 X108.781 Y120.313 E0.2107
G1 X108.742 Y120.000 E0.2224
G1 X108.781 Y119.687 E0.2342
G1 X108.898 Y119.394 E0.2459
G1 X109.083 Y119.139 E0.2576
G1 X109.326 Y118.938 E0.2693
G1 X109.535 Y118.840 E0.2778
G1 X109.611 Y118.803 F420
G1 X109.921 Y118.744 F420
G92 E0
>>> G1 E-4.0000 F1800
; inner perimeter
G1 X109.982 Y100.290 F6000
G1 E0.0000 F1800
G92 E0
G1 X109.910 Y100.276 E0.0027 F630
G1 X109.844 Y100.245 E0.0054
G1 X109.788 Y100.199 E0.0081
G1 X109.745 Y100.140 E0.0108
G1 X109.719 Y100.072 E0.0135
G1 X109.710 Y100.000 E0.0162
G1 X109.719 Y99.928 E0.0189
G1 X109.745 Y99.860 E0.0216
G1 X109.788 Y99.801 E0.0243
G1 X109.844 Y99.755 E0.0270
G1 X109.910 Y99.724 E0.0297
G1 X109.982 Y99.710 E0.0324
G1 X110.054 Y99.715 E0.0351
G1 X110.124 Y99.737 E0.0378
G1 X110.185 Y99.776 E0.0405
G1 X110.235 Y99.829 E0.0432
G1 X110.270 Y99.893 E0.0459
G1 X110.298 Y100.000 E0.0500
G1 X110.279 Y100.072 E0.0528
G1 X110.270 Y100.107 F630
G1 X110.235 Y100.171 F630
G1 X110.185 Y100.224 F630
G1 X110.124 Y100.263 F630
G1 X110.054 Y100.285 F630
G1 X109.982 Y100.290 F630
G1 X109.951 Y100.773 F6000
G92 E0
G1 X109.761 Y100.736 E0.0072 F630
G1 X109.585 Y100.654 E0.0144
G1 X109.436 Y100.530 E0.0216
G1 X109.321 Y100.373 E0.0288
G1 X109.250 Y100.193 E0.0360
G1 X109.226 Y100.000 E0.0432
G1 X109.250 Y99.807 E0.0504
G1 X109.321 Y99.627 E0.0576
G1 X109.436 Y99.470 E0.0648
G1 X109.585 Y99.346 E0.0720
G1 X109.761 Y99.264 E0.0792
G1 X109.951 Y99.227 E0.0865
G1 X110.145 Y99.239 E0.0937
G1 X110.330 Y99.299 E0.1009
G1 X110.494 Y99.403 E0.1081
G1 X110.626 Y99.545 E0.1153
G1 X110.720 Y99.715 E0.1225
G1 X110.774 Y99.925 E0.1305
G1 X110.779 Y100.000 E0.1333
G1 X110.774 Y100.075 E0.1361
G1 X110.720 Y100.285 E0.1441
G1 X110.626 Y100.455 E0.1514
G1 X110.494 Y100.597 E0.1586
G1 X110.340 Y100.694 E0.1653
G1 X110.330 Y100.701 F630
G1 X110.145 Y100.761 F630
G1 X109.951 Y100.773 F630
; outer perimeter
G1 X109.921 Y101.256 F6000
G92 E0
G1 X109.611 Y101.197 E0.0117 F420
G1 X109.326 Y101.062 E0.0234
G1 X109.083 Y100.861 E0.0351
G1 X108.898 Y100.606 E0.0468
G1 X108.781 Y100.313 E0.0585
G1 X108.742 Y100.000 E0.0702
G1 X108.781 Y99.687 E0.0819
G1 X108.898 Y99.394 E0.0936
G1 X109.083 Y99.139 E0.1053
G1 X109.326 Y98.938 E0.1171
G1 X109.611 Y98.803 E0.1288
G1 X109.921 Y98.744 E0.1405
G1 X110.236 Y98.764 E0.1522
G1 X110.536 Y98.862 E0.1639
G1 X110.802 Y99.031 E0.1756
G1 X111.018 Y99.261 E0.1873
G1 X111.170 Y99.537 E0.1990
G1 X111.250 Y99.850 E0.2110
G1 X111.260 Y100.000 E0.2166
G1 X111.250 Y100.150 E0.2222
G1 X111.170 Y100.463 E0.2342
G1 X111.018 Y100.739 E0.2459
G1 X110.802 Y100.969 E0.2576
G1 X110.536 Y101.138 E0.2693
G1 X110.316 Y101.210 E0.2778
G1 X110.236 Y101.236 F420
G1 X109.921 Y101.256 F420
G92 E0
G1 E-4.0000 F1800
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