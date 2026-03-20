import { formatCurrency, formatDateTime, formatNumber, formatTimeAgo } from "@src/utils/format.js";
import { bidCharacter, askCharacter, cancelBid, cancelAsk } from "@src/api/chara.js";
import { ChevronDownIcon } from "@src/icons/index.js";

/**
 * 交易区域组件
 * @param {Object} props
 * @param {Object} props.characterData - 角色数据
 * @param {Object} props.userAssets - 用户资产数据
 * @param {Object} props.userCharacter - 用户角色数据
 * @param {Object} props.depth - 市场深度数据
 * @param {boolean} props.sticky - 是否启用粘性布局
 * @param {number} props.stickyTop - 粘性布局的top值
 * @param {Function} props.onRefresh - 刷新数据的回调函数
 * @param {Function} props.setLoading - 设置全局加载状态的函数
 * @param {boolean} props.isCollapsed - 是否折叠
 * @param {Function} props.onToggleCollapse - 切换折叠状态的回调
 */
export function TradeBoxSection({
  characterData,
  userAssets,
  userCharacter,
  depth,
  sticky = false,
  stickyTop = 0,
  onRefresh,
  setLoading,
  isCollapsed = false,
  onToggleCollapse,
}) {
  const stickyClass = sticky ? "sticky" : "";
  const stickyStyle = sticky ? { top: `${stickyTop}px` } : {};

  const { LastOrder: lastOrder = "", LastDeal: lastDeal = "" } = characterData || {};

  // 计算最大价格用于显示进度条
  const getMaxAmount = () => {
    if (!depth) return 0;
    const maxAsk = Math.max(...(depth.Asks?.map((item) => item.Amount) || [0]));
    const maxBid = Math.max(...(depth.Bids?.map((item) => item.Amount) || [0]));
    return Math.max(maxAsk, maxBid);
  };

  const maxAmount = getMaxAmount();

  // 计算买入总价
  const updateBidTotal = (e) => {
    const container = e.target.parentElement;
    const priceInput = container.querySelector("#bid-price-input");
    const amountInput = container.querySelector("#bid-amount-input");
    const totalSpan = container.querySelector("#bid-total");
    const price = parseFloat(priceInput.value) || 0;
    const amount = parseFloat(amountInput.value) || 0;
    totalSpan.textContent = `总计：${formatCurrency(price * amount, "₵", 2, false)}`;
  };

  // 计算卖出总价
  const updateAskTotal = (e) => {
    const container = e.target.parentElement;
    const priceInput = container.querySelector("#ask-price-input");
    const amountInput = container.querySelector("#ask-amount-input");
    const totalSpan = container.querySelector("#ask-total");
    const price = parseFloat(priceInput.value) || 0;
    const amount = parseFloat(amountInput.value) || 0;
    totalSpan.textContent = `总计：${formatCurrency(price * amount, "₵", 2, false)}`;
  };

  // 点击卖单深度填充到买入输入框
  const handleAskDepthClick = (e, price, amount) => {
    // 向上查找最近的交易区域容器
    const container = e.currentTarget.closest("#trade-section");
    if (!container) return;

    const priceInput = container.querySelector("#bid-price-input");
    const amountInput = container.querySelector("#bid-amount-input");
    const totalSpan = container.querySelector("#bid-total");

    if (priceInput && amountInput && totalSpan) {
      priceInput.value = price;
      amountInput.value = amount;
      totalSpan.textContent = `总计：${formatCurrency(price * amount, "₵", 2, false)}`;
    }
  };

  // 点击买单深度填充到卖出输入框
  const handleBidDepthClick = (e, price, amount) => {
    // 向上查找最近的交易区域容器
    const container = e.currentTarget.closest("#trade-section");
    if (!container) return;

    const priceInput = container.querySelector("#ask-price-input");
    const amountInput = container.querySelector("#ask-amount-input");
    const totalSpan = container.querySelector("#ask-total");

    if (priceInput && amountInput && totalSpan) {
      priceInput.value = price;
      amountInput.value = amount;
      totalSpan.textContent = `总计：${formatCurrency(price * amount, "₵", 2, false)}`;
    }
  };

  // 买入按钮点击处理
  const handleBid = async (e, isIceberg = false) => {
    const container = e.currentTarget.closest("#trade-section");
    if (!container) return;

    const priceInput = container.querySelector("#bid-price-input");
    const amountInput = container.querySelector("#bid-amount-input");

    const price = parseFloat(priceInput.value);
    const amount = parseFloat(amountInput.value);

    if (!price || !amount || price <= 0 || amount <= 0) {
      alert("请输入有效的价格和数量");
      return;
    }

    if (setLoading) setLoading(true);

    const result = await bidCharacter(characterData.Id, price, amount, isIceberg);

    if (setLoading) setLoading(false);

    if (result.success) {
      alert(result.data);
      // 清空输入框
      priceInput.value = "";
      amountInput.value = "";
      const totalSpan = container.querySelector("#bid-total");
      if (totalSpan) totalSpan.textContent = "总计：₵0.00";
      // 刷新数据
      if (onRefresh) onRefresh();
    } else {
      alert(result.message);
      // 失败时恢复输入框的值
      setTimeout(() => {
        const newContainer = document.querySelector("#trade-section");
        if (newContainer) {
          const newPriceInput = newContainer.querySelector("#bid-price-input");
          const newAmountInput = newContainer.querySelector("#bid-amount-input");
          const newTotalSpan = newContainer.querySelector("#bid-total");
          if (newPriceInput) newPriceInput.value = price;
          if (newAmountInput) newAmountInput.value = amount;
          if (newTotalSpan) newTotalSpan.textContent = `总计：${formatCurrency(price * amount, "₵", 2, false)}`;
        }
      }, 0);
    }
  };

  // 卖出按钮点击处理
  const handleAsk = async (e, isIceberg = false) => {
    const container = e.currentTarget.closest("#trade-section");
    if (!container) return;

    const priceInput = container.querySelector("#ask-price-input");
    const amountInput = container.querySelector("#ask-amount-input");

    const price = parseFloat(priceInput.value);
    const amount = parseFloat(amountInput.value);

    if (!price || !amount || price <= 0 || amount <= 0) {
      alert("请输入有效的价格和数量");
      return;
    }

    if (setLoading) setLoading(true);

    const result = await askCharacter(characterData.Id, price, amount, isIceberg);

    if (setLoading) setLoading(false);

    if (result.success) {
      alert(result.data);
      // 清空输入框
      priceInput.value = "";
      amountInput.value = "";
      const totalSpan = container.querySelector("#ask-total");
      if (totalSpan) totalSpan.textContent = "总计：₵0.00";
      // 刷新数据
      if (onRefresh) onRefresh();
    } else {
      alert(result.message);
      // 失败时恢复输入框的值
      setTimeout(() => {
        const newContainer = document.querySelector("#trade-section");
        if (newContainer) {
          const newPriceInput = newContainer.querySelector("#ask-price-input");
          const newAmountInput = newContainer.querySelector("#ask-amount-input");
          const newTotalSpan = newContainer.querySelector("#ask-total");
          if (newPriceInput) newPriceInput.value = price;
          if (newAmountInput) newAmountInput.value = amount;
          if (newTotalSpan) newTotalSpan.textContent = `总计：${formatCurrency(price * amount, "₵", 2, false)}`;
        }
      }, 0);
    }
  };

  // 取消买入委托
  const handleCancelBid = async (bidId) => {
    if (!confirm("确定要取消这个买入委托吗？")) return;

    if (setLoading) setLoading(true);

    const result = await cancelBid(bidId);

    if (setLoading) setLoading(false);

    if (result.success) {
      alert(result.data);
      // 刷新数据
      if (onRefresh) onRefresh();
    } else {
      alert(result.message);
    }
  };

  // 取消卖出委托
  const handleCancelAsk = async (askId) => {
    if (!confirm("确定要取消这个卖出委托吗？")) return;

    if (setLoading) setLoading(true);

    const result = await cancelAsk(askId);

    if (setLoading) setLoading(false);

    if (result.success) {
      alert(result.data);
      // 刷新数据
      if (onRefresh) onRefresh();
    } else {
      alert(result.message);
    }
  };

  return (
    <div id="tg-trade-box-section" data-character-id={characterData?.Id}>
      {/* 标题 */}
      <div
        id="tg-trade-box-section-header"
        className={`tg-bg-content z-10 mb-2 flex items-center justify-between border-b border-gray-200 p-2 dark:border-gray-700 ${stickyClass}`}
        style={stickyStyle}
      >
        <div className="flex items-center">
          <span className="bgm-color text-sm font-semibold">交易</span>
          <span className="ml-2 text-xs opacity-60">
            余额：{userAssets ? formatCurrency(userAssets.balance) : "..."}
          </span>
        </div>
        <button
          className="flex items-center justify-center border-none bg-transparent p-0 opacity-60 transition-all hover:opacity-100"
          onClick={onToggleCollapse}
          style={{
            transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
          aria-label={isCollapsed ? "展开" : "折叠"}
        >
          <ChevronDownIcon className="h-5 w-5" />
        </button>
      </div>

      {/* 主区域 */}
      {!isCollapsed && (
        <div id="trade-section" className="flex flex-wrap gap-1">
          {/* 买入委托 */}
          <div id="tg-trade-bid-section" className="relative mb-2 min-w-[200px] flex-1">
          <div
            id="tg-trade-bid-header"
            className="mb-1 flex items-center justify-between p-2 pt-0 text-xs opacity-60"
            style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.1)" }}
          >
            <span>价格 / 数量 / 总计</span>
            <span>买入委托</span>
          </div>
          <div id="tg-trade-bid-list" className="space-y-0.5 px-2 pb-28">
            {/* 历史买入记录 */}
            <div id="tg-trade-bid-history" className="space-y-0.5 opacity-60">
              {userCharacter?.BidHistory &&
                userCharacter.BidHistory.length > 0 &&
                [...userCharacter.BidHistory].reverse().map((bid, index) => {
                  const total = bid.Price * bid.Amount;
                  return (
                    <div
                      className="flex items-center justify-between gap-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700"
                      title={formatDateTime(bid.TradeTime)}
                      data-bid-id={bid.Id}
                    >
                      <span className="flex-shrink truncate">
                        {formatCurrency(bid.Price, "₵", 2, false)} / {formatNumber(bid.Amount, 0)} /{" "}
                        {formatCurrency(-total)}
                      </span>
                      <span className="flex-shrink-0">[成交]</span>
                    </div>
                  );
                })}
            </div>

            {/* 当前买入委托 */}
            <div id="tg-trade-bid-current" className="space-y-0.5">
              {userCharacter?.Bids &&
                userCharacter.Bids.length > 0 &&
                userCharacter.Bids.map((bid, index) => {
                  const total = bid.Price * bid.Amount;
                  const isIceberg = bid.Type === 1;
                  return (
                    <div
                      className="flex items-center justify-between gap-1 bg-[#ffdeec] text-xs text-[#e46fa1]"
                      title={formatDateTime(bid.Begin)}
                      data-bid-id={bid.Id}
                    >
                      <span className="flex-shrink truncate">
                        {formatCurrency(bid.Price, "₵", 2, false)} / {formatNumber(bid.Amount, 0)} /{" "}
                        {formatCurrency(-total)}
                        {isIceberg && " [i]"}
                      </span>
                      <span
                        className="tg-link flex-shrink-0 cursor-pointer"
                        onClick={() => handleCancelBid(bid.Id)}
                      >
                        [取消]
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* 买入委托输入区域 */}
          <div id="tg-trade-bid-input" className="absolute bottom-0 mt-2 flex w-full px-2">
            <div className="w-full space-y-1">
              <input
                id="bid-price-input"
                type="number"
                placeholder="单价"
                className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none dark:border-gray-600"
                onInput={updateBidTotal}
              />
              <input
                id="bid-amount-input"
                type="number"
                placeholder="数量"
                className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none dark:border-gray-600"
                onInput={updateBidTotal}
              />
              <div id="bid-total" className="text-xs opacity-60">
                总计：₵0.00
              </div>
              <div className="flex gap-1">
                <button
                  className="flex-1 rounded bg-[#ff658d] px-2 py-1 text-xs text-white hover:bg-[#ff4d7a]"
                  onClick={(e) => handleBid(e, false)}
                >
                  买入
                </button>
                <button
                  className="flex-1 rounded bg-gray-500 px-2 py-1 text-xs text-white hover:bg-gray-600"
                  onClick={(e) => handleBid(e, true)}
                >
                  冰山
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 卖出委托 */}
        <div id="tg-trade-ask-section" className="relative mb-2 min-w-[200px] flex-1">
          <div
            id="tg-trade-ask-header"
            className="mb-1 flex items-center justify-between p-2 pt-0 text-xs opacity-60"
            style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.1)" }}
          >
            <span>价格 / 数量 / 总计</span>
            <span>卖出委托</span>
          </div>
          <div id="tg-trade-ask-list" className="space-y-0.5 px-2 pb-28">
            {/* 历史卖出记录 */}
            <div id="tg-trade-ask-history" className="space-y-0.5 opacity-60">
              {userCharacter?.AskHistory &&
                userCharacter.AskHistory.length > 0 &&
                [...userCharacter.AskHistory].reverse().map((ask, index) => {
                  const total = ask.Price * ask.Amount;
                  return (
                    <div
                      className="flex items-center justify-between gap-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700"
                      title={formatDateTime(ask.TradeTime)}
                      data-ask-id={ask.Id}
                    >
                      <span className="flex-shrink truncate">
                        {formatCurrency(ask.Price, "₵", 2, false)} / {formatNumber(ask.Amount, 0)} /
                        +{formatCurrency(total)}
                      </span>
                      <span className="flex-shrink-0">[成交]</span>
                    </div>
                  );
                })}
            </div>

            {/* 当前卖出委托 */}
            <div id="tg-trade-ask-current" className="space-y-0.5">
              {userCharacter?.Asks &&
                userCharacter.Asks.length > 0 &&
                userCharacter.Asks.map((ask, index) => {
                  const total = ask.Price * ask.Amount;
                  const isIceberg = ask.Type === 1;
                  return (
                    <div
                      className="flex items-center justify-between gap-1 bg-[#ceefff] text-xs text-[#22a3de]"
                      title={formatDateTime(ask.Begin)}
                      data-ask-id={ask.Id}
                    >
                      <span className="flex-shrink truncate">
                        {formatCurrency(ask.Price, "₵", 2, false)} / {formatNumber(ask.Amount, 0)} /
                        +{formatCurrency(total)}
                        {isIceberg && " [i]"}
                      </span>
                      <span
                        className="tg-link flex-shrink-0 cursor-pointer"
                        onClick={() => handleCancelAsk(ask.Id)}
                      >
                        [取消]
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* 卖出委托输入区域 */}
          <div id="tg-trade-ask-input" className="absolute bottom-0 mt-2 flex w-full px-2">
            <div className="w-full space-y-1">
              <input
                id="ask-price-input"
                type="number"
                placeholder="单价"
                className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none dark:border-gray-600"
                onInput={updateAskTotal}
              />
              <input
                id="ask-amount-input"
                type="number"
                placeholder="数量"
                className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none dark:border-gray-600"
                onInput={updateAskTotal}
              />
              <div id="ask-total" className="text-xs opacity-60">
                总计：₵0.00
              </div>
              <div className="flex gap-1">
                <button
                  className="flex-1 rounded bg-[#3b9edb] px-2 py-1 text-xs text-white hover:bg-[#2a8bc7]"
                  onClick={(e) => handleAsk(e, false)}
                >
                  卖出
                </button>
                <button
                  className="flex-1 rounded bg-gray-500 px-2 py-1 text-xs text-white hover:bg-gray-600"
                  onClick={(e) => handleAsk(e, true)}
                >
                  冰山
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 深度信息 */}
        <div id="tg-trade-depth-section" className="mb-2 min-w-[200px] flex-1">
          <div id="tg-trade-depth-header" className="mb-1 flex items-center justify-between border-b border-gray-200 p-2 pt-0 text-xs opacity-60 dark:border-gray-700">
            <span>
              <span title={lastOrder ? `最新成交 ${formatDateTime(lastOrder)}` : ""}>
                {formatTimeAgo(lastOrder)}
              </span>
              {" / "}
              <span title={lastDeal ? `最新挂单 ${formatDateTime(lastDeal)}` : ""}>
                {formatTimeAgo(lastDeal)}
              </span>
            </span>
            <span>深度信息</span>
          </div>
          <div id="tg-trade-depth-list" className="px-2">
            {/* 卖单深度 */}
            {depth?.Asks &&
              depth.Asks.length > 0 &&
              [...depth.Asks]
                .reverse()
                .filter((ask) => ask.Amount > 0)
                .map((ask, index) => {
                  const percentage = maxAmount > 0 ? Math.ceil((ask.Amount / maxAmount) * 100) : 0;
                  const isIceberg = ask.Type === 1;
                  const price = isIceberg ? "₵--" : formatCurrency(ask.Price, "₵", 2, false);

                  return (
                    <div
                      className="relative mb-px cursor-pointer overflow-hidden bg-[#ceefff] text-xs font-bold leading-5 text-[#22a3de] hover:bg-[#a7e3ff] hover:text-white dark:bg-[#2d2e2f] dark:hover:bg-[#a7e3ff]"
                      title={isIceberg ? "冰山委托" : ""}
                      onClick={(e) => !isIceberg && handleAskDepthClick(e, ask.Price, ask.Amount)}
                      data-depth-type="ask"
                      data-price={ask.Price}
                      data-amount={ask.Amount}
                    >
                      <div
                        className="absolute inset-y-0 right-0 bg-[#b8e7ff]"
                        style={{ width: `${percentage}%` }}
                      />
                      <span className="relative block px-1 text-right">
                        {price} / {formatNumber(ask.Amount, 0)}
                      </span>
                    </div>
                  );
                })}

            {/* 买单深度 */}
            {depth?.Bids &&
              depth.Bids.length > 0 &&
              depth.Bids.filter((bid) => bid.Amount > 0).map((bid, index) => {
                const percentage = maxAmount > 0 ? Math.ceil((bid.Amount / maxAmount) * 100) : 0;
                const isIceberg = bid.Type === 1;
                const price = isIceberg ? "₵--" : formatCurrency(bid.Price, "₵", 2, false);

                return (
                  <div
                    className="relative mb-px cursor-pointer overflow-hidden bg-[#ffdeec] text-xs font-bold leading-5 text-[#e46fa1] hover:bg-[#ffc5dd] hover:text-white dark:bg-[#2d2e2f] dark:hover:bg-[#ffc5dd]"
                    title={isIceberg ? "冰山委托" : ""}
                    onClick={(e) => !isIceberg && handleBidDepthClick(e, bid.Price, bid.Amount)}
                    data-depth-type="bid"
                    data-price={bid.Price}
                    data-amount={bid.Amount}
                  >
                    <div
                      className="absolute inset-y-0 right-0 bg-[#ffcfe3]"
                      style={{ width: `${percentage}%` }}
                    />
                    <span className="relative block px-1 text-right">
                      {price} / {formatNumber(bid.Amount, 0)}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
