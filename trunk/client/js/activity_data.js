//For info on JavaScript OOP, see:
//http://www.javascriptkit.com/javatutors/oopjs.shtml   (new and this)
//http://www.javascriptkit.com/javatutors/oopjs2.shtml  (constructors)
//http://www.javascriptkit.com/javatutors/oopjs3.shtml  (inheritance)

// TODO: Where should these live?
var g_activeAccordionIndex = false;
var g_activeAccordionKey = null;

//=================================================================================
// DataItem
//=================================================================================

function DataItem(key, data) {
    this.key = key;
    this.data = data;
    this.count = 1;
}

DataItem.prototype.getKey = function() {
    return this.key;
}

DataItem.prototype.asHTML = function(i) {
    return '<span style="font-size:1em;">' + this.key + ' (' + this.count + ')</span>';
}

//=================================================================================
// DataAccumulator
//=================================================================================

function DataAccumulator() {
	this.dict = {};
	this.sortBy = "key";
}

DataAccumulator.prototype.add = function(item) {
	var key = item.getKey();
	existingItem = this.getItem(key);
    if (existingItem) {
        item.count = existingItem.count+1;
    }
	this.dict[key] = item;
}

DataAccumulator.prototype.getItems = function() {
	var items = dict2Array(this.dict);
	if (this.sortBy) {
		sortInPlaceAlphabetically(items, this.sortBy);
	}
	return items;
}

DataAccumulator.prototype.getItem = function(key) {
	return typeof(this.dict) != "undefined" && typeof(this.dict[key]) != "undefined" ? this.dict[key] : null;
}
	
//=================================================================================
// AccordionList
//=================================================================================

function AccordionList(div, accumulator) {
	this.div = div;
	this.items = accumulator.getItems();
}

AccordionList.prototype.show = function() {
	if (this.items.length==0) {
		var html = '<div style="margin-bottom:15px;">(none)</div>';
		this.div.html(html);
	}
	else {
		var html = '<div id="accordion_list" class="accordion2">';
		for (var i=0; i<this.items.length; i++) {
			var item = this.items[i];
			html += '<div id="item'+(i+1)+'" class="accordion_section"><a href="#"><span class="text_key">'+item.getKey()+'</span>'+item.asHTML(i)+'</a></div>';		
			html += '<div id="item'+(i+1)+'_expanded">';
			html += this.expandedItem(item, i);
			html += '</div>';		
		}
		html += '</div>';
		this.div.html(html);
				
		g_activeAccordionIndex = this.getSelectedIndex(g_activeAccordionKey);
		$('#accordion_list').accordion({
			collapsible: true, 
			active: g_activeAccordionIndex,
			change: function(event, control) {
				g_activeAccordionIndex = control.options.active;
				var selectedItem = $(".accordion_section:eq("+g_activeAccordionIndex+")");
				g_activeAccordionKey = $('.text_key', selectedItem).html();
			}
		});
	}
}

AccordionList.prototype.getSelectedIndex = function(itemKey) {
	var itemIndex = false;
	if (itemKey!=null) {
		for (var i=0; i<this.items.length; i++) {
			if (itemKey == this.items[i].getKey()) {
				itemIndex = i;
				break;
			}
		}
	}
	return itemIndex;
}

AccordionList.prototype.expandedItem = function(item, i) {
	return "";
}