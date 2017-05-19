const chrome = require('chrome-remote-interface');
const { sysFreePort, launchChrome } = require('./util');

/**
 * ChromeTabsPoll used to manage chrome tabs, for reuse tab
 * use #new() static method to make a ChromeTabsPoll, don't use new ChromeTabsPoll()
 * #new() is a async function, new ChromeTabsPoll is use able util await it to be completed
 */
class ChromeTabsPoll {

  /**
   * make a new ChromeTabsPoll
   * @param {number} maxTab max tab to render pages, default is no limit
   * @returns {Promise.<*>}
   */
  static async new(maxTab = 100000/*TODO no limit*/) {
    const port = await sysFreePort();
    const chromeTabsPoll = new ChromeTabsPoll();
    chromeTabsPoll.port = port;
    chromeTabsPoll.chromeLauncher = await launchChrome(port);
    chromeTabsPoll.tabs = {};
    chromeTabsPoll.maxTab = maxTab;
    chromeTabsPoll.requireResolveTasks = [];
    const tabs = await chrome.List({ port });
    tabs.forEach(async (tab) => {
      const { id } = tab;
      chromeTabsPoll.tabs[id] = {
        free: true,
        client: await chromeTabsPoll.connectTab(id),
      };
    });
    return chromeTabsPoll;
  }

  /**
   * connect to an exited tab then add it to poll
   * @param {string} tabId chrome tab id
   * @return {Promise.<{tabId: *, Page: *, DOM: *, Runtime: *, Network: *}>}
   */
  async connectTab(tabId) {
    // 连接远程chrome
    const protocol = await chrome({ target: `ws://127.0.0.1:${this.port}/devtools/page/${tabId}` });
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
  async createTab() {
    const tabCount = Object.keys(this.tabs).length;
    if (tabCount < this.maxTab) {
      const tab = await chrome.New({ port: this.port });
      const { id } = tab;
      this.tabs[id] = {
        free: true,
        client: await this.connectTab(id),
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
      tabId = await this.createTab();
      // up to maxTab limit, should wait for tab release
      if (tabId === undefined) {
        tabId = await new Promise((resolve) => {
          this.requireResolveTasks.unshift(resolve);
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
    if (this.requireResolveTasks.length > 0) {
      const resolve = this.requireResolveTasks.pop();
      resolve(tabId);
    }
  }

  /**
   * close chrome and release all resource used by this poll
   * @return {Promise.<void>}
   */
  async destroyPoll() {
    await this.chromeLauncher.kill();
    this.tabs = null;
    this.chromeLauncher = null;
    this.port = null;
    this.requireResolveTasks = null;
  }

}

module.exports = ChromeTabsPoll;