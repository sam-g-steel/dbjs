import { DBChunks } from "./DBChunks";
import { FilterMode, FilterOpp } from "./DBFilterOpps";
import { getTagsFromRow } from "./util";

export class DBDataRequest<RowType> {
    constructor(db: DBChunks<RowType>) {
        this.db = db;
    }
    startClock() {
        this.startTime = Date.now();
        this.softExpTime = this.softTimeout ? this.startTime + this.softTimeout : 0;
    }

    addOverTime(milliseconds: number) {
        this.softExpTime = this.softTimeout ? Date.now() + milliseconds : 0;
    }

    isExpired() {
        return this.softTimeout && Date.now() > this.softExpTime;
    }

    db: DBChunks<RowType>;

    /** Timelimit in milliseconds, 0 means no limit */
    public softTimeout: number = 0;

    /** Time the request started processing (ms from epoch) */
    public startTime: number;

    /** Maximum time limit for processing chunks (ms from epoch) */
    public softExpTime: number;

    /** keeps track of filtering operations to apply to the data */
    public filterStack: FilterOpp<RowType>[] = [];

    /**
     * Adds filter that requires items have the specified tag
     * @param tag
     */
    public hasTag(tag: string) {
        this.hasTags([tag]);
    }

    /**
     * Adds filter that requires items have the specified tags
     * @param tags
     */
    public hasTags(tags: string[] | string) {
        if (typeof tags === "string") {
            tags = tags.split(",").map(t => t.trim());
        }

        // Order tags to optimise filtering
        if (this.db.tags) {
            const tagLookup = this.db.tags.top(500);
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
                    if ((row as any).getAnnotation) {
                        return !!(row as any).getAnnotation(tag);
                    } else {
                        return !!getTagsFromRow(row).whereColumnEquals("tag", tag).count;
                    }
                },
            });
        }

        return this;
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

    /**
     *
     * @param timelimit in milliseconds
     */
    public setTimeout(timelimit: number) {
        this.softTimeout = timelimit;
    }
}
