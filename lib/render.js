'use strict';
const ChromeTabsPoll = require('./poll');
const package_json = require('../package.json');

const ERR_REQUIRE_URL = new Error('url param is required', 1);
const ERR_RENDER_TIMEOUT = new Error('chrome-render timeout', 1);
const ERR_NETWORK_LOADING_FAILED = new Error('network loading failed', 2);

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
   *  maxTab: `number` max tab chrome will open to render pages, default is no limit, `maxTab` used to avoid open to many tab lead to chrome crash.
   *  renderTimeout: `number` in ms, `chromeRender.render()` will throw error if html string can't be resolved after `renderTimeout`, default is 5000ms.
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
   * render page in chrome, and return page html string
   * @param params
   * {
   *      url: `string` is required, web page's URL
   *      referrer: `string` set HTTP referrer header when request web page
   *      cookies: `object {cookieName:cookieValue}` set HTTP cookies when request web page
   *      ready: `string` is an option param. if it's absent chrome will return page html on dom event `domContentEventFired`, else will waiting util js in web page call `console.log(${ready's value})`. et `ready=_ready_flag` when web page is ready call `console.log('_ready_flag')`.
   *      script: inject script to evaluate when page on load
   * }
   * @returns {Promise.<string>} page html string
   */
  async render(params) {
    let client;
    return await new Promise(async (resolve, reject) => {
      let hasFailed = false;

      let { url, referrer, cookies, ready, script } = params;

      // params assert
      // page url's requires
      if (!url) {
        hasFailed = true;
        return reject(ERR_REQUIRE_URL);
      }

      // open a tab
      client = await this.chromeTabsPoll.require();
      const { Page, DOM, Runtime, Network, } = client;

      // get and resolve page HTML string when ready
      const resolveHTML = async () => {
        if (hasFailed === false) {
          try {
            const dom = await DOM.getDocument();
            const ret = await DOM.getOuterHTML({ nodeId: dom.root.nodeId });
            resolve(ret.outerHTML);
          } catch (err) {
            reject(err);
          }
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
          hasFailed = true;
          reject(ERR_RENDER_TIMEOUT);
        }, renderTimeout);
      } else {
        Page.domContentEventFired(resolveHTML);
      }

      // detect page load failed error
      let requestId;
      Network.requestWillBeSent((params) => {
        requestId = params.requestId;
      });
      Network.loadingFailed((params) => {
        if (params.requestId === requestId) {
          hasFailed = true;
          reject(ERR_NETWORK_LOADING_FAILED);
        }
      });

      // inject script to evaluate when page on load
      if (typeof script === 'string') {
        Page.addScriptToEvaluateOnLoad({
          scriptSource: script,
        });
      }

      // detect request from chrome-render
      Network.setExtraHTTPHeaders({
        headers: {
          'X-Chrome-Render': package_json.version
        }
      });

      // to go page
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