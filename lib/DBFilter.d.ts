/**
 * Created by Samuel V. Sylvester I on 9/10/2018.
 */
export interface DBFilterEntry {
    fieldName: string;
    text: string;
    value: string | number;
}
/**
 * Immutable class that represents values to filter a data table's rows by
 */
export declare class DBFilter {
    private _map;
    private _clone();
    /**
     *
     * @param {string} fieldName
     * @param {string | number} value
     * @param {string} text
     * @return {this}
     */
    setField(fieldName: string, value: string | number, text?: string): DBFilter;
    merge(newFilter: DBFilter): DBFilter;
    /**
     *
     * @return {string}
     */
    toString(): string;
    toBasicFilter(): any;
    getEntry(fieldName: string): DBFilterEntry;
    getEntriesAsObject(): any;
    getEntriesAsArray(): DBFilterEntry[];
    toBasicString(): string;
}
