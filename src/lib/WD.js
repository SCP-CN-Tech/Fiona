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
    let form = new FormData();
    form.append("wikidot_token7", wikidotToken7);
    form.append("callbackIndex", 0);
    for (const key in params) {
      form.append(key, params[key]);
    }
    var res = await fetch(url, {
      method: "POST",
      headers: {
        Cookie: `wikidot_token7=${wikidotToken7}`,
        Referer: "FIONA",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
      },
      body: form,
    }).then(res=>res.json());
    return res;
  };

  async module(moduleName, params) {
    return await this.req(this.ajax, Object.assign({
      moduleName: moduleName,
    }, params));
  };

  async quick(module, params) {
    let search = new URLSearchParams({module, ...params})
    return await fetch(`${this.quic}?${search}`, {
      method: "GET",
    }).then(res=>res.json());
  };
}

module.exports = WD;
