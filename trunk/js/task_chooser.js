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
