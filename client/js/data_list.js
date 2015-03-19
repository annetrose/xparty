/*
# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn -- www.alexquinn.org
#          Anne Rose -- www.cs.umd.edu/hcil/members/arose
# Date: Originally created October 2012
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

//=================================================================================
// DataList
//=================================================================================

function DataList(title, keyProperty, options) {
    this.title = title;
    this.keyProperty = keyProperty;
    this.keys = [];
    this.items = {};
    this.options = options;    
    this.initOptions(options);
    this.needToUpdateKeys = false;
}

DataList.prototype.initOptions = function(options) {
    if (isDefined(this.options)) {
        this.groupProperty = this.options.groupProperty;
        this.groups = {};
        
        this.filterOptions = [];
        this.defaultFilter = undefined;
        if (isDefined(this.options.filters)) {
            this.filterOptions = isDefined(this.options.filters.types) ? this.options.filters.types : this.filterOptions;
            this.defaultFilter = isDefined(this.options.filters.default) ? this.options.filters.default : (this.filterOptions.length > 0 ? this.filterOptions[0] : this.defaultFilter);
        }
        this.filter = this.defaultFilter;
        
        this.sortOptions = [ SORT_ALPHABETICALLY, SORT_BY_FREQUENCY ];
        this.defaultSort = SORT_ALPHABETICALLY;
        if (isDefined(this.options.sortBy)) {
            this.sortOptions = isDefined(this.options.sortBy.types) ? this.options.sortBy.types : this.sortOptions;
            this.defaultSort = isDefined(this.options.sortBy.default) ? this.options.sortBy.default : (this.sortOptions.length > 0 ? this.sortOptions[0] : this.defaultSort);
        }
        this.sortBy = this.defaultSort;
    }
}

DataList.prototype.createItems = function(data) {
    var key = data[this.keyProperty];
    return isDefined(key) ? [ new DataItem(key, data) ] : [];
}

DataList.prototype.addItems = function(items) {
    for (var i in items) {
        var item = items[i];
        var key = item.getKey();
        if (isUndefined(this.items[key])) {
            this.items[key] = [];
        }
        this.items[key].push(item);
        
        if (isDefined(this.groupProperty)) {
            var groupKey = item.getValue(this.groupProperty);
            if (isUndefined(this.groups[groupKey])) {
                this.groups[groupKey] = {};
            }
            if (isUndefined(this.groups[groupKey][key])) {
                this.groups[groupKey][key] = [];
            }
            this.groups[groupKey][key].push(item);
        }
    }
    this.needToUpdateKeys = true;
}

DataList.prototype.updateItems = function(data, index) {
    index = isDefined(index) ? index : 0;
    var items = this.createItems(data);
    for (var i in items) {
        var item = items[i];
        var key = item.getKey();
        this.items[key][index].update(item);
    }
}

DataList.prototype.setDefaults = function() {
    this.setFilter(this.defaultFilter);
    this.setSort(this.defaultSort);
}

DataList.prototype.getFilterOptions = function() {
    return this.filterOptions;
}

DataList.prototype.getFilter = function() {
    return this.filter;
}

DataList.prototype.setFilter = function(filter) {
    this.filter = filter;
}

DataList.prototype.getSortOptions = function() {
    return this.sortOptions;
}

DataList.prototype.getSort = function() {
    return this.sortBy;
}

DataList.prototype.setSort = function(sort) {
    this.needToUpdateKeys = (isUndefined(this.sortBy)) || this.sortBy != sort;
    this.sortBy = sort;
}

DataList.prototype.sortKeys = function(keys, sortBy) {
    sortBy = isDefined(sortBy) ? sortBy : this.sortBy;
    if (isUndefined(keys)) {
        keys = [];
        for (key in this.items) {
            keys.push(key);
        }
    }
    
    if (sortBy == SORT_BY_FREQUENCY) {
        keys = this.sortByFrequency(keys);
    }
    else if (sortBy == SORT_ALPHABETICALLY) {
        keys = this.sortAlphabetically(keys);
    }
    
    return keys;
}

DataList.prototype.sortAlphabetically = function(sortValues) {
    // case insensitive sort
    var list = this;
    sortValues.sort(function(a, b) {
        var aValue = list.getValueForSort(a).toLowerCase();
        var bValue = list.getValueForSort(b).toLowerCase();
        return (aValue > bValue ? 1 : (aValue < bValue ? -1 : 0));
    });
    return sortValues;
}

DataList.prototype.sortByFrequency = function(sortValues) {   
    var list = this;
    sortValues.sort(function(a,b) {
        var aCount = list.getCount(a);
        var bCount = list.getCount(b);
        var result = (aCount > bCount ? -1 : (aCount < bCount ? 1 : 0));
        if (result===0) {
            var aValue = list.getValueForSort(a).toLowerCase();
            var bValue = list.getValueForSort(b).toLowerCase();
            result = (aValue > bValue ? 1 : (aValue < bValue ? -1 : 0));
        }
        return result;
    });
    return sortValues;
}

DataList.prototype.getKeyProperty = function() {
    return this.keyProperty;
}

DataList.prototype.getKeys = function() {
    if (this.needToUpdateKeys) {
        this.keys = [];
        for (var key in this.items) {
            this.keys.push(key);
        }
        this.keys = this.sortKeys(this.keys);
    }
    this.needToUpdateKeys = false;
    return this.keys;
}

DataList.prototype.getItem = function(key, index) {
    if (isUndefined(index)) index = 0;
    return this.items[key][index];
}

DataList.prototype.getKeysForGroup = function(groupKey, sortOption) {
    var sortOption = isDefined(sortOption) ? sortOption : SORT_ALPHABETICALLY; 
    var groupKeys = []; 
    var groupItems = this.groups[groupKey];
    for (var key in groupItems) {
        var groupItem = groupItems[key][0];
        groupKeys.push(groupItem.getKey());
    }
    return this.sortKeys(groupKeys, sortOption);
}

DataList.prototype.getGroupItem = function(groupKey, key, index) {
    if (isUndefined(index)) index = 0;
    return this.groups[groupKey][key][index];
}

DataList.prototype.getValue = function(key, property, index) {
    var item = this.getItem(key, index);
    return item.getValue(property);
}

DataList.prototype.getValueForSort = function(key) {
    // items are sorted by their key by default
    return key;
}

DataList.prototype.getCount = function(key) {
    return isDefined(key) ? this.items[key].length : this.getKeys().length;
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

DataItem.prototype.update = function(item) {
    this.key = item.getKey();
    this.data = item.getData();
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
// ActionList
//=================================================================================

function ActionList(title, keyProperty, actionTypes, options) {
    DataList.call(this, title, keyProperty, options);
    this.actionTypes = actionTypes;
    this.options = options;
    this.studentCounts = {};
   
    // listen for all actions associated with list
    for (var i in this.actionTypes) {
        var type = this.actionTypes[i];
        $(document).on("xp_"+type, { list: this } , function(event) {
            var list = event.data.list;
            var action = event.action;
            var items = list.createItems(action);
            list.addItems(items);
            $(list).trigger({ type: "xp_action_added", items: items, action: action });
        });
    }
    
    // listen for any secondary actions
    if (isDefined(this.options) && isDefined(this.options.secondary_actions)) {
        for (var i in this.options.secondary_actions) {
            var eventType = this.options.secondary_actions[i].eventType;
            for (var j in this.options.secondary_actions[i].actionTypes) {
                var type = this.options.secondary_actions[i].actionTypes[j];
                $(document).on("xp_"+type, { list: this, eventType: eventType }, function(event) {
                    var list = event.data.list;
                    var eventType = event.data.eventType;
                    var action = event.action;
                    $(list).trigger({ type: eventType, action: action });
                });    
            }
        }
    }
}
ActionList.prototype = Object.create(DataList.prototype);

ActionList.prototype.createItems = function(action) {
    var key = getActionDescription(action);
    if (isDefined(this.keyProperty)) {
        key = getActionValue(action, this.keyProperty);
    }
    
    // update counts (used to sort by frequency, etc.) 
    this.updateStudentCounts(key, action);
        
    return isDefined(key) ? [ new ActionItem(key, action) ] : [];
}

ActionList.prototype.isListAction = function(action) {
    var actionType = getActionType(action);
    return isDefined(action) && $.inArray(actionType, this.actionTypes) > -1;
}

ActionList.prototype.sortByFrequency = function(sortValues) { 
    var list = this;
    sortValues.sort(function(a,b) {
        var aCount = list.getStudentCount(a);
        var bCount = list.getStudentCount(b);
        var result = (aCount > bCount ? -1 : (aCount < bCount ? 1 : 0));
        if (result===0) {
            var aValue = list.getValueForSort(a).toLowerCase();
            var bValue = list.getValueForSort(b).toLowerCase();
            result = (aValue > bValue ? 1 : (aValue < bValue ? -1 : 0));
        }
        return result;
    });
    return sortValues;
}

ActionList.prototype.updateStudentCounts = function(key, action) {
// update student counts for given key (used to sort by frequency, etc.)
// studentCounts[key].count is the # of unique students associated with the key
// studentCounts[key].students is an array keyed by student name that contains 
// the # of times a student is associated with the key

    var studentName = getStudentNickname(action);
    
    if (isUndefined(this.studentCounts[key])) {
        this.studentCounts[key] = { count: 0, students: {} };
    }
    if (isUndefined(this.studentCounts[key].students[studentName])) {
        this.studentCounts[key].students[studentName] = 0;
        this.studentCounts[key].count++;
    }
    this.studentCounts[key].students[studentName]++;
}

ActionList.prototype.getAction = function(key, i) {
    var i = isDefined(i) ? i : 0;
    return isDefined(key) && isDefined(this.items[key][i]) ? this.items[key][i].getAction() : null;
}

ActionList.prototype.getStudentCount = function(key) {
    return isDefined(this.studentCounts[key]) ? this.studentCounts[key].count : 0;
}

//=================================================================================
// ActionItem
//=================================================================================

function ActionItem(key, action) {
    DataItem.call(this, key, action);
}
ActionItem.prototype = Object.create(DataItem.prototype);

ActionItem.prototype.getAction = function() {
    return this.getData();
}

ActionItem.prototype.getValue = function(property) {
    var action = this.getAction();
    return getActionValue(action, property);
}