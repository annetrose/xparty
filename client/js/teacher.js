/*
# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn -- www.alexquinn.org
#          Anne Rose -- www.cs.umd.edu/hcil/members/arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

// TODO: Update data panes w/ incoming student action

// data panes
var STUDENT_PANE = "students";
var HISTORY_PANE = "history";
var g_dataPanes = {};
var g_customDataPanes = {};
g_dataPanes[STUDENT_PANE] = { title: 'Students' };
g_dataPanes[HISTORY_PANE] = { title: 'Task History' };
var START_PANE = STUDENT_PANE;
var g_currentPane = null;
var g_action_counts = [];

// visual histories
var ACTION_DIM = 6; // pixels
var ACTION_COLORS = { default:'#888888' };

function initTeacher() {
	openChannel();
	updateData();
	initUI();
}

function initUI() {
	// activity and task info
    $('#activity_title').html(g_activity.title);
    $('#activity_code').html(g_activity.activity_code);
    
	var taskChooserHtml = '';
	for (var i=0; i<g_activity.tasks.length; i++) {
		var taskNum = i+1;
		var task = activity.tasks[i];
		var taskTitle = task[0];
		taskChooserHtml += '<option id="task_title_'+i+'" value="'+taskNum+'">'+taskNum+'.&nbsp;'+taskTitle+'</option>';
	}
	$('#task_chooser').html(taskChooserHtml);
    $('#task_chooser').selectbox();
    
    // sidebar: data pane buttons
    var html = getPaneButtonHtml(STUDENT_PANE, g_dataPanes[STUDENT_PANE]);
    for (paneKey in g_customDataPanes) {
    	var paneData = g_customDataPanes[paneKey];
    	html += getPaneButtonHtml(paneKey, paneData);
    }
    html += getPaneButtonHtml(HISTORY_PANE, g_dataPanes[HISTORY_PANE]);
    $('#side_button_bar').html(html);
    
    // sidebar: activity buttons
    var utc_offset_minutes = (new Date()).getTimezoneOffset();
    html = '<button class="cssbtn" id="edit_activity_btn_'+g_activity.activity_code+'" onclick="goToActivityForm(\''+g_activity.activity_code+'\');">Edit activity<span class="edit"></span></button><br/>';
	html += '<button class="cssbtn" id="stop_activity_btn_'+g_activity.activity_code+'" style="display:none" onclick="stopActivity(\''+g_activity.activity_code+'\')">Stop activity<span class="stop"></span></button>';
	html += '<button class="cssbtn" id="start_activity_btn_'+g_activity.activity_code+'" style="display:none" onclick="startActivity(\''+g_activity.activity_code+'\')">Start activity<span class="start"></span></button><br/>';
	html += '<button class="cssbtn" id="clone_activity_btn_'+g_activity.activity_code+'" onclick="cloneActivity(\''+g_activity.activity_code+'\', false)">Clone activity</button><br/>';
    html += '<button class="cssbtn" id="download_activity_btn_'+g_activity.activity_code+'" onclick="downloadActivity(\''+g_activity.activity_code+'\')">Download data<span class="dl"></span></button><br/>' 
    html += '<button class="cssbtn" id="clear_activity_btn_'+g_activity.activity_code+'" onclick="clearActivity(\''+g_activity.activity_code+'\', false)">Clear data<span class="clr"></span></button><br/>';
    html += '<button class="cssbtn" id="delete_activity_btn_'+g_activity.activity_code+'" onclick="deleteActivity(\''+g_activity.activity_code+'\')">Delete activity<span class="del"></span></button>';
    $('#side_button_bar2').html(html);

    // data pane
    var pane = window.location.hash ? window.location.hash.replace("#", "") : START_PANE;
    init_pane(pane);
}

function updateUI() {
	// if activity not defined, redirect to dashboard
	if (g_activities.length==0) {
		window.location = '/teacher_dashboard';
		return;
	}
	
	// update sidebar and header info
    var activity = g_activities[0];
    var activity_code = activity.activity_code;
    updateTaskDescription(selected_task_idx());
    setPaneButtonHtml(STUDENT_PANE, g_dataPanes[STUDENT_PANE]);
	for (paneKey in g_customDataPanes) {
		setPaneButtonHtml(paneKey, g_customDataPanes[paneKey]);
	}
    $('#stop_activity_btn_'+activity_code).toggle(activity.is_active);
	$('#start_activity_btn_'+activity_code).toggle(!activity.is_active);
	$("#num_students").html(getLoggedInStudentCount());
	$('#inactive').toggle(!g_activities[0].is_active);	
}

function init_pane(pane) {
	g_currentPane = pane;
	load_pane();
}

function getPaneButtonId(paneName) {
	return "load_" + paneName + "_btn";
}

function getPaneButtonHtml(paneKey, paneData) {
	var buttonId = getPaneButtonId(paneKey);
	return '<button class="load_btn cssbtn" id="'+buttonId+'" onclick="init_pane(\''+paneKey+'\')">'+paneData.title+'</button>';
}

function setPaneButtonHtml(paneKey, paneData) {
    var itemCount = getPaneItemCount(paneKey);
    $('#'+getPaneButtonId(paneKey)).html(paneData.title+(itemCount!=-1?" ("+itemCount+")":""));
}

function getPaneItemCount(paneKey) {
	var itemCount = -1;
	switch (paneKey) {
		case STUDENT_PANE:
			itemCount = getStudentCount();
			break;
		case HISTORY_PANE:
			break;
		default:
			var task_idx = selected_task_idx();
			if (typeof(g_action_counts[task_idx][paneKey]) != "undefined") {
				itemCount = g_action_counts[task_idx][paneKey];
			}
			break;
	}
	return itemCount;
}

function load_pane() {	
	updateUI();
	$('.load_btn').removeClass("selected");
	$("#"+getPaneButtonId(g_currentPane)).addClass("selected");

	switch (g_currentPane) {
		case STUDENT_PANE:
			load_student_pane();
			break;
		case HISTORY_PANE:
			load_history_pane();
			break;
		default:
			if (typeof(load_custom_pane) == "function") {
				load_custom_pane(g_currentPane, $("#data_pane"));
			}
			else {
				$("#data_pane").html("");
			}
			break;
	}
		
	window.location.hash = g_currentPane;
}

function update_pane(action) {
	switch (g_currentPane) {
		case STUDENT_PANE:
			update_student_pane(action);
			break;
		case HISTORY_PANE:
			update_history_pane(action);
			break;
		default:
			var task_idx = action.action_data.task_idx;
			if (typeof(update_custom_pane) == "function" && task_idx == selected_task_idx()) {
				update_custom_pane(g_currentPane, action);
			}
			break;
	}
}

function get_student_list_html(student_dict) {
	 var html = "";
     html += "<h5>Students</h5>";
     html += "<ol>";
     var student_keys = sortKeysAlphabetically(student_dict);
     for (var j=0; j<student_keys.length; j++) {
         var student_nickname = student_keys[j];
         var count = student_dict[student_nickname].length;
         html += '<li class="data_display_item">';
         html += '<a href="javascript:show_student('+"'"+htmlEscape(student_nickname)+"'"+');">'+student_nickname+'</a>';
         html += count > 1 ? " ("+count+")" : "";
         html += '</li>\n';
     }
     html += "</ol>";
     return html;
}

function show_student(student_nickname) {
	init_pane(STUDENT_PANE);
	open_accordion_key(htmlUnescape(student_nickname));
}

$(window).resize(function() {
	if (g_currentPane == STUDENT_PANE) {
		drawStudentHistories();
	}
});

// initialize any data structures derived from data sent from server
function updateData() {	
	updateHistoryData();
	if (typeof(updateCustomData) != "undefined") {
		updateCustomData();
	}
}

//=================================================================================
// Channel Presence
//=================================================================================

function openChannel() {
	var channel = new goog.appengine.Channel(TOKEN);
	var socket = channel.open();
	socket.onopen = onSocketOpen;
	socket.onmessage = onSocketMessage;
	socket.onerror = onSocketError;
	socket.onclose = onSocketClose;
}

function onSocketMessage(msg) {
	// Note:  Messages are limited to 32K.  
	// http://code.google.com/appengine/docs/python/channel/overview.html

	actions = JSON.parse(msg.data);
	var num_actions = actions.length;
	for(var i=0; i<num_actions; i++) {
		var action = actions[i];
		switch(action.action_type) {
			case "log_in":
				handle_log_in(action);
				break;
			case "log_out":
				handle_log_out(action);
				break;
			case "task":
				// do nothing
				break;
			default:
				handle_action(action);
				break;
		}
	}
}

function onSocketOpen() {
}

function onSocketError(error) {
	if (error.code==401) {
		$.post('/channel_expired/'+g_activities[0].activity_code, {}, updateChannelToken, 'json');
	}
}

function onSocketClose() {
}

function updateChannelToken(data) {
	TOKEN = data['token'];
	openChannel();
}

//=================================================================================
// Message Handlers
//=================================================================================

function handle_log_in(action) {
    var activity = g_activities[0];
    var activity_code = activity.activity_code;
	if (action.activity_code == activity_code) {
		var student = g_students[action.student_nickname];
		if (student==undefined ) {
			student = {};
			student.is_logged_in = true;
			student.task_idx = action.action_data.task_idx;		
			student.task_history = [];
			var numTasks = number_of_tasks();
			for (var i=0; i<numTasks; i++) {
				student.task_history.push([]);
			}
			g_students[action.student_nickname] = student;
		}
		else {
			student.is_logged_in = true;
			student.task_idx = action.action_data.task_idx;
		}
		update_pane(action);
	}
}

function handle_log_out(action) {
    var activity = g_activities[0];
    var activity_code = activity.activity_code;
	if (action.activity_code==activity_code && g_students[action.student_nickname]!=undefined) {
		g_students[action.student_nickname].is_logged_in = false;
		update_pane(action);
	}
}

function handle_action(action) {
	var task_idx = action.action_data.task_idx;
	g_task_histories[task_idx].push(action);
	g_students[action.student_nickname].task_history[task_idx].push(action);	
	g_action_counts[task_idx][action.action_type] = g_action_counts[task_idx][action.action_type] + 1;
	update_pane(action);
}

//=================================================================================
// UI Tasks
//=================================================================================

function onTaskChanged(taskIdx) {
	// onTaskChanged is called from js/task_chooser.js
	init_pane(START_PANE);
}

function updateTaskDescription(taskIdx) {
	var html = g_activities[0].tasks[taskIdx][1];
	if (html == '') html = '(none)';
	$('#task_description').html(html);
}

//=================================================================================
// Student Pane
//=================================================================================

function load_student_pane() {
	var accumulator = new StudentAccumulator();
	for (var studentNickname in g_students) {
		var isLoggedIn = g_students[studentNickname].is_logged_in;
		var item = new StudentDataItem(studentNickname, { "nickname":studentNickname, "is_logged_in":isLoggedIn });
		accumulator.add(item);
	}
	
	var html = '<h3 id="pane_title" style="margin-bottom:10px">'+g_dataPanes[STUDENT_PANE].title+'</h3>';
	html += '<div id="data_list"></div>';
	$("#data_pane").html(html);
	
	var accordion = new StudentAccordion($("#data_list"), accumulator);
	accordion.show();
}

function update_student_pane(action) {
	var is_student_action = action.action_type == "log_in" || action.action_type == "log_out";
	if (g_accordion && is_student_action) {
		var student_nickname = action.student_nickname
		var is_logged_in = g_students[student_nickname].is_logged_in;
		var item = new StudentDataItem(student_nickname, { "nickname":student_nickname, "is_logged_in":is_logged_in });
        g_accordion.accumulator.add(item);
        g_accordion.show();
    }
}

function StudentAccordion(div, accumulator) {
	AccordionList.call(this, div, accumulator);
}
StudentAccordion.prototype = Object.create(AccordionList.prototype);

StudentAccordion.prototype.expandedItem = function(key, i) {
	var html = "<h5>Task History</h5>\n";
	html += getStudentHistoryAsHTML(key);
	return html;
}

StudentAccordion.prototype.show = function(update) {
	AccordionList.prototype.show.call(this, update);
	$(".logout_btn").click(function(event) {
		event.stopPropagation();
		var activity = g_activities[0];
		var activityCode = activity.activity_code;
		logoutStudent($(this).val(), activityCode);
	});
	
	drawStudentHistories(this.accumulator.keys);
}

StudentAccordion.prototype.itemHeader = function(key, i) {
	var is_logged_in = this.accumulator.getValue(key, "is_logged_in");
	var class_name = is_logged_in===false ? "studentLoggedOut" : "studentLoggedIn";
	var html = '<span class="' + class_name + '" style="font-size:1em;">' + key + '</span>';
	if (is_logged_in) {
			html += ' <button class="logout_btn" value="'+ key +'" title="Logout student">X</button>';
	}
	html += '<div id="student'+(i+1)+'_history" class="student_history" style="float:right; margin-right:5px"></div></a>';
	return html;	
}

StudentAccumulator.prototype = new DataAccumulator();
StudentAccumulator.prototype.constructor = StudentAccumulator;
function StudentAccumulator() {
	DataAccumulator.call(this);
	this.sortBy = "Login Status";
	this.sortOptions = ["ABC", "Login Status"]; 
}

StudentAccumulator.prototype.getKeys = function(update) {
	update = (typeof(update) == "undefined") ? true : update;
	if (update) {		
		// sort names alphabetically w/logged in users on top
		if (this.sortBy == "Login Status") {
			this.keys = [];
			for (key in this.dict) {
				this.keys.push(key);
			}
			var accumulator = this;
			this.keys.sort(function(a,b) {
				if (accumulator.getValue(a, "is_logged_in")==true && accumulator.getValue(b, "is_logged_in")==false) {
					return -1;
				}
				else if (accumulator.getValue(a, "is_logged_in")==false && accumulator.getValue(b, "is_logged_in")==true) {
					return 1;
				}
				else {
					var aName = accumulator.getValue(a, "nickname").toLowerCase();
					var bName = accumulator.getValue(b, "nickname").toLowerCase();
					return (aName > bName ? 1 : (aName < bName ? -1 : 0));
				}
			});		
		}
		// sort alphabetically
		else {
			this.keys = DataAccumulator.prototype.getKeys.call(this, update);
		}
	}
	return this.keys;
}

StudentDataItem.prototype = new DataItem();
StudentDataItem.prototype.constructor = StudentDataItem;
function StudentDataItem(key, data) {
	DataItem.call(this, key, data);
}

//=================================================================================
// History Pane
//=================================================================================

function load_history_pane() {	
	var html = '<h3 id="pane_title" style="margin-bottom:10px">'+g_dataPanes[HISTORY_PANE].title+'</h3>';
	html += '<div id="history"></div>';
	$("#data_pane").html(html);
	$('#history').html(getTaskHistoryAsHTML());
}

function update_history_pane(action) {
	var is_student_action = action.action_type == "log_in" || action.action_type == "log_out";
	if (!is_student_action) {
		var html = getTaskRow(action);
		var existingHtml = $("#task_actions").html();
		html += existingHtml.replace("<tbody>", "").replace("</tbody>", "");
		$("#task_actions").html(html);
	}
}

function getTaskHistoryAsHTML() { 
	var html = '';
	var task = selected_task_idx()+1;
	var taskHistory = g_task_histories[task-1];
	// old on top
 	//for (var i=0; i<taskHistory.length; i++) {
	// new on top
 	for (var i=taskHistory.length-1; i>=0; i--) {
 		var action = taskHistory[i];
 		html += getTaskRow(action);
 	}

 	return (html != '') ? getTaskHeader() + getTaskRows(html) : '(none)';
}

function getTaskHeader() {
	var html = '<table class="task_history">';
	html += '<tr>';
 	html += '<td style="width:17ex"><h6>Task</h6></td>';
 	html += '<td>&nbsp;</td>'
 	html += '<td style="width:13ex"><h6>Student</h6></td>';
 	html += '<td style="width:15ex"><h6>Time</h6></td>';
 	html += '</tr>';
 	html += '</table>';
 	return html;
}

function getTaskRow(action) {
	var actionType = action.action_type;
	var actionDescription = action.action_description && action.action_description!="" ? action.action_description : "-";
	var actionTime = getLocalTime(new Date(action.timestamp));
	var html = '<tr>';
	html += '<td style="width:17ex">' + '<div style="width:'+ACTION_DIM+'px;height:'+ACTION_DIM+'px !important;background:'+getActionColor(actionType)+'; float:left; margin-right:4px; margin-top:7px;">&nbsp;</div> ' + actionType.replace(" ", "&nbsp;") + '</td>';
	html += '<td>' + actionDescription + '</td>';
	html += '<td style="width:13ex">'+action.student_nickname+'</td>';
	html += '<td style="width:15ex">' + getFormattedTimestamp(actionTime) + '</td>';
	html += '</tr>';
	return html;
}

function getTaskRows(html) {
	return '<table id="task_actions" class="task_history">' + html + '</table>';
}

function getStudentHistoryAsHTML(studentNickname) { 
    var task = selected_task_idx()+1;
    var student = g_students[studentNickname];
	var taskHistory = student.task_history[task-1];
	
	if (taskHistory.length == 0) {
		var html = '<div style="margin-bottom:15px;">(none)</div>';			
	}
	
	else {
		var html = '<table class="task_history">';
		// old on top
		//for (var i=0; i<taskHistory.length; i++) {
		// new on top
		for (var i=taskHistory.length-1; i>=0; i--) {
			var action = taskHistory[i];
			var actionTime = getLocalTime(new Date(action.timestamp));
			var actionType = action.action_type;
			var actionDescription = action.action_description && action.action_description!="" ? action.action_description : "-";
			html += '<tr>';
			html += '<td style="width:17ex">' + '<div style="width:'+ACTION_DIM+'px;height:'+ACTION_DIM+'px !important;background:'+getActionColor(actionType)+'; float:left; margin-right:4px; margin-top:7px;">&nbsp;</div> ' + actionType.replace(" ", "&nbsp;") + '</td>';
			html += '<td>' + actionDescription + '</td>';
			html += '<td style="width:15ex">' + getFormattedTimestamp(actionTime) + '</td>';
			html += '</tr>';
		}
		html += '</table>';
	}
 	
 	return html;
}

function drawStudentHistories(keys) {
	// if no keys provided, use accumulator keys of current accordion list
	if (typeof(keys) == "undefined") {
		keys = g_accordion.accumulator.keys;
	}
    for (var i=0; i<keys.length; i++) {
    	drawStudentHistory($('#student'+(i+1)+'_history'), keys[i]); 
    };
}

function drawStudentHistory(div, studentNickname) {
	var actionMargin = 1; // pixels
	var historyHeight = 20; // pixels
	var historyWidth = Math.ceil($('#accordion_list').width() * 0.35); // pixels
	var ellipsesWidth = 15; // pixels
	var largeGap = 15 * 60 * 1000; // 15 min (in ms)
	var topMargin = Math.floor((historyHeight/2)-(ACTION_DIM/2));
    var maxNumActionsToDraw = Math.floor((historyWidth-ellipsesWidth)/(ACTION_DIM+actionMargin))-2;

    $('.student_history').width(historyWidth);
    
    var task = selected_task_idx()+1;
 	var searchHistoryHtml = [];
    var student = g_students[studentNickname];
	var taskHistory = student.task_history[task-1];
	var numTasksDrawn = 0;
 	for (var i=0; i<taskHistory.length; i++) {
 		var actionHtml = '';
 		var action = taskHistory[i];
 		var actionType = action.action_type;
		var actionDescription = action.action_description && action.action_description!="" ? action.action_description : "-";

     	if (i>0) {
 			var actionTime = getLocalTime(new Date(action.timestamp));
 			var prevActionTime = getLocalTime(new Date(taskHistory[i-1].timestamp));
 			var isLargeGap = (actionTime.getTime()-prevActionTime.getTime())>=largeGap;
     		if (isLargeGap) {
 				actionHtml += '<div class="largegap" style="width:1px;height:20px !important;background:grey;float:left;margin-right:'+actionMargin+'px;"></div>';
 			}
 		}
 		
     	actionHtml += '<div id="event_'+(i+1)+'" title="'+htmlEscape(actionType+': '+actionDescription)+'" style="width:'+ACTION_DIM+'px;height:'+ACTION_DIM+'px !important;background:'+getActionColor(actionType)+';float:left;margin-right:'+actionMargin+'px;margin-top:'+topMargin+'px;">&nbsp;</div>';
 		searchHistoryHtml.push(actionHtml);
 	}
 	
 	// show up to numActionsToRemove of most recent tasks
    // and show ellipses (...) at beginning if more than maxNumActionsToDraw
    var numActionsToRemove = 0;
    if (searchHistoryHtml.length > maxNumActionsToDraw) {
    	numActionsToRemove = searchHistoryHtml.length - maxNumActionsToDraw;
 	}

 	for (var i=0; i<numActionsToRemove; i++) {
 		searchHistoryHtml.shift();
 	}
 	
 	var html = searchHistoryHtml.join('');
 	if (numActionsToRemove > 0) {
 		html = '<div style="width:'+ellipsesWidth+'px;height:'+ACTION_DIM+'px !important;float:left;">...</div>' + html;
 	}
 	else {
 		html = '<div style="width:'+ellipsesWidth+'px;height:'+ACTION_DIM+'px !important;float:left">&nbsp;</div>' + html;
 	}
 	
 	if (div==null) {
 		var sectionIndex = getStudentSection(studentNickname);
 		div = $('#student'+(sectionIndex+1)+'_history');
 	}
 	div.html(html);
}

function getStudentSection(studentNickname) {
	var section = -1;
	$.each($('.nickname'), function(i,child) {
		var span = $(child);
		if (span.html() == studentNickname) {
			section = i;
			return false;
		}
	});
	return section;
}

function getActionColor(type) {
	return typeof ACTION_COLORS[type] != "undefined" ? ACTION_COLORS[type] : ACTION_COLORS['default'];
}

//=================================================================================
// History Data
//=================================================================================

function updateHistoryData() {
	for (var student_nickname in g_students) {
		g_students[student_nickname].task_history = [];
		for (var task_idx=0; task_idx<g_task_histories.length; task_idx++) {
			g_students[student_nickname].task_history.push([]);
		}
	}

	g_action_counts = [];
	for (var task_idx=0; task_idx<g_activities[0].tasks.length; task_idx++) {
		var counts = {};
		for (var paneKey in g_customDataPanes) {
            counts[paneKey] = 0;
        }
		g_action_counts.push(counts);
		
		if (g_task_histories.length > 0) {
			var task_history = g_task_histories[task_idx];
			for (var j=0; j<task_history.length; j++) {
				var action = task_history[j];
				var type = action.action_type;
				g_students[action.student_nickname].task_history[task_idx].push(action);
				var counts = g_action_counts[task_idx];
				counts[type] = counts[type] + 1;      
			}
		}
	}
}