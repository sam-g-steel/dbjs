let {DBTable} = require("../lib");

const testCount = 1;
let successCount = 0;

try {
    // Create a simple table with values in it
    const allData = new DBTable([
        {ID: 1, title: "Mustang",   tags: "car,Ford,blue"},
        {ID: 2, title: "Navigator", tags: "suv,Lincoln,black"},
        {ID: 3, title: "F-type",    tags: "car,Jaguar,red"},
        {ID: 4, title: "6x6",       tags: "truck,Mercedes,white"},
        {ID: 5, title: "Falcon 9",  tags: "rocket,Space x,white,black"},
    ]);
    console.log("data created...");

    const tags = allData.listDistinctValues("tags");

    if(tags.count){
        successCount ++;
        console.log("Tags... ", tags.data.map(x=>x.value).join(", "));
        console.log("\nTest Passed!");
    }

}catch (ex){
    console.log(ex);
}

console.log("\n", `${successCount}/${testCount} completed!`);
process.exit(successCount/testCount);
