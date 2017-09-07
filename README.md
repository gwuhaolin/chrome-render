[![Npm Package](https://img.shields.io/npm/v/chrome-render.svg?style=flat-square)](https://www.npmjs.com/package/chrome-render)
[![Build Status](https://img.shields.io/travis/gwuhaolin/chrome-render.svg?style=flat-square)](https://travis-ci.org/gwuhaolin/chrome-render)
[![Npm Downloads](http://img.shields.io/npm/dm/chrome-render.svg?style=flat-square)](https://www.npmjs.com/package/chrome-render)
[![Dependency Status](https://david-dm.org/gwuhaolin/chrome-render.svg?style=flat-square)](https://npmjs.org/package/chrome-render)

# chrome-render
High-performance and universal server render base on [Headless chrome](https://www.chromestatus.com/feature/5678767817097216), render any SPA(render data in browser) in server for [SEO](https://github.com/gwuhaolin/koa-seo) or [other optimizes](https://github.com/gwuhaolin/koa-chrome-render). 

## Use
1. install it from npm by `npm i chrome-render`

2. new a `ChromeRender` then use it to `render` a web page, a `ChromeRender` means a chrome.
```js
const ChromeRender = require('chrome-render');
// ChromeRender.new() return a Promise, you can use async function in this way:
// const chromeRender = await ChromeRender.new(); 
ChromeRender.new({}).then(async(chromeRender)=>{
    const htmlString = await chromeRender.render({
       url: 'http://qq.com',
    });
});    
```
> A `chromeRender` instance can call `render` multi-times and concurrent for high frequency use case.
> `chromeRender` will manage a tabs pool to `render` multi-pages concurrent.

3. After you don't need chromeRender anymore, you should call `await chromeRender.destroyRender()` to kill chrome add release all resource.

see more demo in [unit test](test/index.test.js)

## API
#### `ChromeRender.new()` method support options:
- `maxTab`: `number` max tab chrome will open to render pages, default is no limit, `maxTab` used to avoid open to many tab lead to chrome crash. `ChromeRender` will create a tab poll to reuse tab for performance improve and resource reduce as open and close tab in chrome require time, like database connection poll. 
- `chromeRunnerOptions`: `object` same as chrome-runner's options, can config chrome's startup options, detail see [chrome-runner options](https://github.com/gwuhaolin/chrome-runner#options)

#### `chromeRender.render()` method support options:
- `url`: `string` is required, web page's URL 
- `cookies`: `object {cookieName:cookieValue}` is an option param. set HTTP cookies when request web page
- `headers`: `object {headerName:headerValue}` is an option param. add HTTP headers when request web page
- `useReady`: `boolean` whether use `window.isPageReady=1` to notify chrome-render page is ready. default is false chrome-render use `domContentEventFired` as page has ready.
- `script`: `string` is an option param. inject script source to evaluate when page on load
- `renderTimeout`: `number` in ms, `render()` will throw error if html string can't be resolved after `renderTimeout`, default is 5000ms.
- `deviceMetricsOverride`: `object` overrides the values of device screen dimensions for responsive websites, detail use see [here](https://chromedevtools.github.io/devtools-protocol/tot/Emulation/#method-setDeviceMetricsOverride)
- `clearTab`: `boolean` if `true` after render chrome instance will navigate to `about:blank` to free resources. default is `true`. setting to `false` may increase page load speed when rendering the same website.

> all request from chrome-render will take with a HTTP header `x-chrome-render:${version}`
 
## Friends
- chrome-render dependent on [chrome-pool](https://github.com/gwuhaolin/chrome-pool) headless chrome tabs manage pool.
- [chrome-runner](https://github.com/gwuhaolin/chrome-runner) run chrome with nodejs in code.
- [koa-chrome-render](https://github.com/gwuhaolin/koa-chrome-render) chrome-render middleware for koa.
- [koa-seo](https://github.com/gwuhaolin/koa-seo) SEO middleware for koa base on chrome-render substitute for [prerender](https://prerender.io).
