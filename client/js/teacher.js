/*
# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn -- www.alexquinn.org
#          Anne Rose -- www.cs.umd.edu/hcil/members/arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

// TODO: Need to generalize action definitions.
// TODO: Update data panes w/ incoming student action
// TODO: Pass incoming actions off to appropriate handlers

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

function initializeTeacher() {
	openChannel();
	updateData();
	initUI();
}

function initUI() {
	// lesson and task info
    var lesson = g_lessons[0];
    var lesson_code = lesson.lesson_code;
    $('#lesson_title').html(lesson.title);
    $('#lesson_code').html(lesson_code);
    
	var taskChooserHtml = '';
	for (var i=0; i<lesson.tasks.length; i++) {
		var taskNum = i+1;
		var task = lesson.tasks[i];
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
    
    // sidebar: lesson buttons
    var utc_offset_minutes = (new Date()).getTimezoneOffset();
    html = '<button class="cssbtn" id="edit_lesson_btn_'+lesson_code+'" onclick="goToLessonForm(\''+lesson_code+'\');">Edit activity<span class="edit"></span></button><br/>';
	html += '<button class="cssbtn" id="stop_lesson_btn_'+lesson_code+'" style="display:none" onclick="stopLesson(\''+lesson_code+'\')">Stop activity<span class="stop"></span></button>';
	html += '<button class="cssbtn" id="start_lesson_btn_'+lesson_code+'" style="display:none" onclick="startLesson(\''+lesson_code+'\')">Start activity<span class="start"></span></button><br/>';
	html += '<button class="cssbtn" id="clone_lesson_btn_'+lesson_code+'" onclick="cloneLesson(\''+lesson_code+'\', false)">Clone activity</button><br/>';
    html += '<button class="cssbtn" id="download_lesson_btn_'+lesson_code+'" onclick="downloadLesson(\''+lesson_code+'\')">Download data<span class="dl"></span></button><br/>' 
    html += '<button class="cssbtn" id="clear_lesson_btn_'+lesson_code+'" onclick="clearLesson(\''+lesson_code+'\', false)">Clear data<span class="clr"></span></button><br/>';
    html += '<button class="cssbtn" id="delete_lesson_btn_'+lesson_code+'" onclick="deleteLesson(\''+lesson_code+'\')">Delete activity<span class="del"></span></button>';
    $('#side_button_bar2').html(html);

    // default data pane
    initPane(START_PANE);
}

function updateUI() {
	// if lesson not defined, redirect to dashboard
	if (g_lessons.length==0) {
		window.location = '/teacher_dashboard';
		return;
	}
	
	// update sidebar and header info
    var lesson = g_lessons[0];
    var lesson_code = lesson.lesson_code;
    updateTaskDescription(selectedTaskIdx());
    setPaneButtonHtml(STUDENT_PANE, g_dataPanes[STUDENT_PANE]);
	for (paneKey in g_customDataPanes) {
		setPaneButtonHtml(paneKey, g_customDataPanes[paneKey]);
	}
    $('#stop_lesson_btn_'+lesson_code).toggle(lesson.is_active);
	$('#start_lesson_btn_'+lesson_code).toggle(!lesson.is_active);
	$("#num_students").html(getLoggedInStudentCount());
	$('#inactive').toggle(!g_lessons[0].is_active);	
}

function initPane(pane) {
	g_currentPane = pane;
	g_activeAccordionIndex = false;
	g_activeAccordionKey = null;
	loadPane();
}

function getPaneButtonId(paneName) {
	return "load_" + paneName + "_btn";
}

function getPaneButtonHtml(paneKey, paneData) {
	var buttonId = getPaneButtonId(paneKey);
	return '<button class="load_btn cssbtn" id="'+buttonId+'" onclick="initPane(\''+paneKey+'\')">'+paneData.title+'</button>';
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
			var task_idx = selectedTaskIdx();
			if (typeof(g_action_counts[task_idx][paneKey]) != "undefined") {
				itemCount = g_action_counts[task_idx][paneKey];
			}
			break;
	}
	return itemCount;
}

function loadPane() {	
	updateUI();
	$('.load_btn').removeClass("selected");
	$("#"+getPaneButtonId(g_currentPane)).addClass("selected");

	switch (g_currentPane) {
		case STUDENT_PANE:
			loadStudentPane();
			break;
		case HISTORY_PANE:
			loadTaskHistoryPane();
			break;
		default:
			if (typeof(loadCustomPane) == "function") {
				loadCustomPane(g_currentPane, $("#data_pane"));
			}
			else {
				$("#data_pane").html("");
			}
			break;
	}
		
	window.location.hash = g_currentPane;
}

function updatePane() {
	loadPane();
}

$(window).resize(function() {
	if (g_currentPane == STUDENT_PANE) {
		// TODO: fix
		//drawStudentHistories(xx);
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
		$.post('/channel_expired/'+g_lessons[0].lesson_code, {}, updateChannelToken, 'json');
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
    var lesson = g_lessons[0];
    var lesson_code = lesson.lesson_code;
	if (action.lesson_code == lesson_code) {
		var student = g_students[action.student_nickname];
		if (student==undefined ) {
			student = {};
			student.is_logged_in = true;
			student.task_idx = action.action_data.task_idx;		
			student.task_history = [];
			var numTasks = numberOfTasks();
			for (var i=0; i<numTasks; i++) {
				student.task_history.push([]);
			}
			g_students[action.student_nickname] = student;
		}
		else {
			student.is_logged_in = true;
			student.task_idx = action.action_data.task_idx;
		}
		
		// TODO: Improve performance. Do not update entire pane.
		updatePane();
	}
}

function handle_log_out(data) {
    var lesson = g_lessons[0];
    var lesson_code = lesson.lesson_code;
	if (data.lesson_code==lesson_code && g_students[data.student_nickname]!=undefined) {
		g_students[data.student_nickname].is_logged_in = false;
		// TODO: Improve performance. Do not update entire pane.
		updatePane();
	}
}

function handle_action(data) {
	var task_idx = data.action_data.task_idx;
	g_task_histories[task_idx].push(data);
	g_students[data.student_nickname].task_history[task_idx].push(data);	
	g_action_counts[task_idx][data.action_type] = g_action_counts[task_idx][data.action_type] + 1;
	
	if (task_idx == selectedTaskIdx()) {
		// TODO: Improve performance. Do not update entire pane.
		updatePane();
	}
}

//=================================================================================
// UI Tasks
//=================================================================================

function onTaskChanged(taskIdx) {
	// onTaskChanged is called from js/task_chooser.js
	initPane(START_PANE);
}

function updateTaskDescription(taskIdx) {
	var html = g_lessons[0].tasks[taskIdx][1];
	if (html == '') html = '(none)';
	$('#task_description').html(html);
}

//=================================================================================
// Student Pane
//=================================================================================

function loadStudentPane() {
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

function StudentAccordion(div, accumulator) {
	AccordionList.call(this, div, accumulator);
}

StudentAccordion.prototype = Object.create(AccordionList.prototype);

StudentAccordion.prototype.expandedItem = function(item, i) {
	var html = "<h5>Task History</h5>\n";
	html += getStudentHistoryAsHTML(item.getKey());
	return html;
}

StudentAccordion.prototype.show = function() {
	AccordionList.prototype.show.call(this);
	$(".logout_btn").click(function(event) {
		event.stopPropagation();
		var lesson = g_lessons[0];
		var lessonCode = lesson.lesson_code;
		logoutStudent($(this).val(), lessonCode);
	});
	
	drawStudentHistories(this.items);
}

StudentAccumulator.prototype = new DataAccumulator();
StudentAccumulator.prototype.constructor = StudentAccumulator;
function StudentAccumulator() {
	DataAccumulator.call(this);
	this.sortBy = "login";
}

StudentAccumulator.prototype.getItems = function() {
	// sort names alphabetically w/logged in users on top
	if (this.sortBy == "login") {
		var items = dict2Array(this.dict);
		items.sort(function(a,b) {
			if (a.data.is_logged_in==true && b.data.is_logged_in==false) {
				return -1;
			}
			else if (a.data.is_logged_in==false && b.data.is_logged_in==true) {
				return 1;
			}
			else {
				var aName = a.data.nickname.toLowerCase();
				var bName = b.data.nickname.toLowerCase();
				return (aName > bName ? 1 : (aName < bName ? -1 : 0));
			}
		});		
	}
	// sort alphabetically
	else {
		items = DataAccumulator.prototype.getItems.call(this);
	}
	return items;
}

StudentDataItem.prototype = new DataItem();
StudentDataItem.prototype.constructor = StudentDataItem;
function StudentDataItem(key, data) {
	DataItem.call(this, key, data);
}
	
StudentDataItem.prototype.asHTML = function(i) {
	var className = (this.data.is_logged_in===false ? "studentLoggedOut" : "studentLoggedIn");
	var html = '<span class="' + className + '" style="font-size:1em;">' + this.getKey() + '</span>';
	if (this.data.is_logged_in) {
			html += ' <button class="logout_btn" value="'+this.getKey()+'" title="Logout student">X</button>';
	}
	html += '<div id="student'+(i+1)+'_history" class="student_history" style="float:right; margin-right:5px"></div></a>';
	return html;	
}

//=================================================================================
// History Pane
//=================================================================================

function loadTaskHistoryPane() {	
	var html = '<h3 id="pane_title" style="margin-bottom:10px">'+g_dataPanes[HISTORY_PANE].title+'</h3>';
	html += getTaskHistoryAsHTML();
	$("#data_pane").html(html);
}

function getTaskHistoryAsHTML() { 
	var html = '';
	var task = selectedTaskIdx()+1;
	var taskHistory = g_task_histories[task-1];
	// old on top
 	//for (var i=0; i<taskHistory.length; i++) {
	// new on top
 	for (var i=taskHistory.length-1; i>=0; i--) {
 		var action = taskHistory[i];
 		var actionType = action.action_type;
		var actionDescription = action.action_description && action.action_description!="" ? action.action_description : "-";
		var actionTime = getLocalTime(new Date(action.timestamp)); 		
		html += '<tr>';
		html += '<td style="width:17ex">' + '<div style="width:'+ACTION_DIM+'px;height:'+ACTION_DIM+'px !important;background:'+getActionColor(actionType)+'; float:left; margin-right:4px; margin-top:7px;">&nbsp;</div> ' + actionType.replace(" ", "&nbsp;") + '</td>';
		html += '<td>' + actionDescription + '</td>';
 		html += '<td style="width:13ex">'+action.student_nickname+'</td>';
		html += '<td style="width:15ex">' + getFormattedTimestamp(actionTime) + '</td>';
		html += '</tr>';
 	}

    if (html != '') {
    	var rowHtml = html;
		html = '<table class="task_history">';
 		html += '<tr>';
 		html += '<td style="width:17ex"><h6>Task</h6></td>';
 		html += '<td>&nbsp;</td>'
 		html += '<td style="width:13ex"><h6>Student</h6></td>';
 		html += '<td style="width:15ex"><h6>Time</h6></td>';
 		html += '</tr>';
		html += rowHtml;
		html += '</table>';
 	}
 	else {
 		html = '(none)';
 	}

 	return html;
}

function getStudentHistoryAsHTML(studentNickname) { 
    var task = selectedTaskIdx()+1;
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

function drawStudentHistories(items) {
    for (var i=0; i<items.length; i++) {
    	var item = items[i];
    	drawStudentHistory($('#student'+(i+1)+'_history'), item.getKey()); 
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
    
    var task = selectedTaskIdx()+1;
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
 		
     	actionHtml += '<div id="event_'+(i+1)+'" title="'+escapeDoubleQuotesForHtml(actionType+': '+actionDescription)+'" style="width:'+ACTION_DIM+'px;height:'+ACTION_DIM+'px !important;background:'+getActionColor(actionType)+';float:left;margin-right:'+actionMargin+'px;margin-top:'+topMargin+'px;">&nbsp;</div>';
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
	for (var task_idx=0; task_idx<g_lessons[0].tasks.length; task_idx++) {
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