const chrome = require('chrome-remote-interface');
const { sysFreePort, launcherChrome } = require('./util');

/**
 * ChromeTabsPoll used to manage chrome tabs, for reuse tab
 * use #new() static method to make a ChromeTabsPoll, don't use new ChromeTabsPoll()
 * #new() is a async function, new ChromeTabsPoll is use able util await it to be completed
 */
class ChromeTabsPoll {

  /**
   * make a new ChromeTabsPoll
   * @param {number} max max tab to render pages
   * @returns {Promise.<*>}
   */
  static async new(max = 10) {
    const port = await sysFreePort();
    const chromeTabsPoll = new ChromeTabsPoll();
    chromeTabsPoll.port = port;
    chromeTabsPoll.chromeLauncher = await launcherChrome(port);
    chromeTabsPoll.tabs = {};
    const tabs = await chrome.List({ port });
    tabs.forEach(async (tab) => {
      const { id } = tab;
      chromeTabsPoll.tabs[id] = {
        free: true,
        client: await chromeTabsPoll.connect(id),
      };
    });
    return chromeTabsPoll;
  }

  /**
   * connect to an exited tab then add it to poll
   * @param {string} tabId chrome tab id
   * @return {Promise.<{tabId: *, Page: *, DOM: *, Runtime: *, Network: *}>}
   */
  async connect(tabId) {
    // 连接远程chrome
    const protocol = await chrome({ target: `ws://localhost:${this.port}/devtools/page/${tabId}` });
    const { Page, DOM, Runtime, Network } = protocol;
    await Promise.all([Page.enable(), DOM.enable(), Runtime.enable(), Network.enable()]);
    return {
      tabId,
      Page,
      DOM,
      Runtime,
      Network,
    }
  }

  /**
   * create a new tab in connected chrome then add it to poll
   * @return {Promise.<string>} tabId
   */
  async create() {
    // 新开一个tab
    const tab = await chrome.New({ port: this.port });
    const { id } = tab;
    this.tabs[id] = {
      free: true,
      client: await this.connect(id),
    };
    return id;
  }

  /**
   * get now is free tab to do job then set this tab to be busy util call #release() on this tab
   * @return {Promise.<{tabId: *, Page: *, DOM: *, Runtime: *, Network: *}|*>}
   */
  async require() {
    let tabId = Object.keys(this.tabs).find(id => this.tabs[id].free);
    if (tabId === undefined) {
      tabId = await this.create();
    }
    const tab = this.tabs[tabId];
    tab.free = false;
    return tab.client;
  }

  /**
   * call on a tab when your job on this tab is finished
   * @param {string} tabId
   */
  release(tabId) {
    let tab = this.tabs[tabId];
    tab.free = true;
  }

  /**
   * close chrome and release all resource used by this poll
   * @return {Promise.<void>}
   */
  async destroy() {
    await this.chromeLauncher.kill();
    this.tabs = null;
    this.chromeLauncher = null;
    this.port = null;
  }

}

module.exports = ChromeTabsPoll;