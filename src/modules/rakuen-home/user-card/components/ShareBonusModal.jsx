import { getShareBonusTest } from "@src/api/event.js";
import { createMountedComponent } from "@src/utils/createMountedComponent.js";
import { formatCurrency, formatNumber } from "@src/utils/format.js";
import { closeModal, openModal } from "@src/utils/modalManager.js";
import { showError } from "@src/utils/toastManager";

/**
 * 股息预测弹窗内容组件
 */
function ShareBonusContent(container) {
  const { setState, render } = createMountedComponent(
    container,
    (state) => {
      const { loading = true, data = null } = state;

      return (
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm opacity-70">计息股份</span>
            {loading ? (
              <div className="skeleton h-4 w-20"></div>
            ) : (
              <span className="font-medium">{formatNumber(data?.total || 0, 0)} 股</span>
            )}
          </div>
          <div className="flex justify-between">
            <span className="text-sm opacity-70">圣殿数量</span>
            {loading ? (
              <div className="skeleton h-4 w-20"></div>
            ) : (
              <span className="font-medium">{formatNumber(data?.temples || 0, 0)} 座</span>
            )}
          </div>
          {!loading && data?.daily > 0 && (
            <div className="flex justify-between">
              <span className="text-sm opacity-70">登录奖励</span>
              <span className="font-medium">{formatCurrency(data.daily, "₵", 2, false)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm opacity-70">预期股息</span>
            {loading ? (
              <div className="skeleton h-4 w-24"></div>
            ) : (
              <span className="font-medium">{formatCurrency(data?.share || 0, "₵", 2, false)}</span>
            )}
          </div>
          <div className="flex justify-between">
            <span className="text-sm opacity-70">个人所得税</span>
            {loading ? (
              <div className="skeleton h-4 w-32"></div>
            ) : (
              <span className="font-medium text-[#3bb4f2]">
                {formatCurrency(data?.tax || 0, "₵", 2, false)}
              </span>
            )}
          </div>
          <div className="flex justify-between">
            <span className="text-sm opacity-70">税率</span>
            {loading ? (
              <div className="skeleton h-4 w-20"></div>
            ) : (
              <span className="font-medium">{data?.taxRate || 0}%</span>
            )}
          </div>
          <div className="divider"></div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">税后收入</span>
            {loading ? (
              <div className="skeleton h-6 w-32"></div>
            ) : (
              <span className="text-lg font-bold text-[#f087b7]">
                {formatCurrency((data?.share || 0) - (data?.tax || 0), "₵", 2, false)}
              </span>
            )}
          </div>
        </div>
      );
    },
    true
  );

  // 加载数据
  getShareBonusTest()
    .then((result) => {
      if (!result.success) {
        closeModal("share-bonus-modal");
        showError(result.message);
        return;
      }

      const data = {
        total: result.data.total || 0,
        temples: result.data.temples || 0,
        daily: result.data.daily || 0,
        share: result.data.share || 0,
        tax: result.data.tax || 0,
        taxRate:
          result.data.share > 0 ? formatNumber((result.data.tax / result.data.share) * 100, 2) : 0,
      };

      setState({ loading: false, data });
    })
    .catch((error) => {
      console.error("[ShareBonusModal] 加载失败:", error);
      closeModal("share-bonus-modal");
      showError("加载失败：" + error.message);
    });

  return container;
}

/**
 * 打开股息预测弹窗
 */
export function openShareBonusModal() {
  const contentContainer = <div />;
  ShareBonusContent(contentContainer);

  openModal("share-bonus-modal", {
    title: "股息预测",
    content: contentContainer,
    size: "sm",
  });
}
