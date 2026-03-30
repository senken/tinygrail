import { auctionCharacter, getAuctionList, cancelAuction } from "@src/api/chara.js";
import { Button } from "@src/components/Button.jsx";
import { Tooltip } from "@src/components/Tooltip.jsx";
import { QuestionIcon } from "@src/icons";
import { formatCurrency, formatNumber } from "@src/utils/format";

/**
 * 拍卖组件
 * @param {Object} props
 * @param {number} props.characterId - 角色ID
 * @param {number} props.basePrice - 底价
 * @param {number} props.maxAmount - 最大数量
 */
export function Auction({ characterId, basePrice = 0, maxAmount = 0 }) {
  const minPrice = Math.ceil(basePrice);
  let price = minPrice.toString();
  let amount = maxAmount;
  let auctionData = null;
  let isLockTotal = false; // 是否锁定总额
  let lockedTotal = 0; // 锁定的总额

  const totalDiv = (
    <div id="tg-auction-total" className="text-xs opacity-60">
      合计：{formatCurrency(minPrice * maxAmount)}
    </div>
  );

  const updateTotal = () => {
    const priceNum = Number(price) || 0;
    const amountNum = Number(amount) || 0;
    const total = priceNum * amountNum;
    totalDiv.textContent = `合计：${formatCurrency(total)}`;
  };

  const priceInput = (
    <input
      id="tg-auction-price-input"
      type="number"
      className="tg-bg-content rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 dark:border-gray-600"
      placeholder="请输入价格"
      value={minPrice}
      onInput={(e) => {
        price = e.target.value;

        // 如果锁定总额，修改价格时自动调整数量
        if (isLockTotal && lockedTotal > 0) {
          const priceNum = Number(price) || 0;

          if (priceNum > 0) {
            const newAmount = Math.ceil(lockedTotal / priceNum);
            amount = String(newAmount);
            amountInput.value = String(newAmount);
          }
        }

        updateTotal();
      }}
      min={minPrice}
      step="1"
    />
  );

  const amountInput = (
    <input
      id="tg-auction-amount-input"
      type="number"
      className="tg-bg-content rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 dark:border-gray-600"
      placeholder="请输入数量"
      value={amount}
      onInput={(e) => {
        amount = e.target.value;

        // 如果锁定总额，修改数量时自动调整价格
        if (isLockTotal && lockedTotal > 0) {
          const amountNum = Number(amount) || 0;

          if (amountNum > 0) {
            const newPrice = Math.ceil((lockedTotal / amountNum) * 100) / 100;
            price = String(newPrice);
            priceInput.value = String(newPrice);
          }
        }

        updateTotal();
      }}
      min="0"
      step="1"
    />
  );

  // 快速输入按钮
  const createQuickButton = (text, getValue) => (
    <button
      type="button"
      className="bgm-color hover:bgm-bg w-fit whitespace-nowrap rounded-full border border-current px-2 py-0.5 text-xs font-medium transition-all hover:border-transparent hover:text-white"
      onClick={() => {
        const value = getValue();
        amount = String(value);
        amountInput.value = String(value);

        // 如果锁定总额，修改数量时自动调整价格
        if (isLockTotal && lockedTotal > 0) {
          const amountNum = Number(amount) || 0;

          if (amountNum > 0) {
            const newPrice = Math.ceil((lockedTotal / amountNum) * 100) / 100;
            price = String(newPrice);
            priceInput.value = String(newPrice);
          }
        }

        updateTotal();
      }}
    >
      {text}
    </button>
  );

  // 拍满按钮
  const fillButton = createQuickButton("拍满", () => {
    const auctionedAmount = auctionData?.[0]?.Type || 0; // 已竞拍数量
    const myAmount = auctionData?.[0]?.Amount || 0; // 我的出价数量

    if (myAmount > 0) {
      const remaining = maxAmount - (auctionedAmount - myAmount);
      return Math.max(0, remaining);
    } else {
      const remaining = maxAmount - auctionedAmount;
      return Math.max(0, remaining);
    }
  });

  // 英灵殿按钮
  const maxAmountButton = createQuickButton("英灵殿", () => {
    return maxAmount;
  });

  const quickButtonsDiv = (
    <div className="flex gap-2">
      {fillButton}
      {maxAmountButton}
    </div>
  );

  // 锁定总额复选框
  const checkboxContainer = (
    <div className="relative inline-flex cursor-pointer">
      <input
        type="checkbox"
        id="tg-auction-lock-checkbox"
        className="peer sr-only"
        onChange={(e) => {
          isLockTotal = e.target.checked;
          // 更新复选框状态
          const indicator = document.getElementById("tg-auction-lock-indicator");
          if (indicator) {
            indicator.style.display = e.target.checked ? "block" : "none";
          }
        }}
      />
      <div className="flex h-4 w-4 items-center justify-center rounded border-2 border-gray-400 bg-white transition-colors peer-checked:border-blue-500 dark:bg-gray-800">
        <div
          id="tg-auction-lock-indicator"
          className="h-2 w-2 rounded-sm bg-blue-500"
          style={{ display: "none" }}
        />
      </div>
    </div>
  );

  const statusDiv = <div />;

  const auctionInfoContainer = <div style={{ display: "none" }} className="flex flex-col gap-1" />;

  // 锁定总额复选框容器
  const lockTotalContainer = (
    <div className="flex items-center gap-1" style={{ display: "none" }}>
      <label className="flex cursor-pointer items-center gap-2">
        {checkboxContainer}
        <span className="text-sm opacity-60">锁定总额</span>
      </label>
      <Tooltip content="开启后，修改价格或数量时会自动调整另一个值，保持总额不变" trigger="click">
        <QuestionIcon className="h-3.5 w-3.5 cursor-pointer opacity-60" />
      </Tooltip>
    </div>
  );

  const updateStatus = (msg, type) => {
    if (msg) {
      let className = "rounded-lg px-3 py-2 text-xs ";
      if (type === "success") {
        className += "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      } else if (type === "error") {
        className += "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      } else {
        className += "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      }
      statusDiv.className = className;
      statusDiv.textContent = msg;
      statusDiv.style.display = "block";
    } else {
      statusDiv.style.display = "none";
    }
  };

  /**
   * 处理取消竞拍
   * @returns {Promise<void>}
   */
  const handleCancelAuction = async () => {
    if (!auctionData || !auctionData[0] || !auctionData[0].Id) {
      updateStatus("没有可取消的竞拍", "error");
      return;
    }

    if (!confirm("确定要取消竞拍吗？")) {
      return;
    }

    updateStatus("处理中...", "");

    const result = await cancelAuction(auctionData[0].Id);

    if (result.success) {
      updateStatus("取消竞拍成功", "success");
      // 取消成功后刷新数据
      await loadAuctionList(false);
    } else {
      updateStatus(result.message || "取消竞拍失败", "error");
    }
  };

  /**
   * 处理提交
   * @returns {Promise<void>}
   */
  const handleSubmit = async () => {
    // 验证输入
    if (!price || isNaN(price) || Number(price) <= 0) {
      updateStatus("请输入有效的价格", "error");
      return;
    }

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      updateStatus("请输入有效的数量", "error");
      return;
    }

    updateStatus("处理中...", "");

    const result = await auctionCharacter(characterId, Number(price), Number(amount));

    if (result.success) {
      updateStatus(result.data, "success");
      // 拍卖成功后刷新数据，不显示加载状态以保留成功消息
      await loadAuctionList(false);
    } else {
      updateStatus(result.message, "error");
    }
  };

  /**
   * 加载拍卖列表数据
   * @param {boolean} showLoading - 是否显示加载状态
   * @returns {Promise<void>}
   */
  const loadAuctionList = async (showLoading = true) => {
    if (showLoading) {
      updateStatus("加载中...", "");
    }

    const result = await getAuctionList([characterId]);

    if (result.success) {
      auctionData = result.data;
      if (showLoading) {
        updateStatus("", "");
      }

      // 清空容器
      auctionInfoContainer.innerHTML = "";

      // 获取拍卖数据
      const auction = auctionData && auctionData.length > 0 ? auctionData[0] : null;

      // 竞拍信息区域
      const infoSection = (
        <div className="space-y-2">
          <div className="text-xs font-medium opacity-60">竞拍信息</div>
          <div className="flex gap-2">
            <div className="flex-1 rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
              <div className="text-xs opacity-60">竞拍人数</div>
              <div className="bgm-color text-sm font-medium">
                {formatNumber(auction?.State || 0, 0)}
              </div>
            </div>
            <div className="flex-1 rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
              <div className="text-xs opacity-60">竞拍数量</div>
              <div className="bgm-color text-sm font-medium">
                {formatNumber(auction?.Type || 0, 0)}
              </div>
            </div>
            <div className="flex-1 rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
              <div className="text-xs opacity-60">英灵殿</div>
              <div className="bgm-color text-sm font-medium">{formatNumber(maxAmount || 0, 0)}</div>
            </div>
          </div>
        </div>
      );
      auctionInfoContainer.appendChild(infoSection);

      // 我的出价区域（如果有）
      if (auction && auction.Price != 0) {
        const myInfoSection = (
          <div className="space-y-2">
            <div className="text-xs font-medium opacity-60">我的出价</div>
            <div className="flex gap-2">
              <div className="flex-1 rounded-lg bg-orange-50 p-2 dark:bg-orange-900/20">
                <div className="text-xs opacity-60">价格</div>
                <div className="text-sm font-medium text-orange-600 dark:text-orange-400">
                  {formatCurrency(auction.Price || 0)}
                </div>
              </div>
              <div className="flex-1 rounded-lg bg-orange-50 p-2 dark:bg-orange-900/20">
                <div className="text-xs opacity-60">数量</div>
                <div className="text-sm font-medium text-orange-600 dark:text-orange-400">
                  {formatNumber(auction.Amount || 0, 0)}
                </div>
              </div>
            </div>
          </div>
        );
        auctionInfoContainer.appendChild(myInfoSection);

        // 设置输入框默认值为我的出价和数量
        price = auction.Price;
        amount = auction.Amount;
        priceInput.value = price;
        amountInput.value = amount;
        updateTotal();

        // 设置锁定的总额（基于我的出价）
        lockedTotal = auction.Price * auction.Amount;

        // 显示锁定总额复选框
        lockTotalContainer.style.display = "flex";
      } else {
        // 没有出价时隐藏开关并重置锁定总额
        lockTotalContainer.style.display = "none";
        lockedTotal = 0;
      }

      // 显示容器
      auctionInfoContainer.style.display = "flex";
    } else {
      if (showLoading) {
        updateStatus(result.message, "error");
      }
    }
  };

  statusDiv.style.display = "none";

  // 组件加载时请求数据
  loadAuctionList();

  return (
    <div
      id="tg-auction"
      data-character-id={characterId}
      data-base-price={basePrice}
      className="flex min-w-64 flex-col gap-2"
    >
      {/* 拍卖信息 */}
      {auctionInfoContainer}

      {/* 锁定总额复选框*/}
      {lockTotalContainer}

      {/* 价格输入 */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium opacity-60">价格</label>
        {priceInput}
      </div>

      {/* 数量输入 */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium opacity-60">数量</label>
        {amountInput}
        {quickButtonsDiv}
      </div>

      {/* 合计 */}
      {totalDiv}

      {/* 状态消息 */}
      {statusDiv}

      {/* 提交按钮 */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleCancelAuction}>
          取消竞拍
        </Button>
        <Button onClick={handleSubmit}>竞拍</Button>
      </div>
    </div>
  );
}
