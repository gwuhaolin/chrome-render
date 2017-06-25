'use strict';
const ChromePoll = require('chrome-pool');
const package_json = require('./package.json');

const ERR_REQUIRE_URL = new Error('url param is required', 1);
const ERR_RENDER_TIMEOUT = new Error('chrome-render timeout', 2);
const ERR_PAGE_LOAD_FAILED = new Error('page load failed', 3);

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
   *
   * }
   * @return {Promise.<ChromeRender>}
   */
  static async new(params = {}) {
    const { maxTab} = params;
    const chromeRender = new ChromeRender();
    chromeRender.chromePoll = await ChromePoll.new({
      maxTab,
      protocols: ['Page', 'DOM', 'Network', 'Console'],
    });
    return chromeRender;
  }

  /**
   * render page in chrome, and return page html string
   * @param params
   * {
   *      url: `string` is required, web page's URL
   *      cookies: `object {cookieName:cookieValue}` set HTTP cookies when request web page
   *      headers: `object {headerName:headerValue}` add HTTP headers when request web page
   *      useReady: `boolean` whether use `window.chromeRenderReady()` to notify chrome-render page has ready. default is false chrome-render use `domContentEventFired` as page has ready.
   *      script: inject script to evaluate when page on load
   *      renderTimeout: `number` in ms, `render()` will throw error if html string can't be resolved after `renderTimeout`, default is 5000ms.
   * }
   * @returns {Promise.<string>} page html string
   */
  async render(params) {
    let client;
    return await new Promise(async (resolve, reject) => {
      let hasFailed = false;
      let timer;
      let { url, cookies, headers = {}, useReady, script, renderTimeout = 5000 } = params;


      // params assert
      // page url's requires
      if (!url) {
        hasFailed = true;
        return reject(ERR_REQUIRE_URL);
      }


      // open a tab
      client = await this.chromePoll.require();
      const { Page, DOM, Console, Network, } = client.protocol;

      // add timeout reject
      timer = setTimeout(() => {
        hasFailed = true;
        reject(ERR_RENDER_TIMEOUT);
      }, renderTimeout);

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
        clearTimeout(timer);
      };


      // inject cookies
      if (cookies && typeof cookies === 'object') {
        Object.keys(cookies).forEach((name) => {
          Network.setCookie({
            url: url,
            name: name,
            value: cookies[name],
          });
        })
      }

      // detect page load failed error
      let firstRequestId;
      Network.requestWillBeSent((params) => {
        if (firstRequestId === undefined) {
          firstRequestId = params.requestId;
        }
      });
      Network.loadingFailed((params) => {
        if (params.requestId === firstRequestId) {
          hasFailed = true;
          reject(ERR_PAGE_LOAD_FAILED);
        }
      });

      if (useReady) {
        Page.addScriptToEvaluateOnLoad({
          scriptSource: `
window.chromeRenderReady = function(){
  console.log('_CReady');
}`,
        });
      }

      // inject script to evaluate when page on load
      if (typeof script === 'string') {
        Page.addScriptToEvaluateOnLoad({
          scriptSource: script,
        });
      }


      // detect request from chrome-render
      Network.setExtraHTTPHeaders({
        headers: Object.assign({
          'x-chrome-render': package_json.version
        }, headers),
      });

      if (useReady) {
        Console.messageAdded((consoleMessage) => {
          if (consoleMessage.message.text === '_CReady') {
            resolveHTML();
          }
        });
      } else {
        Page.domContentEventFired(resolveHTML);
      }

      // to go page
      await Page.navigate({
        url,
        referrer: headers['referrer']
      });
    }).then((html) => {
      this.chromePoll.release(client.tabId);
      return Promise.resolve(html);
    }).catch((err) => {
      this.chromePoll.release(client.tabId);
      return Promise.reject(err);
    });
  }

  /**
   * destroyPoll this chrome render, kill chrome, release all resource
   * @returns {Promise.<void>}
   */
  async destroyRender() {
    await this.chromePoll.destroyPoll();
    this.chromePoll = null;
  }
}

module.exports = ChromeRender;