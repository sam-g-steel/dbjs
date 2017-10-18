"use strict";
/**
 * Created by sam_g on 6/3/2017.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
// Deep unique
Array.prototype["unique"] = function () {
    var n = {}, r = [];
    for (var i = 0; i < this.length; i++) {
        // Use a hash based on the actual data                      in the object, not the object's memory address or instance id
        // This ensures that the objects are truly unique
        var strRep = JSON.stringify(this[i]);
        if (!n[strRep]) {
            n[strRep] = true;
            r.push(this[i]);
        }
    }
    return r;
};
/*
Array.prototype["unique"] = function () {
    return _.uniqWith(this, _.isEqual);
};*/
var DBTable = (function () {
    /**
     *
     * @param {any[]} jsonTable
     */
    function DBTable(jsonTable) {
        if (jsonTable === void 0) { jsonTable = []; }
        this._data = jsonTable;
    }
    Object.defineProperty(DBTable.prototype, "count", {
        get: function () {
            if (!this._data) {
                console.error("this._data is missing... It looks like this instance was not properly constructed!");
                return 0;
            }
            return this._data.length;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DBTable.prototype, "data", {
        get: function () {
            if (!this._data) {
                console.error("this._data is missing... It looks like this instance was not properly constructed!");
                return [];
            }
            return this._data.map(function (row) { return row; });
        },
        enumerable: true,
        configurable: true
    });
    /**
     *
     * @return {DBTable}
     */
    DBTable.prototype.distinct = function () {
        var results = this._data;
        results = results.unique();
        return new DBTable(results);
    };
    /**
     *
     * @param {string} columnName
     * @param amount
     * @return {DBTable}
     */
    DBTable.prototype.incrementColumn = function (columnName, amount) {
        if (amount === void 0) { amount = 1; }
        this._data.forEach(function (row) {
            // make sure the row's field exists
            if (row[columnName] == undefined)
                row[columnName] = 0;
            // increment the fields value
            row[columnName] += amount;
        });
        return this;
    };
    /**
     *
     * @param {DBTable} table
     */
    DBTable.prototype.insert = function (table) {
        return new DBTable(_.union(this._data, table._data));
    };
    /**
     *
     * @param {DBTable} table
     * @param {string} column
     * @param {boolean} overwrite
     * @return {DBTable}
     */
    DBTable.prototype.mergeTableBy = function (table, column, overwrite) {
        if (overwrite === void 0) { overwrite = false; }
        var results = new DBTable(this.data);
        table.data.reverse().forEach(function (row) {
            // Are there any rows that already have the same key
            var rowCollisionData = results.whereColumnEquals(column, row[column]);
            var rowCollision = rowCollisionData.count > 0;
            if (rowCollision && !overwrite) {
                return;
            }
            if (!rowCollision) {
                results._data.unshift(row);
            }
            else {
                var insertIndex = results._data.indexOf(rowCollisionData.data[0]);
                results._data[insertIndex] = row;
            }
        });
        return results;
    };
    /**
     *
     * @param {string} column
     * @param {"ASC" | "DESC"} order
     * @return {DBTable}
     */
    DBTable.prototype.orderBy = function (column, order) {
        if (order === void 0) { order = "ASC"; }
        var factor = order.toLowerCase() === "asc" ? 1 : -1;
        var newData = this.data.sort(function (a, b) {
            var aValue = a[column], bValue = b[column];
            if (typeof aValue === "string")
                aValue = aValue.toLowerCase();
            if (typeof bValue === "string")
                bValue = bValue.toLowerCase();
            if (aValue < bValue)
                return -factor;
            if (aValue > bValue)
                return factor;
            return 0; //default return value (no sorting)
        });
        return new DBTable(newData);
    };
    /**
     *
     * @param {string} columnName
     * @return {DBTable}
     */
    DBTable.prototype.removeColumn = function (columnName) {
        this._data.forEach(function (row) { return delete row[columnName]; });
        return this;
    };
    /**
     *
     * @param {string[]} columns
     * @param {boolean} distinct
     * @return {DBTable}
     */
    DBTable.prototype.select = function (columns, distinct) {
        if (distinct === void 0) { distinct = true; }
        var results = this._data.map(function (row) {
            var newRow = {};
            columns.forEach(function (column) { return newRow[column] = row[column]; });
            return newRow;
        });
        if (distinct)
            results = results.unique();
        return new DBTable(results);
    };
    /**
     *
     * @param {string} columnName
     * @param value
     * @return {DBTable}
     */
    DBTable.prototype.setColumn = function (columnName, value) {
        this._data.forEach(function (row) { return row[columnName] = value; });
        return this;
    };
    /**
     *
     * @param {number} count
     * @return {DBTable}
     */
    DBTable.prototype.top = function (count) {
        var results = this._data.slice(0, count);
        return new DBTable(results);
    };
    /**
     *
     * @param columnName
     * @param value
     * @return {DBTable}
     */
    DBTable.prototype.whereColumnContains = function (columnName, value, caseSensitive) {
        if (caseSensitive === void 0) { caseSensitive = true; }
        var results = this._data.filter(function (row) {
            var columnValue = row[columnName];
            if (typeof columnValue !== "string")
                return false;
            if (caseSensitive)
                return columnValue.includes(value);
            else {
                if (typeof value === "string")
                    value = value.toLowerCase();
                return columnValue.toLowerCase().includes(value);
            }
        });
        return new DBTable(results);
    };
    /**
     *
     * @param columnName
     * @param value
     * @return {DBTable}
     */
    DBTable.prototype.whereColumnEquals = function (columnName, value) {
        return new DBTable(this._data.filter(function (row) { return row[columnName] == value; }));
    };
    /**
     *
     * @param columnName
     * @param value
     * @return {DBTable}
     */
    DBTable.prototype.whereColumnNotEquals = function (columnName, value) {
        return new DBTable(this._data.filter(function (row) { return row[columnName] != value; }));
    };
    return DBTable;
}());
exports.DBTable = DBTable;