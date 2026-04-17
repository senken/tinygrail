import { normalizeAvatar } from "@src/utils/oos.js";
import { formatNumber, formatTimeAgo } from "@src/utils/format.js";
import { StarRankBadge } from "@src/components/StarRankBadge.jsx";
import { ArrowUpIcon } from "@src/icons/ArrowUpIcon.js";
import { ArrowDownIcon } from "@src/icons/ArrowDownIcon.js";
import { StarIcon } from "@src/icons";
import { Pagination } from "@src/components/Pagination.jsx";

/**
 * 通天塔日志组件
 * @param {Object} props
 * @param {Object} props.logData - 日志数据
 * @param {Function} props.onOpenCharacter - 打开角色回调函数
 * @param {Function} props.onOpenUser - 打开用户回调函数
 * @param {Function} props.onPageChange - 页码变化回调函数
 */
export function BabelTowerLog({ logData, onOpenCharacter, onOpenUser, onPageChange }) {
  const container = <div id="tg-rakuen-home-babel-tower-log" className="flex flex-col gap-2" />;

  // 日志列表容器
  const logsContainer = (
    <div
      id="tg-rakuen-home-babel-tower-log-list"
      className="flex flex-col divide-y divide-gray-200 dark:divide-gray-700"
    />
  );
  container.appendChild(logsContainer);

  // 分页容器
  const paginationContainer = <div className="mt-2 flex justify-center" />;
  container.appendChild(paginationContainer);

  /**
   * 渲染单条日志
   * @param {Object} log - 日志对象
   */
  const renderLogItem = (log) => {
    // 排名徽章
    const rankBadge = <StarRankBadge rank={log.Rank} starForces={log.StarForces} size="sm" />;

    // 排名变化
    let rankChange = null;
    if (log.Rank > log.OldRank) {
      rankChange = (
        <span className="inline-flex items-center gap-0.5 text-xs text-[#a7e3ff]">
          <ArrowDownIcon className="h-3 w-3" />
          {log.Rank - log.OldRank}
        </span>
      );
    } else if (log.Rank < log.OldRank) {
      rankChange = (
        <span className="inline-flex items-center gap-0.5 text-xs text-[#ffa7cc]">
          <ArrowUpIcon className="h-3 w-3" />
          {log.OldRank - log.Rank}
        </span>
      );
    }

    // 操作信息
    let actionInfo;
    switch (log.Type) {
      case 0:
        // 星之力
        actionInfo = (
          <span
            className="tg-link inline-flex min-w-0 cursor-pointer items-center gap-1 leading-none text-[#ffa7cc] hover:opacity-80"
            onClick={(e) => {
              e.stopPropagation();
              onOpenUser && onOpenUser(log.UserName);
            }}
          >
            <span className="min-w-0 truncate">@{log.Nickname}</span>
            <span className="flex-shrink-0">+{formatNumber(log.Amount, 0)}</span>
          </span>
        );
        break;
      case 2:
        // 鲤鱼之眼
        actionInfo = (
          <span
            className="tg-link inline-flex min-w-0 cursor-pointer items-center gap-1 leading-none text-[#ffa7cc] hover:opacity-80"
            onClick={(e) => {
              e.stopPropagation();
              onOpenUser && onOpenUser(log.UserName);
            }}
          >
            <span className="min-w-0 truncate">@{log.Nickname}</span>
            <span className="flex-shrink-0">鲤鱼之眼 +{formatNumber(log.Amount, 0)}</span>
          </span>
        );
        break;
      case 3:
        // 精炼成功
        actionInfo = (
          <span
            className="tg-link inline-flex min-w-0 cursor-pointer items-center gap-1 leading-none text-[#ffa7cc] hover:opacity-80"
            onClick={(e) => {
              e.stopPropagation();
              onOpenUser && onOpenUser(log.UserName);
            }}
          >
            <span className="min-w-0 truncate">@{log.Nickname}</span>
            <span className="flex-shrink-0">精炼成功 +{formatNumber(log.Amount, 0)}</span>
          </span>
        );
        break;
      case 4:
        // 精炼失败
        actionInfo = (
          <span
            className="tg-link inline-flex min-w-0 cursor-pointer items-center gap-1 leading-none text-[#a7e3ff] hover:opacity-80"
            onClick={(e) => {
              e.stopPropagation();
              onOpenUser && onOpenUser(log.UserName);
            }}
          >
            <span className="min-w-0 truncate">@{log.Nickname}</span>
            <span className="flex-shrink-0">精炼失败 +{formatNumber(log.Amount, 0)}</span>
          </span>
        );
        break;
      case 5:
        // 星级提升
        actionInfo = (
          <span
            className="tg-link inline-flex min-w-0 cursor-pointer items-center gap-1 leading-none text-[#ffa7cc] hover:opacity-80"
            onClick={(e) => {
              e.stopPropagation();
              onOpenUser && onOpenUser(log.UserName);
            }}
          >
            <span className="min-w-0 truncate">@{log.Nickname}</span>
            <span className="flex-shrink-0">+{formatNumber(log.Amount, 0)}</span>
            <span className="inline-flex flex-shrink-0 items-center text-yellow-400">
              <StarIcon className="size-3" />
            </span>
          </span>
        );
        break;
      default:
        // 受到攻击
        actionInfo = (
          <span className="inline-flex min-w-0 items-center gap-1 leading-none text-[#a7e3ff]">
            <span>受到攻击</span>
            <span>-{formatNumber(log.Amount, 0)}</span>
          </span>
        );
    }

    const logItem = (
      <div
        data-character-id={log.CharacterId}
        className="flex cursor-pointer gap-2 rounded p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        onClick={() => onOpenCharacter && onOpenCharacter(log.CharacterId)}
      >
        {/* 头像 */}
        <div className="tg-avatar-border flex-shrink-0 cursor-pointer border-2 border-gray-300 dark:border-white/30">
          <div
            className="tg-avatar h-10 w-10 bg-cover bg-top"
            style={{ backgroundImage: `url(${normalizeAvatar(log.Icon)})` }}
          />
        </div>

        {/* 信息 */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {/* 角色名、排名徽章和排名变化 */}
          <div className="flex min-w-0 items-center gap-1.5 text-sm">
            <span className="min-w-0 cursor-pointer truncate font-medium hover:opacity-80">
              {log.CharacterName}
            </span>
            <span className="flex flex-shrink-0 items-center gap-1">
              {rankBadge}
              {rankChange}
            </span>
          </div>

          {/* 操作信息和时间 */}
          <div className="flex items-center justify-between gap-1 text-xs">
            {actionInfo}
            <span className="flex-shrink-0 opacity-60">{formatTimeAgo(log.LogTime)}</span>
          </div>
        </div>
      </div>
    );

    return logItem;
  };

  /**
   * 渲染日志列表
   */
  const renderLogs = () => {
    logsContainer.innerHTML = "";

    if (!logData || !logData.Items || logData.Items.length === 0) {
      const emptyDiv = <div className="p-4 text-center text-sm opacity-60">暂无日志</div>;
      logsContainer.appendChild(emptyDiv);
      return;
    }

    logData.Items.forEach((log) => {
      const logItem = renderLogItem(log);
      logsContainer.appendChild(logItem);
    });
  };

  /**
   * 渲染分页
   */
  const renderPagination = () => {
    paginationContainer.innerHTML = "";

    if (!logData || !logData.Items || logData.Items.length === 0) {
      return;
    }

    const currentPage = logData.CurrentPage || 1;

    const pagination = (
      <Pagination
        current={currentPage}
        type="simple"
        onChange={(page) => onPageChange && onPageChange(page)}
      />
    );
    paginationContainer.appendChild(pagination);
  };

  // 初始化
  renderLogs();
  renderPagination();

  return container;
}
