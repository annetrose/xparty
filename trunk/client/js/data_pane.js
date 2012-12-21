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
	
// TODO: refresh accordion/tagcloud more efficiently

//=================================================================================
// DataList - used by DataPane to display UI objects
//=================================================================================

function DataList(title, keyProperty) {
	this.title = title;
	this.keyProperty = keyProperty;
	this.keys = [];
	this.items = {};
	this.setFilters([]);
	this.setSortOptions(["ABC", "Frequency"]);
	this.needToUpdateKeys = true;
	this.defaultPane = undefined;
}

DataList.prototype.isItemData = function(data, taskIdx) {
	// returns whether or not data should be added to this.items
	return false;
}

DataList.prototype.createItems = function(data) {
	var key = data[this.keyProperty];
	return isDefined(key) ? [ new DataItem(key, data) ] : [];
}

DataList.prototype.addItems = function(data) {
	var items = this.createItems(data);
	for (var i=0; i<items.length; i++) {
		var item = items[i];
		var key = item.getKey();
		if (isUndefined(this.items[key])) {
			this.items[key] = [];
		}
		this.items[key].push(item);
	}
	this.needToUpdateKeys = true;
	return items;
}

DataList.prototype.updateItems = function(data, index) {
	var items = this.createItems(data);
	for (var i=0; i<items.length; i++) {
		var item = items[i];
		if (isUndefined(index)) index = 0;
		var key = item.getKey();
		this.items[key][index] = item;
	}
}

DataList.prototype.itemAsHtml = function(key, itemText, countText, pane) {
	// returns html for displaying the items grouped by the same key (e.g., this.items[key])
	//
	// Format: item (count)
	// item = itemText if defined; otherwise key; it is a link to another pane if pane is defined
	// count = countText if defined; otherwise key count; not displayed if countText=""
	//
	var itemText = isDefined(itemText) ? itemText : key;
	var countText = isDefined(countText) ? countText : this.getCount(key);
	var pane = isDefined(pane) ? pane : (isDefined(this.defaultPane) && gCurrentPane != this.defaultPane ? this.defaultPane : undefined);
	var html = isDefined(pane) ? '<a href="#" class="item_link">' : "";
	html += itemText;
	html += '<span class="item_key">' + key + '</span>';
	html += isDefined(pane) ? '<span class="item_pane">'+pane+'</span></a>' : "";
	html += isDefined(countText) && countText != "" ? ' (' + countText + ')' : "";
	return html;
}

DataList.prototype.registerItemCallbacks = function() {
	$(".item_link").click(function() {
		var key = $(".item_key", this).html();
		var pane = $(".item_pane", this).html();
		if (isDefined(pane) && isDefined(key)) {
			showPane(pane, key);
		}
	});
}

DataList.prototype.getKeys = function() {
	if (this.needToUpdateKeys) {
		this.sortKeys();
	}
	this.needToUpdateKeys = false;
	return this.keys;
}

DataList.prototype.getValue = function(key, property, index) {
	if (isUndefined(index)) index = 0;
	return this.items[key][index].getValue(property);
}

DataList.prototype.getValueForSort = function(key) {
	// items are sorted by their key by default
	return key;
}

DataList.prototype.getCount = function(key) {
	return isDefined(key) ? this.items[key].length : this.getKeys().length;
}

DataList.prototype.setDefaults = function() {
	this.setFilter(this.defaultFilter);
	this.setSortOption(this.defaultSortType);
}

DataList.prototype.getFilters = function() {
	return this.filters;
}

DataList.prototype.setFilters = function(filters) {
	this.filters = filters;
	this.filter = filters.length > 0 ? filters[0] : undefined;
	this.defaultFilter = this.filter;
}

DataList.prototype.getFilter = function() {
	return this.filter;
}

DataList.prototype.setFilter = function(filter) {
	this.filter = filter;
}

DataList.prototype.isCurrentFilter = function(filter) {
	return isDefined(this.filter) && this.filter == filter;
}

DataList.prototype.getSortOptions = function() {
	return this.sortOptions;
}

DataList.prototype.setSortOptions = function(options) {
	this.sortOptions = options;
	this.sortType = options.length > 0 ? options[0] : undefined;
	this.defaultSortType = this.sortType;
}

DataList.prototype.getSortOption = function() {
	return this.sortType;
}

DataList.prototype.setSortOption = function(type) {
	this.needToUpdateKeys = (isUndefined(this.sortType)) || this.sortType != type;
	this.sortType = type;
}

DataList.prototype.isCurrentSortOption = function(type) {
	return this.sortType == type;
}

DataList.prototype.sortKeys = function() {
	this.keys = [];
	for (key in this.items) {
		this.keys.push(key);
	}
	
	if (this.sortType == "Frequency") {
		this.sortKeysByFrequency();
	}
	else if (this.sortType == "ABC") {
		this.sortKeysAlphabetically();
	}
}

DataList.prototype.sortKeysAlphabetically = function() {
	// case insensitive sort
	var list = this;
	this.keys.sort(function(a,b) {	
		var aValue = list.getValueForSort(a).toLowerCase();
		var bValue = list.getValueForSort(b).toLowerCase();
		return (aValue > bValue ? 1 : (aValue < bValue ? -1 : 0));
	});
}

DataList.prototype.sortKeysByFrequency = function() {	
	var items = this;
	this.keys.sort(function(a,b) {
		var aCount = items.getCount(a);
		var bCount = items.getCount(b);
		var result = (aCount > bCount ? -1 : (aCount < bCount ? 1 : 0));
		if (result===0) {
			var aValue = items.getValueForSort(a).toLowerCase();
			var bValue = items.getValueForSort(b).toLowerCase();
			result = (aValue > bValue ? 1 : (aValue < bValue ? -1 : 0));
		}
		return result;
	});
}

DataList.prototype.contains = function(key) {
	return isDefined(this.items[key]);
}

DataList.prototype.indexOf = function(key) {
	var index = -1;
	for (var i=0; i<this.keys.length; i++) {
		if (this.keys[i] == key) {
			index = i;
			break;
		}
	}
	return index;
}

//=================================================================================
// DataItem
//=================================================================================

function DataItem(key, data) {
	this.key = key;
	this.data = data;
}

DataItem.prototype.getKey = function() {
	return this.key;
}

DataItem.prototype.getData = function() {
	return this.data;
}

DataItem.prototype.getValue = function(property) {
	return this.data[property];
}

//=================================================================================
// DataPane - displays data in AccordionList and optional TagCloud
//=================================================================================

function DataPane(key, title, options) {
	this.key = key;
	this.title = title;
	this.options = options;

	this.items = null;
	this.expandedItems = {};
	this.accordion = null;
	this.tagcloud = null;
	this.taskIdx = 0;
	this.itemsChanged = [];
}

DataPane.prototype.isPaneData = function(data) {
	return this.items && this.items.isItemData(data, this.taskIdx);
}

DataPane.prototype.createItems = function() {
    return new DataList();
}

DataPane.prototype.createExpandedItems = function() {
	// items shown in expanded accordion view (array of DataList)
	return [];
}

DataPane.prototype.createAccordion = function(div) {
	return new AccordionList(div, this.items, this.expandedItems);
}

DataPane.prototype.createTagCloud = function(div) {
	return new TagCloud(div, this.items);
}

DataPane.prototype.create = function(div) {
    var html = '<h3 id="pane_title" style="margin-bottom:10px">'+this.title+'</h3>';
    html += '<div id="filters"></div>';
    html += '<div id="tag_cloud" class="tag_cloud"></div>';
    html += '<div id="sort_options"></div>';
    html += '<div id="accordion_list" class="accordion2"></div>';
    div.html(html);

	this.items.setDefaults();
	
    this.accordion = this.createAccordion($("#accordion_list"));
    this.accordion.create();

    if (isDefined(this.options) && isDefined(this.options.showTagCloud) && this.options.showTagCloud) {
        this.tagcloud = this.createTagCloud($("#tag_cloud"));
    	this.tagcloud.linkTo(this.accordion);
    	this.tagcloud.create();
    } 
    
    this.createControls();
}

DataPane.prototype.createControls = function() {
	if (this.items.getKeys().length > 0) {
		this.createSortOptions();
		this.createFilters();
	}
}

DataPane.prototype.createSortOptions = function() {
	var html = "";
	var sortOptions = this.items.getSortOptions();
	if (sortOptions.length > 1) {
		html += '<span style="margin-right:10px;">';
		html += 'Sort by: ';
		for (var i=0; i<sortOptions.length; i++) {
			var option = sortOptions[i];
			html += this.items.isCurrentSortOption(option) ? '<strong>'+option + '</strong> ' : '<a href="#" class="sort">'+option+'</a> ';
		}
		html += '</span>';
	}
	$("#sort_options").html(html);
	
	var pane = this;
	$('.sort').click(function(event) {
		// sorts the accordion and the tag cloud
		pane.items.setSortOption($(this).html());
		pane.refresh();
		return false;
	});
}

DataPane.prototype.createFilters = function() {
	var html = "";
	var filters = this.items.getFilters();
	if (filters.length > 1) {
		html += '<span style="margin-right:10px;">';
		html += 'Show: ';
		for (var i=0; i<filters.length; i++) {
			var filter = filters[i];
			html += this.items.isCurrentFilter(filter) ? '<strong>'+filter+'</strong> ' : '<a href="#" class="filter">'+filter+'</a> ';
		}
		html += '</span>';
	}
	$("#filters").html(html);
	
	var pane = this;
	$('.filter').click(function(event) {
		// currently only filters the values in the tag cloud
		pane.items.setFilter($(this).html());
		pane.refresh();
		return false;
	});
}

DataPane.prototype.refresh = function(data) {
	// true if data belongs to pane (recently added) -or- if data is undefined (sort/filter performed)
	var refreshAll = this.isPaneData(data) || isUndefined(data);
	if (refreshAll) this.itemsChanged = [];
	
	// true if any items have changed
	var refreshPartial = this.itemsChanged.length > 0;
		
	// refresh controls, accordion, and tagcloud
	if (refreshAll || refreshPartial) {
		if (refreshAll) this.createControls();
		this.accordion.refresh(this.itemsChanged);
		if (this.tagcloud) {
			this.tagcloud.refresh(this.itemsChanged);
		}
		this.itemsChanged = [];
	}

	// always refresh expanded accordion item, if any
	// PERFORMANCE: simplest to always refresh, but only need to if data displayed has changed
	this.accordion.refreshExpanded();
}

DataPane.prototype.resize = function() {
}

DataPane.prototype.initData = function(taskIdx) {
	this.taskIdx = taskIdx;
	this.items = this.createItems();
}

DataPane.prototype.updateData = function(data, taskIdx) {
	if (this.items.isItemData(data, taskIdx)) {
		var items = this.items.addItems(data);
		for (var i=0; i<items.length; i++) {
			var item = items[i];
			var key = item.getKey();
			if (isUndefined(this.expandedItems[key])) {
				this.expandedItems[key] = this.createExpandedItems();
			}
		}
	}
	
	var items = this.items.createItems(data);
	for (var i=0; i<items.length; i++) {
		var key = items[i].getKey();
		if (isDefined(this.expandedItems[key])) {
			for (var j=0; j<this.expandedItems[key].length; j++) {
				var expandedItems = this.expandedItems[key][j];
				if (expandedItems.isItemData(data, taskIdx)) {
					expandedItems.addItems(data);
				}
			}
		}
	}	
}

DataPane.prototype.setItemsChanged = function(itemKeys) {
	this.itemsChanged = itemKeys;
}

DataPane.prototype.getKey = function() {
	return this.key;
}

DataPane.prototype.getCount = function() {
	return this.items ? this.items.getCount() : -1;
}

//=================================================================================
// AccordionList
//=================================================================================

function AccordionList(div, items, expandedItems) {
	this.div = div;
	this.items = items;
	this.expandedItems = isDefined(expandedItems) ? expandedItems : {};
	this.expandedIndex = false;
	this.expandedKey = null;
}

AccordionList.prototype.create = function() {	
	var keys = this.items.getKeys();	
	if (keys.length == 0) {
		this.div.html('<div style="margin-bottom:15px;">(none)</div>');
	}
	
	else {
		var html = "";
		for (var i=0; i<keys.length; i++) {
			var key = keys[i];
			html += '<div id="item'+(i+1)+'" class="accordion_section"><a href="#"><span id="itemheader'+(i+1)+'">'+this.items.itemAsHtml(key)+'</span></a></div>';		
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

AccordionList.prototype.expandedAsHtml = function(key, i) {
	var html = "";
	var items = this.expandedItems[key];
	if (isDefined(items)) {
		for (var i=0; i<items.length; i++) {
			var keys = items[i].getKeys();
			html += "<h5>" + items[i].title + "</h5>";
			html += '<ol class="expanded_list">';
			if (keys.length == 0) {
				html += '<li class="expanded_item">(none)</li>';
			}
			else {
				items[i].sortKeys();
				var keys = items[i].getKeys();				
				for (var j=0; j<keys.length; j++) {
					var itemKey = keys[j];
					html += '<li class="expanded_item">';
					html += items[i].itemAsHtml(itemKey);
					html += '</li>';
				}
			}
			html += "</ol>";
		}
	}
	return html;
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

AccordionList.prototype.refreshItem = function(key) {
	// refresh header and expanded section (if open) for item
	var index = this.items.indexOf(key);
	if (index != -1) {
		$("#itemheader"+(index+1)).html(this.items.itemAsHtml(key));
		if (this.expandedIndex == index) {
			this.refreshExpanded();
		}
	}
}

AccordionList.prototype.refreshExpanded = function() {
	if (this.expandedIndex !== false) {
		var selectedItem = $(".accordion_section:eq("+this.expandedIndex+")");
		this.expandedKey = $(".item_key", selectedItem).html();
		if (this.expandedKey) {
			var div = $("#item"+(this.expandedIndex+1)+"_expanded");
			var html = this.expandedAsHtml(this.expandedKey, this.expandedIndex);
			$(div).html(html);
			this.items.registerItemCallbacks();
		}
	}
	else {
		this.expandedKey = null;
	}
}

AccordionList.prototype.expandIndex = function(i) {
	this.div.accordion({ active:i });
}

AccordionList.prototype.expandItem = function(key) {
	var keys = this.items.getKeys();
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
		for (var i=0; i<this.items.keys.length; i++) {
			if (this.expandedKey == this.items.keys[i]) {
				selectedIndex = i;
				break;
			}
		}
	}
	return selectedIndex;
}

//=================================================================================
// Tag Cloud
//=================================================================================

var MAX_TAG_LENGTH = 30;
var MIN_CLOUD_FONT_SIZE = 10;
var MED_CLOUD_FONT_SIZE = 16;
var MAX_CLOUD_FONT_SIZE = 26;
var DEFAULT_TAG_COLOR = "#454C45";

function TagCloud(div, items, options) {
	this.div = div;
	this.items = items;
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
	$.each(this.items.getKeys(), function(i, key) {
		var itemTag = { tag:tagcloud.getTagText(key), weight:tagcloud.getTagWeight(key) };
		if (itemTag.weight > 0) {
			var tag = itemTag.tag.length <= MAX_TAG_LENGTH ? itemTag.tag : itemTag.tag.substring(0, MAX_TAG_LENGTH) + "&hellip;";
			tag = tag.replace("<", "&lt;").replace(">", "&gt;");
			html += '<a id="tag'+i+'" class="tag" href="#" rel="' + itemTag.weight + '" title="' + itemTag.tag + '">' + tag + '</a>\n';
			if (itemTag.weight > maxWeight) maxWeight = itemTag.weight;
		}
	});
	
	if (html != '') {
		this.div.html('<div class="cloud"><p>'+html+'</p></div>');
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
	else if (this.items.getKeys().length > 0) {
		html = '<div class="cloud"><p><span style="font-size:10pt; color:'+DEFAULT_TAG_COLOR+'">(none)</span></p></div>';
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
	return this.items.getValueForSort(key);
}

TagCloud.prototype.getTagWeight = function(key) {
	return this.items.getCount(key);
}

//=================================================================================
// Action Pane
//=================================================================================

function ActionPane(key, title, actionTypes, options) {
	DataPane.call(this, key, title, options);
	this.actionTypes = actionTypes;
}
ActionPane.prototype = Object.create(DataPane.prototype);

ActionPane.prototype.createItems = function() {
	return new ActionList();
}

ActionPane.prototype.createTagCloud = function(div) {
	return new ActionCloud(div, this.items);
}

ActionPane.prototype.initData = function(taskIdx) {
	DataPane.prototype.initData.call(this, taskIdx);
	var taskHistory = gTaskHistories[taskIdx];
	for (var i=0; i<taskHistory.length; i++) {
		var action = taskHistory[i];	
		this.updateData(action, taskIdx);
	}	
}

function ActionCloud(div, items, options) {
	TagCloud.call(this, div, items, options);
}
ActionCloud.prototype = Object.create(TagCloud.prototype);

ActionCloud.prototype.getTagWeight = function(key) {
	return this.items.getStudentCount(key);
}

function ActionList(title, keyProperty, actionTypes) {
	DataList.call(this, title, keyProperty);
	this.actionTypes = actionTypes;
}
ActionList.prototype = Object.create(DataList.prototype);

ActionList.prototype.createItems = function(action) {
	var key = action.action_description;
	if (isDefined(this.keyProperty)) {
		key = action.action_data[this.keyProperty];
		if (isUndefined(key)) {
			key = action[this.keyProperty];
		}
	}
	return isDefined(key) ? [ new DataItem(key, action) ] : [];
}

ActionList.prototype.isItemData = function(action, taskIdx) {
	return isDefined(action) && action.task_idx==taskIdx && $.inArray(action.action_type, this.actionTypes) > -1;
}

ActionList.prototype.itemAsHtml = function(key, itemText, countText, pane) {
	var countText = isDefined(countText) ? countText : this.getStudentCount(key);
	return DataList.prototype.itemAsHtml.call(this, key, itemText, countText, pane);
}

ActionList.prototype.getActions = function(key) {
	var actions = [];
	for (var i=0; i<this.items[key].length; i++) {
		actions[i] = this.items[key][i].getData();
	}
	return actions;
}

ActionList.prototype.getAction = function(key, i) {
	var i = isDefined(i) ? i : 0;
	return isDefined(key) && isDefined(this.items[key][i]) ? this.items[key][i].getData() : null;
}

ActionList.prototype.getStudentCount = function(key) {
	var count = 0;
	var counts = {};
	for (var i=0; i<this.items[key].length; i++) {
		var action = this.getAction(key, i);
		var studentNickname = action.student_nickname;
		if (isUndefined(counts[studentNickname])) {
			counts[studentNickname] = action;
			count++;
		}
	}
	return count;
}

ActionList.prototype.sortKeysByFrequency = function() {	
	var items = this;
	this.keys.sort(function(a,b) {
		var aCount = items.getStudentCount(a);
		var bCount = items.getStudentCount(b);
		var result = (aCount > bCount ? -1 : (aCount < bCount ? 1 : 0));
		if (result===0) {
			var aValue = items.getValueForSort(a).toLowerCase();
			var bValue = items.getValueForSort(b).toLowerCase();
			result = (aValue > bValue ? 1 : (aValue < bValue ? -1 : 0));
		}
		return result;
	});
}