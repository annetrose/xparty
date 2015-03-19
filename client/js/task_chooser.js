/*
# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn -- www.alexquinn.org
#          Anne Rose -- www.cs.umd.edu/hcil/members/arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

$(function() {
	$("#task_chooser").change(function(event) {
	   $.event.trigger({ type: "xp_task_changed", taskIdx: selectedTaskIdx() });
	});
});

function selectedTaskIdx() {
	return $("#task_chooser").get(0).selectedIndex;
}

function number_of_tasks() {
	return $("#task_chooser").get(0).childNodes.length;
}

function changeSelectedTask(value) {
	var option = $("#task_chooser").find("option[value="+value+"]");
	$("#task_chooser").selectbox("change", option.attr('value'), option.text());
}
