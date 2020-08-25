const got = require('got');

/**
 * WD class for calling Wikidot AJAX modules. Modified from https://github.com/resure/wikidot-ajax/blob/master/index.js
 */
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

module.exports = WD;
