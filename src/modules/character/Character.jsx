import { CharacterBox } from "@src/modules/character-box/CharacterBox.jsx";

/**
 * 角色页面组件
 */
export function Character() {
  // 从URL中获取characterId
  const path = window.location.pathname;
  const match = path.match(/\/character\/(\d+)/);

  if (!match) {
    console.error("无法获取角色ID");
    return;
  }

  const characterId = parseInt(match[1]);

  // 找到挂载点
  const mountPoint = $("#columnCrtB .clearit").first();

  if (mountPoint.length === 0) {
    return;
  }

  // 创建容器并挂载
  const container = (
    <div id="tinygrail">
      <a id="tinygrail-character-toggle" href="javascript:void(0);" class="more">
        [折叠]
      </a>
      <h2 class="subtitle">小圣杯</h2>
      <div className="tinygrail" />
      <div class="section_line clear"></div>
    </div>
  );
  mountPoint.after(container);

  const tinygrailDiv = container.querySelector(".tinygrail");
  const toggleBtn = container.querySelector("#tinygrail-character-toggle");

  // 从 localStorage 读取折叠状态
  const storageKey = "tinygrail:character-collapsed";
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
