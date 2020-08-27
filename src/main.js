// loads config
const config = require('./lib/config');
const branchUrls = require('./lib/branch');

var pref = config.CMD_PREFIX;

const Crom = require('./lib/Crom');
const AdminCmd = require('./lib/AdminCmd');
const Verifier = require('./lib/Verifier');

// loads module and handlers
const Scpper = require('scpper2.js');
const scpClient = new Scpper.Scpper({site:config.SCP_SITE});
scpClient.config = config;

const Discord = require('discord.js');
const disClient = new Discord.Client({ autoReconnect: true });
disClient.login(config.DIS_TOKEN);
disClient.config = config;

disClient.on("ready", () => {
  console.log(`Logged into ${disClient.user.tag}.`)
})

// handles administrative commands
disClient.on("message", msg => {
  if (!msg.content.toLowerCase().startsWith(pref)||msg.content.toLowerCase().startsWith(pref+'verify')) return;
  let access = 0;
  if (config.DIS_ADMINS instanceof Array) {
    for (role of config.DIS_ADMINS) {
      if (msg.member.roles.has(role)) { access += 1; }
    }
  } else if (config.DIS_ADMINS instanceof String) {
    if (msg.member.roles.has(config.DIS_ADMINS)) { access += 1; }
  }
  if (!access) {
    msg.channel.send("你沒有使用此指令的權限。\nYou do not have the permissions to use this command.");
    return;
  }
  let cmdHandler = new AdminCmd(disClient, msg)
  if (typeof cmdHandler['cmd__'+cmdHandler.cmd] === 'function') { cmdHandler['cmd__'+cmdHandler.cmd]() }
  else { msg.channel.send(`指令不存在。使用 "${pref} help" 尋找更多資料。\nInvalid command. See "${pref} help" for more information.`) }
})

// handles inline query
var crom = new Crom()
disClient.on("message", async msg => {
  try {
    if (/\[{3}.+\]{3}/gi.test(msg.content)||/\{.+\}/gi.test(msg.content)) {
      let rel = [...msg.content.matchAll(/\[{3}((?<branch>[a-zA-Z]{2,3})\|)(?<queri>[-\w\:]{1,60})\]{3}/gi)];
      let query = [...msg.content.matchAll(/\{(\[(?<branch>[a-zA-Z]{2,3})\])?(?<queri>.+)\}/gi)];
      let reply = [];
      for (var i = 0; i < rel.length; i++) {
        let {queri, branch} = rel[i].groups
        branch = branch ? branch.toLowerCase() : undefined
        reply.push(`${!!branch&&!!branchUrls[branch] ? branchUrls[branch] : branchUrls[config.SCP_SITE]}/${queri}`)
      }
      for (var i = 0; i < query.length; i++) {
        let {queri, branch} = query[i].groups
        branch = branch ? branch.toLowerCase() : undefined
        let res = await crom.searchPages(queri, {
          anyBaseUrl: !!branch&&!!branchUrls[branch] ? branchUrls[branch] : branchUrls[config.SCP_SITE]
        });
        res = res.data.searchPages
        if (res.length) {
          let ans = res[0].wikidotInfo.title;
          ans += res[0].alternateTitles.length ? ` - ${res[0].alternateTitles[0].title}` : ""
          ans += `\n評分：${res[0].wikidotInfo.rating}\n${res[0].url}`
          reply.push(ans)
        }
      }
      if (reply.length) {
        msg.channel.send(reply.join("\n\n"))
      } else {
        msg.channel.send("無結果。")
      }
    } else if (/\&.+\&/gi.test(msg.content)) {
      let query = [...msg.content.matchAll(/\&(\[(?<branch>[a-zA-Z]{2,3})\])?(?<queri>.+)\&/gi)];
      let reply = [];
      for (var i = 0; i < query.length; i++) {
        let {queri, branch} = query[i].groups
        branch = branch ? branch.toLowerCase() : undefined
        let filter = {
          anyBaseUrl: !!branch&&!!branchUrls[branch] ? branchUrls[branch] : branchUrls[config.SCP_SITE],
          baseUrl: !!branch&&!!branchUrls[branch] ? branchUrls[branch] : branchUrls[config.SCP_SITE]
        }
        if (branch&&branch==="all") { filter.anyBaseUrl=null; filter.baseUrl=null; }
        let res = await crom.searchUsers(queri, filter);
        res = res.data.searchUsers
        if (res.length) {
          let ans = res[0].name;
          ans += `: ${!!branch&&(branch==="all"||!!branchUrls[branch]) ? branch.toUpperCase() : config.SCP_SITE.toUpperCase()} #${res[0].statistics.rank}`
          ans += `\n共 ${res[0].statistics.pageCount} 頁面，總評分 ${res[0].statistics.totalRating}，平均分 ${res[0].statistics.meanRating}`
          ans += res[0].authorInfos.length ? `\n作者頁：${res[0].authorInfos[0].authorPage.url}` : ""
          reply.push(ans)
        }
      }
      if (reply.length) {
        msg.channel.send(reply.join("\n\n"))
      } else {
        msg.channel.send("無結果。")
      }
    }
  } catch (e) {
    console.log(e)
  }
})

// verifies user to be a member by adding a reaction to specific message or checking their wikidot name

var verifier = new Verifier(scpClient);

if (verifier.type === "reaction") {
  disClient.on("messageReactionAdd", (msgR, user) => {
    if (user.bot) return;
    if (msgR.message.channel.id !== verifier.channel) return;
    if (msgR.message.id !== verifier.message) return;
    if (![msgR.emoji.id, msgR.emoji.identifier, msgR.emoji.name].includes(this.reaction)) return;
    user.addRole(verifier.role)
  })
} else if (verifier.type === "wikidotname") {
  disClient.on("message", msg => {
    if (msg.author.bot) return;
    if (msg.channel.id !== verifier.channel) return;
    if (!msg.content.toLowerCase().startsWith(pref+'verify ')) return;
    var username = msg.content.slice((pref+'verify ').length).trim();
    msg.channel.send("正在驗證您的身份中......\nVerifying your identity...").then(reply=>{
      verifier.__getUsers(username).then(users => {
        if (verifier.__scpperChecker(users)) {
          msg.member.addRole(verifier.role);
          reply.edit("權限已賦予。\nAccess granted.");
        } else {
          verifier.__getWDUser(username).then(res=>{
            verifier.__WDChecker(username, res.userNames).then(k=>{
              if (k) {
                msg.member.addRole(verifier.role);
                reply.edit("權限已賦予。\nAccess granted.");
              } else {
                reply.edit("權限不足。\nAccess denied.");
              }
            })
          })
        };
      }).catch(e=>{
        console.log(e);
        verifier.__getWDUser(username).then(res=>{
          verifier.__WDChecker(username, res.userNames).then(k=>{
            if (k) {
              msg.member.addRole(verifier.role);
              reply.edit("權限已賦予。\nAccess granted.");
            } else {
              reply.edit("權限不足。\nAccess denied.");
            }
          })
        })
      })
    })
  })
}

// ban malicious user warned by other servers
disClient.on("guildMemberAdd", gm => {
  if (config.DIS_BAN.includes(gm.id)) { gm.ban() }
})
