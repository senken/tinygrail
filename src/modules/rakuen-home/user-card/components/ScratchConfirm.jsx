import { scratchBonus } from "@src/api/event.js";
import { openScratchCardModal } from "@src/modules/scratch-card";
import { formatNumber } from "@src/utils/format.js";
import { closeModal, openModal } from "@src/utils/modalManager.js";
import { showError } from "@src/utils/toastManager";

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
      <div id="tg-rakuen-home-scratch-confirm-actions" className="flex justify-end gap-2 p-1">
        <button className="btn btn-sm" onClick={onCancel}>
          取消
        </button>
        <button
          className="btn-bgm btn btn-sm"
          onClick={() => {
            const isLotusType = scratchType === "lotus";
            onConfirm(isLotusType);
          }}
        >
          确定
        </button>
      </div>
    </div>
  );
}

/**
 * 打开刮刮乐确认弹窗
 * @param {Object} params
 * @param {boolean} params.isLotus - 是否为幻想乡彩票
 * @param {number} params.lotusCount - 幻想乡彩票次数
 * @param {Function} params.onSuccess - 成功后的回调（用于刷新用户资产）
 */
export function openScratchConfirmModal({ isLotus = false, lotusCount = 0, onSuccess }) {
  const modalId = "scratch-confirm";

  openModal(modalId, {
    title: "彩票抽奖",
    content: (
      <ScratchConfirm
        isLotus={isLotus}
        lotusCount={lotusCount}
        onConfirm={async (isLotusType) => {
          // 调用刮刮乐API
          const result = await scratchBonus(isLotusType);

          if (!result.success) {
            showError(result.message);
            return;
          }

          // 关闭确认弹窗
          closeModal(modalId);

          // 显示刮刮乐结果
          openScratchCardModal({
            charas: result.data,
            title: "彩票抽奖",
          });

          // 确认按钮回调
          if (onSuccess) {
            onSuccess();
          }
        }}
        onCancel={() => {
          closeModal(modalId);
        }}
      />
    ),
    size: "sm",
  });
}
