export enum FilterMode {
    CHUNK_HAS_TAG,
    ROW_FILTER,
    SKIP_ROWS,
    TOP_ROWS,
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

export type FilterOpp<RowType> = ChunkFilterOpp | RowFilterOpp<RowType> | WindowFilterOpp;
