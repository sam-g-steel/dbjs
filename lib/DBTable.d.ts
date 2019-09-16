export declare class DBTable {
    protected _data: any[];
    /**
     *
     * @param {any[]} jsonTable
     */
    constructor(jsonTable?: any[]);
    readonly currentConstructor: any;
    /**
     * Number of rows in the table
     */
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
     * @param amount defaults to 1
     * @return {DBTable}
     */
    incrementColumn(columnName: string, amount?: any): this;
    /**
     * @deprecated see union() instead
     * @param {DBTable} table
     */
    insert(table: DBTable): any;
    /**
     * Unions current data with data that is passed in
     * @returns a new DBTable with the 'unioned' data
     * @param data - can be a DBTable, a row from a table, or an array of rows
     */
    union(data: DBTable | object[] | object): any;
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
     * @param {"ASC" | "DESC"} order defaults to "ASC"
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
     * @param {boolean} distinct defaults to true
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
     * This is an experimental feature
     * @experimental
     * @param columnName
     */
    listDistinctValues(columnName: string): any;
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
    /***
     * @deprecated This function may be removed or behave differently in future releases.
     * Use DBTable.fromJson(...) instead.
     */
    loadJson(json: string): any;
    /***
     *
     */
    static fromJson(json: string): DBTable;
    loadLZMA(lzma: number[]): any;
    loadLZMAStringB64(string: string): any;
    toJSON(pretty?: number): string;
    toLZMA(compression?: number): number[];
    toLZMAStringB64(compression?: number): string;
}
