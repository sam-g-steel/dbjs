export enum FilterMode {
    CHUNK_HAS_TAG,
    ROW_FILTER,
    SKIP_ROWS,
    TOP_ROWS,
    MAX_TIME,
}
interface ChunkFilterOpp {
    mode: FilterMode.CHUNK_HAS_TAG;
    tag: string;
}

interface RowFilterOpp<RowType> {
    mode: FilterMode.ROW_FILTER;
    filterFunc: (row: RowType) => boolean;
}

interface WindowFilterOpp {
    mode: FilterMode.TOP_ROWS | FilterMode.SKIP_ROWS;
    value: number;
}

// interface TimeFilterOpp {
//     mode: FilterMode.MAX_TIME;
//     /** Time limit in milliseconds */
//     value: number;
// }

export type FilterOpp<RowType> = ChunkFilterOpp | RowFilterOpp<RowType> | WindowFilterOpp /*| TimeFilterOpp*/;
