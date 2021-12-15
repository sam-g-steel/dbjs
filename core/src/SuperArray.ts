/**
 * @author Samuel .V Sylvester Sr.
 * This class was originally created in November 2017 to help with developing
 * a machine learning application for three.js rectarea light data compression
 * and other applications.
 */

export class SuperArray<t> extends Array<t> {
    public readonly _isSuperArray = true;

    constructor(array) {
        // init array
        super();

        // fill array with the data that was passed in
        for (const element of array) {
            this.push(element);
        }
    }

    /**
     * Returns a new array with the absolute values of the old array
     */
    public abs = () => {
        return this.map((x: any) => Math.abs(x));
    };

    /**
     * Returns the average value of the elements in the array
     */
    public avg = () => {
        return this.sum() / (this.length || 1);
    };

    /**
     * Returns the first element of the array
     * @return {t}
     */
    public first = () => {
        return this[0] as t;
    };

    /**
     * Returns the element at the indexes location
     * @param index
     */
    public getClamped(index) {
        const length = this.length;

        if (index < 0) {
            return this.first();
        } else if (index >= length) {
            return this.last();
        } else {
            return this[index];
        }
    }

    public indexOfMax() {
        return this.indexOf(this.max() as any);
    }

    /**
     * Returns the last element in the array
     * @return {t}
     */
    public last = () => {
        return this[this.length - 1];
    };

    /**
     * Returns the maximum value of the elements in the array
     */
    public max = () => {
        let res = this[0];

        for (let i = 1; i < this.length; i++) {
            let next = this[i];
            res = res > next ? res : next;
        }

        return (res as any) as number;
    };

    /**
     * Returns the minimum value of the elements in the array
     */
    public min = () => {
        let res = this[0];

        for (let i = 1; i < this.length; i++) {
            let next = this[i];
            res = res < next ? res : next;
        }

        return (res as any) as number;
    };

    public normalize = () => {
        const max = this.max();
        const min = this.min();
        const range = max - min || 1;
        const result: number[] = [];

        for (let i = 0; i < this.length; i++) {
            result.push((+this[i] - min) / range);
        }

        return new SuperArray<number>(result);
    };

    public shiftArrayMAD(shift, multiply, addArray) {
        if (multiply === undefined) {
            multiply = 1;
        }
        if (!addArray) {
            addArray = [0];
        }

        if (!addArray._isSuperArray) {
            addArray = new SuperArray(addArray);
            addArray.push(0);
        }

        return this.map((o, i) => {
            return (this.getClamped(i - shift) as any) * multiply + addArray.getClamped(i);
        });
    }

    /**
     * Returns the sum of the elements in the array
     */
    public sum = () => {
        return (this.reduce((a: any, b: any) => a + b) as any) as number;
    };

    public toFixed(a) {
        return this.map((x: any) => +x.toFixed(a));
    }

    /**
     * Returns an array based on the original with only unique values
     */
    public unique = () => {
        const n = {},
            r = [];
        for (var i = 0; i < this.length; i++) {
            // Use a hash based on the actual data
            // in the object, not the object's memory address or instance id
            // This ensures that the objects are truly unique
            var strRep = JSON.stringify(this[i]);
            if (!n[strRep]) {
                n[strRep] = true;
                r.push(this[i]);
            }
        }
        return new SuperArray<t>(r);
    };
}
