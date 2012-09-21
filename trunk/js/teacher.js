/*
# XParty - A Framework for Building Tools for Learning in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn -- www.alexquinn.org
#          Anne Rose -- www.cs.umd.edu/hcil/members/arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

// TODO: Need to generalize event/activity definitions.
// TODO: Update data panes w/ incoming student activity
// TODO: Pass incoming activities off to appropriate handlers

// data panes
var STUDENT_PANE = "students";
var HISTORY_PANE = "history";
var DATA_PANES = {};
DATA_PANES[STUDENT_PANE] = { title: 'Students' };
DATA_PANES[HISTORY_PANE] = { title: 'Task History' };
var START_PANE = STUDENT_PANE;
var g_currentPane = null;
var g_activeAccordionIndex = false;
var g_activeAccordionKey = null;

// visual histories
var ACTIVITY_DIM = 6; // pixels
var ACTIVITY_COLORS = { default:'#888888' };

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
    $('#task_chooser').selectbox();
    
    // sidebar: data pane buttons
    var html = '';
    for (paneKey in DATA_PANES) {
    	var paneInfo = DATA_PANES[paneKey];
    	var buttonId = getPaneButtonId(paneKey);
    	html += '<button class="load_btn cssbtn" id="'+buttonId+'" onclick="initPane(\''+paneKey+'\')">'+paneInfo.title+'</button><br/>';
    }
    $('#side_button_bar').html(html);
    
    // sidebar: lesson buttons
    var utc_offset_minutes = (new Date()).getTimezoneOffset();
    html = '<button class="cssbtn" id="edit_lesson_btn_'+lesson_code+'" onclick="goToLessonForm(\''+lesson_code+'\');">Edit activity<span class="edit"></span></button><br/>';
	html += '<button class="cssbtn" id="stop_lesson_btn_'+lesson_code+'" style="display:none" onclick="stopLesson(\''+lesson_code+'\')">Stop activity<span class="stop"></span></button>';
	html += '<button class="cssbtn" id="start_lesson_btn_'+lesson_code+'" style="display:none" onclick="startLesson(\''+lesson_code+'\')">Start activity<span class="start"></span></button><br/>';
	html += '<button class="cssbtn" id="clone_lesson_btn_'+lesson_code+'" onclick="cloneLesson(\''+lesson_code+'\', false)">Clone activity</button><br/>';
    html += '<button class="cssbtn" id="download_data_btn_'+lesson_code+'" onclick="window.location=\'/data_dump?lesson_code='+lesson_code+'&utc_offset_minutes=' + utc_offset_minutes + '\'; return false;">Download data<span class="dl"></span></button><br/>' 
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
    $('#'+getPaneButtonId(STUDENT_PANE)).html(DATA_PANES[STUDENT_PANE].title+" (" + getStudentCount() + ")");
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
			$("#data_pane").html("");
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
}

function updateUIWithStudentActivity(activity) {
	switch(g_currentPane) {
		case STUDENT_PANE:
			// TODO: update student pane smartly
			// HACK: Update entire pane UI
			if (activity.activity_type == "message") {
				updatePane();
			}
		default:
			break;
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

	activities = JSON.parse(msg.data);
	var num_activities = activities.length;
	for(var i=0; i<num_activities; i++) {
		var activity = activities[i];
		switch(activity.activity_type) {
			case "log_in":
				handle_log_in(activity);
				break;
			case "log_out":
				handle_log_out(activity);
				break;
			case "task":
				// do nothing
				break;
			default:
				handle_activity(activity);
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

function handle_log_in(data) {
    var lesson = g_lessons[0];
    var lesson_code = lesson.lesson_code;
	if (data.lesson_code == lesson_code) {
		var student = g_students[data.student_nickname];
		if (student==undefined ) {
			student = {};
			student.logged_in = true;
			student.task_idx = data.activity_data.task_idx;		
			student.task_history = [];
			var numTasks = numberOfTasks();
			for (var i=0; i<numTasks; i++) {
				student.task_history.push([]);
			}
			g_students[data.student_nickname] = student;
		}
		else {
			student.logged_in = true;
			student.task_idx = data.activity_data.task_idx;
		}
		
		// TODO: Improve performance. Do not update entire pane.
		updatePane();
	}
}

function handle_log_out(data) {
    var lesson = g_lessons[0];
    var lesson_code = lesson.lesson_code;
	if (data.lesson_code==lesson_code && g_students[data.student_nickname]!=undefined) {
		g_students[data.student_nickname].logged_in = false;
		g_students[data.student_nickname].task_idx = 0;
		// TODO: Improve performance. Do not update entire pane.
		updatePane();
	}
}

function handle_activity(data) {
    var lesson = g_lessons[0];
    var lesson_code = lesson.lesson_code;
	if (data.lesson_code==lesson_code && g_students[data.student_nickname]!=undefined) {
		var dataString = data.student_nickname + ' (#' + data.lesson_code + '): ' + data.activity_type;
		if (typeof data.activity_data.description != "undefined") {
			dataString += ': ' + data.activity_data.description;
		}
		// TODO: pass off to appropriate handler
		//alert(dataString);
	}
		
	var task_idx = data.activity_data.task_idx;
	g_task_histories[task_idx].push(data);
	g_students[data.student_nickname].task_history[task_idx].push(data);
	
	if (task_idx == selectedTaskIdx()) {
		updateUIWithStudentActivity(data);
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
// UI Data Panes
//=================================================================================

function loadStudentPane() {
	var accumulator = new StudentAccumulator();
	for (var studentNickname in g_students) {
		var isLoggedIn = g_students[studentNickname].logged_in;
		accumulator.add(studentNickname, isLoggedIn);
	}
	
	var html = '<h3 id="pane_title" style="margin-bottom:10px">'+DATA_PANES[STUDENT_PANE].title+'</h3>';
	html += '<div id="data_list"></div>';
	$("#data_pane").html(html);
	
	var accordion = new StudentAccordion($("#data_list"), accumulator);
	accordion.show();
}

function loadTaskHistoryPane() {	
	var html = '<h3 id="pane_title" style="margin-bottom:10px">'+DATA_PANES[HISTORY_PANE].title+'</h3>';
	html += getTaskHistoryAsHTML();
	$("#data_pane").html(html);
}

function getPaneButtonId(paneName) {
	return "load_" + paneName + "_btn";
}

//=================================================================================
// UI Histories
//=================================================================================

function getTaskHistoryAsHTML() { 
	var html = '';
	var task = selectedTaskIdx()+1;
	var taskHistory = g_task_histories[task-1];
	// old on top
 	//for (var i=0; i<taskHistory.length; i++) {
	// new on top
 	for (var i=taskHistory.length-1; i>=0; i--) {
 		var taskItem = taskHistory[i];
 		var taskTime = getLocalTime(new Date(taskItem.timestamp));
 		var taskType = taskItem.activity_type;
		
 		html += '<tr>';
 		html += '<td>'+taskType+'</td>';
 		html += '<td style="width:13ex">'+taskItem.student_nickname+'</td>';
 		html += '<td style="width:15ex">' + getFormattedTimestamp(taskTime) + '</td>';
 		html += '</tr>';
 	}

    if (html != '') {
    	var rowHtml = html;
		html = '<table class="task_history">';
 		html += '<tr>';
 		html += '<td style="width:17ex"><h6>Task</h6></td>';
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
			var activity = taskHistory[i];
			var activityTime = getLocalTime(new Date(activity.timestamp));
			var activityType = activity.activity_type;
			var activityDescription = typeof activity.activity_data.description != "undefined" ? activity.activity_data.description : "-";
			html += '<tr>';
			html += '<td style="width:17ex">' + '<div style="width:'+ACTIVITY_DIM+'px;height:'+ACTIVITY_DIM+'px !important;background:'+getActivityColor(activityType)+'; float:left; margin-right:4px; margin-top:7px;">&nbsp;</div> ' + activityType.replace(" ", "&nbsp;") + '</td>';
			html += '<td>' + activityDescription + '</td>';
			html += '<td style="width:15ex">' + getFormattedTimestamp(activityTime) + '</td>';
			html += '</tr>';
		}
		html += '</table>';
	}
 	
 	return html;
}

function drawStudentHistories(items) {
    for (var i=0; i<items.length; i++) {
    	var item = items[i];
    	drawStudentHistory($('#student'+(i+1)+'_history'), item.studentNickname); 
    };
}

function drawStudentHistory(div, studentNickname) {
	var activityMargin = 1; // pixels
	var historyHeight = 20; // pixels
	var historyWidth = Math.ceil($('#accordion_list').width() * 0.35); // pixels
	var ellipsesWidth = 15; // pixels
	var largeGap = 15 * 60 * 1000; // 15 min (in ms)
	var topMargin = Math.floor((historyHeight/2)-(ACTIVITY_DIM/2));
    var maxNumActivitiesToDraw = Math.floor((historyWidth-ellipsesWidth)/(ACTIVITY_DIM+activityMargin))-2;

    $('.student_history').width(historyWidth);
    
    var task = selectedTaskIdx()+1;
 	var searchHistoryHtml = [];
    var student = g_students[studentNickname];
	var taskHistory = student.task_history[task-1];
	var numTasksDrawn = 0;
 	for (var i=0; i<taskHistory.length; i++) {
 		var activityHtml = '';
 		var activity = taskHistory[i];
 		var activityType = activity.activity_type;
		var activityDescription = typeof activity.activity_data.description != "undefined" ? activity.activity_data.description : "-";

     	if (i>0) {
 			var activityTime = getLocalTime(new Date(activity.timestamp));
 			var prevActivityTime = getLocalTime(new Date(taskHistory[i-1].timestamp));
 			var isLargeGap = (activityTime.getTime()-prevActivityTime.getTime())>=largeGap;
     		if (isLargeGap) {
 				activityHtml += '<div class="largegap" style="width:1px;height:20px !important;background:grey;float:left;margin-right:'+activityMargin+'px;"></div>';
 			}
 		}
 		
     	activityHtml += '<div id="event_'+(i+1)+'" title="'+activityDescription+'" style="width:'+ACTIVITY_DIM+'px;height:'+ACTIVITY_DIM+'px !important;background:'+getActivityColor(activityType)+';float:left;margin-right:'+activityMargin+'px;margin-top:'+topMargin+'px;">&nbsp;</div>';
 		searchHistoryHtml.push(activityHtml);
 	}
 	
 	// show up to numActivitiesToRemove of most recent tasks
    // and show ellipses (...) at beginning if more than maxNumActivitiesToDraw
    var numActivitiesToRemove = 0;
    if (searchHistoryHtml.length > maxNumActivitiesToDraw) {
    	numActivitiesToRemove = searchHistoryHtml.length - maxNumActivitiesToDraw;
 	}

 	for (var i=0; i<numActivitiesToRemove; i++) {
 		searchHistoryHtml.shift();
 	}
 	
 	var html = searchHistoryHtml.join('');
 	if (numActivitiesToRemove > 0) {
 		html = '<div style="width:'+ellipsesWidth+'px;height:'+ACTIVITY_DIM+'px !important;float:left;">...</div>' + html;
 	}
 	else {
 		html = '<div style="width:'+ellipsesWidth+'px;height:'+ACTIVITY_DIM+'px !important;float:left">&nbsp;</div>' + html;
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

function getActivityColor(type) {
	return typeof ACTIVITY_COLORS[type] != "undefined" ? ACTIVITY_COLORS[type] : ACTIVITY_COLORS['default'];
}


//=================================================================================
// UI Accordion Lists
//=================================================================================

function AccordionList() {
	this.div = null;
	this.items = [];
}

AccordionList.prototype.show = function() {
	if (!this.div) {
		return;
	}
	
	if (this.items.length==0) {
		var html = '<div style="margin-bottom:15px;">(none)</div>';
		this.div.html(html);
	}
	else {
		var html = '<div id="accordion_list" class="accordion2">';
		for (var i=0; i<this.items.length; i++) {
			var item = this.items[i];
			html += '<div id="item'+(i+1)+'" class="accordion_section"><a href="#"><span class="text_key">'+item.getKey()+'</span>'+item.asHTML()+this.customItemAddOns(item, i)+'</a></div>';		
			html += '<div id="item'+(i+1)+'_expanded">';
			html += this.customExpandedHeader();
			html += this.expandedItem(item, i);
			html += '</div>';		
		}
		html += '</div>';
		this.div.html(html);
				
		g_activeAccordionIndex = this.getSelectedIndex(g_activeAccordionKey);
		$('#accordion_list').accordion({
			collapsible: true, 
			active: g_activeAccordionIndex,
			change: function(event, control) {
				g_activeAccordionIndex = control.options.active;
				var selectedItem = $(".accordion_section:eq("+g_activeAccordionIndex+")");
				g_activeAccordionKey = $('.text_key', selectedItem).html();
			}
		});
	}
}

AccordionList.prototype.getSelectedIndex = function(itemKey) {
	var itemIndex = false;
	if (itemKey!=null) {
		for (var i=0; i<this.items.length; i++) {
			if (itemKey == this.items[i].getKey()) {
				itemIndex = i;
				break;
			}
		}
	}
	return itemIndex;
}

AccordionList.prototype.customItemAddOns = function(item, i) {
	return "";
}

AccordionList.prototype.customExpandedHeader = function(item, i) {
	return "";
}

AccordionList.prototype.expandedItem = function(item, i) {
	return "";
}

StudentAccordion.prototype = new AccordionList();
StudentAccordion.prototype.constructor = StudentAccordion;

function StudentAccordion(div, accumulator) {
	AccordionList.call(this);
	this.div = div;
	this.accumulator = accumulator;
	this.items = this.accumulator.getItems();
}

StudentAccordion.prototype.customItemAddOns = function(item, i) {
	var html = "";
	if (item.isLoggedIn) {
			html += ' <button class="logout_btn" value="'+item.studentNickname+'" title="Logout student">X</button>';
	}
	html += '<div id="student'+(i+1)+'_history" class="student_history" style="float:right; margin-right:5px"></div></a>';
	return html;
}

StudentAccordion.prototype.expandedItem = function(item, i) {
	var html = "<h5>Task History</h5>\n";
	html += getStudentHistoryAsHTML(item.studentNickname);
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

//=================================================================================
// Pane Data
//=================================================================================

//For info on JavaScript OOP, see:
//http://www.javascriptkit.com/javatutors/oopjs.shtml   (new and this)
//http://www.javascriptkit.com/javatutors/oopjs2.shtml  (constructors)
//http://www.javascriptkit.com/javatutors/oopjs3.shtml  (inheritance)

function DataAccumulator() {
	this.dict = {};
	this.sortBy = null;
}

DataAccumulator.prototype.add = function(key, item) {
	if (this.dict[key] === undefined) {
		this.dict[key] = item;
	}
}

DataAccumulator.prototype.getItems = function() {
	var items = dict2Array(this.dict);
	sortInPlaceAlphabetically(items, this.sortBy);
	return items;
}
	
function DataItem() {
}

StudentAccumulator.prototype = new DataAccumulator();
StudentAccumulator.prototype.constructor = StudentAccumulator;
function StudentAccumulator() {
	DataAccumulator.call(this);
	this.sortBy = "studentNickname";
}

StudentAccumulator.prototype.getItems = function() {
	// sort names alphabetically w/logged in users on top
	if (this.sortBy == "login") {
		var items = dict2Array(this.dict);
		items.sort( function(a,b) {
			if (a.isLoggedIn==true && b.isLoggedIn==false) {
				return -1;
			}
			else if (a.isLoggedIn==false && b.isLoggedIn==true) {
				return 1;
			}
			else {
				var aName = a.studentNickname.toLowerCase();
				var bName = b.studentNickname.toLowerCase();
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

StudentAccumulator.prototype.add = function(nickname, loggedIn) {
	var item = new StudentDataItem(nickname, loggedIn);
	DataAccumulator.prototype.add.call(this, nickname, item);
}

StudentDataItem.prototype = new DataItem();
StudentDataItem.prototype.constructor = StudentDataItem;
function StudentDataItem(studentNickname, isLoggedIn) {
	this.studentNickname = studentNickname;
	this.isLoggedIn = isLoggedIn;
}

StudentDataItem.prototype.getKey = function() {
	return this.studentNickname.replace('"','&quot;');
}
	
StudentDataItem.prototype.getAnnotationsItemLists = function() {
	return [[]];
}
	
StudentDataItem.prototype.asHTML = function() {
	var className = (this.isLoggedIn===false ? "studentLoggedOut" : "studentLoggedIn");
	return '<span class="nickname ' + className + '" style="font-size:1em;">' + escapeForHtml(this.studentNickname) + '</span>';
}
	
StudentDataItem.prototype.asExpandedHTML = function() {
	return this.asHTML();
}

//=================================================================================
// History Data
//=================================================================================

function updateHistoryData() {
	for (var task_idx=0; task_idx<g_task_histories.length; task_idx++) {
		var task_history = g_task_histories[task_idx];
		for (var j=0; j<task_history.length; j++) {
			var activity = task_history[j];
			g_students[activity.student].task_history[task_idx].push(activity);
		}
	}
}