"use strict";
/**
 * @author Samuel .V Sylvester Sr.
 * This class was originally created in November 2017 to help with developing
 * a machine learning application for three.js rectarea light data compression
 * and other applications.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var SuperArray = /** @class */ (function (_super) {
    __extends(SuperArray, _super);
    function SuperArray(array) {
        var _this = 
        // init array
        _super.call(this) || this;
        _this._isSuperArray = true;
        /**
         * Returns a new array with the absolute values of the old array
         */
        _this.abs = function () {
            return _this.map(function (x) { return Math.abs(x); });
        };
        /**
         * Returns the average value of the elements in the array
         */
        _this.avg = function () {
            return _this.sum() / (_this.length || 1);
        };
        /**
         * Returns the first element of the array
         * @return {t}
         */
        _this.first = function () {
            return _this[0];
        };
        /**
         * Returns the last element in the array
         * @return {t}
         */
        _this.last = function () {
            return _this[_this.length - 1];
        };
        /**
         * Returns the maximum value of the elements in the array
         */
        _this.max = function () {
            var res = _this[0];
            for (var i = 1; i < _this.length; i++) {
                var next = _this[i];
                res = res > next ? res : next;
            }
            return res;
        };
        /**
         * Returns the minimum value of the elements in the array
         */
        _this.min = function () {
            var res = _this[0];
            for (var i = 1; i < _this.length; i++) {
                var next = _this[i];
                res = res < next ? res : next;
            }
            return res;
        };
        _this.normalize = function () {
            var max = _this.max();
            var min = _this.min();
            var range = (max - min) || 1;
            var result = [];
            for (var i = 0; i < _this.length; i++) {
                result.push((+_this[i] - min) / range);
            }
            return new SuperArray(result);
        };
        /**
         * Returns the sum of the elements in the array
         */
        _this.sum = function () {
            return _this.reduce(function (a, b) { return a + b; });
        };
        /**
         * Returns an array based on the original with only unique values
         */
        _this.unique = function () {
            var n = {}, r = [];
            for (var i = 0; i < _this.length; i++) {
                // Use a hash based on the actual data
                // in the object, not the object's memory address or instance id
                // This ensures that the objects are truly unique
                var strRep = JSON.stringify(_this[i]);
                if (!n[strRep]) {
                    n[strRep] = true;
                    r.push(_this[i]);
                }
            }
            return new SuperArray(r);
        };
        // fill array with the data that was passed in
        for (var _i = 0, array_1 = array; _i < array_1.length; _i++) {
            var element = array_1[_i];
            _this.push(element);
        }
        return _this;
    }
    SuperArray.prototype.getClamped = function (index) {
        var length = this.length;
        if (index < 0) {
            return this.first();
        }
        else if (index >= length) {
            return this.last();
        }
        else {
            return this[index];
        }
    };
    SuperArray.prototype.indexOfMax = function () {
        return this.indexOf(this.max());
    };
    SuperArray.prototype.shiftArrayMAD = function (shift, multiply, addArray) {
        var _this = this;
        if (multiply === undefined) {
            multiply = 1;
        }
        if (!addArray) {
            addArray = [0];
        }
        if (!addArray._isSuperArray) {
            addArray = new SuperArray(addArray);
            addArray.push(0);
        }
        return this.map(function (o, i) {
            return _this.getClamped(i - shift) * multiply + addArray.getClamped(i);
        });
    };
    SuperArray.prototype.toFixed = function (a) {
        return this.map(function (x) { return +x.toFixed(a); });
    };
    return SuperArray;
}(Array));
exports.SuperArray = SuperArray;
//# sourceMappingURL=SuperArray.js.map