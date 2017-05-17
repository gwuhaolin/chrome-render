'use strict';
const genericPool = require('generic-pool');
const { sysFreePort, launcherChrome, } = require('./lib/util');
const chrome = require('chrome-remote-interface');

/**
 * create pool factory to manage chrome tabs, for reuse tab
 * @param max max tab to render pages
 * @returns {Promise.<*>}
 */
async function createPool(max = 10) {
  const port = await sysFreePort();
  const chromeLauncher = await launcherChrome(port);
  return {
    chromeLauncher,
    poll: genericPool.createPool({
      create: async () => {
        // 新开一个tab
        const tab = await chrome.New({ port });
        // 连接远程chrome
        const protocol = await chrome({ target: tab });
        const { Page, DOM, Runtime, Network } = protocol;
        await Promise.all([Page.enable(), DOM.enable(), Runtime.enable(), Network.enable()]);
        return {
          tab,
          Page,
          DOM,
          Runtime,
          Network,
        }
      },
      destroy: async (client) => {
        const { tab } = client;
        return await chrome.Close(tab);
      }
    }, {
      max,
      min: 1,
    })
  }
}

class ChromeTabPoll {

  async init(max = 10) {
    this.port = await sysFreePort();
    this.chromeLauncher = await launcherChrome(port);
    const tabs = await chrome.List();
    this.tabMap = {};
  }

  async _create() {
    // 新开一个tab
    const tab = await chrome.New({ port: this.port });
    // 连接远程chrome
    const protocol = await chrome({ target: tab });
    const { Page, DOM, Runtime, Network } = protocol;
    await Promise.all([Page.enable(), DOM.enable(), Runtime.enable(), Network.enable()]);
    return {
      tab,
      Page,
      DOM,
      Runtime,
      Network,
    }
  }

  async _destroy(client) {
    const { tab } = client;
    return await chrome.Close(tab);
  }

  acquire() {

  }

}

/**
 * a ChromeRender will launch a chrome with some tabs to render web pages.
 */
class ChromeRender {

  /**
   * waiting for ChromeRender on ready
   * @param params
   * {
   *   maxTab: >=1, max tab to render pages, more tab means faster but more require RAM.
   * }
   */
  async init(params = {}) {
    const { maxTab = 10, } = params;
    const { chromeLauncher, poll } = await createPool(maxTab);
    this.chromeLauncher = chromeLauncher;
    this.chromeTabFactory = poll;
  }

  /**
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

      client = await this.chromeTabFactory.acquire(0);
      const { Page, DOM, Runtime, Network, } = client;

      const resolveHTML = async () => {
        try {
          const dom = await DOM.getDocument();
          const ret = await DOM.getOuterHTML({ nodeId: dom.root.nodeId });
          resolve(ret.outerHTML);
        } catch (err) {
          reject(err);
        }
      }

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
        setTimeout(() => {
          reject(`can't wait for ready event after 3s`);
        }, 3000);
      } else {
        Page.domContentEventFired(resolveHTML);
      }

      await Page.navigate({ url, referrer });
    }).then((html) => {
      this.chromeTabFactory.release(client);
      return Promise.resolve(html);
    }).catch((err) => {
      this.chromeTabFactory.release(client);
      return Promise.reject(err);
    });
  }

  /**
   * destroy this chrome render, kill chrome, release all resource
   * @returns {Promise.<void>}
   */
  async destroy() {
    try {
      await this.chromeTabFactory.drain();
      await this.chromeTabFactory.clear();
    } catch (err) {
      console.error(err);
    } finally {
      this.chromeTabFactory = null;
      await this.chromeLauncher.kill();
      this.chromeLauncher = null;
    }
  }
}

module.exports = ChromeRender;