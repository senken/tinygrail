import { UserCard } from "./user-card";
import { RakuenHomeTabs } from "./rakuen-home-tabs";

/**
 * 超展开首页组件
 */
export function RakuenHome() {
  // 清空body并创建容器
  const container = (
    <div id="tg-rakuen-home" className="tinygrail">
      <div className="mx-auto max-w-screen-xl">
        <div className="space-y-3">
          <UserCard />
          <RakuenHomeTabs />
        </div>
      </div>
    </div>
  );

  $("body").empty().append(container);
}
