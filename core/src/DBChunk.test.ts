const { DBTable, DBChunks } = require("../lib");

// Create a simple table with values in it
const allData = new DBTable([
    { ID: 1, title: "Mustang", tags: "car,Ford,blue" },
    { ID: 2, title: "Navigator", tags: "suv,Lincoln,black" },
    { ID: 3, title: "F-type", tags: "car,Jaguar,red" },
    { ID: 4, title: "6x6", tags: "truck,Mercedes,white" },
    { ID: 5, title: "Falcon 9", tags: "rocket,Space x,white,black" },
]);

test("Create empty DBChunks and convert to array", async () => {
    const db = new DBChunks();
    const array = await db.toArray();
    expect(array?.length).toBe(0);
});

test("Create empty DBChunks and get row count", async () => {
    const db = new DBChunks();
    expect(await db.getFilteredRowCount()).toBe(0);
});

test("Create DBChunks from DBTable and get row count", async () => {
    const db = new DBChunks(allData);
    expect(await db.getFilteredRowCount()).toBe(5);
});

test("Test top", async () => {
    const db = new DBChunks(allData);
    db.top(2);
    // The count should be 5 until the filters are applied
    expect(await db.getFilteredRowCount()).toBe(5);
    await db.applyFilters();
    expect(await db.getFilteredRowCount()).toBe(2);
    db.resetFilters();
    // The the filters have been removed and the count should return to 5
    expect(await db.getFilteredRowCount()).toBe(5);
});

test("Test skip", async () => {
    const db = new DBChunks(allData);
    db.skip(2);
    await db.applyFilters();
    expect(await db.getFilteredRowCount()).toBe(3);
});

test("Test tags", async () => {
    const db = new DBChunks(allData);
    const result = await db.toDBTable();
    expect(result.count).toBe(allData.count);
});
