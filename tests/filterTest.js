const {DBFilter} = require("../lib/DBFilter");

const filter1 = new DBFilter();
const filter2 = filter1.setField("age", 45);
const filter3 = filter2.merge(filter2).merge(filter1);

console.log("filter1 = ", filter1);
console.log("filter2 = ", filter2);
console.log("filter2 = ", filter2.toBasicString());

console.log("filter2 === filter3", filter2 === filter3)
