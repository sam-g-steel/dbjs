// import { ImageMetadata } from "@action-home/main-server/dist/ImageMetadata";
import * as json5 from "json5";
import { DBTable } from "./DBTable";

export class DBChunk<RowType> {
    ///////////////////////////////////////////
    //////////////// Properties ///////////////

    public mask: boolean = true;

    protected meta: {
        tags?: DBTable<{ value: string; count: number }>;
        rowCount?: number;
        lastUpdate: number;
    };

    protected filteredTable: DBTable<RowType> | undefined;

    protected table: DBTable<RowType>;

    constructor(table: DBTable<RowType>) {
        this.table = table;
        this.meta = { lastUpdate: Date.now() };
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

    /** Returns the metadata table behind this chunck */
    public async getMeta() {
        if (this.meta.tags === undefined) await this.updateTagMetadata();
        if (this.meta.rowCount === undefined) await this.updateCount();
        return this.meta;
    }

    public async getFilteredRowCount() {
        if (this.filteredTable) return this.filteredTable.count;
        return await this.getRowCount();
    }

    public async getRowCount() {
        if (this.meta.rowCount === undefined) await this.updateCount();
        return this.meta.rowCount;
    }

    /** Returns the data rows behind this chunck */
    public async getData() {
        return (await this.getDataTable()).data;
    }

    /** Returns the data rows behind this chunck */
    public async getFilteredData() {
        return (await this.getFilteredDataTable()).data;
    }

    /** Returns the data rows behind this chunck */
    public async getFilteredDataTable() {
        return this.filteredTable || (await this.getDataTable());
    }

    /** Returns the data rows behind this chunck */
    public async resetFilter() {
        delete this.filteredTable;
        this.mask = true;
    }

    /** Returns the data table behind this chunck */
    public async getDataTable() {
        return this.table;
    }

    public async toJsonObject() {
        const meta = await this.getMeta();

        return {
            data: await this.getData(),
            meta: {
                ...meta,
                tags: meta?.tags?.data,
            },
        };
    }

    public async toJsonString(space: number = 0) {
        return json5.stringify(await this.toJsonObject(), undefined, space);
    }

    async updateTagMetadata() {
        try {
            const tagList = (await this.getData())
                // @ts-ignore
                .map(img => img.getAnnotations().filter(a => !a.tag.includes("Discription")))
                .reduce((a, b) => a.union(b))
                .listDistinctValues("tag")
                .orderBy("count", "DESC");

            this.meta.tags = tagList;
            this.meta.lastUpdate = Date.now();
        } catch (error) {
            // console.warn("")
        }
    }

    async updateCount() {
        this.meta.rowCount = (await this.getDataTable()).count;
        this.meta.lastUpdate = Date.now();
    }
}
