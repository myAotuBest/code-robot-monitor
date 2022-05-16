import qs from "qs";
import MonitorObserver from "./observe";
import {
  MonitorOption,
  AskPriority,
  AnalyticsData,
  Fun,
  Fn,
} from "./typings/index";

const uploadUrl = "http://imock1.com";

class AMonitor {
  options: MonitorOption;
  // 参数创建前
  beforeCreateParams: Fun;
  // 上报日志前
  beforeUpload: Fun;
  // 上报日志后
  afterUpload: Fun;
  onError: Fun;
  private observer: MonitorObserver;
  constructor(options: MonitorOption) {
    this.options = options;
    this.collect();
    this.beforeCreateParams = null;
    this.beforeUpload = null;
    this.afterUpload = null;
    this.onError = (err: Error) => console.error(err);
    this.observer = new MonitorObserver(this);
  }
  private collect() {
    const timestamp = new Date().getTime();
    const ua = window.navigator.userAgent;
    const url = window.location.href;
    return { timestamp, ua, url };
  }

  /**
   * 上报数据
   * @param data
   */
  private upload(data: string) {
    const level = this.options.level || 3;
    if (level === AskPriority.URGENT) {
      if (!!window.fetch) {
        window.fetch(`${uploadUrl}?${data}`);
      } else {
        let xhr: XMLHttpRequest | null = new XMLHttpRequest();
        xhr.open("post", uploadUrl, true);
        // 设置请求头
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(data); // 发送参数
        xhr.onload = function (e) {
          //及时清理以防多次创建
          xhr = null;
        };
      }
    } else if (level === AskPriority.IDLE) {
      if (!!navigator.sendBeacon) {
        navigator.sendBeacon(uploadUrl, data);
      }
    } else if (level === AskPriority.IMG) {
      let img: HTMLImageElement | null = new Image();
      img.src = `${uploadUrl}?${data}`;
      img.onload = function () {
        //统计完成收回创建的元素防止内存泄露
        img = null;
      };
    }
  }

  /**
   * 上报执行前钩子函数
   * @param fn
   */
  registerBeforeCreateParams(fn: Fn) {
    this.beforeCreateParams = fn;
  }

  /**
   * 上报执行前参数 transforme 钩子函数
   * @param fn
   */
  registerBeforeUpload(fn: Fn) {
    this.beforeUpload = fn;
  }

  /**
   * 上报执行完钩子函数
   * @param fn
   */
  registerAfterUpload(fn: Fn) {
    this.afterUpload = fn;
  }

  /**
   * 上报错误钩子函数
   * @param fn
   */
  registerOnError(fn: Fn) {
    this.onError = fn;
  }

  /**
   * 发送PV、曝光、点击 日志
   * @param data
   */
  sendToAnalytics(data: AnalyticsData) {
    this.beforeCreateParams && this.beforeCreateParams();
    if (!data.pageId) {
      throw new Error("请传入 pageId、⚠️");
    }
    // 采集页面的基本信息
    // 1. 应用
    //    a. 应用id (SDK 初始化)
    //    b. 页面id (sendPv 自己带来)
    let body = {
      ...data,
      appId: this.options.appId,
      pageId: data.pageId,
      eventType: data.eventType || "pv",
    };
    // 2. 页面上报信息收集
    //    a. 应用id和页面id
    //    b. 访问时间
    //    c. ua
    const navigatorInfo = this.collect();
    Object.assign(body, navigatorInfo);

    // 3. 调用日志上报API
    if (this.beforeUpload) {
      body = this.beforeUpload(body);
    }
    const qsdata = qs.stringify(body);
    try {
      this.upload(qsdata);
      throw new Error("错误");
    } catch (error: unknown) {
      // console.error(error);
      this.onError && this.onError(error);
    } finally {
      this.afterUpload && this.afterUpload(body);
    }
  }

  /**
   * 处理动态添加 DOM 的曝光
   */
  sendToAnalyticExp() {
    this.observer.init();
  }
}

export default AMonitor;
