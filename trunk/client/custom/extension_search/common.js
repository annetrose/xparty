/*
# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Anne Rose -- www.cs.umd.edu/hcil/members/arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Created January 2013
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

var XPARTY_URL = "http://xparty-umd.appspot.com";
//var XPARTY_URL = "http://xparty-test.appspot.com";
//var XPARTY_URL = "http://localhost:8080";
var XPARTY_LOGOUT_URL = XPARTY_URL + "/student_logout";
var XPARTY_SEARCH_URL = XPARTY_URL + "/student";
var XPARTY_STUDENT_URL = XPARTY_URL + "/student_info";
var GOOGLE_SEARCH_URL = "http://www.google.com";
var DEBUG = XPARTY_URL == "http://localhost:8080";

var LOGIN = "login";
var LOGIN_VIA_WEB = "login_via_web";
var LOGOUT = "logout";
var TASK_CHANGED = "task_changed";

// actions sent to server must have same string values as those defined in client/custom/js/common_search.js
var SEARCH_PERFORMED = "search";
var SEARCH_SAVED = "search_saved";
var LINK_FOLLOWED = "link";
var LINK_SAVED = "link_saved";
var RATED_HELPFUL = "rated_helpful";
var RATED_UNHELPFUL = "rated_unhelpful";
var RATING_SAVED = "rating_saved";
var RESPONSE_SUBMITTED = "response";
var RESPONSE_CHANGED = "response_changed";
var RESPONSE_SAVED = "response_saved";
var STUDENT_DATA_REQUEST = "student_data_request";
var STUDENT_DATA_RESPONSE = "student_data_response";
var ERROR = "error";

var HIDDEN_TAB = "hidden_tab";

var HELPFUL_RATING = "helpful";
var UNHELPFUL_RATING = "unhelpful";

// query text shown for direct links 
// (i.e., links followed as result of bookmark, manually typing in url, etc.)
var EMPTY_QUERY = '<empty>';

var gStudent = null;
var gActivity = null;
var gTaskIdx = 0;
var gTabs = {};
var gResponse = "";

function loadStudent(onStudentLoaded, onErrorLoading, updateBadgeStatus) {
    $.ajax({
        type: 'POST',
        url: XPARTY_STUDENT_URL,
        dataType: "json",
        cache: false,
        success: function(data) {
            storeStudent(data.status == 1 ? data.student : null, updateBadgeStatus);
            storeActivity(data.status == 1 ? data.activity : null);
            if (typeof(onStudentLoaded) == "function") {
                onStudentLoaded(gStudent);
            }
        },
        error: function() {
            storeStudent(null);
            storeActivity(null);
            if (typeof(onErrorLoading) == "function") {
                onErrorLoading();
            }
        }
    });
}    

function storeStudent(student, updateBadgeStatus) {
    gStudent = student;
    if (gStudent == null) {
        storeActivity(null);
        storeTaskIdx(0);
        storeResponse(null);
        storeTabs({});
    }
    
    if (isUndefined(updateBadgeStatus) || updateBadgeStatus) {
        updateBadge();
    }
}

function getStudent() {
    return gStudent;
}

function getStudentNickname() {
    return isStudentLoggedIn() ? (gStudent.anonymous===true ? "Anonymous" : gStudent.nickname) : "";    
}

function isStudentLoggedIn() {
	return gStudent != null;
}

function storeActivity(activity) {
    gActivity = activity;
    storeTaskIdx(0);
}

function getActivity() {
    return gActivity;
}

function storeTaskIdx(taskIdx) {
    gTaskIdx = taskIdx;
}

function getStoredTaskIdx() {
    return gTaskIdx;
}

function storeTabs(tabs) {
    gTabs = isDefined(tabs) ? tabs : {};
}

function storeTabWindow(tabId, windowId, index) {
    if (isUndefined(gTabs[tabId])) {
        gTabs[tabId] = {};
    }
    gTabs[tabId].window_id = windowId;
    gTabs[tabId].index = index; 
}

function storeTabQuery(tabId, query, saved) {
    if (isUndefined(gTabs[tabId])) {
        gTabs[tabId] = {};
    }
    gTabs[tabId].query = query;
    gTabs[tabId].query_saved = isDefined(saved) ? saved : true;
}

function getStoredTabQuery(tabId) {
    return isDefined(gTabs[tabId]) ? gTabs[tabId].query : undefined;
}

function isTabQuerySaved(tabId) {
    return isDefined(gTabs[tabId]) && isDefined(gTabs[tabId].query) ? gTabs[tabId].query_saved : false;
}

function storeTabLink(tabId, url, title) {
    if (isUndefined(gTabs[tabId])) {
        gTabs[tabId] = {};
        gTabs[tabId].query = getStoredTabQuery(tabId);
    }
    gTabs[tabId].url = url;
    gTabs[tabId].title = title;
}

function getStoredTabWindow(tabId) {
    return isDefined(gTabs[tabId]) ? gTabs[tabId].window_id : undefined;
}

function getStoredTabIndex(tabId) {
    return isDefined(gTabs[tabId]) ? gTabs[tabId].index : undefined;
}

function getStoredTabUrl(tabId) {
    return isDefined(gTabs[tabId]) ? gTabs[tabId].url : undefined;
}

function getStoredTabTitle(tabId) {
    return isDefined(gTabs[tabId]) ? gTabs[tabId].title : "";
}

function changeTabId(oldTabId, newTabId) {
    gTabs[newTabId] = gTabs[oldTabId];
    delete gTabs[oldTabId];
}

function storeResponse(response) {
    if (response == null) response = "";
    gResponse = response;
}

function getStoredResponse() {
    return gResponse;
}

function updateBadge() {
    var badge = gStudent != null ? 'imgs/icon-16-logged-in.png' : 'imgs/icon-16-logged-out.png';
    chrome.browserAction.setIcon({ path:badge });
}

function isXPartyPage(url) {
    return url.indexOf(XPARTY_URL) != -1;
}

function isBannerPage(url) {
    return (url.indexOf("chrome") != 0) && (url.indexOf(XPARTY_URL) != 0);
}

function isSearchPage(url) {
    if (isUndefined(url) || url == "") {
        return false;
    }
    return isGoogleSearchPage(url);
}

function isGoogleSearchPage(url) {
    if (isUndefined(url)) {
        return false;
    }

    var onSkipPage = isGoogleSearchSkipPage(url);
    var onTextSearch = url.indexOf('www.google.com') != -1;
    var onImageSearch = url.indexOf('images.google.com') != -1;
    var onNewsSearch = url.indexOf('news.google.com') != -1;
        return !onSkipPage && (onTextSearch || onImageSearch || onNewsSearch);
}

function isGoogleSearchSkipPage(url) {
    var onTextSearch = url.indexOf('www.google.com') != -1;
    var onImageSearch = url.indexOf('images.google.com') != -1;

    // Two very similar urls generated sometimes for text searches; 
    // url params in diff order, fp param has diff value, and url 2 has cad parameter
    // skip url with cad parameter
    // NOTE: Not sure what other urls might have a cad parameter that should *not* be skipped
    // 
    // Url 1: http://www.google.com/#hl=en&output=search&sclient=psy-ab&q=dog&oq=dog&gs_l=hp.3..0l4.1702.1830.0.1930.3.3.0.0.0.0.87.136.2.2.0...0.0...1c.eKs3hRkQdeQ&pbx=1&bav=on.2,or.r_gc.r_pw.r_qf.,cf.osb&fp=baac52dbdda8cd89&biw=1110&bih=1203
    // Url 2: http://www.google.com/#hl=en&output=search&sclient=psy-ab&q=dog&oq=dog&gs_l=hp.3..0l4.1702.1830.0.1930.3.3.0.0.0.0.87.136.2.2.0...0.0...1c.eKs3hRkQdeQ&pbx=1&fp=1&biw=1110&bih=1203&bav=on.2,or.r_gc.r_pw.r_qf.,cf.osb&cad=b 

    // /webhp - used by Google Instant

    return (onTextSearch && getUrlParameter(url, 'cad') != null) ||
            (onTextSearch && url.indexOf('/url') != -1) ||
        ((onTextSearch || onImageSearch) && url.indexOf('/imgres') != -1);
}

function getSearchQuery(url) {
    return getUrlParameter(url, 'q');
}

function isLinkPage(url) {
    if (isUndefined(url) || url == "") {
        return false;
    }

    var onTextSearch = url.indexOf('www.google.com') != -1;
    var onImageSearch = url.indexOf('images.google.com') != -1;

    var onSkipPage = 
        (onTextSearch && getUrlParameter(url, 'cad') != null) ||
        (onTextSearch && url.indexOf('/search') != -1) ||
            (onTextSearch && url.indexOf('/url') != -1) ||
        (onTextSearch && url.indexOf('/webhp') != -1);

    var onGoogleSearch = isGoogleSearchPage(url);
        var onXParty = url.indexOf(XPARTY_URL) != -1;
        var onChromePage = url.substring(0,6) == 'chrome';
        return !onGoogleSearch && !onXParty && !onChromePage && !onSkipPage;
}

function getUrlParameter(url, parameter) {
    // if hash, only search hash for parameter; otherwise search regular url parameters
    // Google seems to store "current" values for params in hash sometimes, 
    // and regular url params contain prior values
    var search = url;
    if (!search) search = '';
    if (search.indexOf('#') != -1) {
        search = search.substring(search.indexOf('#'));
    }
    return decodeURIComponent((new RegExp('[?|&|#]' + parameter + '=' + '([^&;]+?)(&|#|;|$)').exec(search)||[,""])[1].replace(/\+/g, '%20'))||null;
}

function isDefined(obj) {
    return !isUndefined(obj);
}

function isUndefined(obj) {
    return typeof(obj) == "undefined";
}

function isFunction(func) {
    return isDefined(func) && typeof(func) == "function";
}

function htmlEscape(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function htmlUnescape(str) {
    return String(str)
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
}

function debug(str) {
    if (DEBUG) {
        console.log(str);
    }
}
