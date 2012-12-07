/*
# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn -- www.alexquinn.org
#          Anne Rose -- www.cs.umd.edu/hcil/members/arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created Nov 2012
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

// TODO: make counts consistent; for example, in links pane, # of queries is all queries performed - not # of students who performed query
// TODO: students in expanded section do not have counts
// TODO: helpful/unhelpful filters in query, word, link panes
// TODO: calculate query ratings based on link ratings

// data panes
var QUERY_PANE = "query";
var WORD_PANE = "word";
var LINK_PANE = "link";
var RESPONSE_PANE = "response";

var QUERY_ACTIONS = [SEARCH];
var LINK_ACTIONS = [ LINK_FOLLOWED, RATED_HELPFUL, RATED_UNHELPFUL ];
var RESPONSE_ACTIONS = [ RESPONSE ];

function defineCustomPanes() {
	// student and task history panes included by default
	gDataPanes.push(new QueryPane());
	gDataPanes.push(new WordPane());		
	gDataPanes.push(new LinkPane());
	gDataPanes.push(new ResponsePane());
}

function defineCustomActionDescriptions(action) {
	// used by task history pane; action.action_description shown by default
	// function not required if action.action_description used for all action types
	var html = "";
	switch(action.action_type) {
	case LINK_FOLLOWED:
	case RATED_HELPFUL:
	case RATED_UNHELPFUL:
		html = action.action_data.title+'<br/>';
		html += getLinkHtml(action.action_data.url, action.action_data.url);
		break;
	default:
		html = action.action_description;
		break;
	}
	return html;
}

//=================================================================================
// Query Pane
//=================================================================================

function QueryPane() {
    ActionPane.call(this, QUERY_PANE, "Queries", QUERY_ACTIONS, { "showTagCloud":true });
}
QueryPane.prototype = Object.create(ActionPane.prototype);

QueryPane.prototype.createItems = function() {
	return new QueryList(this.actionTypes);
}

QueryPane.prototype.createExpandedItems = function() {
	var lists = [];
	lists.push(new StudentList(QUERY_ACTIONS));
	lists.push(new LinkList());
	return lists;
}

function QueryList(actionTypes) {
	ActionList.call(this, "Queries", actionTypes, "query");
}
QueryList.prototype = Object.create(ActionList.prototype);

QueryList.prototype.itemAsHtml = function(key, i) {
	return '<a href="#" class="query_item">'+key + '</a> (' + this.getCount(key) + ')';	
}

QueryList.prototype.registerItemCallbacks = function() {
	$(".query_item").click(function() {
		var query = $(this).html();
		showPane(QUERY_PANE, query);
	});
}

//=================================================================================
// Word Pane
//=================================================================================

function WordPane() {
    ActionPane.call(this, WORD_PANE, "Words", QUERY_ACTIONS, { "showTagCloud":true });
}
WordPane.prototype = Object.create(ActionPane.prototype);

WordPane.prototype.createItems = function() {
	return new WordList(this.title, this.actionTypes, "query");
}

WordPane.prototype.createExpandedItems = function() {
	var lists = [];
	lists.push(new StudentList(QUERY_ACTIONS));
	lists.push(new LinkList());
	return lists;
}

function WordList(title, actionTypes, keyProperty) {
	ActionList.call(this, title, actionTypes, keyProperty);
}
WordList.prototype = Object.create(ActionList.prototype);

WordList.prototype.createItems = function(action) {   
    var items = [];
    var keys = this.getActionKeys(action);
	for (var i=0; i<keys.length; i++) {
		items.push(new DataItem(keys[i], action));
	}
	return items;
}

WordList.prototype.add = function(data) {
	var keys = [];
	var items = this.createItems(data);
	for (var i=0; i<items.length; i++) {
		var item = items[i];
		var key = item.getKey();
		if (isUndefined(this.items[key])) {
			this.items[key] = [];
		}
		this.items[key].push(item);
		keys.push(key);
	}
	this.needToUpdateKeys = true;
	return keys;
}

WordList.prototype.update = function(data, index) {
	var items = this.createItems(data);
	for (var i=0; i<items.length; i++) {
		var item = items[i];
		if (isUndefined(index)) index = 0;
		var key = item.getKey();
		this.items[key][index] = item;
	}
}

WordList.prototype.getActionKeys = function(action) {
	var query = action.action_data.query;
	return query.split(" ");
}

//=================================================================================
// Link Pane
//=================================================================================

function LinkPane() {
    ActionPane.call(this, LINK_PANE, "Links", LINK_ACTIONS, { "showTagCloud":true });
}
LinkPane.prototype = Object.create(ActionPane.prototype);

LinkPane.prototype.createItems = function() {
	return new LinkList();
}

LinkPane.prototype.createExpandedItems = function() {
	var lists = [];
	lists.push(new StudentList([ LINK_FOLLOWED ]));
	lists.push(new QueryList([ LINK_FOLLOWED ]));
	return lists;
}

LinkPane.prototype.createAccordion = function(div) {
	return new LinkAccordion(div, this.items, this.expandedItems);
}

function LinkAccordion(div, items, expandedItems) {
	ActionAccordion.call(this, div, items, expandedItems);
}
LinkAccordion.prototype = Object.create(ActionAccordion.prototype);

LinkAccordion.prototype.itemDetailsAsHtml = function(key, i) {
	var html = '<p class="small" style="margin-top:0px; margin-bottom:15px">' + getLinkHtml(key, "View Link") + "</p>";
	html += ActionAccordion.prototype.itemDetailsAsHtml.call(this, key, i);
	return html;
}

function LinkList() {
	ActionList.call(this, "Links Followed", LINK_ACTIONS, "url");
	this.ratings = {};
}
LinkList.prototype = Object.create(ActionList.prototype);

LinkList.prototype.add = function(action) {
	var item = this.createItem(action);
	var key = item.getKey();
	var studentNickname = action.student_nickname;

	if (action.action_type == RATED_HELPFUL || action.action_type == RATED_UNHELPFUL) {
		var rating = action.action_data["rating"];
		this.ratings[key][studentNickname] = rating;
	}
	else {
		if (isUndefined(this.items[key])) {
			this.items[key] = [];
			this.ratings[key] = {};
		}
		this.items[key].push(item);
		
		if (isUndefined(this.ratings[key][studentNickname])) {
			this.ratings[key][studentNickname] = "unrated";
		}
 	}
	this.needToUpdateKeys = true;
	return [ key ];
}

LinkList.prototype.itemHeaderAsHtml = function(key, i) {
	var action = this.getAction(key);
	var ratingHtml = this.ratingsAsHtml(key);
    return '<span style="font-size:1em;">' + action.action_data.title + ' (' + ratingHtml + ')</span>';
}

LinkList.prototype.itemAsHtml = function(key, i) {
	var action = this.getAction(key);
	var ratingHtml = this.ratingsAsHtml(key);
    return '<span style="font-size:1em;">' + getLinkHtml(action.action_data.url, action.action_data.title, 50) + ' (' + ratingHtml + ')</span>';
}

LinkList.prototype.ratingsAsHtml = function(key) {
	var helpful = 0;
	var unhelpful = 0;
	var unrated = 0;
	for (var studentNickname in this.ratings[key]) {
		var rating = this.ratings[key][studentNickname];
		if (rating == HELPFUL_RATING) {
			helpful++;
		}
		else if (rating == UNHELPFUL_RATING) {
			unhelpful++;
		}
		else {
			unrated++;
		}
	}	
	var countText = [];
	if (helpful > 0) countText.push(getRatingImage(HELPFUL_RATING) + '&nbsp;' + helpful);
	if (unhelpful > 0) countText.push(getRatingImage(UNHELPFUL_RATING) + '&nbsp;' + unhelpful);
	if (unrated > 0) countText.push(unrated + '&nbsp;unrated');
	return countText.join(", ");
}

LinkList.prototype.getSortValue = function(key) {
	var action = this.getAction(key);
	return action.action_data.title;
}

//=================================================================================
// Response Pane
//=================================================================================

function ResponsePane() {
	ActionPane.call(this, RESPONSE_PANE, "Responses", RESPONSE_ACTIONS, { "showTagCloud":true });
}
ResponsePane.prototype = Object.create(ActionPane.prototype);

ResponsePane.prototype.createItems = function() {
	return new ActionList("Responses", RESPONSE_ACTIONS, "response");
}

ResponsePane.prototype.createExpandedItems = function() {
	return [ new StudentList(RESPONSE_ACTIONS) ];
}