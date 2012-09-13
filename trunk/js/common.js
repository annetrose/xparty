THUMBS_UP_URL = "/imgs/check.png"; 
THUMBS_DOWN_URL = "/imgs/no.png";
MAX_TAG_LENGTH = 30;

function clipText(s, maxLength) {
	var dots = "...";
	var sLength = s.length;
	if (sLength > maxLength) {
		s = s.substr(0, maxLength - dots.length) + dots;
	}
	return s;
}

function makeLinkHTML(linkInfo, maxLength, className, onclick) {
	var url = linkInfo.url;
	var title = linkInfo.title;
	url = escapeForHtml(url);
	var displayTitle;

	if (maxLength !== null && maxLength !== 0) {
		displayTitle = clipText(title, maxLength);
	}
	else {
		displayTitle = title;
	}
	displayTitle = escapeForHtml( displayTitle );
	var moreAttrs = "";
	if (className) {
		moreAttrs += ' class="' + className + '"';
	}
	if (onclick) {
		moreAttrs += ' onclick="' + onclick + '"';
	}
	var linkHTML = '<a href="' + url + '" title="' + title + '" target="_blank" ' + moreAttrs + '>' + displayTitle + '</a>';

	return linkHTML;
}

function escapeForHtml(s) {
	return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;");
}

function makeTimestamp() {
	return (new Date()).toLocaleTimeString();
}

function getLocalTime(gmt)  {
    var min = gmt.getTime() / 1000 / 60; // convert gmt date to minutes
    var localNow = new Date().getTimezoneOffset(); // get the timezone offset in minutes            
    var localTime = min - localNow; // get the local time
    return new Date(localTime * 1000 * 60); // convert it into a date
}

var g_months = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ]
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

function getFormattedNumericDate(ts) {
    var month = ''+(ts.getMonth()+1);
    if (month.length==1) month = '0' + month;
    var day = ''+ts.getDate();
    if (day.length == 1) day = '0' + day;
    return month + '/' + day + '/'+ ts.getFullYear();
}

function getTimestamp() {
	var ts = new Date();
    var month = g_months[ts.getMonth()];
    var date =  g_months[ts.getMonth()] + ' ' + ts.getDate() + ', '+ ts.getFullYear();
    var hours = ''+ts.getHours();
    var mins = ''+ts.getMinutes();
    if (mins.length == 1) mins = '0' + mins;
    var secs = ''+ts.getSeconds();
    if (secs.length == 1) mins = '0' + mins;
    var time = hours + ':' + mins + ':' + secs;
    return date + ' ' + time;
}

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

function domainAllowsFraming(url) {
	var domain = parseUrl(url).domain;
	var urlParsed = parseUrl(url);
	var domain = urlParsed.domain;
	var noFrameDomains = NO_FRAME_DOMAINS;
	var result = true;
	for( var numNoFrameDomains=noFrameDomains.length, i=0; i<numNoFrameDomains; i++ ) {
		var noFrameDomain = noFrameDomains[i];
		if( noFrameDomain===domain ) {
			result = false;
			break;
		}
		else {
			var pos = domain.lastIndexOf(noFrameDomain);
			if((pos + noFrameDomain.length == domain.length) && (pos==0 || domain.charAt(pos-1)=="." ) ) {
				result = false;
				break;
			}
		}
	}
	return result;
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
	if(r.length==1) {
		r = r[0];
	}
	else if(r.length==0) {
		r = '';
	}
	else {
		// alert("ERROR 5610:  Please tell Alex Quinn at aq@cs.umd.edu.");
		r = "";
	}
	return r;
}
