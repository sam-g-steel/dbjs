"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("./util");
var _ = require("lodash");
var LZMA_LIBc = require("lzma/src/lzma-c");
var LZMA_LIBd = require("lzma/src/lzma-d");
var isBrowser = this.window === this;
var LZMA = {
    compress: LZMA_LIBc.LZMA.compress,
    decompress: LZMA_LIBd.LZMA.decompress
};
var btoa;
var atob;
if (!isBrowser) {
    btoa = require("btoa");
    atob = require("atob");
}
else {
    btoa = window.btoa;
    atob = window.atob;
}
var DBTable = (function () {
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
        get: function () {
            return this._data.length;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DBTable.prototype, "data", {
        get: function () {
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
        return new this.currentConstructor(util_1.uniqueRows(this._data));
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
        return new this.currentConstructor(_.union(this._data, table._data));
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
     * @param {boolean} distinct
     * @return {DBTable}
     */
    DBTable.prototype.select = function (columns, distinct) {
        if (distinct === void 0) { distinct = true; }
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
        return new this.currentConstructor(results);
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
        return new this.currentConstructor(results);
    };
    /**
     *
     * @param columnName
     * @param value
     * @return {DBTable}
     */
    DBTable.prototype.whereColumnEquals = function (columnName, value) {
        return new this.currentConstructor(this._data.filter(function (row) { return row[columnName] == value; }));
    };
    /**
     *
     * @param columnName
     * @param value
     * @return {DBTable}
     */
    DBTable.prototype.whereColumnNotEquals = function (columnName, value) {
        return new this.currentConstructor(this._data.filter(function (row) { return row[columnName] != value; }));
    };
    DBTable.prototype.loadJson = function (json) {
        json = JSON.parse(json);
        return new this.currentConstructor(json);
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