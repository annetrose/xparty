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
// TODO/BEHAVIOR: all responses made by user for given task are shown in ResponsePane or should only most recent be shown?

// data panes
var QUERY_PANE = "query";
var WORD_PANE = "word";
var LINK_PANE = "link";
var RESPONSE_PANE = "response";

// student actions to listen for
var QUERY_ACTIONS = [SEARCH];
var LINK_ACTIONS = [ LINK_FOLLOWED, RATED_HELPFUL, RATED_UNHELPFUL ];
var RESPONSE_ACTIONS = [ RESPONSE ];

function addCustomPanes() {
	// student and task history panes included by default
	addDataPane(new QueryPane());
	addDataPane(new WordPane());		
	addDataPane(new LinkPane());
	addDataPane(new ResponsePane());
}

function customActionDescriptionToHtml(action) {
// used to display task history in StudentPane and HistoryPane
// function not required if action displayed action description in simple text
	
	var actionType = getActionType(action);
	var actionText = getActionDescription(action);
    var key = undefined;
	var paneKey = undefined;
	
	switch(actionType) {
	case SEARCH:
        key = getActionData(action, "query");
	    paneKey = QUERY_PANE;
	    break;
	case LINK_FOLLOWED:
	case RATED_HELPFUL:
	case RATED_UNHELPFUL:
	    key = getActionData(action, "url");
	    actionText = getActionData(action, "title");
	    paneKey = LINK_PANE;
		break;
	case RESPONSE:
	    key = getActionData(action, "response");
	    paneKey = RESPONSE_PANE;
		break;
	}
		
    var html = isDefined(paneKey) ? '<a href="#" class="item_link">' : "";
    html += htmlEscape(actionText);
    html += '<span class="item_key">' + htmlEscape(key) + '</span>';
    html += isDefined(paneKey) ? '<span class="item_pane">' + htmlEscape(paneKey) + '</span></a>' : "";
	return html;
	
	// xx TUESDAY
	// xx links not working in task history, but do work in student history
	// xx where is callback registration happening (and are we just getting lucky)
	// xx students should default to login status sort
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
    ActionPane.call(this, QUERY_PANE, "Queries", { "showTagCloud":true });
}
QueryPane.prototype = Object.create(ActionPane.prototype);

QueryPane.prototype.createList = function() {
    var list = new QueryList();
        
    // xx where should this go, doesn't belong here since query won't be in expanded section in query pane
    $(list).on("xp_query_rating_added", { pane: this }, function(event) {
        var pane = event.data.pane;
        if (isCurrentPane(pane)) {
            pane.accordion.refreshExpanded();
        }
    });
   
    this.itemLists = this.createItemLists(list.getKeyProperty());
	return list;
}

QueryPane.prototype.createItemLists = function(groupProperty) {
    var itemLists = [];
    var options = { groupProperty: groupProperty };
    itemLists.push({ list: new StudentList(QUERY_ACTIONS, options), view: "StudentListView" });
    itemLists.push({ list: new LinkList(options), view: "LinkListView" });
     
    for (var i in itemLists) {
        var list = itemLists[i].list;
        $(list).on("xp_action_added", { pane: this }, function(event) {
            var pane = event.data.pane;
            if (isCurrentPane(pane)) {
                // xx check if action is associated with expanded section
                // instead of refreshing always
                pane.accordion.refreshExpanded();
            }        
        });
        
        // xx create method to get list.updateActions, if any
        // better name, not an action but event type?
        for (var j in list.updateActions) {
            var eventType = list.updateActions[j];
            $(list).on(eventType, { pane: this }, function(event) {
                var pane = event.data.pane;
                if (isCurrentPane(pane)) {
                    pane.accordion.refreshExpanded();
                }
            });
        }
    }
    
    return itemLists;
}
    
QueryPane.prototype.createAccordion = function(div) {
    return new QueryAccordion(div, this.list, this.itemLists);
}

QueryPane.prototype.createTagCloud = function(div) {
    return new QueryCloud(div, this.list);
}

function QueryCloud(div, items, options) {
	TagCloud.call(this, div, items, options);
}
QueryCloud.prototype = Object.create(TagCloud.prototype);

QueryCloud.prototype.getTagText = function(key) {
    return isDefined(this.list.keyVersions[key]) ? this.list.keyVersions[key][0] : key;
}

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
	this.keyVersions = {};
    this.ratings = {};
    
	var options = {};
	options.secondary_actions = [{ eventType : "xp_update_query_rating", actionTypes: LINK_ACTIONS }];
	options.filters = { types : ["Helpful", "Unhelpful", "Unrated"] };
	ActionList.call(this, "Queries", "query", actionTypes, options);
		
	$(this).on("xp_update_query_rating", null, function(event) {
	    var ratingChanged = this.updateRating(event.action);
	    if (ratingChanged) {
            $(this).trigger({ type: "xp_query_rating_added", action: event.action });
        }
	});
	
	this.updateActions = [];
	this.updateActions.push("xp_query_rating_added");
}
QueryList.prototype = Object.create(ActionList.prototype);

QueryList.prototype.createItems = function(action) {
	var items = ActionList.prototype.createItems.call(this, action);
	
	// initialize query ratings
	//
	for (var i in items) {
	    var key = items[i].getKey();
	    var studentNickname = getStudentNickname(action);
	    
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
        }
    }
	
	// update query versions, if needed
	//
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

QueryList.prototype.updateRating = function(action) {	
	// BEHAVIOR: query ratings are based on link ratings
	// if a student doesn't rate any followed links, the query is unrated
	// if a student rates any followed link as helpful, the query is helpful
	// if a student rates all followed links as unhelpful, the query is unhelpful
	// a student may rate the same link more than once after a query, if so, the most recent rating is used
		
	// xx "query" is really key property, should not know property name?
	var studentNickname = getStudentNickname(action);
    var query = getActionData(action, "query");
    
	// check if this student has rated this query before
    // if not, initialize query ratings for this student
    // where rating is overall query rating and link_ratings
    // are most recent ratings for followed links (key is link url and value is rating)
    //
    if (isUndefined(this.ratings[query][studentNickname])) {
        this.ratings[query][studentNickname] = { "rating": UNRATED, "link_ratings": {} };
    }
        			
    // if student rated a link, update ratings as needed
	//
	var url = getActionData(action, "url");
	var rating = getActionData(action, "rating");
	var linkRatings = this.ratings[query][studentNickname].link_ratings;
			
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
			
	var ratingChanged = false;
	var oldRating = this.ratings[query][studentNickname]["rating"];
	if (queryRating != oldRating) {
		this.ratings[query][studentNickname]["rating"] = queryRating;
		ratingChanged = true;
	}	

	return ratingChanged;
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

function QueryListView(list, groupKey) {
    ListView.call(this, list, groupKey, QUERY_PANE);
}
QueryListView.prototype = Object.create(ListView.prototype);

QueryListView.prototype.itemAsHtml = function(key, itemText, countText) {
    var itemText = isDefined(itemText) ? itemText : this.list.keyVersions[key].join(", ");
    var countText = isDefined(countText) ? countText : this.ratingsAsHtml(key);
    return ListView.prototype.itemAsHtml.call(this, key, itemText, countText);
}

// xx also in accordion
QueryListView.prototype.ratingsAsHtml = function(key) {
    var countText = [];
    var counts = this.list.getRatingCounts(key);
    if (counts[HELPFUL_RATING] > 0) countText.push(getRatingImage(HELPFUL_RATING) + counts[HELPFUL_RATING]);
    if (counts[UNHELPFUL_RATING] > 0) countText.push(getRatingImage(UNHELPFUL_RATING) + counts[UNHELPFUL_RATING]);
    if (counts[UNRATED] > 0) countText.push(counts[UNRATED] + '&nbsp;unrated');
    return countText.length > 0 ? countText.join(", ") : "";
}
    
function QueryAccordion(div, list, itemLists) {
    ActionAccordion.call(this, div, list);
    this.itemLists = itemLists;
}
QueryAccordion.prototype = Object.create(ActionAccordion.prototype);

QueryAccordion.prototype.itemAsHtml = function(key, itemText, countText) {
    var itemText = isDefined(itemText) ? itemText : this.list.keyVersions[key].join(", ");
    var countText = isDefined(countText) ? countText : this.ratingsAsHtml(key);
    return ActionAccordion.prototype.itemAsHtml.call(this, key, itemText, countText);
}

QueryAccordion.prototype.ratingsAsHtml = function(key) {
    var countText = [];
    var counts = this.list.getRatingCounts(key);
    if (counts[HELPFUL_RATING] > 0) countText.push(getRatingImage(HELPFUL_RATING) + counts[HELPFUL_RATING]);
    if (counts[UNHELPFUL_RATING] > 0) countText.push(getRatingImage(UNHELPFUL_RATING) + counts[UNHELPFUL_RATING]);
    if (counts[UNRATED] > 0) countText.push(counts[UNRATED] + '&nbsp;unrated');
    return countText.length > 0 ? countText.join(", ") : "";
}

// xx change itemLists to groupLists
// xx somewhere generic?
// xx changed from expandedAsHtml
QueryAccordion.prototype.createExpanded = function(div, key, i) {
    div.empty();
    for (var j in this.itemLists) {
        var listViewId = "listview" + (i+1) + "_" + (j+1);
        div.append('<div id="'+listViewId+'"></div>');
        var listView = new window[this.itemLists[j].view](this.itemLists[j].list, key);
        listView.create($("#"+listViewId));
    }
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

WordPane.prototype.createAccordion = function(div) {
    return new WordAccordion(div, this.list);
}

function WordAccordion(div, items) {
    QueryAccordion.call(this, div, items);
}
WordAccordion.prototype = Object.create(QueryAccordion.prototype);

function WordList(actionTypes) {
	QueryList.call(this, actionTypes);
	this.title = "Words";
}
WordList.prototype = Object.create(QueryList.prototype);

WordList.prototype.createItems = function(action) {
	var wordItems = [];
	var queryItems = QueryList.prototype.createItems.call(this, action);
	if (queryItems.length > 0) {
		var query = queryItems[0].getKey();
		var queryVersions = this.keyVersions[query];
		for (var i=0; i<queryVersions.length; i++) {
		    var words = queryVersions[i].split(" ");
		    for (var j=0; j<words.length; j++) {
			    var wordVersion = words[j];
			    var wordKey = words[j].toLowerCase();
			    if (!isStopWord(wordKey)) {
				    wordItems.push(new ActionItem(wordKey, action));
				    if (isUndefined(this.keyVersions[wordKey])) {
					    this.keyVersions[wordKey] = [];
				    }
				    if ($.inArray(wordVersion, this.keyVersions[wordKey]) == -1) {
					    this.keyVersions[wordKey].push(wordVersion);
				    }
			    }
		    }
		}
	}
	return wordItems;
}

WordList.prototype.createItemLists = function() {
    var lists = [];
    lists.push(new StudentList(QUERY_ACTIONS));
    lists.push(new QueryList([ SEARCH, LINK_FOLLOWED, RATED_HELPFUL, RATED_UNHELPFUL ]));
    lists.push(new LinkList());
    return lists;
}

//=================================================================================
// Link Pane
//=================================================================================

function LinkPane() {
    ActionPane.call(this, LINK_PANE, "Links", { "showTagCloud":true });
}
LinkPane.prototype = Object.create(ActionPane.prototype);

LinkPane.prototype.createAccordion = function(div) {
	return new LinkAccordion(div, this.list);
}

LinkPane.prototype.createTagCloud = function(div) {
	return new LinkCloud(div, this.list);
}

LinkPane.prototype.createList = function() {
	var list = new LinkList();    
    this.itemLists = this.createItemLists(list.getKeyProperty());
    return list;
}

// xx make default function that returns []
LinkPane.prototype.createItemLists = function(groupProperty) {
    var itemLists  = [];
    // xx LINK_ACTIONS or just [ LINK_FOLLOWED ]    
    var options = { groupProperty: groupProperty };
    itemLists.push({ list: new StudentList(LINK_ACTIONS, options), view: "StudentListView" });
    itemLists.push({ list: new QueryList(LINK_ACTIONS), view: "QueryListView" });

    for (var i in itemLists) {
        var list = itemLists[i].list;
        $(list).on("xp_action_added", { pane: this }, function(event) {
            var pane = event.data.pane;
            if (isCurrentPane(pane)) {
                // xx check if action is associated with expanded section
                // instead of refreshing always
                pane.accordion.refreshExpanded();
            }        
        });
    }
    
    return itemLists;   
}

function LinkAccordion(div, items) {
	ActionAccordion.call(this, div, items);
}
LinkAccordion.prototype = Object.create(ActionAccordion.prototype);

LinkAccordion.prototype.itemAsHtml = function(key, itemText, countText, paneKey) {
    var action = this.list.getAction(key);
    var linkTitle = getActionData(action, "title");
    var linkUrl = getActionData(action, "url");
    var defaultItemText = linkTitle != "" ? linkTitle.clip(50) : linkUrl.clip(50);
    var itemText = isDefined(itemText) && itemText != "" ? itemText : defaultItemText;
    var countText = isDefined(countText) ? countText : this.ratingsAsHtml(key);
    return ActionAccordion.prototype.itemAsHtml.call(this, key, itemText, countText, paneKey);
}

LinkAccordion.prototype.ratingsAsHtml = function(key) {
    var countText = [];
    var counts = this.list.getRatingCounts(key);
    if (counts[HELPFUL_RATING] > 0) countText.push(getRatingImage(HELPFUL_RATING) + counts[HELPFUL_RATING]);
    if (counts[UNHELPFUL_RATING] > 0) countText.push(getRatingImage(UNHELPFUL_RATING) + counts[UNHELPFUL_RATING]);
    if (counts[UNRATED] > 0) countText.push(counts[UNRATED] + '&nbsp;unrated');
    return countText.length > 0 ? countText.join(", ") : "";
}

LinkAccordion.prototype.createExpanded = function(div, key, i) {
	var html = '<p class="small" style="margin-top:0px; margin-bottom:15px">' + getLinkHtml(key, "View Link") + "</p>";
	//html += ActionAccordion.prototype.expandedAsHtml.call(this, key, i);
	div.html(html);
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

function LinkList(options) {
    this.ratings = {};
    options = isDefined(options) ? options : {};
    options.secondary_actions = [{ eventType : "xp_update_link_rating", actionTypes: [ RATED_HELPFUL, RATED_UNHELPFUL ] }];
	options.filters = { types : ["Helpful", "Unhelpful", "Unrated"] };
	ActionList.call(this, "Links Followed", "url", [ LINK_FOLLOWED ], options);

	$(this).on("xp_update_link_rating", null, function(event) {
        var ratingChanged = this.updateRating(event.action);
        if (ratingChanged) {
            $(this).trigger({ type: "xp_link_rating_added", action: event.action });
        }
    });
    
    this.updateActions = [];    
    this.updateActions.push("xp_update_link_rating");
}
LinkList.prototype = Object.create(ActionList.prototype);

LinkList.prototype.createItems = function(action) {
    var items = ActionList.prototype.createItems.call(this, action);
    
    // initialize query ratings
    //
    for (var i in items) {
        var key = items[i].getKey();
        var studentNickname = getStudentNickname(action);
        
        // check if query has been performed before
        // if not, initialize query ratings
        //
        if (isUndefined(this.ratings[key])) {
            this.ratings[key] = {};
        }
                
        // check if this student has rated this link before
        // if not, initialize link rating for this student
        //
        if (isUndefined(this.ratings[key][studentNickname])) {
            this.ratings[key][studentNickname] = UNRATED;
        }
    }
        
    return items;
}

LinkList.prototype.updateRating = function(action) {   
    // BEHAVIOR: a student may rate the same link more than once after a query, 
    // if so, the most recent rating is used
    
    // xx "url" is really key property, should not know property name?
    var studentNickname = getStudentNickname(action);
    var link = getActionData(action, "url");
    
    // check if this student has rated this link before
    // if not, initialize rating for this student
    //
    if (isUndefined(this.ratings[link][studentNickname])) {
        this.ratings[link][studentNickname] = UNRATED;
    }
    
    var ratingChanged = false;                
    var newRating = getActionData(action, "rating");
    var oldRating = this.ratings[link][studentNickname];
    if (newRating != oldRating) {
        this.ratings[link][studentNickname] = newRating;
        ratingChanged = true;
    }
            
    return ratingChanged;
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
	var linkTitle = getActionData(action, "title");
	var linkUrl = getActionData(action, "url");
	return linkTitle ? linkTitle : linkUrl;
}

LinkList.prototype.filterToRating = function(filter) {
	return filter=="Helpful" ? HELPFUL_RATING : (filter=="Unhelpful" ? UNHELPFUL_RATING : UNRATED);
}

function LinkListView(list, groupKey) {
    ListView.call(this, list, groupKey, LINK_PANE);
}
LinkListView.prototype = Object.create(ListView.prototype);

LinkListView.prototype.itemAsHtml = function(key, itemText, countText) {
    var action = this.list.getAction(key);
    var linkTitle = getActionData(action, "title");
    var linkUrl = getActionData(action, "url");
    var defaultItemText = linkTitle != "" ? linkTitle.clip(50) : linkUrl.clip(50);
    var itemText = isDefined(itemText) && itemText != "" ? itemText : defaultItemText;
    var countText = isDefined(countText) ? countText : this.ratingsAsHtml(key);
    return ListView.prototype.itemAsHtml.call(this, key, itemText, countText);
}

LinkListView.prototype.ratingsAsHtml = function(key) {
    var countText = [];
    var counts = this.list.getRatingCounts(key);
    if (counts[HELPFUL_RATING] > 0) countText.push(getRatingImage(HELPFUL_RATING) + counts[HELPFUL_RATING]);
    if (counts[UNHELPFUL_RATING] > 0) countText.push(getRatingImage(UNHELPFUL_RATING) + counts[UNHELPFUL_RATING]);
    if (counts[UNRATED] > 0) countText.push(counts[UNRATED] + '&nbsp;unrated');
    return countText.length > 0 ? countText.join(", ") : "";
}

//=================================================================================
// Response Pane
//=================================================================================

function ResponsePane() {
	ActionPane.call(this, RESPONSE_PANE, "Responses", { "showTagCloud":true });
}
ResponsePane.prototype = Object.create(ActionPane.prototype);

ResponsePane.prototype.createList = function() {
	return new ResponseList();
}

function ResponseList() {
	ActionList.call(this, "Responses", "response", RESPONSE_ACTIONS);
}
ResponseList.prototype = Object.create(ActionList.prototype);

// xx pass in itemLists instead of hard-coding for all DataLists of this type
ResponseList.prototype.createItemLists = function() {
    return [ new StudentList(RESPONSE_ACTIONS) ];
}

function ResponseAccordion(div) {
    ActionAccordion.call(this, div, this.list);
}
ResponseAccordion.prototype = Object.create(ActionAccordion.prototype);

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