'use strict';
const ChromeTabsPoll = require('../lib/poll');
const assert = require('assert');

describe('#ChromeTabsPoll', function () {
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
    chromeTabsPoll.release(client.tabId);
    assert.equal(chromeTabsPoll.tabs[client.tabId].free, true, 'after release tab should be free');
  });

});