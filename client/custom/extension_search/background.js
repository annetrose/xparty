/*
# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Anne Rose -- www.cs.umd.edu/hcil/members/arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Created January 2013
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

var gPendingLoginTabId = -1;

$(document).ready(function() {
    loadStudent();
});

chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {
// listen for messages sent from popup or content scripts

    var tab = sender.tab;
    debug(message.type+': tab='+tab.id);
        
    // TODO: check if tab opened by existing tab
    // if so update stored tab info
    // what are other cases where tab info needs to be updated?
    
    // get data for logged in student, if any
    if (message.type == STUDENT_DATA_REQUEST) {
        sendResponse({ 
            "type"      : STUDENT_DATA_RESPONSE, 
            "student"   : gStudent,
            "activity"  : gActivity,
            "task_idx"  : getStoredTaskIdx(),
            "response"  : gResponse
        });
    }
    
    // student logged in via extension or web interface
    else if (message.type == LOGIN || message.type == LOGIN_VIA_WEB) {
        handleLogin(tab, message);
    }
     
    // student logged out
    else if (message.type == LOGOUT) {
        handleLogout();
    }
    
    // student changed tasks
    else if (message.type == TASK_CHANGED) {
        handleTaskChanged(tab, message);
    }
    
    // student performed search
    else if (message.type == SEARCH_PERFORMED) {
        handleSearch(tab, message);    
    }
    
    // student followed link
    else if (message.type == LINK_FOLLOWED) {
        handleLinkFollowed(tab, message);
    }
    
    // student rated link
    else if (message.type == RATED_HELPFUL || message.type == RATED_UNHELPFUL) {
        handleLinkRated(tab, message);
    }
    
    // student submitted response
    else if (message.type == RESPONSE_SUBMITTED) {
        handleResponse(tab, message);
    }
    
});

chrome.tabs.onUpdated.addListener(function(tabId, info, tab) {
// listen for any updated tabs
    
    // check for pending logins
    if (info.status == "complete" && isStudentLoggedIn() && gPendingLoginTabId != -1) {
        // notify other tabs of login
        // assumes data for logged in student has already been stored
        chrome.tabs.query({}, function(tabs) {
            for (i in tabs) {
                var tab = tabs[i];
                if (isBannerPage(tab.url) && gPendingLoginTabId != tab.id) {
                    chrome.tabs.sendMessage(tab.id, { "type" : LOGIN, "student" : gStudent, "activity" : gActivity, "task_idx" : 0 });
                }
            }
            gPendingLoginTabId = -1;
        });
    }
}); 

function initTabs() {
// initialize existing tabs when student logs in

    storeTabs({});
    chrome.tabs.query({}, function(tabs) {
        for (var i in tabs) {
            var tab = tabs[i];
            if (isBannerPage(tab.url)) {
                storeTabLink(tab.id, tab.url, tab.title);
                if (isSearchPage(tab.url)) {
                    var query = getSearchQuery(tab.url);
                    if (query) {
                        storeTabQuery(tab.id, query, false);
                    }
                }
            }
        }
    });
}

function handleLogin(tab, message) {
// if logged in via extension, store student data and create new tab for Google search
// if logged in via web, load student data and update web login to show Google search

    var tabId = tab.id;
    var searchTab = { "url" : GOOGLE_SEARCH_URL, "active" : true };
    
    // ISSUE: initTabs may not complete before processing continues
    // but since a tab is either created or updated 
    // this may not be a problem
    initTabs();
        
    if (message.type == LOGIN) {
        storeStudent(message.student);
        storeActivity(message.activity);
        chrome.tabs.create(searchTab, function(tab) {
            gPendingLoginTabId = tab.id;
        });
    }
    
    else if (message.type == LOGIN_VIA_WEB) {
        loadStudent(function() {
            gPendingLoginTab = tabId;
            chrome.tabs.update(tabId, searchTab, null);
        });  
    }
}

function handleLogout() {
// clear student data and notify other tabs of change

    $.get(XPARTY_LOGOUT_URL, function(data) {
        storeStudent(null);
        chrome.tabs.query({}, function(tabs) {
            for (i in tabs) {
                var tab = tabs[i];
                if (isBannerPage(tab.url)) {
                    chrome.tabs.sendMessage(tab.id, { "type" : LOGOUT });
                }
            }
        });
    });
}

function handleTaskChanged(tab, data) {
// store new task and notify other tabs of change

    var tabId = tab.id;
    storeTaskIdx(data.task_idx);
    chrome.tabs.query({}, function(tabs) {
        for (i in tabs) {
            var tab = tabs[i];
            if (isBannerPage(tab.url)) {
                chrome.tabs.sendMessage(tab.id, { "type" : TASK_CHANGED, "task_idx" : data.task_idx });
            }
        }
    });
}

function handleSearch(tab, action) {
// store new search for tab and save on server

    // if new query for tab, save query to server and notify tab
    var tabId = tab.id;
    if (getStoredTabQuery(tabId) != action.query) {
        saveSearch(tabId, action.query, action.url, 
            function(tabId, data) {
                var query = data.action.action_data.query;
                var url = data.action.action_data.url;
                chrome.tabs.sendMessage(tabId, { "type" : SEARCH_SAVED, "query" : query, "url" : url });
            });
    }

    // if same query as already stored in tab, do not need to save to server again - just notify tab    
    else {
        chrome.tabs.sendMessage(tabId, { "type" : SEARCH_SAVED, "query" : action.query, "url" : action.url });
    }
}

function saveSearch(tabId, query, url, onSuccess) {
// save search on server

    $.ajax({
        type: 'POST',
        url: XPARTY_URL + "/student_action", 
        dataType: 'json',
        data: {
            task_idx : getStoredTaskIdx(),
            action_type : SEARCH_PERFORMED,
            action_description : query,
            action_data : $.toJSON({ "query" : query, "url" : url })
        },
        cache: false,
        success: function(data) {
            if (data.status == 1) {
                storeTabQuery(tabId, data.action.action_data.query);
                debug("storeTabQuery: "+tabId+','+data.action.action_data.query);
                if (isFunction(onSuccess)) {
                    onSuccess(tabId, data);
                }
            }
            else {
                sendError();
            }
        },
        error : function() {
           sendError();
        }
    });
}

function handleLinkFollowed(tab, action) {
// store link followed for tab and save in server

    var tabId = tab.id;
            
    // if new link for tab, save link to server and notify tab 
    if (getStoredTabUrl(tabId) != action.url) {
    
        // check if no query found or direct link
        // if no referrer, assume user followed link by typing in url or visiting bookmark
        // if direct link, save empty query and then save link followed
        var tabQuery = getStoredTabQuery(tabId);
        if (isUndefined(tabQuery) || (!action.referrer && tabQuery != EMPTY_QUERY)) {
            storeTabQuery(tabId, EMPTY_QUERY);
            saveSearch(tabId, EMPTY_QUERY, action.url, 
                function(tabId, data) {
                    saveLinkFollowed(tabId, action.url, action.title, onLinkSaved);
                });
        }
        
        // check if query made before student logged in (when tabs were initialized)
        // if so, save query and then save link followed
        // wait until link followed to save query since user may never use tab
        else if (isDefined(tabQuery) && !isTabQuerySaved(tabId)) {
            storeTabQuery(tabId, tabQuery);
            saveSearch(tabId, tabQuery, action.url, 
                function(tabId, data) {
                    saveLinkFollowed(tabId, action.url, action.title, onLinkSaved);
                });
        }
        
        else {
            saveLinkFollowed(tabId, action.url, action.title, onLinkSaved);
        }
    }

    // if same query as already stored in tab, do not need to save to server again - just notify tab    
    else {
        chrome.tabs.sendMessage(tabId, { "type" : LINK_SAVED, "url" : action.url, "title" : action.title });
    }
}

function saveLinkFollowed(tabId, url, title, onSuccess) {
// save link on server
	
    $.ajax({
        type: 'POST',
        url: XPARTY_URL + "/student_action", 
        dataType: 'json',
        data: {
            task_idx : getStoredTaskIdx(),
            action_type : LINK_FOLLOWED,
            action_description : url,
            action_data : $.toJSON({ "query" : getStoredTabQuery(tabId), "url" : url, "title" : title })
        },
        cache: false,
        success: function(data) {
            if (data.status == 1) {
                var url = data.action.action_data.url;
                var title = data.action.action_data.title;
                storeTabLink(tabId, url, title);
                if (isFunction(onSuccess)) {
                    onSuccess(tabId, data);
                }
            }
            else {
                sendError();
            }
        },
        error : function() {
            sendError();
        }
    });
}

function onLinkSaved(tabId, data) {
    var url = data.action.action_data.url;
    var title = data.action.action_data.title;
    chrome.tabs.sendMessage(tabId, { "type" : LINK_SAVED, "url" : url, "title" : title });
}

function handleLinkRated(tab, action) {
// save link rating to server
// TODO: notify other tabs of rating in case url is viewed in other tabs
    
    var tabId = tab.id;
    var tabQuery = getStoredTabQuery(tabId);
    var tabUrl = getStoredTabUrl(tabId); 
    var tabTitle = getStoredTabTitle(tabId);
        
    $.ajax({
        type: 'POST',
        url: XPARTY_URL + "/student_action", 
        dataType: 'json',
        data: {
            task_idx : getStoredTaskIdx(),
            action_type : action.type,
            action_description : tabUrl,
            action_data : $.toJSON({ "query" : tabQuery, "url" : tabUrl, "title" : tabTitle, "rating" : action.rating })
        },
        cache: false,
        success: function(data) {
            if (data.status == 1) {
                chrome.tabs.sendMessage(tabId, { "type" : RATING_SAVED });
            }
        }
    });
}

function handleResponse(tab, action) {
// save response to server
    
    var tabId = tab.id;
    $.ajax({
        type: 'POST',
        url: XPARTY_URL + "/student_action", 
        dataType: 'json',
        data: {
            task_idx : getStoredTaskIdx(),
            action_type : action.type,
            action_description : action.response,
            action_data : $.toJSON({ "response" : action.response, "response_note" : "" })
        },
        cache: false,
        success: function(data) {
            if (data.status == 1) {
                storeResponse(data.action.action_data.response);
                chrome.tabs.sendMessage(tabId, { "type" : RESPONSE_SAVED });
                chrome.tabs.query({}, function(tabs) {
                    for (i in tabs) {
                        var otherTab = tabs[i];
                        if (isBannerPage(otherTab.url) && otherTab.id != tabId) {
                            chrome.tabs.sendMessage(otherTab.id, { "type" : RESPONSE_CHANGED, "response" :  data.action.action_data.response });
                        }
                    }
                });
            }
        }
    });
}

function sendError(tabId, msg) {
    chrome.tabs.sendMessage(tabId, { "type" : ERROR, "msg": isDefined(msg) ? msg : "" });
}