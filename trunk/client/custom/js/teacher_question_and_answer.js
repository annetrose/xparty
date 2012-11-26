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
	
function defineCustomPanes() {
	gDataPanes.push({ 
		key: ANSWER_PANE,
		title: "Answers", 
		action_type: "answer",
		addDataFunction: "addAnswerItem",
		accordionClassName: "AnswerAccordion",
		showTagCloud: true
	});
}

//=================================================================================
// Answer Pane
//=================================================================================

function addAnswerItem(accumulator, action) {
    var item = new DataItem(action.action_data.answer, action);
    accumulator.add(item, action);
}

function AnswerAccordion(div, accumulator) {
    AccordionList.call(this, div, accumulator);
}
AnswerAccordion.prototype = Object.create(AccordionList.prototype);

AnswerAccordion.prototype.expandedItem = function(key, i) {
	var html = AccordionList.prototype.expandedItem.call(this, key, i);
	html += "<h5>NEED TO ADD OTHER STUFF</h5>";
    return html;
}