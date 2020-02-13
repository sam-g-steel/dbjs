const {DBFilter} = require("../lib");

const filter1 = new DBFilter();
const filter2 = filter1.setField("age", 45);
const filter4 = filter1.setField("age", undefined);
const filter3 = filter2.merge(filter2).merge(filter1);

console.log("filter1 = ", filter1);
console.log("filter2 = ", filter2);
console.log("filter2 = ", filter2.toBasicString());

console.log("filter2 === filter3", filter2 === filter3);

console.log("", filter3.merge(filter4).toBasicString());
