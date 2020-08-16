import { promises as fs } from "fs";
import { lock } from "proper-lockfile";
import { DBTable } from "@dbjs/core/lib";
import { existsSync } from "fs";

export async function LoadDB<rowInterface = any>(
    filename: string,
    formatter?: (row: any) => rowInterface
): Promise<DBTable<rowInterface>> {
    try {
        // Lock The file if it already exists
        const release = existsSync(filename) ? await lock(filename) : undefined;

        // Read from the file
        const data = await fs.readFile(filename, "utf8");
        const table = DBTable.fromJson<rowInterface>(data, formatter);

        // Unlock file if locked
        if (release) await release();
        return table;
    } catch (e) {
        console.log(e);
        return;
    }
}
