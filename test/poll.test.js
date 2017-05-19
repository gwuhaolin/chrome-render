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
    await chromeTabsPoll.destroyPoll();
  });

  it('#createTab()', async () => {
    return await chromeTabsPoll.createTab();
  });

  it('#createTab() set maxTab', async () => {
    const maxTab = 4;
    let chromeTabsPoll = await ChromeTabsPoll.new(maxTab);
    assert.equal(chromeTabsPoll.maxTab, maxTab);
    await chromeTabsPoll.require();
    await chromeTabsPoll.require();
    const client1 = await chromeTabsPoll.require();
    const client2 = await chromeTabsPoll.require();
    assert.equal(Object.keys(chromeTabsPoll.tabs).length, maxTab, `open tabs should be equal to ${maxTab}`);
    console.log(`${maxTab} tabs has created, next require will return util a tab has be released after 5s`);
    setTimeout(() => {
      chromeTabsPoll.release(client1.tabId);
      chromeTabsPoll.release(client2.tabId);
    }, 5000);
    await chromeTabsPoll.require();
    await chromeTabsPoll.require();
    await chromeTabsPoll.destroyPoll();
  });

  // it('#connectTab()', async () => {
  //   const chromeTabsPoll = await ChromeTabsPoll.new();
  //   const tabId = await chromeTabsPoll.createTab();
  //   const client = await chromeTabsPoll.connectTab(tabId);
  //   assert.equal(client.tabId, tabId, 'connect to an exited tab should has same tabId');
  //   await chromeTabsPoll.destroyPoll();
  // });

  it('#require() #release()', async () => {
    const client = await chromeTabsPoll.require();
    assert.equal(chromeTabsPoll.tabs[client.tabId].free, false, 'after require tab should be busy');
    await chromeTabsPoll.release(client.tabId);
    assert.equal(chromeTabsPoll.tabs[client.tabId].free, true, 'after release tab should be free');
  });

});