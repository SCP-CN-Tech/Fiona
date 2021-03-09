const fs = require('fs');

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
  "DIS_LOG_TYPE": "",
  "DIS_LOG_GUILD": null,
  "DIS_LOG_CHAN": null,
  "SCP_CHECK_TYPE": "exists",
  "SCP_SITE": "cn",
}

function loadEnv(cnfg) {
  if (process.env.FIO_CMD_PREFIX && process.env.FIO_CMD_PREFIX!==undefined) { cnfg.CMD_PREFIX = process.env.FIO_CMD_PREFIX };
  if (process.env.FIO_SCP_SITE && process.env.FIO_SCP_SITE!==undefined) { cnfg.SCP_SITE = process.env.FIO_SCP_SITE };
  if (process.env.FIO_SCP_CHECK_TYPE && process.env.FIO_SCP_CHECK_TYPE!==undefined) { cnfg.SCP_CHECK_TYPE = process.env.FIO_SCP_CHECK_TYPE };
  if (process.env.FIO_DIS_TOKEN && process.env.FIO_DIS_TOKEN!==undefined) { cnfg.DIS_TOKEN = process.env.FIO_DIS_TOKEN };
  if (process.env.FIO_DIS_VERIFY_TYPE && process.env.FIO_DIS_VERIFY_TYPE!==undefined) { cnfg.DIS_VERIFY_TYPE = process.env.FIO_DIS_VERIFY_TYPE };
  if (process.env.FIO_DIS_VERIFY_CHAN && process.env.FIO_DIS_VERIFY_CHAN!==undefined) { cnfg.DIS_VERIFY_CHAN = process.env.FIO_DIS_VERIFY_CHAN };
  if (process.env.FIO_DIS_VERIFY_MSG && process.env.FIO_DIS_VERIFY_MSG!==undefined) { cnfg.DIS_VERIFY_MSG = process.env.FIO_DIS_VERIFY_MSG };
  if (process.env.FIO_DIS_VERIFY_REACT && process.env.FIO_DIS_VERIFY_REACT!==undefined) { cnfg.DIS_VERIFY_REACT = process.env.FIO_DIS_VERIFY_REACT };
  if (process.env.FIO_DIS_MEM_ROLE && process.env.FIO_DIS_MEM_ROLE!==undefined) { cnfg.DIS_MEM_ROLE = process.env.FIO_DIS_MEM_ROLE };
  if (process.env.FIO_DIS_LOG_TYPE && process.env.FIO_DIS_LOG_TYPE!==undefined) { cnfg.DIS_LOG_TYPE = process.env.FIO_DIS_LOG_TYPE };
  if (process.env.FIO_DIS_LOG_GUILD && process.env.FIO_DIS_LOG_GUILD!==undefined) { cnfg.DIS_LOG_GUILD = process.env.FIO_DIS_LOG_GUILD };
  if (process.env.FIO_DIS_LOG_CHAN && process.env.FIO_DIS_LOG_CHAN!==undefined) { cnfg.DIS_LOG_CHAN = process.env.FIO_DIS_LOG_CHAN };
  if (process.env.FIO_DIS_ADMINS && process.env.FIO_DIS_ADMINS!==undefined) {
    if (process.env.FIO_DIS_ADMINS.startsWith("["))
     {cnfg.DIS_ADMINS=JSON.parse(process.env.FIO_DIS_ADMINS)} else {cnfg.DIS_ADMINS = process.env.FIO_DIS_ADMINS}
  }
  if (process.env.FIO_DIS_BAN && process.env.FIO_DIS_BAN!==undefined && process.env.FIO_DIS_BAN.startsWith("["))
  { cnfg.DIS_BAN=JSON.parse(process.env.FIO_DIS_BAN) }

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

config.SCP_SITE = config.SCP_SITE.toLowerCase()

module.exports = config;
