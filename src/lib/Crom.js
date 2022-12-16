const got = require('got');
const branchUrls = require('./branch');

/**
 * Interacter with Crom wiki crawler api.
 */
class Crom {
  constructor() {
    this.base = `https://api.crom.avn.sh/graphql`
  }
  async req(query) {
    return await got.post(this.base, {
      json: {
        query: query.trim()
      }
    }).json()
  }

  async searchPages(query, filter) {
    return await this.req(`
      {
        searchPages(query: "${query}", filter: {
          anyBaseUrl: ${ !!filter && !!filter.anyBaseUrl ? `"${filter.anyBaseUrl}"` : null }
        }) {
          url
          wikidotInfo {
            title
            rating
          }
          alternateTitles {
            type
            title
          }
          translationOf {
            wikidotInfo {
              title
              rating
            }
          }
        }
      }
    `)
  }

  async searchUsers(query, filter) {
    return await this.req(`
      {
        searchUsers(query: "${query}", filter: {
          anyBaseUrl: ${ !!filter && !!filter.anyBaseUrl ? `"${filter.anyBaseUrl}"` : null }
        }) {
          name
          authorInfos {
            authorPage {
              url
            }
          }
          statistics${ !!filter && !!filter.baseUrl ? `(baseUrl: "${filter.baseUrl}")` : "" } {
            rank
            totalRating
            meanRating
            pageCount
          }
        }
      }
    `)
  }
  
  async searchUserByRank(rank, filter) {
    if (!(typeof rank == 'number') || isNaN(rank)) { throw new Error('Rank has to be an integer.'); }
    return await this.req(`
      {
        usersByRank(rank: ${rank}, filter: {
          anyBaseUrl: ${ !!filter && !!filter.anyBaseUrl ? `"${filter.anyBaseUrl}"` : null }
        }) {
          name
          authorInfos {
            authorPage {
              url
            }
          }
          statistics${ !!filter && !!filter.baseUrl ? `(baseUrl: "${filter.baseUrl}")` : "" } {
            rank
            totalRating
            meanRating
            pageCount
          }
        }
      }
    `)
  }
}

module.exports.Crom = Crom;
module.exports.init = ({discord}) => {
  let config = discord.config;
  let crom = new Crom()
  discord.on("message", async msg => {
    if (config.DIS_CROM_BLKCHAN.includes(msg.channel.id)) return;
    if (msg.author.id==discord.user.id) return;
    try {
      if (/\[{3}.+\]{3}/gi.test(msg.content)||/\{.+\}/gi.test(msg.content)) {
        let rel = [...msg.content.matchAll(/\[{3}((?<branch>[a-zA-Z]{2,3})\|)?(?<queri>[-\w\:]{1,60})\]{3}/gi)];
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
            let ans = res[0].wikidotInfo ? res[0].wikidotInfo.title : '' ;
            ans += ans && res[0].alternateTitles.length ? ' - ' : '';
            ans += res[0].alternateTitles.length ? res[0].alternateTitles[0].title : '';
            ans += !ans && res[0].translationOf && res[0].translationOf.wikidotInfo ? res[0].translationOf.wikidotInfo.title : '';
            ans += res[0].wikidotInfo ? `\n評分：${res[0].wikidotInfo.rating}` : '' ;
            ans += `\n${res[0].url}`
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
          let {queri, branch} = query[i].groups;
          branch = branch?.toLowerCase() ?? config.SCP_SITE;
          let filter = {
            anyBaseUrl: branchUrls[branch] ?? branchUrls[config.SCP_SITE],
            baseUrl: branchUrls[branch] ?? branchUrls[config.SCP_SITE],
          }
          if (branch&&branch==="all") { filter.anyBaseUrl=null; filter.baseUrl=null; }
          let res = /^\#\d+$/.test(queri) ?
          (await crom.searchUserByRank(parseInt(queri.slice(1)),filter)) :
          (await crom.searchUsers(queri, filter));
          res = res.data[/^\#\d+$/.test(queri) ? 'usersByRank' : 'searchUsers'];
          if (res.length) {
            let ans = res[0].name;
            let authorInfo = res[0].authorInfos?.filter(v=>v.authorPage.url.startsWith(branchUrls[branch]));
            ans += `: ${!!branch&&(branch==="all"||!!branchUrls[branch]) ? branch.toUpperCase() : config.SCP_SITE.toUpperCase()} #${res[0].statistics.rank}`;
            ans += `\n共 ${res[0].statistics.pageCount} 頁面，總評分 ${res[0].statistics.totalRating}，平均分 ${res[0].statistics.meanRating}`;
            if (authorInfo.length) {
              ans += `\n作者頁：${authorInfo[0].authorPage.url}`;
            } else if (res[0].authorInfos.length) {
              ans += `\n作者頁：${res[0].authorInfos[0].authorPage.url}`;
            }
            reply.push(ans);
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
}
