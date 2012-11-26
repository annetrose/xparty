/*
# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn -- www.alexquinn.org
#          Anne Rose -- www.cs.umd.edu/hcil/members/arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created Nov 2012
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

// data panes
var QUERY_PANE = "query";
var WORD_PANE = "word";
var LINK_PANE = "link";
var RESPONSE_PANE = "response";

function defineCustomPanes() {
	//pane.action_type
	//pane.title
	//pane.addDataFunction
	//pane.accumulatorClassName
	//pane.accordionClassName
	//pane.tagCloudClassName
	//pange.showTagCloud
	
	gDataPanes.push({ key: QUERY_PANE, 
		title: "Queries", 
		action_type: "search",
		addDataFunction: "addQueryItem",
		accordionClassName: "QueryAccordion",
		showTagCloud: true
	});
	
	gDataPanes.push({ key: WORD_PANE, 
		title: "Words", 
		action_type: "search",
		addDataFunction: "addWordItems",
		accordionClassName: "WordAccordion",
		showTagCloud: true
	});
		
	gDataPanes.push({ key: LINK_PANE, 
		title: "Links", 
		action_type: "link",
		addDataFunction: "addLinkItem",
		accumulatorClassName: "LinkAccumulator",
		accordionClassName: "LinkAccordion",
		showTagCloud: true
	});
	
	gDataPanes.push({ key: RESPONSE_PANE, 
		title: "Responses", 
		action_type: "response",
		addDataFunction: "addResponseItem",
		showTagCloud: true
	});
}

//=================================================================================
// Query Pane
//=================================================================================

function addQueryItem(accumulator, action) {
	var item = new DataItem(action.action_data.query, action);
	accumulator.add(item, action);
}

function QueryAccordion(div, accumulator) {
    AccordionList.call(this, div, accumulator);
}
QueryAccordion.prototype = Object.create(AccordionList.prototype);

QueryAccordion.prototype.expandedItem = function(key, i) {
	var html = AccordionList.prototype.expandedItem.call(this, key, i);
	html += "<h5>NEED TO ADD OTHER STUFF</h5>";
    return html;
}

//=================================================================================
// Word Pane
//=================================================================================

function addWordItems(accumulator, action) {
	var query = action.action_data.query;
	var words = query.split(" ");
	for (var i=0; i<words.length; i++) {
		var wordItem = new DataItem(words[i], action);
		accumulator.add(wordItem);
	}
}

function WordAccordion(div, accumulator) {
    AccordionList.call(this, div, accumulator);
}
WordAccordion.prototype = Object.create(AccordionList.prototype);

WordAccordion.prototype.expandedItem = function(key, i) {
	var html = AccordionList.prototype.expandedItem.call(this, key, i);
	html += "<h5>NEED TO ADD OTHER STUFF</h5>";
 return html;
}

//=================================================================================
// Link Pane
//=================================================================================

function addLinkItem(accumulator, action) {
	var item = new DataItem(action.action_data.url, action);
	accumulator.add(item);
}

LinkAccumulator.prototype = new DataAccumulator();
LinkAccumulator.prototype.constructor = LinkAccumulator;
function LinkAccumulator() {
	DataAccumulator.call(this);
}

LinkAccumulator.prototype.getSortValue = function(key) {
	var data = this.dict[key][0].getData();
	return data.action_data.title;
}

function LinkAccordion(div, accumulator) {
	AccordionList.call(this, div, accumulator);
}
LinkAccordion.prototype = Object.create(AccordionList.prototype);

LinkAccordion.prototype.itemHeader = function(key, i) {
	var data = this.accumulator.dict[key][0].getData();
    return '<span style="font-size:1em;">' + data.action_data.title + ' (' + this.accumulator.getCountForKey(key) + ')</span>';
}

LinkAccordion.prototype.expandedItem = function(key, i) {
	var html = AccordionList.prototype.expandedItem.call(this, key, i);
	html += "<h5>NEED TO ADD OTHER STUFF</h5>";
    return html;
}
//=================================================================================
// Response Pane
//=================================================================================

function addResponseItem(accumulator, action) {
	var item = new DataItem(action.action_data.response, action);
	accumulator.add(item);
}
