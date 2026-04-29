import {
  checkHolidayBonus,
  claimDailyBonus,
  claimHolidayBonus,
  claimWeeklyBonus,
  getDailyEventCount,
} from "@src/api/event.js";
import { getUserAssets, logout } from "@src/api/user.js";
import { Favorite } from "@src/modules/favorite";
import { openUserAssetsLogModal } from "@src/modules/user-assets-log";
import { openUserTinygrailModal } from "@src/modules/user-tinygrail";
import { createMountedComponent } from "@src/utils/createMountedComponent.js";
import { openAlertModal, openConfirmModal, openModal } from "@src/utils/modalManager.js";
import { showWarning } from "@src/utils/toastManager.jsx";
import { LoginBox } from "./components/LoginBox.jsx";
import { openScratchConfirmModal } from "./components/ScratchConfirm.jsx";
import { openShareBonusModal } from "./components/ShareBonusModal.jsx";
import { openTarotModal } from "./components/TarotModal.jsx";
import { UserInfoBox } from "./components/UserInfoBox.jsx";

export function UserCard() {
  const container = <div id="tg-rakuen-home-user-card" />;

  const { setState } = createMountedComponent(container, (state, setState) => {
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

    // 未登录
    if (!authorized) {
      return (
        <LoginBox
          onLogin={() => {
            loadUserAssets();
          }}
        />
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
  });

  // 加载用户资产
  const loadUserAssets = () => {
    getUserAssets().then((result) => {
      if (!result.success) {
        setState({ authorized: false });
        return;
      }

      setState({
        authorized: true,
        ...result.data,
      });

      // 加载完用户资产后检查节日
      checkHoliday();
    });
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

  // 退出登录
  const handleLogout = async () => {
    openConfirmModal({
      title: "退出登录",
      message: "确定要退出登录吗？",
      confirmText: "退出",
      onConfirm: async () => {
        const result = await logout();
        if (result.success) {
          setState({ authorized: false });
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
