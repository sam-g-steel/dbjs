"use strict";
/**
 * Created by Samuel V. Sylvester I on 9/10/2018.
 */
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Immutable class that represents values to filter a data table's rows by
 */
var DBFilter = /** @class */ (function () {
    function DBFilter() {
        this._map = {};
    }
    DBFilter.prototype._clone = function () {
        // Create new DBFilter
        var result = new DBFilter();
        // Copy over entries
        result._map = __assign({}, this._map);
        return result;
    };
    /**
     *
     * @param {string} fieldName
     * @param {string | number} value
     * @param {string} text
     * @return {this}
     */
    DBFilter.prototype.setField = function (fieldName, value, text) {
        // Make sure
        if (!fieldName) {
            console.error("fieldName must have a value!");
            return this;
        }
        if (text === undefined && value !== undefined) {
            text = "" + value;
        }
        // Create new DBFilter
        var result = this._clone();
        // Set the field to the new value
        result._map[fieldName] = { fieldName: fieldName, text: text, value: value };
        // Return new filter
        if (result.toString() === this.toString()) {
            // Return the current filter if it is the same as the new one
            return this;
        }
        else {
            // Otherwise, return the new filter
            return result;
        }
    };
    DBFilter.prototype.merge = function (newFilter) {
        //
        var entries = Object.values(newFilter._map);
        var result = this;
        //
        for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
            var entry = entries_1[_i];
            result = result.setField(entry.fieldName, entry.value, entry.text);
        }
        //
        return result;
    };
    /**
     *
     * @return {string}
     */
    DBFilter.prototype.toString = function () {
        return JSON.stringify(this._map);
    };
    DBFilter.prototype.toBasicFilter = function () {
        //
        var entries = Object.values(this._map);
        var result = {};
        //
        for (var _i = 0, entries_2 = entries; _i < entries_2.length; _i++) {
            var entry = entries_2[_i];
            if (entry.value !== undefined) {
                result[entry.fieldName] = entry.value;
            }
        }
        return result;
    };
    DBFilter.prototype.getEntry = function (fieldName) {
        return this._map[fieldName];
    };
    DBFilter.prototype.getEntriesAsObject = function () {
        return __assign({}, this._map);
    };
    DBFilter.prototype.getEntriesAsArray = function () {
        return Object.values(this._map);
    };
    DBFilter.prototype.toBasicString = function () {
        return JSON.stringify(this.toBasicFilter());
    };
    return DBFilter;
}());
exports.DBFilter = DBFilter;
//# sourceMappingURL=DBFilter.js.map