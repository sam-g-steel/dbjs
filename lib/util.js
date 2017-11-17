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
function Uint8ToString(u8a) {
    // from... https://stackoverflow.com/questions/12710001/how-to-convert-uint8-array-to-base64-encoded-string
    var CHUNK_SZ = 0x8000;
    var c = [];
    for (var i = 0; i < u8a.length; i += CHUNK_SZ) {
        c.push(String.fromCharCode.apply(null, u8a.subarray(i, i + CHUNK_SZ)));
    }
    return c.join("");
}
exports.Uint8ToString = Uint8ToString;
function StringToUint8(string) {
    // from... https://jsperf.com/string-to-uint8array
    var uint = new Uint8Array(string.length);
    for (var i = 0, j = string.length; i < j; ++i) {
        uint[i] = string.charCodeAt(i);
    }
    return uint;
}
exports.StringToUint8 = StringToUint8;
//# sourceMappingURL=util.js.map