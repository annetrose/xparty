/*
# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn -- www.alexquinn.org
#          Anne Rose -- www.cs.umd.edu/hcil/members/arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created Nov 2012
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

function initCustomUI() { 
    $("#answer").keyup(function(event) {
        if (event.which == 13) {  // Enter key
            sendAnswer();
        }
        $('#status').html("");
    });
    
    $('#submit_answer').click(function() {
    	sendAnswer();
    });
}

function initCustomTaskUI() {
    var task_idx = selectedTaskIdx();
    var task = gActivity.tasks[task_idx];
    var question = task[0];
    var answer = getAnswer();
    $('#question').html(question);
    $('#answer').val(answer["answer"]);
    $("#status").toggleClass("warning", false);
    $('#status').html(answer["status"]);
    $('#msg').html("");
}

function sendAnswer() {
    var prev_answer = getAnswer()["answer"];
    var answer = $("#answer").val();
    if (answer == "") {
        $("#status").toggleClass("warning", true);
        $("#status").html("Please enter an answer before submitting");
    }
    else {
        if (answer != prev_answer) {
            onStudentAction("answer", answer, { "answer":answer });
        }
        task_num = selectedTaskIdx() + 1;
        if (task_num < gActivity.tasks.length) {
            changeSelectedTask(task_num+1);  
        }
        else {
            $('#msg').html("Congratulations! You have finished this activity.");
        }
    }
}

function getAnswer() {
    // current implementation assumes all recorded actions are answers
    var task_idx = selectedTaskIdx();
    var task_history = gTaskHistories[task_idx];
    var answer = task_history.length > 0 ? task_history[task_history.length-1].action_data.answer : "";
    var status = task_history.length > 0 ? "Submitted " + getFormattedTimestamp(getLocalTime(new Date(task_history[task_history.length-1].timestamp))) : "";
    return { "answer" : answer, "status" : status };
}
