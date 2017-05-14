'use strict';
const { ChromeLauncher } = require('lighthouse/lighthouse-cli/chrome-launcher');
const chrome = require('chrome-remote-interface');

(async () => {
    // 启动chrome
    const launcher = new ChromeLauncher({
        autoSelectChrome: true,
        additionalFlags: [
            '--disable-gpu',
            // '--headless',
        ]
    });
    await launcher.run();
})();

async function render(query) {
    let tab;
    // 关闭打开的tab
    const closeTab = () => {
        setTimeout(() => {
            if (tab) {
                chrome.Close(tab);
            }
        }, 0);
    }
    return await new Promise(async (resolve, reject) => {

        let { url, cookies, referrer, ready, } = query;
        if (!url) {
            return reject(`required url params.`);
        }

        // 新开一个tab
        tab = await chrome.New();
        // 连接远程chrome
        const protocol = await chrome({ target: tab });
        const { Page, DOM, Runtime, Network } = protocol;
        await Promise.all([Page.enable(), DOM.enable(), Runtime.enable(), Network.enable()])

        const resolveHTML = async () => {
            const dom = await DOM.getDocument();
            const ret = await DOM.getOuterHTML({ nodeId: dom.root.nodeId });
            resolve(ret.outerHTML);
        }

        // 如果有cookies参数就注入cookies
        if (typeof cookies === 'string') {
            cookies = JSON.parse(cookies);
            Object.keys(cookies).forEach((name) => {
                Network.setCookie({
                    url: url,
                    name: name,
                    value: cookies[name],
                });
            })
        }

        // 如果有ready参数就使用，否则使用domContentEventFired
        if (typeof ready === 'string') {
            Runtime.consoleAPICalled((data) => {
                const { type, args } = data;
                if (type === 'log' && args.length === 1 && args[0].value === ready) {
                    //noinspection JSIgnoredPromiseFromCall
                    resolveHTML();
                }
            });
            // 3秒后ready不好就报错
            setTimeout(() => {
                reject(`can't wait for ready event after 3s`);
            }, 3000);
        } else {
            // 监听事件
            Page.domContentEventFired(resolveHTML);
        }

        Page.navigate({ url, referrer });
    }).then((html) => {
        closeTab();
        return Promise.resolve(html);
    }).catch((err) => {
        closeTab();
        return Promise.reject(err);
    });
}

module.exports = {
    render,
}