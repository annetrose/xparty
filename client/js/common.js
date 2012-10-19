/*
# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn -- www.alexquinn.org
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

//=================================================================================
// URLs
//=================================================================================

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
// Strings
//=================================================================================

function escapeDoubleQuotesForHtml(str) {
	return str.replace(/"/g, "&quot;");
}

function escapeForHtml(s) {
	return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function sortInPlaceAlphabetically(items, propertyName) {		
	items.sort(function(a,b) {
		var aValue = a[propertyName];
		var bValue = b[propertyName];
		
		// check if property is an array
		// if so, convert to comma-separated sorted string of values
		if ($.isArray(aValue)) {
			aValue = aValue.sort().join(', ');
			bValue = bValue.sort().join(', ');
		}
			
		// case insensitive sort
		var aValue = aValue.toLowerCase();
		var bValue = bValue.toLowerCase();
		return (aValue > bValue ? 1 : (aValue < bValue ? -1 : 0));
	});
}

//=================================================================================
// Data Structures
//=================================================================================

function dict2Array(dict) {
	var dictArray = [];
	for (key in dict) {
		dictArray.push(dict[key]);
	}
	return dictArray;
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
