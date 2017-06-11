'use strict';
const net = require('net');
const { launch } = require('lighthouse/chrome-launcher');
const chrome = require('chrome-remote-interface');

/**
 * get next free port in system
 * @returns {Promise}
 */
function sysFreePort() {
  return new Promise((resolve, reject) => {
    let server = net.createServer();
    server.listen(0, function () {
      const port = server.address().port;
      server.once('close', function () {
        resolve(port);
      });
      server.close();
      server = null;
    });
    server.on('error', function (err) {
      reject(err);
    });
  });
}

/**
 * launch Chrome
 * @returns {Promise.<function>} chrome launcher
 */
async function launchChrome(port) {
  return await launch({
    port: port,
    chromeFlags: [
      '--headless',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-speech-api',
      '--disable-signin-scoped-device-id',
      '--disable-component-extensions-with-background-pages',
    ]
  });
}

module.exports = {
  sysFreePort,
  launchChrome,
};