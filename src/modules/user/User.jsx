import { getUserAssets } from "@src/api/user.js";
import { UserTinygrail } from "@src/modules/user-tinygrail/UserTinygrail.jsx";

/**
 * 用户页面组件
 */
export function User() {
  // 从URL中获取username
  const path = window.location.pathname;
  const match = path.match(/\/user\/([^/]+)/);

  if (!match) {
    console.error("无法获取用户名");
    return;
  }

  const username = match[1];

  // 找到挂载点
  const mountPoint = $("#user_home .user_box");

  if (mountPoint.length === 0) {
    return;
  }

  // 动态调整bgm的navTabs样式适配移动端
  const navTabs = $("#headerProfile .navTabsWrapper .navTabs")[0];
  if (navTabs) {
    const updateNavTabsGap = () => {
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      navTabs.style.gap = isMobile ? "0" : "5px";
    };

    // 初始设置
    updateNavTabsGap();

    // 监听屏幕尺寸变化
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    mediaQuery.addEventListener("change", updateNavTabsGap);
  }

  // 获取用户资产信息判断用户是否已注册
  getUserAssets(username).then((result) => {
    if (!result.success) {
      return;
    }

    // 创建容器并挂载
    const container = (
      <div id="tinygrail" class="section">
        <div
          class="horizontalOptions clearit"
          style="display: flex; justify-content: space-between; align-items: center;"
        >
          <ul style="margin-right: auto;">
            <li class="title">
              <h2>
                <span>小圣杯</span>
              </h2>
            </li>
          </ul>
          <div id="tinygrail-toggle" style="cursor: pointer; opacity: 0.6;">
            [折叠]
          </div>
        </div>
        <div className="tinygrail" />
      </div>
    );
    mountPoint.after(container);

    const tinygrailDiv = container.querySelector(".tinygrail");
    const toggleBtn = container.querySelector("#tinygrail-toggle");

    // 折叠功能
    let isCollapsed = false;
    toggleBtn.addEventListener("click", () => {
      isCollapsed = !isCollapsed;
      tinygrailDiv.style.display = isCollapsed ? "none" : "block";
      toggleBtn.textContent = isCollapsed ? "[展开]" : "[折叠]";
    });

    const userTinygrail = (
      <div className="pt-2">
        <UserTinygrail username={username} />
      </div>
    );
    tinygrailDiv.appendChild(userTinygrail);
  });
}
