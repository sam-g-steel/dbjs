let {DBTable} = require("../lib/acid-db");
let {CachingDBTable} = require("../lib/CachingDBTable");


let people = new CachingDBTable([
    {name: "Bob", age: 57},
    {name: "Douglas", age: 42},
    {name: "Computer", age: 7000000},
]);


console.log("\nInitial Table...");
console.log(people.toJSON(0));

let savedData = people.toLZMAStringB64();

console.log(savedData);

console.log(new DBTable().loadLZMAStringB64(savedData));