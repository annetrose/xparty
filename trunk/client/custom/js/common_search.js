/*
# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn -- www.alexquinn.org
#          Anne Rose -- www.cs.umd.edu/hcil/members/arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created Nov 2012
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

// action types
SEARCH = "search";
LINK_FOLLOWED = "link";
RATED_HELPFUL = "rated_helpful";
RATED_UNHELPFUL = "rated_unhelpful";
RESPONSE = "response";

// action colors
ACTION_COLORS[SEARCH] = "#888888";
ACTION_COLORS[LINK_FOLLOWED] = "#454C45"; 
ACTION_COLORS[RATED_HELPFUL] = "#739c95"; 
ACTION_COLORS[RATED_UNHELPFUL] = "#5C091F"; 
ACTION_COLORS[RESPONSE] = "blue";

// link ratings
HELPFUL_RATING = "helpful";
UNHELPFUL_RATING = "unhelpful";
HELPFUL_IMAGE = "/custom/imgs/helpful.png"; 
UNHELPFUL_IMAGE = "/custom/imgs/unhelpful.png";

function getRatingImage(rating) {
	var html = "";
	if (rating == HELPFUL_RATING) {
		html += '<img src="' + HELPFUL_IMAGE + '" width="12" height="12" alt="helpful" class="h" />';
	}
	else if (rating == UNHELPFUL_RATING) {
		html += '<img src="' + UNHELPFUL_IMAGE + '" width="12" height="12" alt="not helpful" class="nh" />';
	}
	return html;
}
					