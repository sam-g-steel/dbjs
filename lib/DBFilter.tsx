/**
 * Created by Samuel V. Sylvester I on 9/10/2018.
 */

export interface DBFilterEntry{
    // Name of the field to filter
    fieldName: string,

    // Text that represents the value in a human friendly format
    text: string,

    // TODO: ???
    value: string | number,
}

/**
 * Immutable class that represents values to filter a data table's rows by
 */
export class DBFilter {
    private _map : any = {};

    private _clone() {
        // Create new DBFilter
        let result = new DBFilter();

        // Copy over entries
        result._map = {...this._map};

        return result;
    }

    /**
     *
     * @param {string} fieldName
     * @param {string | number} value
     * @param {string} text
     * @return {this}
     */
    public setField(fieldName:string, value: string | number, text: string = value.toString()){
        // Make sure
        if(!fieldName){
            console.error("fieldName must have a value!");
            return this;
        }

        // Create new DBFilter
        let result = this._clone();

        // If the new value is undefined remove it from the filter
        if(value === undefined){
            delete result._map[fieldName];
        }

        // Set the field to the new value
        else {
            result._map[fieldName] = {fieldName, text, value};
        }

        // Return new filter
        if(result.toString() === this.toString()){
            // Return the current filter if it is the same as the new one
            return this;
        }else {
            // Otherwise, return the new filter
            return result;
        }
    }

    public merge(newFilter : DBFilter){
        //
        const entries = Object.values(newFilter._map) as DBFilterEntry[];
        let result : DBFilter = this;

        //
        for(let entry of entries){
            result = result.setField(
                entry.fieldName,
                entry.value,
                entry.text
            );
        }

        //
        return result;
    }

    /**
     *
     * @return {string}
     */
    public toString(){
        return JSON.stringify(this._map);
    }

    public toBasicFilter(){
        //
        const entries = Object.values(this._map) as DBFilterEntry[];
        const result = {};

        //
        for(let entry of entries){
            result[entry.fieldName] = entry.value;
        }

        return result;
    }

    public toBasicString(){
        return JSON.stringify(this.toBasicFilter());
    }
}
