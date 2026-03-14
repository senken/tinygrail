import { CharacterBox } from "@src/modules/character-box/CharacterBox.jsx";

/**
 * 超展开角色话题页面组件
 */
export function RakuenTopicCrt() {
  // 从URL中获取characterId
  const path = window.location.pathname;
  const match = path.match(/\/rakuen\/topic\/crt\/(\d+)/);

  if (!match) {
    console.error("无法获取角色ID");
    return;
  }

  const characterId = parseInt(match[1]);

  // 找到挂载点
  const mountPoint = $("#subject_info .board").first();

  if (mountPoint.length === 0) {
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
      <div class="section_line clear"></div>
    </div>
  );
  mountPoint.after(container);

  const tinygrailDiv = container.querySelector(".tinygrail");
  const toggleBtn = container.querySelector("#tinygrail-toggle");

  // 从 localStorage 读取折叠状态
  const storageKey = "tinygrail:rakuen-topic-crt-collapsed";
  let isCollapsed = localStorage.getItem(storageKey) === "true";

  // 初始化状态
  tinygrailDiv.style.display = isCollapsed ? "none" : "block";
  toggleBtn.textContent = isCollapsed ? "[展开]" : "[折叠]";

  // 折叠功能
  toggleBtn.addEventListener("click", () => {
    isCollapsed = !isCollapsed;
    tinygrailDiv.style.display = isCollapsed ? "none" : "block";
    toggleBtn.textContent = isCollapsed ? "[展开]" : "[折叠]";
    // 保存到 localStorage
    localStorage.setItem(storageKey, isCollapsed);
  });

  const characterBox = (
    <div className="pt-2">
      <CharacterBox characterId={characterId} />
    </div>
  );
  tinygrailDiv.appendChild(characterBox);
}
