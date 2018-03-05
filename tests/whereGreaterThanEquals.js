let {DBTable} = require("../lib/acid-db");
//let {DBTable} = require("../lib/DBTable");

const testCount = 2;
let successCount = 0;

try {
    // Create a simple table with values in it
    const allData = new DBTable([
        {value: 1, letter: "z"},
        {value: 2, letter: "y"},
        {value: 3, letter: "x"},
        {value: 4, letter: "w"},
        {value: 5, letter: "v"},
    ]);
    const geq4Data = new DBTable([
        {value: 4, letter: "w"},
        {value: 5, letter: "v"},
    ]);
    const geqYData = new DBTable([
        {value: 1, letter: "z"},
        {value: 2, letter: "y"},
    ]);
    console.log("data created...");

    if(geq4Data.toJSON(0) === allData.whereColumnGreaterThanEquals("value", 4).toJSON(0)){
        successCount ++;
        console.log("\nNumeric Test Passed!");
    }

    if(geqYData.toJSON(0) === allData.whereColumnGreaterThanEquals("letter", "y").toJSON(0)){
        successCount ++;
        console.log("\nAlpha Test Passed!");
    }


}catch (ex){
    console.log(ex);
}

console.log("\n", `${successCount}/${testCount} completed!`);
process.exit(successCount/testCount);