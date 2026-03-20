import { createMountedComponent } from "@src/utils/createMountedComponent.js";
import { getUserAssets, logout } from "@src/api/user.js";
import { checkHolidayBonus, claimHolidayBonus, claimDailyBonus, claimWeeklyBonus, getShareBonusTest, getDailyEventCount, scratchBonus } from "@src/api/event.js";
import { formatNumber } from "@src/utils/format.js";
import { UserInfoBox } from "./components/UserInfoBox.jsx";
import { LoginBox } from "./components/LoginBox.jsx";
import { ScratchConfirm } from "./components/ScratchConfirm.jsx";
import { Modal, closeModalById } from "@src/components/Modal.jsx";
import { UserTinygrail } from "@src/modules/user-tinygrail";
import { ScratchCard } from "@src/modules/scratch-card";
import { UserAssetsLog } from "@src/modules/user-assets-log";

export function UserCard() {
  const container = <div id="tg-rakuen-home-user-card" />;

  let generatedScratchModalId = null;
  let generatedScratchResultModalId = null;

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
      showModal,
      showScratchModal = false,
      showScratchResultModal = false,
      showBalanceLogModal = false,
      scratchResultData = null,
      isLotus = false,
      lotusCount = 0,
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
        document.querySelector(`#tg-modal[data-modal-id="${modalId}"]`)?.parentNode === document.body
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
            setState({ showModal: true });
          }}
          onToggleAbbreviate={() => {
            setState({ abbreviateBalance: !abbreviateBalance });
          }}
          onBalanceLog={() => {
            setState({ showBalanceLogModal: true });
          }}
        />

        {showModal && (
          <Modal visible={showModal} onClose={() => setState({ showModal: false })}>
            <UserTinygrail username={name} stickyTop="-16px" />
          </Modal>
        )}

        {showScratchModal && !isModalExist(generatedScratchModalId) && (
          <Modal
            visible={showScratchModal}
            onClose={closeScratchModal}
            title="彩票抽奖"
            position="center"
            maxWidth={400}
            modalId={generatedScratchModalId}
            getModalId={(id) => {
              generatedScratchModalId = id;
            }}
          >
            <ScratchConfirm
              isLotus={isLotus}
              lotusCount={lotusCount}
              onConfirm={handleConfirmScratch}
              onCancel={closeScratchModal}
            />
          </Modal>
        )}

        {showScratchResultModal && scratchResultData && !isModalExist(generatedScratchResultModalId) && (
          <Modal
            visible={showScratchResultModal}
            onClose={closeScratchResultModal}
            title="彩票抽奖"
            position="center"
            maxWidth={800}
            padding=""
            modalId={generatedScratchResultModalId}
            getModalId={(id) => {
              generatedScratchResultModalId = id;
            }}
          >
            <ScratchCard charas={scratchResultData} />
          </Modal>
        )}

        {showBalanceLogModal && (
          <Modal
            visible={showBalanceLogModal}
            onClose={() => setState({ showBalanceLogModal: false })}
            title="交易记录"
            position="center"
            padding="p-4 pt-0"
            maxWidth={960}
          >
            <UserAssetsLog />
          </Modal>
        )}
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
    const result = await logout();
    if (result.success) {
      setState({ authorized: false });
    }
  };

  // 股息预测
  const handleShareBonusTest = async () => {
    const result = await getShareBonusTest();

    if (!result.success) {
      alert(result.message);
      return;
    }

    const { total, temples, daily, share, tax } = result.data;

    if (daily) {
      alert(
        `本期计息股份共${formatNumber(total, 0)}股，圣殿${formatNumber(temples, 0)}座，登录奖励₵${formatNumber(daily, 0)}，预期股息₵${formatNumber(share, 0)}，需缴纳个人所得税₵${formatNumber(tax, 0)}`
      );
    } else {
      alert(
        `本期计息股份共${formatNumber(total, 0)}股，圣殿${formatNumber(temples, 0)}座，预期股息₵${formatNumber(share, 0)}，需缴纳个人所得税₵${formatNumber(tax, 0)}`
      );
    }
  };

  // 领取节日奖励
  const handleHolidayBonus = async () => {
    const result = await claimHolidayBonus();
    
    if (result.success) {
      alert(result.data);
      setState({ showHoliday: false });
      loadUserAssets();
    } else {
      alert(result.message);
    }
  };

  // 领取每日签到奖励
  const handleDailyBonus = async () => {
    const result = await claimDailyBonus();
    
    if (result.success) {
      alert(result.data);
      setState({ showDaily: false });
      loadUserAssets();
    } else {
      alert(result.message);
    }
  };

  // 领取每周分红
  const handleWeeklyBonus = async () => {
    const result = await claimWeeklyBonus();
    
    if (result.success) {
      alert(result.data);
      setState({ showWeekly: false });
      loadUserAssets();
    } else {
      alert(result.message);
    }
  };

  // 打开刮刮乐弹窗
  const handleOpenScratch = async () => {
    // 获取幻想乡彩票次数
    const result = await getDailyEventCount();
    const count = result.success ? result.data : 0;
    
    setState({ 
      showScratchModal: true,
      lotusCount: count,
      isLotus: false
    });
  };

  // 关闭刮刮乐弹窗
  const closeScratchModal = () => {
    closeModalById(generatedScratchModalId);
    setState({ showScratchModal: false });
  };

  // 关闭刮刮乐结果弹窗
  const closeScratchResultModal = () => {
    closeModalById(generatedScratchResultModalId);
    setState({ showScratchResultModal: false, scratchResultData: null });
  };

  // 确认刮刮乐
  const handleConfirmScratch = async (isLotusType) => {
    // 调用刮刮乐API
    const result = await scratchBonus(isLotusType);

    if (!result.success) {
      alert(result.message);
      return;
    }

    // 关闭确认弹窗
    closeScratchModal();

    // 显示刮刮乐结果
    setState({
      showScratchResultModal: true,
      scratchResultData: result.data,
    });

    // 刷新用户资产
    loadUserAssets();
  };

  // 组件加载时请求用户资产信息
  loadUserAssets();

  return container;
}
