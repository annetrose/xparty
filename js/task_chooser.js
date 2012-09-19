/*
# XParty - A Framework for Building Tools for Learning in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn -- www.alexquinn.org
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

function _taskChanged(eventObject) {
	var taskIdx = selectedTaskIdx();
	if (typeof onTaskChanged != "undefined") {
		onTaskChanged(taskIdx);
	}
}

$(function() {
	$("#task_chooser").change(_taskChanged);
});

function selectedTaskIdx() {
	return $("#task_chooser").get(0).selectedIndex;
}

function numberOfTasks() {
	return $("#task_chooser").get(0).childNodes.length;
}
