'use strict';
const net = require('net');
const util = require('../lib/util');
const assert = require('assert');

describe('#util.js', function () {

  it('#sysFreePort()', async () => {
    const freePort = await util.sysFreePort();
    assert(typeof freePort === 'number', 'port is a int');
    return new Promise((resolve, reject) => {
      let server = net.createServer();
      server.listen(freePort, function () {
        server.close();
        resolve();
      });
      server.on('error', function (err) {
        reject(`freePort:${freePort} is not free`, err);
      });
    });
  });

  it('#launcherChrome()', async () => {
    const freePort = await util.sysFreePort();
    const launcher = await util.launcherChrome(freePort);
    assert.equal(launcher.port, freePort, 'chrome should run');
    await launcher.kill();
  });

});