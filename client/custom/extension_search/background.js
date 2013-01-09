$(document).ready(function() {
	$.ajax({
        type: 'POST',
        url: XPARTY_URL+"/student_info",
        dataType: "json",
        cache: false,
        success: function(data) {
            updateBadge(data.status);
			if (isStudentLoggedIn()) {
			}
        },
		error: function() {
			updateBadge(STUDENT_LOGGED_OUT);
		}
    });
});	

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
	if (request.type == LOGIN_MESSAGE) {
		handleLogin();
	}
	else if (request.type == LOGOUT_MESSAGE) {
        handleLogout();
    }
});

function handleLogin() {
    updateBadge(STUDENT_LOGGED_IN);
}

function handleLogout() {
    $.get(XPARTY_URL+"/student_logout", function(data) {
        updateBadge(STUDENT_LOGGED_OUT);
    });
}

// search: fia umd (in google toolbar)
// follow: www.fia.umd.edu
// => chrome.tabs.onActivated,chrome.history.onVisited raised but not chrome.tabs.onUpdated
// Bug Report: http://code.google.com/p/chromium/issues/detail?can=2&q=109557&colspec=ID%20Pri%20Mstone%20ReleaseBlock%20OS%20Area%20Feature%20Status%20Owner%20Summary&id=109557

chrome.tabs.onActivated.addListener(function(info) {
	// tab.url may not be set yet according to documentation
	// but only onActivated called when use simply switches between tabs (no reload)
	if (isStudentLoggedIn()) {
	}
});

chrome.tabs.onUpdated.addListener(function(tabId, info, tab) {
	// tab title suppposed to be set when info.status is complete but not always the case
	// first url loaded in tab seems to give correct title, but secondary urls do not always
	// added timeout based on suggestion in bug issue below
	// http://code.google.com/p/chromium/issues/detail?id=96716
	if (isStudentLoggedIn() && info.status=='complete') {
	}
});

chrome.tabs.onRemoved.addListener(function(tabId) {
	if (isStudentLoggedIn()) {
	}
});

chrome.history.onVisited.addListener(function(historyItem) {
	if (isStudentLoggedIn()) {
	    chrome.windows.getCurrent({ populate: true }, function(window) {
            var url = historyItem.url;
            chrome.history.getVisits({ 'url':url }, function(visitItems) {
                // check if student logged out on XParty web interface
                // if so, inject js to notify popup about logout state
                if (url == XPARTY_URL+'/student_logout') {
                    chrome.tabs.executeScript(null, { file: "logout.js" });
                }
            });
        });
	}
	else {
		chrome.windows.getCurrent({ populate: true }, function(window) {
			var url = historyItem.url;
			chrome.history.getVisits({ 'url':url }, function(visitItems) {
                // if user logs in via extension, notify popup about login state when SEARCH_URL is visited
                // if user navigates to SEARCH_URL manually, popup will be updated incorrectly
                // user may login using XParty web interface but popup will not be notified about login
                // TODO: notify popup about login state when user logins to search activity via web interface
				if (url == SEARCH_URL) {
				    chrome.tabs.executeScript(null, {file: "login.js"});				
				}
			});
		});
	}
});