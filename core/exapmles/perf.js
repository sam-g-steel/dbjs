let {DBTable} = require("../lib/acid-db");
//let {DBTable} = require("../lib/DBTable");


let randomData = [];
for(let i = 0; i< 1000000; i++){
    randomData.push({
        i: Math.random(),
        r: Math.random(),
        g: Math.random(),
        b: Math.random(),
        a: Math.random()-Math.random(),
        q: Math.random()-Math.random(),
        w: Math.random()-Math.random(),
        e: Math.random()-Math.random(),
    });
}

randomData = new DBTable(randomData);


let n = Date.now();
//randomData.distinct();
//console.log("distinct x 1M ", Date.now()-n);

n = Date.now();
for(let i = 0; i< 1000; i++){
    randomData = new DBTable(randomData.data);
}
console.log("select x 1M ", Date.now()-n + "ms");
