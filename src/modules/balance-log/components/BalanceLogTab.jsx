import { formatCurrency, formatTimeAgo } from "@src/utils/format.js";
import { Pagination } from "@src/components/Pagination.jsx";

/**
 * 资金日志Tab组件
 * @param {Object} props - 组件属性
 * @param {Object} props.data - 资金日志数据
 * @param {Function} props.onPageChange - 分页变化回调
 * @param {Function} props.onCharacterClick - 角色点击回调
 */
export function BalanceLogTab({ data, onPageChange, onCharacterClick }) {
  /**
   * 解析Description文本，将#数字转换为可点击的链接
   * @param {string} text - 原始文本
   * @returns {JSX.Element} 解析后的JSX元素
   */
  const parseDescription = (text) => {
    if (!text) return text;

    // 匹配 #数字 的正则表达式
    const regex = /#(\d+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // 添加匹配前的文本
      if (match.index > lastIndex) {
        parts.push(<span className="opacity-75">{text.substring(lastIndex, match.index)}</span>);
      }

      // 添加可点击的角色ID链接
      const characterId = match[1];
      parts.push(
        <span
          className="bgm-color cursor-pointer hover:opacity-75"
          onClick={(e) => {
            e.stopPropagation();
            if (onCharacterClick) {
              onCharacterClick(parseInt(characterId));
            }
          }}
        >
          #{characterId}
        </span>
      );

      lastIndex = regex.lastIndex;
    }

    // 添加剩余的文本
    if (lastIndex < text.length) {
      parts.push(<span className="opacity-75">{text.substring(lastIndex)}</span>);
    }

    return <span>{parts}</span>;
  };

  if (!data) {
    return (
      <div className="tg-bg-content rounded-lg p-8 text-center">
        <p className="text-lg opacity-60">加载中...</p>
      </div>
    );
  }

  if (!data.items || data.items.length === 0) {
    return (
      <div className="tg-bg-content rounded-lg p-8 text-center">
        <p className="text-lg opacity-60">暂无数据</p>
      </div>
    );
  }

  return (
    <div id="tg-balance-log-tab" className="flex w-full flex-col gap-4">
      <div id="tg-balance-log-list" className="tg-bg-content rounded-lg">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.items.map((item, index) => {
            return (
              <li
                id="tg-balance-log-item"
                className="flex items-center justify-between gap-2 px-4 py-3 transition-colors even:bg-gray-50/50 dark:even:bg-gray-800/30"
              >
                <div className="flex flex-1 items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold">
                        {formatCurrency(item.Balance, "₵", 2, false)}
                      </span>
                      <span className="text-xs opacity-60">{formatTimeAgo(item.LogTime)}</span>
                    </div>
                    <div className="mt-1 text-sm">{parseDescription(item.Description)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.Change !== 0 && (
                    <span
                      className="rounded px-2 py-0.5 text-xs font-bold"
                      style={{
                        backgroundColor: item.Change > 0 ? "#ff658d" : "#65bcff",
                        color: "#fff",
                      }}
                    >
                      {item.Change > 0 ? "+" : "-"}₵
                      {formatCurrency(Math.abs(item.Change), "", 2, false)}
                    </span>
                  )}
                  {item.Amount !== 0 && (
                    <span
                      className="rounded px-2 py-0.5 text-xs font-bold"
                      style={{
                        backgroundColor: item.Amount > 0 ? "#45d216" : "#d2d2d2",
                        color: "#fff",
                      }}
                    >
                      {item.Amount > 0 ? "+" : ""}
                      {item.Amount}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 分页 */}
      {data.totalPages && data.totalPages >= 1 && (
        <div className="flex w-full justify-center">
          <Pagination
            current={Number(data.currentPage) || 1}
            total={Number(data.totalPages)}
            onChange={(page) => onPageChange && onPageChange(page)}
          />
        </div>
      )}
    </div>
  );
}
