/*
# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn -- www.alexquinn.org
#          Anne Rose -- www.cs.umd.edu/hcil/members/arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created October 2012
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

// For info on JavaScript OOP, see:
// http://www.javascriptkit.com/javatutors/oopjs.shtml   (new and this)
// http://www.javascriptkit.com/javatutors/oopjs2.shtml  (constructors)
// http://www.javascriptkit.com/javatutors/oopjs3.shtml  (inheritance)

//=================================================================================
// Data Pane
//=================================================================================

// pane.key (required)
// pane.action_type (required)
// pane.title (required)
// pane.accumulatorClassName
// pane.addDataFunction
// pane.accordionClassName
// pane.tagCloudClassName
// pane.showTagCloud
// pane.accumulator (set in initDataPanes)
// pane.accordion (set in showDataPane)
// pane.tagcloud (set in showDataPane)

var gPanesForActionType = {};

function initPaneData(taskIdx) {
	gPanesForActionType = {};
	for (var i=0; i<gDataPanes.length; i++) {
		var pane = getPane(gDataPanes[i].key);
		pane.accumulator = isDefined(pane.accumulatorClassName) ? new this[pane.accumulatorClassName]() : null;
		if (isDefined(pane.action_type)) {
			if (isUndefined(gPanesForActionType[pane.action_type])) {
				gPanesForActionType[pane.action_type] = [];
			}
			gPanesForActionType[pane.action_type].push(pane);
		}
	}
	
	taskIdx = isUndefined(taskIdx) ? 0 : taskIdx;
    var taskHistory = gTaskHistories[taskIdx];
    for (var i=0; i<taskHistory.length; i++) {
        var action = taskHistory[i];
        var panes = gPanesForActionType[action.action_type];
        if (isDefined(panes)) {
        	for (var j=0;j<panes.length; j++) {
        		var pane = panes[j];
        		this[pane.addDataFunction](pane.accumulator, action);
        	}
        }
    }
}

function loadDataPane(paneKey, div) {
    var pane = getPane(paneKey);       
    var html = '<h3 id="pane_title" style="margin-bottom:10px">'+pane.title+'</h3>';
    html += '<div id="tag_cloud" class="tag_cloud"></div>';
    html += '<div id="data_list"></div>';
    div.html(html);
    
    pane.accordion = new this[pane.accordionClassName]($("#data_list"), pane.accumulator);
    pane.accordion.show();

    pane.tagcloud = null;
    if (pane.showTagCloud) {
    	pane.tagcloud = new this[pane.tagCloudClassName]($("#tag_cloud"), pane.accumulator);
    	pane.tagcloud.linkTo(pane.accordion);
    	pane.tagcloud.show();
    }
}

function updateDataPane(paneKey, action) {
	// check if action is for current task, if so, update pane data
	var taskIdx = isDefined(action) ? action.action_data.task_idx : -1;
	if (taskIdx == selectedTaskIdx()) {	
		var panes = gPanesForActionType[action.action_type];
		if (isDefined(panes)) {
			for (var i=0;i<panes.length; i++) {
				var pane = panes[i];
				this[pane.addDataFunction](pane.accumulator, action);
			}
		}
	}

	// if sort or filter (e.g., action is not defined), redraw pane 
	// if action is for current task and same type as pane, redraw pane
	var pane = getPane(paneKey);
	if (isUndefined(action) || (taskIdx == selectedTaskIdx() && pane.action_type == action.action_type)) {
		pane.accordion.show();
		if (pane.tagcloud) pane.tagcloud.show();
	}
}

function getExpandedData(title, dict, linkClass) {
    var html = "<h5>"+title+"</h5>";
    html += "<ol>";
    var keys = sortKeysAlphabetically(dict);
    for (var i=0; i<keys.length; i++) {
        var key = keys[i];
        var count = dict[key].length;
        html += '<li class="data_display_item">';
        html += typeof(linkClass) != "undefined" ? '<a class="'+linkClass+'" href="#">'+key+'</a>' : key;
        html += count > 1 ? " ("+count+")" : "";
        html += '</li>\n';
    }
    html += "</ol>";
    return html;
}

function addActionItem(accumulator, action) {
    var item = DataItem(action.action_description, action);    
    accumulator.add(item);
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
// DataAccumulator
//=================================================================================

function DataAccumulator() {
	this.dict = {};
	this.keys = [];
	this.sortOptions = ["ABC", "Frequency"];
	this.setSortType("ABC");
	this.needToUpdateKeys = true;
}

DataAccumulator.prototype.add = function(item) {	
	var key = item.getKey();
	if (typeof(this.dict[key]) == "undefined") {
		this.dict[key] = [];
	}
	this.dict[key].push(item);
	this.needToUpdateKeys = true;
}

DataAccumulator.prototype.update = function(item, index) {
	if (typeof(index) == "undefined") index = 0;
	var key = item.getKey();
	this.dict[key][index] = item;
}

DataAccumulator.prototype.keyExists = function(item) {
	var key = item.getKey();
	return typeof(this.dict[key]) != "undefined";
}

DataAccumulator.prototype.getKeys = function() {
	if (this.needToUpdateKeys) {
		this.sortKeys();
	}
	this.needToUpdateKeys = false;
	return this.keys;
}

DataAccumulator.prototype.getKeyCount = function() {
	return this.getKeys().length;
}

DataAccumulator.prototype.getItemsForKey = function(key, groupBy) {
	var itemDict = {};
	var items = this.dict[key];
	for (var i=0; i<items.length; i++) {
		var data = items[i].getData();
		var groupKey = data[groupBy];
		if (typeof(itemDict[groupKey]) == "undefined") {
			itemDict[groupKey] = [];
		}
		itemDict[groupKey].push(data);
	}
	return itemDict;
}

DataAccumulator.prototype.getCountForKey = function(key) {
	return this.dict[key].length;
}

DataAccumulator.prototype.getValue = function(key, property, index) {
	if (typeof(index) == "undefined") index = 0;
	return this.dict[key][index].getValue(property);
}

DataAccumulator.prototype.setSortType = function(type) {
	this.needToUpdateKeys = (typeof(this.sortType) == "undefined") || this.sortType != type;
	this.sortType = type;
}

DataAccumulator.prototype.getSortValue = function(key) {
	return key;
}

DataAccumulator.prototype.sortKeys = function() {
	this.keys = [];
	for (key in this.dict) {
		this.keys.push(key);
	}
	
	if (this.sortType == "Frequency") {
		this.sortKeysByFrequency();
	}
	else {
		this.sortKeysAlphabetically();
	}
}

DataAccumulator.prototype.sortKeysAlphabetically = function() {
	var accumulator = this;
	this.keys.sort(function(a,b) {	
		// case insensitive sort
		var aValue = accumulator.getSortValue(a).toLowerCase();
		var bValue = accumulator.getSortValue(b).toLowerCase();
		return (aValue > bValue ? 1 : (aValue < bValue ? -1 : 0));
	});
}

DataAccumulator.prototype.sortKeysByFrequency = function() {	
	var accumulator = this;
	this.keys.sort(function(a,b) {
		var aCount = accumulator.getCountForKey(a);
		var bCount = accumulator.getCountForKey(b);
		var result = (aCount > bCount ? -1 : (aCount < bCount ? 1 : 0));
		if (result===0) {
			var aValue = accumulator.getSortValue(a).toLowerCase();
			var bValue = accumulator.getSortValue(b).toLowerCase();
			result = (aValue > bValue ? 1 : (aValue < bValue ? -1 : 0));
		}
		return result;
	});
}

//=================================================================================
// AccordionList
//=================================================================================

var gAccordion = null;
// TODO: is gAccordion needed?

function AccordionList(div, accumulator) {
	this.div = div;
	this.accumulator = accumulator;
	this.active_index = false;
	this.active_key = null;
	gAccordion = this;
}

AccordionList.prototype.show = function() {
	var html = '';
	var keys = this.accumulator.getKeys();
	if (keys.length==0) {
		html = '<div style="margin-bottom:15px;">(none)</div>';
		this.div.html(html);
	}
	else {
		// sort options
		if (this.accumulator.sortOptions.length > 1) {
			html += '<span style="margin-right:10px;">';
			html += 'Sort by: ';
			for (var i=0; i<this.accumulator.sortOptions.length; i++) {
				var option = this.accumulator.sortOptions[i];
				if (option == this.accumulator.sortType) {
					html += '<strong>'+option + '</strong> ';
				}
				else {
					html += '<a href="#" class="sort">'+option+'</a> ';
				}
			}
			html += '</span>';
		}
		
		// accordion list
		// Note: selecting on #accordion_list assumes that only one AccordionList exists on a page
		html += '<div id="accordion_list" class="accordion2">';
		for (var i=0; i<keys.length; i++) {
			var key = keys[i];
			html += '<div id="item'+(i+1)+'" class="accordion_section"><a href="#"><span class="text_key">'+key+'</span>'+this.itemHeader(key,i)+'</a></div>';		
			html += '<div id="item'+(i+1)+'_expanded">';
			html += this.expandedItem(key, i);
			html += '</div>';		
		}
		html += '</div>';
		this.div.html(html);
				
		this.active_index = this.getSelectedIndex();
		$('#accordion_list').data("list", this);
		$('#accordion_list').accordion({
			collapsible: true, 
			active: this.active_index,
			change: function(event, control) {
				var list = $("#accordion_list").data("list");
				list.active_index = control.options.active;
				var selectedItem = $(".accordion_section:eq("+list.active_index+")");
				list.active_key = $(".text_key", selectedItem).html();
			}
		});
		
		$('.sort').click(function(event) {
			var list = $("#accordion_list").data("list");
			list.accumulator.setSortType($(this).html());
			if (typeof(updatePane) == "function") {
				updatePane();
			}
			else {
				list.show();
			}
			return false;
		});
				
		this.registerCallbacks();
	}
}

AccordionList.prototype.registerCallbacks = function() {
	$(".student_item").click(function() {
		var studentKey = $(this).html();
		showStudent(studentKey);
	});
}

AccordionList.prototype.getSelectedIndex = function() {
	var selectedIndex = false;
	if (this.active_key!=null) {
		for (var i=0; i<this.accumulator.keys.length; i++) {
			if (this.active_key == this.accumulator.keys[i]) {
				selectedIndex = i;
				break;
			}
		}
	}
	return selectedIndex;
}

AccordionList.prototype.itemHeader = function(key, i) {
    return '<span style="font-size:1em;">' + key + ' (' + this.accumulator.getCountForKey(key) + ')</span>';
}

AccordionList.prototype.expandedItem = function(key, i) {
	var studentDict = this.accumulator.getItemsForKey(key, "student_nickname");
	return getExpandedData("Students", studentDict, "student_item"); 
}

AccordionList.prototype.openIndex = function(i) {
	$("#accordion_list").accordion({ active:i });
}

AccordionList.prototype.openKey = function(key) {
	for (var i=0; i<this.accumulator.keys.length; i++) {
		if (this.accumulator.keys[i] == key) {
			this.active_index = i;
			this.active_key = key;
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
var gTagCloud = null;

function TagCloud(div, accumulator, options) {
	this.div = div;
	this.accumulator = accumulator;
	this.accordion = null;
	this.options = options;
	gTagCloud = this;
}

TagCloud.prototype.linkTo = function(accordion) {
	this.accordion = accordion;
}

TagCloud.prototype.show = function() {
	var html = '';
	var max_weight = 1;
	var keys = this.accumulator.getKeys();
	var accumulator = this.accumulator;
	$.each(keys, function(i, key) {
		var item_tag = { tag:accumulator.getSortValue(key), weight:accumulator.getCountForKey(key) };
		if (item_tag.weight > 0) {
			var tag = item_tag.tag.length <= MAX_TAG_LENGTH ? item_tag.tag : item_tag.tag.substring(0, MAX_TAG_LENGTH) + "&hellip;";
			tag = tag.replace("<", "&lt;").replace(">", "&gt;");
			html += '<a id="tag'+i+'" class="tag" href="#" rel="'+item_tag.weight+'" title="'+item_tag.tag+'">'+tag+'</a>\n';
			if (item_tag.weight > max_weight) max_weight = item_tag.weight;
		}
	});
	
	if (html != '') {
		html = '<div class="cloud"><p>'+html+'</p></div>';
		var max_font = max_weight <= 2 ? MED_CLOUD_FONT_SIZE : MAX_CLOUD_FONT_SIZE;
		var start_color = this.options!=undefined && this.options.color!=undefined && this.options.color.start!=undefined ? this.options.color.start : DEFAULT_TAG_COLOR;
		var end_color = this.options!=undefined && this.options.color!=undefined && this.options.color.end!=undefined ? this.options.color.end : DEFAULT_TAG_COLOR;
		this.div.html(html);
		$("#"+this.div.attr("id")+" a").tagcloud({
			size: {
				start: MIN_CLOUD_FONT_SIZE,
				end: max_font,
				unit: 'pt'
			},
			color: {
				start: start_color,
				end: end_color
			}
		});
		
		var accordion = this.accordion;
		$(".tag").click(function() {
			if (accordion) {
				var id = this.id;
				var index = parseInt(id.replace("tag", ""));
				accordion.openIndex(index);
			}
			return false;
		});
	}
}