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
