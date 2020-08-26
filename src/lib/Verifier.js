const WD = require('./WD');
const branchUrls = require('./branch');
/**
 * Handles verification checking
 */

class Verifier {
  constructor(scp){
    this.scp = scp
    this.bid = scp.config.SCP_SITE
    this.branch = branchUrls[scp.config.SCP_SITE];
    this.type = scp.config.DIS_VERIFY_TYPE.toLowerCase();
    this.scptype = scp.config.SCP_CHECK_TYPE.toLowerCase();
    this.channel = scp.config.DIS_VERIFY_CHAN;
    this.message = scp.config.DIS_VERIFY_MSG;
    this.reaction = scp.config.DIS_VERIFY_REACT;
    this.role = scp.config.DIS_MEM_ROLE;
    this.wd = new WD(this.branch);
  }

  async __getUsers(user) {
    var targetSite;
    if (this.scptype==="member") { targetSite = this.bid } else targetSite = null;
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

module.exports = Verifier;