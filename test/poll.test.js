'use strict';
const ChromeTabsPoll = require('../lib/poll');

describe('#ChromeTabsPoll', function () {

  it('#init()', async () => {
    const chromeTabsPoll = new ChromeTabsPoll();
    await chromeTabsPoll.init();
  });

  it('#create()', async () => {
    const chromeTabsPoll = new ChromeTabsPoll();
    await chromeTabsPoll.init();
    await chromeTabsPoll.create();
  });

  it('#require() release()', async () => {
    const chromeTabsPoll = new ChromeTabsPoll();
    await chromeTabsPoll.init();
    const client = await chromeTabsPoll.require();
    chromeTabsPoll.release(client.tabId);
    await chromeTabsPoll.destory();
  });

})