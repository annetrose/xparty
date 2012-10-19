/*
# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Author: Ben Bederson - www.cs.umd.edu/~bederson
#         University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: September 2012
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

DEFAULT_TASK_URL = '/html/default_task.html';

function initializeStudent() {
	openChannel();
	initUI();
};

function initUI() {	
	var lesson = g_lessons[0];
	var lesson_code = lesson.lesson_code;
	$('#lesson_title').html(lesson.title);
	$('#lesson_code').html(lesson_code);
	
	var taskChooserHtml = '';
	for (var i=0; i<lesson.tasks.length; i++) {
		var taskNum = i+1;
		var task = lesson.tasks[i];
		var taskTitle = task[0];
		taskChooserHtml += '<option class="task_title" id="task_title_"'+i+'" value="'+taskNum+'">'+taskNum+'.&nbsp;'+taskTitle+'</option>';
	}
	$('#task_chooser').html(taskChooserHtml);
    $('#task_chooser').selectbox();
    
    var task = parseInt(getSpecificURLParameter(''+document.location, 'task'));
    var taskIdx = 0;
    if (!isNaN(task)) {
    	taskIdx--;
    }
    
    initTaskUI(taskIdx);
}

function initTaskUI(taskIdx) {	  
	var task = g_lessons[0].tasks[taskIdx];
	
	// task description
	var description = (task[1] == '') ? '(none)' : task[1];
	$('#task_description').html(description);

	// task url
	var url = (typeof task[2] == "undefined" || task[2] == "") ? DEFAULT_TASK_URL : task[2];
	$('#task_area').load(url, function(response, status, xhr) {
		if (status == "error") {
			$('#task_area').load(DEFAULT_TASK_URL);
		}
	});
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

function onSocketOpen() {
}

function onSocketMessage(msg) {
	// Note:  Messages are limited to 32K.  
	// http://code.google.com/appengine/docs/python/channel/overview.html
	
	var updates = JSON.parse(msg.data);
	var num_updates = updates.length;
	for (var i=0; i<num_updates; i++) {
		var update = updates[i];
		switch (update.type) {
			// TODO: handle activity messages
			case "xx":
				var taskHistory = g_student_info.task_history[update.task_idx];
				taskHistory.push(update.data);
				if (update.task_idx == selectedTaskIdx()) {
					alert('TODO: update gui')
					// update gui
				}
				break;
				
			default:
				break;
		}
	}
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
// UI Event Handlers
//=================================================================================

function onTaskChanged(taskIdx) {
	// onTaskChanged is called from js/task_chooser.js
	initTaskUI(taskIdx);
}

function onStudentMessage(msg) {
	$.ajax({
		type: 'POST',
		url: '/student_message', 
		dataType: 'json',
		data: {
			task_idx : selectedTaskIdx(),
			msg : msg,
		},
		cache: false,
		success: function(data) {
			if (data.status!=1) {
            	showMessageDialog(data.msg, "/student_login");
            }
		}
	});
}
