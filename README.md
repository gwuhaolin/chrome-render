[![Npm Package](https://img.shields.io/npm/v/chrome-render.svg?style=flat-square)](https://www.npmjs.com/package/chrome-render)
[![Npm Downloads](http://img.shields.io/npm/dm/chrome-render.svg?style=flat-square)](https://www.npmjs.com/package/chrome-render)
[![Dependency Status](https://david-dm.org/gwuhaolin/chrome-render.svg?style=flat-square)](https://npmjs.org/package/chrome-render)

# General server render base on chrome
Render any web page render data in browser in server for SEO or other optimizes. 
Base on awesome [Headless chrome](https://www.chromestatus.com/feature/5678767817097216).

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
see more demo in [unit test](./index.test.js)

#### `ChromeRender.new()` method support options:
- `maxTab`: `number` max tab chrome will open to render pages, default is no limit, `maxTab` used to avoid open to many tab lead to chrome crash. `ChromeRender` will create a tab poll to reuse tab for performance improve and resource reduce as open and close tab in chrome require time, like database connection poll. 
- `renderTimeout`: `number` in ms, `chromeRender.render()` will throw error if html string can't be resolved after `renderTimeout`, default is 5000ms.

#### `chromeRender.render()` method support options:
- `url`: `string` is required, web page's URL 
- `cookies`: `object {cookieName:cookieValue}` is an option param. set HTTP cookies when request web page
- `headers`: `object {headerName:headerValue}` is an option param. add HTTP headers when request web page
- `ready`: `string` is an option param. if it's omitted chrome will return page html on dom event `domContentEventFired`, else will waiting util js in web page call `console.log(${ready's value})`. et `ready=_ready_flag` when web page is ready call `console.log('_ready_flag')`.
- `script`: `string` is an option param. inject script source to evaluate when page on load

all request from chrome-render will take with a HTTP header `X-Chrome-Render:${version}`

## Dependencies
1. [Chrome 59+](https://www.google.com/chrome/browser/desktop/index.html) should install on you system
2. Nodejs 7+
 
## Friends
- [koa-chrome-render](https://github.com/gwuhaolin/koa-chrome-render) chrome-render middleware for koa.
- [koa-seo](https://github.com/gwuhaolin/koa-seo) SEO middleware for koa base on [chrome-render](https://github.com/gwuhaolin/chrome-render) substitute for [prerender](https://prerender.io).
- [chrome-pool](https://github.com/gwuhaolin/chrome-pool) Headless chrome tabs manage pool.
 