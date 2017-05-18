'use strict';
const ChromeTabsPoll = require('../lib/poll');
const assert = require('assert');

describe('#ChromeTabsPoll', function () {
  this.timeout(20000);
  let chromeTabsPoll;

  beforeEach(async () => {
    chromeTabsPoll = await ChromeTabsPoll.new();
  });

  afterEach(async () => {
    await chromeTabsPoll.destroy();
  });

  it('#create()', async () => {
    return await chromeTabsPoll.create();
  });

  it('#create() set maxTab', async () => {
    const maxTab = 2;
    let chromeTabsPoll = await ChromeTabsPoll.new(maxTab);
    assert.equal(chromeTabsPoll.maxTab, maxTab);
    const client1 = await chromeTabsPoll.require();
    await chromeTabsPoll.require();
    console.log(`2 tabs has created, next require will return util release has be released after 5s`);
    setTimeout(() => {
      chromeTabsPoll.release(client1.tabId);
    }, 5000);
    return await chromeTabsPoll.require();
  });

  // it('#connect()', async () => {
  //   const chromeTabsPoll = await ChromeTabsPoll.new();
  //   const tabId = await chromeTabsPoll.create();
  //   const client = await chromeTabsPoll.connect(tabId);
  //   assert.equal(client.tabId, tabId, 'connect to an exited tab should has same tabId');
  //   await chromeTabsPoll.destroy();
  // });

  it('#require() #release()', async () => {
    const client = await chromeTabsPoll.require();
    assert.equal(chromeTabsPoll.tabs[client.tabId].free, false, 'after require tab should be busy');
    await chromeTabsPoll.release(client.tabId);
    assert.equal(chromeTabsPoll.tabs[client.tabId].free, true, 'after release tab should be free');
  });

});