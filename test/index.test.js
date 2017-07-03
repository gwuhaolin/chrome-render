'use strict';
const assert = require('assert');
const ChromeRender = require('../index');

describe('#ChromeRender', function () {
  this.timeout(10000);

  it('#render()', async function () {
    const chromeRender = await ChromeRender.new();
    const html = await chromeRender.render({
      url: 'https://gwuhaolin.github.io/redemo/',
    });
    // console.log(html);
    await chromeRender.destroyRender();
  });

  it('#render() set cookies', async function () {
    const chromeRender = await ChromeRender.new();
    const html = await chromeRender.render({
      url: 'https://gwuhaolin.github.io/reflv/',
      cookies: {
        'token': 'token value'
      },
    });
    // console.log(html);
    await chromeRender.destroyRender();
  });

  it('#render() set referrer', async function () {
    const chromeRender = await ChromeRender.new();
    const html = await chromeRender.render({
      url: 'http://google.com',
      referrer: 'http://baidu.com'
    });
    // console.log(html);
    await chromeRender.destroyRender();
  });

  it('#render() should timeout', function (done) {
    this.timeout(2000);
    (async () => {
      const chromeRender = await ChromeRender.new();
      try {
        await chromeRender.render({
          url: 'http://qq.com',
          useReady: true,
          renderTimeout: 1000,
        });
      } catch (err) {
        assert.equal(err.message, 'chrome-render timeout');
        done();
      }
      await chromeRender.destroyRender();
    })()
  });

  it('#render() cant load', async function () {
    const chromeRender = await ChromeRender.new();
    try {
      await chromeRender.render({
        url: 'http://thispage.cantload.com',
      });
    } catch (err) {
      assert.equal(err.message, 'page load failed');
      return Promise.resolve(err);
    }
    await chromeRender.destroyRender();
  });

  it('#render() use ready', async function () {
    const chromeRender = await ChromeRender.new();
    const html = await chromeRender.render({
      url: 'https://gwuhaolin.github.io/reflv/live.html',
      useReady: true,
    });
    // console.log(html);
    await chromeRender.destroyRender();
  });

  it('#render() inject script', async function () {
    const chromeRender = await ChromeRender.new();
    const html = await chromeRender.render({
      url: 'https://bing.com',
      useReady: true,
      script: `window.isPageReady=1;`,
    });
    // console.log(html);
    await chromeRender.destroyRender();
  });

  it('#render() render multi pages concurrent', async function () {
    this.timeout(100000);
    const chromeRender = await ChromeRender.new();
    const tasks = [];
    [
      'https://github.com',
      'https://www.alibaba.com',
      'https://bing.com',
    ].forEach(url => {
      tasks.push(chromeRender.render({
        url,
        renderTimeout: 100000,
      }));
    });
    await Promise.all(tasks);
    await chromeRender.destroyRender();
  });

});