import { Avatar } from "@src/components/Avatar.jsx";
import { Pagination } from "@src/components/Pagination.jsx";
import { normalizeAvatar } from "@src/utils/oos.js";
import { formatNumber, getTimeDiff } from "@src/utils/format.js";
import { unescapeHtml } from "@src/utils/escape";
import { ChevronDownIcon } from "@src/icons/index.js";

/**
 * 持股用户区域组件
 * @param {Object} props
 * @param {Object} props.characterData - 角色数据
 * @param {Object} props.users - 持股用户数据
 * @param {Function} props.loadUsersPage - 加载指定页用户数据的函数
 * @param {Function} props.openUserModal - 打开用户信息Modal的函数
 * @param {boolean} props.sticky - 是否启用粘性布局
 * @param {number} props.stickyTop - 粘性布局的top值
 * @param {boolean} props.isCollapsed - 是否折叠
 * @param {Function} props.onToggleCollapse - 切换折叠状态的回调
 */
export function TradeBoxUser({
  characterData,
  users,
  loadUsersPage,
  openUserModal,
  sticky = false,
  stickyTop = 0,
  isCollapsed = false,
  onToggleCollapse,
}) {
  const stickyClass = sticky ? "sticky" : "";
  const stickyStyle = sticky ? { top: `${stickyTop}px` } : {};

  const {
    CurrentPage: currentPage = 1,
    ItemsPerPage: itemsPerPage = 24,
    TotalItems: totalItems = 0,
    TotalPages: totalPages = 0,
    Items: items = [],
  } = users || {};

  // 处理分页切换
  const handlePageChange = (page) => {
    if (loadUsersPage) {
      loadUsersPage(page);
    }
  };

  const container = <div id="tg-trade-box-user" data-character-id={characterData?.Id} />;
  const gridDiv = <div id="tg-trade-box-user-list" className="grid gap-1" />;
  const paginationDiv = <div id="tg-trade-box-user-pagination" className="mt-4 pb-1" />;

  // 渲染用户列表
  const renderItems = (cols) => {
    gridDiv.innerHTML = "";
    gridDiv.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    items.forEach((user, index) => {
      // 计算序列号
      const serialNumber = (currentPage - 1) * itemsPerPage + index + 1;
      const displayNumber = serialNumber === 1 ? "主席" : serialNumber;

      // 检查用户是否被封禁
      const isBanned = user.State === 666;

      // Balance为0显示"--"
      const displayBalance = user.Balance > 0 ? formatNumber(user.Balance, 0) : "--";

      // 计算持股百分比
      const displayPercentage =
        user.Balance > 0 && characterData.Total > 0
          ? `(${((user.Balance / characterData.Total) * 100).toFixed(2)}%)`
          : "(??%)";

      // 计算用户是否不活跃（超过5天未活跃）
      const timeDiff = getTimeDiff(user.LastActiveDate);
      const isInactive = timeDiff >= 1000 * 60 * 60 * 24 * 5;

      // 计算活跃时间提示文本
      const daysSinceActive = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const activeTooltip = daysSinceActive < 1 ? "最近活跃" : `${daysSinceActive}天前活跃`;

      // 根据序列号和活跃天数决定颜色
      let badgeStyle = {};
      if (isInactive) {
        // 超过5天未活跃，灰色
        badgeStyle = { backgroundColor: "#d2d2d2", color: "#fff" };
      } else if (serialNumber === 1) {
        // 第1名，金色
        badgeStyle = { backgroundColor: "#FFC107", color: "#fff" };
      } else if (serialNumber >= 2 && serialNumber <= 9) {
        // 2-9名，紫色
        badgeStyle = { backgroundColor: "#d965ff", color: "#fff" };
      } else {
        // 其他，绿色
        badgeStyle = { backgroundColor: "#45d216", color: "#fff" };
      }

      const itemContainer = (
        <div
          id="tg-trade-box-user-item"
          className="flex min-w-0 cursor-pointer items-center gap-2 px-2 py-1"
          data-user-name={user.Name}
          data-balance={user.Balance}
          data-rank={serialNumber}
          onClick={() => openUserModal && openUserModal(user.Name)}
        >
          {/* 头像 */}
          <div className={isBanned ? "rounded-full border-2 border-red-500" : ""}>
            <Avatar
              src={normalizeAvatar(user.Avatar)}
              alt={user.Nickname}
              size="sm"
              rank={user.LastIndex}
            />
          </div>

          {/* 用户信息 */}
          <div className="min-w-0 flex-1">
            {/* 昵称 */}
            <div className="flex min-w-0 items-center gap-1">
              <span className="flex-shrink-0 text-sm font-semibold text-gray-400 dark:text-gray-500">
                {displayNumber}
              </span>
              <span
                className={`flex min-w-0 items-center gap-1 text-sm ${isBanned ? "text-red-500" : ""}`}
              >
                <span className="min-w-0 truncate">{unescapeHtml(user.Nickname)}</span>
              </span>
            </div>

            {/* 持股数 */}
            <div
              className="inline-block rounded px-1.5 py-1 text-[10px] font-bold leading-none"
              style={badgeStyle}
              title={activeTooltip}
            >
              {displayBalance} {displayPercentage}
            </div>
          </div>
        </div>
      );

      gridDiv.appendChild(itemContainer);
    });
  };

  // 计算列数
  const calculateColumns = (width) => {
    const minCellWidth = 160;
    const gap = 8;

    // 计算可以容纳的最大列数
    let cols = Math.floor((width + gap) / (minCellWidth + gap));

    // 确保列数是24的因数
    const divisors = [24, 12, 8, 6, 4, 3, 2, 1];
    for (const divisor of divisors) {
      if (cols >= divisor) {
        return divisor;
      }
    }
    return 1;
  };

  // 初始渲染
  const initialCols = calculateColumns(container.offsetWidth || 800);
  renderItems(initialCols);

  // 组装容器
  const contentDiv = <div />;
  contentDiv.appendChild(gridDiv);

  // 添加分页
  if (totalPages > 1) {
    const pagination = (
      <Pagination current={currentPage} total={totalPages} onChange={handlePageChange} />
    );
    paginationDiv.appendChild(pagination);
    contentDiv.appendChild(paginationDiv);
  }

  container.appendChild(
    <div>
      {/* 标题 */}
      <div
        id="tg-trade-box-user-header"
        className={`tg-bg-content z-10 mb-2 flex cursor-pointer items-center justify-between border-b border-gray-200 py-2 dark:border-gray-700 ${stickyClass}`}
        style={stickyStyle}
        onClick={onToggleCollapse}
      >
        <span className="bgm-color text-sm font-semibold">董事会 {totalItems}</span>
        <div
          className="flex items-center justify-center opacity-60 transition-all"
          style={{
            transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          <ChevronDownIcon className="h-5 w-5" />
        </div>
      </div>

      {/* 用户列表 */}
      {!isCollapsed && items.length > 0 && contentDiv}
    </div>
  );

  // 使用 ResizeObserver 监听容器宽度变化
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const width = entry.contentRect.width;
      const newCols = calculateColumns(width);
      renderItems(newCols);
    }
  });

  observer.observe(container);

  return container;
}
