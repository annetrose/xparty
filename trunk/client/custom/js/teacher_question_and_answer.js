/*
# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn -- www.alexquinn.org
#          Anne Rose -- www.cs.umd.edu/hcil/members/arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created Nov 2012
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

var ANSWER_PANE = "answer";
var ANSWER_ACTIONS = [ "answer" ];
	
function defineCustomPanes() {
	gDataPanes.push(new AnswerPane());
}

//=================================================================================
// Answer Pane
//=================================================================================

function AnswerPane() {
    ActionPane.call(this, ANSWER_PANE, "Answers", ANSWER_ACTIONS, { "showTagCloud":true });
}
AnswerPane.prototype = Object.create(ActionPane.prototype);

AnswerPane.prototype.createItems = function() {
	return new AnswerList(ANSWER_ACTIONS);
}

AnswerPane.prototype.createExpandedItems = function() {
	return [ new StudentList(ANSWER_ACTIONS) ];
}

function AnswerList(actionTypes) {
	ActionList.call(this, "Answers", actionTypes, "answer");
}
AnswerList.prototype = Object.create(ActionList.prototype);