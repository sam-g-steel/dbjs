/**
 * Created by sam_g on 6/3/2017.
 */

import * as _ from 'lodash';


class cacheEntry{
    private _accessCount: number;
    private _dataTable: DBTable;

    constructor(dataTable){
        this._dataTable = dataTable;
        this._accessCount = 0;
    }

    get dataTable() : DBTable{
        this._accessCount++;
        return this._dataTable;
    }

    get accessCount() : number{
        return this._accessCount;
    }
}

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

// Deep unique
function  unique(array, hash = false) {
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

/*
Array.prototype["unique"] = function () {
    return _.uniqWith(this, _.isEqual);
};*/

export class DBTable{
    private _data: any[];
    private _cache: cacheEntry[];

    /**
     *
     * @param {any[]} jsonTable
     */
    constructor(jsonTable: any[] = []){
        this._data = jsonTable;
        this._cache = [];
    }


    get count(){
        if(!this._data){
            console.error("this._data is missing... It looks like this instance was not properly constructed!");
            return 0;
        }

        return this._data.length;
    }

    get data(){
        if(!this._data){
            console.error("this._data is missing... It looks like this instance was not properly constructed!");
            return [];
        }

        return this._data.map(row=>row);
    }


    /**
     *
     * @return {DBTable}
     */
    distinct(){
        return new DBTable(unique(this._data));
    }

    /**
     *
     * @param {string} columnName
     * @param amount
     * @return {DBTable}
     */
    incrementColumn(columnName : string, amount : any = 1){
        this._data.forEach(row=>{
            // make sure the row's field exists
            if(row[columnName] == undefined) row[columnName] = 0;

            // increment the fields value
            row[columnName] += amount
        });
        return this;
    }

    /**
     *
     * @param {DBTable} table
     */
    insert(table : DBTable){
        return new DBTable(_.union(this._data, table._data));
    }

    /**
     *
     * @param {DBTable} table
     * @param {string} column
     * @param {boolean} overwrite
     * @return {DBTable}
     */
    mergeTableBy(table : DBTable, column: string, overwrite : boolean = false){
        let results : DBTable = new DBTable(this.data);

        table.data.reverse().forEach(row=>{
            // Are there any rows that already have the same key
            let rowCollisionData = results.whereColumnEquals(column, row[column]);
            let rowCollision = rowCollisionData.count > 0;


            if(rowCollision && !overwrite) {
                return;
            }

            if(!rowCollision){
                results._data.unshift(row);
            }else {
                let insertIndex = results._data.indexOf(rowCollisionData.data[0]);

                results._data[insertIndex] = row;
            }
        });

        return results;
    }

    /**
     *
     * @param {string} column
     * @param {"ASC" | "DESC"} order
     * @return {DBTable}
     */
    orderBy(column: string, order : "ASC" | "DESC" = "ASC"){
        let factor = order.toLowerCase() === "asc" ? 1 : -1;

        let newData = this.data.sort((a, b)=>{
            let aValue=a[column], bValue=b[column];
            if(typeof aValue === "string") aValue = aValue.toLowerCase();
            if(typeof bValue === "string") bValue = bValue.toLowerCase();

            if (aValue < bValue) //sort string ascending
                return -factor;
            if (aValue > bValue)
                return factor;
            return 0 //default return value (no sorting)
        });

        return new DBTable(newData);
    }

    /**
     *
     * @param {string} columnName
     * @return {DBTable}
     */
    removeColumn(columnName : string){
        this._data.forEach(row=>delete row[columnName]);
        return this;
    }

    /**
     *
     * @param {string[]} columns
     * @param {boolean} distinct
     * @return {DBTable}
     */
    select(columns : string[], distinct : boolean = true){

        let result;

        // Caching
        let signature = `select-${distinct}-columns:${JSON.stringify(columns)}`;

        // read from cache
        result = this._readCache(signature);

        // Cache miss
        if(!result) {
            result = this._data.map((row)=>{
                let newRow = {};
                columns.forEach(column => newRow[column] = row[column]);

                return newRow;
            });
            if(distinct) result = unique((result as any));
            this._writeCache(signature, result);
        }

        return result;
    }

    /**
     *
     * @param {string} columnName
     * @param value
     * @return {DBTable}
     */
    setColumn(columnName : string, value : any){
        this._data.forEach(row=>row[columnName] = value);
        return this;
    }

    /**
     *
     * @param {number} count
     * @return {DBTable}
     */
    top(count : number){
        let results = this._data.slice(0, count);

        return new DBTable(results);
    }

    /**
     *
     * @param columnName
     * @param value
     * @return {DBTable}
     */
    whereColumnContains(columnName : string, value : number | string, caseSensitive: boolean = true){
        let results = this._data.filter(row =>{
            let columnValue = row[columnName];
            if(typeof columnValue !== "string") return false;
            if(caseSensitive) return (columnValue as any).includes(value);
            else{
                if(typeof value === "string") value = (value as string).toLowerCase();
                return (columnValue.toLowerCase() as any).includes(value);
            }
        });

        return new DBTable(results);
    }


    /**
     *
     * @param {string} signature
     * @return {DBTable}
     * @private
     */
    private _readCache(signature:string):DBTable{
        let results = this._cache[signature];
        if(results) return results.dataTable || null;
        return null;
    }

    /**
     *
     * @param {string} signature
     * @param {DBTable} dataTable
     * @private
     */
    private _writeCache(signature:string, dataTable:DBTable){
        this._cache[signature] = new cacheEntry(dataTable);
    }

    /**
     *
     * @param columnName
     * @param value
     * @return {DBTable}
     */
    whereColumnEquals(columnName : string, value : number | string){
        let result;

        // Caching
        let signature = `whereColumnEquals-${columnName}:${JSON.stringify(value)}`;

        // read from cache
        result = this._readCache(signature);

        // Cache miss
        if(!result) {
            result = new DBTable(this._data.filter(row => row[columnName] == value));
            this._writeCache(signature, result);
        }

        return result;
    }

    /**
     *
     * @param columnName
     * @param value
     * @return {DBTable}
     */
    whereColumnNotEquals(columnName : string, value : number | string){

        let result;

        // Caching
        let signature = `whereColumnNotEquals-${columnName}:${JSON.stringify(value)}`;

        // read from cache
        result = this._readCache(signature);

        // Cache miss
        if(!result) {
            result = new DBTable(this._data.filter(row => row[columnName] != value));
            this._writeCache(signature, result);
        }

        return result;
    }
}
