import { normalizeAvatar } from "@src/utils/oos.js";
import { formatNumber } from "@src/utils/format.js";
import { SquareArrowOutUpRightIcon, PlusIcon, ChevronRightIcon, TriangleAlertIcon } from "@src/icons";
import { getUserFavorites } from "@src/modules/favorite/favoriteStorage.js";
import { getCachedUserAssets } from "@src/utils/session.js";
import { LevelBadge } from "@src/components/LevelBadge.jsx";
import { openFavoriteDetail } from "@src/modules/favorite/FavoriteDetail.jsx";
import { openCharacterBoxModal } from "@src/modules/character-box/index.js";

/**
 * 交易盒子头像和基本信息组件
 * @param {Object} props
 * @param {Object} props.characterData - 角色数据
 * @param {Object} props.userCharacter - 用户角色数据
 * @param {string} props.fixedAssets - 固定资产字符串
 * @param {Array} props.killVotes - 删除投票数据
 * @param {Function} props.onFavoriteClick - 点击收藏按钮的回调
 */
export function TradeBoxHeaderInfo(props) {
  const { characterData, userCharacter, fixedAssets, killVotes, onFavoriteClick } = props || {};

  if (!characterData) {
    return null;
  }

  const { CharacterId, Name, Icon, Level, ZeroCount } = characterData;
  const avatarUrl = normalizeAvatar(Icon);

  // 获取包含当前角色的收藏夹
  const getCharacterFavorites = () => {
    const userAssets = getCachedUserAssets();
    const currentUserId = userAssets?.id;
    const favorites = getUserFavorites(currentUserId);
    return favorites.filter((f) => f.characters && f.characters.includes(CharacterId));
  };

  const characterFavorites = getCharacterFavorites();

  // 投票数量和所需票数
  const voteCount = killVotes?.length || 0;
  const requiredVotes = 3;
  const hasVotes = voteCount > 0;

  return (
    <div id="tg-trade-box-header-info" className="flex flex-col gap-2 pb-2">
      <div className="flex gap-3">
        {/* 头像 */}
        <div className="relative">
          <div
            id="tg-trade-box-header-avatar"
            className="tg-avatar-border flex-shrink-0 border-2 border-gray-300 dark:border-white/30"
          >
            <div
              className="tg-avatar size-14 bg-cover bg-top"
              style={{ backgroundImage: `url(${avatarUrl})` }}
            />
          </div>
          {Level !== undefined && (
            <div className="absolute -left-2 -top-1">
              <LevelBadge level={Level} zeroCount={ZeroCount} size="sm" />
            </div>
          )}
        </div>

        {/* 名称和ID */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
          <div className="flex min-w-0 items-center">
            <a
              href={`https://bgm.tv/character/${CharacterId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tg-link inline-flex min-w-0 items-center text-sm font-semibold leading-tight"
            >
              <span className="truncate">
                #{CharacterId} -「{Name}」
              </span>
              <SquareArrowOutUpRightIcon className="h-3.5 w-3.5 flex-shrink-0" />
            </a>
          </div>
          <div className="truncate text-xs text-gray-600 dark:text-gray-400">
            <span>可用：{userCharacter ? formatNumber(userCharacter.Amount, 0) : "..."}股</span>
            <span className="mx-2">•</span>
            <span>固定资产：{fixedAssets ?? "..."}</span>
          </div>
          {/* 收藏夹标签 */}
          <div className="flex flex-wrap items-center gap-1">
            {/* 收藏按钮 */}
            <button
              type="button"
              className="inline-flex h-4 flex-shrink-0 items-center justify-center gap-0.5 rounded-full border border-gray-300 px-1 transition-colors hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-800"
              onClick={onFavoriteClick}
              title="添加到收藏夹"
            >
              <PlusIcon className="h-3 w-3 text-gray-600 dark:text-gray-400" />
              <span className="text-[10px] leading-4 text-gray-600 dark:text-gray-400">收藏</span>
            </button>
            {/* 收藏夹标签列表 */}
            {characterFavorites.map((favorite) => (
              <button
                type="button"
                className={`inline-flex flex-shrink-0 items-center gap-0.5 rounded-full py-0 pl-1.5 pr-0.5 text-[10px] font-semibold leading-4 text-white transition-opacity hover:opacity-80 ${favorite.color}`}
                onClick={() => {
                  openFavoriteDetail(favorite, openCharacterBoxModal);
                }}
                title={`打开收藏夹「${favorite.name}」`}
              >
                <span className="max-w-16 truncate">{favorite.name}</span>
                <ChevronRightIcon className="h-3 w-3 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* 投票删除警告 */}
      {hasVotes && (
        <div className="flex items-center gap-1 text-xs text-warning">
          <TriangleAlertIcon className="h-3.5 w-3.5 flex-shrink-0" />
          <span>此角色正在被投票删除（{voteCount} / {requiredVotes}），请谨慎投资</span>
        </div>
      )}
    </div>
  );
}
