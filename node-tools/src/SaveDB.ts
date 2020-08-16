import { promises as fs } from "fs";
import { lock } from "proper-lockfile";
import { DBTable } from "@dbjs/core/lib";
import { existsSync } from "fs";

export async function SaveDB(filename: string, table: DBTable<any>): Promise<boolean> {
    try {
        // Lock The file if it already exists
        const release = existsSync(filename) ? await lock(filename) : undefined;

        // Write to the file
        await fs.writeFile(filename, table.toJSON(), "utf8");

        // Unlock file if locked
        if (release) await release();
    } catch (e) {
        console.log(e);
        return false;
    }
    return true;
}
