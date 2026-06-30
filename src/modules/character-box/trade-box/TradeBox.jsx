import { TradeBoxHeaderActions } from "./TradeBoxHeaderActions.jsx";
import { TradeBoxHeaderDetails } from "./TradeBoxHeaderDetails.jsx";
import { TradeBoxHeaderInfo } from "./TradeBoxHeaderInfo.jsx";
import { TradeBoxLink } from "./TradeBoxLink.jsx";
import { TradeBoxSection } from "./TradeBoxSection.jsx";
import { TradeBoxTemple } from "./TradeBoxTemple.jsx";
import { TradeBoxUser } from "./TradeBoxUser.jsx";
import {
  createTradeBoxTitlePropsFromComponentProps,
  createTradeBoxContentPropsFromComponentProps,
} from "./tradeBoxProps.js";

/**
 * TradeBox标题组件
 * @param {Object} props 组件参数
 * @param {string} props.storeKey 标题区storeKey
 * @param {Object} props.data 标题数据
 * @param {Object} props.actions 标题操作
 * @param {Object} props.options 标题配置
 * @returns {HTMLElement} 标题区域元素
 */
export function TradeBoxTitle(props) {
  const { data, actions, options } = createTradeBoxTitlePropsFromComponentProps(props);
  const {
    characterData,
    userCharacter,
    tinygrailCharacter,
    gensokyoCharacter,
    pool,
    killVotes,
    fixedAssets,
  } = data;
  const {
    openFavoriteModal,
    openSacrificeModal,
    openAuctionModal,
    openAuctionHistoryModal,
    openChangeAvatarModal,
    openTradeHistoryModal,
    openGMTradeHistoryModal,
  } = actions;
  const {
    canChangeAvatar,
    isInModal,
  } = options;

  if (!characterData) {
    return <div />;
  }

  return (
    <div>
      <TradeBoxHeaderInfo
        characterData={characterData}
        userCharacter={userCharacter}
        fixedAssets={fixedAssets}
        killVotes={killVotes}
        onFavoriteClick={openFavoriteModal}
      />
      <TradeBoxHeaderDetails
        characterData={characterData}
        pool={pool}
        tinygrailCharacter={tinygrailCharacter}
        gensokyoCharacter={gensokyoCharacter}
      />
      <TradeBoxHeaderActions
        characterId={characterData?.CharacterId}
        tinygrailCharacter={tinygrailCharacter}
        canChangeAvatar={canChangeAvatar}
        killVotes={killVotes}
        isInModal={isInModal}
        onSacrificeClick={openSacrificeModal}
        onAuctionClick={openAuctionModal}
        onAuctionHistoryClick={openAuctionHistoryModal}
        onChangeAvatarClick={openChangeAvatarModal}
        onTradeHistoryClick={openTradeHistoryModal}
        onGMTradeHistoryClick={openGMTradeHistoryModal}
      />
    </div>
  );
}

/**
 * TradeBox内容组件
 * @param {Object} props 组件参数
 * @param {string} props.storeKey 内容区storeKey
 * @param {Object} props.data 内容数据
 * @param {Object} props.actions 内容操作
 * @param {Object} props.state 内容状态
 * @param {Object} props.options 内容配置
 * @returns {HTMLElement} 内容区域元素
 */
export function TradeBoxContent(props) {
  const { data, actions, state, options } = createTradeBoxContentPropsFromComponentProps(props);
  const {
    characterData,
    userAssets,
    userCharacter,
    depth,
    links,
    temples,
    users,
  } = data;
  const {
    onRefresh,
    setLoading,
    loadUsersPage,
    openUserModal,
    openCharacterModal,
    openTempleModal,
    onToggleLinkCollapse,
    onToggleSectionCollapse,
    onToggleTempleCollapse,
    onTempleFilterChange,
    onToggleUserCollapse,
  } = actions;
  const {
    isLinkCollapsed = false,
    isSectionCollapsed = false,
    isTempleCollapsed = false,
    templeFilterOptions,
    isUserCollapsed = false,
  } = state;
  const {
    stickyTop,
    headerBgClass,
  } = options;

  if (!characterData) {
    return <div />;
  }

  return (
    <div>
      <TradeBoxSection
        characterData={characterData}
        userAssets={userAssets}
        userCharacter={userCharacter}
        depth={depth}
        stickyTop={stickyTop}
        onRefresh={onRefresh}
        setLoading={setLoading}
        isCollapsed={isSectionCollapsed}
        onToggleCollapse={onToggleSectionCollapse}
        headerBgClass={headerBgClass}
      />
      {links && links.length > 0 && (
        <TradeBoxLink
          characterData={characterData}
          links={links}
          openUserModal={openUserModal}
          openCharacterModal={openCharacterModal}
          openTempleModal={openTempleModal}
          stickyTop={stickyTop}
          isCollapsed={isLinkCollapsed}
          onToggleCollapse={onToggleLinkCollapse}
          headerBgClass={headerBgClass}
        />
      )}
      {temples && temples.length > 0 && (
        <TradeBoxTemple
          characterData={characterData}
          userAssets={userAssets}
          temples={temples}
          openUserModal={openUserModal}
          openTempleModal={openTempleModal}
          stickyTop={stickyTop}
          templeFilterOptions={templeFilterOptions}
          onTempleFilterChange={onTempleFilterChange}
          isCollapsed={isTempleCollapsed}
          onToggleCollapse={onToggleTempleCollapse}
          headerBgClass={headerBgClass}
        />
      )}
      {users && (
        <TradeBoxUser
          characterData={characterData}
          users={users}
          temples={temples}
          loadUsersPage={loadUsersPage}
          openUserModal={openUserModal}
          stickyTop={stickyTop}
          isCollapsed={isUserCollapsed}
          onToggleUserCollapse={onToggleUserCollapse}
          headerBgClass={headerBgClass}
        />
      )}
    </div>
  );
}

/**
 * TradeBox组件
 * @param {Object} props 组件参数
 * @param {Object} props.titleProps 标题组件参数
 * @param {Object} props.contentProps 内容组件参数
 * @returns {HTMLElement} 完整的组件容器
 */
export function TradeBox(props) {
  const { titleProps, contentProps } = props || {};
  const characterData =
    titleProps?.data?.characterData || contentProps?.data?.characterData;

  if (!characterData) {
    return <div />;
  }

  return (
    <div>
      <TradeBoxTitle {...titleProps} />
      <TradeBoxContent {...contentProps} />
    </div>
  );
}
