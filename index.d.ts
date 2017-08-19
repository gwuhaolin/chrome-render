export default class ChromeRender {

  static new(params: {
    /**
     * max tab chrome will open to render pages, default is no limit, `maxTab` used to avoid open to many tab lead to chrome crash.
     */
    maxTab?: number,
  }): Promise<ChromeRender>;

  /**
   * render page in chrome, and return page html string
   * @param params
   * @returns {Promise.<string>} page html string
   */
  render(params: {
    /**
     * is required, web page's URL
     */
    url: string,
    /**
     * `object {cookieName:cookieValue}` set HTTP cookies when request web page
     */
    cookies?: {
      [cookieName: string]: string,
    },
    /**
     * `object {headerName:headerValue}` add HTTP headers when request web page
     */
    headers?: {
      [headerName: string]: string,
    },
    /**
     * `boolean` whether use `window.chromeRenderReady()` to notify chrome-render page has ready. default is false chrome-render use `domContentEventFired` as page has ready.
     */
    useReady?: boolean,
    /**
     * inject script to evaluate when page on load
     */
    script?: string,
    /**
     * `number` in ms, `render()` will throw error if html string can't be resolved after `renderTimeout`, default is 5000ms.
     */
    renderTimeout?: number,
    /**
     * `object` Overrides the values of device screen dimensions, same as https://chromedevtools.github.io/devtools-protocol/tot/Emulation/#method-setDeviceMetricsOverride
     */
    deviceMetricsOverride?: object,
    /**
     * `boolean` if `true` after render chrome instance will navigate to `about:blank` to free resources. default is true. setting to `false` may increase page load speed when rendering the same website.
     */
    clearTab?: boolean,
  }): Promise<string>;

  /**
   * destroyPoll this chrome render, kill chrome, release all resource
   */
  destroyRender(): Promise<void>;
}