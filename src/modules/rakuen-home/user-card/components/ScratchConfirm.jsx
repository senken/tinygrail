import { Button } from "@src/components/Button.jsx";
import { formatNumber } from "@src/utils/format.js";

/**
 * 刮刮乐确认框组件
 * @param {Object} props
 * @param {boolean} props.isLotus - 是否为幻想乡彩票
 * @param {number} props.lotusCount - 幻想乡彩票次数
 * @param {Function} props.onConfirm - 确认回调
 * @param {Function} props.onCancel - 取消回调
 */
export function ScratchConfirm({ isLotus = false, lotusCount = 0, onConfirm, onCancel }) {
  let scratchType = isLotus ? "lotus" : "normal";

  const baseTrackClass = "relative inline-block h-6 w-11 rounded-full transition-colors";
  const normalTrackClass = `${baseTrackClass} bg-gray-300 dark:bg-gray-600`;
  const lotusTrackClass = `${baseTrackClass} bgm-bg`;

  const descriptionDiv = (
    <div className="rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
      消费₵1,000购买一张环保刮刮乐彩票？
    </div>
  );

  const switchTrack = <div className={normalTrackClass} />;
  const switchThumb = (
    <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform" />
  );

  switchTrack.appendChild(switchThumb);

  // 设置初始状态
  if (isLotus) {
    scratchType = "lotus";
    switchTrack.className = lotusTrackClass;
    switchThumb.style.transform = "translateX(20px)";
    const price = Math.pow(2, lotusCount) * 2000;
    descriptionDiv.textContent = `消费₵${formatNumber(price, 0)}购买一张幻想乡彩票？`;
  }

  const switchButton = (
    <button
      type="button"
      className="flex items-center gap-2 outline-none"
      onClick={() => {
        scratchType = scratchType === "normal" ? "lotus" : "normal";
        const isLotusType = scratchType === "lotus";

        // 更新开关样式
        if (isLotusType) {
          switchTrack.className = lotusTrackClass;
          switchThumb.style.transform = "translateX(20px)";
          const price = Math.pow(2, lotusCount) * 2000;
          descriptionDiv.textContent = `消费₵${formatNumber(price, 0)}购买一张幻想乡彩票？`;
        } else {
          switchTrack.className = normalTrackClass;
          switchThumb.style.transform = "translateX(0)";
          descriptionDiv.textContent = "消费₵1,000购买一张环保刮刮乐彩票？";
        }
      }}
    >
      {switchTrack}
    </button>
  );

  const confirmButton = (
    <Button
      variant="solid"
      onClick={() => {
        const isLotusType = scratchType === "lotus";
        onConfirm(isLotusType);
      }}
    >
      确定
    </Button>
  );

  return (
    <div id="tg-rakuen-home-scratch-confirm" className="flex min-w-64 flex-col gap-4">
      {/* 类型切换 */}
      <div id="tg-rakuen-home-scratch-confirm-switch" className="flex items-center gap-3">
        {switchButton}
        <span className="text-sm opacity-60">幻想乡</span>
      </div>

      {/* 类型描述 */}
      {descriptionDiv}

      {/* 按钮 */}
      <div id="tg-rakuen-home-scratch-confirm-actions" className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          取消
        </Button>
        {confirmButton}
      </div>
    </div>
  );
}
