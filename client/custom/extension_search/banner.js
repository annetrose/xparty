/*
# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Anne Rose -- www.cs.umd.edu/hcil/members/arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Created January 2013
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

var gBannerId = 'xPartyBannerFrame';
var gBannerHeight = "200px";
var gUrl = "" + window.location;

// using chrome.extension.sendMessage so port not needed 
// var gPort = null;

listenForMessages();
checkLoginStatus();

function checkLoginStatus() {
    chrome.extension.sendMessage({ "type": STUDENT_DATA_REQUEST }, function(response) {
    // check login status by request student data from background

        storeStudent(response.student, false);
        storeActivity(response.activity);
    
        if (gUrl == XPARTY_SEARCH_URL) {
            if (isStudentLoggedIn()) {
                window.location = GOOGLE_SEARCH_URL;
            }
            else {
                chrome.extension.sendMessage({ "type": LOGIN_VIA_WEB });
            }
        }
        else if (isStudentLoggedIn()) {
            createBanner(response.task_idx);
        }
    });
}

function listenForMessages() {
    if (isBannerPage(gUrl)) {    
        chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {    
            if (message.type == LOGIN) {
                handleLogin(message);
            }
            else if (message.type == LOGOUT) {
                handleLogout(message);
            }
            else if (message.type == TASK_CHANGED) {
                handleTaskChanged(message);
            }
        });
    }
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
    var taskChooser = getTaskChooser();
    taskChooser.unbind("change", onTaskChanged);
    taskChooser.val(message.task_idx);
    taskChooser.change(onTaskChanged);
}

//=====================================================================
// Banner
//=====================================================================

function createBanner(taskIdx) {
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
    
    // render the banner 
    if (document.getElementById(gBannerId)) {
        alert('id:' + gBannerId + ' is already being used');
        throw 'id:' + gBannerId + ' is already being used';
    }
    var body = $('body');
    var node = body ? body : html;
    node.append(
        '<iframe id="' + gBannerId + '" scrolling="no" frameborder="0" allowtransparency="false" '
            + 'style="position: fixed; width: 100%; border:none; z-index: 2147483647; top: 0px;'
            + 'height: ' + gBannerHeight + '; right: 0px; left: 0px;">'
            + '</iframe>'
    );
    
    $('#'+gBannerId).contents().find('html').html(getBannerHtml());
 
    // BEHAVIOR: If extension reloaded or user logs in and out, the gPort in any existing tabs 
    // is disconnected so it should be re-created whenever banner is created 
    // gPort = chrome.extension.connect();
    
    var taskChooser = getTaskChooser();
    taskChooser.val(taskIdx);
    taskChooser.change(onTaskChanged); 
}

function hideBanner() {
    $('#'+gBannerId).remove();
    var html = getHtmlTag();    
    html.css('top', '0px');
}

function getBannerHtml() {
    var html = '';
    html += '<div style="float:left; width: 200px">';
    html += '<img src="'+XPARTY_URL+'/imgs/xp_logo.png" alt="XParty Logo" />';
    html += '</div>';
    html += '<div style="float:left">';
    html += '<strong>' + gActivity.class_name + '</strong> (#'+gActivity.activity_code+')<br/>';
    html += "Student: " + getStudentNickname() + '<br/>';
    html += '<select id="task_chooser">';    
    for (var i=0; i<gActivity.tasks.length; i++) {
        html += '<option value="'+i+'">'+(i+1)+'. '+gActivity.tasks[i][0]+'</option>';
    }
    html += '</select>';
    html += '</div>';
    html += '<div style="clear:both"></div>';
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

//=====================================================================
// Task Chooser
//=====================================================================

function getTaskChooser() {
    return $('#'+gBannerId).contents().find('#task_chooser');
}
            
function getSelectedTaskIndex() {
    return getTaskChooser().prop('selectedIndex');
}

function onTaskChanged() {
    chrome.extension.sendMessage({ type: TASK_CHANGED, task_idx: getSelectedTaskIndex() });
}
