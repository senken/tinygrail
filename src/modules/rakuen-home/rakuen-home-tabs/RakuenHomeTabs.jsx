import { Tabs } from "@src/components/Tabs.jsx";
import { HomeTab } from "./components/HomeTab.jsx";
import { HotTab } from "./components/HotTab.jsx";
import { TradeTab } from "./components/TradeTab.jsx";
import { ValhallaTab } from "./components/ValhallaTab.jsx";
import { ICOTab } from "./components/ICOTab.jsx";
import { STTab } from "./components/STTab.jsx";

/**
 * 超展开首页Tabs容器组件
 */
export function RakuenHomeTabs({ searchIcon, onSearchClick }) {
  const container = <div id="tg-rakuen-home-tabs" />;

  let activeTab = 0;
  let size = "large";

  // 缓存tab内容，避免重复创建
  const tabContents = {};

  const tabItems = [
    {
      key: "home",
      label: "首页",
      component: () => {
        if (!tabContents.home) {
          tabContents.home = <HomeTab />;
        }
        return tabContents.home;
      },
    },
    {
      key: "hot",
      label: "热门排行",
      component: () => {
        if (!tabContents.hot) {
          tabContents.hot = <HotTab />;
        }
        return tabContents.hot;
      },
    },
    {
      key: "trade",
      label: "交易榜单",
      component: () => {
        if (!tabContents.trade) {
          tabContents.trade = <TradeTab />;
        }
        return tabContents.trade;
      },
    },
    {
      key: "valhalla",
      label: "英灵殿",
      component: () => {
        if (!tabContents.valhalla) {
          tabContents.valhalla = <ValhallaTab />;
        }
        return tabContents.valhalla;
      },
    },
    {
      key: "ico",
      label: "ICO",
      component: () => {
        if (!tabContents.ico) {
          tabContents.ico = <ICOTab />;
        }
        return tabContents.ico;
      },
    },
    {
      key: "st",
      label: "ST",
      component: () => {
        if (!tabContents.st) {
          tabContents.st = <STTab />;
        }
        return tabContents.st;
      },
    },
  ];

  // 渲染Tabs组件
  const render = () => {
    container.innerHTML = "";
    const tabs = (
      <Tabs
        items={tabItems}
        activeTab={activeTab}
        onTabChange={(index) => {
          activeTab = index;
          render();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        sticky={true}
        size={size}
        icon={searchIcon}
        onIconClick={onSearchClick}
      />
    );
    container.appendChild(tabs);
  };

  // 检查容器宽度并设置尺寸
  const updateSize = (width) => {
    const newSize = width < 640 ? "small" : "large";
    if (newSize !== size) {
      size = newSize;
      render();
    }
  };

  // 初始化
  render();

  const initialWidth = container.offsetWidth || window.innerWidth;
  updateSize(initialWidth);

  // 使用ResizeObserver监听容器宽度变化
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const width = entry.contentRect.width;
      updateSize(width);
    }
  });

  observer.observe(container);

  return container;
}
