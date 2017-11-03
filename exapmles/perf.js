
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
randomData.distinct();
console.log("no hash", Date.now()-n);


console.log(randomData[0]);