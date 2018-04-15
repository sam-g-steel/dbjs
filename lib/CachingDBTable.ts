import {DBTable} from './DBTable';



export class cacheEntry {
    private _accessCount: number;
    private _dataTable: DBTable;

    constructor(dataTable) {
        this._dataTable = dataTable;
        this._accessCount = 0;
    }

    get dataTable(): DBTable {
        this._accessCount++;
        return this._dataTable;
    }

    get accessCount(): number {
        return this._accessCount;
    }
}



export class CachingDBTable extends DBTable{
    protected _cache: cacheEntry[];

    /**
     *
     * @param {any[]} objectArray
     */
    constructor(objectArray: any[] = []){
        //console.log("cache");
        super(objectArray);
        this._cache = [];
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
            result = super.select(columns, distinct);
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
    whereColumnEquals(columnName : string, value : number | string){
        let result;

        // Caching
        let signature = `whereColumnEquals-${columnName}:${JSON.stringify(value)}`;

        // read from cache
        result = this._readCache(signature);

        // Cache miss
        if(!result) {
            result = super.whereColumnEquals(columnName, value);
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
            result = super.whereColumnNotEquals(columnName, value);
            this._writeCache(signature, result);
        }

        return result;
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
}