import { uniqueRows, Uint8ToString, StringToUint8 } from "./util";
import * as LZMA_LIBc from "lzma/src/lzma-c";
import * as LZMA_LIBd from "lzma/src/lzma-d";
import { SuperArray } from "./SuperArray";
import { getColumnType } from "./ColumnType";
import { orderBy, union } from "lodash";
import { v4 as uuid } from "uuid";

let LZMA = {
    compress: LZMA_LIBc.LZMA.compress,
    decompress: LZMA_LIBd.LZMA.decompress,
};

let btoa;
let atob;

if (typeof atob === "undefined") {
    btoa = require("btoa");
    atob = require("atob");
} else {
    // @ts-ignore
    btoa = window.btoa;
    // @ts-ignore
    atob = window.atob;
}

export class DBTable<rowInterface> {
    protected _data: rowInterface[];
    protected _meta = {
        columnNames: [] as string[],
        columnTypes: {} as any,
    };
    protected _instanceID = uuid();
    protected _formatter?: (row: any) => rowInterface;

    /**
     *
     * @param {any[]} jsonTable
     * @param metaData
     * @param formatter
     */
    constructor(jsonTable: any[] = [], metaData?: any, formatter?: (row: any) => rowInterface) {
        // Copy meta data
        this._meta = { ...metaData };
        if (formatter) {
            this._data = jsonTable.map(row => formatter(row));
        } else {
            this._data = jsonTable;
        }
    }

    get currentConstructor() {
        if (this["__proto__"].constructor) return this["__proto__"].constructor;
        return (this as any).prototype.constructor;
    }

    getColumnTypes() {
        if (!this._meta.columnTypes) {
            const columns: any = {};
            for (const row of this._data) {
                Object.keys(row).forEach(column => {
                    columns[column] = getColumnType(row[column]);
                });
            }
            this._meta.columnTypes = columns;
        }

        return this._meta.columnTypes;
    }

    getColumnNames() {
        if (!this._meta.columnNames || this._meta.columnNames.length === 0) {
            this._meta.columnNames = Object.keys(this.getColumnTypes()).sort((a, b) => (a > b ? 1 : -1));
        }

        return this._meta.columnNames;
    }

    updateMeta() {
        const oldMeta = this._meta;
        this._meta = {} as any;

        // This will create new meta entries for column names and types
        this.getColumnNames();

        // merge the old meta into the new
        this._meta = {
            columnNames: undefined,
            columnTypes: { ...this._meta.columnTypes, ...oldMeta.columnTypes },
        };
        this.getColumnNames();
    }

    /**
     * Number of rows in the table
     */
    get count() {
        return this._data.length;
    }

    get data(): rowInterface[] {
        //return this._data.slice(0);
        return [...this._data];
    }

    /**
     *
     * @return {DBTable}
     */
    distinct() {
        return new DBTable<rowInterface>(uniqueRows(this._data), this._meta);
    }

    /**
     *
     * @param {string} columnName
     * @param amount defaults to 1
     * @return {DBTable}
     */
    incrementColumn(columnName: string, amount: any = 1) {
        this._data.forEach(row => {
            // make sure the row's field exists
            if (row[columnName] == undefined) row[columnName] = 0;

            // increment the fields value
            row[columnName] += amount;
        });
        return this;
    }

    /**
     * Unions current data with data that is passed in
     * @returns a new DBTable with the 'unioned' data
     * @param data - can be a DBTable, a row from a table, or an array of rows
     */
    union(data: DBTable<rowInterface> | rowInterface[] | rowInterface) {
        let metaData = undefined as any;
        let finalData: any[];

        if (data instanceof DBTable) {
            finalData = data._data;
            metaData = { ...this._meta, ...data._meta };
            // merge the old meta into the new
            this._meta = {
                columnNames: undefined,
                columnTypes: { ...this._meta.columnTypes, ...data._meta.columnTypes },
            };
            this.getColumnNames();
        } else if (typeof data === "object") {
            // TODO: add support for this.formatter
            finalData = [data];
        } else {
            // TODO: add support for this.formatter
            finalData = (data as any) as rowInterface[];
        }

        return new DBTable<rowInterface>(union(this._data, finalData), metaData);
    }

    /**
     *
     * @param {DBTable} table
     * @param {string} column
     * @param {boolean} overwrite
     * @return {DBTable}
     */
    mergeTableBy(table: DBTable<any>, column: keyof rowInterface, overwrite: boolean = false) {
        let results: DBTable<rowInterface> = new this.currentConstructor(this.data, { ...this._meta, ...table._meta });

        table.data.reverse().forEach(row => {
            // Are there any rows that already have the same key
            let rowCollisionData = results.whereColumnEquals(column, row[column]);
            let rowCollision = rowCollisionData.count > 0;

            if (rowCollision && !overwrite) {
                return;
            }

            if (!rowCollision) {
                results._data.unshift(row);
            } else {
                let insertIndex = results._data.indexOf(rowCollisionData.data[0]);

                results._data[insertIndex] = { ...results._data[insertIndex], ...row };
            }
        });

        return results;
    }

    /**
     *
     * @param column
     * @param order
     */
    orderBy(column: keyof rowInterface, order: "ASC" | "DESC" = "ASC") {
        let factor = order.toLowerCase() === "asc" ? 1 : -1;

        let newData = orderBy(this.data, [column], [order.toLowerCase()]);

        return new DBTable<rowInterface>(newData, this._meta);
    }

    /**
     *
     * @param column
     * @param order
     */
    shuffle() {
        let newData = this._data.sort(() => (Math.random() > 0.5 ? -1 : 1));
        return new DBTable<rowInterface>(newData, this._meta);
    }

    /**
     *
     * @param {string} columnName
     * @return {DBTable}
     */
    removeColumn(columnName: string) {
        this._meta.columnNames = [];
        delete this._meta.columnTypes[columnName];
        this._data.forEach(row => delete row[columnName]);
        return this;
    }

    /**
     *
     * @param {string[]} columns
     * @param {boolean} distinct defaults to true
     * @return {DBTable}
     */
    select(columns: string[], distinct: boolean = true) {
        // Todo: change distinct to require a value in version 0.6.x and default to false in 1.x.x
        // TODO: support meta changes!!!
        let result = this._data.map(row => {
            let newRow = {};
            columns.forEach(column => (newRow[column] = row[column]));

            return newRow;
        });

        if (distinct) result = uniqueRows(result as any);

        return new this.currentConstructor(result);
    }

    /**
     *
     * @param {string} column
     * @param value
     * @return {DBTable}
     */
    setColumn(column: keyof rowInterface, value: any) {
        this._data.forEach(row => (row[column as string] = value));
        return this;
    }

    /**
     * This is an experimental feature
     * @experimental
     * @param columnName
     */
    public listDistinctValues(columnName: string) {
        const rowsToProcess = this.select([columnName], false);
        const resultsTable = new DBTable<{ value: string; count: number }>();

        //
        rowsToProcess._data.forEach((row, index, array) => {
            let values = row[columnName].split(",");

            for (const value of values) {
                // Has this value already been registered? If so increment its count
                const alreadyRegistered = resultsTable.whereColumnEquals("value", value).incrementColumn("count").count;

                // Otherwise add it to the list
                if (!alreadyRegistered) {
                    resultsTable._data.push({ value, count: 1 });
                }
            }

            console.log(((100 * index) / array.length).toFixed(2) + "% done...");
        });

        return resultsTable.distinct();
    }

    /**
     *
     * @param {number} count
     * @return {DBTable}
     */
    bottom(count: number) {
        let results = this._data.slice(count);

        return new DBTable<rowInterface>(results, this._meta);
    }

    /**
     *
     * @param {number} count
     * @return {DBTable}
     */
    top(count: number) {
        let results = this._data.slice(0, count);

        return new DBTable<rowInterface>(results, this._meta);
    }

    /**
     *
     * @param {number} count
     * @return {DBTable}
     */
    split(count: number) {
        return [this.top(count), this.bottom(count)];
    }

    /**
     *
     * @param {number} count
     * @return {DBTable}
     */
    skip(count: number) {
        let results = this._data.slice(count);

        return new DBTable<rowInterface>(results, this._meta);
    }

    /**
     *
     * @param {string} column
     * @param {number | string} value
     * @param {boolean} caseSensitive
     */
    whereColumnContains(column: keyof rowInterface, value: number | string, caseSensitive: boolean = true) {
        let results = this._data.filter(row => {
            let columnValue = row[column as string];
            if (typeof columnValue !== "string") return false;
            if (caseSensitive) return (columnValue as any).includes(value);
            else {
                if (typeof value === "string") value = (value as string).toLowerCase();
                return (columnValue.toLowerCase() as any).includes(value);
            }
        });

        return new DBTable<rowInterface>(results, this._meta);
    }

    /**
     *
     * @param test
     */
    filter(test: (row: rowInterface) => boolean) {
        return new DBTable<rowInterface>(this._data.filter(test), this._meta);
    }

    /**
     *
     * @param column
     * @param value
     * @return {DBTable}
     */
    whereColumnEquals(column: keyof rowInterface, value: any) {
        return new DBTable<rowInterface>(
            this._data.filter(row => row[column as string] == value),
            this._meta
        );
    }

    /**
     *
     * @param column
     * @param value
     * @return {DBTable}
     */
    whereColumnNotEquals(column: keyof rowInterface, value: any) {
        return new DBTable<rowInterface>(
            this._data.filter(row => row[column as string] != value),
            this._meta
        );
    }

    /**
     *
     * @param {string} column
     * @param {number | string} value
     * @return {this}
     */
    whereColumnGreaterThanEquals(column: keyof rowInterface, value: number | string) {
        return new DBTable<rowInterface>(
            this._data.filter(row => row[column as string] >= value),
            this._meta
        );
    }

    /**
     *
     * @param {string} column
     * @param {number | string} value
     * @return {this}
     */
    whereColumnLessThanEquals(column: keyof rowInterface, value: number | string) {
        return new DBTable<rowInterface>(
            this._data.filter(row => row[column as string] <= value),
            this._meta
        );
    }

    /**
     *
     * @param {string} column
     * @param {number | string} value
     * @return {this}
     */
    whereColumnGreaterThan(column: keyof rowInterface, value: number | string) {
        return new this.currentConstructor(
            this._data.filter(row => row[column as string] > value),
            this._meta
        );
    }

    /**
     *
     * @param {string} column
     * @param {number | string} value
     * @return {this}
     */
    whereColumnLessThan(column: keyof rowInterface, value: number | string) {
        return new this.currentConstructor(
            this._data.filter(row => row[column as string] < value),
            this._meta
        );
    }

    /***
     *
     */
    public static fromJson<rowInterface>(json: string, formatter?: (row: any) => rowInterface) {
        const data = JSON.parse(json || "[]");
        if (data.data) {
            return new DBTable<rowInterface>(data.data, data.meta, formatter);
        } else {
            return new DBTable<rowInterface>(data, undefined, formatter);
        }
    }

    loadLZMA(lzma: number[]) {
        let json = LZMA.decompress(lzma);
        return DBTable.fromJson(json);
    }

    loadLZMAStringB64(string: string) {
        let lzma = atob(string);
        lzma = StringToUint8(lzma);
        lzma = Array["from"](lzma);

        return this.loadLZMA(lzma);
    }

    toJSON(pretty: number = 2) {
        return JSON.stringify(
            {
                data: this._data,
                meta: this._meta,
            },
            null,
            pretty
        );
    }

    /**
     *
     */
    toSuperArrays() {
        const columns = Object.keys(this._data[0]);
        const result: any = {};

        // loop through columns
        for (const columnName of columns) {
            const column = [];

            // loop through rows
            for (const row of this._data) {
                column.push(row[columnName]);
            }

            result[columnName] = new SuperArray(column);
        }

        return result;
    }

    /**
     *
     * @param input
     */
    static fromSuperArrays(input) {
        const columns = Object.keys(input);
        const { length } = input[columns[0]];
        const data: any = [];

        // loop through rows
        for (let i = 0; i < length; i++) {
            const row: any = {};

            // loop through columns
            for (const columnName of columns) {
                row[columnName] = input[columnName][i];
            }

            data.push(row);
        }

        return new DBTable(data);
    }

    toLZMA(compression: number = 1): number[] {
        let json = this.toJSON(0);
        return LZMA.compress(json, compression);
    }

    toLZMAStringB64(compression: number = 1): string {
        let lzma = this.toLZMA(compression);
        let u8 = new Uint8Array(lzma);
        return btoa(Uint8ToString(u8));
    }
}
