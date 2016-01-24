var variables = require('../templates/variables');
var classes = require(variables.rootdir + 'templates/classes');
var os = require('os');
// Include child_process-module. This allows for the creation of a secondary process to launch external applications.
var exec = require('child_process').exec;
var schedulefunctions = require(variables.rootdir + 'functions/schedulefunctions');
var TellstickNode = require(variables.rootdir + 'TellstickNode');
var sharedfunctions = require(variables.rootdir + 'functions/sharedfunctions');
var compareversion = require('compare-version');

exports.doubletapcheck = doubletapcheck;
exports.send = send;
exports.deviceaction = deviceaction;
exports.getdevicestatus = getdevicestatus;
exports.resetdevices = resetdevices;
exports.getresetdevices = getresetdevices;
exports.getdeviceproperty = getdeviceproperty;


// Doubletap interval check
function doubletapcheck() {
	var timestamp_start = new Date();

	// Do not run if restore is in progress.
	if (variables.restoreInProgress === true) {
		setTimeout(doubletapcheck, ((1000 * variables.options.doubletapseconds) + (timestamp_start - new Date().getTime())));
		return;
	}

	variables.doubletap.forEach(function(repeatschedule) {
		if (repeatschedule.count > 0) {
			var debugtimestamp = new Date();
			deviceaction(repeatschedule.schedule.deviceid, repeatschedule.action, 'Repeater');
			repeatschedule.count = repeatschedule.count - 1;
		}
	});
	for (var i = 0; i < variables.doubletap.length; i++) {
		if (variables.doubletap[i].count < 1) {
			variables.doubletap.splice(i, 1);
			i = 0;
		}
	}
	if (variables.options.doubletapseconds < 1) {
		variables.options.doubletapseconds = 1;
	}

	setTimeout(doubletapcheck, ((1000 * variables.options.doubletapseconds) + (timestamp_start - new Date().getTime())));
}

// Send a command to a device.
function send(req, res) {
	deviceaction(req.query.deviceid, req.query.switchto, 'Manual');
	variables.doubletap.push({
		schedule: {
			deviceid: req.query.deviceid
		},
		count: variables.options.doubletapcount,
		action: req.query.switchto
	});
	res.send('Send command to device.');

}

function deviceaction(deviceid, action, source) {

	var actiontotrigger = '';
	if (action.indexOf(':') != -1) {
		var dimsettings = action.split(':');
		actiontotrigger = '--dimlevel ' + dimsettings[1] + ' --' + dimsettings[0];
	} else {
		actiontotrigger = '--' + action;
	}

	if (deviceid.indexOf('group') == -1) {
		exec('"' + variables.tdtool() + '" ' + actiontotrigger.toLowerCase() + ' ' + deviceid, null, function(error, stdout, stderr) {
			if (typeof(source) == 'undefined') {
				source = 'NULL';
			}

			var currentdevice = '';
			variables.devices.forEach(function(device) {
				if (device.id == deviceid) {
					currentdevice = device;
				}
			});

			sharedfunctions.logToFile('Action,' + getdeviceproperty(deviceid, 'name') + ',' + source + ',' + action.toLowerCase() + ',Sent command ' + action.toLowerCase() + ' to device.', 'Device-' + deviceid);
			sharedfunctions.logToFile('Action,' + getdeviceproperty(deviceid, 'name') + ',' + source + ',' + action.toLowerCase() + ',tdtool responded on stdout with: ' + stdout.trim(), 'Device-' + deviceid);
			if (stderr) {
				sharedfunctions.logToFile('Action,' + getdeviceproperty(deviceid, 'name') + ',' + source + ',' + action.toLowerCase() + ',tdtool responded on stderr with: ' + stderr.trim(), 'Device-' + deviceid);
			}

			// Request an update of the status of devices.
			getdevicestatus(true);
		});
	} else {
		variables.devices.forEach(function(device) {

			if (device.id == deviceid) {
				device.lastcommand = actiontotrigger.toLowerCase();
				device.devices.forEach(function(device_in_group) {
					exec('"' + variables.tdtool() + '" ' + actiontotrigger.toLowerCase() + ' ' + device_in_group, ' + source + ', function(error, stdout, stderr) {
						if (typeof(res) !== 'undefined') {
							//res.send(stdout);
						}

						var currentdevice = '';
						variables.devices.forEach(function(device) {
							if (device.id == device_in_group) {
								currentdevice = device;
							}
						});
						sharedfunctions.logToFile('Action,' + getdeviceproperty(deviceid, 'name') + ',' + source + ',' + action.toLowerCase() + ',Sent command ' + action.toLowerCase() + ' to device: ' + currentdevice.name + '(ID: ' + device_in_group + ')', 'Device-' + deviceid);
						sharedfunctions.logToFile('Action,' + getdeviceproperty(deviceid, 'name') + ',' + source + ',' + action.toLowerCase() + ',tdtool responded on stdout with: ' + stdout.trim(), 'Device-' + deviceid);
						if (stderr) {
							sharedfunctions.logToFile('Action,' + getdeviceproperty(deviceid, 'name') + ',' + source + ',' + action.toLowerCase() + ',tdtool responded on stderr with: ' + stderr.trim(), 'Device-' + deviceid);
						}
						// Request an update of the status of devices.
						getdevicestatus(true);
					});
				});
			}
		});
	}
}

function getdevicestatus(manual) {
	var timestamp_start = new Date();

	if (variables.restoreInProgress === true) {
		if (typeof(manual) == 'undefined') {
			setTimeout(getdevicestatus, (15000 + (timestamp_start - new Date().getTime())));
		}
		return;
	}

	exec('"' + variables.tdtool() + '" --version', null, function(error, stdout, stderr) {
		var lines = stdout.toString().split('\n');
		var version = lines[0].substr(lines[0].indexOf(' ') + 1);

		if (compareversion(version, variables.tdtoolversionlimit) >= 0) {
			exec('"' + variables.tdtool() + '" --list-devices', null, function(error, stdout, stderr) {

				var lines = stdout.toString().split('\n');
				lines.forEach(function(line) {
					if (line.length > 0) {
						var currentdevice = new classes.device();

						var columns = line.split('\t');
						columns.forEach(function(column) {

							var data = column.split('=');

							if (data[0] == "id") {
								currentdevice.id = data[1].trim();
							}
							if (data[0] == "type") {
								currentdevice.type = data[1].trim();
							}
							if (data[0] == "name") {
								currentdevice.name = data[1].trim();
							}
							if (data[0] == "lastsentcommand") {
								currentdevice.lastcommand = data[1].trim();
							}
							currentdevice.schedule = [];
							currentdevice.activescheduleid = '';
							currentdevice.currentstatus = '';
							currentdevice.activeday = '';

						});
						var alreadyinlist = false;
						variables.devices.forEach(function(device) {
							if (device.id == currentdevice.id) {
								if (device.lastcommand != currentdevice.lastcommand) {
									sharedfunctions.logToFile('Status,' + device.name + ',NULL,INFO,Device changed status from ' + device.lastcommand + ' to ' + currentdevice.lastcommand, 'Device-' + device.id);
								}

								if ((device.lastcommand != currentdevice.lastcommand) && (device.watchers.length > 0)) {
									sharedfunctions.logToFile('Watcher,' + device.name + ',NULL,INFO,This device has watchers.', 'Device-' + device.id);
									device.watchers.forEach(function(watcher) {
										
										if ((watcher.triggerstatus.toLowerCase() == currentdevice.lastcommand.toLowerCase()) && (watcher.enabled == 'true')) {

											watcher.actions.forEach(function(action) {

												if (action.delay > 0) {
													// Create a schedule, runonce.
													var currenttime = new Date();

													// Add the delay minutes to now when it triggered, so that the desired action is carried out at the correct time.
													sharedfunctions.DateAdd('n', currenttime, Number(action.delay));

													var currenthour = '0' + currenttime.getHours();
													var currentminutes = '0' + currenttime.getMinutes();
													var triggertime = currenthour.substr(currenthour.length - 2) + ":" + currentminutes.substr(currentminutes.length - 2);

													var watcherschedule = new classes.schedule();
													watcherschedule.uniqueid = 'watcher' + currenttime.getTime();
													watcherschedule.deviceid = action.id;
													watcherschedule.time = triggertime;
													watcherschedule.originaltime = triggertime;
													watcherschedule.enabled = watcher.enabled;
													watcherschedule.action = action.status;
													watcherschedule.dayofweek = [currenttime.getUTCDay()];
													watcherschedule.controller = 'Time';
													watcherschedule.runonce = 'true';
													watcherschedule.sendautoremote = watcher.autoremoteonschedule;
													variables.devices.forEach(function(targetdevice) {
														if (targetdevice.id == watcherschedule.deviceid) {
															targetdevice.schedule.push(watcherschedule);
														}
													})
													sharedfunctions.logToFile('Schedule,' + device.name + ',' + watcherschedule.uniqueid + ',Create,Watcher Event triggered creation of Run-Once schedule: ' + JSON.stringify(watcherschedule), 'Device-' + watcherschedule.deviceid);
													variables.savetofile = true;
												} else {
													deviceaction(action.id, action.status, 'WatcherInstantTrigger');
												}
											});
										}
									});
								}

								device.lastcommand = currentdevice.lastcommand;
								device.name = currentdevice.name;
								alreadyinlist = true;
							}
						});
						if (!alreadyinlist) {
							variables.devices.push(currentdevice);
						}

					}
				});
				variables.devices.sort(sharedfunctions.dynamicSortMultiple('name'));
				schedulefunctions.highlightactiveschedule();
				var devicejson = [];
				for (var i = 0; i < variables.devices.length; i++) {
					var deviceid = variables.devices[i].id;
					var devicecommand = variables.devices[i].lastcommand;
					devicejson.push({
						device: deviceid + ':' + devicecommand
					});
				}
				TellstickNode.sendtoclient(devicejson);
				if (typeof(manual) == 'undefined') {
					setTimeout(getdevicestatus, (15000 + (timestamp_start - new Date().getTime())));
				}
			});
		} else {
			// This is run if the tdtool is older than version 2.1.2
			exec('"' + variables.tdtool() + '" -l', null, function(error, stdout, stderr) {
				var lines = stdout.toString().split('\n');
				var sensorsfound = false;
				lines.forEach(function(line) {
					if (line.indexOf('sensor') > 0) {
						sensorsfound = true;
					}
					if ((line.length > 0) && (sensorsfound === false)) {
						var currentdevice = new classes.device();
						var columns = line.split('\t');
						columns[0] = columns[0].trim();

						if ((!isNaN(columns[0])) && (columns[0].length > 0)) {

							currentdevice.id = columns[0].trim();
							currentdevice.type = 'device';
							currentdevice.name = columns[1].trim();
							currentdevice.lastcommand = columns[2].trim();

							currentdevice.schedule = [];
							currentdevice.activescheduleid = '';
							currentdevice.currentstatus = '';
							currentdevice.activeday = '';

							var alreadyinlist = false;
							variables.devices.forEach(function(device) {
								if (device.id == currentdevice.id) {
									if (device.lastcommand != currentdevice.lastcommand) {
										sharedfunctions.logToFile('Status,' + device.name + ',NULL,INFO,Device changed status from ' + device.lastcommand + ' to ' + currentdevice.lastcommand, 'Device-' + device.id);
									}
									if ((device.lastcommand != currentdevice.lastcommand) && (device.watchers.length > 0)) {
										sharedfunctions.logToFile('Watcher,' + device.name + ',NULL,INFO,This device has watchers.', 'Device-' + device.id);
										device.watchers.forEach(function(watcher) {

											if ((watcher.triggerstatus.toLowerCase() == currentdevice.lastcommand.toLowerCase()) && (watcher.enabled == 'true')) {

												watcher.actions.forEach(function(action) {
													if (action.delay > 0) {
														// Create a schedule, runonce.
														var currenttime = new Date();

														// Add the delay minutes to now when it triggered, so that the desired action is carried out at the correct time.
														sharedfunctions.DateAdd('n', currenttime, Number(action.delay));

														var currenthour = '0' + currenttime.getHours();
														var currentminutes = '0' + currenttime.getMinutes();
														var triggertime = currenthour.substr(currenthour.length - 2) + ":" + currentminutes.substr(currentminutes.length - 2);

														var watcherschedule = new classes.schedule();
														watcherschedule.uniqueid = 'watcher' + currenttime.getTime();
														watcherschedule.deviceid = action.id;
														watcherschedule.time = triggertime;
														watcherschedule.originaltime = triggertime;
														watcherschedule.enabled = watcher.enabled;
														watcherschedule.action = action.status;
														watcherschedule.dayofweek = [currenttime.getUTCDay()];
														watcherschedule.controller = 'Time';
														watcherschedule.runonce = 'true';
														watcherschedule.sendautoremote = watcher.autoremoteonschedule;

														variables.savetofile = true;
														variables.devices.forEach(function(targetdevice) {
															if (targetdevice.id == watcherschedule.deviceid) {
																targetdevice.schedule.push(watcherschedule);
															}
														})
														sharedfunctions.logToFile('Schedule,' + device.name + ',' + watcherschedule.uniqueid + ',Create,Watcher Event triggered creation of Run-Once schedule: ' + JSON.stringify(watcherschedule), 'Device-' + watcherschedule.deviceid);
														variables.savetofile = true;
													} else {
														deviceaction(action.id, action.status, 'WatcherInstantTrigger');
													}
												});
											}
										});
									}

									device.lastcommand = currentdevice.lastcommand;
									device.name = currentdevice.name;
									alreadyinlist = true;
								}
							});
							if (!alreadyinlist) {
								variables.devices.push(currentdevice);
							}

						}

					}
				});
				variables.devices.sort(sharedfunctions.dynamicSortMultiple('name'));
				schedulefunctions.highlightactiveschedule();
				var devicejson = [];
				for (var i = 0; i < variables.devices.length; i++) {
					var deviceid = variables.devices[i].id;
					var devicecommand = variables.devices[i].lastcommand;
					devicejson.push({
						device: deviceid + ':' + devicecommand
					});
				}
				TellstickNode.sendtoclient(devicejson);
				if (typeof(manual) == 'undefined') {
					setTimeout(getdevicestatus, (15000 + (timestamp_start - new Date().getTime())));
				}
			});
		}
	});
}

function resetdevices(callback) {
	variables.devices.forEach(function(device) {

		if (device.activescheduleid.toString().length > 0) {
			sharedfunctions.logToFile('Reset,' + device.name + ',' + device.activescheduleid + ',' + device.currentstatus + ',Reset device to status: ' + device.currentstatus, 'Device-' + device.id)
			deviceaction(device.id, device.currentstatus, 'Reset');
		} else {
			//console.log('Found no schedules for ' + device.id + ":" +  device.name);
		}

	});

	if (typeof(callback) != 'undefined') {
		callback();
	}
}

function getresetdevices(req, res) {
	resetdevices();
	res.send(true);
}

function getdeviceproperty(deviceid, property) {
	var returnvalue = '';
	variables.devices.forEach(function(device) {
		if (device.id == deviceid) {
			returnvalue = device[property];
		}
	});

	return returnvalue;
}