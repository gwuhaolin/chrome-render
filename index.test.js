'use strict';
const assert = require('assert');
const ChromeRender = require('./index');

describe('#ChromeRender', function () {
  this.timeout(100000);

  let chromeRender;

  beforeEach(async () => {
    // start a chrome
    chromeRender = await ChromeRender.new();
  });

  afterEach(async () => {
    // close all tab and exit chrome
    await chromeRender.destroyRender();
  });

  it('#render()', async () => {
    return await chromeRender.render({
      url: 'https://gwuhaolin.github.io/redemo/',
    });
  });

  it('#render() set cookies', async () => {
    return await chromeRender.render({
      url: 'https://gwuhaolin.github.io/reflv/',
      cookies: {
        'token': 'token value'
      },
    });
  });

  it('#render() set referrer', async () => {
    return await chromeRender.render({
      url: 'http://qq.com',
      referrer: 'http://google.com'
    });
  });

  it('#render() cant load', async () => {
    try {
      await chromeRender.render({
        url: 'http://thispage.cantload.com',
      });
    } catch (err) {
      assert.equal(err.message, 'network loading failed');
      return Promise.resolve(err);
    }
  });

  it('#render() use ready', async () => {
    const html = await chromeRender.render({
      url: 'http://localhost:3000',
      useReady: true,
    });
    console.log(html);
  });

  it('#render() inject script', async () => {
    const html = await chromeRender.render({
      url: 'https://gwuhaolin.github.io/remd/',
      script: `window.alert(document.title);`,
    });
    console.log(html);
  });

  it('#render() render multi pages sames time', async () => {
    const tasks = [];
    [
      'http://qq.com',
      'https://baidu.com',
      'https://taobao.com',
      'https://tmall.com',
      'https://ke.qq.com',
      'https://news.qq.com',
      'http://tech.qq.com',
      'http://games.qq.com',
      'http://sports.qq.com',
      'http://auto.qq.com',
      'https://jd.com',
    ].forEach(url => {
      tasks.push(chromeRender.render({ url }));
    });
    return await Promise.all(tasks);
  });

});