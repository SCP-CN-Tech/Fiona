/**
 * Administrative commands handler.
 */

class AdminCmd {
  constructor(client, msg) {
    this.client = client;
    this.pref = client.config.CMD_PREFIX
    this.msgs = [msg];
    this.interactCount = 0;
    this.strs = [msg.content];
    this.args = [this.__strSplit()];
    this.cmd = this.args[this.interactCount][0];
    this.args[this.interactCount].shift();
    this.status = NaN;
  }

  __strSplit() {
    let args = this.strs[this.interactCount].slice(this.pref.length).split(' ');
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
        "title":this.pref+"help",
        "description":"列出可用指令。\nLists all available commands."
      },
      "purge":{
        "title":this.pref+"purge",
        "description":"刪除此指令前特定數量的訊息（1-100），預設為10。\nDeletes a specific amount of messages (1-100) before this command, default is 10."
      }
    };
    var generalHelp = `所有可用指令列表：\nList of all available commands:\n${this.pref+Object.keys(cmdDesc).join("\n"+this.pref)}\n使用  "${this.pref} help [指令]" 可得具體資訊。\nSee "${pref} help [Command]" for more information.`;

    if (!arg[0]||arg[0]===undefined) {msg.channel.send(generalHelp)}
    else if (cmdDesc.hasOwnProperty(arg[0])) {
        msg.channel.send({embed:cmdDesc[arg[0]]});
      } else { msg.channel.send(`指令不存在。使用 "${this.pref} help" 尋找更多資料。\nInvalid command. See "${this.pref} help" for more information.`); }
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

  cmd__mute() {
	let msg = this.msgs[this.interactCount];
	let ppl = msg.mentions.members;
	let fin = [];
	ppl.forEach(u=>{
	  fin.push(msg.channel.overwritePermissions(u, {"SEND_MESSAGES": false}))
	})
	Promise.all(fin).then(()=>{
	  msg.channel.send(`Successfully muted.`);
	}).catch(e=>{console.log(e)})
  }

  cmd__unmute() {
	let msg = this.msgs[this.interactCount];
	let ppl = msg.mentions.members;
	let fin = [];
	ppl.forEach(u=>{
	  fin.push(msg.channel.overwritePermissions(u, {"SEND_MESSAGES": null}))
	})
	Promise.all(fin).then(()=>{
	  msg.channel.send(`Successfully unmuted.`);
	}).catch(e=>{console.log(e)})
  }
}

module.exports = AdminCmd;
