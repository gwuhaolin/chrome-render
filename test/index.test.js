'use strict';
const assert = require('assert');
const ChromeRender = require('../index');

process.on('unhandledRejection', console.trace);

describe('#ChromeRender', function () {
  this.timeout(10000);

  it('#render()', async function () {
    const chromeRender = await ChromeRender.new();
    const html = await chromeRender.render({
      url: 'https://gwuhaolin.github.io/redemo/',
      renderTimeout: 2000,
    });
    console.log(html);
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
    console.log(html);
    await chromeRender.destroyRender();
  });

  it('#render() set referrer', async function () {
    const chromeRender = await ChromeRender.new();
    const html = await chromeRender.render({
      url: 'http://google.com',
      referrer: 'http://baidu.com'
    });
    console.log(html);
    await chromeRender.destroyRender();
  });

  it('#render() should timeout', function (done) {
    this.timeout(2000);
    (async () => {
      const chromeRender = await ChromeRender.new();
      try {
        const html = await chromeRender.render({
          url: 'http://qq.com',
          useReady: true,
          renderTimeout: 1000,
        });
        console.log(html);
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
    this.timeout(20000);
    const chromeRender = await ChromeRender.new();
    const html = await chromeRender.render({
      url: 'https://gwuhaolin.github.io/reflv/live.html',
      useReady: true,
      renderTimeout: 5000
    });
    console.log(html);
    assert(html.indexOf('data-reactroot=') > 0, 'should resolve after react render html out');
    await chromeRender.destroyRender();
  });

  it('#render() proper release', async function () {
    this.timeout(15000);
    const chromeRender = await ChromeRender.new({
      maxTab: 8
    });
    await chromeRender.render({
      url: 'https://gwuhaolin.github.io/redemo/',
      useReady: true,
      script: `setTimeout(function(){ window.isPageReady=1 }, 1000);`,
      renderTimeout: 5000
    });

    await chromeRender.render({
      url: 'https://gwuhaolin.github.io/redemo/',
      useReady: true,
      script: `setTimeout(function(){ window.isPageReady=1 }, 1000);`,
      renderTimeout: 5000
    });
    await chromeRender.destroyRender();
  });

  it('#render() inject script', async function () {
    const chromeRender = await ChromeRender.new();
    const html = await chromeRender.render({
      url: 'https://bing.com',
      useReady: true,
      script: `setTimeout(function(){ window.isPageReady=1 }, 1000);`,
    });
    console.log(html);
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

  it('#render() use mobile to visit by set deviceMetricsOverride', async function () {
    const chromeRender = await ChromeRender.new();

    // mobile version
    let html = await chromeRender.render({
      url: 'https://www.google.com',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_0 like Mac OS X) AppleWebKit/602.1.38 (KHTML, like Gecko) Version/10.0 Mobile/14A300 Safari/602.1',
      },
      deviceMetricsOverride: {
        width: 100,
        height: 200,
        deviceScaleFactor: 0,
        fitWindow: true,
        mobile: true,
      }
    });
    assert(html.indexOf('apple-touch-icon') > 0, `visit mobile version should has apple-touch-icon, html:${html}`);

    // desktop version
    html = await chromeRender.render({
      url: 'https://www.google.com',
    });
    assert(html.indexOf('apple-touch-icon') === -1, `default is visit desktop version should not has apple-touch-icon, html:${html}`);

    await chromeRender.destroyRender();
  });

});