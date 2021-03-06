/*
# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn -- www.alexquinn.org
#          Anne Rose -- www.cs.umd.edu/hcil/members/arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

// action types
var LOGIN = "log_in";
var LOGOUT = "log_out";

// sort options
var SORT_ALPHABETICALLY = "ABC";
var SORT_BY_FREQUENCY = "Frequency";
var SORT_BY_LOGIN_STATUS = "Login Status";

//=================================================================================
// Actions
//=================================================================================

// <action> = {
//     "student_nickname":     <string>, 
//     "action_description":   <string>,
//     "activity_code":        <string>, 
//     "action_type":          <string>, 
//     "timestamp":            <string, e.g., "January 07, 2013 21:18:30">, 
//     "task_idx":             <integer, starting at 0>,
//     "action_data":          {<custom>}
// }

function getActivityCode(action) {
    return action.activity_code;
}

function getTaskIdx(action) {
    return action.task_idx;
}

function getStudentNickname(action) {
    return action.student_nickname;
}

function getActionType(action) {
    return action.action_type;
}

function getActionData(action, property) {
    return action.action_data[property];
}

function getActionDescription(action) {
    return action.action_description;
}

function getActionTimestamp(action) {
    return action.timestamp;
}

function getActionValue(action, property) {
    var value = action[property];
    if (isUndefined(value)) {
        value = getActionData(action, property);
    }
    return value;
}

//=================================================================================
// Strings
//=================================================================================

String.prototype.clip = function(maxLength) {
	var dots = "...";
	var s = this;
	var sLength = s.length;
	if(sLength > maxLength) {
		s = s.substr(0, maxLength - dots.length) + dots;
	}
	return s;
}

String.prototype.toTitleCase = function() {
	var A = this.split(' '), B = [];
	for (var i = 0; A[i] !== undefined; i++) {
		B[B.length] = A[i].substr(0, 1).toUpperCase() + A[i].substr(1);
	}
	return B.join(' ');
}

//=================================================================================
// Time
//=================================================================================

var g_months = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ]

function getLocalTime(gmt)  {
	if (typeof(gmt) == "undefined") {
		gmt = new Date();
	}
    var min = gmt.getTime() / 1000 / 60; // convert gmt date to minutes
    var localNow = new Date().getTimezoneOffset(); // get the timezone offset in minutes            
    var localTime = min - localNow; // get the local time
    return new Date(localTime * 1000 * 60); // convert it into a date
}

function getFormattedTimestamp(ts) {
    var month = ''+(ts.getMonth()+1);
    if (month.length==1) month = '0' + month;
    var day = ''+ts.getDate();
    if (day.length == 1) day = '0' + day;
    var date =  month + '/' + day + '/'+ (ts.getFullYear()+'').substr(2);
    var hours = ''+ts.getHours();
    var mins = ''+ts.getMinutes();
    if (mins.length == 1) mins = '0' + mins;
    var time = hours + ':' + mins;
    return date + '&nbsp;' + time;
}

function getNumericTimestamp(ts) {
	var month = ''+(ts.getMonth()+1);
	if (month.length==1) month = '0' + month;
	var day = ''+ts.getDate();
	if (day.length == 1) day = '0' + day;
    var hours = ''+ts.getHours();
    var mins = ''+ts.getMinutes();
    if (mins.length == 1) mins = '0' + mins;
    var secs = ''+ts.getSeconds();
    if (secs.length == 1) secs = '0' + secs;
	return ts.getFullYear() + month + day + "-" + hours + mins + secs;
}

//=================================================================================
// URL / HTML
//=================================================================================

function parseUrl(url) {
	var urlRegExp = new RegExp("^([a-z]{3,5})"    // type
			                 + "://"              // ://
							 + "([^?/#:]+)"       // domain
							 + "(:([0-9]{1,5}))?" // port
							 + "(/[^?#:]*)?"      // path
							 + "(\\?([^?/#:]+))?" // query string
							 + "(#[^?/#:]*)?");   // hash locator
	var parts = urlRegExp.exec(url);
	return {
		type: parts[1],
		domain: parts[2],
		port: parts[4] || null,
		path: parts[5] || null,
		queryString: (parts[7] || null)
	};
}

function getLinkHtml(url, title, maxLength, className, onclick) {
	var displayTitle = isDefined(maxLength) && maxLength!=-1 ? title.clip(maxLength) : title;
	var className = isDefined(className) ? className : "normal";
	var moreAttrs = "";
	if (className) {
		moreAttrs += ' class="' + className + '"';
	}
	if (isDefined(onclick)) {
		moreAttrs += ' onclick="' + onclick + '"';
	}
	return '<a href="' + url + '" title="' + title + '" target="_blank" ' + moreAttrs + '>' + htmlEscape(displayTitle) + '</a>';
}

function getSpecificURLParameter(url, theArgName) {
	/* Thanks to  Eric Scheid ("ironclad") for this snippet, which was downloaded from ...
	 * http://www.evolt.org/article/Javascript_to_Parse_URLs_in_the_Browser/17/14435/?format=print
	 * ... on 4-27-2010 ...
	 * ... and adapted by Alex Quinn.
	 */

	var queryString = url.slice(url.indexOf("?"));
	var sArgs = queryString.slice(1).split('&');
    var r = '';
    for (var i = 0; i < sArgs.length; i++) {
        if (sArgs[i].slice(0,sArgs[i].indexOf('=')) == theArgName) {
            r = sArgs[i].slice(sArgs[i].indexOf('=')+1);
            break;
        }
    }
    r = (r.length > 0 ? unescape(r).split(',') : '');
	if (r.length==1) {
		r = r[0];
	}
	else if (r.length==0) {
		r = '';
	}
	else {
		r = '';
	}
	return r;
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

//=================================================================================
// Dialogs
//=================================================================================

function showMessageDialog(msg, url) {
	$('#msg_dialog').html('<p>'+msg+'</p>');
    $('#msg_dialog').dialog({
        autoOpen: true,
        modal: true,
        width: 300,
        buttons: {
            OK: function() {
                $(this).dialog("close");
                if (typeof(url) != "undefined") {
                	window.location = url;
                }
            }
        }
    });
}

//=================================================================================
// Sort
//=================================================================================

function sortKeysAlphabetically(dict) {
	var keys = [];
	for (key in dict) {
		keys.push(key);
	}
	keys.sort(function(a,b) {	
		// case insensitive sort
		var aValue = a.toLowerCase();
		var bValue = b.toLowerCase();
		return (aValue > bValue ? 1 : (aValue < bValue ? -1 : 0));
	});
	return keys;
}

//=================================================================================
// Misc
//=================================================================================

function isDefined(obj) {
	return !isUndefined(obj);
}

function isUndefined(obj) {
	return typeof(obj) == "undefined";
}