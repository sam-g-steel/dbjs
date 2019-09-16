import { DBTable } from './DBTable';
export declare class cacheEntry {
    private _accessCount;
    private _dataTable;
    constructor(dataTable: any);
    readonly dataTable: DBTable;
    readonly accessCount: number;
}
export declare class CachingDBTable extends DBTable {
    protected _cache: cacheEntry[];
    /**
     *
     * @param {any[]} objectArray
     */
    constructor(objectArray?: any[]);
    /**
     *
     * @param {string[]} columns
     * @param {boolean} distinct
     * @return {DBTable}
     */
    select(columns: string[], distinct?: boolean): any;
    /**
     *
     * @param columnName
     * @param value
     * @return {DBTable}
     */
    whereColumnEquals(columnName: string, value: number | string): any;
    /**
     *
     * @param columnName
     * @param value
     * @return {DBTable}
     */
    whereColumnNotEquals(columnName: string, value: number | string): any;
    /**
     *
     * @param {string} signature
     * @return {DBTable}
     * @private
     */
    private _readCache;
    /**
     *
     * @param {string} signature
     * @param {DBTable} dataTable
     * @private
     */
    private _writeCache;
}
