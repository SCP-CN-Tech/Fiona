const Crom = require('./../src/lib/Crom');

var c = new Crom();

c.searchUsers("jochoi").then(res=>{
  console.log(JSON.stringify(res, null, 2))
}).catch(console.log)
