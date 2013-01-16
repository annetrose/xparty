/*
# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Anne Rose -- www.cs.umd.edu/hcil/members/arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Created January 2013
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

var gPendingLoginTab = null;

$(document).ready(function() {
    loadStudent();
});

chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {
// listen for messages sent from popup or content scripts

    // get data for logged in student, if any
    if (message.type == STUDENT_DATA_REQUEST) {
        sendResponse({ 
            "type"      : STUDENT_DATA_RESPONSE, 
            "student"   : gStudent,
            "activity"  : gActivity,
            "task_idx"  : getTaskIdx()
        });
    }
    
    // student logged in via extension or web interface
    else if (message.type == LOGIN || message.type == LOGIN_VIA_WEB) {
        handleLogin(message);
    }
     
    // student logged out
    else if (message.type == LOGOUT) {
        handleLogout();
    }
    
    // student changed tasks
    else if (message.type == TASK_CHANGED) {
            handleTaskChanged(message);
        }
});

chrome.tabs.onUpdated.addListener(function(tabId, info, tab) {
// listen for any updated tabs
        
    // check for pending logins
    if (info.status == "complete" && isStudentLoggedIn() && gPendingLoginTab) {
        // notify other tabs of login
        // assumes data for logged in student has already been stored
        chrome.tabs.query({}, function(tabs) {
            for (i in tabs) {
                var tab = tabs[i];
                if (isBannerPage(tab.url) && gPendingLoginTab && gPendingLoginTab.id != tab.id) {
                    chrome.tabs.sendMessage(tab.id, { "type" : LOGIN, "student" : gStudent, "activity" : gActivity, "task_idx" : 0 });
                }
            }
            gPendingLoginTab = null;
        });
    }
}); 

function handleLogin(message) {
// if logged in via extension, store student data and create new tab for Google search
// if logged in via web, load student data and update web login to show Google search

    var loginTabInfo = { "url" : GOOGLE_SEARCH_URL, "active" : true };
    var loginTabCallback = function(tab) {
        gPendingLoginTab = tab;
    }
    
    if (message.type == LOGIN) {
        storeStudent(message.student);
        storeActivity(message.activity);
        chrome.tabs.create(loginTabInfo, loginTabCallback);
    }
    
    else if (message.type == LOGIN_VIA_WEB) {
        loadStudent(function() {
            // can not assume active tab on current window since 
            // user may navigate away from current tab
            chrome.tabs.query({}, function(tabs) {
                for (i in tabs) {
                    var tab = tabs[i];
                    if (tab.url == XPARTY_SEARCH_URL) {
                        chrome.tabs.update(tab.id, loginTabInfo, loginTabCallback);
                    }
                };
            });
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

function handleTaskChanged(data) {
// store new task and notify other tabs of change

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