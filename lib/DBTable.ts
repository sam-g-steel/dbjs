import { uniqueRows, Uint8ToString, StringToUint8 } from './util';
import * as _ from 'lodash';
import * as LZMA_LIBc from "lzma/src/lzma-c";
import * as LZMA_LIBd from "lzma/src/lzma-d";


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
        return new this.currentConstructor(_.union(this._data, table._data));
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
     * @param {boolean} distinct
     * @return {DBTable}
     */
    select(columns : string[], distinct : boolean = true){

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

        return new this.currentConstructor(results);
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

        return new this.currentConstructor(results);
    }

    /**
     *
     * @param columnName
     * @param value
     * @return {DBTable}
     */
    whereColumnEquals(columnName : string, value : number | string){
        return new this.currentConstructor(this._data.filter(row => row[columnName] == value));
    }

    /**
     *
     * @param columnName
     * @param value
     * @return {DBTable}
     */
    whereColumnNotEquals(columnName : string, value : number | string){
        return new this.currentConstructor(this._data.filter(row => row[columnName] != value));
    }

    loadJson(json:string){
        json = JSON.parse(json);
        return new this.currentConstructor(json);
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