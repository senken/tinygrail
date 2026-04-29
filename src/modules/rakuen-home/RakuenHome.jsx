import { SearchIcon } from "@src/icons";
import { openCharacterBoxModal } from "@src/modules/character-box";
import {
  openCharacterSearchModal
} from "@src/modules/character-search/CharacterSearch.jsx";
import { getCachedUserAssets } from "@src/utils/session.js";
import { RakuenHomeTabs } from "./rakuen-home-tabs";
import stylesCSS from "./styles.css?inline";
import { UserCard } from "./user-card";

/**
 * 加载样式
 */
function loadStyles() {
  const styleId = "tg-rakuen-home-styles";

  // 检查是否已经加载过
  if (document.getElementById(styleId)) {
    return;
  }

  const styleElement = document.createElement("style");
  styleElement.id = styleId;
  styleElement.textContent = stylesCSS;
  document.head.appendChild(styleElement);
}

/**
 * 超展开首页组件
 */
export function RakuenHome() {
  loadStyles();

  // 监听来自侧边栏iframe的消息
  window.addEventListener("message", (event) => {
    if (event.data.type === "openCharacterModal") {
      const characterId = event.data.characterId;
      openCharacterBoxModal(characterId);
    }
  });

  // 角色搜索点击处理
  const handleCharacterSearchClick = () => {
    const userAssets = getCachedUserAssets();
    if (!userAssets) {
      return;
    }
    const username = userAssets.name || "";

    openCharacterSearchModal({
      title: "搜索角色",
      username,
      onCharacterClick: (character) => {
        openCharacterBoxModal(character.Id);
      },
    });
  };

  // 清空body并创建容器
  const container = (
    <div id="tg-rakuen-home" className="tinygrail">
      <div className="mx-auto max-w-screen-xl">
        <div className="space-y-3">
          <UserCard />
          <RakuenHomeTabs
            searchIcon={<SearchIcon className="size-4" />}
            onSearchClick={handleCharacterSearchClick}
          />
        </div>
      </div>
    </div>
  );

  $("body").empty().append(container);
}
