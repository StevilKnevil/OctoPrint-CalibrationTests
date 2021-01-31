import logging

PrinterSettings = {}

def getPrinterSettings():
	# TODO: If we haven't populated the printer settings yet, send gcode to query them and wait for the response.
	# Remember: Failsafe if eror or no connection etc.
	#_logger.info(_printer.commands('M503'))
	return PrinterSettings


def detect_machine_settings(comm, line, *args, **kwargs):
	# parse a dictionary for the line
	resultDict = {}
	for t in line.split():
		try:
			# get the idetifier
			resultDict[t[0]] = float(t[1:])
		except ValueError:
			pass

	if 'M' in resultDict and resultDict['M'] == 92.0:
		if 'X' in resultDict:
			PrinterSettings['XSteps'] = resultDict['X']
		if 'Y' in resultDict:
			PrinterSettings['YSteps'] = resultDict['Y']
		if 'Z' in resultDict:
			PrinterSettings['ZSteps'] = resultDict['Z']
		if 'E' in resultDict:
			PrinterSettings['ESteps'] = resultDict['E']

	return line


'''
Send: M503
Recv: echo:; Steps per unit:
Recv: echo: M92 X80.0 Y80.0 Z800.0 E90.0
Recv: echo:; Maximum feedrates (units/s):
Recv: echo: M203 X500.0 Y500.0 Z5.0 E25.0
Recv: echo:; Maximum Acceleration (units/s2):
Recv: echo: M201 E74.0 X2000.0 Y2000.0 Z10.0
Recv: echo:; Acceleration (units/s2): P<print_accel> R<retract_accel> T<travel_accel>
Recv: echo: M204 P750.0 R1000.0 T300.0 S300.0
Recv: echo:; Home offset:
Recv: echo: M206 X0.0 Y0.0 Z0.0
Recv: echo:; Z-Probe Offset (mm):
Recv: echo: M851 X5.0 Y5.0 Z0.2
Recv: echo:; Filament settings: Disabled
Recv: echo: M200 D1.75 S0
Recv: echo:; Enstop adjustment:
Recv: echo: M666 X-1.0 Y0.0 Z0.0
Recv: echo:; Delta config:
Recv: echo: M665 B0.0 H100.0 L25.0 R6.5 S100.0 X20.0 Y20.0 Z20.0
Recv: echo:; Bed Levelling:
Recv: echo: M420 S0 Z0.0
Recv: echo:; Linear Advance:
Recv: echo: M900 K0.01
Recv: echo:; Advanced: B<min_segment_time_us> S<min_feedrate> T<min_travel_feedrate> X<max_x_jerk> Y<max_y_jerk> Z<max_z_jerk> E<max_e_jerk>
Recv: echo: M205 B20000.0 S0.0 T0.0 X10.0 Y10.0 Z0.3 E5.0 J0.0
Recv: echo:; Material heatup parameters:
Recv: echo: M145S0 B50 F255 H205
Recv: echo: M145S1 B75 F0 H240
Recv: echo:; PID settings:
Recv: echo: M301 P27.08 I2.51 D73.09
Recv: echo:; PID settings:
Recv: echo: M304 P131.06 I11.79 D971.23
'''