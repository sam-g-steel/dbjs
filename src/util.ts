
String.prototype['hashCode'] = function(){
    let hash = 0;
    if (this.length == 0) return hash;
    for (let i = 0; i < this.length; i++) {
        let char = this.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
};

let rowSignature;

if(Object['values']){
    console.log("using Object.values");
    rowSignature = (row, hash)=>{
        return Object['values'](row).join('.');
    };
}else {
    rowSignature = (row, hash = false)=>{
        let result:any = JSON.stringify(row);
        if(hash) result = result.hashCode();

        return result;
    };
}

/**
 *
 * @param {any[]} array
 * @param {boolean} hash
 * @return {Array}
 */
export function uniqueRows(array: any[], hash:boolean = false) {
    let n = {}, r = [];
    for (let i = 0; i < array.length; i++) {
        // Use a hash based on the actual data                      in the object, not the object's memory address or instance id
        // This ensures that the objects are truly unique
        let strRep = rowSignature(array[i], hash);
        if (!n[strRep]) {
            n[strRep] = true;
            r.push(array[i]);
        }
    }
    return r;
}

export function Uint8ToString(u8a) : string{
    // from... https://stackoverflow.com/questions/12710001/how-to-convert-uint8-array-to-base64-encoded-string
    let CHUNK_SZ = 0x8000;
    let c = [];
    for (let i=0; i < u8a.length; i+=CHUNK_SZ) {
        c.push(String.fromCharCode.apply(null, u8a.subarray(i, i+CHUNK_SZ)));
    }
    return c.join("");
}

export function StringToUint8(string : string){
    // from... https://jsperf.com/string-to-uint8array

    let uint = new Uint8Array(string.length);
    for(let i=0,j=string.length;i<j;++i){
        uint[i]=string.charCodeAt(i);
    }

    return uint;
}