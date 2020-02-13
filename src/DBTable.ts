import { uniqueRows, Uint8ToString, StringToUint8 } from './util';
import * as _ from 'lodash';
import * as LZMA_LIBc from "lzma/src/lzma-c";
import * as LZMA_LIBd from "lzma/src/lzma-d";
import {SuperArray} from "./SuperArray";


let LZMA = {
        compress: LZMA_LIBc.LZMA.compress,
        decompress: LZMA_LIBd.LZMA.decompress
    };

let btoa;
let atob;

if(typeof atob === "undefined"){
    btoa = require("btoa");
    atob = require("atob");
}else {
    btoa = window.btoa;
    atob = window.atob;
}


export class DBTable{
    protected _data: any[];

    /**
     *
     * @param {any[]} jsonTable
     */
    constructor(jsonTable: any[] = []){
        this._data = jsonTable;
    }

    get currentConstructor(){
        if(this["__proto__"].constructor) return this["__proto__"].constructor;
        return (this as any).prototype.constructor;
    }

    /**
     * Number of rows in the table
     */
    get count(){
        return this._data.length;
    }

    get data(){
        //return this._data.slice(0);
        return [...this._data];
    }

    /**
     *
     * @return {DBTable}
     */
    distinct(){
        return new this.currentConstructor(uniqueRows(this._data));
    }

    /**
     *
     * @param {string} columnName
     * @param amount defaults to 1
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
     * @deprecated see union() instead
     * @param {DBTable} table
     */
    insert(table : DBTable){
        return new this.currentConstructor(_.union(this._data, table._data));
    }

    /**
     * Unions current data with data that is passed in
     * @returns a new DBTable with the 'unioned' data
     * @param data - can be a DBTable, a row from a table, or an array of rows
     */
    union(data : DBTable | object[] | object)
    {
        let finalData : any[];
        if(data instanceof DBTable){
            finalData = data._data
        }else if(typeof data === "object"){
            finalData = [data];
        }else{
            finalData = data;
        }
        return new this.currentConstructor(_.union(this._data, finalData));
    }

    /**
     *
     * @param {DBTable} table
     * @param {string} column
     * @param {boolean} overwrite
     * @return {DBTable}
     */
    mergeTableBy(table : DBTable, column: string, overwrite : boolean = false){
        let results : DBTable = new this.currentConstructor(this.data);

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

                results._data[insertIndex] = {...results._data[insertIndex], ...row};
            }
        });

        return results;
    }

    /**
     *
     * @param {string} column
     * @param {"ASC" | "DESC"} order defaults to "ASC"
     * @return {DBTable}
     */
    orderBy(column: string, order : "ASC" | "DESC" = "ASC"){
        let factor = order.toLowerCase() === "asc" ? 1 : -1;

        let newData = _.orderBy(this.data, [column], [order.toLowerCase()]);

        return new this.currentConstructor(newData);
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
     * @param {boolean} distinct defaults to true
     * @return {DBTable}
     */
    select(columns : string[], distinct : boolean = true){
        // Todo: change distinct to require a value in version 0.6.x and default to false in 1.x.x
        let result = this._data.map((row)=>{
            let newRow = {};
            columns.forEach(column => newRow[column] = row[column]);

            return newRow;
        });

        if(distinct) result = uniqueRows((result as any));

        return new this.currentConstructor(result);
    }

    /**
     *
     * @param {string} column
     * @param value
     * @return {DBTable}
     */
    setColumn(column : string, value : any){
        this._data.forEach(row=>row[column] = value);
        return this;
    }

    /**
     * This is an experimental feature
     * @experimental
     * @param columnName
     */
    public listDistinctValues(columnName: string){
        const rowsToProcess = this.select([columnName]);
        const resultsTable = new DBTable;

        //
        rowsToProcess._data.forEach((row)=>{
            let values = row[columnName].split(",");

            values.forEach(value=>{
                // Has this value already been registered? If so increment its count
                const alreadyRegistered = resultsTable
                    .whereColumnEquals("value", value)
                    .incrementColumn("count")
                    .count;

                // Otherwise add it to the list
                if(!alreadyRegistered){
                    resultsTable._data.push({value, count: 1});
                }
            });
        });

        return resultsTable.distinct();
    }

    /**
     *
     * @param {number} count
     * @return {DBTable}
     */
    top(count : number){
        let results = this._data.slice(0, count);

        return new this.currentConstructor(results);
    }

    /**
     *
     * @param {string} column
     * @param {number | string} value
     * @param {boolean} caseSensitive
     */
    whereColumnContains(column : string, value : number | string, caseSensitive: boolean = true){
        let results = this._data.filter(row =>{
            let columnValue = row[column];
            if(typeof columnValue !== "string") return false;
            if(caseSensitive) return (columnValue as any).includes(value);
            else{
                if(typeof value === "string") value = (value as string).toLowerCase();
                return (columnValue.toLowerCase() as any).includes(value);
            }
        });

        return new this.currentConstructor(results);
    }

    /**
     *
     * @param column
     * @param value
     * @return {DBTable}
     */
    whereColumnEquals(column : string, value : any){
        return new this.currentConstructor(this._data.filter(row => row[column] == value));
    }

    /**
     *
     * @param column
     * @param value
     * @return {DBTable}
     */
    whereColumnNotEquals(column : string, value : any){
        return new this.currentConstructor(this._data.filter(row => row[column] != value));
    }

    /**
     *
     * @param {string} column
     * @param {number | string} value
     * @return {this}
     */
    whereColumnGreaterThanEquals(column : string, value : number | string) : this{
        return new this.currentConstructor(this._data.filter(row => row[column] >= value));
    }

    /**
     *
     * @param {string} column
     * @param {number | string} value
     * @return {this}
     */
    whereColumnLessThanEquals(column : string, value : number | string) : this{
        return new this.currentConstructor(this._data.filter(row => row[column] <= value));
    }

    /**
     *
     * @param {string} column
     * @param {number | string} value
     * @return {this}
     */
    whereColumnGreaterThan(column : string, value : number | string) : this{
        return new this.currentConstructor(this._data.filter(row => row[column] > value));
    }

    /**
     *
     * @param {string} column
     * @param {number | string} value
     * @return {this}
     */
    whereColumnLessThan(column : string, value : number | string) : this{
        return new this.currentConstructor(this._data.filter(row => row[column] < value));
    }

    /***
     * @deprecated This function may be removed or behave differently in future releases.
     * Use DBTable.fromJson(...) instead.
     */
    loadJson(json:string){
        json = JSON.parse(json);
        return new this.currentConstructor(json);
    }

    /***
     *
     */
    public static fromJson(json:string){
        const data = JSON.parse(json);
        return new DBTable(data);
    }

    loadLZMA(lzma : number[]){
        let json = LZMA.decompress(lzma);
        return this.loadJson(json);
    }

    loadLZMAStringB64(string : string){
        let lzma = atob(string);
        lzma = StringToUint8(lzma);
        lzma = Array["from"](lzma);

        return this.loadLZMA(lzma);
    }

    toJSON(pretty : number = 2){
        return JSON.stringify(this._data, null, pretty as any);
    }

    /**
     *
     */
    toSuperArrays(){
        const columns = Object.keys(this._data[0]);
        const result:any = {};

        // loop through columns
        for(const columnName of columns){
            const column = [];

            // loop through rows
            for(const row of this._data){
                column.push(row[columnName])
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
        for (let i=0; i < length; i++) {
            const row: any = {};

            // loop through columns
            for (const columnName of columns) {
                row[columnName] = input[columnName][i];
            }

            data.push(row);
        }

        return new DBTable(data)
    }

    toLZMA(compression : number = 1) : number[]{
        let json = this.toJSON(0);
        return LZMA.compress(json, compression);
    }

    toLZMAStringB64(compression : number = 1):string{
        let lzma = this.toLZMA(compression);
        let u8 = new Uint8Array(lzma);
        return btoa(Uint8ToString(u8));
    }
}
