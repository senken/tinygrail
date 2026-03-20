import { auctionCharacter, getAuctionList } from "@src/api/chara.js";
import { Button } from "@src/components/Button.jsx";
import { formatCurrency } from "@src/utils/format";

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

  const totalDiv = (
    <div id="tg-auction-total" className="text-sm opacity-60">
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
        updateTotal();
      }}
      min="0"
      step="1"
    />
  );

  const statusDiv = <div />;

  const auctionInfoContainer = <div style={{ display: "none" }} className="flex flex-col gap-1" />;

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

      // 更新拍卖信息显示
      if (auctionData && auctionData.length > 0) {
        const auction = auctionData[0];

        auctionInfoContainer.innerHTML = "";
        let hasInfo = false;

        // 显示竞拍人数和竞拍数量
        if (auction.State != 0) {
          hasInfo = true;
          const info = (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <span>
                竞拍人数：<span className="bgm-color">{auction.State}</span>
              </span>
              <span className="mx-2">•</span>
              <span>
                竞拍数量：<span className="bgm-color">{auction.Type}</span>
              </span>
            </div>
          );
          auctionInfoContainer.appendChild(info);
        }

        // 显示我的出价和数量
        if (auction.Price != 0) {
          hasInfo = true;
          const myInfo = (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <span>
                出价：<span className="bgm-color">{formatCurrency(auction.Price)}</span>
              </span>
              <span className="mx-2">•</span>
              <span>
                拍卖数量：<span className="bgm-color">{auction.Amount}</span>
              </span>
            </div>
          );
          auctionInfoContainer.appendChild(myInfo);

          // 设置输入框默认值为我的出价和数量
          price = auction.Price;
          amount = auction.Amount;
          priceInput.value = price;
          amountInput.value = amount;
          updateTotal();
        }

        // 只有在有信息时才显示容器
        if (hasInfo) {
          auctionInfoContainer.style.display = "flex";
        }
      }
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
      className="flex min-w-64 flex-col gap-4"
    >
      {/* 拍卖信息 */}
      {auctionInfoContainer}

      {/* 价格输入 */}
      <div className="flex flex-col gap-2">
        <label className="text-sm opacity-40">价格</label>
        {priceInput}
      </div>

      {/* 数量输入 */}
      <div className="flex flex-col gap-2">
        <label className="text-sm opacity-40">数量</label>
        {amountInput}
      </div>

      {/* 合计 */}
      {totalDiv}

      {/* 状态消息 */}
      {statusDiv}

      {/* 提交按钮 */}
      <div className="flex justify-end">
        <Button onClick={handleSubmit}>拍卖</Button>
      </div>
    </div>
  );
}
