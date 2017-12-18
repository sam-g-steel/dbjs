"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var DBTable_1 = require("./DBTable");
var cacheEntry = /** @class */ (function () {
    function cacheEntry(dataTable) {
        this._dataTable = dataTable;
        this._accessCount = 0;
    }
    Object.defineProperty(cacheEntry.prototype, "dataTable", {
        get: function () {
            this._accessCount++;
            return this._dataTable;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(cacheEntry.prototype, "accessCount", {
        get: function () {
            return this._accessCount;
        },
        enumerable: true,
        configurable: true
    });
    return cacheEntry;
}());
var CachingDBTable = /** @class */ (function (_super) {
    __extends(CachingDBTable, _super);
    /**
     *
     * @param {any[]} objectArray
     */
    function CachingDBTable(objectArray) {
        if (objectArray === void 0) { objectArray = []; }
        var _this = 
        //console.log("cache");
        _super.call(this, objectArray) || this;
        _this._cache = [];
        return _this;
    }
    /**
     *
     * @param {string[]} columns
     * @param {boolean} distinct
     * @return {DBTable}
     */
    CachingDBTable.prototype.select = function (columns, distinct) {
        if (distinct === void 0) { distinct = true; }
        var result;
        // Caching
        var signature = "select-" + distinct + "-columns:" + JSON.stringify(columns);
        // read from cache
        result = this._readCache(signature);
        // Cache miss
        if (!result) {
            result = _super.prototype.select.call(this, columns, distinct);
            this._writeCache(signature, result);
        }
        return result;
    };
    /**
     *
     * @param columnName
     * @param value
     * @return {DBTable}
     */
    CachingDBTable.prototype.whereColumnEquals = function (columnName, value) {
        var result;
        // Caching
        var signature = "whereColumnEquals-" + columnName + ":" + JSON.stringify(value);
        // read from cache
        result = this._readCache(signature);
        // Cache miss
        if (!result) {
            result = _super.prototype.whereColumnEquals.call(this, columnName, value);
            this._writeCache(signature, result);
        }
        return result;
    };
    /**
     *
     * @param columnName
     * @param value
     * @return {DBTable}
     */
    CachingDBTable.prototype.whereColumnNotEquals = function (columnName, value) {
        var result;
        // Caching
        var signature = "whereColumnNotEquals-" + columnName + ":" + JSON.stringify(value);
        // read from cache
        result = this._readCache(signature);
        // Cache miss
        if (!result) {
            result = _super.prototype.whereColumnNotEquals.call(this, columnName, value);
            this._writeCache(signature, result);
        }
        return result;
    };
    /**
     *
     * @param {string} signature
     * @return {DBTable}
     * @private
     */
    CachingDBTable.prototype._readCache = function (signature) {
        var results = this._cache[signature];
        if (results)
            return results.dataTable || null;
        return null;
    };
    /**
     *
     * @param {string} signature
     * @param {DBTable} dataTable
     * @private
     */
    CachingDBTable.prototype._writeCache = function (signature, dataTable) {
        this._cache[signature] = new cacheEntry(dataTable);
    };
    return CachingDBTable;
}(DBTable_1.DBTable));
exports.CachingDBTable = CachingDBTable;
//# sourceMappingURL=CachingDBTable.js.map