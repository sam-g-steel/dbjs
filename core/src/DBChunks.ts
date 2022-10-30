import { chunk, concat } from "lodash";
import { DBChunk } from "./DBChunk";
import { FilterMode } from "./DBFilterOpps";
import { DBTable } from "./DBTable";
import { Timeout } from "@progressive-promise/core";
import { DBDataRequest } from "./DBDataRequest";

export class DBChunks<RowType> {
    ///////////////////////////////////////////
    //////////// Static Properties ////////////

    /** Default chunk size */
    protected static CHUNK_SIZE = 64;

    ///////////////////////////////////////////
    //////////////// Properties ///////////////

    public chunks: DBChunk<RowType>[];

    public tags: DBTable<{ value: string; count: number }>;

    ///////////////////////////////////////////
    ///////////////// Methods /////////////////

    constructor(table?: DBTable<RowType>) {
        if (table) {
            this.chunks = [];
            const dataChunks = chunk(table.data, DBChunks.CHUNK_SIZE);

            for (const data of dataChunks) {
                this.chunks.push(new DBChunk(new DBTable(data)));
            }
        }
    }

    newDataRequest(): DBDataRequest<RowType> {
        return new DBDataRequest(this);
    }

    ///////////////////////////////////////////
    ////////////// Filter Methods /////////////

    private async applyFilters(request: DBDataRequest<RowType>) {
        request.startClock();
        for (const filterOpp of request.filterStack) {
            //
            if (filterOpp.mode === FilterMode.CHUNK_HAS_TAG) {
                await this.chunkHasTag(filterOpp.tag, request.softExpTime);
            }
            //
            else if (filterOpp.mode === FilterMode.ROW_FILTER) {
                request.addOverTime(Math.max(request.softTimeout / 10, 30));
                const chunks = this.getActiveChunks();
                for (const chunk of chunks) {
                    // Respect time limits
                    if (request.isExpired()) {
                        // We are out of time so mask off the remaining chunks
                        chunk.mask = false;
                        console.info(`ROW_FILTER - Out of time!`);
                    } else {
                        await chunk.applyFilter(filterOpp.filterFunc);
                    }
                }
            }
            //
            else if (filterOpp.mode === FilterMode.TOP_ROWS) {
                let rowsLeft = filterOpp.value;

                // Loop through chunks
                const chunks = this.getActiveChunks();
                for (const chunk of chunks) {
                    if (rowsLeft === 0) {
                        chunk.mask = false;
                        continue;
                    }
                    const count = await chunk.getFilteredRowCount();
                    if (rowsLeft < count) {
                        await chunk.top(rowsLeft);
                        rowsLeft = 0;
                    } else {
                        rowsLeft -= count;
                    }
                }
            }
            //
            else if (filterOpp.mode === FilterMode.SKIP_ROWS) {
                let rowsLeft = filterOpp.value;

                // Loop through chunks
                const chunks = this.getActiveChunks();
                for (const chunk of chunks) {
                    // If there are no more rows to skip break from loop
                    if (rowsLeft === 0) break;

                    const count = await chunk.getFilteredRowCount();
                    if (rowsLeft < count) {
                        await chunk.skip(rowsLeft);
                        rowsLeft = 0;
                    } else {
                        chunk.mask = false;
                        rowsLeft -= count;
                    }
                }
            }
        }
    }

    /** Clear all filters */
    private resetFilters() {
        if (!this.chunks) return;
        for (const chunk of this.chunks) {
            chunk.resetFilter();
        }
    }

    ///////////////////////////////////////////
    ////////////// Other Methods //////////////

    protected getActiveChunks() {
        return this.chunks?.filter(chunk => chunk.mask) || [];
    }

    public async getFilteredRowCount() {
        const activeChunks = this.getActiveChunks();
        let rowCount = 0;
        for (const chunk of activeChunks) {
            rowCount += await chunk.getFilteredRowCount();
        }

        return rowCount;
    }

    public async *tagTableGenerator() {
        const tagsWasEmpty = !this.tags;
        let results = new DBTable<{ value: string; count: number }>();
        for (const chunk of this.chunks) {
            // Get tags from chunk
            const chunkTags = (await chunk.getMeta()).tags.data;

            // Merge into results table
            for (const tag of chunkTags) {
                let tagEntry = results.whereColumnEquals("value", tag.value).top(1).data[0];
                if (!tagEntry) {
                    tagEntry = { value: tag.value, count: 0 };
                    // @ts-ignore Todo: fix
                    results._data.push(tagEntry);
                }
                tagEntry.count += tag.count;
            }

            // Yield
            results = results.orderBy("count", "DESC");
            if (tagsWasEmpty) this.tags = results;
            yield results;
        }

        //
        this.tags = results;
        return results;
    }

    async updateTags() {
        const gen = this.tagTableGenerator();
        while (!(await gen.next()).done) {
            await Timeout(5);
        }

        return this.tags;
    }

    async genColumnIndexes(columns: (keyof RowType)[], updateIndexes: boolean = false) {
        for (let i = 0; i < this.chunks.length; i++) {
            const chunk = this.chunks[i];

            await chunk.getColumnIndexes(columns, updateIndexes);
            await Timeout(15);
        }
    }

    protected async chunkHasTag(tag: string, expTime: number = 0) {
        for (let i = 0; i < this.chunks.length; i++) {
            const chunk = this.chunks[i];

            if (expTime && Date.now() >= expTime) {
                // Looks like we are out of time!
                // Mask out the rest of the chunks
                chunk.mask = false;
                console.info(`chunkHasTag(${tag}) - Out of time!`);
            }

            if (!chunk.mask) continue;

            // Does this chunk have the tag
            const tags = (await chunk.getMeta()).tags;
            chunk.mask = tags.whereColumnEquals("value", tag).count > 0;
        }

        return this;
    }

    /**
     * Returns an array of rows that satisfies all applied filters
     * @param reset clears filters after creating the returned array - defaults to false
     */
    public async toArray(request: DBDataRequest<RowType> = this.newDataRequest()) {
        await this.applyFilters(request);
        // const expTime = request.softTimeout ? request.startTime + request.softTimeout : 0;

        // Get filtered data from chunks, this opperation can be slow because some chuncks may not be in memory
        // Don't forget to allow a little bit of overtime
        const dataChunks: RowType[][] = [];
        request.addOverTime(Math.max(request.softTimeout / 10, 30));
        for (const chunk of this.chunks || []) {
            if (chunk.mask) dataChunks.push(await chunk.getFilteredData());

            // Respect time limits
            if (request.isExpired()) {
                console.info(`toArray() - Out of time!`);
                break;
            }
        }

        // We're done filtering, restore the state
        this.resetFilters();

        //
        return concat(...dataChunks);
    }

    /**
     * Returns a DBTable with rows that satisfies all applied filters
     * @param reset clears filters after creating the returned table - defaults to false
     */
    async toDBTable(request: DBDataRequest<RowType> = this.newDataRequest()) {
        return new DBTable<RowType>(await this.toArray(request));
    }

    /** Adds this class to the global namespace */
    static makeGlobal() {
        // @ts-ignore
        window.DBChunks = DBChunks;
    }
}
