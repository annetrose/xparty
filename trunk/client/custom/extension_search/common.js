/*
# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Anne Rose -- www.cs.umd.edu/hcil/members/arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Created January 2013
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

//var XPARTY_URL = "http://xparty-test.appspot.com";
var XPARTY_URL = "http://localhost:8080";
var XPARTY_LOGOUT_URL = XPARTY_URL + "/student_logout";
var XPARTY_SEARCH_URL = XPARTY_URL + "/student";
var XPARTY_STUDENT_URL = XPARTY_URL + "/student_info";
var GOOGLE_SEARCH_URL = "http://www.google.com";
var DEBUG = XPARTY_URL == "http://localhost:8080";

var LOGIN = "login";
var LOGIN_VIA_WEB = "login_via_web";
var LOGOUT = "logout";
var TASK_CHANGED = "task_changed";
var STUDENT_DATA_REQUEST = "student_data_request";
var STUDENT_DATA_RESPONSE = "student_data_response";

var EMPTY_SEARCH = '<empty>';

var gStudent = null;
var gActivity = null;
var gTaskIdx = 0;

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

function getTaskIdx() {
    return gTaskIdx;
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

function debug(str) {
	if (DEBUG) {
		console.log(str);
	}
}
