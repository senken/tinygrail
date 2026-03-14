import { createMountedComponent } from "@src/utils/createMountedComponent.js";
import { getUserSendLog } from "@src/api/user.js";
import { createRequestManager } from "@src/utils/requestManager.js";
import { formatCurrency, formatDateTime } from "@src/utils/format.js";
import { Modal } from "@src/components/Modal.jsx";
import { Pagination } from "@src/components/Pagination.jsx";
import { UserTinygrail } from "@src/modules/user-tinygrail/UserTinygrail.jsx";
import { unescapeHtml } from "@src/utils/escape";

/**
 * 红包记录组件
 * @param {Object} props
 * @param {string} props.username - 用户名
 * @param {string} props.nickname - 用户昵称
 */
export function RedPacketLog({ username, nickname = "" }) {
  const container = <div id="tg-red-packet-log" className="max-w-2xl" />;

  // 创建请求管理器
  const requestManager = createRequestManager();

  // 处理描述文本，将「用户昵称」转换为可点击的链接
  const renderDescription = (description, relatedName, onUserClick) => {
    const regex = /「([^」]+)」/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(description)) !== null) {
      // 添加匹配前的文本
      if (match.index > lastIndex) {
        parts.push(description.substring(lastIndex, match.index));
      }

      // 添加可点击的用户昵称
      const nickname = match[1];
      parts.push(
        <span
          className="tg-link cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            if (onUserClick) {
              onUserClick(relatedName);
            }
          }}
        >
          「{unescapeHtml(nickname)}」
        </span>
      );

      lastIndex = regex.lastIndex;
    }

    // 添加剩余的文本
    if (lastIndex < description.length) {
      parts.push(description.substring(lastIndex));
    }

    return <span>{parts}</span>;
  };

  const { setState } = createMountedComponent(container, (state) => {
    const {
      redPacketLogData = null,
      showUserModal = false,
      userModalUsername = null,
    } = state || {};

    if (!redPacketLogData) {
      return (
        <div className="p-4">
          <div>加载中...</div>
        </div>
      );
    }

    if (redPacketLogData.error) {
      return (
        <div className="p-4">
          <div>加载失败</div>
        </div>
      );
    }

    const {
      Items: items = [],
      TotalPages: totalPages = 0,
      CurrentPage: currentPage = 1,
    } = redPacketLogData;

    // 用户点击处理
    const handleUserClick = (username) => {
      setState({
        showUserModal: true,
        userModalUsername: username,
      });
    };

    // 分页处理
    const handlePageChange = (page) => {
      loadRedPacketLogPage(page);
    };

    return (
      <div>
        {items.length > 0 ? (
          <div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {items.map((item, index) => {
                const isPositive = item.Change > 0;
                const changeColor = isPositive ? "#ff658d" : "#65bcff";
                const changeText = isPositive
                  ? `+${formatCurrency(item.Change)}`
                  : formatCurrency(item.Change);

                return (
                  <div className="py-2 first:pt-0 last:pb-0">
                    {/* 金额时间 */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold" style={{ color: changeColor }}>
                        {changeText}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDateTime(item.LogTime)}
                      </span>
                    </div>
                    {/* 描述 */}
                    <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                      {renderDescription(item.Description, item.RelatedName, handleUserClick)}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* 分页 */}
            {totalPages > 1 && (
              <div className="mt-4">
                <Pagination current={currentPage} total={totalPages} onChange={handlePageChange} />
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500">暂无记录</div>
        )}
        {/* 用户弹窗 */}
        {showUserModal && userModalUsername && (
          <Modal visible={showUserModal} onClose={() => setState({ showUserModal: false })}>
            <UserTinygrail username={userModalUsername} stickyTop="-16px" />
          </Modal>
        )}
      </div>
    );
  });

  // 加载红包记录分页
  const loadRedPacketLogPage = (page) => {
    requestManager.execute(
      () => getUserSendLog(username, page),
      (result) => {
        if (result.success) {
          setState({ redPacketLogData: result.data });
        } else {
          setState({ redPacketLogData: { error: true } });
        }
      }
    );
  };

  // 初始加载第一页
  loadRedPacketLogPage(1);

  return container;
}
