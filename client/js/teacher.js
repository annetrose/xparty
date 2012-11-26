/*
# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn -- www.alexquinn.org
#          Anne Rose -- www.cs.umd.edu/hcil/members/arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

// data panes
var STUDENT_PANE = "students";
var HISTORY_PANE = "history";
var gDataPanes = [];
var gCurrentPaneKey = STUDENT_PANE;
var gActionCounts = [];

// visual histories
var ACTION_DIM = 6; // pixels
var ACTION_COLORS = { default:'#888888' };

function initTeacher() {
	openChannel();
	updateData();
	definePanes();
	initUI();
}

function initUI() {
	// activity and task info
    $('#activity_title').html(gActivity.title);
    $('#activity_code').html(gActivity.activity_code);
    
	var taskChooserHtml = "";
	for (var i=0; i<gActivity.tasks.length; i++) {
		var taskNum = i+1;
		var task = activity.tasks[i];
		var taskTitle = task[0];
		taskChooserHtml += '<option id="task_title_'+i+'" value="'+taskNum+'">'+taskNum+'.&nbsp;'+taskTitle+'</option>';
	}
	$('#task_chooser').html(taskChooserHtml);
    $('#task_chooser').selectbox();
    
    // sidebar: data pane buttons
    var buttonHtml = "";
    for (var i=0; i<gDataPanes.length; i++) {
    	buttonHtml += getPaneButtonHtml(gDataPanes[i].key);
    }
    $('#side_button_bar').html(buttonHtml);
    
    // sidebar: activity buttons
    var utc_offset_minutes = (new Date()).getTimezoneOffset();
    buttonHtml = '<button class="cssbtn" id="edit_activity_btn_'+gActivity.activity_code+'" onclick="goToActivityForm(\''+gActivity.activity_code+'\');">Edit activity<span class="edit"></span></button><br/>';
    buttonHtml += '<button class="cssbtn" id="stop_activity_btn_'+gActivity.activity_code+'" style="display:none" onclick="stopActivity(\''+gActivity.activity_code+'\')">Stop activity<span class="stop"></span></button>';
    buttonHtml += '<button class="cssbtn" id="start_activity_btn_'+gActivity.activity_code+'" style="display:none" onclick="startActivity(\''+gActivity.activity_code+'\')">Start activity<span class="start"></span></button><br/>';
    buttonHtml += '<button class="cssbtn" id="clone_activity_btn_'+gActivity.activity_code+'" onclick="cloneActivity(\''+gActivity.activity_code+'\', false)">Clone activity</button><br/>';
    buttonHtml += '<button class="cssbtn" id="download_activity_btn_'+gActivity.activity_code+'" onclick="downloadActivity(\''+gActivity.activity_code+'\')">Download data<span class="dl"></span></button><br/>' 
    buttonHtml += '<button class="cssbtn" id="clear_activity_btn_'+gActivity.activity_code+'" onclick="clearActivity(\''+gActivity.activity_code+'\')">Clear data<span class="clr"></span></button><br/>';
    buttonHtml += '<button class="cssbtn" id="delete_activity_btn_'+gActivity.activity_code+'" onclick="deleteActivity(\''+gActivity.activity_code+'\')">Delete activity<span class="del"></span></button>';
    $('#side_button_bar2').html(buttonHtml);

    // data pane
	initPaneData();
    var paneKey = window.location.hash ? window.location.hash.replace("#", "") : gDataPanes[0].key;
    showPane(paneKey);
}

function updateUI() {
	// if activity not defined, redirect to dashboard
	if (gActivities.length==0) {
		window.location = '/teacher_dashboard';
		return;
	}
	
	// update sidebar and header info
    var activity = gActivities[0];
    var activity_code = activity.activity_code;
    updateTaskDescription(selectedTaskIdx());
    for (var i=0; i<gDataPanes.length; i++) {
    	updatePaneButtonHtml(gDataPanes[i].key);
    }
    $('#stop_activity_btn_'+activity_code).toggle(activity.is_active);
	$('#start_activity_btn_'+activity_code).toggle(!activity.is_active);
	$("#num_students").html(getLoggedInStudentCount());
	$('#inactive').toggle(!gActivities[0].is_active);	
}

$(window).resize(function() {
	if (gCurrentPaneKey == STUDENT_PANE) {
		drawStudentHistories();
	}
});

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
				handleLogIn(action);
				break;
			case "log_out":
				handleLogOut(action);
				break;
			case "task":
				// do nothing
				break;
			default:
				handleAction(action);
				break;
		}
	}
}

function onSocketOpen() {
}

function onSocketError(error) {
	if (error.code==401) {
		$.post('/channel_expired/'+gActivities[0].activity_code, {}, updateChannelToken, 'json');
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

function handleLogIn(action) {
    var activity = gActivities[0];
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
		updatePane(action);
	}
}

function handleLogOut(action) {
    var activity = gActivities[0];
    var activity_code = activity.activity_code;
	if (action.activity_code==activity_code && g_students[action.student_nickname]!=undefined) {
		g_students[action.student_nickname].is_logged_in = false;
		updatePane(action);
	}
}

function handleAction(action) {
	var taskIdx = action.action_data.task_idx;
	gTaskHistories[taskIdx].push(action);
	g_students[action.student_nickname].task_history[taskIdx].push(action);	
	gActionCounts[taskIdx][action.action_type] = gActionCounts[taskIdx][action.action_type] + 1;
	updatePane(action);
}

//=================================================================================
// Task Changed
//=================================================================================

function onTaskChanged(taskIdx) {
	// onTaskChanged is called from js/task_chooser.js
	initPaneData(taskIdx);
	showPane(gDataPanes[0].key);
}

function updateTaskDescription(taskIdx) {
	var html = gActivity.tasks[taskIdx][1];
	if (html == '') html = '(none)';
	$('#task_description').html(html);
}

//=================================================================================
// Data Panes
//=================================================================================
// TODO: which functions should be moved to data_pane.js?

function definePanes() {
	gDataPanes.push({ key: STUDENT_PANE, title: 'Students' });
	if (typeof(defineCustomPanes) == "function") {
		defineCustomPanes();
	}
	gDataPanes.push({ key: HISTORY_PANE, title: 'Task History' });	
}

function getPane(key) {
// TODO: move to data_pane.js?
	var pane = null;
	for (var i=0; i<gDataPanes.length; i++) {
		if (gDataPanes[i].key == key) {
			pane = gDataPanes[i];
			break;
		}
	}
	
	if (pane) {
		pane.accumulatorClassName = typeof(pane.accumulatorClassName) != "undefined" ? pane.accumulatorClassName : "DataAccumulator";
		pane.addDataFunction = typeof(pane.addDataFunction) != "undefined" ? pane.addDataFunction : "addActionItem";
		pane.accordionClassName = typeof(pane.accordionClassName) != "undefined" ? pane.accordionClassName : "AccordionList";
		pane.tagCloudClassName = typeof(pane.tagCloudClassName) != "undefined" ? pane.tagCloudClassName : "TagCloud";
		pane.showTagCloud = typeof(pane.showTagCloud) != "undefined" ? pane.showTagCloud : false;
	} 
	    
	return pane;
}

function showPane(key) {
	gCurrentPaneKey = key;
	loadPane();
}

function getPaneButtonId(paneName) {
	return "load_" + paneName + "_btn";
}

function getPaneButtonHtml(key) {
	var pane = getPane(key);
	var buttonId = getPaneButtonId(key);
	return '<button class="load_btn cssbtn" id="'+buttonId+'" onclick="showPane(\''+key+'\')">'+pane.title+'</button>';
}

function updatePaneButtonHtml(key) {
	var pane = getPane(key);
	var count = getPaneCount(key);
    $('#'+getPaneButtonId(key)).html(pane.title+(count!=-1?" ("+count+")":""));
}

function loadPane() {	
	updateUI();
	$('.load_btn').removeClass("selected");
	$("#"+getPaneButtonId(gCurrentPaneKey)).addClass("selected");

	switch (gCurrentPaneKey) {
		case STUDENT_PANE:
			loadStudentPane();
			break;
		case HISTORY_PANE:
			loadHistoryPane();
			break;
		default:
			loadDataPane(gCurrentPaneKey, $("#data_pane"));
			break;
	}
		
	window.location.hash = gCurrentPaneKey;
}

function updatePane(action) {
	switch (gCurrentPaneKey) {
		case STUDENT_PANE:
			updateStudentPane(action);
			break;
		case HISTORY_PANE:
			updateHistoryPane(action);
			break;
		default:
			updateDataPane(gCurrentPaneKey, action);
			break;
	}
	
    for (var i=0; i<gDataPanes.length; i++) {
    	updatePaneButtonHtml(gDataPanes[i].key);
    }
}

function getPaneCount(paneKey) {
// TODO: need to keep track of counts for all panes (not just currently displayed one)
	var count = -1;
	switch (paneKey) {
		case STUDENT_PANE:
			count = getStudentCount();
			break;
		case HISTORY_PANE:
			count = -1;
			break;
		default:
			var pane = getPane(paneKey);
			if (typeof(getCustomPaneCount) == "function") {
				count = getCustomPaneCount(paneKey);
			}
			if (count == -1) {
				count = pane.accumulator ? pane.accumulator.getKeyCount() : getActionCount(pane.action_type);
			}
			break;
	}	
	return count;
}

function showStudent(studentNickname) {
	showPane(STUDENT_PANE);
	gAccordion.openKey(studentNickname);
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
	
	var pane = getPane(STUDENT_PANE);
	var html = '<h3 id="pane_title" style="margin-bottom:10px">'+pane.title+'</h3>';
	html += '<div id="data_list"></div>';
	$("#data_pane").html(html);
	
	var accordion = new StudentAccordion($("#data_list"), accumulator);
	accordion.show();
}

function updateStudentPane(action) {
	// TODO: handle like other data panes ?
	if (gAccordion) {
        var isStudentAction = isDefined(action) && (action.action_type == "log_in" || action.action_type == "log_out");		
        if (isStudentAction) {
			var studentNickname = action.student_nickname
			var isLoggedIn = g_students[studentNickname].is_logged_in;
			var item = new StudentDataItem(studentNickname, { "nickname":studentNickname, "is_logged_in":isLoggedIn });
			
			// if new student logging in, add to accumulator
			if (action.action_type == "log_in" && !gAccordion.accumulator.keyExists(item)) {
				gAccordion.accumulator.add(item);
			}
			// otherwise, update existing item in accumulator
			else {
				gAccordion.accumulator.update(item);
			}
        }
        gAccordion.show();
    }
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

function drawStudentHistories(keys) {
	// if no keys provided, use accumulator keys of current accordion list
	if (typeof(keys) == "undefined") {
		keys = gAccordion.accumulator.keys;
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

function getActionColor(type) {
	return typeof ACTION_COLORS[type] != "undefined" ? ACTION_COLORS[type] : ACTION_COLORS['default'];
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

function StudentAccordion(div, accumulator) {
	AccordionList.call(this, div, accumulator);
}
StudentAccordion.prototype = Object.create(AccordionList.prototype);

StudentAccordion.prototype.expandedItem = function(key, i) {
	var html = "<h5>Task History</h5>\n";
	html += getStudentHistoryAsHTML(key);
	return html;
}

StudentAccordion.prototype.show = function() {
	AccordionList.prototype.show.call(this);
	$(".logout_btn").click(function(event) {
		event.stopPropagation();
		var activity = gActivities[0];
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
	this.sortType = "Login Status";
	this.sortOptions = ["ABC", "Login Status"]; 
}

StudentAccumulator.prototype.getKeys = function() {
	if (this.needToUpdateKeys) {		
		// sort names alphabetically w/logged in users on top
		if (this.sortType == "Login Status") {
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
			this.keys = DataAccumulator.prototype.getKeys.call(this);
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

function loadHistoryPane() {
	var pane = getPane(HISTORY_PANE);
	var html = '<h3 id="pane_title" style="margin-bottom:10px">'+pane.title+'</h3>';
	html += '<div id="task_history"></div>';
	$("#data_pane").html(html);
	$('#task_history').html(getTaskHistoryHtml());
}

function updateHistoryPane(action) {
	// currently actions are sorted by time, with most recent actions on top so
	// any new actions are added to top; if sort changes need to update implementation

	// check if action is for current task, if so, update history
	var taskIdx = isDefined(action) ? action.action_data.task_idx : -1;
	if (taskIdx == selectedTaskIdx()) {	
		var isStudentAction = action.action_type == "log_in" || action.action_type == "log_out";
		if (!isStudentAction) {
			var html = getTaskRow(action);
			var existingHtml = $("#task_actions").html();
			html += existingHtml.replace("<tbody>", "").replace("</tbody>", "");
			$("#task_actions").html(html);
		}
	}
}

function getTaskHistoryHtml() { 
	var html = '';
	var task = selectedTaskIdx()+1;
	var taskHistory = gTaskHistories[task-1];
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

//=================================================================================
// Activity Data
//=================================================================================

// initialize any data structures derived from data sent from server
function updateData() {	
	updateHistoryData();
	if (typeof(updateCustomData) != "undefined") {
		updateCustomData();
	}
}

function updateHistoryData() {
	for (var studentNickname in g_students) {
		g_students[studentNickname].task_history = [];
		for (var taskIdx=0; taskIdx<gTaskHistories.length; taskIdx++) {
			g_students[studentNickname].task_history.push([]);
		}
	}

	gActionCounts = [];
	for (var taskIdx=0; taskIdx<gActivities[0].tasks.length; taskIdx++) {
		gActionCounts.push({});
		if (gTaskHistories.length > 0) {
			var taskHistory = gTaskHistories[taskIdx];
			for (var j=0; j<taskHistory.length; j++) {
				var action = taskHistory[j];
				var type = action.action_type;
				g_students[action.student_nickname].task_history[taskIdx].push(action);
				var counts = gActionCounts[taskIdx];
				counts[type] = (typeof(counts[type]) == "undefined") ? 1 : counts[type]+1; 
			}
		}
	}
}

function getActionCount(type) {
	var taskIdx = selectedTaskIdx();
	var counts = gActionCounts[taskIdx];
	return typeof(counts[type]) == "undefined" ? 0 : counts[type];
}