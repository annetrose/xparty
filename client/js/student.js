/*
# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn -- www.alexquinn.org
#          Anne Rose -- www.cs.umd.edu/hcil/members/arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created September 2012
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

function initStudent() {
	openChannel();
	updateData();
	initUI();
};

function initUI() {	
	$('#activity_title').html(g_activity.title);
	$('#activity_code').html(g_activity.activity_code);
	
	var taskChooserHtml = '';
	for (var i=0; i<g_activity.tasks.length; i++) {
		var taskNum = i+1;
		var task = g_activity.tasks[i];
		var taskTitle = task[0];
		taskChooserHtml += '<option id="task_title_'+i+'" value="'+taskNum+'">'+taskNum+'.&nbsp;'+taskTitle+'</option>';
	}
	$('#task_chooser').html(taskChooserHtml);
    $('#task_chooser').selectbox();
    
    var task = parseInt(getSpecificURLParameter(''+document.location, 'task'));
    var taskIdx = 0;
    if (!isNaN(task)) {
    	taskIdx--;
    }
    
    if (typeof initCustomUI == "function") {
    	initCustomUI();
    }
    
    onTaskChanged(taskIdx);
}

// initialize any data structures
function updateData() {	
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
//			case "xx":
//				break;	
			default:
				break;
		}
	}
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
// UI Event Handlers
//=================================================================================

function onTaskChanged(taskIdx) {
	// onTaskChanged is called from js/task_chooser.js
	var task = g_activity.tasks[taskIdx];
	var description = (task[1] == '') ? '(none)' : task[1];
	$('#task_description').html(description);
	
    if (typeof initCustomTaskUI == "function") {
    	initCustomTaskUI();
    }
}

function onStudentAction(actionType, actionDescription, actionData) {
	$.ajax({
		type: 'POST',
		url: '/student_action', 
		dataType: 'json',
		data: {
			task_idx : selectedTaskIdx(),
			action_type : actionType,
			action_description : actionDescription,
			action_data : $.toJSON(actionData)
		},
		cache: false,
		success: function(data) {
			if (data.status == 1) {
				g_task_histories[data.action.task_idx].push(data.action);
				if (typeof(onStudentActionComplete) == "function") {
					onStudentActionComplete(data);
				}
			}
			else {
            	showMessageDialog(data.msg, "/student_login");
            }
		}
	});
}
