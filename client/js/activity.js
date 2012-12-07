/*
# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn -- www.alexquinn.org
#          Anne Rose -- www.cs.umd.edu/hcil/members/arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

var TEACHER_LESSONS = 0;
var ALL_LESSONS = 1;
var MAX_NUM_TASKS = 10;

//=================================================================================
// Activity Lists UI (active and inactive)
//=================================================================================

function createTeacherDashboard() {
    $('#content_title').html('Activities');
    var html = '<div id="activities_list_active" class="accordion2"></div>';
    html += '<br/><h3>Stopped Activities</h3>';
    html += '<div id="activities_list_inactive" class="accordion2"></div>';  
    $('#content').html(html); 
    
    html = { "active": "", "inactive": "" };
    for (var i=0; i<gActivities.length; i++) {
       var activity = gActivities[i];
    	var key = activity.is_active ? "active" : "inactive";
    	html[key] += getActivityHtml(activity);
    }   
    
    createActivityList($("#activities_list_active"), html["active"]);
    createActivityList($("#activities_list_inactive"), html["inactive"]);
}

function createActivityList(div, html) {     
    div.accordion("destroy");
    div.html(html);
    if (html != "") {
    	div.html(html);
    	div.accordion({
           collapsible: true, 
           active: false
        });
     }
     else {
         div.html("(none)");
     }
}

function getActivityHtml(activity) {
	var activityCode = activity.activity_code;
	var customStyles = '';
	var viewButton = '<button class="cssbtn smallest" style="padding:4px !important; margin-right:8px; margin-top:-2px" onclick="event.stopPropagation(); goToActivity(\''+activityCode+'\')" title="View activity"><span class="view_icon_only"></span></button>';
	var html = '<h3 id="'+activityCode+'"><div class="right" style="margin-top:5px;margin-right:5px;">'+viewButton+' #'+activityCode+'</div><a href="#" style="margin:0px;">'+activity.title+'</a></h3>'

	html += '<div>';
    if (activity.class_name) {
    	var customStyles = !activity.description ? 'style="margin-bottom:30px"': '';
        html += '<h5 ' + customStyles + '>' + activity.class_name + '</h5>';
    }
    
    if (activity.description) {
    	var customStyles = !activity.class_name ? 'style="padding-top:0px; margin-top:0; margin-bottom:30px; line-height:1"': '';
       html += '<p ' + customStyles + '>' + activity.description + '</p>';
    }
    
    html += '<h5>Tasks</h5>';
    html += '<ol>';
    $.each(activity.tasks, function(i, task) {
        var taskTitle = task[0];
        var taskDescription = task[1];
        var taskLayout = task[2];
        html += '<li>'+(i+1)+'. '+taskTitle+'</li>';
    });
    html += '</ol>';
    
    if (activity.activity_type) {
    	html += '<h5>Activity Type</h5>';
    	html += '<ol><li>' + activity.activity_type + '</li></ol>';
    }

    var utc_offset_minutes = (new Date()).getTimezoneOffset();
    html += '<ul>';
    html += '<li class="left">';
    html += '<button id="view_activity_btn_'+activityCode+'" onclick="goToActivity(\'' + activityCode + '\')" class="cssbtn smallest">View Activity<span class="view"></span></button>';
    html += '</li>';
    html += '<li class="left">';
    html += '<button id="edit_activity_btn'+activityCode+'" onclick="goToActivityForm(\'' + activityCode + '\')" class="cssbtn smallest">Edit Activity<span class="edit"></span></button>';
    html += '</li>';
    html += '<li class="left">';
    html += (activity.is_active) ?
    	'<button id="stop_activity_btn_'+activityCode+'" onclick="stopActivity(\'' + activityCode + '\')" class="cssbtn smallest">Stop Activity<span class="stop"></span></button>' :
    	'<button id="start_activity_btn_'+activityCode+'" onclick="startActivity(\'' + activityCode + '\')" class="cssbtn smallest">Start Activity<span class="start"></span></button>';
    html += '</li>';
    html += '<li class="left">';
    html += '<button id="clone_activity_btn_'+activityCode+'" onclick="cloneActivity(\'' + activityCode + '\', true)" class="cssbtn smallest">Clone Activity<span></span></button>';
    html += '</li>';
    html += '<li class="left">';
    html += '<button id="delete_activity_btn_'+activityCode+'" onclick="deleteActivity(\'' + activityCode + '\')" class="cssbtn smallest">Delete Activity<span class="del"></span></button>';
    html += '</li>';
    html += '<li class="left">';
    html += '<button id="download_activity_btn_'+activityCode+'" onclick="downloadActivity(\'' + activityCode + '\')" class="cssbtn smallest">Download Data<span class="dl"></span></button>';
    html += '</li>';
    html += '<li class="left">';
    html += '<button id="clear_activity_btn_'+activityCode+'" onclick="clearActivity(\'' + activityCode + '\');" class="cssbtn smallest">Clear Data<span class="clr"></span></button>';
    html += '</li>';
    html += '</ul>';
    html += '<div style="clear: both"></div>';
    
    html += '</div>';
    return html;
}

//=================================================================================
// Activity Form UI (create and edit)
//=================================================================================

function createActivityForm(activityCode) {
	// NOTE: Existing data not modified when activity is edited.  Should option to clear data be given?

	var pageTitle, activityType, activityName, className, activityDesc;
	var debug = true;
	
	var isNewActivity = activityCode == undefined || activityCode == '';
	if (isNewActivity) {
		pageTitle = 'Create activity';
		var now = getLocalTime();
		var timestamp = debug ? getNumericTimestamp(getLocalTime()) : '';
		activityType = '';
		activityName = (timestamp?'LN:'+timestamp:'');
		className = (timestamp?'CN:'+timestamp:'');
		activityDesc = (timestamp?'LD:'+timestamp:'');
	}
	else {
		pageTitle = 'Edit activity';
		var activity = getActivity(activityCode);
		activityType = activity.activity_type;
		activityName = activity.title;
		className = activity.class_name;
		activityDesc = activity.description;
	}
    
    var html = '<form id="activity_form" class="wufoo">';
    html += '<ul>';
    html += '<li style="width: 250px !important">';
    html += '<label class="desc">Activity type</label>';
    html += '<select id="activity_type">';
    html += '</select>';
    html += '</li>';
    html += '<li>';
    html += '<label class="desc">Activity name</label>';
    html += '<input type="text" size="50" name="activity_title" value="'+htmlEscape(activityName)+'" class="field text fn flwid"></input>';
    html += '</li>';
    html += '<li>';
    html += '<label class="desc">Class name (optional)</label>';
    html += '<input type="text" size="50" name="class_name" value="'+htmlEscape(className)+'" class="field text fn flwid"></input>';
    html += '</li>';
    html += '<li>';
    html += '<label class="desc">Activity description (optional)</label>';
    html += '<textarea rows="4" name="activity_description" class="field textarea small flwid">'+activityDesc+'</textarea>';
    html += '</li>';
    html += '</ul>';  
    html += '<header class="info"><h3>Tasks</h3></header>';
	html += '<ul id="tasks">';
	if (isNewActivity) {
		html += getTaskHtml(1, debug ? 'task 1' : '', '', '');
	}
	else {
		for (var i=1; i<=activity.tasks.length; i++) {
			html += getTaskHtml(i, activity.tasks[i-1][0], activity.tasks[i-1][1], activity.tasks[i-1][2]);
		}
	}
	html += '</ul>';
	html += '<input type="hidden" name="max_num_tasks" value="'+MAX_NUM_TASKS+'">';	
	html += '<input type="hidden" name="action" value="'+(isNewActivity?'create':'edit')+'">';
	html += '<input type="hidden" id="activity_code" name="activity_code" value="'+(isNewActivity?'':activityCode)+'">';
	html += '<input type="button" id="create_edit_button" value="'+(isNewActivity?'Create':'Edit')+' Activity" class="cssbtn"></input>&nbsp;&nbsp;'; 
	html += '<input type="button" id="cancel_button" value="Cancel" class="cssbtn"></input>';     
    html += '</form>';

    $('#content_title').html(pageTitle);
    $('#content').html(html);
    updateTasks();
    updateActivityTypes(activityType);
    
    $('#create_edit_button').click(function() {
    	var activityCode = $('#activity_code').val();
    	createEditActivity(activityCode);
    });
    
    $('#cancel_button').click(function() {
    	returnToParentPage();
    });
}

function getTaskHtml(i, title, description, layout) {
    // TODO: Make styling of + and - buttons nicer
	var html = '<li id="task">';
	html += '<label class="task_title_label desc">Task #'+i+' name</label>';
	html += '<input type="text" size="50" value="'+htmlEscape(title)+'" class="task_title field text fn flwid"></input>';
	html += '<label class="task_description_label desc" style="margin-top:5px">Task #'+i+' description</label>';
	html += '<textarea class="task_description field textarea smaller flwid">'+description+'</textarea>';
	html += '<span class="inline"><a class="task_minus">[-]</a> <a class="task_plus">[+]</a></span>';
	html += '<br/>';
	html += '</li>';
	return html;
}

function updateActivityTypes(currentActivityType) {
	var activityTypeHtml = '';
	for (var i=0; i<gActivityTypes.length; i++) {
		var activityType = gActivityTypes[i];
		activityType
		activityTypeHtml += '<option id="activity_type_'+i+'" value="'+activityType.type+'"'+(currentActivityType==activityType.type?" selected":"")+'>'+activityType.description+'</option>';
	}
	$('#activity_type').html(activityTypeHtml);
	$('#activity_type').selectbox();
}

function updateTasks() {
	var i=1;
	var taskCount = $('#tasks').children().length;
	$('#tasks').children().each(function() {
		var task = $(this);
		task.attr("id", "task_"+i);
		updateTaskAttrs('task_title_label', task, i);
		updateTaskAttrs('task_title', task, i);
		updateTaskAttrs('task_description_label', task, i);
		updateTaskAttrs('task_description', task, i);
		updateTaskAttrs('task_plus', task, i);
		updateTaskAttrs('task_minus', task, i);
		$('.task_title_label', task).html('Task #'+i+' name');
		$('.task_description_label', task).html('Task #'+i+' description');
		$('.task_plus', task).toggle(i==taskCount && i<MAX_NUM_TASKS);
		$('.task_minus', task).toggle(i>1);
		i++;
	});
	
	$('.task_plus').unbind('click');
	$('.task_plus').click(function(event) {
		addTask(event.target.id);
	});

	$('.task_minus').unbind('click');
	$('.task_minus').click(function(event) {
		removeTask(event.target.id);
	});
}

function updateTaskAttrs(taskName, parent, i) {
	var taskObj = $('.'+taskName, parent);
	taskObj.attr("id", taskName+'_'+i);
	taskObj.attr("name", taskName+'_'+i);	
}

function addTask(plus) {
	var index = getTaskIndex(plus);
	var clone = $('#task_1').clone();
	$('.task_title', clone).val("");
	$('.task_description', clone).val("");
	clone.insertAfter("#task_"+index);
	updateTasks();
}

function removeTask(minus) {
	var index = getTaskIndex(minus);
	$('#task_'+index).remove();
	updateTasks();
}

function getTaskIndex(id) {
	return id.substring(id.lastIndexOf("_")+1, id.length);
}

//=================================================================================
// Activity Teacher Actions
//=================================================================================

function createEditActivity(activityCode) {
	var data = $('#activity_form').serialize();
	// selectbox not included when form serialized so added manually
	data += "&activity_type="+$("#activity_type").val();
	$.ajax( "/teacher_activity", {
		type: 'POST',
		async: false,
		data: data,
		dataType: 'json',
		success: function(data) {
			if (data.status == 1) {
				$('#error').hide();
				updateActivity(activityCode, data.activity);
				returnToParentPage();
			}
			else {
				$('#error').html(data.msg);
				$('#error').show();
			}
		}
	});
}

function startActivity(activityCode) {
	$.ajax("/teacher_activity", {
			type: 'POST',
			async: false,
			data: {
				action: "start",
				activity_code: activityCode,
			},
			dataType: 'json',
			success: function(data) {
				if (data.status==1) {
					var activity = getActivity(activityCode);
					activity.is_active = true;
					activity.stop_time = null;
					if (typeof updateUI == 'function') {
					   updateUI();
					}
				}
				else {
					alert(data);
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert(textStatus);
			}
	});
}

function stopActivity(activityCode) {
	$.ajax("/teacher_activity", {
			type: 'POST',
			async: false,
			data: {
				action: "stop",
				activity_code: activityCode,
				logout: true
			},
			dataType: 'json',
			success: function(data) {
				if (data.status==1) {
					var activity = getActivity(activityCode);
					activity.is_active = false;
					activity.stop_time = (new Date());
					if (typeof updateUI == 'function') {
					   updateUI();
					}
					
					logoutAllStudents("Do you wish to logout all students from this activity?", activityCode);
				}
				else {
					alert(data);
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert(textStatus);
			}
	});
}

function stopAllActivities() {
	$.ajax("/teacher_activity", {
			type: 'POST',
			async: false,
			data: {
				action: "stop_all",
				logout: true
			},
			dataType: 'json',
			success: function(data) {
				if (data.status==1) {
					var stop_time = new Date();
					for (var i=0; i<gActivities.length; i++ ) {
						gActivities[i].is_active = false;
						gActivities[i].stop_time = stop_time;
					}
					window.location.hash = '';
					if (typeof updateUI == 'function') {
					   updateUI();
					}
					
					logoutAllStudents("Do you wish to logout all students from all your activities?", undefined, TEACHER_LESSONS);	
				}
				else {
					alert(data);
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert(textStatus);
			}
	});
}

function cloneActivity(activityCode, updateActivities) {
	$.ajax( "/teacher_activity", {
		type: 'POST',
		async: false,
		data: {
			action: "clone",
			activity_code: activityCode,
		},
		dataType: 'json',
		success: function(data) {
			if (data.status == 1) {
				var clonedActivity = data.clone;
				if (updateActivities) {
					gActivities.push(clonedActivity);
					if (typeof updateUI == 'function') {
						updateUI();
					}
				}
				var activity = getActivity(activityCode);
				var msg = activity.title + ' has been cloned.<br/>';
				msg += '<a href="/teacher/'+clonedActivity.activity_code+'#students">View clone activity</a>';
				showMessageDialog(msg);
			}
		},
		error: function() {
			alert('Error: Clone was not successful.');
		} 
	});
}

function deleteActivity(activityCode) {
	$.ajax("/teacher_activity", {
		type: 'POST',
		async: false,
		data: {
			action: "delete",
			activity_code: activityCode,
		},
		dataType: 'json',
		success: function(data) {
			if (data.status==1) {
				for( var i=0,l=gActivities.length; i<l; i++ ) {
					if( gActivities[i].activity_code==activityCode ) {
						gActivities.splice(i,1);
						break;
					}
				}
				if (typeof updateUI == 'function') {
					updateUI();
				}
			}
			else {
				alert(data);
			}
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert(textStatus);
		}
	});
}

function deleteAllActivities() {
	$('#msg_dialog').html("<p>Are you sure you want to delete all your activities?</p>");
	$('#msg_dialog').dialog({
        autoOpen: true,
        modal: true,
        buttons: {
          Yes: function() {
            $(this).dialog("close");
            $.ajax("/teacher_activity", {
            	type: 'POST',
    			async: false,
    			data: {
    				action: "delete_all"
    			},
    			dataType: 'json',
    			success: function(data) {
    				if (data.status==1) {
    					gActivities = [];
    					window.location.hash = '';
    					if (typeof updateUI == 'function') {
    					   updateUI();
    					}
    				}
    				else {
    					alert(data);
    				}
    			},
    			error: function(jqXHR, textStatus, errorThrown) {
    				alert(textStatus);
    			}
    	    });
          },
		  No: function() {
            $(this).dialog("close");
          }
        }
    });
}

function downloadActivity(activityCode) {
	window.location = "/teacher_activity?action=download&activity_code="+activityCode+"&utc_offset_minutes="+(new Date()).getTimezoneOffset()
}

function downloadAllActivities() {
	alert('Not implemented yet');
}

function clearActivity(activityCode) {
	$.ajax("/teacher_activity", {
			type: 'POST',
			async: false,
			data: {
				action: "clear",
				activity_code: activityCode
			},
			dataType: 'json',
			success: function(data) {
				if (data.status==1) {
					var activity = getActivity(activityCode);
					g_students = {};
					gTaskHistories = [];
					for (var task_idx=0; task_idx<activity.tasks.length; task_idx++) {
						gTaskHistories.push([]);
					}
					if (typeof(initData) == "function") {
						initData();
					}
					if (typeof(initUI) == "function") {
					    initUI();
					}
					showMessageDialog('All student data has been cleared from activity '+ activityCode);
				}
				else {
					alert(data);
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert(textStatus);
			}
	});
}

function logoutStudent(studentNickname, activityCode) {
	$.ajax("/teacher_activity", {
		type: 'POST',
		async: false,
		data: {
			action: "log_out_student",
			student_nickname: studentNickname,
			activity_code: activityCode
		},
		dataType: 'json'
	});
}

function logoutAllStudents(warning, activityCode, whichActivities) {	
	if (warning == undefined) {
		warning = "Are you sure you want to logout all students?"
	}
	$('#msg_dialog').html("<p>"+warning+"</p>");
	
	var data = { action: "log_out_all_students" };
	if (activityCode != undefined) {
		data.activity_code = activityCode;
	}
	if (whichActivities != undefined) {
		data.which_activities = whichActivities;
	}
	
	$('#msg_dialog').dialog({
        autoOpen: true,
        modal: true,
        buttons: {
          Yes: function() {
            $(this).dialog("close");
            $.ajax("/teacher_activity", {
            	type: 'POST',
    			async: false,
    			data: data,
    			dataType: 'json',
    			success: function(data) {
    				if (data.status == 1) {
    					if (typeof updateUI == 'function') {
    					   updateUI();
    					}
    				}
    			},
    			error: function() {
    				alert('Error logging out all students');
    			}
    	    });
          },
		  No: function() {
            $(this).dialog("close");
          }
        }
    });
}

//=================================================================================
// Navigation
//=================================================================================

function goToTeacherDashboard() {
	var currentLocation = ''+window.location;
	if (currentLocation.indexOf('/teacher_dashboard') == -1) {
		window.location = '/teacher_dashboard';
	}
	else {
		window.location.hash = '';
		createTeacherDashboard();
	}
}

function goToActivity(activityCode) {
	window.location = "/teacher/" + activityCode;
}

function goToActivityForm(activityCode) {
	var currentLocation = ''+window.location;
	if (currentLocation.indexOf('/teacher/') != -1) {
		window.location = '/teacher_dashboard#' + activityCode + ':1';
	}
	else {
		window.location.hash = activityCode;
		createActivityForm(activityCode);
	}
}

function returnToParentPage() {		
	var hash = window.location.hash;
	if (hash != '') hash = hash.substring(1);
	var hashTokens = hash.split(':');
	if (hashTokens.length>1 && hashTokens[1]=='1') {
		var activityCode = hashTokens[0];
		goToActivity(activityCode);
	}
	else {
		goToTeacherDashboard();
	}
}

//=================================================================================
// Utils
//=================================================================================

function getActivity(activityCode) {
	var activity = null;
	for (var i=0; i<gActivities.length; i++ ) {
		if (gActivities[i].activity_code==activityCode ) {
			activity = gActivities[i];
			break;
		}
	}
	return activity;
}

function updateActivity(activityCode, activityData) {
	var index = -1;
	var isNewActivity = activityCode == "";
	if (isNewActivity) {
		gActivities.push(activityData)
		index = gActivities.length-1;
	}
	else {
		for (var i=0; i<gActivities.length; i++ ) {
			if (gActivities[i].activity_code==activityCode ) {
				gActivities[i] = activityData;
				index = i;
				break;
			}
		}
	}
	return index != -1 ? gActivities[index] : null;
}

function getLoggedInStudentCount() {
	var numStudents = 0;
	if (g_students) {
		for (var student_nickname in g_students) {
			if (g_students[student_nickname].is_logged_in) {
				numStudents++;
			}
		}
	}
	return numStudents;
}
