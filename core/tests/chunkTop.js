const { DBChunks, DBTable } = require("../lib");


// Create a simple table with values in it
const allData = new DBTable([
    { ID: 1, title: "Mustang", tags: "car,Ford,blue" },
    { ID: 2, title: "Navigator", tags: "suv,Lincoln,black" },
    { ID: 3, title: "F-type", tags: "car,Jaguar,red" },
    { ID: 4, title: "6x6", tags: "truck,Mercedes,white" },
    { ID: 5, title: "Falcon 9", tags: "rocket,Space x,white,black" },
]);

const db = new DBChunks(allData);
db
.top(3)
.applyFilters()
.then(() => {
    console.log(db)
});