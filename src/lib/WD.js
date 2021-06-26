const got = require('got');

/**
 * WD class for calling Wikidot AJAX modules. Modified from https://github.com/resure/wikidot-ajax/blob/master/index.js
 */
class WD {
  constructor(baseURL) {
    this.base = baseURL;
    this.ajax = `${baseURL}/ajax-module-connector.php`;
    this.quic = `${baseURL}/quickmodule.php`;
  }
  async req(url, params) {
    const wikidotToken7 = Math.random().toString(36).substring(4).toLowerCase();
    var res = await got.post(url, {
      headers: {Cookie: `wikidot_token7=${wikidotToken7}`, Referer: "FIONA", "User-Agent": "FIONA"},
      form: Object.assign({}, {wikidot_token7: wikidotToken7, callbackIndex: 1}, params)
    }).json();
    return res;
  };

  async module(moduleName, params) {
    return await this.req(this.ajax, Object.assign({
      moduleName: moduleName,
    }, params));
  };

  async quick(module, params) {
    return await got.get(this.quic, {
      searchParams: Object.assign({module: module}, params)
    }).json();
  };
}

module.exports = WD;
