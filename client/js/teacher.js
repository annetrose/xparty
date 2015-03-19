/*
# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn -- www.alexquinn.org
#          Anne Rose -- www.cs.umd.edu/hcil/members/arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

//=================================================================================
// Global Variables and Constants
//=================================================================================

// gActivities: array of all activities for the current teacher where:
//   <activity> = { 
//      "tasks":            [[<name string>, <description string>], ...], 
//      "description":      <string>, 
//      "class_name":       <string>, 
//      "start_time":       <string, e.g., "January 07, 2013 19:00:15">,
//      "is_active":        <true|false>, 
//      "teacher_nickname": <string>,
//      "activity_code":    <string>, 
//      "title":            <string>,
//      "delete_time:       <string|null, e.g., "January 07, 2013 19:00:15">,
//      "stop_time:         <string|null, e.g., "January 07, 2013 19:00:15">,
//      "activity_type":    <string>
//   }
//
var gActivities = [];

// gActivityTypes: array of activity types where:
//   <activity type> = {
//      "type":             <string>,
//      "description":      <string>
//    }
// 
var gActivityTypes = [];

// gStudents: student objects keyed on nickname that are associated with loaded activity where:
//   <student> = {
//      "nickname":                 <string>, 
//      "activity_code":            <string>, 
//      "is_logged_in":             <true|false>, 
//      "anonymous":                <true|false>, 
//      "first_login_timestamp":    <string, e.g., "January 07, 2013 19:00:33">,
//      "latest_login_timestamp":   <string, e.g., "January 07, 2013 19:47:00">, 
//      "latest_logout_timestamp":  <string, e.g., "January 07, 2013 20:51:34">,
//      "task_history":             [[<action 1 for task 1>, ...], ...]
//   }
// gStudents["Anne"] returns <student> for "Anne"
//
var gStudents = {};

// gTaskHistories: array of student <action>s for each task in loaded activity where:
// <action> defined in common.js
//
var gTaskHistories = [];

// data pane keys (should not contain spaces or special characters)
var STUDENT_PANE = "students";
var HISTORY_PANE = "history";

// visual actions
var ACTION_COLORS = { "default": "#888888" };
var ACTION_DIM = 6;

//=================================================================================
// Initialize UI
//=================================================================================

function initTeacher() {
	openChannel();
	definePanes();
	initData();
	initUI();
}

function initUI() {
	// activity header
    $('#activity_title').html(gActivity.title);
    $('#activity_code').html(gActivity.activity_code);
    
    // sidebar: task chooser and description
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
    var buttonHtml = getPaneButtonsHtml();
    $('#side_button_bar').html(buttonHtml);

    $(document).on("xp_pane_visible", function(event) {
        $('.panebtn').removeClass("selected");
        $("#"+getPaneButtonId(event.pane)).addClass("selected");
        window.location.hash = event.pane.getKey();
    });
    
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

    updateUI();
}

function updateUI() {
	// if activity not defined, redirect to dashboard
	if (gActivities.length==0) {
		window.location = '/teacher_dashboard';
		return;
	}
	
	// sidebar: task description
    var html = gActivity.tasks[selectedTaskIdx()][1];
    if (html == '') html = '(none)';
    $('#task_description').html(html);
    
	// sidebar: data pane buttons
	for (var i in gDataPanes) {
        updatePaneButton(gDataPanes[i]);
    }
    
    // sidebar: activity buttons
    var activity = gActivities[0];
    var activity_code = activity.activity_code;
    $('#stop_activity_btn_'+activity_code).toggle(activity.is_active);
	$('#start_activity_btn_'+activity_code).toggle(!activity.is_active);
	$("#num_students").html(getLoggedInStudentCount());
	$('#inactive').toggle(!activity.is_active);
	
	for (var i in STUDENT_ACTIONS) {
	   var actionType = STUDENT_ACTIONS[i];
	   $(document).on("xp_"+actionType, function(event) {
	       $("#num_students").html(getLoggedInStudentCount());
	   });
	}
	
	// data pane
	var dataPanes = getDataPanes();
    var paneKey = window.location.hash ? window.location.hash.replace("#", "") : dataPanes[0].getKey();
	showPane(paneKey);
}

$(document).on("xp_task_changed", function(event) {
    var taskIdx = event.taskIdx;
	initPaneData(taskIdx);
	updateUI();
});

$(window).resize(function() {
	var pane = getCurrentPane();
	if (pane) {
		pane.resize();
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

	// CHECK: Are msgs for all teacher activities sent through same channel?
	// If so, ignore msgs for other activities
	actions = JSON.parse(msg.data);
	var num_actions = actions.length;
	for(var i=0; i<num_actions; i++) {
		var action = actions[i];
		var activityCode = getActivityCode(action);
		if (activityCode == gActivity.activity_code) {
		    var actionType = getActionType(action);
		    switch(actionType) {
			    case LOGIN:
				    handleLogin(action);
				    break;
			    case LOGOUT:
				    handleLogout(action);
				    break;
			    default:
				    handleAction(action);
				    break;
		    }
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

function handleLogin(action) {
    var studentNickname = getStudentNickname(action);
    var student = gStudents[studentNickname];
    var taskIdx = getTaskIdx(action);
    if (isUndefined(student)) {
		student = {};
		student.is_logged_in = true;
		student.task_idx = taskIdx;
		student.task_history = [];
		var numTasks = number_of_tasks();
		for (var i=0; i<numTasks; i++) {
			student.task_history.push([]);
		}
		gStudents[studentNickname] = student;
	}
	else {
		student.is_logged_in = true;
		student.task_idx = taskIdx;
	}
	triggerEvent(getActionType(action), action);
}

function handleLogout(action) {
    var studentNickname = getStudentNickname(action);
	if (isDefined(gStudents[studentNickname])) {
		gStudents[studentNickname].is_logged_in = false;
		triggerEvent(getActionType(action), action);
	}
}

function handleAction(action) {
    var taskIdx = getTaskIdx(action);
	gTaskHistories[taskIdx].push(action);
	gStudents[getStudentNickname(action)].task_history[taskIdx].push(action);
	if (taskIdx == selectedTaskIdx()) {
        triggerEvent(getActionType(action), action);
        triggerEvent("student_action", action);
	}
}

function triggerEvent(type, action) {
    $.event.trigger({
        type: "xp_" + type,
        action: action
    });
}

//=================================================================================
// Data Panes
//=================================================================================

function definePanes() {
	// student pane
	addDataPane(new StudentPane());
	
	// custom panes, if any
	if (typeof(addCustomPanes) == "function") {
		addCustomPanes();
	}
	
	// history pane
	addDataPane(new HistoryPane());
}

function getPaneButtonsHtml() {
    var html = "";
    var dataPanes = getDataPanes();
    for (var i in dataPanes) {
        var pane = dataPanes[i];
        html += getPaneButtonHtml(pane);
        // xx where should this go
        $(pane.list).on("xp_action_added", { pane: pane }, function(event) {
            updatePaneButton(event.data.pane);
        });
    }
    return html;
}

function updatePaneButton(pane) {
    var buttonId = getPaneButtonId(pane);
    var title = pane.getTitle();
    var count = pane.getCount();
    $('#'+buttonId).html(title + (count!=-1?" ("+count+")":""));	
}

function getPaneButtonId(pane) {
	return "load_" + pane.getKey() + "_btn";
}

function getPaneButtonHtml(pane) {
	var buttonId = getPaneButtonId(pane);
	return '<button class="panebtn cssbtn" id="'+buttonId+'" onclick="showPane(\''+pane.getKey()+'\')">'+pane.getTitle()+'</button>';
}

//=================================================================================
// Student Pane
//=================================================================================

var STUDENT_ACTIONS = [ LOGIN, LOGOUT ];

function StudentPane(key, title, options) {
	ActionPane.call(this, STUDENT_PANE, "Students", STUDENT_ACTIONS);
    
    // listen for all student actions
    // redraw visual student histories and expanded section, as needed
    // xx where should this go?
    // xx way too much knowledge about accordion, etc.
    $(document).on("xp_student_action", { pane: this }, function(event) {
        var pane = event.data.pane;
        if (isCurrentPane(pane)) {
            var studentIdx = pane.list.indexOf(getStudentNickname(event.action));
            if (studentIdx != -1) {
                var studentHistoryDiv = $(".student_history", $('#itemheader'+(studentIdx+1)));
                pane.accordion.drawStudentHistory(studentHistoryDiv, pane.list.getKeys()[studentIdx]); 
            
                // if open, refresh expanded item for student
                var expandedIndex = pane.accordion.getExpandedIndex();
                if (expandedIndex !== false && expandedIndex == studentIdx) {
                    pane.accordion.refreshExpanded();
                }
            }
        }
    });
}
StudentPane.prototype = Object.create(ActionPane.prototype);

StudentPane.prototype.createList = function() {
    var options = { defaultSortOption : SORT_BY_LOGIN_STATUS };
	return new StudentList(STUDENT_ACTIONS, options);
}

StudentPane.prototype.createAccordion = function(div) {
	return new StudentAccordion(div, this.list);
}

StudentPane.prototype.refresh = function(items) {
    this.createControls();
    this.accordion.refresh(items);
    this.accordion.refreshExpanded();
}

StudentPane.prototype.resize = function() {
	this.accordion.resize();
}

StudentPane.prototype.initData = function(taskIdx) {
	ActionPane.prototype.initData.call(this, taskIdx);
	for (var studentNickname in gStudents) {
	    var items = this.list.createItems(studentNickname);
		this.list.addItems(items);
	}
}

StudentPane.prototype.addData = function(action, taskIdx) {
	var studentNickname = getStudentNickname(action);
	var actionType = getActionType(action);
	var isNewStudent = actionType == LOGIN && !this.list.contains(studentNickname);
	// add new student
	if (isNewStudent) {
		var items = this.list.createItems(studentNickname);
	    this.list.addItems(items);
	}
	// otherwise, update existing student
	else {
		this.list.updateItems(studentNickname);
		if (this.list.getSort() == SORT_BY_LOGIN_STATUS) this.list.needToUpdateKeys = true;
	}
}

function StudentAccordion(div, list) {
	ActionAccordion.call(this, div, list);
}
StudentAccordion.prototype = Object.create(ActionAccordion.prototype);

StudentAccordion.prototype.create = function() {
	ActionAccordion.prototype.create.call(this);
	$(".logout_btn").click(function(event) {
		event.stopPropagation();
		var activity = gActivities[0];
		var activityCode = activity.activity_code;
		logoutStudent($(this).val(), activityCode);
	});
	
	this.drawStudentHistories(this.list.getKeys());	
}

StudentAccordion.prototype.createExpanded = function(div, key, i) {
	var student = gStudents[key];
	var taskHistory = student.task_history[selectedTaskIdx()];
	var html = "<h5>Task History</h5>\n";
	html += taskHistoryAsHtml(taskHistory, false, false);
	$(div).html(html);
	registerItemLinkCallbacks();
}

StudentAccordion.prototype.drawStudentHistory = function(div, studentNickname) {
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
	var student = gStudents[studentNickname];
	var taskHistory = student.task_history[task-1];
	var numTasksDrawn = 0;
	for (var i=0; i<taskHistory.length; i++) {
		var actionHtml = '';
		var action = taskHistory[i];
		var actionType = getActionType(action);
		var actionDescription = getActionDescription(action);
		actionDescription = actionDescription && actionDescription != "" ? actionDescription : "-";

		if (i>0) {
			var actionTime = getLocalTime(new Date(getActionTimestamp(action)));
			var prevActionTime = getLocalTime(new Date(getActionTimestamp(taskHistory[i-1])));
			var isLargeGap = (actionTime.getTime()-prevActionTime.getTime())>=largeGap;
			if (isLargeGap) {
				actionHtml += '<div class="largegap" style="width:1px;height:20px !important;background:grey;float:left;margin-right:'+actionMargin+'px;"></div>';
			}
		}
		
		actionHtml += '<div title="'+htmlEscape(actionType+': '+actionDescription)+'" style="width:'+ACTION_DIM+'px;height:'+ACTION_DIM+'px !important;background:'+getActionColor(action)+';float:left;margin-right:'+actionMargin+'px;margin-top:'+topMargin+'px;">&nbsp;</div>';
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
	
	div.html(html);
}

StudentAccordion.prototype.drawStudentHistories = function() {
	var keys = this.list.getKeys();
	for (var i=0; i<keys.length; i++) {
		var div = $(".student_history", $('#itemheader'+(i+1)));
		this.drawStudentHistory(div, keys[i]); 
	};
}

StudentAccordion.prototype.resize = function() {
	this.drawStudentHistories();
}

StudentAccordion.prototype.itemAsHtml = function(key, itemText, countText, paneKey) {
    var student = this.list.getValue(key, "student");
    var isLoggedIn = student.is_logged_in;
    var className = isLoggedIn===false ? "studentLoggedOut" : "studentLoggedIn";
    var html = '<span class="' + className + '">' + htmlEscape(key) + '</span>';
    html += '<span class="item_key">' + htmlEscape(key) + '</span>';
    if (isLoggedIn) {
        html += ' <button class="logout_btn" value="'+ key +'" title="Logout student">X</button>';
    }
    html += '<div class="student_history" style="float:right; margin-right:5px"></div></a>';
    return html;
}

function StudentList(actionTypes, options) {
    // xx merge sort options with options
	actionTypes = isDefined(actionTypes) ? actionTypes : STUDENT_ACTIONS;
	options.sortBy = { types: [ SORT_ALPHABETICALLY, SORT_BY_LOGIN_STATUS ], default: SORT_BY_LOGIN_STATUS };
	ActionList.call(this, "Students", "student_nickname", actionTypes, options);
}
StudentList.prototype = Object.create(ActionList.prototype);

StudentList.prototype.createItems = function(data) {
	var isAction = typeof(data) != "string";
	var studentNickname = isAction ? data.student_nickname : data;

    // data may be student_nickname (string) or action ({})
    // if data is student_nickname, need to create action	
    var action = {};
	if (!isAction) {
	    action.student_nickname = studentNickname;
	    action.action_description = studentNickname;
	    action.activity_code = gActivity.activity_code;
	    action.action_type = gStudents[studentNickname].is_logged_in ? LOGIN : LOGOUT;
	    action.task_idx = selectedTaskIdx();
	    action.action_data = {};
	}
	else {
	   action = data;
	}
	action.student = gStudents[studentNickname];
	
	return [ new ActionItem(studentNickname, action) ];
}

StudentList.prototype.sortKeys = function(keys, sortOption) {
    // xx defaultSortOption?
    sortOption = isDefined(sortOption) ? sortOption : (isDefined(this.sortOption) ? this.sortOption : this.defaultSortOption);
	keys = ActionList.prototype.sortKeys.call(this, keys, sortOption);	
	// sort names alphabetically w/logged in users on top
	if (sortOption == SORT_BY_LOGIN_STATUS) {
		keys = this.sortKeysByLoginStatus(keys);
	}
	return keys;
}

StudentList.prototype.sortKeysByLoginStatus = function(sortValues) {	
	var list = this;
	sortValues.sort(function(a,b) {
	    var studentA = list.getValue(a, "student");
	    var studentB = list.getValue(b, "student"); 
		if (studentA.is_logged_in==true && studentB.is_logged_in==false) {
			return -1;
		}
		else if (studentA.is_logged_in==false && studentB.is_logged_in==true) {
			return 1;
		}
		else {
			var aName = list.getValue(a, "student_nickname").toLowerCase();
			var bName = list.getValue(b, "student_nickname").toLowerCase();
			return (aName > bName ? 1 : (aName < bName ? -1 : 0));
		}
	});
	
	return sortValues;
}

function StudentListView(list, groupKey) {
    ListView.call(this, list, groupKey, STUDENT_PANE);
}
StudentListView.prototype = Object.create(ListView.prototype);

StudentListView.prototype.itemAsHtml = function(key, itemText, countText) {
    return ListView.prototype.itemAsHtml.call(this, key, itemText, "");
}

//=================================================================================
// History Pane
//=================================================================================

function HistoryPane(key, title, options) {
	DataPane.call(this, HISTORY_PANE, "Task History");
	
	// xx where should this go?
    $(document).on("xp_student_action", { pane : this }, function(event) {
        var pane = event.data.pane;
        if (isCurrentPane(pane)) {
            pane.refresh(event.action);
        }
    });   
}
HistoryPane.prototype = Object.create(DataPane.prototype);

HistoryPane.prototype.create = function(div) {
    var html = '<h3 id="pane_title" style="margin-bottom:10px">'+this.title+'</h3>';
	html += '<div id="task_history"></div>';
	div.html(html);
	this.refresh();
}

HistoryPane.prototype.refresh = function(action) {

    var taskHistory = gTaskHistories[this.taskIdx];

    // refresh all actions
    if (isUndefined(action) || taskHistory.length == 1) {
        var html = taskHistoryAsHtml(taskHistory);
        $("#task_history").html(html);
    }
    
    // add new action to pane
	else {
		// actions are sorted by time, with most recent actions on top 
		// so any new actions are added to top
		var newActionHtml = actionAsHtmlRow(action, true);
		var existingHtml = $("#task_actions").html().replace("<tbody>", "").replace("</tbody>", "");
		$("#task_actions").html(newActionHtml + existingHtml);
	}
		
	// xx where should this function live?
	registerItemLinkCallbacks();
}

function taskHistoryAsHtml(taskHistory, includeHeader, includeStudent) {
	includeHeader = isDefined(includeHeader) ? includeHeader : true;
	includeStudent = isDefined(includeStudent) ? includeStudent : true;
	var html = '<div style="margin-bottom:15px;">(none)</div>';
	if (taskHistory.length > 0) {
		html = "";
		if (includeHeader) {
			html += '<table class="task_history">';
			html += '<tr>';
		 	html += '<td style="width:17ex"><h6>Task</h6></td>';
		 	html += '<td>&nbsp;</td>';
		 	if (includeStudent) html += '<td style="width:13ex"><h6>Student</h6></td>';
		 	html += '<td style="width:15ex"><h6>Time</h6></td>';
		 	html += '</tr>';
		 	html += '</table>';
		}
	 	
		// old on top
	 	//for (var i=0; i<taskHistory.length; i++) {
		// new on top
	 	html += '<table id="task_actions" class="task_history">';
	 	for (var i=taskHistory.length-1; i>=0; i--) {
	 		var action = taskHistory[i];
	 		html += actionAsHtmlRow(action, includeStudent);
	 	}
	 	html += "</table>";
	}
	return html;
}

function actionAsHtmlRow(action, includeStudent) {
    var actionType = getActionType(action);
	var actionTypeText = actionType.replace("_", " ").toTitleCase();
	var actionDescription = getActionDescription(action);
	actionDescription = actionDescription && actionDescription!="" ? actionDescription : "-";
	if (typeof(customActionDescriptionToHtml) == "function") {
		actionDescription = customActionDescriptionToHtml(action);
	}
	//actionDescription = unescape(actionDescription);
	var actionTime = getFormattedTimestamp(getLocalTime(new Date(getActionTimestamp(action))));
	var html = '<tr>';
	html += '<td style="width:17ex">' + '<div style="width:'+ACTION_DIM+'px;height:'+ACTION_DIM+'px !important;background:'+getActionColor(action)+'; float:left; margin-right:4px; margin-top:7px;">&nbsp;</div> ' + actionTypeText + '</td>';
	html += '<td>' + actionDescription + '</td>';
	if (includeStudent) html += '<td style="width:13ex">' + getStudentNickname(action) + '</td>';
	html += '<td style="width:15ex">' + actionTime + '</td>';
	html += '</tr>';
	return html;
}

function getActionColor(action) {
    var type = getActionType(action);
    return isDefined(ACTION_COLORS[type]) ? ACTION_COLORS[type] : ACTION_COLORS["default"];
}

//=================================================================================
// Initialize Data
//=================================================================================

function initData() {	
    // initialize any data structures derived from data sent from server

	// add history data to student data
	for (var studentNickname in gStudents) {
		gStudents[studentNickname].task_history = [];
		for (var taskIdx=0; taskIdx<gTaskHistories.length; taskIdx++) {
			gStudents[studentNickname].task_history.push([]);
		}
	}

	for (var taskIdx=0; taskIdx<gActivities[0].tasks.length; taskIdx++) {
		if (gTaskHistories.length > 0) {
			var taskHistory = gTaskHistories[taskIdx];
			for (var j=0; j<taskHistory.length; j++) {
				var action = taskHistory[j];
				var studentNickname = getStudentNickname(action);
				gStudents[studentNickname].task_history[taskIdx].push(action);
			}
		}
	}
	
	// initialize pane data for task 1
	initPaneData(0);
	
	// initialize custom data, if any
	if (typeof(initCustomData) == "function") {
		initCustomData();
	}
}