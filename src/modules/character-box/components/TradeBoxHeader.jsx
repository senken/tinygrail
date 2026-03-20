import { normalizeAvatar } from "@src/utils/oos.js";
import { formatCurrency, formatNumber, formatDateTime } from "@src/utils/format.js";
import { isGameMaster } from "@src/utils/session.js";
import { SquareArrowOutUpRightIcon, QuestionIcon } from "@src/icons";
import { ChangeBadge } from "@src/components/ChangeBadge.jsx";
import { LevelBadge } from "@src/components/LevelBadge.jsx";
import { CrownBadge } from "@src/components/CrownBadge.jsx";
import { StarRankBadge } from "@src/components/StarRankBadge.jsx";
import { StarLevelIcons } from "@src/components/StarLevelIcons.jsx";
import { Button } from "@src/components/Button";
import { Tooltip } from "@src/components/Tooltip.jsx";

/**
 * 交易盒子头部组件
 * @param {Object} props
 * @param {Object} props.characterData - 角色数据
 * @param {Object} props.userCharacter - 用户角色数据
 * @param {Object} props.tinygrailCharacter - tinygrail的角色数据
 * @param {number} props.pool - 奖池数量
 * @param {boolean} props.canChangeAvatar - 是否可以更换头像
 * @param {Function} props.onSacrificeClick - 点击资产重组按钮的回调
 * @param {Function} props.onAuctionClick - 点击拍卖按钮的回调
 * @param {Function} props.onAuctionHistoryClick - 点击往期拍卖按钮的回调
 * @param {Function} props.onChangeAvatarClick - 点击更换头像按钮的回调
 * @param {Function} props.onTradeHistoryClick - 点击交易记录按钮的回调
 * @param {Function} props.onGMTradeHistoryClick - 点击GM交易记录按钮的回调
 */
export function TradeBoxHeader(props) {
  const {
    characterData,
    userCharacter,
    tinygrailCharacter,
    pool,
    canChangeAvatar,
    onSacrificeClick,
    onAuctionClick,
    onAuctionHistoryClick,
    onChangeAvatarClick,
    onTradeHistoryClick,
    onGMTradeHistoryClick,
  } = props || {};

  if (!characterData) {
    return null;
  }

  const {
    CharacterId,
    Name,
    Icon,
    Current,
    Total,
    ListedDate,
    Fluctuation,
    Level,
    Crown,
    Rank,
    StarForces,
    Stars,
    Rate,
    ZeroCount,
  } = characterData;
  const avatarUrl = normalizeAvatar(Icon);

  // 计算股息
  const dividend = Rank <= 500 ? Rate * 0.005 * (601 - Rank) : Stars * 2;
  const dividendFormula =
    Rank <= 500
      ? `${formatCurrency(Rate)} × ${formatNumber(0.005 * (601 - Rank))}`
      : `₵${Stars} × 2`;

  return (
    <div id="tg-trade-box-header" className="flex flex-col gap-2 p-2">
      <div id="tg-trade-box-header-info" className="flex gap-4">
        {/* 头像 */}
        <div
          id="tg-trade-box-header-avatar"
          className="size-[72px] flex-shrink-0 rounded-lg border border-gray-200 bg-cover bg-top dark:border-gray-600"
          style={{ backgroundImage: `url(${avatarUrl})` }}
        />

        {/* 信息 */}
        <div className="flex flex-col justify-center gap-px">
          <div>
            <a
              href={`https://bgm.tv/character/${CharacterId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tg-link flex items-center gap-1 text-base font-semibold"
            >
              <span>
                #{CharacterId} -「{Name}」
              </span>
              <SquareArrowOutUpRightIcon className="h-4 w-4 flex-shrink-0" />
            </a>
          </div>
          <div className="flex flex-col gap-px">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <span>现价：{formatCurrency(Current)}</span>
              <span class="mx-2">•</span>
              <span>流通：{formatNumber(Total, 0)}</span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <span>奖池：{pool !== undefined ? formatNumber(pool, 0) : "..."}</span>
              <span class="mx-2">•</span>
              <span className="inline-flex items-center gap-1">
                股息：{formatCurrency(dividend)}
                <Tooltip content={dividendFormula} trigger="click">
                  <QuestionIcon className="h-3 w-3 cursor-pointer opacity-60 hover:opacity-100" />
                </Tooltip>
              </span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <span title="上市时间">{formatDateTime(ListedDate, "YYYY-MM-DD HH:mm")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 角色属性 */}
      <div id="tg-trade-box-header-badges" className="flex flex-wrap items-center gap-2">
        {/* 徽章组 */}
        <div className="flex flex-wrap gap-2">
          {Fluctuation !== undefined && <ChangeBadge change={Fluctuation} size="md" />}
          {Level !== undefined && <LevelBadge level={Level} zeroCount={ZeroCount} size="md" />}
          {Crown !== undefined && Crown > 0 && <CrownBadge count={Crown} size="md" />}
          {Rank !== undefined && <StarRankBadge rank={Rank} starForces={StarForces} size="md" />}
        </div>

        {/* 等级图标 */}
        {Stars !== undefined && <StarLevelIcons level={Stars} size={20} />}
      </div>

      {/* 用户持股 */}
      <div id="tg-trade-box-header-user" className="text-xs opacity-60">
        <span>持股：{userCharacter ? formatNumber(userCharacter.Amount, 0) : "..."}股</span>
        <span class="mx-2">•</span>
        <span>固定资产：{userCharacter ? formatNumber(userCharacter.Sacrifices, 0) : "..."}</span>
      </div>

      {/* 按钮组 */}
      <div id="tg-trade-box-header-actions" className="flex flex-wrap gap-2">
        <Button onClick={onSacrificeClick}>资产重组</Button>
        <Button onClick={onAuctionClick}>
          {tinygrailCharacter?.Amount > 0 ? "参与竞拍" : "萌王投票"}
        </Button>
        <Button onClick={onAuctionHistoryClick}>往期拍卖</Button>
        <Button onClick={onTradeHistoryClick}>交易记录</Button>
        {canChangeAvatar && <Button onClick={onChangeAvatarClick}>更换头像</Button>}
        {isGameMaster() && <Button onClick={onGMTradeHistoryClick}>交易记录(gm)</Button>}
      </div>
    </div>
  );
}
