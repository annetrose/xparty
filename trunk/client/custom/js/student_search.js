/*
# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn -- www.alexquinn.org
#          Anne Rose -- www.cs.umd.edu/hcil/members/arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created Nov 2012
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

THUMBS_UP_URL = "/custom/imgs/check.png"; 
THUMBS_DOWN_URL = "/custom/imgs/no.png";
NO_FRAME_DOMAINS = ["youtube.com", "google.com", "oprah.com", "facebook.com", "urbandictionary.com"];

var gCurrentSearch = { "query":"", "url":"" };

google.load('search', '1', {language : 'en'});
google.setOnLoadCallback(function() {
	// https://groups.google.com/a/googleproductforums.com/forum/#!msg/customsearch/Bp8MndGfn6M/AR8zQf5O3fIJ
	// https://groups.google.com/a/googleproductforums.com/forum/#!topic/customsearch/OUpAUFbQ6-o/discussion

	/*
	 * Autocompletion is NOT possible because we are searching the entire web.
	 *
	 * Because the autocompleted queries are based, in part, on the specific
	 * content of the webpages covered by your search engine, we will not generate
	 * autocompletions for custom search engines that search the entire web, ...
	 *
	 * http://googlecustomsearch.blogspot.com/2010/05/autocompletion-of-queries-in-custom.html
	 */
	
	var customSearchID = '011823409747730989012:4citusfmkhu';
	var customSearchOptions = {};
	customSearchOptions[google.search.Search.RESTRICT_SAFESEARCH] = google.search.Search.SAFESEARCH_STRICT;
	var customSearchControl = new google.search.CustomSearchControl(customSearchID, customSearchOptions);
	customSearchControl.setResultSetSize(10);
	customSearchControl.draw('custom_search_control');
	customSearchControl.setSearchCompleteCallback(null, onSearch)
}, true);

function initCustomUI() {
	var checkResponse = function() {
		var response = $("#response").val();
		var responseIsEmpty = response.trim().length == 0;
		if (!responseIsEmpty) {
			$("#response_save_button").removeAttr("disabled");
			$("#response_msg").html("");
		}
	}
	
	$("#response").keyup(checkResponse);
	$("#response_note").keyup(checkResponse);
	$("#response_save_button").click(onResponseSaved);
	$("#helpful_button").click(onLinkRated);
	$("#not_helpful_button").click(onLinkRated);
}

function initCustomTaskUI() {
    var taskIdx = selectedTaskIdx();
	var history = gSearchHistory[taskIdx];
	$("#response").val(history.response);
	$("#response_note").val(history.response_note);
	if (history.response) $("#response_msg").html("Saved (" + getFormattedTimestamp(history.response_timestamp) + ")");
	$("#response_save_button").attr("disabled", "disabled");
	updateSearchHistory();
}

function onSearch() {  
    // find result links and register click handler
    $("#custom_search_control").contents().find("a[class='gs-title']").click(function(event) {
    	var url = $(this).attr("href");
    	if (url.indexOf("://www.google.com/url?") > 0) {
    		// For example:
    		// http://www.google.com/url?q=http://www.thefreedictionary.com/fawn&sa=U&ei=...&ved=...&client=internal-uds-cse&usg=...
    		var queryParts = url.slice(url.indexOf("?")+1).split("&");
    		for( var queryPartNum in queryParts ) {
    			var queryPart = queryParts[queryPartNum];
    			if( queryPart.substr(0,2)==="q=" ) {
    				url = queryPart.substr(2);
    				break;
    			}
    		}
    	}
        var title = $(this).text();
    	onLinkFollowed(query, url, title);
    	followLink(url, title);
    	return false;
    });
    	            	
    // ads seem to show up a bit later, so we wait a bit and then remove them
    setTimeout("hideAds()", 500);
    
    var taskIdx = selectedTaskIdx();
    var query = $("input[name='search']").val();
    addSearch(taskIdx, query, true);
    updateSearchHistory();
}

function onLinkFollowed(query, url, title) {	
    var taskIdx = selectedTaskIdx();
    addLinkFollowed(taskIdx, query, url, title, true);
    gCurrentSearch = {"query":query, "url":url };
	updateSearchHistory();
}

function onLinkRated() {
	var taskIdx = selectedTaskIdx();
	var search = findSearchInHistory(taskIdx, gCurrentSearch.query);
	if (search) {
		var linkIndex = findLinkIndex(search, gCurrentSearch.url);
		if (linkIndex != -1) {
			var link = search["links"][linkIndex];
			var rating = this.id == "helpful_button" ? "helpful" : "not_helpful";
			addLinkRated(taskIdx, search.query, link.url, link.title, rating, true);
			updateSearchHistory();
			switchToSearch();
		}
	}
}
    
function onResponseSaved() {
	var taskIdx = selectedTaskIdx();
	var response = $("#response").val();
	var responseNote = $("#response_note").val();
	var responseTimestamp = new Date();
	$("#response_msg").html("Saved (" + getFormattedTimestamp(responseTimestamp) + ")");
	$("#response_save_button").attr("disabled", "disabled");
	addResponse(taskIdx, response, responseNote, new Date(), true);
	
    if (taskIdx == g_activity.tasks.length-1) {
        $('#msg').html("Congratulations! You have finished this activity.");
    }
}

function updateSearchHistory() {
	// ordered alphabetically; getSearches returns searches in order of when they occurred
	
	var taskIdx = selectedTaskIdx();
	var searches = getSearches(taskIdx);
	if (searches.length==0) {
		$("#search_history").html('No searches, yet');
	}
	else {
		var sortedSearches = sortSearchesAlphabetically(taskIdx);
		var html = '<ol>';
		for (var i=0; i<sortedSearches.keys.length; i++) {
			var key = sortedSearches.keys[i];
			var search = sortedSearches.dict[key];
			var query = search.query;
			var links = search.links;
			html += "<li>";
			html += htmlEscape(query);
			if (links.length > 0) {
				html += '<ul class="search_history_links">';
				for (var j=0; j<links.length; j++) {
					var link = links[j];
					var rating = link.rating == null ? "unrated" : link.rating;
					html += '<li class="' + rating + '">';
					html += getLinkHtml(link.url, link.title, 20, rating, "return onHistoryLinkClicked(event,'"+htmlEscape(query)+"');");
					html += "&nbsp;";
					if (rating == "helpful") {
						html += '<img src="' + THUMBS_UP_URL + '" width="12" height="12" alt="helpful" class="h" />';
					}
					else if (rating == "not_helpful") {
						html += '<img src="' + THUMBS_DOWN_URL + '" width="12" height="12" alt="not helpful" class="nh" />';
					}
					html += '</li>';
				}
				html += '</ul>';
			}
			html += '</li>';
		}
		html += '</ol>';
		$("#search_history").html(html);
	}
}

function onHistoryLinkClicked(event, query) {
	// TODO: Followed link not recorded again.  Should it be?
	var url = event.target.href;
	var title = event.target.title;
	gCurrentSearch = { "query":htmlUnescape(query), "url":url };
	followLink(url, title);
	return false;
}

function followLink(url, title) {
	$("#results_title").html("");
	if (domainAllowsFraming(url)) {
		// Open the link in the IFRAME.  If we used the a.target attribute
		// Firefox insisted on opening it in a new tab/window.
		$("#results_frame").get(0).src = "";
		$("#results_frame").get(0).src = url;
		$("#results_frame").show();
		$("#no_frame_message").hide();
	}
	else {
		$("#results_frame").hide()
		$("#no_frame_message").show();
		window.open(url);
	}
	$("#results_title").html(title);
	switchToResults();
}

function switchToSearch() {
	$("#results_frame").get(0).src = "about:blank";
	$("#results_container").hide();
	$("#search_container").show();
}

function switchToResults() {
	$("#results_container").show();
	$("#search_container").hide();
}

/*
 * Disabling ads is explicitly ALLOWED because we are a university.
 *
 * From http://www.google.com/cse/manage/create:
 *
 * "... You must show ads alongside the search results, unless you are creating
 * your search engine for a nonprofit organization, university, or government
 * agency, in which case you can disable ads. ..."
 *
 * http://www.google.com/support/customsearch/bin/answer.py?hl=en&answer=70354
 */

function hideAds() {
	$("#custom_search_control").contents().find(".gsc-adBlock").hide();
	$("#custom_search_control").contents().find(".gsc-adBlockVertical").hide();
	$("#custom_search_control").contents().find(".gsc-tabsArea").hide();		
}

function domainAllowsFraming(url) {
	var domain = parseUrl(url).domain;
	var urlParsed = parseUrl(url);
	var domain = urlParsed.domain;
	var result = true;
	for (var i=0; i<NO_FRAME_DOMAINS.length; i++) {
		var noFrameDomain = NO_FRAME_DOMAINS[i];
		if (noFrameDomain===domain) {
			result = false;
			break;
		}
		else {
			var pos = domain.lastIndexOf(noFrameDomain);
			if ((pos + noFrameDomain.length == domain.length) && (pos==0 || domain.charAt(pos-1)=="." )) {
				result = false;
				break;
			}
		}
	}
	return result;
}

//=================================================================================
// Search History Data
//=================================================================================

var gSearchHistory = [];

function updateCustomData() {
	for (var taskIdx=0; taskIdx<g_activity.tasks.length; taskIdx++) {
		var taskHistory = g_task_histories[taskIdx];
		gSearchHistory.push({"response":"", "response_note":"", "response_timestamp":null, "searches":[]});
		for (var i=0; i<taskHistory.length; i++) {
			var type = taskHistory[i].action_type;
			var timestamp = taskHistory[i].timestamp;
			var data = taskHistory[i].action_data;
			switch(type) {
				case "search":
					addSearch(taskIdx, data.query);
					break;
				case "link":
					addLinkFollowed(taskIdx, data.query, data.url, data.title);
					break;
				case "link_rated":
					addLinkRated(taskIdx, data.query, data.url, data.title, data.rating);
					break;
				case "response":
					var localTime = getLocalTime(new Date(timestamp));
					addResponse(taskIdx, data.response, data.response_note, localTime);
					break;
			}
		}
	}
}

function addSearch(taskIdx, query, notifyTeacher) {
	var search = findSearchInHistory(taskIdx, query);
	if (!search) {
		var searches = getSearches(taskIdx);
		searches.push({"query":query, "links":[]});
	}
	
	// notify teacher whenever a search is performed (even if the same search has been performed before)
	var notifyTeacher = typeof(notifyTeacher) == "undefined" ? false : notifyTeacher;
	if (notifyTeacher) {
		onStudentAction("search", query, { "query":query });
	}
}

function addLinkFollowed(taskIdx, query, url, title, notifyTeacher) {
	var search = findSearchInHistory(taskIdx, query);
	if (search) {
		var linkIndex = findLinkIndex(search, url);
		if (linkIndex == -1) {
			search["links"].push({"url":url, "title":title, "rating":null});
		}
	
		// notify teacher whenever a link is followed (even if it has been followed before)
		var notifyTeacher = typeof(notifyTeacher) == "undefined" ? false : notifyTeacher;
		if (notifyTeacher) {
			onStudentAction("link", url, { "query":query, "url":url, "title":title });
		}
	}
}

function addLinkRated(taskIdx, query, url, title, rating, notifyTeacher) {
	var search = findSearchInHistory(taskIdx, query);
	if (search) {
		var linkIndex = findLinkIndex(search, url);
		if (linkIndex != -1) {
			var link = search["links"][linkIndex];
			if (link.rating != rating) {
				search["links"][linkIndex].rating = rating;
				
				// notify teacher whenenver a link is rated or the rating is changed
				var notifyTeacher = typeof(notifyTeacher) == "undefined" ? false : notifyTeacher;
				if (notifyTeacher) {
					onStudentAction("link_rated", url, { "query":query, "url":url, "title":title, "rating":rating });
				}
			}
		}
	}	
}

function addResponse(taskIdx, response, responseNote, responseTimestamp, notifyTeacher) {
	gSearchHistory[taskIdx].response = response;
	gSearchHistory[taskIdx].response_note = responseNote;
	gSearchHistory[taskIdx].response_timestamp = responseTimestamp; // local time
	
	// notify the teacher whenever a response is submitted
	var notifyTeacher = typeof(notifyTeacher) == "undefined" ? false : notifyTeacher;
	if (notifyTeacher) {
		onStudentAction("response", response, {"response":response, "response_note":note });
	}
}

function findSearchInHistory(taskIdx, query) {
	var match = null;
	var searches = getSearches(taskIdx);
	for (var i=0; i<searches.length; i++) {
		var search = searches[i];
		if (search.query == query) {
			match = search;
			break;
		}
	}
	return match;
}

function findLinkIndex(search, url) {
	var index = -1;
	for (var i=0; i<search.links.length; i++) {
		var link = search.links[i];
		if (link.url == url) {
			index = i;
			break;
		}
	}
	return index;
}

function getSearches(taskIdx) {
	return gSearchHistory[taskIdx]["searches"];
}

function sortSearchesAlphabetically(taskIdx) {
	var searches = getSearches(taskIdx);
	var dict = {}
	var queries = [];
	for (var i=0; i<searches.length; i++) {
		var search = searches[i];
		queries.push(search.query);
		dict[search.query] = search;
	}
		
	queries.sort(function(a,b) {	
		// case insensitive sort
		var aValue = a.toLowerCase();
		var bValue = b.toLowerCase();
		return (aValue > bValue ? 1 : (aValue < bValue ? -1 : 0));
	});
	
	return {"keys":queries, "dict":dict}
}

function lastSearch(taskIdx) {
	var searches = getSearches(taskIdx);
	return searches[searches.length-1];
}
