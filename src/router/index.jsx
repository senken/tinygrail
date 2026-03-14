import { RakuenHome } from "@src/modules/rakuen-home";
import { RakuenTopiclist } from "@src/modules/rakuen-topiclist";
import { RakuenTopicCrt } from "@src/modules/rakuen-topic-crt";
import { User } from "@src/modules/user";
import { Character } from "@src/modules/character";

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
  }
}

export default { matchRoute };
