import { normalizeAvatar } from "@src/utils/oos.js";
import { formatNumber } from "@src/utils/format.js";
import { SquareArrowOutUpRightIcon } from "@src/icons";

/**
 * 交易盒子头像和基本信息组件
 * @param {Object} props
 * @param {Object} props.characterData - 角色数据
 * @param {Object} props.userCharacter - 用户角色数据
 * @param {string} props.fixedAssets - 固定资产字符串
 */
export function TradeBoxHeaderInfo(props) {
  const { characterData, userCharacter, fixedAssets } = props || {};

  if (!characterData) {
    return null;
  }

  const { CharacterId, Name, Icon } = characterData;
  const avatarUrl = normalizeAvatar(Icon);

  return (
    <div id="tg-trade-box-header-info" className="flex gap-3 pb-2">
      {/* 头像 */}
      <div
        id="tg-trade-box-header-avatar"
        className="size-12 flex-shrink-0 rounded-lg border border-gray-200 bg-cover bg-top dark:border-gray-600"
        style={{ backgroundImage: `url(${avatarUrl})` }}
      />

      {/* 名称和ID */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <a
          href={`https://bgm.tv/character/${CharacterId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="tg-link flex min-w-0 items-center gap-1 text-base font-semibold leading-tight"
        >
          <span className="truncate">
            #{CharacterId} -「{Name}」
          </span>
          <SquareArrowOutUpRightIcon className="h-4 w-4 flex-shrink-0" />
        </a>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          <span>持股：{userCharacter ? formatNumber(userCharacter.Amount, 0) : "..."}股</span>
          <span className="mx-2">•</span>
          <span>固定资产：{fixedAssets ?? "..."}</span>
        </div>
      </div>
    </div>
  );
}
