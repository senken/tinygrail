import { createMountedComponentWithStore } from "@src/utils/createMountedComponentWithStore.js";
import { CharacterBoxContent } from "./components/CharacterBoxContent.jsx";
import { CharacterBoxLoading } from "./components/CharacterBoxLoading.jsx";
import { openUserTinygrailModal } from "@src/modules/user-tinygrail/UserTinygrail.jsx";
import { openCharacterBoxModal } from "./modals/openCharacterBoxModal.jsx";
import { getCollapsedStates } from "./utils/collapsedState.js";
import { createCharacterBoxDataController } from "./utils/createCharacterBoxDataController.js";
import { createCharacterBoxPageInitialState } from "./utils/characterBoxPageStore.js";
import { createCharacterBoxPageStoreKey } from "./utils/characterBoxStoreKeys.js";

/**
 * 角色页面组件
 * @param {Object} props 组件参数
 * @param {number} props.characterId 角色ID
 * @returns {HTMLElement} 角色页面组件元素
 */
export function CharacterBox(props) {
  const { characterId } = props || {};

  const container = (
    <div id="tg-character-box" data-character-id={characterId} className="relative" />
  );

  const initialCollapsedStates = getCollapsedStates();
  const storeKey = createCharacterBoxPageStoreKey(characterId);

  const { setState, replaceState } = createMountedComponentWithStore(
    container,
    storeKey,
    (state) => {
      const { loading, error } = state || {};

      if (error) {
        return <div className="p-4 text-center">加载失败</div>;
      }

      if (loading) {
        return <CharacterBoxLoading />;
      }

      return <CharacterBoxContent storeKey={storeKey} />;
    }
  );

  const dataController = createCharacterBoxDataController({
    characterId,
    setState,
  });

  if (characterId) {
    replaceState(
      createCharacterBoxPageInitialState({
        characterId,
        setState,
        initialCollapsedStates,
        dataController,
        modalOpeners: {
          openUserModal: openUserTinygrailModal,
          openCharacterModal: openCharacterBoxModal,
        },
      })
    );
    dataController.loadInitialData();
  }

  return container;
}
