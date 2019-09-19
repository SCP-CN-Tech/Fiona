// loads config
const fs = require('fs');
var config = {
  "CMD_PREFIX": "#/",
  "DIS_TOKEN": null,
  "DIS_ADMINS": [],
  "DIS_VERIFY_TYPE": null,
  "DIS_VERIFY_CHAN": null,
  "DIS_VERIFY_MSG": null,
  "DIS_VERIFY_REACT": null,
  "DIS_MEM_ROLE": null,
  "SCP_CHECK_TYPE": "exists",
  "SCP_SITE": "cn"
}

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

  return cnfg;
}

try {
  let customCnfg = JSON.parse(fs.readFileSync('./data/config.json', 'utf8'));
  for (var prop in customCnfg) {
    if (config.hasOwnProperty(prop) && customCnfg.hasOwnProperty(prop)) { config[prop] = customCnfg[prop] }
  }
} catch (e) { if (e.code === 'MODULE_NOT_FOUND') return; }
loadEnv(config);

if(!config.DIS_TOKEN||config.DIS_TOKEN===undefined) {
  throw new Error("Discord token is required.")
}

var pref = config.CMD_PREFIX;

// creates CmdHandler class for handling Discord commands

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
    var generalHelp = "所有可用指令列表：\nList of all available commands:\n"+pref+Object.keys(cmdDesc).join("\n"+pref)+
    "\n使用\""+pref+"help [指令]\"可得具體資訊。\nSee\""+pref+"help [Command]\"for more information.";

    if (!arg[0]||arg[0]===undefined) {msg.channel.send(generalHelp)}
    else if (cmdDesc.hasOwnProperty(arg[0])) {
        msg.channel.send({embed:cmdDesc[arg[0]]});
      } else { msg.channel.send("指令不存在。使用\""+pref+"help\"尋找更多資料。\nInvalid command. See \""+
      pref+"help\" for more information."); }
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
    console.log('Deleted '+fetched.size+' messages from channel '+msg.channel.id);
  }
}

class Verifier {
  constructor(client, scp){
    this.client = client;
    this.scp = scp;
    this.type = config.DIS_VERIFY_TYPE.toLowerCase();
    this.scptype = config.SCP_CHECK_TYPE.toLowerCase();
    this.channel = config.DIS_VERIFY_CHAN;
    this.message = config.DIS_VERIFY_MSG;
    this.reaction = config.DIS_VERIFY_REACT;
    this.role = config.DIS_MEM_ROLE;
  }

  async __getUsers(user) {
    var users = await this.scp.findUsers(user);
    //users = users.values().filter(each => each.displayName.toLowerCase() === user.toLowerCase());
    return users;
  }

  __checker(...args){
    var boo;
    if (this.scptype==="exists") {
      boo = this.__checkExists(...args);
    } else if (this.scptype==="member") {
      boo = this.__checkMember(...args);
    } else boo = false;
    return boo;
  }

  __checkExists(users, site) {
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

  __checkMember(users, site) {
    if (users instanceof Map) {
      if ( !users || users === undefined || users.size === 0 ) return false;
      var member = false;
      users.forEach((id,user) => {if (user.memberOf(site)) { member = true; }})
      return member;
    } else if (users instanceof WikidotUser) {
      if (users.memberOf(site)) return true;  else return false;
    }
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
  if (access === 0) {
    msg.channel.send("你沒有使用此指令的權限。\nYou do not have the permissions to use this command.");
    return;
  }
  var cmdHandler = new CmdHandler(disClient, msg)
  if (typeof cmdHandler['cmd__'+cmdHandler.cmd] === 'function') { cmdHandler['cmd__'+cmdHandler.cmd]() } else
  { msg.channel.send("指令不存在。使用\""+pref+"help\"尋找更多資料。\nInvalid command. See \""+
  pref+"help\" for more information.") }
})

// verifies user to be a member by adding a reaction to specific message or checking their wikidot name

var verifier = new Verifier(disClient, scpClient);

if (verifier.type === "reaction") {
  disClient.on("messageReactionAdd", (msgR, user) => {
    if (user.bot) return;
    if (msgR.message.channel.id !== verifier.channel) return;
    if (msgR.message.id !== verifier.message) return;
    if (msgR.id !== this.reaction && msgR.identifier !== this.reaction) return;
    user.addRole(verifier.role)
  })
} else if (verifier.type === "wikidotname") {
  disClient.on("message", msg => {
    if (msg.author.bot) return;
    if (msg.channel.id !== verifier.channel) return;
    if (!msg.content.toLowerCase().startsWith(pref+'verify ')) return;
    var username = msg.content.slice((pref+'verify ').length);
    verifier.__getUsers(username).then(users => {
      if (verifier.__checker(users, config.SCP_SITE)) {
        msg.member.addRole(verifier.role);
        msg.channel.send("權限已賦予。\nAccess granted.");
      } else {
        msg.channel.send("權限不足。\nAccess denied.");
      };
    })
  })
}
