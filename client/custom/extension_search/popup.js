/*
# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Anne Rose -- www.cs.umd.edu/hcil/members/arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Created January 2013
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

$(document).ready(function() {
    $("#content").html('<img src="imgs/loading.gif"> Loading ...');
    loadStudent(function() {
        initUI();
    },
    function() {
        $('#content').html('Error connecting to '+XPARTY_URL);
    });
});

function initUI() {
    if (isStudentLoggedIn()) {
        initActivitySummary();
    }
    else {
        initLoginForm();
    }
}

function initLoginForm() {
    var html = '<form>';
    html += '<div id="msg" class="warning smallspacebelow"></div>';
    html += '<div class="smallspacebelow">';
    html += 'Student name:<br/>';
    html += '<input type="text" id="student_nickname_input" value=""><br/>';
    html += '<span class="note">Leave empty to login anonymously</span>';
    html += '</div>';
    html += '<div class="smallspacebelow">';
    html += 'Activity code:<br/>';
    html += '<input type="text" id="activity_code_input" value="">';
    html += '</div>';
    html += '<input type="button" id="login_button" value="Login">';
    html += '</form>';

    $("#user_info").html("");
    $("#content").html(html);
    $("#login_button").click(onLoginClicked);
}

function initActivitySummary() {
    var userHtml = '<div style="float:right">Welcome '+getStudentNickname()+' | <a href="#" id="logout_link">Logout</a></div>';
    
    var html = '<p>';
    if (gActivity.class_name) {
        html += '<strong>' + gActivity.class_name + '</strong>';
    }
    if (gActivity.description) {
        if (gActivity.class_name) html += '</br>';
        html += '<em>' + gActivity.description + '</em>';
    }
    html += '</p>';
    html += '<p>';
    html += 'Tasks';
    html += '<ol>';
    $.each(gActivity.tasks, function(i, task) {
        var taskTitle = task[0];
        var taskDescription = task[1];
        var taskLayout = task[2];
        html += '<li>'+taskTitle+'</li>';
    });
    html += '</ol>';
    html += '</p>';
    html += '<p>Activity #'+gActivity.activity_code+'</p>';


    $("#user_info").html(userHtml);
    $('#content').html(html);
    $('#logout_link').click(onLogoutClicked);
}

function onLoginClicked() {
    $.post(XPARTY_URL + "/student_login_handler?ext=1", 
        {
            "student_nickname": $("#student_nickname_input").val(),
            "activity_code":    $("#activity_code_input").val()
        }, 
        function(data) {
            if (data.status == 1) {
                chrome.extension.sendMessage({ "type": LOGIN, "student": data.student, "activity": data.activity });
                window.close();
            }
            else {
                $("#msg").html(data.msg);
            }
        }, 
        'json'
    );
}

function onLogoutClicked() {
    chrome.extension.sendMessage({ "type": LOGOUT });
	window.close();
}