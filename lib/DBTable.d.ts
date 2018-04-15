export declare class DBTable {
    protected _data: any[];
    /**
     *
     * @param {any[]} jsonTable
     */
    constructor(jsonTable?: any[]);
    readonly currentConstructor: any;
    readonly count: number;
    readonly data: any[];
    /**
     *
     * @return {DBTable}
     */
    distinct(): any;
    /**
     *
     * @param {string} columnName
     * @param amount
     * @return {DBTable}
     */
    incrementColumn(columnName: string, amount?: any): this;
    /**
     *
     * @param {DBTable} table
     */
    insert(table: DBTable): any;
    /**
     *
     * @param {DBTable} table
     * @param {string} column
     * @param {boolean} overwrite
     * @return {DBTable}
     */
    mergeTableBy(table: DBTable, column: string, overwrite?: boolean): DBTable;
    /**
     *
     * @param {string} column
     * @param {"ASC" | "DESC"} order
     * @return {DBTable}
     */
    orderBy(column: string, order?: "ASC" | "DESC"): any;
    /**
     *
     * @param {string} columnName
     * @return {DBTable}
     */
    removeColumn(columnName: string): this;
    /**
     *
     * @param {string[]} columns
     * @param {boolean} distinct
     * @return {DBTable}
     */
    select(columns: string[], distinct?: boolean): any;
    /**
     *
     * @param {string} column
     * @param value
     * @return {DBTable}
     */
    setColumn(column: string, value: any): this;
    /**
     *
     * @param {number} count
     * @return {DBTable}
     */
    top(count: number): any;
    /**
     *
     * @param {string} column
     * @param {number | string} value
     * @param {boolean} caseSensitive
     */
    whereColumnContains(column: string, value: number | string, caseSensitive?: boolean): any;
    /**
     *
     * @param column
     * @param value
     * @return {DBTable}
     */
    whereColumnEquals(column: string, value: number | string): any;
    /**
     *
     * @param column
     * @param value
     * @return {DBTable}
     */
    whereColumnNotEquals(column: string, value: number | string): any;
    /**
     *
     * @param {string} column
     * @param {number | string} value
     * @return {this}
     */
    whereColumnGreaterThanEquals(column: string, value: number | string): this;
    /**
     *
     * @param {string} column
     * @param {number | string} value
     * @return {this}
     */
    whereColumnLessThanEquals(column: string, value: number | string): this;
    /**
     *
     * @param {string} column
     * @param {number | string} value
     * @return {this}
     */
    whereColumnGreaterThan(column: string, value: number | string): this;
    /**
     *
     * @param {string} column
     * @param {number | string} value
     * @return {this}
     */
    whereColumnLessThan(column: string, value: number | string): this;
    loadJson(json: string): any;
    loadLZMA(lzma: number[]): any;
    loadLZMAStringB64(string: string): any;
    toJSON(pretty?: number): string;
    toLZMA(compression?: number): number[];
    toLZMAStringB64(compression?: number): string;
}
