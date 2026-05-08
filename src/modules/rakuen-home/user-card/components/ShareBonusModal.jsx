import { getShareBonusTest } from "@src/api/event.js";
import { createMountedComponent } from "@src/utils/createMountedComponent.js";
import { formatCurrency, formatNumber } from "@src/utils/format.js";
import { closeModal, openModal } from "@src/utils/modalManager.js";
import { showError } from "@src/utils/toastManager";
import { loadECharts } from "@src/utils/echarts-loader.js";

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
          {/* 图表容器 */}
          {!loading && (
            <div id="share-bonus-chart" className="h-48 w-full"></div>
          )}
          
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

      // 渲染图表
      setTimeout(async () => {
        const chartContainer = container.querySelector("#share-bonus-chart");
        if (!chartContainer) return;

        try {
          const echarts = await loadECharts();
          const afterTax = (data.share || 0) - (data.tax || 0);

          const chartData = [
            { value: afterTax, name: "税后收入" },
            { value: data.tax, name: "个人所得税" },
          ];

          // 检测夜间模式
          const isDarkMode = document.documentElement.getAttribute("data-theme") === "dark";
          const borderColor = isDarkMode ? "#2d2e2f" : "#fff";
          const textColor = isDarkMode ? "#e5e7eb" : "#333";

          const option = {
            backgroundColor: "transparent",
            tooltip: {
              trigger: "item",
              valueFormatter: (value) => formatCurrency(value),
              confine: true,
            },
            legend: {
              orient: "vertical",
              right: 10,
              top: "center",
              textStyle: {
                fontSize: 12,
                color: textColor,
              },
            },
            series: [
              {
                type: "pie",
                radius: ["40%", "70%"],
                center: ["35%", "50%"],
                avoidLabelOverlap: false,
                itemStyle: {
                  borderRadius: 10,
                  borderColor: borderColor,
                  borderWidth: 2,
                },
                label: {
                  show: false,
                  position: "center",
                  color: textColor,
                },
                emphasis: {
                  label: {
                    show: true,
                    fontSize: 14,
                    fontWeight: "bold",
                    color: textColor,
                  },
                },
                data: chartData,
                color: ["#f087b7", "#3bb4f2"],
              },
            ],
          };

          const chart = echarts.init(chartContainer);
          chart.setOption(option);

          const resizeObserver = new ResizeObserver(() => {
            chart.resize();
          });
          resizeObserver.observe(chartContainer);
        } catch (error) {
          console.error("加载图表失败:", error);
        }
      }, 0);
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
