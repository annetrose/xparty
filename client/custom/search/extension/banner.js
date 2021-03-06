/*
# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Anne Rose -- www.cs.umd.edu/hcil/members/arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Created January 2013
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

var gBannerId = 'xPartyBannerFrame';
var gBannerHeight = "190px";
var gUrl = "" + window.location;
var gVisible = undefined;

// using chrome.extension.sendMessage so port not needed 
// var gPort = null;

// notify extension if page is hidden, listen for incoming messages, and check login status
checkIfHidden();
listenForMessages();
checkLoginStatus();
         
// chrome appears to pre-load some google search result pages into tabs that are not visible
// if a tab changes visibility, re-check any page visited actions
document.addEventListener("webkitvisibilitychange", checkIfHidden, false);

// check page again if hash changed
window.addEventListener("hashchange", checkPageAgain, false);
               
function checkLoginStatus() {
    // check login status by requesting student data from background
    chrome.extension.sendMessage({ "type": STUDENT_DATA_REQUEST }, function(response) {
        storeStudent(response.student, false);
        storeActivity(response.activity);
        storeResponse(response.response);
    
        // check if on XParty Search web interface
        if (gUrl == XPARTY_SEARCH_URL) {
            // student already logged in so redirect to Google
            if (isStudentLoggedIn()) {
                window.location = GOOGLE_SEARCH_URL;
            }
            // otherwise, notify extension that user has logged in via web interface
            else {
                chrome.extension.sendMessage({ "type": LOGIN_VIA_WEB });
            }
        }

        // add banner to page and 
        // check for any actions to perform as result of navigating to this page
        else if (isStudentLoggedIn() && isBannerPage(gUrl)) {
            createBanner(response.task_idx);
            checkForPageVisitedActions();
        }
    });
}

function checkPageAgain() {    
    // check page actions again if hash changed
    gUrl = "" + window.location;
    if (isStudentLoggedIn() && isBannerPage(gUrl)) {
        checkForPageVisitedActions();
    }
}

function checkIfHidden() {
    // check if page is hidden
    // chrome appears to pre-load some google search result pages into tabs that are not visible
    // notify extension if hidden, if not already notified previously
    
    var visibilityChanged = isUndefined(gVisible) || (gVisible != !document.webkitHidden);
    gVisible = !document.webkitHidden;
    
    if (visibilityChanged) {
        if (gVisible) {
            checkForPageVisitedActions();
        }
        else {
            chrome.extension.sendMessage({ "type": HIDDEN_TAB });        
        }
    }
}

function checkForPageVisitedActions() {
    // skip if page is hidden
    if (!gVisible) {
        return;
    }
    
    // skip if not a banner page
    if (!isBannerPage(gUrl)) {
        return;
    }
    
    // skip if user not logged in
    if (!isStudentLoggedIn()) {
        return;
    }
    
    // if search page, notify extension
    if (isSearchPage(gUrl)) {
        var query = getSearchQuery(gUrl);
        if (query) {
            showLoading("Saving search ...");                    
            chrome.extension.sendMessage({ "type": SEARCH_PERFORMED, "query": query, "url": gUrl });
        }
    }
    
    // if link page, notify extension
    else if (isLinkPage(gUrl)) {
        showLoading("Saving link followed ...");
        var title = $("title").text();
        chrome.extension.sendMessage({ "type": LINK_FOLLOWED, "url": gUrl, "title": title, "referrer": document.referrer });
    }
}

function listenForMessages() {
    // skip if not a banner page
    if (!isBannerPage(gUrl)) {  
        return;
    }  
    
    // add listener for incoming messages
    chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {    
        debug(message.type);
        if (message.type == LOGIN) {
            handleLogin(message);
        }
        else if (message.type == LOGOUT) {
            handleLogout(message);
        }
        else if (message.type == TASK_CHANGED) {
            handleTaskChanged(message);
        }
        else if (message.type == SEARCH_SAVED) {
            showMessage("Saved search (" + htmlEscape(message.query) + ")");
        }
        else if (message.type == LINK_SAVED) {
            var link = message.title ? message.title : message.url;
            showMessage("Link saved (" + link + ")");
        }
        else if (message.type == RATING_SAVED) {
            showMessage("Rating saved");
        }
        else if (message.type == RESPONSE_CHANGED) {
            setResponse(message.response);
        }
        else if (message.type == RESPONSE_SAVED) {
            showMessage("Response saved");
        }
        else if (message.type == ERROR) {
            showMessage("An error occurred. Please try again later.");
        }
    });
}

function handleLogin(message) {
    storeStudent(message.student, false);
    storeActivity(message.activity);
    createBanner();
}

function handleLogout(message) {
    storeStudent(null, false);
    hideBanner();
}

function handleTaskChanged(message) {
    removeTaskListeners();
    storeTaskIdx(message.task_idx);
    initTaskListeners();
    
    // TODO: update rating and response from stored values on server
    setRating();
    setResponse("");
    showMessage("");  
}

//=====================================================================
// Banner
//=====================================================================

function createBanner(taskIdx) {
    // skip if not a banner page
    if (!isBannerPage(gUrl)) {
        return;
    }
    
    // check if element with same id as banner already exists on page
    if (document.getElementById(gBannerId)) {
    	debug(gBannerId + " already exists on page");
    	$('#'+gBannerId).contents().find('html').html(getBannerHtml());
        return;
    }
    
    var taskIdx = isDefined(taskIdx) ? taskIdx : 0;
    
    // support for Google Images which requires a custom solution
    var googleImages = false;
    if (window.location.href.indexOf("www.google.com/imgres") != -1) {
        googleImages = true;
    }
    
    // resolve <html> tag, which is more dominant than <body>
    var html = getHtmlTag();
    
    // change positioning of <html> tag to relative positioning
    if (googleImages) {
        $("#il").css("top", gBannerHeight);
    } 
    else {
        if (html.css('position') === 'static') {
            html.css('position', 'relative');
        }
    
        // top offset
        var currentTop = html.css('top') === 'auto' ? 0 : parseFloat($('html').css('top'));
        html.css('top', currentTop + parseFloat(gBannerHeight) + 'px');
    }
    
    var body = $('body');
    var node = body ? body : html;
    node.append(
        '<iframe id="' + gBannerId + '" scrolling="auto" frameborder="0" allowtransparency="false" '
            + 'style="position: fixed; width: 100%; border:none; z-index: 2147483647; top: 0px;'
            + 'height: ' + gBannerHeight + '; right: 0px; left: 0px;">'
            + '</iframe>'
    );
    
    $('#'+gBannerId).contents().find('html').html(getBannerHtml());
 
    // BEHAVIOR: If extension reloaded or user logs in and out, the gPort in any existing tabs 
    // is disconnected so it should be re-created whenever banner is created 
    // gPort = chrome.extension.connect();
    
    setTaskIdx(taskIdx);
    initTaskListeners();
    
    // TODO: Need to load existing link ratings from server and store in extension background process
    setRating();
    initRatingListeners();
    
    // TODO: Need to load existing response from server
    setResponse(getStoredResponse());
    initResponseListeners();
}

function hideBanner() {
    $('#'+gBannerId).remove();
    var html = getHtmlTag();    
    html.css('top', '0px');
}

function getBannerHtml() {
    var html = '<link rel="stylesheet" type="text/css" href="' + chrome.extension.getURL("css/banner.css") + '" />';
    html += '<img id="logo" src="'+XPARTY_URL+'/imgs/xp_logo.png" alt="XParty Logo" align="left" />';
    html += '<div id="task_area">';
    html += '<div class="smallspaceafter">';
    html += '<strong>' + gActivity.class_name + '</strong> <span class="note">#'+gActivity.activity_code+'</span><br/>';
    html += 'Student: ' + getStudentNickname();
    html += '</div>';
    html += '<div class="mediumspaceafter">';
    html += 'Task: ' + getTaskChooserHtml();
    html += '</div>';
    html += '<div class="smallspaceafter">';
    if (isLinkPage(gUrl)) {
        html += 'Rate this page: ' + getRatingBoxesHtml();
    }
    html += '</div>';
    html += 'Response: '+ getResponseHtml();
    html += '<div id="msg"></div>';    
    html += '</div>';
    
    // under development
    if (DEBUG) {
        html += getTagCloudHtml();
    }
    
    return html;
}

function getHtmlTag() {
    var html = null;
    if (document.documentElement) {
        html = $(document.documentElement);
    } 
    else if (document.getElementsByTagName('html') && document.getElementsByTagName('html')[0]) {
        html = $(document.getElementsByTagName('html')[0]);
    } 
    else if ($('html').length > -1) {
        html = $('html');
    } 
    else {
        alert('No <html> element exists, so XParty Search cannot be displayed.');
        throw 'No <html> element exists, so XParty Search cannot be displayed.';
    }
    return html;
}

function getBannerElement(selector) {
    return $('#'+gBannerId).contents().find(selector);
}

function showMessage(msg) {
    getBannerElement("#msg").html("<em>"+msg+"</em>");
}

function showLoading(msg) {
    showMessage('<img src="' + XPARTY_URL + '/imgs/loading.gif"> ' + msg);
}

//=====================================================================
// Task Chooser
//=====================================================================

function getTaskChooserHtml() {
    var html = '<select id="task_chooser">';    
    for (var i=0; i<gActivity.tasks.length; i++) {
        html += '<option value="'+i+'">'+(i+1)+'. '+gActivity.tasks[i][0]+'</option>';
    }
    html += '</select>';
    html += '<div id="task_description" style="display:none"></div>';
    return html;
}

function getTaskChooser() {
    return getBannerElement("#task_chooser");
}
            
function getSelectedTaskIndex() {
    return getTaskChooser().prop('selectedIndex');
}

function setTaskIdx(taskIdx) {
    getTaskChooser().val(taskIdx);
    setTaskDescription(taskIdx);
}

function setTaskDescription(taskIdx) {
    var description = gActivity.tasks[taskIdx][1];
    var div = getBannerElement("#task_description");
    div.html(description);
    if (description != "") {
        div.show();
    }
    else {
        div.hide();
    }
}

function initTaskListeners() {
    getTaskChooser().change(onTaskChanged);
}

function removeTaskListeners() {
    getTaskChooser().unbind("change", onTaskChanged);
}

function onTaskChanged() {
    var taskIdx = getSelectedTaskIndex();
    setTaskDescription(taskIdx);
    setTagCloudSrc(taskIdx);
    chrome.extension.sendMessage({ type: TASK_CHANGED, task_idx: taskIdx });
}

//=====================================================================
// Rating Boxes
//=====================================================================

function getRatingBoxesHtml() {
    var html = '<input type="radio" name="rating" id="helpful" value="' + HELPFUL_RATING + '">Helpful&nbsp;&nbsp;</input>';
    html += '<input type="radio" name="rating" id="unhelpful" value="' + UNHELPFUL_RATING + '">Unhelpful</input>';
    return html;
}

function getRatingBoxes() {
    return getBannerElement("input[name=rating]");
}

function getSelectedRating() {
    var checkedRating = getBannerElement("input[name=rating]:checked");
    return checkedRating.val();
}

function setRating(rating) {
    if (isUndefined(rating)) {
        $("#helpful").attr("checked", "");
        $("#unhelpful").attr("checked", "");
    }
    else if (rating == HELPFUL) {
        $("#helpful").attr("checked", "checked");
    }
    else if (rating == UNHELPFUL) {
        $("#unhelpful").attr("checked", "checked");
    }
}

function initRatingListeners() {
    getRatingBoxes().change(onRatingChanged);
}

function removeRatingListeners() {
    getRatingBoxes().unbind("change", onRatingChanged);
}

function onRatingChanged() {
    var rating = getSelectedRating();
    var type = rating == HELPFUL_RATING ? RATED_HELPFUL : RATED_UNHELPFUL;
    chrome.extension.sendMessage({ "type" : type, "rating" : getSelectedRating() });
}

//=====================================================================
// Response Textbox
//=====================================================================

function getResponseHtml() {
    var html = '<input type="text" name="response" id="response" value="" style="width:200px" />';
    html += '<input type="button" name="response_button" id="response_button" value="Save" />';
    return html;
}

function getResponseTextbox() {
    return getBannerElement("input[name=response]");
}

function getResponse() {
    return getResponseTextbox().val();
}

function setResponse(response) {
    getResponseTextbox().val(response);
}

function initResponseListeners() {
    getBannerElement("input[name=response_button]").click(onResponseSaved);
    getResponseTextbox().keyup(function(event) {
        if (event.which == 13) {  // enter key
            onResponseSaved();
        }    
    });
}

function onResponseSaved() {
    var response = getResponse();
    if (response == "") {
        showMessage("Please enter a response before saving");
    }
    else {
        showLoading("Saving response ... ");
        storeResponse(response);
        chrome.extension.sendMessage({ "type" : RESPONSE_SUBMITTED, "response" : response });
    }
}

//=====================================================================
// Tagcloud
//=====================================================================

function getTagCloudHtml() {
    var html = '<div id="tagcloud_area">';
    html += '<iframe id="tagcloud_frame" src="' + getTagCloudUrl() + '"></iframe>';
    html += '</div>';
    return html;
}

function onTagCloudLoaded() {
    getBannerElement("#tagcloud_frame").show();
}

function setTagCloudSrc(taskIdx) {
    taskIdx = isDefined(taskIdx) ? taskIdx : 0;
    getBannerElement("#tagcloud_frame").hide();
    getBannerElement("#tagcloud_frame").load(function() {
        getBannerElement("#tagcloud_frame").show();
    });
    getBannerElement("#tagcloud_frame").attr("src", getTagCloudUrl(taskIdx));
}

function getTagCloudUrl(taskIdx) {
    taskIdx = isDefined(taskIdx) ? taskIdx : 0;
    return XPARTY_URL + '/tagcloud/' + gActivity.activity_code + '/' + taskIdx;
}
