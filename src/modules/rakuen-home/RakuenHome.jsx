import { UserCard } from "./user-card";
import { RakuenHomeTabs } from "./rakuen-home-tabs";
import { Modal } from "@src/components/Modal.jsx";
import { CharacterSearch } from "@src/modules/character-search/CharacterSearch.jsx";
import { CharacterBox } from "@src/modules/character-box/CharacterBox.jsx";
import { SearchIcon } from "@src/icons";
import { getCachedUserAssets } from "@src/utils/session.js";
import stylesCSS from "./styles.css?inline";

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

      // 创建角色弹窗
      const characterModal = (
        <Modal visible={true} padding="p-6">
          <CharacterBox characterId={characterId} sticky={true} />
        </Modal>
      );
      document.body.appendChild(characterModal);
    }
  });

  // 角色搜索点击处理
  const handleCharacterSearchClick = () => {
    const userAssets = getCachedUserAssets();
    if (!userAssets) {
      return;
    }
    const username = userAssets.name || "";

    const characterSearchModal = (
      <Modal visible={true} title="搜索角色" maxWidth={640}>
        <CharacterSearch
          username={username}
          onCharacterClick={(character) => {
            const characterModal = (
              <Modal visible={true} padding="p-6">
                <CharacterBox characterId={character.Id} sticky={true} />
              </Modal>
            );
            document.body.appendChild(characterModal);
          }}
        />
      </Modal>
    );
    document.body.appendChild(characterSearchModal);
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
