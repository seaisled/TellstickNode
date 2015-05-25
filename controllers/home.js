// Include the template view (Do all the presentation(?))
var variables = require('../model/variables');
var template = require('../views/template-main');
var schedulefunctions = require('./schedulefunctions');
var sharedfunctions = require('../model/sharedfunctions');

// Define the get function that will return the content..?
function get(request, response) {
    
    var currenttimestamp = new Date();
    var today = currenttimestamp.getUTCDay();
        
    // Define the different parts of the page.
    var headline = 'Home';
    var body = ['<div class="panel panel-default">',
                     '<div class="panel-heading">',
                        '<h5 class="panel-title">Schedule Control</h5>',
                    '</div>',
                    '<div class="panel-body">',
                        '<p class="text-info {schedulepauseclass}" id="pauseparagraph">Schedule status: <span id="schedulestatus">{schedulestatus}</span></p>',
                        '<button class="btn btn-default" onClick="pause_schedules()" id="pausebutton">{pausebutton} schedules</button> ',
                        '<button class="btn btn-default" onClick="reset_schedules()">Reset devices state</button',
                    '</div>',
                '</div>',
                '<div class="panel panel-default">',
                     '<div class="panel-heading">',
                        '<h5 class="panel-title">Filter view</h5>',
                    '</div>',
                    '<div class="panel-body">',
                        '<table class="table table-bordered">',
                            '<tr><td class="td-middle">By device:</td><td><select id="devicetoview">{devicetoview}</select></td></tr>',
                            '<tr><td class="td-middle">Schedules with status:</td><td><select id="schedulestoview">{schedulestoview}</select></td></tr>',
                            '<tr><td><button class="btn btn-default" onclick="filter_home();">Filter</button></td></tr>',   
                        '</table>',
                    '</div>',
                '</div>',
                '<div class="panel panel-default">',
                     '<div class="panel-heading">',
                        '<h5 class="panel-title">Available Devices</h5>',
                    '</div>',
                    '<div class="panel-body">',
                    '<table class="table table-bordered">',
                    '<tr><th>Status</th><th>Device</th></tr>',
                    '{available-devices}',
                    '</table>',
                    '</div>',
                '</div>',
                '<div class="panel panel-default">',
                    '<div class="panel-heading">',
                        '<h5 class="panel-title">Timers</h5>',
                    '</div>',
                    '<div class="panel-body">',
                    '<div class="table-responsive">',
                    '<table id="ScheduledEvents_Body_Table" cellpadding="0" cellspacing="0" class="table table-bordered">',
                    '<tr><th>Name</th><th>Duration</th><th>Day of Week</th><th>Time</th><th></th></tr>',
                    '{Timers}',
                    '</table>',
                    '</div>',
                    '</div>',
                '</div>',
                '<div class="panel panel-default">',
                    '<div class="panel-heading">',
                        '<h5 class="panel-title">Schedules</h5>',
                    '</div>',
                    '<div class="panel-body">',
                    '<div class="table-responsive">',
                    '<table id="ScheduledEvents_Body_Table" cellpadding="0" cellspacing="0" class="table table-bordered">',
                    '<tr><th>Name</th><th>Action</th><th>Controller</th><th>Day of Week</th><th>Time</th><th></th></tr>',
                    '{scheduled-devices}',
                    '</table>',
                    '</div>',
                    '</div>',
                '</div>',
                '<div class="panel panel-default">',
                    '<div class="panel-heading">',
                        '<h5 class="panel-title">Schedules by day</h5>',
                    '</div>',
                    '<div class="panel-body">',
                    '<table id="ScheduledEvents_Body_Table" cellpadding="0" cellspacing="0" class="table table-bordered">',
                    '{scheduled-devices-by-day}',
                    '</table>',
                    '</div>',
                '</div>'
                ];
    
    // Join each row of the body array to a continious string with proper row endings.
    body = body.join("\n");
    display_devices();
    
    
    
    // Define the function that enters devices into the device select box.
    // This function will be supplied to be used as a callback for when tdtool listing is done and fetching from 'database' is done.
    function display_devices () {
        var device_options = '';
        var available_devices = '';
        var schedules = '';
        var timers = '';
        var dayofweektranslate = {0:'Sunday',1:'Monday',2:'Tuesday',3:'Wednesday',4:'Thursday',5:'Friday',6:'Saturday'};
        var devicetoview = '';
        var selected_deviceid = 0;
        var selected_scheduletype = '';
    
        if(typeof(request.query.deviceid) != 'undefined') {
            selected_deviceid = request.query.deviceid;
        }
        
        if(typeof(request.query.scheduletype) != 'undefined') {
            selected_scheduletype = request.query.scheduletype;
        }
        
        variables.devices.forEach(function(device, index) {
            if (device.id == selected_deviceid) {
                devicetoview = devicetoview + '<option selected value="'+device.id + '">'+device.name;
            } else {
                devicetoview = devicetoview + '<option value="'+device.id + '">'+device.name;
            }
            
            device_options += '<option value="' + device.id + '">'+device.name + '\n';
            //available_devices += '<tr><td><button class="btn btn-default" id="commandbutton_' + device.id + '" onClick="switchdevicestatus(\'' + device.id + '\');">'+device.lastcommand+'</button></td><td>'+device.name+'</td></tr>';
            
            var status_on = '';
            var status_off = '';
            var status_dim = '';
            var dimbutton = '';
            
            if (device.lastcommand.toLowerCase() == 'on') {
                status_on = 'btn-success';
            }
            if (device.lastcommand.toLowerCase() == 'off') {
                status_off = 'btn-success';
            }
            if (device.lastcommand.toLowerCase() == 'dim') {
                status_dim = 'btn-success';
            }
            
            if (variables.options.showdimoption == 'true') {
                dimbutton = '<button disabled class="btn btn-default '+status_dim+'" id="commandbutton_' + device.id + '_dim" onClick="switchdevicestatus(\'' + device.id + '\',\'dim\');">DIM</button>';
            }
            available_devices += '<tr><td class="devicestatus"><button class="btn btn-default '+status_on+'" id="commandbutton_' + device.id + '_on" onClick="switchdevicestatus(\'' + device.id + '\',\'on\');">ON</button><button class="btn btn-default '+status_off+'" id="commandbutton_' + device.id + '_off" onClick="switchdevicestatus(\'' + device.id + '\',\'off\');">OFF</button>'+dimbutton+'</td><td>'+device.name+'</td></tr>';
            
            
            if(device.schedule.length > 0) {
                device.schedule.sort(sharedfunctions.dynamicSortMultiple('dayofweek','time'));
                device.schedule.forEach (function(singleschedule) {
                    var dayname = '';
                    var activeschedule = '';
                    
                    singleschedule.dayofweek.forEach(function(day) {
                        dayname += dayofweektranslate[day] + ', ';
                    });
                    dayname = dayname.substring(0,(dayname.length-2));
                    
                    if (device.activescheduleid == singleschedule.uniqueid) {
                                activeschedule = 'class="bg-success"';
                                
                    }
                    if ( (device.id == selected_deviceid) || (selected_deviceid == 0) ) {
                        if ( (selected_scheduletype == '') || (selected_scheduletype == singleschedule.enabled) ) {
                            if (singleschedule.controller != 'Timer') {
                                schedules += '<tr onclick="showscheduleinfo(\''+singleschedule.uniqueid+'\')"><td ' + activeschedule +'>' + device.name + '</td><td ' + activeschedule +'>'+  singleschedule.action +  '</td><td ' + activeschedule +'>'+ singleschedule.controller +'</td><td ' + activeschedule +'>'  + dayname + '</td><td ' + activeschedule +'>' + singleschedule.time + '</td><td ' + activeschedule +'><a class="btn btn-default" href="/editschedule?uniqueid='+singleschedule.uniqueid+'">Edit</a><button class="btn btn-default" onclick="removeschedule(\''+singleschedule.uniqueid+'\')">Remove</button></tr>';
                            } else {
                                timers += '<tr onclick="showscheduleinfo(\''+singleschedule.uniqueid+'\')"><td ' + activeschedule +'>' + device.name + '</td><td ' + activeschedule +'>'+  singleschedule.duration +  ' minutes</td><td ' + activeschedule +'>'  + dayname + '</td><td ' + activeschedule +'>' + singleschedule.time + '</td><td ' + activeschedule +'><a class="btn btn-default" href="/editschedule?uniqueid='+singleschedule.uniqueid+'">Edit</a><button class="btn btn-default" onclick="removeschedule(\''+singleschedule.uniqueid+'\')">Remove</button></tr>';
                            }
                        }
                    }
                });
            };
        });
        // Testing new shcedulethingy
        var sortedbyday = schedulefunctions.getschedulesbyday();
        var schedulesbyday = '';
        for (var key in sortedbyday) {
            if (sortedbyday.hasOwnProperty(key)) {
                
                var day = sortedbyday[key];
                
               
                
                schedulesbyday += '<tr><th colspan="4">'+ dayofweektranslate[key] +'</th></tr><tr><th>Name</th><th>Action</th><th>Controller</th><th>Time</th></tr>';
                if(day.length > 0) {
                    day.sort(sharedfunctions.dynamicSortMultiple('time'));
                    
                    day.forEach (function(singleschedule) {
                        var devicename = '';
                        var activeschedule = '';
                         variables.devices.forEach(function(device) {
                            if (device.id == singleschedule.deviceid) {
                                devicename = device.name;
                            }
                            
                            if ( (device.activescheduleid == singleschedule.uniqueid) && (device.activeday == key) ) {
                                activeschedule = 'class="bg-success"';
                                
                            }
                        }); 
                        if ( (singleschedule.deviceid == selected_deviceid) || (selected_deviceid == 0) ) {
                            if (singleschedule.controller != 'Timer') {
                                schedulesbyday += '<tr><td ' + activeschedule +'>' + devicename + '</td><td ' + activeschedule +'>'+  singleschedule.action +  '</td><td ' + activeschedule +'>'+ singleschedule.controller +'</td><td ' + activeschedule +'>' + singleschedule.time + '</td></tr>';
                            }
                        }
                    });
                } 
            }
        }
        
        devicetoview = '<option value="0">All' + devicetoview;
        // End of testing
        body = body.replace(/{scheduled-devices-by-day}/g,schedulesbyday);
        body = body.replace(/{scheduled-devices}/g,schedules);
        body = body.replace(/{select_device}/g,device_options);
        body = body.replace(/{available-devices}/g,available_devices);
        body = body.replace(/{Timers}/g,timers);
        body = body.replace(/{devicetoview}/g,devicetoview);
        body = body.replace(/{schedulestoview}/g,createdropdown_alphanumeric([['','Any'],['true','Enabled'],['false','Disabled']],selected_scheduletype));
        var schedulestatus = 'Running normal';
        var schedulepauseclass = '';
        var pausebutton = 'Pause';
        if(variables.pauseschedules) {
            schedulestatus = 'Paused';
            schedulepauseclass = 'bg-danger';
            pausebutton = 'Resume';
        }
        body = body.replace(/{schedulestatus}/g,schedulestatus);
        body = body.replace(/{schedulepauseclass}/g,schedulepauseclass);
        body = body.replace(/{pausebutton}/g,pausebutton);
    
        response.send(template.build(headline,body,true));
    }
    
   
}

exports.get = get;


function createdropdown_alphanumeric(options,selecteditem) {
    // Generate dropdown options with the value and display from 'options[[value,displayname]]'
    // Displayname is optional as a second paremeter to the array. If not present, value will be displayed.
    var dropdown = '';
    options.forEach(function(option) {
        var selected = '';
        if (selecteditem.toLowerCase() == option[0].toLowerCase()) {
            selected = 'selected';
        }
        
        var displayname = option[0];
        if (typeof(option[1]) != 'undefined') {
            displayname = option[1];
        }
        
        dropdown += '<option ' + selected + ' value="'+option[0]+'">'+displayname;
    });
    return dropdown;
}