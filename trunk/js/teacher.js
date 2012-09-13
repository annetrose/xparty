/*
# XParty - A Framework for Building Tools for Learning in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn -- www.alexquinn.org
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

var g_complete_histories = [];

// panes
var g_itemList = null;
var g_currentPaneName = null;

var g_activeSectionIndex = false;
var g_activeSectionKey = null;

// charts
var g_chartApiLoaded = false;
var g_chart = null;
var g_chartData = null;
var g_chartOptions = null;
var g_minTaskTime = null;
var g_maxTaskTime = null;

// student histories
var g_actionDim = 6; // pixels
var g_actionColors = { search:'#888888', link:'#454C45', link_helpful:'#739c95', link_unhelpful:'#5C091F', answer:'blue' };

function initializeTeacher() {
	window.status = "Loading...";
	openChannel();
	initUI();
	initHistoryData();
	window.status = "Loaded";
}

function updateData() {
	initHistoryData();
}

function initHistoryData() {
	for (var taskIdx=0; taskIdx<g_lessons[0].tasks.length; taskIdx++) {
		g_complete_histories[taskIdx] = [];
		for (var studentNickname in g_students) {
			var student = g_students[studentNickname];
			for (var i=0; i<student.task_history[taskIdx].length; i++) {
				var task = student.task_history[taskIdx][i];
				task.student_nickname = studentNickname;
				g_complete_histories[taskIdx].push(task);
			}
		}
		
		g_complete_histories[taskIdx].sort(function(x, y) {
			return new Date(x.timestamp) - new Date(y.timestamp);
		});		
	}
}

$(window).resize(function() {
	if (g_itemList!=null && g_currentPaneName=="students") {
		drawStudentHistories(g_itemList);
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
	// Note:  Messages are limited to 32K.  This is not an issue now, but it
	// might come up in the future.
	//
	// http://code.google.com/appengine/docs/python/channel/overview.html

	window.status = msg.data;
	updates = JSON.parse(msg.data);
	var num_updates = updates.length;
	for(var i=0; i<num_updates; i++) {
		var update = updates[i];
		switch(update.type) {
			case "log_in":
				handle_log_in(update);
				break;
			case "log_out":
				handle_log_out(update);
				break;
			case "message":
				handle_message(update);
				break;
			default:
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
// Task and Message Handlers
//=================================================================================

function updateTaskDescription(taskIdx) {
    var html = g_lessons[0].tasks[taskIdx][1];
    if (html == '') html = '(none)';
    $('#task_description').html(html);
}

function onTaskChanged(taskIdx) {
	// onTaskChanged is called from js/task_chooser.js
	g_minTaskTime = null;
	g_maxTaskTime = null;
	updateTaskDescription(taskIdx);
	updateUI();
}

function handle_log_in(data) {
	if (data.lesson_code == g_lesson_code) {
		var student_info = g_students[data.student_nickname];
		if (student_info==undefined ) {
			student_info = {};
			student_info.logged_in = true;
			student_info.task_idx = data.task_idx;		
			student_info.task_history = [];
			student_info.tasks = [];
			var numTasks = numberOfTasks();
			for (var i=0; i<numTasks; i++) {
				student_info.task_history.push([]);
				student_info.tasks.push({});
			}
			g_students[data.student_nickname] = student_info;
		}
		else {
			student_info.logged_in = true;
			student_info.task_idx = task_idx;
		}
		updateUI();
	}
}

function handle_log_out(data) {
	if (data.lesson_code==g_lesson_code && g_students[data.student_nickname]!=undefined) {
		var student_info = g_students[data.student_nickname];
		student_info.logged_in = false;
		student_info.task_idx = null;
		updateUI();
	}
}

function handle_message(data) {
	if (data.lesson_code==g_lesson_code && g_students[data.student_nickname]!=undefined) {
		alert(data.student_nickname + ' says: '+data.msg+' - lesson #'+data.lesson_code);
	}
}

function updateMinMaxTaskTimes(timestamp) {
	var localTime = getLocalTime(new Date(timestamp));
	if (!g_minTaskTime) {
		g_minTaskTime = localTime;
		g_maxTaskTime = localTime;
	}
	else if (localTime < g_minTaskTime) {
		g_minTaskTime = localTime;
	}
	else if (localTime > g_maxTaskTime) {
		g_maxTaskTime = localTime;
	}
}

//=================================================================================
// Update UI
//=================================================================================

function initUI() {    
    var lesson = g_lessons[0];
    var lesson_code = lesson.lesson_code;
    $('#lesson_title').html(lesson.title);
    $('#lesson_code').html(lesson_code);
    $('#task_chooser').selectbox();
    updateTaskDescription(0);  
    
    var utc_offset_minutes = (new Date()).getTimezoneOffset();
	var html = '';
    html += '<button class="cssbtn" id="edit_lesson_btn_'+lesson_code+'" onclick="goToLessonForm(\''+lesson_code+'\');">Edit activity<span class="edit"></span></button><br/>';
	html += '<button class="cssbtn" id="stop_lesson_btn_'+lesson_code+'" style="display:none" onclick="stopLesson(\''+lesson_code+'\')">Stop activity<span class="stop"></span></button>';
	html += '<button class="cssbtn" id="start_lesson_btn_'+lesson_code+'" style="display:none" onclick="startLesson(\''+lesson_code+'\')">Start activity<span class="start"></span></button>';
	html += '<br/>';
	html += '<button class="cssbtn" id="clone_lesson_btn_'+lesson_code+'" onclick="cloneLesson(\''+lesson_code+'\', false)">Clone activity</button><br/>';
    html += '<button class="cssbtn" id="download_data_btn_'+lesson_code+'" onclick="window.location=\'/data_dump?lesson_code='+lesson_code+'&utc_offset_minutes=' + utc_offset_minutes + '\'; return false;">Download data<span class="dl"></span></button><br/>' 
    html += '<button class="cssbtn" id="clear_lesson_btn_'+lesson_code+'" onclick="clearLesson(\''+lesson_code+'\', false)">Clear data<span class="clr"></span></button><br/>';
    html += '<button class="cssbtn" id="delete_lesson_btn_'+lesson_code+'" onclick="deleteLesson(\''+lesson_code+'\')">Delete activity<span class="del"></span></button>';
    $('#side_button_bar2').html(html);
}

function loadUIData() {
	g_chartApiLoaded = true;
	updateUI();
	loadPane(START_PANE);
}

function updateUI() {
	// check if activity was deleted and if so, redirect to dashboard
	if (g_lessons.length==0) {
		window.location = '/teacher_dashboard';
		return;
	}
	
	updateSideBarInfo();
	updateButtons();
	$("#data_display_content").html("");
	switch( g_currentPaneName ) {
		case "complete":
			updateCompleteHistory();
			break;
		case "students":
			updateStudents();
			break;
		default:
			break;
	}
				
	$('#inactive').toggle(!g_lessons[0].is_active);

	if (g_activeSectionKey!=null && g_itemList!=null) {
		$.each(g_itemList.items, function(idx,item) {
			var itemKey = item.getKey();
			if (itemKey == g_activeSectionKey) {
				g_activeSectionIndex = idx;
				return;
			}
		});
	}
	
	$('#task_activity').accordion({
	   	collapsible: true, 
	   	active: g_activeSectionIndex,
	    change: function(event, control) {
	    	g_activeSectionIndex = control.options.active;
	    	var activeSection = $(".accordion_section:eq("+g_activeSectionIndex+")");
	    	g_activeSectionKey = $('.text_key', activeSection).html();
	    }
	});
}

function updateUIWithStudentActivity(studentNickname) {
	switch(g_currentPaneName) {
		case "students":
			updateSideBarInfo();
			updateButtons();
			if (g_itemList!=null) {
							    
			    // update student history (both visual and list representations)
			    drawStudentHistory(null, studentNickname);
			    listStudentHistory(null, studentNickname);
		    
			    // update expanded html for student groups
			    var html = '';
			    var studentData = new StudentDataItem(studentNickname, g_students[studentNickname].logged_in);
		 		var studentIndex = getStudentSection(studentNickname);
			    if (studentData.getHeaderHTML) {
					html += studentData.getHeaderHTML();
				}
				
				var itemLists = studentData.getAnnotationsItemLists();
				$.each(itemLists, function(i,itemList) {
					html += itemList.asExpandedHTML();
				});
			    
		 		div = $('#item'+(studentIndex+1)+'_groups');
		 		div.html(html);
			}
			break;
		default:
			updateUI();
			break;
	}
}

function initPaneAndUpdateUI() {
	g_activeSectionIndex = false;
	g_activeSessionKey = null;
	updateUI();
}

function updateSideBarInfo() {
	var numStudents = calculateNumStudents();
	$("#num_students").html(numStudents);
}

function updateCompleteHistory() {			
	$('#pane_title').html('Complete History');
	$('#task_activity').hide();
	listCompleteStudentHistories();
	$('#complete_history').show();
}

function updateStudents() {
	var accumulator = new StudentAccumulator();
	// TODO / FIX: Returning duplicate student names (2x number expected); not sure why
	//var studentNames = keysOfObject(g_students);
	var studentNames = Object.keys(g_students);
	$.each(studentNames, function(i, studentNickname) {
		var isLoggedIn = g_students[studentNickname].logged_in;
		accumulator.add(studentNickname, isLoggedIn);
	});
		
	var itemList = accumulator.getItems();
	updateAnyWithItems(itemList);
	if (itemList.hasItems()) {
		$(".item_groups").show();
		$(".student_history_list").hide();
	}
}

function updateAnyWithItems(itemList) {
	g_itemList = itemList;
	$("#data_display_content").html(itemList.asHTML());
	
	$(".logout_btn").click(function(event) {
		event.stopPropagation();
	    var lesson = g_lessons[0];
	    var lessonCode = lesson.lesson_code;
		logoutStudent($(this).val(), lessonCode);
	});
}

//=================================================================================
// UI Pane
//=================================================================================

function loadPane(paneName) {
	if(g_currentPaneName !== null) {
		$("#"+getPaneId(g_currentPaneName)).removeClass("selected");
		$("#"+loadButtonId(g_currentPaneName)).removeClass("selected");
	}
	g_currentPaneName = paneName;
	g_currentPaneSort = null;
	$("#"+getPaneId(g_currentPaneName)).addClass("selected");
	$("#"+loadButtonId(g_currentPaneName)).addClass("selected");
	initPaneAndUpdateUI();
	window.location.hash = g_currentPaneName;
}

function getPaneId(paneName) {
	return "pane_" + paneName;
}

function loadButtonId(paneName) {
	return "load_" + paneName + "_btn";
}

function updateButtons() {
	var numStudents = Object.keys(g_students).length;
	document.getElementById(loadButtonId("students")).innerHTML = "Students (" + numStudents + ")";
	var lesson_code = g_lessons[0].lesson_code;
    $('#stop_lesson_btn_'+lesson_code).toggle(g_lessons[0].is_active);
    $('#start_lesson_btn_'+lesson_code).toggle(!g_lessons[0].is_active);
}

//=================================================================================
// Aggregation
//=================================================================================

function DataItem(type, displayText, count, className) {
//For info on JavaScript OOP, see:
//http://www.javascriptkit.com/javatutors/oopjs.shtml   (new and this)
//http://www.javascriptkit.com/javatutors/oopjs2.shtml  (constructors)
//http://www.javascriptkit.com/javatutors/oopjs3.shtml  (inheritance)

	this.type = type;
	this.displayText = displayText;
	this.count = count;
	this.className = className;
}

function ItemList(items, type, title) {
	this.items = items;
	this.type = type;
	this.title = title;
	
	this.itemsAsHTML = function() {
		var items = this.items;
		var html;
		if (items.length==0) {
			html = '<div style="margin-bottom:18px;">(none)</div>'
		}
		else {
			html = '<div id="task_activity" class="accordion2">';
			var thisList = this;
			$.each(items, function(idx,dataItem) {
				html += thisList.itemAsHTML(idx, dataItem);
			});
			html += '</div>';
		}
		return html;
	}
	
	this.itemAsHTML = function(idx, dataItem) {
		var html = '';
		
		// item# div
		if (dataItem.getKey) {
			if (this.type == "student") {
				var logoutButton = '';
			    if (dataItem.isLoggedIn) {
			    	logoutButton = ' <button class="logout_btn" value="'+dataItem.studentNickname+'" title="Logout student">X</button>';
				}
			    html += '<div id="item'+(idx+1)+'" class="accordion_section"><a href="#"><span class="text_key">'+dataItem.getKey()+'</span>'+dataItem.asHTML()+logoutButton+'<div id="student'+(idx+1)+'_history" class="student_history" style="float:right; margin-right:5px"></div></a></div>';
			}
			else {
				html += '<div id="item'+(idx+1)+'" class="accordion_section"><a href="#"><span class="text_key">'+dataItem.getKey()+'</span>'+dataItem.asHTML()+'</a></div>';						
			}
		}
		else {
			html += '<div><a href="#">' + dataItem.asHTML() + '</a></div>';
		}
	
		// item#_expanded div: contains item#_groups and student#_history_list (if on student pane)
		html += '<div id="item'+(idx+1)+'_expanded">';
		html += '<div id="item'+(idx+1)+'_groups" class="item_groups">';
		if (dataItem.getHeaderHTML) {
			html += dataItem.getHeaderHTML();
		}
		
		var itemLists = dataItem.getAnnotationsItemLists();
		$.each(itemLists, function(i,itemList) {
			html += '(none)';
		});
		
		html += '</div>';
		
		if (this.type == "student") {
			html += '<div id="student'+(idx+1)+'_history_list" class="student_history_list" style="display:block"></div>';
		}
		
		html += '</div>';
		
		return html;
	}
	
	this.asHTML = function() {
		var html = '<h3 id="pane_title" style="margin-bottom:10px">' + escapeForHtml(this.title) + '</h3>';
		html += '<div id="complete_history" class="complete_history"></div>';
		html += this.itemsAsHTML();
		html += '</div>';
		return html;
	}
	
	this.itemsAsExpandedHTML = function() {
		var items = this.items;
		// tightened space vertically (atr)
		//var html = '<ol style="margin-bottom:18px">'
		var html = '<ol style="margin-bottom:12px">'
		if( items.length==0 ) {
			html += '<li class="data_display_item">(none)</li>'
		}
		else {
			$.each(items, function(idx,dataItem) {
				html += '<li class="data_display_item">'+dataItem.asExpandedHTML()+'</li>';
			});
		}
		html += '</ol>'
		return html;
	}
	
	this.asExpandedHTML = function() {
		// tightened space vertically (atr)
		//return '<h3 style="margin-bottom:10px">' + escapeForHtml(this.title) + '</h3>' + this.itemsAsExpandedHTML();
		return '<h5>' + escapeForHtml(this.title) + '</h5>' + this.itemsAsExpandedHTML();
	}
	
	this.hasItems = function() {
		return this.items.length > 0;
	}
}

function StudentAccumulator() {
	this.add = function(studentNickname, isLoggedIn) {
		var occurrenceDict = this._occurrenceDict;
		var occurrenceKey = studentNickname;
		var counterItem = occurrenceDict[occurrenceKey];
		if (counterItem===undefined) {
			counterItem = new StudentDataItem(studentNickname, isLoggedIn);
			occurrenceDict[occurrenceKey] = counterItem;
		}
	};

	this.getItems = function() {
		var items = valuesOfObject(this._occurrenceDict);
		// Sort names alphabetically w/logged in users on top		
		if (this._sortBy == "Login Status") {
			items.sort( function (a,b) {
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
		// Sort alphabetically by student nickname
		else {
			sortInPlaceAlphabetically(items, 'studentNickname');
		}
		return new ItemList(items, "student", "Students");
	}

	this.getSort = function() {
		return this._sortBy;
	}
	
	this.setSort = function(sort) {
		if (sort != null) {
			this._sortBy = sort;
		}
	}

	this._sortBy = "Login Status";
	this._occurrenceDict = {};
}

function StudentDataItem(studentNickname, isLoggedIn) {
	this._super = DataItem;
	this._super("student", studentNickname, null, "student_data_item");
	this.studentNickname = studentNickname;
	this.isLoggedIn = isLoggedIn;

	this.getKey = function() {
		return this.studentNickname.replace('"','&quot;');
	}
	
	this.getAnnotationsItemLists = function() {
		return [[]];
	}
	
	this.asHTML = function() {
		var className = (this.isLoggedIn===false ? "studentLoggedOut" : "studentLoggedIn");
		return '<span class="nickname ' + className + '" style="font-size:1em;">' + escapeForHtml(this.studentNickname) + '</span>';
	}
	
	this.asExpandedHTML = function() {
		return this.asHTML();
	}
}
    
//=================================================================================
// Charts
//=================================================================================

function createChart(chart_div, data, customOptions, defaultSelectAction) {
	if (g_chartApiLoaded) {
		// Need to recreate chart unless div has not been deleted/re-created
        g_chart = new google.visualization.ColumnChart(document.getElementById(chart_div));
        g_chartData = data;
        g_chartOptions = {
            'width' : '100%',
            'height': 200,
            'backgroundColor': '#dfddd5',
        };
        for (var attr in customOptions) {
        	g_chartOptions[attr] = customOptions[attr];
        }
        drawChart();
	
        if (defaultSelectAction) {
        	google.visualization.events.addListener(g_chart, 'select', function() {
            	var selection = g_chart.getSelection();
            	var item = selection[0];
            	if (item != undefined) {
           			var active = $('#task_activity').accordion("option", "active");
           			if (active===false || active != item.row) {
            			$('#task_activity').accordion("option", "active", item.row);
            		}
            	}
            	else {
           			$('#task_activity').accordion("option", "active", false);
            	}
        	});
        }
	}
	
	return g_chart;
}

function drawChart() {
	if (g_chart != null) {
		g_chart.draw(g_chartData, g_chartOptions);
	}
}


//=================================================================================
// Student Histories
//=================================================================================

function drawStudentHistories(itemList) {
    $.each(itemList.items, function(idx, item) {
    	drawStudentHistory($('#student'+(idx+1)+'_history'), item.studentNickname); 
    	listStudentHistory($('#student'+(idx+1)+'_history_list'), item.studentNickname);
    });
}

function drawStudentHistory(div, studentNickname) {
	var actionMargin = 1; // pixels
	var historyHeight = 20; // pixels
	var historyWidth = Math.ceil($('#task_activity').width() * 0.35); // pixels
	var ellipsesWidth = 15; // pixels
	var largeGap = 15 * 60 * 1000; // 15 min (in ms)
	var topMargin = Math.floor((historyHeight/2)-(g_actionDim/2));
    var maxNumActionsToDraw = Math.floor((historyWidth-ellipsesWidth)/(g_actionDim+actionMargin))-2;

    $('.student_history').width(historyWidth);
    
    var task = selectedTaskIdx()+1;
 	var searchHistoryHtml = [];
    var student = g_students[studentNickname];
	var taskHistory = student.task_history[task-1];
	var numTasksDrawn = 0;
 	for (var i=0; i<taskHistory.length; i++) {
 		var actionHtml = '';
 		var action = taskHistory[i];
 		var type = action.activity_type;

		// if rating, change color of previous visit to link
	 	// do not draw separate task box for ratings
 		if (type=='link_rating') {
 			var linkIndex = getIndexOfLink(taskHistory, action.link, i);
 			if (linkIndex != -1) {
 				var newColor = g_actionColors[action.is_helpful?'link_helpful':'link_unhelpful'];
 				var newTitle = action.is_helpful ? 'Helpful Link' : 'Unhelpful Link';
 				newTitle += ': '+(action.link_title!=null ? action.link_title+' ('+action.link+')' : action.link);
 			
				var linkHtml = '';
				if (searchHistoryHtml[linkIndex].indexOf('"largegap"') != -1) {
					linkHtml += '<div class="largegap" style="width:1px;height:20px !important;background:grey;float:left;margin-right:'+actionMargin+'px;"></div>';;
				}
				linkHtml += '<div id="event_"'+(linkIndex+1)+' title="'+newTitle+'" style="width:'+g_actionDim+'px;height:'+g_actionDim+'px !important;background:'+newColor+';float:left;margin-right:'+actionMargin+'px;margin-top:'+topMargin+'px;">&nbsp;</div>';

 				searchHistoryHtml.push(''); // empty place holder for link rating event so array indices are correct
				searchHistoryHtml[linkIndex] = linkHtml;
				continue;
 			}
 		}
 		
     	if (i>0) {
 			var taskTime = getLocalTime(new Date(action.timestamp));
 			var prevTaskTime = getLocalTime(new Date(taskHistory[i-1].timestamp));
 			var isLargeGap = (taskTime.getTime()-prevTaskTime.getTime())>=largeGap;
     		if (isLargeGap) {
 				actionHtml += '<div class="largegap" style="width:1px;height:20px !important;background:grey;float:left;margin-right:'+actionMargin+'px;"></div>';
 			}
 		}
 		
 		var title = '';
 		if (type=='search') {
 			title = 'Query: '+action.search;
 		}
 		else if (type=='link') {
 			title = "Unrated Link: "+action.link_title+' ('+action.link+')';
 		}
 		else if (type=='link_rating') {
 			// only gets here if previous visit to link not found (i.e., link rated w/o link visit getting recorded)
 			type = action.is_helpful ? 'link_helpful' : 'link_unhelpful';
			title = action.is_helpful ? 'Helpful Link' : 'Unhelpful Link';
			title += ': '+(action.link_title!=null ? action.link_title+' ('+action.link+')' : action.link);
 		}
 		else if (type=='answer') {
 		    title = "Response: "+action.answer_text;
 		    if (action.answer_explanation) title += ' ('+action.answer_explanation+')';
	    }
 		
 		actionHtml += '<div id="event_"'+(i+1)+' title="'+title+'" style="width:'+g_actionDim+'px;height:'+g_actionDim+'px !important;background:'+g_actionColors[type]+';float:left;margin-right:'+actionMargin+'px;margin-top:'+topMargin+'px;">&nbsp;</div>';
 		searchHistoryHtml.push(actionHtml);
 	}
 	
 	// show up to maxNumActionsToDraw of most recent tasks
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
 		html = '<div style="width:'+ellipsesWidth+'px;height:'+g_actionDim+'px !important;float:left;">...</div>' + html;
 	}
 	else {
 		html = '<div style="width:'+ellipsesWidth+'px;height:'+g_actionDim+'px !important;float:left">&nbsp;</div>' + html;
 	}
 	
 	if (div==null) {
 		var sectionIndex = getStudentSection(studentNickname);
 		div = $('#student'+(sectionIndex+1)+'_history');
 	}
 	div.html(html);
}

function getIndexOfLink(items, url, pos) {
 	var index = -1;
	for (var i=pos; i>=0; i--) {
 		var item = items[i];
 		if (item.activity_type=='link' && item.link==url) {
 			index = i;
 			break;
 		}
 	}
	return index;
}

function listStudentHistory(div, studentNickname) { 
    var task = selectedTaskIdx()+1;
    var student = g_students[studentNickname];
	var taskHistory = student.task_history[task-1];
	var html = '';
	// old on top
 	//for (var i=0; i<taskHistory.length; i++) {
	// new on top
 	for (var i=taskHistory.length-1; i>=0; i--) {
 		var taskItem = taskHistory[i];
 		var taskTime = getLocalTime(new Date(taskItem.timestamp));
 		var taskType = taskItem.activity_type;
		if (taskType=='link_rating') {
			if (taskItem.is_helpful) taskType='link_helpful';
			else taskType='link_unhelpful';
		}
 		
// 		var skip = (i<taskHistory.length-1) && (taskType=='link') && (taskHistory[i+1].activity_type=='link_rating') && (taskItem.link==taskHistory[i+1].link);
//     	if (skip) continue;
 		
 		var type = '';
 		var details = '';
 		if (taskType=='search') {
 			type = 'Query';
 			details = taskItem.search;
 		}
 		else if (taskType=='link') {
 			type = "Link";
 			details = taskItem.link_title+'<br/>';
 		    details += '<a href="'+taskItem.link+'" target="_blank">'+taskItem.link+'</a>';
 		}
 		else if (taskType=='link_helpful') {
 		    type = "Rated Helpful";
 			details = '';
 			if (taskItem.link_title!=null) {
 				details = taskItem.link_title+'<br/>';
 			}
 			else if (taskHistory[i-1]!=undefined && taskHistory[i-1].link!=null && taskHistory[i-1].link==taskItem.link) {
 				details = taskHistory[i-1].link_title+'<br/>';
 			}
 			details += '<a href="'+taskItem.link+'" target="_blank">'+taskItem.link+'</a>';
 	    }
 		else if (taskType=='link_unhelpful') {
 		    type = "Rated Unhelpful";
 			details = '';
 			if (taskItem.link_title!=null) {
 				details = taskItem.link_title+'<br/>';
 			}
 			else if (taskHistory[i-1]!=undefined && taskHistory[i-1].link!=null && taskHistory[i-1].link==taskItem.link) {
 				details = taskHistory[i-1].link_title+'<br/>';
 			}
 			details += '<a href="'+taskItem.link+'" target="_blank">'+taskItem.link+'</a>';
 	    }
 		else if (taskType=='answer') {
 		    type = "Response";
 		    details = taskItem.answer_text;
 		    if (taskItem.answer_explanation) details += '<br/><em>'+taskItem.answer_explanation+'</em>';
	    }
 		
 		html += '<tr>';
 		html += '<td style="width:17ex">' + '<div style="width:'+g_actionDim+'px;height:'+g_actionDim+'px !important;background:'+g_actionColors[taskType]+'; float:left; margin-right:4px; margin-top:7px;">&nbsp;</div> ' + type.replace(" ", "&nbsp;") + '</td>';
 		html += '<td>' + details + '</td>';
 		html += '<td style="width:15ex">' + getFormattedTimestamp(taskTime) + '</td>';
 		html += '</tr>';
 	}

 	if (html != '') {
		html = '<table class="task_history">'+html+'</table>';
 	}
 	else {
 		var html = '<ol style="margin-bottom:12px">'
 		html += '<li class="data_display_item">(none)</li>'
 		html += '</ol>'
 	}
 	
 	if (div==null) {
 		var sectionIndex = getStudentSection(studentNickname);
 		div = $('#student'+(sectionIndex+1)+'_history_list');
 	}
 	
 	html = '<h5>Task History</h5>\n' + html;
 	div.html(html);
}

function listCompleteStudentHistories() { 
	var html = '';
	var task = selectedTaskIdx()+1;
	var taskHistory = g_complete_histories[task-1];
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

 	$('#complete_history').html(html);
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

// bin data into bins of x minutes, where x = binInterval
function binData(data, binInterval) {
	var binnedData = [];
	var binCounts = [];
	var minTime = null;
	var maxTime = null;	
		
	for (var i=0; i<data.length; i++) {
		var dataType = data[i].activity_type;
		var skip = (i<data.length-1) && (dataType=='link') && (data[i+1].activity_type=='link_rating');
		if (skip) continue;
		
		if (dataType=='link_rating') {
			if (data[i].is_helpful) dataType='link_helpful';
			else dataType='link_unhelpful';
		}
		var dataTime = getLocalTime(new Date(data[i].timestamp));
		if (minTime==null) {
			minTime = dataTime;
			maxTime = new Date(minTime.getTime()+(binInterval*60*1000));	
		}

		if (dataTime >= maxTime) {
			// save previous bin
			if (Object.keys(binCounts).length>0) {
				for (var binType in binCounts) {
					binnedData.push({activity_type:binType, timestamp:minTime, count:binCounts[binType]});
				}
			}

			// initialize bin
			binCounts = [];
			var minTime = dataTime;
			var maxTime = new Date(minTime.getTime()+(binInterval*60*1000));	
		}
	
		// increment bin counts
		if (binCounts[dataType] == undefined) binCounts[dataType] = 1;
		else binCounts[dataType]++;
	}
	
	// save last bin
	if (Object.keys(binCounts).length>0) {
		for (var binType in binCounts) {
			binnedData.push({activity_type:binType, timestamp:minTime, count:binCounts[binType]});
		}
	}
	
	return binnedData;
}

//=================================================================================
// Helpers
//=================================================================================

function copyOfArray(arr) {
	var newArray = [];
	var numItems = arr.length;
	for(var i=0; i<numItems; i++) {
		newArray.push( arr[i] );
	}
	return newArray;
}

function keysOfObjectSortedByValueDescending(o) {
	// TODO / FIX: Returning duplicate keys (2x number expected); not sure why
	//var keys = keysOfObject(o);
	var keys = Object.keys(o);
	keys.sort(function (a,b) {
		var aValue = o[a];
		var bValue = o[b];
		return (aValue > bValue ? -1 : (aValue < bValue ? 1 : 0));
	});
	return keys;
}

function keysOfObject(o) {
	var keys = [];
	$.each(o, function (k,v) {
		for(var k in o) {
			keys.push(k);
		}
	});
	return keys;
}

function sortInPlaceAlphabetically(items, propertyName) {
	items.sort(function(a,b) {
		var aValue = a[propertyName];
		var bValue = b[propertyName];
		
		// check if property is an array
		// if so, convert to comma-separated sorted string of values
		if ($.isArray(aValue)) {
			aValue = aValue.sort().join(', ');
			bValue = bValue.sort().join(', ');
		}
			
		// case insensitive sort
		var aValue = aValue.toLowerCase();
		var bValue = bValue.toLowerCase();
		return (aValue > bValue ? 1 : (aValue < bValue ? -1 : 0));
	});
}

function sortInPlaceByCountDescending(items, propertyName) {
	items.sort(function(a,b) {
		var aCount = a.count;
		var bCount = b.count;
		var result = (aCount > bCount ? -1 : (aCount < bCount ? 1 : 0));
		if( result===0 && propertyName ) {
			var aValue = a[propertyName];
			var bValue = b[propertyName];
			
			// check if property is an array
			// if so, convert to comma-separated sorted string of values
			if ($.isArray(aValue)) {
				aValue = aValue.sort().join(', ');
				bValue = bValue.sort().join(', ');
			}

			aValue = (((typeof aValue)=="string") ? aValue.toLowerCase() : aValue);
			bValue = (((typeof bValue)=="string") ? bValue.toLowerCase() : bValue);
			result = (aValue > bValue ? 1 : (aValue < bValue ? -1 : 0));
		}
		return result;
	});
}

function valuesOfObject(o) {
	var values = [];
	for(var k in o) {
		values.push(o[k]);
	};
	return values;
}

function assert(condition, msg) {
	if (!condition) {
		var s = JSON.stringify(condition);
		if( msg !== undefined ) {
			s = msg + "\n\n" + s;
		}
		alert(msg);
	}
}

function calculateNumStudents() {
	var numStudents = 0;
	for( var student_nickname in g_students ) {
		if( g_students[student_nickname].logged_in ) {
			numStudents++;
		}
	}
	return numStudents;
}

function countUnique(list) {
	var uniqueValues = [];
	for (var i in list) {
		if ($.inArray(list[i], uniqueValues) == -1) {
			uniqueValues.push(list[i]);
		}
	}		
	return uniqueValues.length;
}
