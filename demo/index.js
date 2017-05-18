'use strict';
const Koa = require('koa');
const app = new Koa();
const ChromeRender = require('../index');
let chromeRender;

// error handle
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = 500;
    ctx.body = JSON.stringify(err);
  }
});

app.use(async (ctx) => {
  const { request, response } = ctx;
  const query = request.query;
  const start = new Date();
  response.body = await chromeRender.render(query);
  response.set('X-Render-Time', Date.now() - start);
});

(async () => {
  chromeRender = await ChromeRender.new();
  app.listen(3000);
})();