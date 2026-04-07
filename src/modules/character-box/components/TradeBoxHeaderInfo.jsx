import { normalizeAvatar } from "@src/utils/oos.js";
import { formatNumber } from "@src/utils/format.js";
import { SquareArrowOutUpRightIcon, PlusIcon } from "@src/icons";
import { getUserFavorites } from "@src/modules/favorite/favoriteStorage.js";
import { getCachedUserAssets } from "@src/utils/session.js";

/**
 * 交易盒子头像和基本信息组件
 * @param {Object} props
 * @param {Object} props.characterData - 角色数据
 * @param {Object} props.userCharacter - 用户角色数据
 * @param {string} props.fixedAssets - 固定资产字符串
 * @param {Function} props.onFavoriteClick - 点击收藏按钮的回调
 */
export function TradeBoxHeaderInfo(props) {
  const { characterData, userCharacter, fixedAssets, onFavoriteClick } = props || {};

  if (!characterData) {
    return null;
  }

  const { CharacterId, Name, Icon } = characterData;
  const avatarUrl = normalizeAvatar(Icon);

  // 获取包含当前角色的收藏夹
  const getCharacterFavorites = () => {
    const userAssets = getCachedUserAssets();
    const currentUserId = userAssets?.id;
    const favorites = getUserFavorites(currentUserId);
    return favorites.filter((f) => f.characters && f.characters.includes(CharacterId));
  };

  const characterFavorites = getCharacterFavorites();

  return (
    <div id="tg-trade-box-header-info" className="flex gap-3 pb-2">
      {/* 头像 */}
      <div
        id="tg-trade-box-header-avatar"
        className="tg-avatar-border flex-shrink-0 border-2 border-gray-300 dark:border-white/30"
      >
        <div
          className="tg-avatar size-14 bg-cover bg-top"
          style={{ backgroundImage: `url(${avatarUrl})` }}
        />
      </div>

      {/* 名称和ID */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        <a
          href={`https://bgm.tv/character/${CharacterId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="tg-link flex min-w-0 items-center text-sm font-semibold leading-tight"
        >
          <span className="truncate">
            #{CharacterId} -「{Name}」
          </span>
          <SquareArrowOutUpRightIcon className="h-3.5 w-3.5 flex-shrink-0" />
        </a>
        <div className="truncate text-xs text-gray-600 dark:text-gray-400">
          <span>持股：{userCharacter ? formatNumber(userCharacter.Amount, 0) : "..."}股</span>
          <span className="mx-2">•</span>
          <span>固定资产：{fixedAssets ?? "..."}</span>
        </div>
        {/* 收藏夹标签 */}
        <div className="flex items-center gap-1 overflow-hidden">
          {/* 收藏按钮 */}
          <button
            type="button"
            className="inline-flex h-4 flex-shrink-0 items-center justify-center gap-0.5 rounded-md border border-gray-300 px-1 transition-colors hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-800"
            onClick={onFavoriteClick}
            title="添加到收藏夹"
          >
            <PlusIcon className="h-3 w-3 text-gray-600 dark:text-gray-400" />
            <span className="text-[10px] leading-4 text-gray-600 dark:text-gray-400">收藏</span>
          </button>
          {/* 收藏夹标签列表 */}
          {characterFavorites.map((favorite) => (
            <span
              className={`inline-block flex-shrink-0 rounded-md px-1.5 py-0 text-[10px] font-semibold leading-4 text-white ${favorite.color}`}
            >
              {favorite.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
