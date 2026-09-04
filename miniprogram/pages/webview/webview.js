const app = getApp();
Page({
  data: { url: "" },
  onLoad() {
    const url = app.globalData.WEB_URL;
    if (url.includes("REPLACE-WITH-YOUR-DOMAIN")) {
      wx.showModal({ title: "还没配置", content: "请先在 app.js 里把 WEB_URL 换成你备案+HTTPS 后的记账站点地址", showCancel: false });
      return;
    }
    this.setData({ url });
  },
  onMessage(e) {
    // H5 内 wx.miniProgram.postMessage 的消息会到这里，暂留扩展点
    console.log("webview message:", e.detail.data);
  }
});
