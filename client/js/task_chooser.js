/*
# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn -- www.alexquinn.org
#          Anne Rose -- www.cs.umd.edu/hcil/members/arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

function _task_changed(eventObject) {
	var task_idx = selected_task_idx();
	if (typeof on_task_changed != "undefined") {
		on_task_changed(task_idx);
	}
}

$(function() {
	$("#task_chooser").change(_task_changed);
});

function selected_task_idx() {
	return $("#task_chooser").get(0).selectedIndex;
}

function number_of_tasks() {
	return $("#task_chooser").get(0).childNodes.length;
}

function change_selected_task(value) {
	var option = $("#task_chooser").find("option[value="+value+"]");
	$("#task_chooser").selectbox("change", option.attr('value'), option.text());
}
