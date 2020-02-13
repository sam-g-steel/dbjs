/**
 * @author Samuel .V Sylvester Sr.
 * This class was originally created in November 2017 to help with developing
 * a machine learning application for three.js rectarea light data compression
 * and other applications.
 */
export declare class SuperArray<t> extends Array<t> {
    readonly _isSuperArray = true;
    constructor(array: any);
    /**
     * Returns a new array with the absolute values of the old array
     */
    abs: () => number[];
    /**
     * Returns the average value of the elements in the array
     */
    avg: () => number;
    /**
     * Returns the first element of the array
     * @return {t}
     */
    first: () => t;
    getClamped(index: any): t;
    indexOfMax(): number;
    /**
     * Returns the last element in the array
     * @return {t}
     */
    last: () => t;
    /**
     * Returns the maximum value of the elements in the array
     */
    max: () => number;
    /**
     * Returns the minimum value of the elements in the array
     */
    min: () => number;
    normalize: () => SuperArray<number>;
    shiftArrayMAD(shift: any, multiply: any, addArray: any): any[];
    /**
     * Returns the sum of the elements in the array
     */
    sum: () => number;
    toFixed(a: any): number[];
    /**
     * Returns an array based on the original with only unique values
     */
    unique: () => SuperArray<t>;
}
