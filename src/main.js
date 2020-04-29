// loads config
const fs = require('fs');
const got = require('got');
var config = {
  "CMD_PREFIX": "#/",
  "DIS_TOKEN": null,
  "DIS_ADMINS": [],
  "DIS_VERIFY_TYPE": "",
  "DIS_VERIFY_CHAN": null,
  "DIS_VERIFY_MSG": null,
  "DIS_VERIFY_REACT": null,
  "DIS_MEM_ROLE": null,
  "DIS_BAN": [],
  "SCP_CHECK_TYPE": "exists",
  "SCP_SITE": "cn"
}
const branchUrls = {
    "en": "http://scp-wiki.wikidot.com",
    "ru": "http://scp-ru.wikidot.com",
    "ko": "http://scpko.wikidot.com",
    "ja": "http://scp-jp.wikidot.com",
    "fr": "http://fondationscp.wikidot.com",
    "es": "http://lafundacionscp.wikidot.com",
    "th": "http://scp-th.wikidot.com",
    "pl": "http://scp-pl.wikidot.com",
    "de": "http://scp-wiki-de.wikidot.com",
    "cn": "http://scp-wiki-cn.wikidot.com",
    "it": "http://fondazionescp.wikidot.com",
    "int": "http://scp-int.wikidot.com"
};

function loadEnv(cnfg) {
  if (process.env.BHL_CMD_PREFIX && process.env.BHL_CMD_PREFIX!==undefined) { cnfg.CMD_PREFIX = process.env.BHL_CMD_PREFIX };
  if (process.env.BHL_SCP_SITE && process.env.BHL_SCP_SITE!==undefined) { cnfg.SCP_SITE = process.env.BHL_SCP_SITE };
  if (process.env.BHL_SCP_CHECK_TYPE && process.env.BHL_SCP_CHECK_TYPE!==undefined) { cnfg.SCP_CHECK_TYPE = process.env.BHL_SCP_CHECK_TYPE };
  if (process.env.BHL_DIS_TOKEN && process.env.BHL_DIS_TOKEN!==undefined) { cnfg.DIS_TOKEN = process.env.BHL_DIS_TOKEN };
  if (process.env.BHL_DIS_VERIFY_TYPE && process.env.BHL_DIS_VERIFY_TYPE!==undefined) { cnfg.DIS_VERIFY_TYPE = process.env.BHL_DIS_VERIFY_TYPE };
  if (process.env.BHL_DIS_VERIFY_CHAN && process.env.BHL_DIS_VERIFY_CHAN!==undefined) { cnfg.DIS_VERIFY_CHAN = process.env.BHL_DIS_VERIFY_CHAN };
  if (process.env.BHL_DIS_VERIFY_MSG && process.env.BHL_DIS_VERIFY_MSG!==undefined) { cnfg.DIS_VERIFY_MSG = process.env.BHL_DIS_VERIFY_MSG };
  if (process.env.BHL_DIS_VERIFY_REACT && process.env.BHL_DIS_VERIFY_REACT!==undefined) { cnfg.DIS_VERIFY_REACT = process.env.BHL_DIS_VERIFY_REACT };
  if (process.env.BHL_DIS_MEM_ROLE && process.env.BHL_DIS_MEM_ROLE!==undefined) { cnfg.DIS_MEM_ROLE = process.env.BHL_DIS_MEM_ROLE };
  if (process.env.BHL_DIS_ADMINS && process.env.BHL_DIS_ADMINS!==undefined) {
    if (process.env.BHL_DIS_ADMINS.startsWith("["))
     {cnfg.DIS_ADMINS=JSON.parse(process.env.BHL_DIS_ADMINS)} else {cnfg.DIS_ADMINS = process.env.BHL_DIS_ADMINS}
  }
  if (process.env.BHL_DIS_BAN && process.env.BHL_DIS_BAN!==undefined && process.env.BHL_DIS_BAN.startsWith("["))
  { cnfg.DIS_BAN=JSON.parse(process.env.BHL_DIS_BAN) }

  return cnfg;
}

try {
  let customCnfg = JSON.parse(fs.readFileSync('./data/debugcnfg.json', 'utf8'));
  for (var prop in customCnfg) {
    if (config.hasOwnProperty(prop) && customCnfg.hasOwnProperty(prop)) { config[prop] = customCnfg[prop] }
  }
} catch (e) { if (e.code === 'MODULE_NOT_FOUND') {
	console.log("No config JSON file found. Loading environment variables as config...")
	} }
loadEnv(config);

if(!config.DIS_TOKEN||config.DIS_TOKEN===undefined) {
  throw new Error("Discord token is required.")
}

var pref = config.CMD_PREFIX;

// WD class for calling Wikidot AJAX modules. Modified from https://github.com/resure/wikidot-ajax/blob/master/index.js

class WD {
  constructor(baseURL) {
    this.baseURL = `${baseURL}/ajax-module-connector.php`;
  }
  async req(params) {
      const wikidotToken7 = Math.random().toString(36).substring(4).toLowerCase();
      var res = await got.post(this.baseURL, {
        headers: {Cookie: `wikidot_token7=${wikidotToken7}`},
        form: Object.assign({}, {wikidot_token7: wikidotToken7, callbackIndex: 1}, params)
      }).json();
      return res;
  };
}


// CmdHandler class for handling Discord commands

class CmdHandler {
  constructor(client, msg) {
    this.client = client;
    this.msgs = [msg];
    this.interactCount = 0;
    this.strs = [msg.content];
    this.args = [this.__strSplit()];
    this.cmd = this.args[this.interactCount][0];
    this.args[this.interactCount].shift();
    this.status = NaN;
  }

  __strSplit() {
    let args = this.strs[this.interactCount].slice(pref.length).split(' ');
    for (var i=0; i<args.length; i++) { if (args[i]==='') { args.splice(i,1); i--}; };
    return args;
  }

  __newArgs(newMsg) {
    this.interactCount++;
    this.msgs[this.interactCount] = newMsg;
    this.strs[this.interactCount] = newMsg.content;
    this.args[this.interactCount] = this.__strSplit();
  }

  cmd__help() {
    let msg = this.msgs[this.interactCount], arg = this.args[this.interactCount];
    var cmdDesc = {
      "help":{
        "title":pref+"help",
        "description":"列出可用指令。\nLists all available commands."
      },
      "purge":{
        "title":pref+"purge",
        "description":"刪除此指令前特定數量的訊息（1-100），預設為10。\nDeletes a specific amount of messages (1-100) before this command, default is 10."
      }
    };
    var generalHelp = `所有可用指令列表：\nList of all available commands:\n${pref+Object.keys(cmdDesc).join("\n"+pref)}\n使用  "${pref} help [指令]" 可得具體資訊。\nSee "${pref} help [Command]" for more information.`;

    if (!arg[0]||arg[0]===undefined) {msg.channel.send(generalHelp)}
    else if (cmdDesc.hasOwnProperty(arg[0])) {
        msg.channel.send({embed:cmdDesc[arg[0]]});
      } else { msg.channel.send(`指令不存在。使用 "${pref} help" 尋找更多資料。\nInvalid command. See "${pref} help" for more information.`); }
  }

  async cmd__purge() {
    let msg = this.msgs[this.interactCount];
    var num = this.args[this.interactCount][0];
    if ( !num||num === undefined ) { num = 10 };
    if ( num > 100 ) { num = 100 };
    msg.delete();
    var fetched = await msg.channel.fetchMessages({limit:num});
    if (num===1) {
      msg.channel.delete(fetched);
    } else {
    msg.channel.bulkDelete(fetched);
    }
    console.log(`Deleted ${fetched.size} messages from channel ${msg.channel.id}`);
  }
}

class Verifier {
  constructor(scp){
    this.scp = scp;
    this.branch = branchUrls[config.SCP_SITE];
    this.type = config.DIS_VERIFY_TYPE.toLowerCase();
    this.scptype = config.SCP_CHECK_TYPE.toLowerCase();
    this.channel = config.DIS_VERIFY_CHAN;
    this.message = config.DIS_VERIFY_MSG;
    this.reaction = config.DIS_VERIFY_REACT;
    this.role = config.DIS_MEM_ROLE;
    this.wd = new WD(this.branch);
  }

  async __getUsers(user) {
    var targetSite;
    if (this.scptype==="member") { targetSite = config.SCP_SITE } else targetSite = null;
    var users = await this.scp.findUsers(user, {site: targetSite});
    if (users instanceof Map) {
      users = new Map(Array.from(users).filter(each => each[1].displayName.toLowerCase().trim() === user.toLowerCase()))
    }
    return users;
  }

  __scpperChecker(users) {
    if (this.scptype!=="exists"&&this.scptype!=="member") return false;
    if (users instanceof Map) {
      if ( !users || users === undefined || users.size === 0 ) return false;
      var exists = false;
      users.forEach((id,user) => {if (!user.deleted) { exists = true; }})
      return exists;
    } else if (users instanceof WikidotUser) {
      if ( users === undefined || users.length === 0 ) return false;
        if (!user.deleted) return true; else return false;
    }
  }

  async __getWDUser(username) {
    return await this.wd.req({
      moduleName: "users/UserSearchModule",
      query: username
    })
  }

  async __getWDSiteMember(userId) {
    var res = await this.wd.req({
      moduleName: "userinfo/UserInfoMemberOfModule",
      user_id: userId
    })
    return res.body;
  }

  async __WDChecker(un, nameObj) {
    if (this.scptype!=="exists"&&this.scptype!=="member") return false;
    if ( !Object.values(nameObj) || !Object.values(nameObj).length ) return false;
    var names = Object.values(nameObj).map(x=>x.trim().toLowerCase());
    if (names.includes(un.toLowerCase())) {
      if (this.scptype=="exists") return true;
      else if (this.scptype=="member") {
        var id = Object.keys(nameObj)[names.indexOf(un.toLowerCase())];
        var a = await this.__getWDSiteMember(id);
         return a.includes(`a href="${this.branch}"`);
      } else return false;
    } else return false;
  }
}

// loads module and handlers
const Scpper = require('scpper2.js');
const scpClient = new Scpper.Scpper({site:config.SCP_SITE});

const Discord = require('discord.js');
const disClient = new Discord.Client({ autoReconnect: true });
disClient.login(config.DIS_TOKEN);

disClient.on("ready", () => {
  console.log(`Logged into ${disClient.user.tag}.`)
})

disClient.on("message", msg => {
  if (!msg.content.toLowerCase().startsWith(pref)||msg.content.toLowerCase().startsWith(pref+'verify')) return;
  var access = 0;
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
  var cmdHandler = new CmdHandler(disClient, msg)
  if (typeof cmdHandler['cmd__'+cmdHandler.cmd] === 'function') { cmdHandler['cmd__'+cmdHandler.cmd]() }
  else { msg.channel.send(`指令不存在。使用 "${pref} help" 尋找更多資料。\nInvalid command. See "${pref} help" for more information.`) }
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
