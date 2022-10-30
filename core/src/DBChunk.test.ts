import { DBChunk } from "./DBChunk";

import { DBTable, DBChunks } from "./";

// Create a simple table with values in it
const allData = new DBTable([
    { ID: 1, title: "Mustang", tags: "car,Ford,blue" },
    { ID: 2, title: "Navigator", tags: "suv,Lincoln,black" },
    { ID: 3, title: "F-type", tags: "car,Jaguar,red" },
    { ID: 4, title: "6x6", tags: "truck,Mercedes,white" },
    { ID: 5, title: "Falcon 9", tags: "rocket,Space x,white,black" },
]);

test("Create empty DBChunk", async () => {
    const chunk = new DBChunk();

    const array = await chunk.getData();
    expect(array?.length).toBe(0);
});

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
    // Build the DB
    const db = new DBChunks(allData);

    // Request data
    const req = db.newDataRequest();
    const data = await db.toArray(req);

    // Request filtered data
    req.top(2);
    const filteredData = await db.toArray(req);

    // The count should be 5 until the filters are applied
    expect(data.length).toBe(5);

    expect(filteredData.length).toBe(2);
});

test("Test skip", async () => {
    // Build the DB
    const db = new DBChunks(allData);

    // Request filtered data
    const req = db.newDataRequest();
    req.skip(2);
    const filteredData = await db.toArray(req);

    // The count should be 3
    expect(filteredData.length).toBe(3);
});

test("Test hasTag", async () => {
    const db = new DBChunks(allData);

    // Request filtered data
    const req = db.newDataRequest();
    req.hasTag("car");
    const filteredData = await db.toArray(req);

    expect(filteredData.length).toBe(2);
});

test("Test hasTags", async () => {
    const db = new DBChunks(allData);

    // Updating tags before building a request object helps optimise the req
    await db.updateTags();

    // Request filtered data
    const req = db.newDataRequest();
    req.hasTags("car,red");
    const filteredData = await db.toArray(req);

    expect(filteredData.length).toBe(1);
});

test("Test hasTags timeout test 1", async () => {
    const db = new DBChunks(allData);

    // Updating tags before building a request object helps optimise the req
    await db.updateTags();

    // Request filtered data
    const req = db.newDataRequest();

    // One second should be plenty of time!
    req.setTimeout(1000);

    req.hasTags("car,red");
    const filteredData = await db.toArray(req);

    expect(filteredData.length).toBe(1);
});
