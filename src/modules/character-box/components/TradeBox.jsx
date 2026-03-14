import { TradeBoxHeader } from "./TradeBoxHeader.jsx";
import { TradeBoxSection } from "./TradeBoxSection.jsx";
import { TradeBoxLink } from "./TradeBoxLink.jsx";
import { TradeBoxTemple } from "./TradeBoxTemple.jsx";
import { TradeBoxUser } from "./TradeBoxUser.jsx";

/**
 * 交易盒子组件
 * @param {Object} props
 * @param {Object} props.characterData - 角色数据
 * @param {Object} props.userAssets - 用户资产数据
 * @param {Object} props.userCharacter - 用户角色数据
 * @param {Object} props.tinygrailCharacter - tinygrail用户的角色数据
 * @param {number} props.pool - 奖池数量
 * @param {Object} props.depth - 市场深度数据
 * @param {Array} props.links - LINK数据
 * @param {Array} props.temples - 圣殿数据
 * @param {Object} props.users - 持股用户数据
 * @param {Function} props.onRefresh - 刷新数据的回调函数
 * @param {Function} props.setLoading - 设置全局加载状态的函数
 * @param {Function} props.loadUsersPage - 加载指定页用户数据的函数
 * @param {Function} props.openUserModal - 打开用户信息Modal的函数
 * @param {Function} props.openCharacterModal - 打开角色信息Modal的函数
 * @param {Function} props.openSacrificeModal - 打开资产重组Modal的函数
 * @param {Function} props.openAuctionModal - 打开拍卖Modal的函数
 * @param {Function} props.openAuctionHistoryModal - 打开往期拍卖Modal的函数
 * @param {Function} props.openChangeAvatarModal - 打开更换头像Modal的函数
 * @param {Function} props.openTradeHistoryModal - 打开交易记录Modal的函数
 * @param {Function} props.openTempleModal - 打开圣殿Modal的函数
 * @param {boolean} props.canChangeAvatar - 是否可以更换头像
 * @param {boolean} props.sticky - 是否启用粘性布局
 * @param {number} props.stickyTop - 粘性布局的top值
 * @param {boolean} props.hideDuplicates - 是否隐藏重复圣殿
 * @param {Function} props.onToggleDuplicates - 切换隐藏重复圣殿的回调函数
 */
export function TradeBox(props) {
  const {
    characterData,
    userAssets,
    userCharacter,
    tinygrailCharacter,
    pool,
    depth,
    links,
    temples,
    users,
    onRefresh,
    setLoading,
    loadUsersPage,
    openUserModal,
    openCharacterModal,
    openSacrificeModal,
    openAuctionModal,
    openAuctionHistoryModal,
    openChangeAvatarModal,
    openTradeHistoryModal,
    openTempleModal,
    canChangeAvatar,
    sticky = false,
    stickyTop = 0,
    hideDuplicates = true,
    onToggleDuplicates,
  } = props || {};

  if (!characterData) {
    return null;
  }

  return (
    <div id="tg-trade-box" data-character-id={characterData.CharacterId}>
      <TradeBoxHeader
        characterData={characterData}
        userCharacter={userCharacter}
        tinygrailCharacter={tinygrailCharacter}
        pool={pool}
        canChangeAvatar={canChangeAvatar}
        onSacrificeClick={openSacrificeModal}
        onAuctionClick={openAuctionModal}
        onAuctionHistoryClick={openAuctionHistoryModal}
        onChangeAvatarClick={openChangeAvatarModal}
        onTradeHistoryClick={openTradeHistoryModal}
      />
      <TradeBoxSection
        characterData={characterData}
        userAssets={userAssets}
        userCharacter={userCharacter}
        depth={depth}
        sticky={sticky}
        stickyTop={stickyTop}
        onRefresh={onRefresh}
        setLoading={setLoading}
      />
      {links && links.length > 0 && (
        <TradeBoxLink
          characterData={characterData}
          links={links}
          openUserModal={openUserModal}
          openCharacterModal={openCharacterModal}
          openTempleModal={openTempleModal}
          sticky={sticky}
          stickyTop={stickyTop}
        />
      )}
      {temples && temples.length > 0 && (
        <TradeBoxTemple
          characterData={characterData}
          userAssets={userAssets}
          temples={temples}
          openUserModal={openUserModal}
          openTempleModal={openTempleModal}
          sticky={sticky}
          stickyTop={stickyTop}
          hideDuplicates={hideDuplicates}
          onToggleDuplicates={onToggleDuplicates}
        />
      )}
      {users && (
        <TradeBoxUser
          characterData={characterData}
          users={users}
          loadUsersPage={loadUsersPage}
          openUserModal={openUserModal}
          sticky={sticky}
          stickyTop={stickyTop}
        />
      )}
    </div>
  );
}
