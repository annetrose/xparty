/*
# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn -- www.alexquinn.org
#          Anne Rose -- www.cs.umd.edu/hcil/members/arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created Nov 2012
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

// BEHAVIOR: a query is found to be helpful if at least one link followed is rated helpful
// BEHAVIOR: counts displayed represent number of students who did something (e.g., 3 students found query cat to be helpful)
// BEHAVIOR: keys used by QueryPane and WordPane are case insensitive (e.g., dog and Dog are grouped together)
// BEHAVIOR: all responses made by user for given task are shown in ResponsePane or should only most recent be shown?

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
	// used to display task history in StudentPane and HistoryPane
	// function not required if action.action_description used for all action types
	var html = "";
	var list = null;
	switch(action.action_type) {
	case SEARCH:
		list = new QueryList();
		break;
	case LINK_FOLLOWED:
	case RATED_HELPFUL:
	case RATED_UNHELPFUL:
		list = new LinkList();
		break;
	case RESPONSE:
		list = new ResponseList();
		break;
	default:
		list = null;
		html = action.action_description;
		break;
	}
	
	if (list != null) {
		var items = list.addItems(action);
		html = list.itemAsHtml(items[0].getKey(), undefined, "");
	}
	
	return html;
}

//=================================================================================
// Query Pane
//=================================================================================

// BEHAVIOR: The same link may be visited by the same student after different queries.
// The means the student may rate the same link multiple times.  In general, the most
// recent student rating is used to indicate how a link is rated.  However, in the
// query pane, the link ratings shown in the expanded view reflect how the link
// was rated for the selected query.  The same query may be performed multiple times.
// In this case, the most recent link rating is used.

function QueryPane() {
    ActionPane.call(this, QUERY_PANE, "Queries", QUERY_ACTIONS, { "showTagCloud":true });
}
QueryPane.prototype = Object.create(ActionPane.prototype);

QueryPane.prototype.createTagCloud = function(div) {
	return new QueryCloud(div, this.list);
}

QueryPane.prototype.createList = function() {
	return new QueryList();
}

QueryPane.prototype.createExpandedLists = function() {
	var lists = [];
	lists.push(new StudentList(QUERY_ACTIONS));
	lists.push(new LinkList());
	return lists;
}

QueryPane.prototype.updateData = function(data, taskIdx) {
	ActionPane.prototype.updateData.call(this, data, taskIdx);
	var keysChanged = this.list.updateRatings(data, taskIdx);
	this.setItemsChanged(keysChanged);
}

function QueryCloud(div, items, options) {
	TagCloud.call(this, div, items, options);
}
QueryCloud.prototype = Object.create(TagCloud.prototype);

QueryCloud.prototype.getTagWeight = function(key) {
	var weight = 0;
	var filter = this.list.getFilter();
	if (isDefined(filter)) {
		var ratingCounts = this.list.getRatingCounts(key);
		var rating = this.list.filterToRating(filter);
		weight = ratingCounts[rating];
	}
	else {
		weight = ActionCloud.prototype.getTagWeight.call(this, key);
	}
	return weight;
}

QueryCloud.prototype.getColors = function() {
	var filter = this.list.getFilter();
	if (isDefined(filter)) {
		var rating = this.list.filterToRating(filter);
		var color = rating == HELPFUL_RATING ? ACTION_COLORS[RATED_HELPFUL] : (rating == UNHELPFUL_RATING ? ACTION_COLORS[RATED_UNHELPFUL] : DEFAULT_TAG_COLOR);
		return { "start": color, "end": color };	
	}
	else {
		return TagCloud.prototype.getColors.call(this);
	}
	
}

function QueryList(actionTypes) {
	var actionTypes = isDefined(actionTypes) ? actionTypes : QUERY_ACTIONS;
	ActionList.call(this, "Queries", "query", actionTypes);
	this.setFilters([ "Helpful", "Unhelpful", "Unrated" ]);
	this.keyVersions = {};
	this.ratings = {};
	this.defaultPaneKey = QUERY_PANE;
}
QueryList.prototype = Object.create(ActionList.prototype);

QueryList.prototype.createItems = function(action) {
	var items = ActionList.prototype.createItems.call(this, action);
	if (items.length > 0) {
		var queryVersion = items[0].getKey();
		var queryKey = queryVersion.toLowerCase();
		items[0].key = queryKey;
		if (isUndefined(this.keyVersions[queryKey])) {
			this.keyVersions[queryKey] = [];
		}
		if ($.inArray(queryVersion, this.keyVersions[queryKey]) == -1) {
			this.keyVersions[queryKey].push(queryVersion);
		}
	}
	return items;
}

QueryList.prototype.updateRatings = function(action, taskIdx) {	
	// BEHAVIOR: query ratings are based on link ratings
	// if a student doesn't rate any followed links, the query is unrated
	// if a student rates any followed link as helpful, the query is helpful
	// if a student rates all followed links as unhelpful, the query is unhelpful
	// a student may rate the same link more than once after a query, if so, the most recent rating is used
		
	var keysChanged = [];
	var studentNickname = action.student_nickname;
	
	var newItems = this.createItems(action);
	for (var i=0; i<newItems.length; i++) {
		var key = newItems[i].getKey();
		
		// check if query has been performed before
		// if not, initialize query ratings
		//
		if (isUndefined(this.ratings[key])) {
			this.ratings[key] = {};
		}
				
	    // check if this student has rated this query before
	    // if not, initialize query ratings for this student
	    // where rating is overall query rating and link_ratings
	    // are most recent ratings for followed links (key is link url and value is rating)
	    //
		if (isUndefined(this.ratings[key][studentNickname])) {
			this.ratings[key][studentNickname] = { "rating": UNRATED, "link_ratings": {} };
			keysChanged.push(key);
		}
		
		// if student rated a link, update ratings as needed
		//
		var isLinkRating = isDefined(action) && action.task_idx==taskIdx && $.inArray(action.action_type, LINK_ACTIONS) > -1;
		if (isLinkRating) {
			var url = action.action_data["url"];
			var rating = action.action_data["rating"];
			var linkRatings = this.ratings[key][studentNickname].link_ratings;
			
			if (isUndefined(linkRatings[url])) {
				linkRatings[url] = UNRATED;
			}
			
			if (isDefined(rating)) {
				linkRatings[url] = rating;
			}
			
			var queryRating = UNRATED;
			for (url in linkRatings) {
				if (linkRatings[url] == HELPFUL_RATING) {
					queryRating = HELPFUL_RATING;
					break;
				}
				else if (linkRatings[url] == UNHELPFUL_RATING) {
					queryRating = UNHELPFUL_RATING;
				}
			}
			
			// if rating changed, return key to mark item as changed
			if (this.ratings[key][studentNickname]["rating"] != queryRating) {
				this.ratings[key][studentNickname]["rating"] = queryRating;
				if ($.inArray(key, keysChanged) == -1) {
					keysChanged.push(key);
				}
			}
		}
	}
	
	return keysChanged;
}

QueryList.prototype.itemAsHtml = function(key, itemText, countText, paneKey) {
	var itemText = isDefined(itemText) ? itemText : this.keyVersions[key].join(", ");
	var countText = isDefined(countText) ? countText : this.ratingsAsHtml(key);
	return ActionList.prototype.itemAsHtml.call(this, key, itemText, countText, paneKey);
}

QueryList.prototype.ratingsAsHtml = function(key) {
	var countText = [];
	var counts = this.getRatingCounts(key);
	if (counts[HELPFUL_RATING] > 0) countText.push(getRatingImage(HELPFUL_RATING) + counts[HELPFUL_RATING]);
	if (counts[UNHELPFUL_RATING] > 0) countText.push(getRatingImage(UNHELPFUL_RATING) + counts[UNHELPFUL_RATING]);
	if (counts[UNRATED] > 0) countText.push(counts[UNRATED] + '&nbsp;unrated');
	return countText.length > 0 ? countText.join(", ") : "";
}

QueryList.prototype.getRatingCounts = function(key) {
	var counts = {};
	counts[HELPFUL_RATING] = 0;
	counts[UNHELPFUL_RATING] = 0;
	counts[UNRATED] = 0;
	for (var studentNickname in this.ratings[key]) {
		var rating = this.ratings[key][studentNickname].rating;
		if (rating == HELPFUL_RATING) {
			counts[HELPFUL_RATING]++;
		}
		else if (rating == UNHELPFUL_RATING) {
			counts[UNHELPFUL_RATING]++;
		}
		else {
			counts[UNRATED]++;
		}
	}
	return counts;
}

QueryList.prototype.filterToRating = function(filter) {
	return filter=="Helpful" ? HELPFUL_RATING : (filter=="Unhelpful" ? UNHELPFUL_RATING : UNRATED);
}

//=================================================================================
// Word Pane
//=================================================================================

function WordPane() {
    QueryPane.call(this);
    this.key = WORD_PANE;
    this.title = "Words";
}
WordPane.prototype = Object.create(QueryPane.prototype);

WordPane.prototype.createList = function() {
	return new WordList(this.actionTypes);
}

WordPane.prototype.createExpandedLists = function() {
	var lists = [];
	lists.push(new StudentList(QUERY_ACTIONS));
	lists.push(new QueryList([ SEARCH, LINK_FOLLOWED, RATED_HELPFUL, RATED_UNHELPFUL ]));
	lists.push(new LinkList());
	return lists;
}

WordPane.prototype.updateData = function(data, taskIdx) {	
	QueryPane.prototype.updateData.call(this, data, taskIdx);
	var list = this.list.createItems(data);
	for (var i=0; i<list.length; i++) {
		var key = list[i].getKey();
		var queryList = this.expandedLists[key][1];
		if (queryList.isItemData(data, taskIdx)) {
			queryList.updateRatings(data, taskIdx);
		}
	}
}

function WordList(actionTypes) {
	QueryList.call(this, actionTypes);
	this.title = "Words";
	this.defaultPaneKey = WORD_PANE;
}
WordList.prototype = Object.create(QueryList.prototype);

WordList.prototype.createItems = function(action) {
	var wordItems = [];
	var queryItems = QueryList.prototype.createItems.call(this, action);
	if (queryItems.length > 0) {
		var query = queryItems[0].getKey();	
		var words = query.split(" ");
		for (var i=0; i<words.length; i++) {
			var wordVersion = words[i];
			var wordKey = words[i].toLowerCase();
			if (!isStopWord(wordKey)) {
				wordItems.push(new DataItem(wordKey, action));
				if (isUndefined(this.keyVersions[wordKey])) {
					this.keyVersions[wordKey] = [];
				}
				if ($.inArray(wordVersion, this.keyVersions[wordKey]) == -1) {
					this.keyVersions[wordKey].push(wordVersion);
				}
			}
		}
	}
	return wordItems;
}

//=================================================================================
// Link Pane
//=================================================================================

function LinkPane() {
    ActionPane.call(this, LINK_PANE, "Links", LINK_ACTIONS, { "showTagCloud":true });
}
LinkPane.prototype = Object.create(ActionPane.prototype);

LinkPane.prototype.createAccordion = function(div) {
	return new LinkAccordion(div, this.list, this.expandedLists);
}

LinkPane.prototype.createTagCloud = function(div) {
	return new LinkCloud(div, this.list);
}

LinkPane.prototype.createList = function() {
	return new LinkList();
}

LinkPane.prototype.createExpandedLists = function() {
	var lists = [];
	lists.push(new StudentList([ LINK_FOLLOWED ]));
	lists.push(new QueryList(LINK_ACTIONS));
	return lists;
}

LinkPane.prototype.updateData = function(data, taskIdx) {	
	ActionPane.prototype.updateData.call(this, data, taskIdx);
	var list = this.list.createItems(data);
	if (list.length > 0) {
		var key = list[0].getKey();
		var queryList = this.expandedLists[key][1];
		if (queryList.isItemData(data, taskIdx)) {
			queryList.updateRatings(data, taskIdx);
		}
	}
}
	
function LinkAccordion(div, items, expandedItems) {
	AccordionList.call(this, div, items, expandedItems);
}
LinkAccordion.prototype = Object.create(AccordionList.prototype);

LinkAccordion.prototype.expandedAsHtml = function(key, i) {
	var html = '<p class="small" style="margin-top:0px; margin-bottom:15px">' + getLinkHtml(key, "View Link") + "</p>";
	html += AccordionList.prototype.expandedAsHtml.call(this, key, i);
	return html;
}

function LinkCloud(div, items, options) {
	TagCloud.call(this, div, items, options);
}
LinkCloud.prototype = Object.create(TagCloud.prototype);

LinkCloud.prototype.getTagWeight = function(key) {
	var weight = 0;
	var filter = this.list.getFilter();
	if (isDefined(filter)) {
		var ratingCounts = this.list.getRatingCounts(key);
		var rating = this.list.filterToRating(filter);
		weight = ratingCounts[rating];
	}
	else {
		weight = ActionCloud.prototype.getTagWeight.call(this, key);
	}
	return weight;
}

LinkCloud.prototype.getColors = function() {
	var filter = this.list.getFilter();
	if (isDefined(filter)) {
		var rating = this.list.filterToRating(filter);
		var color = rating == HELPFUL_RATING ? ACTION_COLORS[RATED_HELPFUL] : (rating == UNHELPFUL_RATING ? ACTION_COLORS[RATED_UNHELPFUL] : DEFAULT_TAG_COLOR);
		return { "start": color, "end": color };	
	}
	else {
		return TagCloud.prototype.getColors.call(this);
	}
	
}

function LinkList() {
	ActionList.call(this, "Links Followed", "url", LINK_ACTIONS);
	this.setFilters([ "Helpful", "Unhelpful", "Unrated" ]);
	this.ratings = {};
	this.defaultPaneKey = LINK_PANE;
}
LinkList.prototype = Object.create(ActionList.prototype);

LinkList.prototype.addItems = function(action) {	
	var items = ActionList.prototype.addItems.call(this, action);
	var studentNickname = action.student_nickname;
	
	// assume only one link per action
	var key = items[0].getKey();
	
	if (isUndefined(this.ratings[key])) {
		this.ratings[key] = {};
	}		
	if (isUndefined(this.ratings[key][studentNickname])) {
		this.ratings[key][studentNickname] = UNRATED;
	}
	if (action.action_type == RATED_HELPFUL || action.action_type == RATED_UNHELPFUL) {
		this.ratings[key][studentNickname] = action.action_data["rating"];
	}
	return items;
}

LinkList.prototype.itemAsHtml = function(key, itemText, countText, paneKey) {
	var action = this.getAction(key);
	var itemText = isDefined(itemText) ? itemText : action.action_data.title.clip(50);
	var countText = isDefined(countText) ? countText : this.ratingsAsHtml(key);
	return ActionList.prototype.itemAsHtml.call(this, key, itemText, countText, paneKey);
}

LinkList.prototype.ratingsAsHtml = function(key) {
	var countText = [];
	var counts = this.getRatingCounts(key);
	if (counts[HELPFUL_RATING] > 0) countText.push(getRatingImage(HELPFUL_RATING) + counts[HELPFUL_RATING]);
	if (counts[UNHELPFUL_RATING] > 0) countText.push(getRatingImage(UNHELPFUL_RATING) + counts[UNHELPFUL_RATING]);
	if (counts[UNRATED] > 0) countText.push(counts[UNRATED] + '&nbsp;unrated');
	return countText.length > 0 ? countText.join(", ") : "";
}

LinkList.prototype.getRatingCounts = function(key) {
	var counts = {};
	counts[HELPFUL_RATING] = 0;
	counts[UNHELPFUL_RATING] = 0;
	counts[UNRATED] = 0;
	for (var studentNickname in this.ratings[key]) {
		var rating = this.ratings[key][studentNickname];
		if (rating == HELPFUL_RATING) {
			counts[HELPFUL_RATING]++;
		}
		else if (rating == UNHELPFUL_RATING) {
			counts[UNHELPFUL_RATING]++;
		}
		else {
			counts[UNRATED]++;
		}
	}
	return counts;
}

LinkList.prototype.getValueForSort = function(key) {
	var action = this.getAction(key);
	return action.action_data.title;
}

LinkList.prototype.filterToRating = function(filter) {
	return filter=="Helpful" ? HELPFUL_RATING : (filter=="Unhelpful" ? UNHELPFUL_RATING : UNRATED);
}

//=================================================================================
// Response Pane
//=================================================================================

function ResponsePane() {
	ActionPane.call(this, RESPONSE_PANE, "Responses", RESPONSE_ACTIONS, { "showTagCloud":true });
}
ResponsePane.prototype = Object.create(ActionPane.prototype);

ResponsePane.prototype.createList = function() {
	return new ResponseList();
}

ResponsePane.prototype.createExpandedLists = function() {
	return [ new StudentList(RESPONSE_ACTIONS) ];
}

function ResponseList() {
	ActionList.call(this, "Responses", "response", RESPONSE_ACTIONS);
	this.defaultPaneKey = RESPONSE_PANE;
}
ResponseList.prototype = Object.create(ActionList.prototype);

//=================================================================================
// Language and Stemming
//=================================================================================

var STOP_WORDS = [ "a", "am", "an", "and", "been", "by", "in", "is", "or", "the", "was", "were" ];

function isStopWord(word) {
	var stopWordsSet = isStopWord._stopWordsSet;
	if (isUndefined(stopWordsSet)) {
		var stopWordsSet = {};
		var numStopWords = STOP_WORDS.length;
		for(var i=0; i<numStopWords; i++) {
			stopWordsSet[STOP_WORDS[i]] = true;
		}
		isStopWord._stopWordsSet = stopWordsSet;
	}
	return isDefined(stopWordsSet[word]);
}

function getWordStem(word) {
	var stemCache = getWordStem._stemCache;
	if (isUndefined(getWordStem.stemCache)) {
		stemCache = getWordStem._stemCache = {};
	}
	var stem = stemCache[word];

	if (isUndefined(stem)) {
		var snowballStemmer = getWordStem._snowballStemmer;
		if (isUndefined(snowballStemmer)) {
			snowballStemmer = getWordStem._snowballStemmer = new Snowball("english");
		}
		snowballStemmer.setCurrent(word);
		snowballStemmer.stem();
		stem = snowballStemmer.getCurrent();
		stemCache[word] = stem;
	}
	return stem;
}

function normalizeSpacing(s) {
	return s.replace(/\s+/g, " ").trim();
}