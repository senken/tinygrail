import { Avatar } from "@src/components/Avatar.jsx";
import { Pagination } from "@src/components/Pagination.jsx";
import { normalizeAvatar } from "@src/utils/oos.js";
import { formatNumber } from "@src/utils/format.js";
import { unescapeHtml } from "@src/utils/escape";

/**
 * ICO参与者区域组件
 * @param {Object} props
 * @param {Object} props.users - ICO参与者数据
 * @param {Object} props.predicted - 计算后的ICO数据
 * @param {Function} props.loadUsersPage - 加载指定页用户数据的函数
 * @param {Function} props.openUserModal - 打开用户信息Modal的函数
 * @param {boolean} props.sticky - 是否启用粘性布局
 * @param {number} props.stickyTop - 粘性布局的top值
 */
export function IcoBoxUser({
  users,
  predicted,
  loadUsersPage,
  openUserModal,
  sticky = false,
  stickyTop = 0,
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

  // 从predicted获取下一等级所需人数
  const nextLevelUsers = predicted.Users + totalItems;

  // 处理分页切换
  const handlePageChange = (page) => {
    if (loadUsersPage) {
      loadUsersPage(page);
    }
  };

  const container = <div id="tg-ico-box-user" />;
  const gridDiv = <div id="tg-ico-box-user-list" className="grid gap-3" />;
  const paginationDiv = <div id="tg-ico-box-user-pagination" className="mt-4" />;

  // 渲染用户列表
  const renderItems = (cols) => {
    gridDiv.innerHTML = "";
    gridDiv.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    items.forEach((user, index) => {
      // 计算序列号
      const serialNumber = (currentPage - 1) * itemsPerPage + index + 1;

      // Amount为0显示+???
      const displayAmount = user.Amount > 0 ? `+${formatNumber(user.Amount, 0)}` : "+???";

      // 根据序列号决定颜色
      let badgeStyle = {};
      if (serialNumber === 1) {
        // 第1名，金色
        badgeStyle = { backgroundColor: "#FFC107", color: "#fff" };
      } else {
        // 其他，紫色
        badgeStyle = { backgroundColor: "#d965ff", color: "#fff" };
      }

      const itemContainer = (
        <div
          className="flex min-w-0 cursor-pointer items-center gap-2"
          data-user-name={user.Name}
          data-amount={user.Amount}
          data-rank={serialNumber}
          onClick={() => openUserModal && openUserModal(user.Name)}
        >
          {/* 头像 */}
          <Avatar
            src={normalizeAvatar(user.Avatar)}
            alt={user.Nickname}
            size="sm"
            rank={user.LastIndex}
          />

          {/* 用户信息 */}
          <div className="min-w-0 flex-1">
            {/* 昵称 */}
            <div className="flex min-w-0 items-center gap-1">
              <span className="flex-shrink-0 text-sm font-semibold text-gray-400 dark:text-gray-500">
                {serialNumber}
              </span>
              <span className="flex min-w-0 items-center gap-1 text-sm">
                <span className="min-w-0 truncate">{unescapeHtml(user.NickName)}</span>
              </span>
            </div>

            {/* 投入金额 */}
            <div
              className="inline-block rounded px-1.5 py-1 text-[10px] font-bold leading-none"
              style={badgeStyle}
            >
              {displayAmount}
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
  const contentDiv = <div className="px-2" />;
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
        id="tg-ico-box-user-header"
        className={`tg-bg-content z-10 mb-2 flex items-center justify-between border-b border-gray-200 p-2 dark:border-gray-700 ${stickyClass}`}
        style={stickyStyle}
      >
        <span className="bgm-color text-sm font-semibold">
          参与者 {totalItems} / <span className="opacity-60">{nextLevelUsers}</span>
        </span>
      </div>

      {/* 用户列表 */}
      {items.length > 0 && contentDiv}
    </div>
  );

  // 使用ResizeObserver监听容器宽度变化
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
