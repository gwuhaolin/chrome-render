'use strict';
const ChromeTabsPoll = require('./poll');

/**
 * a ChromeRender will launch a chrome with some tabs to render web pages.
 * use #new() static method to make a ChromeRender, don't use new ChromeRender()
 * #new() is a async function, new ChromeRender is use able util await it to be completed
 */
class ChromeRender {

  /**
   * make a new ChromeRender
   * @param {object} params
   * {
   *  maxTab,
   *  renderTimeout
   * }
   * @return {Promise.<ChromeRender>}
   */
  static async new(params = {}) {
    const { maxTab, renderTimeout = 5000 } = params;
    const chromeRender = new ChromeRender();
    chromeRender.chromeTabsPoll = await ChromeTabsPoll.new(maxTab);
    chromeRender.renderTimeout = renderTimeout;
    return chromeRender;
  }

  /**
   * TODO handle network error
   * render page in chrome, and return page html string
   * @param params
   * {
     *      url:
     *      referrer:
     *      cookies:
     *      ready:
     * }
   * @returns {Promise.<string>} page html string
   */
  async render(params) {
    let client;
    return await new Promise(async (resolve, reject) => {

      let { url, referrer, cookies, ready, } = params;
      if (!url) {
        return reject(`required url params.`);
      }

      client = await this.chromeTabsPoll.require();
      const { Page, DOM, Runtime, Network, } = client;

      const resolveHTML = async () => {
        try {
          const dom = await DOM.getDocument();
          const ret = await DOM.getOuterHTML({ nodeId: dom.root.nodeId });
          resolve(ret.outerHTML);
        } catch (err) {
          reject(err);
        }
      };

      // inject cookies
      if (typeof cookies === 'string') {
        cookies = JSON.parse(cookies);
        Object.keys(cookies).forEach((name) => {
          Network.setCookie({
            url: url,
            name: name,
            value: cookies[name],
          });
        })
      }

      if (typeof ready === 'string') {
        Runtime.consoleAPICalled((data) => {
          const { type, args } = data;
          if (type === 'log' && args.length === 1 && args[0].value === ready) {
            //noinspection JSIgnoredPromiseFromCall
            resolveHTML();
          }
        });
        const { renderTimeout } = this;
        setTimeout(() => {
          reject(`render timeout`);
        }, renderTimeout);
      } else {
        Page.domContentEventFired(resolveHTML);
      }

      await Page.navigate({ url, referrer });
    }).then((html) => {
      this.chromeTabsPoll.release(client.tabId);
      return Promise.resolve(html);
    }).catch((err) => {
      this.chromeTabsPoll.release(client.tabId);
      return Promise.reject(err);
    });
  }

  /**
   * destroyPoll this chrome render, kill chrome, release all resource
   * @returns {Promise.<void>}
   */
  async destroyRender() {
    await this.chromeTabsPoll.destroyPoll();
    this.chromeTabsPoll = null;
  }
}

module.exports = ChromeRender;