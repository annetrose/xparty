var gStudentInfo = null;

$(document).ready(function() {
	loadStudent(true);
});

function initUI(data) {
    var content = '<div style="font-size:14pt; font-weight:bold; float:left">XParty Search</div>';

    if (data.status == 1) {
        var student = data.student;
        var nickname = student.anonymous===true ? "Anonymous" : student.nickname;
        content += '<div style="float:right">Welcome '+nickname+' | <a href="#" id="logout_link">Logout</a></div>';
        content += '<div style="clear:both"></div>';
        content += '<p>';
        if (data.activity.class_name) {
            content += '<strong>' + data.activity.class_name + '</strong>';
        }
        
        if (data.activity.description) {
            if (data.activity.class_name) content += '</br>';
            content += '<em>' + data.activity.description + '</em>';
        }
        content += '</p>';
    
        content += '<p>';
        content += 'Tasks';
        content += '<ol>';
        $.each(data.activity.tasks, function(i, task) {
            var taskTitle = task[0];
            var taskDescription = task[1];
            var taskLayout = task[2];
            content += '<li>'+taskTitle+'</li>';
        });
        content += '</ol>';
        content += '</p>';
        content += '<p>Activity #'+data.activity.activity_code+'</p>';
    }
    else {
        content += '<div style="clear:both"></div>';
        content += '<p>Please login to <a href="#" id="login_link">XParty Search</a> as a student to record searches.</p>';
    }
    $('#content').html(content);

    if (data.status==1) {
        $('#logout_link').click(onLogout);
    }
    else {
        $('#login_link').click(onLogin); 
    }
}

function loadStudent(init) {
	$('#content').hide();
	$('#loading').show();
    $.ajax({
        type: 'POST',
        url: XPARTY_URL+"/student_info",
        data: {
            include_history: 0
        },
        dataType: "json",
        cache: false,
        success: function(data) {
            if (data.status==1) {
                debug('history = '+data.task_history.length);
            }
            gStudentInfo = (data.status == 1) ? data : null;
			updateBadge(data.status);
			if (init) {
				initUI(data);
			}
			$('#loading').hide();
			$('#content').show();
        },
		error: function() {
			gStudentInfo = null;
			$('#content').html('Error connecting to '+XPARTY_URL);
			$('#loading').hide();
			$('#content').show();
		}
    });
}

function onLogin() {
    var loginUrl = XPARTY_URL+'/student_login?ext=1';
    chrome.tabs.create({'url':loginUrl}, null);
}

function onLogout() {
	chrome.extension.sendRequest({ 'type':LOGOUT_MESSAGE });
	window.close();
}
