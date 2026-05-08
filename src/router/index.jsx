import { RakuenHome } from "@src/modules/rakuen-home";
import { RakuenTopiclist } from "@src/modules/rakuen-topiclist";
import { RakuenTopicCrt } from "@src/modules/rakuen-topic-crt";
import { User } from "@src/modules/user";
import { Character } from "@src/modules/character";
import { loadECharts } from "@src/utils/echarts-loader.js";
import { loadSignalR } from "@src/utils/signalr-loader.js";
import { loadFireworks } from "@src/utils/fireworks-loader.js";
import { loadMD5 } from "@src/utils/md5-loader.js";

const routes = [
  {
    path: "/rakuen/home",
    component: RakuenHome,
  },
  {
    path: "/rakuen/topic/crt/",
    component: RakuenTopicCrt,
  },
  {
    path: "/rakuen/topiclist",
    component: RakuenTopiclist,
  },
  {
    path: "/character/",
    component: Character,
  },
  {
    path: "/user/",
    component: User,
  },
];

/**
 * 根据当前路径匹配并执行对应的处理函数
 * @param {string} path - 当前URL路径
 */
export function matchRoute(path) {
  const matchedRoute = routes.find((route) => path.startsWith(route.path));

  if (matchedRoute && matchedRoute.component) {
    const Component = matchedRoute.component;
    Component();

    // 预加载
    setTimeout(() => {
      loadECharts();
      loadSignalR();
      loadFireworks();
      loadMD5();
    }, 1000);
  }
}

export default { matchRoute };
