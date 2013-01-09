//var XPARTY_URL = 'http://xparty-test.appspot.com';
var XPARTY_URL = 'http://localhost:8080';
var SEARCH_URL = XPARTY_URL+'/student?ext=1';
var DEBUG = XPARTY_URL == "http://localhost:8080";

var STUDENT_LOGGED_OUT = 0;
var STUDENT_LOGGED_IN = 1;

var LOGIN_MESSAGE = "login";
var LOGOUT_MESSAGE = "logout";

var EMPTY_SEARCH = '<empty>';

var gLoginStatus = STUDENT_LOGGED_OUT;

function isStudentLoggedIn() {
	return gLoginStatus == STUDENT_LOGGED_IN;
}

function updateBadge(status) {
    if (status == STUDENT_LOGGED_OUT) {
        chrome.browserAction.setIcon({ path:'imgs/icon-16-logged-out.png' });
        gLoginStatus = status;
    }
    else if (status == STUDENT_LOGGED_IN) {
        chrome.browserAction.setIcon({ path:'imgs/icon-16-logged-in.png' });
        gLoginStatus = status;
    }
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

function debug(str) {
	if (DEBUG) {
		console.log(str);
	}
}
