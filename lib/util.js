"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
String.prototype['hashCode'] = function () {
    var hash = 0;
    if (this.length == 0)
        return hash;
    for (var i = 0; i < this.length; i++) {
        var char = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
};
var rowSignature;
if (Object['values']) {
    console.log("using Object.values");
    rowSignature = function (row, hash) {
        return Object['values'](row).join('.');
    };
}
else {
    rowSignature = function (row, hash) {
        if (hash === void 0) { hash = false; }
        var result = JSON.stringify(row);
        if (hash)
            result = result.hashCode();
        return result;
    };
}
/**
 *
 * @param {any[]} array
 * @param {boolean} hash
 * @return {Array}
 */
function uniqueRows(array, hash) {
    if (hash === void 0) { hash = false; }
    var n = {}, r = [];
    for (var i = 0; i < array.length; i++) {
        // Use a hash based on the actual data                      in the object, not the object's memory address or instance id
        // This ensures that the objects are truly unique
        var strRep = rowSignature(array[i], hash);
        if (!n[strRep]) {
            n[strRep] = true;
            r.push(array[i]);
        }
    }
    return r;
}
exports.uniqueRows = uniqueRows;
//# sourceMappingURL=util.js.map