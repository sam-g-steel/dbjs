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
    const gt4Data = new DBTable([
        {value: 5, letter: "v"},
    ]);
    const gtYData = new DBTable([
        {value: 1, letter: "z"},
    ]);
    console.log("data created...");

    if(gt4Data.toJSON(0) === allData.whereColumnGreaterThan("value", 4).toJSON(0)){
        successCount ++;
        console.log("\nNumeric Test Passed!");
    }

    if(gtYData.toJSON(0) === allData.whereColumnGreaterThan("letter", "y").toJSON(0)){
        successCount ++;
        console.log("\nAlpha Test Passed!");
    }

}catch (ex){
    console.log(ex);
}

console.log("\n", `${successCount}/${testCount} completed!`);
process.exit(successCount/testCount);