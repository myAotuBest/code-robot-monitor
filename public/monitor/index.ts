import CodeRobotMonitor from "../../src/index";
import { EventType } from "../../src/typings";

window.onload = function () {
  const monitor = new CodeRobotMonitor({
    appId: "123",
  });

  monitor.registerBeforeCreateParams(() => {
    console.log("注册自定义的请求前函数");
  });

  monitor.registerBeforeUpload((body) => {
    body.name = "xikun";
    return body;
  });

  monitor.registerOnError((err: any) => {
    console.error(err.message);
  });

  monitor.sendToAnalytics({
    pageId: "home",
  });

  document
    .getElementsByClassName("demo2")[0]
    .addEventListener("onAppear", function (e) {
      monitor.sendToAnalytics({
        pageId: "my",
        eventType: EventType.EXP,
        productId: 22,
        index: 10,
      });
    });
  document.getElementById("add").addEventListener("click", function () {
    const body = document.body;
    const div = document.createElement("div");
    div.innerHTML = "前端监控SDK";
    div.className = "new-dom";
    div.setAttribute("appear", "");
    div.style.backgroundColor = "red";
    body.insertBefore(div, body.firstChild);
    monitor.sendToAnalyticExp();
  });
};
