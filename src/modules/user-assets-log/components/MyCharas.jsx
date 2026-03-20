import { normalizeAvatar } from "@src/utils/oos.js";
import { formatNumber } from "@src/utils/format.js";
import { Pagination } from "@src/components/Pagination.jsx";
import { LevelBadge } from "@src/components/LevelBadge.jsx";

/**
 * 我的持仓组件
 * @param {Object} props
 * @param {Object} props.data - 持仓数据
 * @param {Function} props.onPageChange - 页码变化回调函数
 * @param {Function} props.onCharacterClick - 角色点击回调函数
 */
export function MyCharas({ data, onPageChange, onCharacterClick }) {
  if (!data || !data.items || data.items.length === 0) {
    return (
      <div className="tg-bg-content rounded-lg p-8 text-center">
        <p className="text-lg opacity-60">暂无持仓</p>
      </div>
    );
  }

  const container = <div className="flex w-full flex-col gap-4" />;
  const listDiv = <div className="flex w-full flex-col gap-0" />;
  const paginationDiv = <div className="flex w-full justify-center" />;

  // 渲染列表项
  data.items.forEach((item) => {
    const avatarUrl = normalizeAvatar(item.Icon);

    const itemDiv = (
      <div
        className="tg-bg-content flex min-w-0 cursor-pointer items-center gap-3 border-b border-gray-200 px-3 py-1 last:border-b-0 dark:border-gray-700"
        onClick={() => {
          if (onCharacterClick) {
            onCharacterClick(item.CharacterId);
          }
        }}
      >
        {/* 头像 */}
        <div
          className="size-10 flex-shrink-0 rounded-lg border border-gray-200 bg-cover bg-top dark:border-gray-600"
          style={{ backgroundImage: `url(${avatarUrl})` }}
        />

        {/* 信息 */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex min-w-0 items-center gap-1 text-sm font-medium">
            <LevelBadge level={item.Level} zeroCount={item.ZeroCount} />
            <span className="min-w-0 truncate">{item.Name}</span>
          </div>
          <div className="text-xs opacity-60">
            <span>持股：{item.UserTotal === 0 ? "--" : formatNumber(item.UserTotal, 0)}</span>
            <span className="mx-2">•</span>
            <span>固定资产：{item.Sacrifices === 0 ? "--" : formatNumber(item.Sacrifices, 0)}</span>
          </div>
        </div>
      </div>
    );

    listDiv.appendChild(itemDiv);
  });

  container.appendChild(listDiv);

  // 添加分页
  if (data.totalPages && data.totalPages >= 1) {
    const pagination = (
      <Pagination
        current={Number(data.currentPage) || 1}
        total={Number(data.totalPages)}
        onChange={(page) => onPageChange && onPageChange(page)}
      />
    );
    paginationDiv.appendChild(pagination);
    container.appendChild(paginationDiv);
  }

  return container;
}
