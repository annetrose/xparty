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

//=================================================================================
// DataAccumulator
//=================================================================================

function DataAccumulator() {
	this.dict = {};
	this.keys = [];
	this.sortOptions = ["ABC", "Frequency"];
	this.setSort("ABC");
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

DataAccumulator.prototype.update = function(item) {	
	var key = item.getKey();
	this.dict[key][0] = item;
}

DataAccumulator.prototype.updateAtIndex = function(item, index) {	
	var key = item.getKey();
	this.dict[key][i] = item;
}

DataAccumulator.prototype.getKeys = function() {
	if (this.needToUpdateKeys) {
		if (this.sortBy == "Frequency") {
			this.keys = sortKeysByFrequency(this.dict);
		}
		else {
			this.keys = sortKeysAlphabetically(this.dict);
		}
	}
	this.needToUpdateKeys = false;
	return this.keys;
}

DataAccumulator.prototype.keyExists = function(item) {
	var key = item.getKey();
	return typeof(this.dict[key]) != "undefined";
}

DataAccumulator.prototype.getValue = function(key, property) {
	return this.dict[key][0].data[property];
}

DataAccumulator.prototype.getValueAtIndex = function(key, property, index) {
	return this.dict[key][index].data[property];
}

DataAccumulator.prototype.getCountForKey = function(key) {
	return this.dict[key].length;
}

DataAccumulator.prototype.setSort = function(sort) {
	this.needToUpdateKeys = (typeof(this.sortBy) == "undefined") || this.sortBy != sort;
	this.sortBy = sort;
}

//=================================================================================
// AccordionList
//=================================================================================

var g_accordion = null;

function AccordionList(div, accumulator) {
	this.div = div;
	this.accumulator = accumulator;
	this.active_index = false;
	this.active_key = null;
	g_accordion = this;
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
				if (option == this.accumulator.sortBy) {
					html += '<strong>'+option + '</strong> ';
				}
				else {
					html += '<a href="#" class="sort">'+option+'</a> ';
				}
			}
			html += '</span>';
		}
		
		// accordion list
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
			list.accumulator.setSort($(this).html());
			if (typeof(update_pane) == "function") {
				update_pane();
			}
			else {
				list.show();
			}
			return false;
		});		
	}
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
	return "";
}

// TODO: Do not hard code accordion div id
function open_accordion_index(index) {
	$('#accordion_list').accordion({ active:index });
}

function open_accordion_key(key) {
	var list = $("#accordion_list").data("list");
	for (var i=0; i<list.accumulator.keys.length; i++) {
		if (list.accumulator.keys[i] == key) {
			list.active_index = i;
			list.active_key = key;
			open_accordion_index(i);
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
var g_tagcloud = null;

function TagCloud(div, accumulator, options) {
	this.div = div;
	this.accumulator = accumulator;
	this.options = options;
	g_tagcloud = this;
}

TagCloud.prototype.show = function() {
	var html = '';
	var max_weight = 1;
	var keys = this.accumulator.getKeys();
	var accumulator = this.accumulator;
	$.each(keys, function(i, key) {
		var url = "javascript:open_accordion_index("+i+");";
		var item_tag = { tag:key, weight:accumulator.getCountForKey(key), url:url };
		if (item_tag.weight > 0) {
			var tag = item_tag.tag.length <= MAX_TAG_LENGTH ? item_tag.tag : item_tag.tag.substring(0, MAX_TAG_LENGTH) + "&hellip;";
			tag = tag.replace("<", "&lt;").replace(">", "&gt;");
			html += '<a href="'+item_tag.url+'" rel="'+item_tag.weight+'" title="'+item_tag.tag+'">'+tag+'</a>\n';
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
	}
}

//=================================================================================
// Sort Functions
//=================================================================================

function sortKeysAlphabetically(dict) {
	var keys = [];
	for (key in dict) {
		keys.push(key);
	}
	keys.sort(function(a,b) {	
		// case insensitive sort
		var aValue = a.toLowerCase();
		var bValue = b.toLowerCase();
		return (aValue > bValue ? 1 : (aValue < bValue ? -1 : 0));
	});
	return keys;
}

function sortKeysByFrequency(dict) {
	var keys = [];
	for (key in dict) {
		keys.push(key);
	}
	keys.sort(function(a,b) {
		var aCount = dict[a].length;
		var bCount = dict[b].length;
		var result = (aCount > bCount ? -1 : (aCount < bCount ? 1 : 0));
		if (result===0) {
			var aValue = a.toLowerCase();
			var bValue = b.toLowerCase();
			result = (aValue > bValue ? 1 : (aValue < bValue ? -1 : 0));
		}
		return result;
	});
	return keys;
}