import { isGameMaster } from "@src/utils/session.js";
import {
  GavelIcon,
  HistoryIcon,
  ClipboardClockIcon,
  ImageUpIcon,
  RepeatIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
  UndoIcon,
  VoteIcon,
} from "@src/icons";
import { handleVoteKill, handleRevokeVote, handleViewVotes } from "./voteKillHandlers.jsx";

/**
 * 交易盒子按钮组组件
 * @param {Object} props
 * @param {Object} props.tinygrailCharacter - tinygrail的角色数据
 * @param {number} props.characterId - 角色ID
 * @param {boolean} props.canChangeAvatar - 是否可以更换头像
 * @param {boolean} props.isInModal - 是否在弹窗中
 * @param {Array} props.killVotes - 删除投票数据
 * @param {Function} props.onSacrificeClick - 点击资产重组按钮的回调
 * @param {Function} props.onAuctionClick - 点击拍卖按钮的回调
 * @param {Function} props.onAuctionHistoryClick - 点击往期拍卖按钮的回调
 * @param {Function} props.onChangeAvatarClick - 点击更换头像按钮的回调
 * @param {Function} props.onTradeHistoryClick - 点击交易记录按钮的回调
 * @param {Function} props.onGMTradeHistoryClick - 点击GM交易记录按钮的回调
 */
export function TradeBoxHeaderActions(props) {
  const {
    tinygrailCharacter,
    characterId,
    canChangeAvatar,
    isInModal = false,
    killVotes,
    onSacrificeClick,
    onAuctionClick,
    onAuctionHistoryClick,
    onChangeAvatarClick,
    onTradeHistoryClick,
    onGMTradeHistoryClick,
  } = props || {};

  /**
   * 获取箭头按钮的背景渐变样式
   * @returns {string} CSS字符串
   */
  const getBgGradient = () => {
    if (isInModal) {
      // 弹窗模式
      return "linear-gradient(to right, oklch(var(--b1)) 0%, oklch(var(--b1)) 20%, oklch(var(--b1) / 0.8) 50%, oklch(var(--b1) / 0) 100%)";
    }
    // 非弹窗模式
    return "linear-gradient(to right, var(--page-bg, #ffffff) 0%, var(--page-bg, #ffffff) 20%, color-mix(in srgb, var(--page-bg, #ffffff) 80%, transparent) 50%, transparent 100%)";
  };

  const leftGradient = getBgGradient();
  const rightGradient = leftGradient.replace("to right", "to left");

  /**
   * 更新左右箭头按钮的显示状态
   * @param {HTMLElement} container - 滚动容器元素
   */
  const updateArrowsVisibility = (container) => {
    const leftBtn = container.parentElement.querySelector("#tg-scroll-left");
    const rightBtn = container.parentElement.querySelector("#tg-scroll-right");

    if (!leftBtn || !rightBtn) return;

    const threshold = 5; // 容错阈值
    const isAtStart = container.scrollLeft <= threshold;
    const isAtEnd =
      container.scrollLeft + container.clientWidth >= container.scrollWidth - threshold;

    leftBtn.style.display = isAtStart ? "none" : "flex";
    rightBtn.style.display = isAtEnd ? "none" : "flex";

    // 如果内容不需要滚动，隐藏所有箭头
    if (container.scrollWidth <= container.clientWidth) {
      leftBtn.style.display = "none";
      rightBtn.style.display = "none";
    }
  };

  /**
   * 滚动容器到指定方向
   * @param {HTMLElement} container - 滚动容器元素
   * @param {"left" | "right"} direction - 滚动方向
   */
  const scroll = (container, direction) => {
    const scrollAmount = 200;
    const currentScroll = container.scrollLeft;
    const maxScroll = container.scrollWidth - container.clientWidth;

    let targetScroll;
    if (direction === "left") {
      targetScroll = Math.max(0, currentScroll - scrollAmount);
    } else {
      targetScroll = Math.min(maxScroll, currentScroll + scrollAmount);
    }

    container.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    });

    // 等待滚动完成后更新箭头显示
    setTimeout(() => updateArrowsVisibility(container), 300);
  };

  const buttonsContainer = (
    <div
      id="tg-actions-scroll-container"
      className="flex gap-2 overflow-x-auto py-2"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      onScroll={(e) => updateArrowsVisibility(e.target)}
    >
      <button
        id="tg-btn-sacrifice"
        className="btn-bgm btn no-animation btn-xs flex-shrink-0 gap-1"
        onClick={onSacrificeClick}
      >
        <RepeatIcon className="h-3 w-3" />
        资产重组
      </button>
      <div className="join flex-shrink-0">
        <button
          id="tg-btn-auction"
          className="btn-bgm btn join-item no-animation btn-xs gap-1"
          onClick={onAuctionClick}
        >
          <GavelIcon className="h-3 w-3" />
          {tinygrailCharacter?.Amount > 0 ? "参与竞拍" : "萌王投票"}
        </button>
        <button
          id="tg-btn-auction-history"
          className="btn-bgm btn join-item no-animation btn-xs border-l border-l-white/30 dark:border-l-white/20"
          onClick={onAuctionHistoryClick}
          title="往期拍卖"
          aria-label="往期拍卖"
        >
          <HistoryIcon className="h-3 w-3" />
        </button>
      </div>
      {canChangeAvatar && (
        <button
          id="tg-btn-change-avatar"
          className="btn-bgm btn no-animation btn-xs flex-shrink-0 gap-1"
          onClick={onChangeAvatarClick}
        >
          <ImageUpIcon className="h-3 w-3" />
          更换头像
        </button>
      )}
      <button
        id="tg-btn-trade-history"
        className="btn-bgm btn no-animation btn-xs flex-shrink-0 gap-1"
        onClick={onTradeHistoryClick}
      >
        <ClipboardClockIcon className="h-3 w-3" />
        交易记录
      </button>
      {isGameMaster() && (
        <button
          id="tg-btn-gm-trade-history"
          className="btn-bgm btn no-animation btn-xs flex-shrink-0 gap-1"
          onClick={onGMTradeHistoryClick}
        >
          <ClipboardClockIcon className="h-3 w-3" />
          交易记录(gm)
        </button>
      )}
      {isGameMaster() && (
        <div className="join flex-shrink-0">
          <button
            id="tg-btn-vote-kill"
            className="btn-bgm btn join-item no-animation btn-xs gap-1"
            onClick={() => handleVoteKill(characterId)}
          >
            <TrashIcon className="h-3 w-3" />
            投票删除
          </button>
          <button
            id="tg-btn-revoke-vote"
            className="btn-bgm btn join-item no-animation btn-xs border-l border-l-white/30 dark:border-l-white/20"
            onClick={() => handleRevokeVote(characterId)}
            title="撤回投票"
            aria-label="撤回投票"
          >
            <UndoIcon className="h-3 w-3" />
          </button>
        </div>
      )}
      {isGameMaster() && (
        <button
          id="tg-btn-view-votes"
          className="btn-bgm btn no-animation btn-xs flex-shrink-0 gap-1"
          onClick={() => handleViewVotes(killVotes)}
        >
          <VoteIcon className="h-3 w-3" />
          查看投票
        </button>
      )}
    </div>
  );

  const leftButton = (
    <button
      id="tg-scroll-left"
      className="absolute left-0 top-0 z-10 hidden h-full w-20 items-center justify-start pl-2"
      style={{ background: leftGradient }}
      onClick={(e) => {
        const container = e.target
          .closest("#tg-trade-box-header-actions")
          .querySelector("#tg-actions-scroll-container");
        scroll(container, "left");
      }}
      aria-label="向左滚动"
    >
      <ChevronLeftIcon className="h-5 w-5" />
    </button>
  );

  const rightButton = (
    <button
      id="tg-scroll-right"
      className="absolute right-0 top-0 z-10 flex h-full w-20 items-center justify-end pr-2"
      style={{ background: rightGradient }}
      onClick={(e) => {
        const container = e.target
          .closest("#tg-trade-box-header-actions")
          .querySelector("#tg-actions-scroll-container");
        scroll(container, "right");
      }}
      aria-label="向右滚动"
    >
      <ChevronRightIcon className="h-5 w-5" />
    </button>
  );

  const container = (
    <div id="tg-trade-box-header-actions" className="relative">
      {/* 左箭头 */}
      {leftButton}

      {/* 按钮容器 */}
      {buttonsContainer}

      {/* 右箭头 */}
      {rightButton}
    </div>
  );

  // 初始化箭头显示状态
  setTimeout(() => {
    const scrollContainer = container.querySelector("#tg-actions-scroll-container");
    if (scrollContainer) {
      updateArrowsVisibility(scrollContainer);
    }
  }, 100);

  return container;
}
