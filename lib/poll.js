const chrome = require('chrome-remote-interface');
const { sysFreePort, launcherChrome } = require('./util');

class ChromeTabsPoll {

  async init(max = 10) {
    const port = await sysFreePort();
    this.port = port;
    this.chromeLauncher = await launcherChrome(port);
    this.tabs = {};
    const tabs = await chrome.List({ port });
    tabs.forEach(async (tab) => {
      const { id } = tab;
      this.tabs[id] = {
        free: true,
        client: await this.connect(id),
      };
    });
  }

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

  async require() {
    let tab = Object.keys(this.tabs).find(id => this.tabs[id].free);
    if (tab === undefined) {
      const id = await this.create();
      tab = this.tabs[id];
    }
    tab.free = false;
    return tab.client;
  }

  release(tabId) {
    let tab = this.tabs[tabId];
    tab.free = true;
  }

  async destory() {
    await this.chromeLauncher.kill();
    this.tabs = null;
    this.chromeLauncher = null;
    this.port = null;
  }

}

module.exports = ChromeTabsPoll;