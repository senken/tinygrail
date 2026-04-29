import { TradeBoxHeaderActions } from "./TradeBoxHeaderActions.jsx";
import { TradeBoxHeaderDetails } from "./TradeBoxHeaderDetails.jsx";
import { TradeBoxHeaderInfo } from "./TradeBoxHeaderInfo.jsx";
import { TradeBoxLink } from "./TradeBoxLink.jsx";
import { TradeBoxSection } from "./TradeBoxSection.jsx";
import { TradeBoxTemple } from "./TradeBoxTemple.jsx";
import { TradeBoxUser } from "./TradeBoxUser.jsx";

/**
 * 交易盒子组件
 * @param {Object} props
 * @param {Object} props.characterData - 角色数据
 * @param {Object} props.userAssets - 用户资产数据
 * @param {Object} props.userCharacter - 用户角色数据
 * @param {Object} props.tinygrailCharacter - tinygrail用户的角色数据
 * @param {Object} props.gensokyoCharacter - gensokyo用户的角色数据
 * @param {number} props.pool - 奖池数量
 * @param {Object} props.depth - 市场深度数据
 * @param {Array} props.links - LINK数据
 * @param {Array} props.temples - 圣殿数据
 * @param {Object} props.users - 持股用户数据
 * @param {string} props.fixedAssets - 固定资产字符串
 * @param {Function} props.onRefresh - 刷新数据的回调函数
 * @param {Function} props.setLoading - 设置全局加载状态的函数
 * @param {Function} props.loadUsersPage - 加载指定页用户数据的函数
 * @param {Function} props.openUserModal - 打开用户信息Modal的函数
 * @param {Function} props.openCharacterModal - 打开角色信息Modal的函数
 * @param {Function} props.openSacrificeModal - 打开资产重组Modal的函数
 * @param {Function} props.openFavoriteModal - 打开收藏Modal的函数
 * @param {Function} props.openAuctionModal - 打开拍卖Modal的函数
 * @param {Function} props.openAuctionHistoryModal - 打开往期拍卖Modal的函数
 * @param {Function} props.openChangeAvatarModal - 打开更换头像Modal的函数
 * @param {Function} props.openTradeHistoryModal - 打开交易记录Modal的函数
 * @param {Function} props.openGMTradeHistoryModal - 打开GM交易记录Modal的函数
 * @param {Function} props.openTempleModal - 打开圣殿Modal的函数
 * @param {boolean} props.canChangeAvatar - 是否可以更换头像
 * @param {boolean} props.hideDuplicates - 是否隐藏重复圣殿
 * @param {Function} props.onToggleDuplicates - 切换隐藏重复圣殿的回调函数
 * @param {boolean} props.isLinkCollapsed - LINK区域是否折叠
 * @param {Function} props.onToggleLinkCollapse - 切换LINK折叠状态的回调函数
 * @param {boolean} props.isSectionCollapsed - 交易区域是否折叠
 * @param {Function} props.onToggleSectionCollapse - 切换交易区域折叠状态的回调函数
 * @param {boolean} props.isTempleCollapsed - 圣殿区域是否折叠
 * @param {Function} props.onToggleTempleCollapse - 切换圣殿区域折叠状态的回调函数
 * @param {boolean} props.isUserCollapsed - 用户区域是否折叠
 * @param {Function} props.onToggleUserCollapse - 切换用户区域折叠状态的回调函数
 * @returns {HTMLElement} 完整的组件容器
 */
export function TradeBox(props) {
  const {
    characterData,
    userAssets,
    userCharacter,
    tinygrailCharacter,
    gensokyoCharacter,
    pool,
    depth,
    links,
    temples,
    users,
    fixedAssets,
    onRefresh,
    setLoading,
    loadUsersPage,
    openUserModal,
    openCharacterModal,
    openSacrificeModal,
    openFavoriteModal,
    openAuctionModal,
    openAuctionHistoryModal,
    openChangeAvatarModal,
    openTradeHistoryModal,
    openGMTradeHistoryModal,
    openTempleModal,
    canChangeAvatar,
    hideDuplicates = true,
    onToggleDuplicates,
    isLinkCollapsed = false,
    onToggleLinkCollapse,
    isSectionCollapsed = false,
    onToggleSectionCollapse,
    isTempleCollapsed = false,
    onToggleTempleCollapse,
    isUserCollapsed = false,
    onToggleUserCollapse,
  } = props || {};

  if (!characterData) {
    return <div />;
  }

  return (
    <div>
      <div>
        <TradeBoxHeaderInfo
          characterData={characterData}
          userCharacter={userCharacter}
          fixedAssets={fixedAssets}
          onFavoriteClick={openFavoriteModal}
        />
        <TradeBoxHeaderDetails
          characterData={characterData}
          pool={pool}
          tinygrailCharacter={tinygrailCharacter}
          gensokyoCharacter={gensokyoCharacter}
        />
        <TradeBoxHeaderActions
          tinygrailCharacter={tinygrailCharacter}
          canChangeAvatar={canChangeAvatar}
          onSacrificeClick={openSacrificeModal}
          onAuctionClick={openAuctionModal}
          onAuctionHistoryClick={openAuctionHistoryModal}
          onChangeAvatarClick={openChangeAvatarModal}
          onTradeHistoryClick={openTradeHistoryModal}
          onGMTradeHistoryClick={openGMTradeHistoryModal}
        />
      </div>
      <div>
        <TradeBoxSection
          characterData={characterData}
          userAssets={userAssets}
          userCharacter={userCharacter}
          depth={depth}
          onRefresh={onRefresh}
          setLoading={setLoading}
          isCollapsed={isSectionCollapsed}
          onToggleCollapse={onToggleSectionCollapse}
        />
        {links && links.length > 0 && (
          <TradeBoxLink
            characterData={characterData}
            links={links}
            openUserModal={openUserModal}
            openCharacterModal={openCharacterModal}
            openTempleModal={openTempleModal}
            isCollapsed={isLinkCollapsed}
            onToggleCollapse={onToggleLinkCollapse}
          />
        )}
        {temples && temples.length > 0 && (
          <TradeBoxTemple
            characterData={characterData}
            userAssets={userAssets}
            temples={temples}
            openUserModal={openUserModal}
            openTempleModal={openTempleModal}
            hideDuplicates={hideDuplicates}
            onToggleDuplicates={onToggleDuplicates}
            isCollapsed={isTempleCollapsed}
            onToggleCollapse={onToggleTempleCollapse}
          />
        )}
        {users && (
          <TradeBoxUser
            characterData={characterData}
            users={users}
            loadUsersPage={loadUsersPage}
            openUserModal={openUserModal}
            isCollapsed={isUserCollapsed}
            onToggleUserCollapse={onToggleUserCollapse}
          />
        )}
      </div>
    </div>
  );
}
