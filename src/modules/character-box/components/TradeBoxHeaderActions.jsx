import { isGameMaster } from "@src/utils/session.js";
import { Button } from "@src/components/Button";

/**
 * 交易盒子按钮组组件
 * @param {Object} props
 * @param {Object} props.tinygrailCharacter - tinygrail的角色数据
 * @param {boolean} props.canChangeAvatar - 是否可以更换头像
 * @param {Function} props.onSacrificeClick - 点击资产重组按钮的回调
 * @param {Function} props.onAuctionClick - 点击拍卖按钮的回调
 * @param {Function} props.onAuctionHistoryClick - 点击往期拍卖按钮的回调
 * @param {Function} props.onChangeAvatarClick - 点击更换头像按钮的回调
 * @param {Function} props.onTradeHistoryClick - 点击交易记录按钮的回调
 * @param {Function} props.onGMTradeHistoryClick - 点击GM交易记录按钮的回调
 */
export function TradeBoxHeaderActions(props) {
  const {
    tinygrailCharacter,
    canChangeAvatar,
    onSacrificeClick,
    onAuctionClick,
    onAuctionHistoryClick,
    onChangeAvatarClick,
    onTradeHistoryClick,
    onGMTradeHistoryClick,
  } = props || {};

  return (
    <div id="tg-trade-box-header-actions" className="flex flex-wrap gap-2 py-2">
      <Button onClick={onSacrificeClick}>资产重组</Button>
      <Button onClick={onAuctionClick}>
        {tinygrailCharacter?.Amount > 0 ? "参与竞拍" : "萌王投票"}
      </Button>
      <Button onClick={onAuctionHistoryClick}>往期拍卖</Button>
      <Button onClick={onTradeHistoryClick}>交易记录</Button>
      {canChangeAvatar && <Button onClick={onChangeAvatarClick}>更换头像</Button>}
      {isGameMaster() && <Button onClick={onGMTradeHistoryClick}>交易记录(gm)</Button>}
    </div>
  );
}
