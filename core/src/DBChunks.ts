import { chunk, concat } from "lodash";
import { DBChunk } from "./DBChunk";
import { FilterMode, FilterOpp } from "./DBFilterOpps";
import { DBTable } from "./DBTable";
import { Timeout } from "@progressive-promise/core";

export class DBChunks<RowType> {
    ///////////////////////////////////////////
    //////////// Static Properties ////////////

    /** Default chunk size */
    protected static CHUNK_SIZE = 64;

    ///////////////////////////////////////////
    //////////////// Properties ///////////////

    public chunks: DBChunk<RowType>[];

    /** keeps track of filtering operations to apply to the data */
    protected filterStack: FilterOpp<RowType>[] = [];

    protected tags: DBTable<{ value: string; count: number }>;

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

    ///////////////////////////////////////////
    ////////////// Filter Methods /////////////

    public async applyFilters() {
        for (const filterOpp of this.filterStack) {
            //
            if (filterOpp.mode === FilterMode.CHUNK_HAS_TAG) {
                await this.chunkHasTag(filterOpp.tag);
            }
            //
            else if (filterOpp.mode === FilterMode.ROW_FILTER) {
                const chunks = this.getActiveChunks();
                for (const chunk of chunks) {
                    await chunk.applyFilter(filterOpp.filterFunc);
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

        this.filterStack = [];
    }

    public hasTag(tag: string) {
        this.hasTags([tag]);
    }

    public hasTags(tags: string[] | string) {
        if (typeof tags === "string") {
            tags = tags.split(",").map(t => t.trim());
        }

        // Order tags to optimise filtering
        if (this.tags) {
            const tagLookup = this.tags.top(500);
            tags.sort((a, b) => {
                return (
                    (tagLookup.whereColumnEquals("value", a)?.data[0]?.count || 0) -
                    (tagLookup.whereColumnEquals("value", b)?.data[0]?.count || 0)
                );
            });
        }

        // Filter chunks first...
        for (const tag of tags) {
            this.filterStack.push({
                mode: FilterMode.CHUNK_HAS_TAG,
                tag,
            });
        }

        // ...then filter rows
        for (const tag of tags) {
            this.filterStack.push({
                mode: FilterMode.ROW_FILTER,
                filterFunc: (row: RowType) => {
                    // @ts-ignore
                    return !!row.getAnnotation(tag);
                },
            });
        }

        return this;
    }

    /** Clear all filters */
    public resetFilters() {
        // Clear filter stack
        this.filterStack = [];

        for (const chunk of this.chunks) {
            chunk.resetFilter();
        }
    }

    public skip(amount: number) {
        this.filterStack.push({
            mode: FilterMode.SKIP_ROWS,
            value: amount,
        });

        return this;
    }

    public top(amount: number) {
        this.filterStack.push({
            mode: FilterMode.TOP_ROWS,
            value: amount,
        });

        return this;
    }

    ///////////////////////////////////////////
    ////////////// Other Methods //////////////

    protected getActiveChunks() {
        return this.chunks.filter(chunk => chunk.mask);
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
    }

    protected async chunkHasTag(tag: string) {
        for (let i = 0; i < this.chunks.length; i++) {
            const chunk = await this.chunks[i];

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
    public async toArray(reset: boolean = false) {
        const dataChunks: RowType[][] = [];
        for (const chunk of this.chunks) {
            if (chunk.mask) dataChunks.push(await chunk.getFilteredData());
        }

        if (reset) this.resetFilters();

        // @ts-ignore
        return concat(...dataChunks);
    }

    /**
     * Returns a DBTable with rows that satisfies all applied filters
     * @param reset clears filters after creating the returned table - defaults to false
     */
    async toDBTable(reset: boolean = false) {
        return new DBTable<RowType>(await this.toArray(reset));
    }

    /** Adds this class to the global namespace */
    static makeGlobal() {
        // @ts-ignore
        window.DBChunks = DBChunks;
    }
}
