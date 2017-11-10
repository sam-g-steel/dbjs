let {DBTable} = require("../lib/acid-db");
let {CachingDBTable} = require("../lib/CachingDBTable");


let people = new CachingDBTable([
    {name: "Bob", age: 57},
    {name: "Douglas", age: 42},
    {name: "Computer", age: 7000000},
]);


console.log("\nInitial Table...");
console.log(people.data);


console.log("\nSort By Name...", "DESC");
people = people.orderBy("name", "DESC");
console.log(people.data);

console.log("\nDoes the table have a person named Bob...");
let hasBob = people.whereColumnEquals("name" ,"Bob").count;
console.log(hasBob > 0 ? "true" : "false");

console.log("select 1", people.select("name".split()));
console.log("select 2", people.select("name".split()));
console.log(people);