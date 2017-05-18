const EventEmitter = require('events');
const chrome = require('chrome-remote-interface');
const { sysFreePort, launcherChrome } = require('./util');

/**
 * ChromeTabsPoll used to manage chrome tabs, for reuse tab
 * use #new() static method to make a ChromeTabsPoll, don't use new ChromeTabsPoll()
 * #new() is a async function, new ChromeTabsPoll is use able util await it to be completed
 */
class ChromeTabsPoll extends EventEmitter {

  /**
   * make a new ChromeTabsPoll
   * @param {number} maxTab max tab to render pages, default is no limit
   * @returns {Promise.<*>}
   */
  static async new(maxTab = 100000) {
    const port = await sysFreePort();
    const chromeTabsPoll = new ChromeTabsPoll();
    chromeTabsPoll.port = port;
    chromeTabsPoll.chromeLauncher = await launcherChrome(port);
    chromeTabsPoll.tabs = {};
    chromeTabsPoll.maxTab = maxTab;
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
   * if tab count >= maxTab will not create new tab and return undefined
   * @return {Promise.<string>} tabId
   */
  async create() {
    const tabCount = Object.keys(this.tabs).length;
    if (tabCount < this.maxTab) {
      const tab = await chrome.New({ port: this.port });
      const { id } = tab;
      this.tabs[id] = {
        free: true,
        client: await this.connect(id),
      };
      return id;
    }
  }

  /**
   * get now is free tab to do job then set this tab to be busy util call #release() on this tab
   * @return {Promise.<{tabId: *, Page: *, DOM: *, Runtime: *, Network: *}|*>}
   */
  async require() {
    let tabId = Object.keys(this.tabs).find(id => this.tabs[id].free);
    if (tabId === undefined) {
      tabId = await this.create();
      // up to maxTab limit, should wait for tab release
      if (tabId === undefined) {
        tabId = await new Promise((resolve) => {
          this.once('release', resolve);
        });
      }
    }
    const tab = this.tabs[tabId];
    tab.free = false;
    return tab.client;
  }

  /**
   * call on a tab when your job on this tab is finished
   * @param {string} tabId
   */
  async release(tabId) {
    let tab = this.tabs[tabId];
    // navigate this tab to blank to release this tab's resource
    await tab.client.Page.navigate({ url: 'about:blank' });
    tab.free = true;
    this.emit('release', tabId);
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
    this.removeAllListeners('release');
  }

}

module.exports = ChromeTabsPoll;