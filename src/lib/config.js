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

module.exports = config
