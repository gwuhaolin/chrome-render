# General server render base on chrome
Render any web page render data in browser in server for SEO or other optimizes. 
Base on awesome [Headless chrome](https://www.chromestatus.com/feature/5678767817097216).

## Use
#### start render server:
1. git clone this project, 
2. cd to project dir,
3. run `node index.js`

#### request service:
send http GET request to `http://localhost:3000`, support query params:
- url: target page's url, required
- cookies: inject cookies when request page, is a json in format `{"cookie name":"cookie value"}`
- referrer: inject HTTP referrer header when request page.
- ready: is an option param. if it's not set chrome will return page html on `domContentEventFired`, else will waiting util `console.log(ready)` was call in page.

## Dependencies
1. depend on [Chrome Canary](https://www.google.com/chrome/browser/canary.html) now
2. Nodejs 7+
 