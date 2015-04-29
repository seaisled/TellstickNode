// Include the template view (Do all the presentation(?))
var variables = require('../model/variables');
var template = require('../views/template-main').build;
var fs = require('fs');


function get(req,res) {
    // Need to create some sort of unique ID for each sechedule.
    var headline = 'Edit Schedule';
    var body = ['<div class="panel panel-default">',
                '<div class="panel-heading">',
                    'Device',
                '</div>',
                '<div class="panel-body">',
                     '<div class="form-group">',
                                '<select id="Select_Device" class="form-control">',
                                        '{select_device}',
                                    '</select>',
                            '</div>',
                '</div>',
                '<div class="panel-heading">',
                    'Schedule',
                '</div>',
                '<div class="panel-body">',
                     '<div class="checkbox">',
                                    '<label class="checkbox-inline"><input type="checkbox" id="DayOfWeek" Value="1">Monday</label>',
                                    '<label class="checkbox-inline"><input type="checkbox" id="DayOfWeek" Value="2">Tuesday</label>',
                                    '<label class="checkbox-inline"><input type="checkbox" id="DayOfWeek" Value="3">Wednesday</label>',
                                    '<label class="checkbox-inline"><input type="checkbox" id="DayOfWeek" Value="4">Thursday</label>',
                                    '<label class="checkbox-inline"><input type="checkbox" id="DayOfWeek" Value="5">Friday</label>',
                                    '<label class="checkbox-inline"><input type="checkbox" id="DayOfWeek" Value="6">Saturday</label>',
                                    '<label class="checkbox-inline"><input type="checkbox" id="DayOfWeek" Value="0">Sunday</label>',
                            '</div>',
                    '<div class="form-group">',
                                '<label for="Select_Action">Action</label>',
                                '<select id="Select_Action" class="form-control">',
                                        '<option value="On">On',
                                        '<option value="Off">Off',
                                    '</select>',
                            '</div>',
                    '<div class="form-group">',
                                '<label for="Select_Controller">Controller</label>',
                                '<select id="Select_Controller" class="form-control">',
                                        '<option value="Time">Specific Time',
                                        '<option value="Sundown" title="Adjust to sundown time" {sundown}>Sundown',
                                        '<option value="Sunrise" title="Adjust to the time of sunrise" {sunrise}>Sunrise',
                                        '<option value="Timer">Timer',
                                    '</select>',
                                    '<p class="text-info">{ControllerMessage}</p>',
                            '</div>',
                    '<div class="form-group">',
                                '<label for="Time">Time</label>',
                                '<input type="text" class="form-control" id="Time" placeholder="(HH:MM)24H" value="{initaltime}">',
                    '</div>',
                    '<div class="checkbox">',
                         '<label><input type="checkbox" id="runonce" Value="runonce">Run Once - Remove after execution</label>',
                    '</div>',
                '</div>',
                '<div class="panel-heading">',
                    'Modifications',
                '</div>',
                '<div class="panel-body" id="Modificationsdiv">',
                     '<div class="form-group">',
                                '<label for="Select_Randomizer">Randomizer function</label>',
                                '<select id="Select_Randomizer" class="form-control">',
                                        '<option value="+">+',
                                        '<option value="-">-',
                                        '<option value="both">+/-',
                                    '</select>',
                            '</div>',
                    '<div class="form-group">',
                                '<label for="Select_Randomizer_Value">Randomizer max value (Minutes)</label>',
                                 '<select id="Select_Randomizer_Value" class="form-control">',
                                        '<option value="0">0',
                                        '<option value="5">5',
                                        '<option value="10">10',
                                        '<option value="15">15',
                                        '<option value="20">20',
                                        '<option value="25">25',
                                        '<option value="30">30',
                                    '</select>',
                            '</div>',
                '<div class="form-group">',
                                '<label for="Select_Weather_Good">Weather Impact Function - Good Weather</label>',
                                 '<select id="Select_Weather_Good" class="form-control">',
                                        '<option value="+">+',
                                        '<option value="-">-',
                                    '</select>',
                            '</div>',
                '<div class="form-group">',
                                '<label for="Select_Weather_Good_Time">Weather Impact Hours - Good Weather </label>',
                                  '<select id="Select_Weather_Good_Time" class="form-control">',
                                        '<option value="0">0',
                                        '<option value="1">1',
                                        '<option value="2">2',
                                        '<option value="3">3',
                                        '<option value="4">4',
                                        '<option value="5">5',
                                        '<option value="6">6',
                                    '</select>',
                            '</div>',
               '<div class="form-group">',
                                '<label for="Select_Weather_Bad">Weather Impact Function - Bad Weather</label>',
                                 '<select id="Select_Weather_Bad" class="form-control">',
                                        '<option value="+">+',
                                        '<option value="-">-',
                                    '</select>',
                            '</div>',
                '<div class="form-group">',
                                '<label for="Select_Weather_Bad_Time">Weather Impact Hours - Bad Weather </label>',
                                  '<select id="Select_Weather_Bad_Time" class="form-control">',
                                        '<option value="0">0',
                                        '<option value="1">1',
                                        '<option value="2">2',
                                        '<option value="3">3',
                                        '<option value="4">4',
                                        '<option value="5">5',
                                        '<option value="6">6',
                                    '</select>',
                            '</div>',
                '</div>',
                '<div class="panel-body" id="Timerdiv" style="display: none">',
                    '<div class="form-group">',
                                '<label for="Duration">Duration (Minutes)</label>',
                                '<input type="text" class="form-control" id="Duration" placeholder="Minutes" value="1">',
                    '</div>',
                '</div>',
                    '<div class="panel-footer"><button onClick="Javascript:saveschedule();">Create Schedule</button></div>',
                '</div>'];
    body = body.join("\n");
    
    var schedule = '';
    var controllermessage = '';
    variables.devices.forEach(function(device, index) {
        //device_options += '<option value="' + device.id + '">'+device.name + '\n';
        device.schedule.forEach(function (singleschedule) {
            if (singleschedule.uniqueid == req.query.uniqueid) {
                schedule = singleschedule;
            }
        });
    });
    
        
    //body = body.replace(/{select_device}/g,device_options);
    
   
        if (typeof(variables.weather.sys) != 'undefined') {
            body = body.replace(/{sunrise}/g,variables.weather.sys.sunrise);
            body = body.replace(/{ControllerMessage}/g,'');
        } else  {
            body = body.replace(/{sunrise}/g,'disabled');
            controllermessage = controllermessage + 'Sunrise controller unavailable due to no weather information found.';
        }

        if (typeof(variables.weather.sys) != 'undefined') {
            body = body.replace(/{sundown}/g,variables.weather.sys.sunset);
            body = body.replace(/{ControllerMessage}/g,'');
        } else  {
            body = body.replace(/{sundown}/g,'disabled');
           controllermessage = controllermessage + '<br>Sundown controller unavailable due to no weather information found.';
        }
     body = body.replace(/{ControllerMessage}/g,controllermessage);
    
    var currentdate = new Date();
     var hour = '0' + currentdate.getHours();
        var minutes = '0' + currentdate.getMinutes();
        hour = hour.substr(hour.length-2);
        minutes = minutes.substr(minutes.length-2);
     body = body.replace(/{initaltime}/g, hour + ":" + minutes);
    
    res.send(template(headline,body,true));
}

function post(req,res) {
    req.body.uniqueid = new Date().getTime();
    req.body.originaltime = req.body.time;
    req.body.stage = 0;
    console.log(req.body);

    //variables.devices.forEach(function(device) {
        //console.log('DeviceID : ' + device.id);
    //    if (device.id == req.body.deviceid) {
    //        device.schedule.push(req.body);
    //    }
    //});
    //variables.savetofile = true;
    //res.send('Schedule has been created.');
}

exports.get = get;
exports.post = post;