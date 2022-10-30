// import { ImageMetadata } from "@action-home/main-server/dist/ImageMetadata";
import * as json5 from "json5";
import _ = require("lodash");
import { getTagsFromRow } from "./util";
import { DBTable } from "./DBTable";

export interface DBChunkMeta<RowType> {
    tags?: DBTable<{ value: string; count: number }>;
    rowCount?: number;
    lastUpdate: number;
    indexes?: { [key: string]: any };
}

export class DBChunk<RowType> {
    ///////////////////////////////////////////
    //////////////// Properties ///////////////

    public mask: boolean = true;

    protected meta?: DBChunkMeta<RowType>;

    protected filteredTable?: DBTable<RowType> | undefined;

    protected table?: DBTable<RowType>;

    constructor(table?: DBTable<RowType>) {
        if (!table) {
        } else {
            this.table = table;
            this.meta = { lastUpdate: Date.now(), indexes: {}, rowCount: table.count };
        }
    }

    async getColumnIndex(column: keyof RowType, updateIndexes: boolean = false) {
        if (this?.meta?.indexes[column as string] === undefined || updateIndexes) {
            // Get data to index
            let dbTable = await this.getDataTable();
            dbTable = dbTable.select([column.toString()], true);
            const newMeta = {
                lastUpdate: Date.now(),
                indexes: { ...this?.meta?.indexes, [column]: dbTable.data.map(row => row[column]) },
            };

            // Add index to list
            this.meta = { ...this.meta, ...newMeta };
        }

        return this?.meta?.indexes[column as string];
    }

    async getColumnIndexes(columns: (keyof RowType)[], updateIndexes: boolean = false) {
        const indexes: { [key: string]: any } = {};

        for (const column of columns) {
            indexes[column as string] = await this.getColumnIndex(column, updateIndexes);
        }

        return indexes;
    }

    public async applyFilter(filter: (RowType) => boolean) {
        const filteredTable = await this.getFilteredDataTable();
        this.filteredTable = filteredTable.filter(filter);
    }

    public async top(count: number) {
        const filteredTable = await this.getFilteredDataTable();
        this.filteredTable = filteredTable.top(count);
    }

    public async skip(count: number) {
        const filteredTable = await this.getFilteredDataTable();
        this.filteredTable = filteredTable.skip(count);
    }

    /** Returns the metadata table behind this chunk */
    public async getMeta() {
        if (this.meta.tags === undefined) await this.updateTagMetadata();
        if (this.meta.rowCount === undefined) await this.updateCount();
        return this.meta;
    }

    public touch(ms: number = Date.now()) {
        this.meta.lastUpdate = ms;
    }

    public async getFilteredRowCount() {
        if (this.filteredTable) return this.filteredTable.count;
        return await this.getRowCount();
    }

    public async getRowCount() {
        if (this?.meta?.rowCount === undefined) await this.updateCount();
        return this.meta.rowCount;
    }

    /** Returns the data rows behind this chunk */
    public async getData() {
        return (await this.getDataTable())?.data || [];
    }

    /** Returns the data rows behind this chunk */
    public async getFilteredData() {
        return (await this.getFilteredDataTable()).data;
    }

    /** Returns the data rows behind this chunk */
    public async getFilteredDataTable() {
        return this.filteredTable || (await this.getDataTable());
    }

    /** Returns the data rows behind this chunk */
    public resetFilter() {
        delete this.filteredTable;
        this.mask = true;
    }

    /** Returns the data table behind this chunk */
    public async getDataTable() {
        return this.table;
    }

    public async toJsonObject({ noData }: { noData: boolean } = { noData: false }) {
        const meta = await this.getMeta();

        const result: {
            meta: {
                tags: {
                    value: string;
                    count: number;
                }[];
                rowCount?: number;
                lastUpdate: number;
            };
            data?: RowType[];
        } = {
            meta: {
                ...meta,
                tags: meta?.tags?.data || [],
            },
        };

        if (!noData) {
            result.data = await this.getData();
        }

        return result;
    }

    public async toJsonString(space: number = 0) {
        return json5.stringify(await this.toJsonObject(), undefined, space);
    }

    async updateTagMetadata() {
        try {
            const newTags = (await this.getData())
                // @ts-ignore
                .map(img => getTagsFromRow(img).filter(a => !a.tag.includes("Discription")))
                .reduce((a, b) => a.union(b))
                .listDistinctValues("tag")
                .orderBy("count", "DESC");

            if (!_.isEqual(this.meta.tags, newTags)) {
                this.meta.tags = newTags;
                this.meta.lastUpdate = Date.now();
            }
        } catch (error) {
            console.warn(error);
        }
    }

    async updateCount() {
        const newCount = (await this.getDataTable()).count;
        if (newCount !== this.meta.rowCount) {
            this.meta.rowCount = newCount;
            this.meta.lastUpdate = Date.now();
        }
    }
}
