const WD = require('./../src/lib/WD');
let wd = new WD("http://zok6hoi2.wikidot.com")

let username = "Jochoid"
!(async()=>{
  let t = Date.now()
  let a = await wd.module("users/UserSearchModule", {
    query: username
  })
  t=Date.now()-t
  console.log(a)
  console.log(`AJAX Module used ${t} ms.`)
})()

!(async()=>{
  let t = Date.now()
  let q = await wd.quic("UserLookupQModule", {
    q: username
  })
  t=Date.now()-t
  console.log(q)
  console.log(`QModule used ${t} ms.`)
})()
