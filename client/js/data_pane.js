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
	
// TODO: animation of accordion when jumping from one pane to another has redraw issues sometimes
// TODO: only refresh accordion/tagcloud items as needed (as opposed to refreshed entire controls)

//=================================================================================
// ItemList - used by AccordionList and TagCloud to display items
//=================================================================================

function ItemList(title) {
	this.title = title;
	this.items = {};
	this.keys = [];
	this.sortOptions = ["ABC", "Frequency"];
	this.setSort("ABC");
	this.needToUpdateKeys = true;
}

ItemList.prototype.add = function(data) {
	var item = this.createItem(data);
	var key = item.getKey();
	if (isUndefined(this.items[key])) {
		this.items[key] = [];
	}
	this.items[key].push(item);
	this.needToUpdateKeys = true;
	return [ key ];
}

ItemList.prototype.update = function(data, index) {
	var item = this.createItem(data);
	if (isUndefined(index)) index = 0;
	var key = item.getKey();
	this.items[key][index] = item;
}

ItemList.prototype.createItem = function(data) {
	return new DataItem("key", data);
}

ItemList.prototype.itemHeaderAsHtml = function(key, i) {
    return '<span style="font-size:1em;">' + key + ' (' + this.getCount(key) + ')</span>';
}

ItemList.prototype.itemAsHtml = function(key, i) {
	return key + ' (' + this.getCount(key) + ')';
}

ItemList.prototype.isListData = function(data, taskIdx) {
	return false;
}

ItemList.prototype.getKeys = function() {
	if (this.needToUpdateKeys) {
		this.sortKeys();
	}
	this.needToUpdateKeys = false;
	return this.keys;
}

ItemList.prototype.getValue = function(key, property, index) {
	if (isUndefined(index)) index = 0;
	return this.items[key][index].getValue(property);
}

ItemList.prototype.getCount = function(key) {
	return isDefined(key) ? this.items[key].length : this.getKeys().length;
}

ItemList.prototype.contains = function(key) {
	return isDefined(this.items[key]);
}

ItemList.prototype.setSort = function(type) {
	this.needToUpdateKeys = (isUndefined(this.sortType)) || this.sortType != type;
	this.sortType = type;
}

ItemList.prototype.getSort = function() {
	return this.sortType;
}

ItemList.prototype.getSortOptions = function() {
	return this.sortOptions;
}

ItemList.prototype.isSortType = function(type) {
	return this.sortType == type;
}

ItemList.prototype.sortKeys = function() {
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

ItemList.prototype.sortKeysAlphabetically = function() {
	var list = this;
	this.keys.sort(function(a,b) {	
		// case insensitive sort
		var aValue = list.getSortValue(a).toLowerCase();
		var bValue = list.getSortValue(b).toLowerCase();
		return (aValue > bValue ? 1 : (aValue < bValue ? -1 : 0));
	});
}

ItemList.prototype.sortKeysByFrequency = function() {	
	var items = this;
	this.keys.sort(function(a,b) {
		var aCount = items.getCount(a);
		var bCount = items.getCount(b);
		var result = (aCount > bCount ? -1 : (aCount < bCount ? 1 : 0));
		if (result===0) {
			var aValue = items.getSortValue(a).toLowerCase();
			var bValue = items.getSortValue(b).toLowerCase();
			result = (aValue > bValue ? 1 : (aValue < bValue ? -1 : 0));
		}
		return result;
	});
}

ItemList.prototype.getSortValue = function(key) {
	return key;
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
// Data Pane
//=================================================================================

function DataPane(key, title, options) {
	this.key = key;
	this.title = title;
	this.options = options;

	this.items = null;
	this.accordion = null;
	this.tagcloud = null;
	this.taskIdx = 0;
}

DataPane.prototype.createAccordion = function(div) {
	return new AccordionList(div, this.items);
}

DataPane.prototype.createTagCloud = function(div) {
	return new TagCloud(div, this.items);
}

DataPane.prototype.createItems = function() {
    return new ItemList();
}

DataPane.prototype.initData = function(taskIdx) {
	this.taskIdx = taskIdx;
	this.items = this.createItems();
}

DataPane.prototype.updateData = function(data, taskIdx) {
}

DataPane.prototype.create = function(div) {
    var html = '<h3 id="pane_title" style="margin-bottom:10px">'+this.title+'</h3>';
    html += '<div id="tag_cloud" class="tag_cloud"></div>';
    html += '<div id="data_list"></div>';
    div.html(html);
    
    this.accordion = this.createAccordion($("#data_list"));
    this.accordion.create();

    if (isDefined(this.options) && isDefined(this.options.showTagCloud) && this.options.showTagCloud) {
        this.tagcloud = this.createTagCloud($("#tag_cloud"));
    	this.tagcloud.linkTo(this.accordion);
    	this.tagcloud.create();
    }
}

DataPane.prototype.refresh = function(data) {
	// TODO: only refresh changed items; refresh data in open accordion section if needed
	if (isUndefined(data) || this.isPaneData(data)) {
		this.accordion.create();
		if (this.tagcloud) {
			this.tagcloud.create();
		}
	}
	
	// update open accordion section, if any
	this.accordion.updateActiveDetails();
}

DataPane.prototype.resize = function() {
}

DataPane.prototype.getKey = function() {
	return this.key;
}

DataPane.prototype.getCount = function() {
	return this.items ? this.items.getCount() : -1;
}

DataPane.prototype.isPaneData = function(data) {
	return this.items && this.items.isListData(data, this.taskIdx);
}

//=================================================================================
// AccordionList
//=================================================================================

function AccordionList(div, items) {
	this.div = div;
	this.items = items;
	this.activeIndex = false;
	this.activeKey = null;
}

AccordionList.prototype.create = function() {
	var html = '';
	var keys = this.items.getKeys();
	if (keys.length==0) {
		html = '<div style="margin-bottom:15px;">(none)</div>';
		this.div.html(html);
	}
	else {
		// sort options
		var sortOptions = this.items.getSortOptions();
		if (sortOptions.length > 1) {
			html += '<span style="margin-right:10px;">';
			html += 'Sort by: ';
			for (var i=0; i<sortOptions.length; i++) {
				var option = sortOptions[i];
				html += this.items.isSortType(option) ? '<strong>'+option + '</strong> ' : '<a href="#" class="sort">'+option+'</a> ';
			}
			html += '</span>';
		}
		
		// accordion list
		// Note: selecting on #accordion_list assumes that only one AccordionList exists on page
		html += '<div id="accordion_list" class="accordion2">';
		for (var i=0; i<keys.length; i++) {
			var key = keys[i];
			html += '<div id="item'+(i+1)+'" class="accordion_section"><a href="#"><span class="text_key">'+key+'</span>'+this.items.itemHeaderAsHtml(key, i)+'</a></div>';		
			html += '<div id="item'+(i+1)+'_expanded"></div>';
		}
		html += '</div>';
		this.div.html(html);
						
		this.activeIndex = this.getSelectedIndex();
		$('#accordion_list').data("accordionList", this);
		$('#accordion_list').accordion({
			collapsible: true, 
			active: this.activeIndex,
			changestart: function(event, control) {
				var accordion = $("#accordion_list").data("accordionList");
				accordion.activeIndex = control.options.active;
				accordion.updateActiveDetails();
			}
		});
		
		this.updateActiveDetails();
		
		$('.sort').click(function(event) {
			var accordion = $("#accordion_list").data("accordionList");
			accordion.items.setSort($(this).html());
			accordion.create();
			return false;
		});		
	}
}

AccordionList.prototype.updateActiveDetails = function() {
	if (this.activeIndex !== false) {
		var selectedItem = $(".accordion_section:eq("+this.activeIndex+")");
		this.activeKey = $(".text_key", selectedItem).html();
		if (this.activeKey) {
			var div = $("#item"+(this.activeIndex+1)+"_expanded");
			this.updateItemDetails(div, this.activeKey, this.activeIndex);	
		}
	}
}

AccordionList.prototype.updateItemDetails = function(div, key, i) {
	var html = this.itemDetailsAsHtml(key, i);
	$(div).html(html);
}

AccordionList.prototype.itemDetailsAsHtml = function(key, i) {
	return "";
}

AccordionList.prototype.getSelectedIndex = function() {
	var selectedIndex = false;
	if (this.activeKey!=null) {
		for (var i=0; i<this.items.keys.length; i++) {
			if (this.activeKey == this.items.keys[i]) {
				selectedIndex = i;
				break;
			}
		}
	}
	return selectedIndex;
}

AccordionList.prototype.openIndex = function(i) {
	$("#accordion_list").accordion({ active:i });
}

AccordionList.prototype.openItem = function(key) {
	var keys = this.items.getKeys();
	for (var i=0; i<keys.length; i++) {
		if (keys[i] == key) {
			this.activeIndex = i;
			this.activeKey = key;
			this.openIndex(i);
			break;
		}
	}
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
	var items = this.items;
	$.each(items.getKeys(), function(i, key) {
		var itemTag = { tag:items.getSortValue(key), weight:items.getCount(key) };
		if (itemTag.weight > 0) {
			var tag = itemTag.tag.length <= MAX_TAG_LENGTH ? itemTag.tag : itemTag.tag.substring(0, MAX_TAG_LENGTH) + "&hellip;";
			tag = tag.replace("<", "&lt;").replace(">", "&gt;");
			html += '<a id="tag'+i+'" class="tag" href="#" rel="'+itemTag.weight+'" title="'+itemTag.tag+'">'+tag+'</a>\n';
			if (itemTag.weight > maxWeight) maxWeight = itemTag.weight;
		}
	});
	
	if (html != '') {
		html = '<div class="cloud"><p>'+html+'</p></div>';
		var maxFont = maxWeight <= 2 ? MED_CLOUD_FONT_SIZE : MAX_CLOUD_FONT_SIZE;
		var startColor = isDefined(this.options) && isDefined(this.options.color) && isDefined(this.options.color.start) ? this.options.color.start : DEFAULT_TAG_COLOR;
		var endColor = isDefined(this.options) && isDefined(this.options.color) && isDefined(this.options.color.end) ? this.options.color.end : DEFAULT_TAG_COLOR;
		this.div.html(html);
		$("#"+this.div.attr("id")+" a").tagcloud({
			size: {
				start: MIN_CLOUD_FONT_SIZE,
				end: maxFont,
				unit: 'pt'
			},
			color: {
				start: startColor,
				end: endColor
			}
		});
		
		if (this.accordion) {
			var accordion = this.accordion;
			$(".tag").click(function() {
				var id = this.id;
				var index = parseInt(id.replace("tag", ""));
				accordion.openIndex(index);
				return false;
			});
		}
	}
}

//=================================================================================
// Action Pane
//=================================================================================

function ActionPane(key, title, actionTypes, options) {
	DataPane.call(this, key, title, options);
	this.actionTypes = actionTypes;
	this.expandedItems = {};
}
ActionPane.prototype = Object.create(DataPane.prototype);

ActionPane.prototype.createAccordion = function(div) {
	return new ActionAccordion(div, this.items, this.expandedItems)
}

ActionPane.prototype.createItems = function() {
	return new ActionList();
}

ActionPane.prototype.createExpandedItems = function() {
	return [];
}

ActionPane.prototype.initData = function(taskIdx) {
	DataPane.prototype.initData.call(this, taskIdx);
	var taskHistory = gTaskHistories[taskIdx];
	for (var i=0; i<taskHistory.length; i++) {
		var action = taskHistory[i];	
		this.updateData(action, taskIdx);
	}  
}

ActionPane.prototype.updateData = function(action, taskIdx) {
	if (this.items.isListData(action, taskIdx)) {
		var keys = this.items.add(action);
		for (var j=0; j<keys.length; j++) {
			var key = keys[j];
			if (isUndefined(this.expandedItems[key])) {
				this.expandedItems[key] = this.createExpandedItems();
			}
		}
	}
	
	if (isDefined(action.action_data[this.items.keyProperty])) {
		var keys = this.items.getActionKeys(action);
		for (var j=0; j<keys.length; j++) {
			var key = keys[j];
			for (var k=0; k<this.expandedItems[key].length; k++) {
				var expandedItems = this.expandedItems[key][k];
				if (expandedItems.isListData(action, taskIdx)) {
					expandedItems.add(action);
				}
			}
		}
	}
}

function ActionAccordion(div, items, expandedItems) {
	AccordionList.call(this, div, items);
	this.expandedItems = expandedItems;
}
ActionAccordion.prototype = Object.create(AccordionList.prototype);

ActionAccordion.prototype.itemDetailsAsHtml = function(key, i) {
	var html = "";
	var items = this.expandedItems[key];
	if (isDefined(items)) {
		for (var i=0; i<items.length; i++) {
			var keys = items[i].getKeys();
			html += "<h5>"+items[i].title+"</h5>";
			html += '<ol class="detail_list">';
			if (keys.length == 0) {
				html += '<li class="detail_item">(none)</li>';
			}
			else {
				items[i].sortKeys();
				var keys = items[i].getKeys();				
				for (var j=0; j<keys.length; j++) {
					var itemKey = keys[j];
					html += '<li class="detail_item">';
					html += items[i].itemAsHtml(itemKey, j);
					html += '</li>';
				}
			}
			html += "</ol>";
		}
	}
	return html;
}

ActionAccordion.prototype.updateItemDetails = function(div, key, i) {
	AccordionList.prototype.updateItemDetails.call(this, div, key, i);
	var items = this.expandedItems[key];
	if (isDefined(items)) {
		for (var i=0; i<items.length; i++) {
			items[i].registerItemCallbacks();
		}
	}
}

function ActionList(title, actionTypes, keyProperty) {
	ItemList.call(this, title);
	this.actionTypes = actionTypes;
	this.keyProperty = keyProperty;
}
ActionList.prototype = Object.create(ItemList.prototype);

ActionList.prototype.createItem = function(action) {
	var key = this.getActionKeys(action);
	return new DataItem(key[0], action);    
}

ActionList.prototype.registerItemCallbacks = function() {	
}

ActionList.prototype.getAction = function(key) {
	return isDefined(key) && isDefined(this.items[key][0]) ? this.items[key][0].getData() : null;
}

ActionList.prototype.getActionKeys = function(action) {
	var key = action.action_description;
	if (isDefined(this.keyProperty)) {
		key = action.action_data[this.keyProperty];
		if (isUndefined(key)) {
			key = action[this.keyProperty];
		}
	}
	return [ key ];
}

ActionList.prototype.isListData = function(action, taskIdx) {
	return isDefined(action) && action.task_idx==taskIdx && $.inArray(action.action_type, this.actionTypes) > -1;
}