[![Npm Package](https://img.shields.io/npm/v/chrome-render.svg?style=flat-square)](https://www.npmjs.com/package/chrome-render)
[![Npm Downloads](http://img.shields.io/npm/dm/chrome-render.svg?style=flat-square)](https://www.npmjs.com/package/chrome-render)
[![Dependency Status](https://david-dm.org/gwuhaolin/chrome-render.svg?style=flat-square)](https://npmjs.org/package/chrome-render)
[![Build Status](https://img.shields.io/travis/gwuhaolin/chrome-render.svg?style=flat-square)](https://travis-ci.org/gwuhaolin/chrome-render)

# General server render base on chrome
Render any web page render data in browser in server for SEO or other optimizes. 
Base on awesome [Headless chrome](https://www.chromestatus.com/feature/5678767817097216).

## Use
1. install it from npm by `npm i chrome-render`
2. init a ChromeRender then use `chromeRender` to render a web page
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
see more demo in [unit test](./test/render.test.js)

#### `ChromeRender.new()` method support options:
- `maxTab`: `number` max tab chrome will open to render pages, default is no limit 
- `renderTimeout`: `number` in ms, `chromeRender.render()` will throw error if html string can't be resolved after `renderTimeout`,default is 5000ms

#### `chromeRender.render()` method support options:
- `url`: `string` is required, web page's URL 
- `referrer`: `string` set HTTP referrer header when request web page
- `cookies`: `object {cookieName:cookieValue}` set HTTP cookies when request web page
- `ready`: `string` is an option param. if it's not set chrome will return page html on dom event `domContentEventFired`, else will waiting util js in web page call `console.log(ready's value)`

## Performce
`ChromeRender` will create a tab poll to reuse tab for performce improve and resource reduce as open and close tab in chrome require time.
TODO

## Resource use
TODO
 
## Dependencies
1. depend on [Chrome Canary](https://www.google.com/chrome/browser/canary.html) now
2. Nodejs 7+
 