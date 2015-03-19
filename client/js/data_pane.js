/*
# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn -- www.alexquinn.org
#          Anne Rose -- www.cs.umd.edu/hcil/members/arose
# Date: Originally created October 2012
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

// For info on JavaScript OOP, see:
// http://www.javascriptkit.com/javatutors/oopjs.shtml   (new and this)
// http://www.javascriptkit.com/javatutors/oopjs2.shtml  (constructors)
// http://www.javascriptkit.com/javatutors/oopjs3.shtml  (inheritance)
	
// BEHAVIOR: One DataPane displayed in the teacher view at all times
// BEHAVIOR: Every DataPane has an AccordionList and an optional TagCloud

// TODO: refresh accordion/tagcloud more efficiently
// TODO: write descriptions of classes

// sort options
var SORT_ALPHABETICALLY = "ABC";
var SORT_BY_FREQUENCY = "Frequency";
var SORT_BY_LOGIN_STATUS = "Login Status";

// array of DataPane objects displayed in the teacher view for the loaded activity type
var gDataPanes = [];

// key for data pane currently being viewed in teacher view
var gCurrentPaneKey = null;

function initPaneData(taskIdx) {
    gCurrentPaneKey = null;
    
    for (var i in gDataPanes) {
        gDataPanes[i].initData(taskIdx);
    }
    
    // BEHAVIOR: action events will be raised but pane will not be refreshed 
    // until showPane() is called since gCurrentPaneKey is null
    var taskHistory = gTaskHistories[taskIdx];
    for (var i in taskHistory) {
        var action = taskHistory[i];
        var actionType = getActionType(action);
        $.event.trigger({ type: "xp_" + actionType, action: action });
    }
}

function addDataPane(pane) {
    gDataPanes.push(pane);
}

function showPane(paneKey, itemKey) {
    if (!gCurrentPaneKey || paneKey != gCurrentPaneKey) {
        gCurrentPaneKey = paneKey;
        var pane = getDataPane(paneKey);
        pane.create($("#data_pane"));   
        $.event.trigger({ type: "xp_pane_visible", pane: pane });
    }
    
    if (isDefined(itemKey)) {
        pane.accordion.expandItem(itemKey);
    }
}

function getDataPanes() {
    return gDataPanes;
}

function getDataPane(key) {
    var pane = null;
    for (var i=0; i<gDataPanes.length; i++) {
        if (gDataPanes[i].key == key) {
            pane = gDataPanes[i];
            break;
        }
    } 
    return pane;
}

function getCurrentPane() {
    return gCurrentPaneKey ? getDataPane(gCurrentPaneKey) : null;
}

function isCurrentPane(pane) {
    return gCurrentPaneKey && isDefined(pane) && pane.key == gCurrentPaneKey;
}

//=================================================================================
// ListView
//=================================================================================

function ListView(list, groupKey, paneKey) {
    this.list = list;
    this.groupKey = groupKey;
    this.paneKey = paneKey;
}

// xx this.list.title should be in ListView
ListView.prototype.create = function(div) {
    this.div = div;
    var html = "<h5>" + this.list.title + "</h5>";
    html += '<ol class="list_view"></ol>';
    $(this.div).html(html);
    this.refresh();
}

ListView.prototype.refresh = function() {
    var html = "";    
    var count = 0;
    var keys = isUndefined(this.groupKey) ? this.list.getKeys() : this.list.getKeysForGroup(this.groupKey);
    for (var i in keys) {
        html += '<li class="list_item">';        
        html += this.itemAsHtml(keys[i]);
        html += '</li>';
        count++;
    }
    
    if (count == 0) {
        html = '<li class="list_item">(none)</li>';
    }
    
    $(this.div).find(".list_view").html(html);
    registerItemLinkCallbacks();
}

ListView.prototype.itemAsHtml = function(key, itemText, countText) {
    // returns html for displaying the items grouped by the same key (e.g., list.items[key])
    //
    // Format: item (count)
    // item = itemText if defined; otherwise key; it is a link to another pane if paneKey is defined
    // count = countText if defined; otherwise key count; not displayed if countText=""
    //
    var itemText = isDefined(itemText) ? itemText : key;
    var countText = isDefined(countText) ? countText : this.list.getCount(key);
    var html = isDefined(this.paneKey) ? '<a href="#" class="item_link">' : "";
    html += htmlEscape(itemText);
    html += '<span class="item_key">' + htmlEscape(key) + '</span>';
    html += isDefined(this.paneKey) ? '<span class="item_pane">' + htmlEscape(this.paneKey) + '</span></a>' : "";
    html += isDefined(countText) && countText != "" ? ' (' + countText + ')' : "";
    return html;
}

//=================================================================================
// DataPane - displays data in AccordionList and optional TagCloud
//=================================================================================

function DataPane(key, title, options) {
	this.key = key;
	this.title = title;
	this.options = options;

    // xx do not require accordion/tagcloud
	this.accordion = null;
	this.tagcloud = null;
}

// xx do not require list
DataPane.prototype.createList = function() {
    return null;
}

DataPane.prototype.createAccordion = function(div) {
	return new AccordionList(div, this.list);
}

DataPane.prototype.createTagCloud = function(div) {
	return new TagCloud(div, this.list);
}

DataPane.prototype.create = function(div) {
    var html = '<h3 id="pane_title" style="margin-bottom:10px">'+this.title+'</h3>';
    html += '<div id="pane_key" style="display:none">'+this.key+'</div>';
    
    if (this.list) {
        html += '<div id="filters"></div>';
        html += '<div id="tag_cloud" class="tag_cloud"></div>';
        html += '<div id="sort_options"></div>';
        html += '<div id="accordion_list" class="accordion2"></div>';
    }
    
    div.html(html);

    if (this.list) {
	    this.list.setDefaults();
        this.accordion = this.createAccordion($("#accordion_list"));
        this.accordion.create();

        if (isDefined(this.options) && isDefined(this.options.showTagCloud) && this.options.showTagCloud) {
            this.tagcloud = this.createTagCloud($("#tag_cloud"));
    	    this.tagcloud.linkTo(this.accordion);
    	    this.tagcloud.create();
        }
    
        this.createControls();
    }
}

DataPane.prototype.createControls = function() {
	if (this.list && this.list.getKeys().length > 0) {
		this.createSortOptions();
		this.createFilterOptions();
	}
}

DataPane.prototype.createSortOptions = function() {
	var html = "";
	var sortOptions = this.list.getSortOptions();
	if (sortOptions.length > 1) {
		html += '<span style="margin-right:10px;">';
		html += 'Sort by: ';
		for (var i=0; i<sortOptions.length; i++) {
			var option = sortOptions[i];
			html += this.list.getSort() == option ? '<strong>'+option + '</strong> ' : '<a href="#" class="sort">'+option+'</a> ';
		}
		html += '</span>';
	}
	$("#sort_options").html(html);
	$("#sort_options").data("pane", this);
	
	$('.sort').click(function(event) {
		// sorts the accordion and the tag cloud
		var pane = $("#sort_options").data("pane");
		pane.list.setSort($(this).html());
		pane.refresh();
		return false;
	});
}

DataPane.prototype.createFilterOptions = function() {
	var html = "";
	var filters = this.list.getFilterOptions();
	if (filters.length > 1) {
		html += '<span style="margin-right:10px;">';
		html += 'Show: ';
		for (var i=0; i<filters.length; i++) {
			var filter = filters[i];
			html += this.list.getFilter() == filter ? '<strong>'+filter+'</strong> ' : '<a href="#" class="filter">'+filter+'</a> ';
		}
		html += '</span>';
	}
	$("#filters").html(html);
	$("#filters").data("pane", this);
	
	$('.filter').click(function(event) {
		// filters values in tag cloud only
        var pane = $("#filters").data("pane");
		pane.list.setFilter($(this).html());
		pane.refresh();
		return false;
	});
}

// xx changed from passing data to items changed (may be new)
DataPane.prototype.refresh = function(items) {    
	// xx true if data belongs to pane (recently added) -or- if data is undefined (sort/filter performed)

    // xx when not to refresh controls
    if (this.list) {	
	    this.createControls();
	    if (this.accordion) {
		    this.accordion.refresh(items);
		    this.accordion.refreshExpanded();
        }
	    if (this.tagcloud) {
		    this.tagcloud.refresh(items);
	    }	
	}
}

DataPane.prototype.resize = function() {
}

DataPane.prototype.initData = function(taskIdx) {
	this.taskIdx = isDefined(taskIdx) ? taskIdx : 0;
	this.list = this.createList();
}

DataPane.prototype.getKey = function() {
	return this.key;
}

DataPane.prototype.getTitle = function() {
    return this.title;
}

DataPane.prototype.getCount = function() {
	return this.list ? this.list.getCount() : -1;
}

//=================================================================================
// AccordionList
//=================================================================================

function AccordionList(div, list) {
	this.div = div;
	this.list = list;
	this.expandedIndex = false;
	this.expandedKey = null;
}

AccordionList.prototype.create = function() {	
	var keys = this.list.getKeys();	
	if (keys.length == 0) {
		this.div.html('<div style="margin-bottom:15px;">(none)</div>');
	}	
	else {	
		var html = "";
		for (var i=0; i<keys.length; i++) {
			var key = keys[i];
			html += '<div id="item'+(i+1)+'" class="accordion_section"><a href="#"><span id="itemheader'+(i+1)+'">'+this.itemAsHtml(key)+'</span></a></div>';		
			html += '<div id="item'+(i+1)+'_expanded"></div>';
		}
		
		this.div.html(html);
		
		this.expandedIndex = this.getExpandedIndex();
		this.div.data("accordionList", this);
		this.div.accordion("destroy");
		this.div.accordion({
			collapsible: true, 
			active: this.expandedIndex,
			changestart: function(event, control) {
				var accordion = $("#accordion_list").data("accordionList");
				accordion.expandedIndex = control.options.active;
				accordion.refreshExpanded();
			}
		});
		
		this.refreshExpanded();
	}
}

AccordionList.prototype.refresh = function(itemsChanged) {    
	// refresh everything
	var refreshAll = isUndefined(itemsChanged) || itemsChanged.length==0;
	if (refreshAll) {
		this.create();
	}
	// otherwise, only refresh changed items
	else {
		for (var i=0; i<itemsChanged.length; i++) {
			this.refreshItem(itemsChanged[i]);
		}
	}
}

AccordionList.prototype.refreshItem = function(item) {
	// refresh header and expanded section (if open) for item
	var index = this.list.indexOf(item.getKey());
	this.refreshItemIndex(index);
}

AccordionList.prototype.refreshItemIndex = function(index) {
    // refresh header and expanded section (if open) for item
    var key = this.list.getKeys()[index];
    $("#itemheader"+(index+1)).html(this.itemAsHtml(key));
    if (this.expandedIndex == index) {
        this.refreshExpanded();
    }
}

AccordionList.prototype.refreshExpanded = function() {   
	if (this.expandedIndex !== false) {
		var selectedItem = $(".accordion_section:eq("+this.expandedIndex+")");
		this.expandedKey = $(".item_key", selectedItem).text();
		if (this.expandedKey) {
			var div = $("#item"+(this.expandedIndex+1)+"_expanded");
            this.createExpanded(div, this.expandedKey, this.expandedIndex);
		}
	}
	else {
		this.expandedKey = null;
	}
}

AccordionList.prototype.createExpanded = function(div, key, i) {
}

AccordionList.prototype.expandIndex = function(i) {
	this.div.accordion({ active:i });
}

AccordionList.prototype.expandItem = function(key) {
	var keys = this.list.getKeys();
	for (var i=0; i<keys.length; i++) {
		if (keys[i] == key) {
			this.expandedIndex = i;
			this.expandedKey = key;
			this.expandIndex(i);
			break;
		}
	}
}

AccordionList.prototype.getExpandedIndex = function() {
	var selectedIndex = false;
	if (this.expandedKey!=null) {
		for (var i=0; i<this.list.keys.length; i++) {
			if (this.expandedKey == this.list.keys[i]) {
				selectedIndex = i;
				break;
			}
		}
	}
	return selectedIndex;
}

AccordionList.prototype.itemAsHtml = function(key, itemText, countText) {
    // returns html for displaying the items grouped by the same key (e.g., list.items[key])
    //
    // Format: <item> (<count>)
    // <item> = itemText if defined; otherwise use key;
    // <count> = countText if defined; otherwise key count; nothing displayed if countText=""
    //
    var itemText = isDefined(itemText) ? itemText : key;
    var countText = isDefined(countText) ? countText : this.list.getCount(key);
    var html = htmlEscape(itemText);
    html += '<span class="item_key">' + htmlEscape(key) + '</span>';
    html += isDefined(countText) && countText != "" ? ' (' + countText + ')' : "";
    return html;
}

// xx where should this go
function registerItemLinkCallbacks() {
    $(".item_link").unbind("click");
    $(".item_link").click(function() {
        var key = $(".item_key", this).text();
        var pane = $(".item_pane", this).text();
        if (isDefined(pane) && isDefined(key)) {
            showPane(pane, key);
        }
    });
}

//=================================================================================
// TagCloud
//=================================================================================

var MAX_TAG_LENGTH = 30;
var MIN_CLOUD_FONT_SIZE = 10;
var MED_CLOUD_FONT_SIZE = 16;
var MAX_CLOUD_FONT_SIZE = 26;
var DEFAULT_TAG_COLOR = "#454C45";

function TagCloud(div, list, options) {
	this.div = div;
	this.list = list;
	this.options = options;
	this.accordion = null;
}

TagCloud.prototype.linkTo = function(accordion) {
	this.accordion = accordion;
}

TagCloud.prototype.create = function() {
	var html = '';
	var maxWeight = 1;
	var tagcloud = this;
	$.each(this.list.getKeys(), function(i, key) {
		var itemTag = { tag:tagcloud.getTagText(key), weight:tagcloud.getTagWeight(key) };
		if (itemTag.weight > 0) {
			var tag = itemTag.tag.length <= MAX_TAG_LENGTH ? itemTag.tag : itemTag.tag.substring(0, MAX_TAG_LENGTH) + "&hellip;";
			tag = tag.replace("<", "&lt;").replace(">", "&gt;");
			html += '<a id="tag'+i+'" class="tag" href="#" rel="' + itemTag.weight + '" title="' + itemTag.tag + '">' + tag + '</a>\n';
			if (itemTag.weight > maxWeight) maxWeight = itemTag.weight;
		}
	});
	
	var tagsToDisplay = html != '';
	if (!tagsToDisplay) {
	   html = '<span style="font-size:10pt; color:'+DEFAULT_TAG_COLOR+'">(none)</span>';
	}
	
	if (this.list.getKeys().length > 0) {
        this.div.html('<div class="cloud"><p>'+html+'</p></div>');
	}
	
	if (tagsToDisplay) {
		var maxFont = maxWeight <= 2 ? MED_CLOUD_FONT_SIZE : MAX_CLOUD_FONT_SIZE;
		var colors = this.getColors();
		$("#"+this.div.attr("id")+" a").tagcloud({
			size: {
				start: MIN_CLOUD_FONT_SIZE,
				end: maxFont,
				unit: 'pt'
			},
			color: {
				start: colors.start,
				end: colors.end
			}
		});
		
		if (this.accordion) {
			var accordion = this.accordion;
			$(".tag").click(function() {
				var id = this.id;
				var index = parseInt(id.replace("tag", ""));
				accordion.expandIndex(index);
				return false;
			});
		}
	}	
}

TagCloud.prototype.refresh = function(itemsChanged) {
	// PERFORMANCE: currently entire tag cloud is redrawn whenever it is refreshed
	this.create();
}

TagCloud.prototype.getColors = function() {
	var startColor = isDefined(this.options) && isDefined(this.options.color) && isDefined(this.options.color.start) ? this.options.color.start : DEFAULT_TAG_COLOR;
	var endColor = isDefined(this.options) && isDefined(this.options.color) && isDefined(this.options.color.end) ? this.options.color.end : DEFAULT_TAG_COLOR;
	return { "start": startColor, "end": endColor }
}

TagCloud.prototype.getTagText = function(key) {
	return this.list.getValueForSort(key);
}

TagCloud.prototype.getTagWeight = function(key) {
	return this.list.getCount(key);
}

//=================================================================================
// ActionPane
//=================================================================================

function ActionPane(key, title, options) {
	DataPane.call(this, key, title, options);
}
ActionPane.prototype = Object.create(DataPane.prototype);

ActionPane.prototype.initData = function(taskIdx) {
    DataPane.prototype.initData.call(this, taskIdx);
    $(this.list).on("xp_action_added", { pane: this }, function(event) {
        var pane = event.data.pane;
        if (isCurrentPane(pane)) {
            pane.refresh();
        }
    });
}

ActionPane.prototype.createList = function() {
	return new ActionList();
}

ActionPane.prototype.createAccordion = function(div) {
    return new ActionAccordion(div, this.list);
}

ActionPane.prototype.createTagCloud = function(div) {
	return new ActionCloud(div, this.list);
}

function ActionAccordion(div, list, options) {
    AccordionList.call(this, div, list, options);
}
ActionAccordion.prototype = Object.create(AccordionList.prototype);

ActionAccordion.prototype.itemAsHtml = function(key, itemText, countText, paneKey) {
    var countText = isDefined(countText) ? countText : this.list.getStudentCount(key);
    return AccordionList.prototype.itemAsHtml.call(this, key, itemText, countText, paneKey);
}

//=================================================================================
// ActionCloud
//=================================================================================

function ActionCloud(div, list, options) {
	TagCloud.call(this, div, list, options);
}
ActionCloud.prototype = Object.create(TagCloud.prototype);

ActionCloud.prototype.getTagWeight = function(key) {
	return this.list.getStudentCount(key);
}