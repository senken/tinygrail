import {
  checkHolidayBonus,
  claimDailyBonus,
  claimHolidayBonus,
  claimWeeklyBonus,
  getDailyEventCount,
} from "@src/api/event.js";
import { logout } from "@src/api/user.js";
import { Favorite } from "@src/modules/favorite";
import { openUserAssetsLogModal } from "@src/modules/user-assets-log";
import { getUserAssetsWithSync } from "@src/services/userAssetsSync.js";
import { openUserTinygrailModal } from "@src/modules/user-tinygrail";
import { createMountedComponentWithStore } from "@src/utils/createMountedComponentWithStore.js";
import { openAlertModal, openConfirmModal, openModal } from "@src/utils/modalManager.js";
import { showWarning } from "@src/utils/toastManager.jsx";
import { USER_CARD_STORE_KEY } from "./constants.js";
import { UserAssetsFeedback } from "@src/components/UserAssetsFeedback.jsx";
import { openScratchConfirmModal } from "./components/ScratchConfirm.jsx";
import { openShareBonusModal } from "./components/ShareBonusModal.jsx";
import { openTarotModal } from "./components/TarotModal.jsx";
import { UserInfoBox } from "./components/UserInfoBox.jsx";

/**
 * 显示当前用户资产或手动授权和重试入口
 * @returns {HTMLElement} 首页用户区域
 */
export function UserCard() {
  const container = <div id="tg-rakuen-home-user-card" />;

  const { setState } = createMountedComponentWithStore(
    container,
    USER_CARD_STORE_KEY,
    (state, setState) => {
      const {
        authorized,
        name,
        nickname,
        avatar,
        balance,
        assets,
        lastIndex,
        showDaily,
        showWeekly,
        showHoliday,
        holidayName,
        abbreviateBalance = true,
      } = state || {};

      if (authorized == null) {
        return <div />;
      }

      // 授权和加载失败状态沿用首页用户信息的卡片外观
      if (!authorized) {
        return (
          <div className="tg-bg-content tg-border-card my-2 rounded-xl shadow-sm transition-shadow hover:shadow-md">
            <UserAssetsFeedback result={state.assetsError} onRetry={loadUserAssets} />
          </div>
        );
      }

      // 检查Modal是否已存在
      const isModalExist = (modalId) => {
        return (
          modalId &&
          document.querySelector(`#tg-modal[data-modal-id="${modalId}"]`)?.parentNode ===
            document.body
        );
      };

      return (
        <div>
          <UserInfoBox
            name={name}
            nickname={nickname}
            avatar={avatar}
            balance={balance}
            lastIndex={lastIndex}
            showDaily={showDaily}
            showWeekly={showWeekly}
            showHoliday={showHoliday}
            holidayName={holidayName}
            abbreviateBalance={abbreviateBalance}
            onBonus={handleDailyBonus}
            onShareBonus={handleWeeklyBonus}
            onHolidayBonus={handleHolidayBonus}
            onLogout={handleLogout}
            onShareBonusTest={handleShareBonusTest}
            onScratch={handleOpenScratch}
            onAvatarClick={() => {
              openUserTinygrailModal(name);
            }}
            onToggleAbbreviate={() => {
              setState({ abbreviateBalance: !abbreviateBalance });
            }}
            onBalanceLog={() => {
              openUserAssetsLogModal();
            }}
            onFavorite={() => {
              openModal("favorite-modal", {
                title: "收藏夹",
                content: <Favorite />,
              });
            }}
            onTarot={() => {
              openTarotModal();
            }}
          />
        </div>
      );
    },
    {
      initialState: {
        authorized: null,
        abbreviateBalance: true,
      },
      autoRender: true,
    }
  );

  /**
   * 加载当前用户资产，失败时由用户选择授权或重试
   * @returns {Promise<void>} 用户资产加载结束
   */
  const loadUserAssets = async () => {
    const result = await getUserAssetsWithSync();
    if (!result.success) {
      setState({ authorized: false, assetsError: result });
      return;
    }

    // 加载完用户资产后检查节日
    checkHoliday();
  };

  // 检查是否是节日
  const checkHoliday = () => {
    checkHolidayBonus().then((result) => {
      if (result.success && result.data) {
        setState({
          showHoliday: true,
          holidayName: result.data,
        });
      }
    });
  };

  /**
   * 确认退出成功后显示手动授权入口
   * @returns {Promise<void>} 退出确认弹窗已打开
   */
  const handleLogout = async () => {
    openConfirmModal({
      title: "退出登录",
      message: "确定要退出登录吗？",
      confirmText: "退出",
      onConfirm: async () => {
        const result = await logout();
        if (result.success) {
          setState({ authorized: false, assetsError: { unauthorized: true } });
        }
      },
    });
  };

  // 股息预测
  const handleShareBonusTest = () => {
    openShareBonusModal();
  };

  // 领取节日奖励
  const handleHolidayBonus = async () => {
    const result = await claimHolidayBonus();

    if (result.success) {
      openAlertModal({
        title: "节日奖励",
        message: result.data,
      });
      setState({ showHoliday: false });
      loadUserAssets();
    } else {
      showWarning(result.message);
    }
  };

  // 领取每日签到奖励
  const handleDailyBonus = async () => {
    const result = await claimDailyBonus();

    if (result.success) {
      openAlertModal({
        title: "每日签到",
        message: result.data,
      });
      setState({ showDaily: false });
      loadUserAssets();
    } else {
      showWarning(result.message);
    }
  };

  // 领取每周分红
  const handleWeeklyBonus = async () => {
    const result = await claimWeeklyBonus();

    if (result.success) {
      openAlertModal({
        title: "每周分红",
        message: result.data,
      });
      setState({ showWeekly: false });
      loadUserAssets();
    } else {
      showWarning(result.message);
    }
  };

  // 打开刮刮乐弹窗
  const handleOpenScratch = async () => {
    // 获取幻想乡彩票次数
    const result = await getDailyEventCount();
    const count = result.success ? result.data : 0;

    openScratchConfirmModal({
      isLotus: false,
      lotusCount: count,
      onSuccess: loadUserAssets,
    });
  };

  // 组件加载时请求用户资产信息
  loadUserAssets();

  return container;
}
