# coding=utf-8
from __future__ import absolute_import

### (Don't forget to remove me)
# This is a basic skeleton for your plugin's __init__.py. You probably want to adjust the class name of your plugin
# as well as the plugin mixins it's subclassing from. This is really just a basic skeleton to get you started,
# defining your plugin as a template plugin, settings and asset plugin. Feel free to add or remove mixins
# as necessary.
#
# Take a look at the documentation on what other plugin mixins are available.

import octoprint.plugin
from . import utilities
from . import coolingTest
#def coolingTest(_logger, startTime, endTime, steps):
#    _logger.info("coolingTest")

class CalibrationtestsPlugin(octoprint.plugin.StartupPlugin, # Review - possibly unneeded
							 octoprint.plugin.SettingsPlugin,
							 octoprint.plugin.AssetPlugin,
							 octoprint.plugin.TemplatePlugin,
							 octoprint.plugin.SimpleApiPlugin, # Review - possibly unneeded
							 octoprint.plugin.EventHandlerPlugin): # Review - possibly unneeded

	##~~ StartupPlugin mixin

	def on_after_startup(self):
		self._logger.info("Calibration Tests Plugin Started")

	##~~ SettingsPlugin mixin

	def get_settings_defaults(self):
		return dict(confirmAllGcode = True)

	##~~ TemplatePlugin mixin

	def get_template_vars(self):
		return [
			dict(type="settings", custom_bindings=False)
		]

	##~~ AssetPlugin mixin

	def get_assets(self):
		# Define your plugin's asset files to automatically include in the
		# core UI here.
		return dict(
			js=["js/tests/e_steps_test.js"],
			css=["css/calibrationtests.css"]
			#less=["less/calibrationtests.less"]
		)

	##~~ SimpleApiPlugin mixin

	def get_api_commands(self):
		return dict(
			printerSettings=[],
			coolingTest=["start_time", "end_time", "steps"]
		)

	def on_api_command(self, command, data):
		import flask

		if command == "coolingTest":
			gCode = coolingTest.generateGcode(self._logger, 0,10,10)

		elif command == "speedTest":
			self._logger.warning("speedTest not implemented")
		elif command == "extrusionTest":
			self._logger.warning("extrusionTest not implemented")
		elif command == "temperatureTest":
			self._logger.warning("temperatureTest not implemented")

	def on_api_get(self, request):
		import flask
		# TODO: route the request based on parameters send (module, command?) Depends on how many GET APIs we end up with!
		#self._logger.info(request)
		return 

	##~~ EventHandlerPlugin mixin

	def on_event(self, event, payload):
		return

	##~~ Softwareupdate hook

	def get_update_information(self):
		# Define the configuration for your plugin to use with the Software Update
		# Plugin here. See https://docs.octoprint.org/en/master/bundledplugins/softwareupdate.html
		# for details.
		return dict(
			calibrationtests=dict(
				displayName="Calibrationtests Plugin",
				displayVersion=self._plugin_version,

				# version check: github repository
				type="github_release",
				user="StevilKnevil",
				repo="OctoPrint-CalibrationTests",
				current=self._plugin_version,

				# update method: pip
				pip="https://github.com/StevilKnevil/OctoPrint-CalibrationTests/archive/{target_version}.zip"
			)
		)


# If you want your plugin to be registered within OctoPrint under a different name than what you defined in setup.py
# ("OctoPrint-PluginSkeleton"), you may define that here. Same goes for the other metadata derived from setup.py that
# can be overwritten via __plugin_xyz__ control properties. See the documentation for that.
__plugin_name__ = "Calibration Tests"
__plugin_pythoncompat__ = ">=2.7,<4"

def __plugin_load__():
	global __plugin_implementation__
	__plugin_implementation__ = CalibrationtestsPlugin()

	global __plugin_hooks__
	__plugin_hooks__ = {
		"octoprint.plugin.softwareupdate.check_config": __plugin_implementation__.get_update_information,
	}

