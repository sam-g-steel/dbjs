"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("./util");
var _ = require("lodash");
var LZMA_LIBc = require("lzma/src/lzma-c");
var LZMA_LIBd = require("lzma/src/lzma-d");
var SuperArray_1 = require("./SuperArray");
var LZMA = {
    compress: LZMA_LIBc.LZMA.compress,
    decompress: LZMA_LIBd.LZMA.decompress
};
var btoa;
var atob;
if (typeof atob === "undefined") {
    btoa = require("btoa");
    atob = require("atob");
}
else {
    btoa = window.btoa;
    atob = window.atob;
}
var DBTable = /** @class */ (function () {
    /**
     *
     * @param {any[]} jsonTable
     */
    function DBTable(jsonTable) {
        if (jsonTable === void 0) { jsonTable = []; }
        this._data = jsonTable;
    }
    Object.defineProperty(DBTable.prototype, "currentConstructor", {
        get: function () {
            if (this["__proto__"].constructor)
                return this["__proto__"].constructor;
            return this.prototype.constructor;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DBTable.prototype, "count", {
        /**
         * Number of rows in the table
         */
        get: function () {
            return this._data.length;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DBTable.prototype, "data", {
        get: function () {
            //return this._data.slice(0);
            return this._data.slice();
        },
        enumerable: true,
        configurable: true
    });
    /**
     *
     * @return {DBTable}
     */
    DBTable.prototype.distinct = function () {
        return new this.currentConstructor(util_1.uniqueRows(this._data));
    };
    /**
     *
     * @param {string} columnName
     * @param amount defaults to 1
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
     * @deprecated see union() instead
     * @param {DBTable} table
     */
    DBTable.prototype.insert = function (table) {
        return new this.currentConstructor(_.union(this._data, table._data));
    };
    /**
     * Unions current data with data that is passed in
     * @returns a new DBTable with the 'unioned' data
     * @param data - can be a DBTable, a row from a table, or an array of rows
     */
    DBTable.prototype.union = function (data) {
        var finalData;
        if (data instanceof DBTable) {
            finalData = data._data;
        }
        else if (typeof data === "object") {
            finalData = [data];
        }
        else {
            finalData = data;
        }
        return new this.currentConstructor(_.union(this._data, finalData));
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
        var results = new this.currentConstructor(this.data);
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
                results._data[insertIndex] = __assign({}, results._data[insertIndex], row);
            }
        });
        return results;
    };
    /**
     *
     * @param {string} column
     * @param {"ASC" | "DESC"} order defaults to "ASC"
     * @return {DBTable}
     */
    DBTable.prototype.orderBy = function (column, order) {
        if (order === void 0) { order = "ASC"; }
        var factor = order.toLowerCase() === "asc" ? 1 : -1;
        var newData = _.orderBy(this.data, [column], [order.toLowerCase()]);
        return new this.currentConstructor(newData);
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
     * @param {boolean} distinct defaults to true
     * @return {DBTable}
     */
    DBTable.prototype.select = function (columns, distinct) {
        if (distinct === void 0) { distinct = true; }
        // Todo: change distinct to require a value in version 0.6.x and default to false in 1.x.x
        var result = this._data.map(function (row) {
            var newRow = {};
            columns.forEach(function (column) { return newRow[column] = row[column]; });
            return newRow;
        });
        if (distinct)
            result = util_1.uniqueRows(result);
        return new this.currentConstructor(result);
    };
    /**
     *
     * @param {string} column
     * @param value
     * @return {DBTable}
     */
    DBTable.prototype.setColumn = function (column, value) {
        this._data.forEach(function (row) { return row[column] = value; });
        return this;
    };
    /**
     * This is an experimental feature
     * @experimental
     * @param columnName
     */
    DBTable.prototype.listDistinctValues = function (columnName) {
        var rowsToProcess = this.select([columnName]);
        var resultsTable = new DBTable;
        //
        rowsToProcess._data.forEach(function (row) {
            var values = row[columnName].split(",");
            values.forEach(function (value) {
                // Has this value already been registered? If so increment its count
                var alreadyRegistered = resultsTable
                    .whereColumnEquals("value", value)
                    .incrementColumn("count")
                    .count;
                // Otherwise add it to the list
                if (!alreadyRegistered) {
                    resultsTable._data.push({ value: value, count: 1 });
                }
            });
        });
        return resultsTable.distinct();
    };
    /**
     *
     * @param {number} count
     * @return {DBTable}
     */
    DBTable.prototype.top = function (count) {
        var results = this._data.slice(0, count);
        return new this.currentConstructor(results);
    };
    /**
     *
     * @param {string} column
     * @param {number | string} value
     * @param {boolean} caseSensitive
     */
    DBTable.prototype.whereColumnContains = function (column, value, caseSensitive) {
        if (caseSensitive === void 0) { caseSensitive = true; }
        var results = this._data.filter(function (row) {
            var columnValue = row[column];
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
        return new this.currentConstructor(results);
    };
    /**
     *
     * @param column
     * @param value
     * @return {DBTable}
     */
    DBTable.prototype.whereColumnEquals = function (column, value) {
        return new this.currentConstructor(this._data.filter(function (row) { return row[column] == value; }));
    };
    /**
     *
     * @param column
     * @param value
     * @return {DBTable}
     */
    DBTable.prototype.whereColumnNotEquals = function (column, value) {
        return new this.currentConstructor(this._data.filter(function (row) { return row[column] != value; }));
    };
    /**
     *
     * @param {string} column
     * @param {number | string} value
     * @return {this}
     */
    DBTable.prototype.whereColumnGreaterThanEquals = function (column, value) {
        return new this.currentConstructor(this._data.filter(function (row) { return row[column] >= value; }));
    };
    /**
     *
     * @param {string} column
     * @param {number | string} value
     * @return {this}
     */
    DBTable.prototype.whereColumnLessThanEquals = function (column, value) {
        return new this.currentConstructor(this._data.filter(function (row) { return row[column] <= value; }));
    };
    /**
     *
     * @param {string} column
     * @param {number | string} value
     * @return {this}
     */
    DBTable.prototype.whereColumnGreaterThan = function (column, value) {
        return new this.currentConstructor(this._data.filter(function (row) { return row[column] > value; }));
    };
    /**
     *
     * @param {string} column
     * @param {number | string} value
     * @return {this}
     */
    DBTable.prototype.whereColumnLessThan = function (column, value) {
        return new this.currentConstructor(this._data.filter(function (row) { return row[column] < value; }));
    };
    /***
     * @deprecated This function may be removed or behave differently in future releases.
     * Use DBTable.fromJson(...) instead.
     */
    DBTable.prototype.loadJson = function (json) {
        json = JSON.parse(json);
        return new this.currentConstructor(json);
    };
    /***
     *
     */
    DBTable.fromJson = function (json) {
        var data = JSON.parse(json);
        return new DBTable(data);
    };
    DBTable.prototype.loadLZMA = function (lzma) {
        var json = LZMA.decompress(lzma);
        return this.loadJson(json);
    };
    DBTable.prototype.loadLZMAStringB64 = function (string) {
        var lzma = atob(string);
        lzma = util_1.StringToUint8(lzma);
        lzma = Array["from"](lzma);
        return this.loadLZMA(lzma);
    };
    DBTable.prototype.toJSON = function (pretty) {
        if (pretty === void 0) { pretty = 2; }
        return JSON.stringify(this._data, null, pretty);
    };
    /**
     *
     */
    DBTable.prototype.toSuperArrays = function () {
        var columns = Object.keys(this._data[0]);
        var result = {};
        // loop through columns
        for (var _i = 0, columns_1 = columns; _i < columns_1.length; _i++) {
            var columnName = columns_1[_i];
            var column = [];
            // loop through rows
            for (var _a = 0, _b = this._data; _a < _b.length; _a++) {
                var row = _b[_a];
                column.push(row[columnName]);
            }
            result[columnName] = new SuperArray_1.SuperArray(column);
        }
        return result;
    };
    /**
     *
     * @param input
     */
    DBTable.fromSuperArrays = function (input) {
        var columns = Object.keys(input);
        var length = input[columns[0]].length;
        var data = [];
        // loop through rows
        for (var i = 0; i < length; i++) {
            var row = {};
            // loop through columns
            for (var _i = 0, columns_2 = columns; _i < columns_2.length; _i++) {
                var columnName = columns_2[_i];
                row[columnName] = input[columnName][i];
            }
            data.push(row);
        }
        return new DBTable(data);
    };
    DBTable.prototype.toLZMA = function (compression) {
        if (compression === void 0) { compression = 1; }
        var json = this.toJSON(0);
        return LZMA.compress(json, compression);
    };
    DBTable.prototype.toLZMAStringB64 = function (compression) {
        if (compression === void 0) { compression = 1; }
        var lzma = this.toLZMA(compression);
        var u8 = new Uint8Array(lzma);
        return btoa(util_1.Uint8ToString(u8));
    };
    return DBTable;
}());
exports.DBTable = DBTable;
//# sourceMappingURL=DBTable.js.map