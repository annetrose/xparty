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
var gCurrentPane = null;
var gDataPanes = [];

var ACTION_DIM = 6;

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

    gCurrentPane = null;
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
    var activity = gActivities[0];
    var activity_code = activity.activity_code;
    for (var i=0; i<gDataPanes.length; i++) {
    	updatePaneButtonHtml(gDataPanes[i].key);
    }
    
    // sidebar: activity buttons
    $('#stop_activity_btn_'+activity_code).toggle(activity.is_active);
	$('#start_activity_btn_'+activity_code).toggle(!activity.is_active);
	$("#num_students").html(getLoggedInStudentCount());
	$('#inactive').toggle(!activity.is_active);
	
	// data pane
    var paneKey = window.location.hash ? window.location.hash.replace("#", "") : gDataPanes[0].getKey();
	showPane(paneKey);
}

function onTaskChanged(taskIdx) {
	// onTaskChanged is called from js/task_chooser.js
	initPaneData(taskIdx);
	updateUI();
}

$(window).resize(function() {
	var pane = getPane(gCurrentPane);
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
		switch(action.action_type) {
			case "log_in":
				handleLogIn(action);
				break;
			case "log_out":
				handleLogOut(action);
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
	if (action.activity_code == gActivity.activity_code) {
		var student = g_students[action.student_nickname];
		if (isUndefined(student)) {
			student = {};
			student.is_logged_in = true;
			student.task_idx = action.task_idx;		
			student.task_history = [];
			var numTasks = number_of_tasks();
			for (var i=0; i<numTasks; i++) {
				student.task_history.push([]);
			}
			g_students[action.student_nickname] = student;
		}
		else {
			student.is_logged_in = true;
			student.task_idx = action.task_idx;
		}
		updatePane(action);
	}
}

function handleLogOut(action) {
	if (action.activity_code==gActivity.activity_code && isDefined(g_students[action.student_nickname])) {
		g_students[action.student_nickname].is_logged_in = false;
		updatePane(action);
	}
}

function handleAction(action) {
	if (action.activity_code = gActivity.activity_code) {
		var taskIdx = action.task_idx;
		gTaskHistories[taskIdx].push(action);
		g_students[action.student_nickname].task_history[taskIdx].push(action);
		if (taskIdx == selectedTaskIdx()) {
			updatePane(action);
		}
	}
}

//=================================================================================
// Data Panes
//=================================================================================

function definePanes() {
	// student pane
	gDataPanes.push(new StudentPane());
	
	// custom panes, if any
	if (typeof(defineCustomPanes) == "function") {
		defineCustomPanes();
	}
	
	// history pane
	gDataPanes.push(new HistoryPane());
}

function getPane(key) {
	var pane = null;
	for (var i=0; i<gDataPanes.length; i++) {
		if (gDataPanes[i].key == key) {
			pane = gDataPanes[i];
			break;
		}
	} 
	return pane;
}

function initPaneData(taskIdx) {
	gCurrentPane = null;
	for (var i=0; i<gDataPanes.length; i++) {
		gDataPanes[i].initData(taskIdx);
	}
}

function updatePane(data) {
	var dataChanged = false;
	if (isDefined(data)) {
		var taskIdx = selectedTaskIdx();
		for (var i=0; i<gDataPanes.length; i++) {
			var pane = gDataPanes[i];
			pane.updateData(data, taskIdx);
			updatePaneButtonHtml(pane.getKey());
		}
	}
	
	$("#num_students").html(getLoggedInStudentCount());

	// refresh method checks if given action requires pane to be refreshed or not
	var currentPane = getPane(gCurrentPane);
	currentPane.refresh(data);
}

function showPane(paneKey, itemKey) {
	pane = getPane(paneKey);
	if (!gCurrentPane || paneKey != gCurrentPane) {
		gCurrentPane = paneKey;
		$('.panebtn').removeClass("selected");
		$("#"+getPaneButtonId(gCurrentPane)).addClass("selected");
		pane.create($("#data_pane"));	
		window.location.hash = gCurrentPane;
	}
	
	if (isDefined(itemKey)) {
		pane.accordion.expandItem(itemKey);
	}
}

function getPaneButtonId(paneName) {
	return "load_" + paneName + "_btn";
}

function getPaneButtonHtml(key) {
	var pane = getPane(key);
	var buttonId = getPaneButtonId(key);
	return '<button class="panebtn cssbtn" id="'+buttonId+'" onclick="showPane(\''+key+'\')">'+pane.title+'</button>';
}

function updatePaneButtonHtml(key) {
	var pane = getPane(key);
	var count = pane.getCount();
    $('#'+getPaneButtonId(key)).html(pane.title+(count!=-1?" ("+count+")":""));
}

//=================================================================================
// Student Pane
//=================================================================================

var STUDENT_ACTIONS = [ "log_in", "log_out" ];

function StudentPane(key, title, options) {
	ActionPane.call(this, STUDENT_PANE, "Students", STUDENT_ACTIONS);
}
StudentPane.prototype = Object.create(ActionPane.prototype);

StudentPane.prototype.createItems = function() {
	var list = new StudentList();
	list.defaultSortType = "Login Status";
	return list;
}

StudentPane.prototype.createAccordion = function(div) {
	return new StudentAccordion(div, this.items);
}

StudentPane.prototype.refresh = function(data) {
	// TODO: only refresh what has changed
	// currently refreshed for all actions because student visual histories need to be updated	
	this.createControls();
	this.accordion.refresh();
	if (this.tagcloud) {
		this.tagcloud.refresh();
	}
	
	// update open accordion section, if any
	this.accordion.refreshExpanded();	
}

StudentPane.prototype.resize = function() {
	this.accordion.resize();
}

StudentPane.prototype.initData = function(taskIdx) {
	DataPane.prototype.initData.call(this, taskIdx);
	for (var studentNickname in g_students) {
		this.items.addItems(studentNickname);
	};
}

StudentPane.prototype.updateData = function(action, taskIdx) {
	if (this.isPaneData(action)) {
		var studentNickname = action.student_nickname
		var isNewStudent = action.action_type=="log_in" && !this.items.contains(studentNickname);
		// add new student
		if (isNewStudent) {
			this.items.addItems(studentNickname);
		}
		// otherwise, update existing student
		else {
			this.items.updateItems(studentNickname);
			// xx
			if (this.items.sortType == "Login Status") this.items.needToUpdateKeys = true;
		}
	}	
}

function StudentAccordion(div, items) {
	AccordionList.call(this, div, items);
}
StudentAccordion.prototype = Object.create(AccordionList.prototype);

StudentAccordion.prototype.create = function() {
	AccordionList.prototype.create.call(this);
	$(".logout_btn").click(function(event) {
		event.stopPropagation();
		var activity = gActivities[0];
		var activityCode = activity.activity_code;
		logoutStudent($(this).val(), activityCode);
	});
	
	this.drawStudentHistories(this.items.getKeys());
}

StudentAccordion.prototype.expandedAsHtml = function(key, i) {
	alert("StudentAccordion:expandedAsHtml "+key+','+i);
	var student = g_students[key];
	var taskHistory = student.task_history[selectedTaskIdx()];
	var html = "<h5>Task History</h5>\n";
	html += taskHistoryAsHtml(taskHistory, false, false);
	return html;
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
	var keys = this.items.getKeys();
	for (var i=0; i<keys.length; i++) {
		var div = $(".student_history", $('#itemheader'+(i+1)));
		this.drawStudentHistory(div, keys[i]); 
	};
}

StudentAccordion.prototype.resize = function() {
	this.drawStudentHistories();
}

function StudentList(actionTypes) {
	actionTypes = isDefined(actionTypes) ? actionTypes : STUDENT_ACTIONS;
	ActionList.call(this, "Students", "student_nickname", actionTypes);
	this.setSortOptions(["ABC", "Login Status"]);
	this.defaultPane = STUDENT_PANE;
}
StudentList.prototype = Object.create(ActionList.prototype);

StudentList.prototype.createItems = function(data) {
	// data may be student_nickname or action
	var studentNickname = typeof(data) == "string" ? data : data["student_nickname"];
	var isLoggedIn = g_students[studentNickname].is_logged_in;
	var data = { "nickname":studentNickname, "is_logged_in":isLoggedIn };
	return [ new DataItem(studentNickname, data) ];
}

StudentList.prototype.itemAsHtml = function(key, itemText, countText, pane) {
	var pane = isDefined(pane) ? pane : (isDefined(this.defaultPane) && gCurrentPane != this.defaultPane ? this.defaultPane : undefined);
	if (isUndefined(pane)) {
		var is_logged_in = this.getValue(key, "is_logged_in");
		var class_name = is_logged_in===false ? "studentLoggedOut" : "studentLoggedIn";
		var html = '<span class="' + class_name + '">' + key + '</span>';
		html += '<span class="item_key">' + key + '</span>';
		if (is_logged_in) {
				html += ' <button class="logout_btn" value="'+ key +'" title="Logout student">X</button>';
		}
		html += '<div class="student_history" style="float:right; margin-right:5px"></div></a>';
	}
	else {
		html = ActionList.prototype.itemAsHtml.call(this, key, itemText, "", pane);
	}
	return html;
}

StudentList.prototype.isItemData = function(action, taskIdx) {
	return isDefined(action) && $.inArray(action.action_type, this.actionTypes) > -1;
}

StudentList.prototype.sortKeys = function() {
	ActionList.prototype.sortKeys.call(this);	
	// sort names alphabetically w/logged in users on top
	if (this.sortType == "Login Status") {
		this.sortKeysByLoginStatus();
	}
}

StudentList.prototype.sortKeysByLoginStatus = function() {	
	var list = this;
	this.keys.sort(function(a,b) {
		if (list.getValue(a, "is_logged_in")==true && list.getValue(b, "is_logged_in")==false) {
			return -1;
		}
		else if (list.getValue(a, "is_logged_in")==false && list.getValue(b, "is_logged_in")==true) {
			return 1;
		}
		else {
			var aName = list.getValue(a, "nickname").toLowerCase();
			var bName = list.getValue(b, "nickname").toLowerCase();
			return (aName > bName ? 1 : (aName < bName ? -1 : 0));
		}
	});
}

//=================================================================================
// History Pane
//=================================================================================

function HistoryPane(key, title, options) {
	DataPane.call(this, HISTORY_PANE, "Task History");
}
HistoryPane.prototype = Object.create(DataPane.prototype);

HistoryPane.prototype.create = function(div) {
    var html = '<h3 id="pane_title" style="margin-bottom:10px">'+this.title+'</h3>';
	html += '<div id="task_history"></div>';
	div.html(html);
	
	var taskHistory = gTaskHistories[this.taskIdx];
	html = taskHistoryAsHtml(taskHistory);
	$("#task_history").html(html);
	
	this.items.registerItemCallbacks();
}

HistoryPane.prototype.refresh = function(action) {
	if (this.isPaneData(action)) {
		var taskHistory = gTaskHistories[this.taskIdx];
		if (taskHistory.length == 1) {
			var html = taskHistoryAsHtml(taskHistory);
			$("#task_history").html(html);
		}
		else {
			// actions are sorted by time, with most recent actions on top 
			// so any new actions are added to top
			var newActionHtml = actionAsHtmlRow(action, true);
			var existingHtml = $("#task_actions").html().replace("<tbody>", "").replace("</tbody>", "");
			$("#task_actions").html(newActionHtml + existingHtml);
		}
		this.items.registerItemCallbacks();
	}
}

HistoryPane.prototype.getCount = function() {
	return -1;
}

HistoryPane.prototype.isPaneData = function(action) {
	return isDefined(action) && action.task_idx==this.taskIdx && action.action_type != "log_in" && action.action_type != "log_out";
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
	var actionType = action.action_type.replace("_", " ").toTitleCase();
	var actionDescription = action.action_description && action.action_description!="" ? action.action_description : "-";
	if (typeof(defineCustomActionDescriptions) == "function") {
		actionDescription = defineCustomActionDescriptions(action);
	}
	//actionDescription = unescape(actionDescription);
	var actionTime = getFormattedTimestamp(getLocalTime(new Date(action.timestamp)));
	var html = '<tr>';
	html += '<td style="width:17ex">' + '<div style="width:'+ACTION_DIM+'px;height:'+ACTION_DIM+'px !important;background:'+getActionColor(action)+'; float:left; margin-right:4px; margin-top:7px;">&nbsp;</div> ' + actionType + '</td>';
	html += '<td>' + actionDescription + '</td>';
	if (includeStudent) html += '<td style="width:13ex">' + action.student_nickname + '</td>';
	html += '<td style="width:15ex">' + actionTime + '</td>';
	html += '</tr>';
	return html;
}

//=================================================================================
// Activity Data
//=================================================================================

function initData() {	
// initialize any data structures derived from data sent from server

	// add history data to students
	for (var studentNickname in g_students) {
		g_students[studentNickname].task_history = [];
		for (var taskIdx=0; taskIdx<gTaskHistories.length; taskIdx++) {
			g_students[studentNickname].task_history.push([]);
		}
	}

	for (var taskIdx=0; taskIdx<gActivities[0].tasks.length; taskIdx++) {
		if (gTaskHistories.length > 0) {
			var taskHistory = gTaskHistories[taskIdx];
			for (var j=0; j<taskHistory.length; j++) {
				var action = taskHistory[j];
				var type = action.action_type;
				g_students[action.student_nickname].task_history[taskIdx].push(action);
			}
		}
	}
	
	// initialize pane data for task 1
	initPaneData(0);
	
	if (typeof(initCustomData) != "undefined") {
		initCustomData();
	}
}