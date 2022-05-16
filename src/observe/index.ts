import AMonitor from "../index";
import { EventType } from "../typings";

class MonitorObserver {
  private ob: IntersectionObserver;
  observerList: Element[];
  private monitor: AMonitor;
  constructor(monitor: AMonitor) {
    this.monitor = monitor;
    this.observerList = [];
    this.ob = this.initObserver();
    this.init();
  }

  private initObserver() {
    const appearEvent = new CustomEvent("onAppear");
    const disappearEvent = new CustomEvent("onDisappear");
    return new IntersectionObserver(
      (e: IntersectionObserverEntry[]) => {
        e.forEach((inter) => {
          if (inter.intersectionRatio > 0) {
            console.log(inter.target.className + "appear");
            inter.target.dispatchEvent(appearEvent);
            const target = inter.target as HTMLElement;
            const data = target.dataset;
            // 自动上报数据
            this.monitor.sendToAnalytics({
              ...data,
              pageId: data.pageId!,
              eventType: EventType.EXP,
            });
          } else {
            console.log(inter.target.className + "disappear");
            inter.target.dispatchEvent(disappearEvent);
            // 防止重复曝光
            this.ob.unobserve(inter.target);
          }
        });
      },
      {
        threshold: [0.2],
      }
    );
  }

  init() {
    const appear = document.querySelectorAll("[appear]");
    for (let i = 0; i < appear.length; i++) {
      if (!this.observerList.includes(appear[i])) {
        this.ob.observe(appear[i]);
        this.observerList.push(appear[i]);
      }
    }
  }
}

export default MonitorObserver;
