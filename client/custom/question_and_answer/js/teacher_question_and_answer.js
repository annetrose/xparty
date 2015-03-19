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
	
function addCustomPanes() {
	addDataPane(new AnswerPane());
}

//=================================================================================
// Answer Pane
//=================================================================================

function AnswerPane() {
    ActionPane.call(this, ANSWER_PANE, "Answers", ANSWER_ACTIONS, { "showTagCloud":true });
}
AnswerPane.prototype = Object.create(ActionPane.prototype);

AnswerPane.prototype.createAccordion = function(div) {
    return new AnswerAccordion(div, this.list);
}

AnswerPane.prototype.createList = function() {
	return new AnswerList(ANSWER_ACTIONS);
}

function AnswerAccordion(div, items) {
    ActionAccordion.call(this, div, items);
}
AnswerAccordion.prototype = Object.create(ActionAccordion.prototype);

function AnswerList(actionTypes) {
	ActionList.call(this, "Answers", "answer", actionTypes);
}
AnswerList.prototype = Object.create(ActionList.prototype);

AnswerList.prototype.createItemLists = function() {
    return [ new StudentList(ANSWER_ACTIONS) ];
}