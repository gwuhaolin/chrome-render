'use strict';
const net = require('net');
const { ChromeLauncher } = require('lighthouse/lighthouse-cli/chrome-launcher');
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
 * launcher Chrome
 * @returns {Promise.<function>} chrome launcher
 */
async function launcherChrome(port) {
  const launcher = new ChromeLauncher({
    port,
    autoSelectChrome: true,
    additionalFlags: [
      // '--headless',
      '--disable-gpu',
    ]
  });
  await launcher.run();
  return launcher;
}

module.exports = {
  sysFreePort,
  launcherChrome,
};