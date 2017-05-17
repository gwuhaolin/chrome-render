'use strict';
const ChromeRender = require('../index');

describe('ChromeRender', function () {
  this.timeout(10000);

  it('#render()', async () => {
    const chromeRender = new ChromeRender();
    await chromeRender.init();
    const html = await chromeRender.render({
      url: 'http://qq.com',
    });
    console.log(html);
    await chromeRender.destroy();
  });

  it('#render() set cookies', async () => {
    const chromeRender = new ChromeRender();
    await chromeRender.init();
    const html = await chromeRender.render({
      url: 'http://qq.com',
      cookies: {
        'token': 'token value'
      },
    });
    console.log(html);
    await chromeRender.destroy();
  });

  it('#render() set referrer', async () => {
    const chromeRender = new ChromeRender();
    await chromeRender.init();
    const html = await chromeRender.render({
      url: 'http://qq.com',
      referrer: 'http://google.com'
    });
    console.log(html);
    await chromeRender.destroy();
  });

  it('#render() set ready', async () => {
    const chromeRender = new ChromeRender();
    await chromeRender.init();
    const html = await chromeRender.render({
      url: 'http://qq.com',
      ready: 'flag-page-ready'
    });
    console.log(html);
    await chromeRender.destroy();
  });

  it('#render() render multi pages sames time', async () => {
    const chromeRender = new ChromeRender();
    await chromeRender.init();
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
      'https://google.com',
      'https://github.com',
      'https://apple.com',
      'https://twitter.com',
      'https://facebook.com',
      'https://bing.com',
    ].forEach(url => {
      tasks.push(chromeRender.render({ url }));
    });
    const htmls = await Promise.all(tasks);
    htmls.forEach(console.log);
    await chromeRender.destroy();
  });

});