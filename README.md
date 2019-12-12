# BanHammerLite
 Just a lightweight banhammer used on SCP-CN Unofficial Discord.


## Usage
 The bot accepts the form of JSON and environment variables for config and always uses environment variables if provided.

| Config parameters | Required or not | Values | Default | Description |
| ---- | ---- | ---- | ---- | ---- |
| CMD_PREFIX | Optional | <code>String</code> | <code>#/</code> | The prefix for using the commands of the bot |
| DIS_TOKEN | Required | <code>String</code> | empty string | The token for logging into your bot account |
| DIS_ADMINS | Optional | <code>String</code> or <code>Array</code> | <code>null</code> | The admin role id(s) for your server, users are required to have the specified role(s) to use administrative commands |
| DIS_VERIFY_TYPE | Optional | <code>String</code> | <code>null</code> | Verification methods. Possible values: <code>reaction</code> for adding specific reaction to a specific message or <code>wikidotname</code> for checking against username. Leave blank for disabling verification. |
| DIS_VERIFY_CHAN | Optional | <code>String</code> | <code>null</code> | Discord channel where the verify message(s) are put if <code>DIS_VERIFY_TYPE</code> is enabled. |
| DIS_VERIFY_MSG | Optional | <code>String</code> | <code>null</code> | The message id to react to if <code>DIS_VERIFY_TYPE</code> is <code>reaction</code>. |
| DIS_VERIFY_REACT | Optional | <code>String</code> | <code>null</code> | The reaction id/distinguisher to add to message if <code>DIS_VERIFY_TYPE</code> is <code>reaction</code>. |
| DIS_MEM_ROLE | Optional | <code>String</code> | <code>null</code> | The role id to add to member if <code>DIS_VERIFY_TYPE</code> is enabled. |
| SCP_CHECK_TYPE | Optional | <code>String</code> | <code>exists</code> | Method for checking for user information on ScpperDB if <code>DIS_VERIFY_TYPE</code> is <code>wikidotname</code>. Possible values: <code>exists</code> to check if any user of the provided username exists or <code>member</code> to check if any user of the provided username is a member of provided site. |
| SCP_SITE | Optional | <code>String</code> | <code>cn</code> | The site for checking site activity for verification, should be site initial (branch tag). |

All config parameters can be provided in the form of environment variables by adding "BHL_" in front of the parameter name, e.g. "<code>BHL_CMD_PREFIX</code>".
