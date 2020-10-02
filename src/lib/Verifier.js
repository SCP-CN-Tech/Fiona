const WD = require('./WD');
const branchUrls = require('./branch');
/**
 * Handles verification checking
 */

class Verifier {
  constructor(scp){
    this.scp = scp;
    this.bid = scp.config.SCP_SITE;
    this.branch = branchUrls[scp.config.SCP_SITE];
    this.type = scp.config.DIS_VERIFY_TYPE.toLowerCase();
    this.scptype = scp.config.SCP_CHECK_TYPE.toLowerCase();
    this.channel = scp.config.DIS_VERIFY_CHAN;
    this.message = scp.config.DIS_VERIFY_MSG;
    this.reaction = scp.config.DIS_VERIFY_REACT;
    this.role = scp.config.DIS_MEM_ROLE;
    this.wd = new WD(this.branch);
  };

  async __getUsers(user) {
    let targetSite = this.scptype==="member" ? this.bid : null;
    let users = await this.scp.findUsers(user, {site: targetSite});
    if (users instanceof Map) {
      users = new Map(Array.from(users).filter(each => each[1].displayName.toLowerCase().trim() === user.toLowerCase()))
    }
    return users;
  };

  __scpperChecker(users) {
    if (this.scptype!=="exists"&&this.scptype!=="member") return false;
    if (users instanceof Map) {
      if ( !users || users === undefined || users.size === 0 ) return false;
      let exists = false;
      users.forEach((id,user) => {if (!user.deleted) { exists = true; }})
      return exists;
    } else if (users instanceof WikidotUser) {
      if ( users === undefined || users.length === 0 ) return false;
        if (!user.deleted) return true; else return false;
    }
  };

  async __getWDUser(username) {
    return await this.wd.module("users/UserSearchModule", { query: username });
  };

  async __getWDQUser(username) {
    return await this.wd.quic("UserLookupQModule", { q: username });
  };

  async __getWDSiteMember(userId) {
    let res = await this.wd.module("userinfo/UserInfoMemberOfModule", {
      user_id: userId,
    })
    return res.body;
  };

  async __WDChecker(un) {
    let {userNames:nameObj} = await this.__getWDUser(un);
    if (this.scptype!=="exists"&&this.scptype!=="member") return false;
    if ( !Object.values(nameObj) || !Object.values(nameObj).length ) return false;
    let names = Object.values(nameObj).map(x=>x.trim().toLowerCase());
    if (names.includes(un.toLowerCase())) {
      if (this.scptype=="exists") return true;
      else if (this.scptype=="member") {
        let id = Object.keys(nameObj)[names.indexOf(un.toLowerCase())];
        let a = await this.__getWDSiteMember(id);
        return a.includes(`a href="${this.branch}"`);
      } else return false;
    }
  };

  async __WDQChecker(un) {
    let {users} = await this.__getWDQUser(un);
    if (this.scptype!=="exists"&&this.scptype!=="member") return false;
    if ( !users || !users.length ) return false;
    let found = users.filter(x=>x.name.toLowerCase()===un.toLowerCase());
    if (found.length) {
      if (this.scptype=="exists") return true;
      else if (this.scptype=="member") {
        let id = found[0].user_id;
        let a = await this.__getWDSiteMember(id);
        return a.includes(`a href="${this.branch}"`);
      } else return false;
    } else return false;
  };
}

module.exports.Verifier = Verifier;
module.exports.init = ({scpper:scp, discord}) => {
  let verifier = new Verifier(scp);
  discord.__verifier = verifier;

  if (verifier.type === "reaction") {
    discord.on("messageReactionAdd", (msgR, user) => {
      if (user.bot) return;
      if (msgR.message.channel.id !== verifier.channel) return;
      if (msgR.message.id !== verifier.message) return;
      if (![msgR.emoji.id, msgR.emoji.identifier, msgR.emoji.name].includes(this.reaction)) return;
      let member = msgR.message.channel.guild.members.resolve(user);
      if (member) member.roles.add(verifier.role);
    })
  } else if (verifier.type === "wikidotname") {
    discord.on("message", msg => {
      if (msg.author.bot) return;
      if (msg.channel.id !== verifier.channel) return;
      if (!msg.content.toLowerCase().startsWith(pref+'verify ')) return;
      let username = msg.content.slice((pref+'verify ').length).trim();
      msg.channel.send("正在驗證您的身份中......\nVerifying your identity...").then(reply=>{
        let checkwd = async ()=>{
          let k = await verifier.__WDChecker(username);
          if (k) {
            msg.member.roles.add(verifier.role);
            reply.edit("權限已賦予。\nAccess granted.");
          } else {
            reply.edit("權限不足。\nAccess denied.");
          }
        }
        verifier.__getUsers(username).then(users => {
          if (verifier.__scpperChecker(users)) {
            msg.member.roles.add(verifier.role);
            reply.edit("權限已賦予。\nAccess granted.");
          } else checkwd();
        }).catch(e=>{
          console.log(e);
          checkwd();
        })
      })
    })
  }
};
