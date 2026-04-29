import { getUserCharaLinks, getUserCharas, getUserICOs, getUserTemples } from "@src/api/chara.js";
import { banUser, getUserAssets, unbanUser } from "@src/api/user.js";
import { openCharacterBoxModal } from "@src/modules/character-box/utils/modalOpeners.jsx";
import { GMTradeHistory } from "@src/modules/gm-trade-history/GMTradeHistory.jsx";
import { TempleDetail } from "@src/modules/temple-detail/TempleDetail.jsx";
import { createMountedComponent } from "@src/utils/createMountedComponent.js";
import { closeModal, openConfirmModal, openModal } from "@src/utils/modalManager.js";
import { createRequestManager } from "@src/utils/requestManager.js";
import { scrollToTop } from "@src/utils/scroll.js";
import { showError, showSuccess } from "@src/utils/toastManager.jsx";
import { openRedPacketLogModal } from "./components/RedPacketLog.jsx";
import { openSendRedPacketModal } from "./components/SendRedPacket.jsx";
import { UserCharasTab } from "./components/UserCharasTab.jsx";
import { UserICOsTab } from "./components/UserICOsTab.jsx";
import { UserLinksTab } from "./components/UserLinksTab.jsx";
import { UserTemplesTab } from "./components/UserTemplesTab.jsx";
import { UserTinygrailHeader } from "./components/UserTinygrailHeader.jsx";
import { UserTinygrailTabs } from "./components/UserTinygrailTabs.jsx";

/**
 * 创建用户小圣杯组件
 * @param {Object} options
 * @param {string} options.username - 用户名
 * @param {string} options.stickyTop - 粘性定位的top值
 * @param {string} options.modalId - 弹窗ID
 * @param {string} options.bgClassName - 背景色类名
 * @returns {Object} { title: HTMLElement, content: HTMLElement }
 */
function createUserTinygrailModal({ username, stickyTop = null, modalId = null, bgClassName = "" }) {
  // 创建标题容器
  const titleContainer = <div />;

  // 创建内容容器
  const contentContainer = <div />;

  // 创建请求管理器
  const templesRequestManager = createRequestManager();
  const charasRequestManager = createRequestManager();
  const icosRequestManager = createRequestManager();
  const linksRequestManager = createRequestManager();

  // 存储用户ID
  let userId = null;

  // 存储当前页数
  let currentLinksPage = 1;
  let currentTemplesPage = 1;
  let currentCharasPage = 1;
  let currentICOsPage = 1;

  // 交易记录点击处理
  const handleTradeHistoryClick = (nickname) => {
    openModal(`trade-history-${username}`, {
      title: `「${nickname}」的交易记录`,
      content: (
        <GMTradeHistory
          userId={userId}
          onUserClick={(clickedUsername) => {
            openUserTinygrailModal(clickedUsername);
          }}
          onCharacterClick={openCharacterBoxModal}
        />
      ),
    });
  };

  // 封禁用户点击处理
  const handleBanClick = () => {
    openConfirmModal({
      title: "封禁用户",
      message: "封禁之后只有管理员才能解除，确认要封禁用户？",
      confirmText: "封禁",
      onConfirm: async () => {
        const result = await banUser(username);
        if (result.success) {
          showSuccess(result.message);
          loadUserAssets();
        } else {
          showError(result.message);
        }
      },
    });
  };

  // 解封用户点击处理
  const handleUnbanClick = () => {
    openConfirmModal({
      title: "解封用户",
      message: "确认要解除封禁用户？",
      confirmText: "解封",
      onConfirm: async () => {
        const result = await unbanUser(username);
        if (result.success) {
          showSuccess(result.message);
          loadUserAssets();
        } else {
          showError(result.message);
        }
      },
    });
  };

  // 创建标题组件状态管理
  const { setState: setTitleState } = createMountedComponent(titleContainer, (state) => {
    const { name, nickname, balance, lastIndex, assets, avatar, state: userState } = state || {};

    if (!nickname) {
      return <div />;
    }

    return (
      <UserTinygrailHeader
        name={name}
        nickname={nickname}
        balance={balance}
        lastIndex={lastIndex}
        assets={assets}
        avatar={avatar}
        state={userState}
        bgClassName={bgClassName}
        onRedPacketLogClick={() => openRedPacketLogModal({ username, nickname })}
        onSendRedPacketClick={() =>
          openSendRedPacketModal({
            username,
            nickname,
            onSuccess: () => {
              loadUserAssets();
            },
          })
        }
        onTradeHistoryClick={() => handleTradeHistoryClick(nickname)}
        onBanClick={handleBanClick}
        onUnbanClick={handleUnbanClick}
      />
    );
  });

  // 创建内容组件状态管理
  const { setState: setContentState } = createMountedComponent(contentContainer, (state) => {
    const { activeTab = 0, charaLinks, temples, charas, icos } = state || {};

    // 打开圣殿详情弹窗
    const handleTempleClick = (temple) => {
      openModal(`temple-${temple.Id}`, {
        content: <TempleDetail temple={temple} characterName={temple.Name} />,
        borderless: true,
        showCloseButton: true,
        position: "middle",
        onClose: () => {
          loadCharaData();
        },
      });
    };

    // 构建tabs配置
    const tabConfigs = [
      {
        condition: charaLinks && charaLinks.totalItems > 0,
        label: `${charaLinks?.totalItems || 0}组连接`,
        content: (
          <UserLinksTab
            data={charaLinks}
            onPageChange={handleLinksPageChange}
            onCharacterClick={openCharacterBoxModal}
            onTempleClick={handleTempleClick}
          />
        ),
      },
      {
        condition: temples,
        label: `${temples?.totalItems || 0}座圣殿`,
        content: (
          <UserTemplesTab
            data={temples}
            onPageChange={handleTemplesPageChange}
            onCharacterClick={openCharacterBoxModal}
            onTempleClick={handleTempleClick}
          />
        ),
      },
      {
        condition: charas,
        label: `${charas?.totalItems || 0}个人物`,
        content: (
          <UserCharasTab
            data={charas}
            onPageChange={handleCharasPageChange}
            onCharacterClick={openCharacterBoxModal}
          />
        ),
      },
      {
        condition: icos,
        label: `${icos?.totalItems || 0}个ICO`,
        content: (
          <UserICOsTab
            data={icos}
            onPageChange={handleICOsPageChange}
            onCharacterClick={openCharacterBoxModal}
          />
        ),
      },
    ];

    // 过滤出需要显示的tabs
    const tabs = tabConfigs
      .filter((config) => config.condition)
      .map(({ label, content }) => ({ label, content }));

    return (
      <UserTinygrailTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(index) => {
          setContentState({ activeTab: index });
          scrollToTop(contentContainer);
        }}
        stickyTop={stickyTop}
        bgClassName={bgClassName}
      />
    );
  });

  // 加载用户资产
  const loadUserAssets = () => {
    getUserAssets(username).then((result) => {
      if (!result.success) {
        if (modalId) {
          closeModal(modalId);
        }
        showError("加载用户信息失败");
        return;
      }

      userId = result.data.id;
      setTitleState(result.data);
    });
  };

  // 加载角色数据
  const loadCharaData = () => {
    Promise.all([
      getUserCharaLinks(username, currentLinksPage),
      getUserTemples(username, currentTemplesPage),
      getUserCharas(username, currentCharasPage),
      getUserICOs(username, currentICOsPage),
    ]).then(([linksResult, templesResult, charasResult, icosResult]) => {
      setContentState({
        charaLinks: linksResult.success ? linksResult.data : null,
        temples: templesResult.success ? templesResult.data : null,
        charas: charasResult.success ? charasResult.data : null,
        icos: icosResult.success ? icosResult.data : null,
      });
    });
  };

  // 连接分页变化处理
  const handleLinksPageChange = (page) => {
    currentLinksPage = page;
    linksRequestManager.execute(
      () => getUserCharaLinks(username, page),
      (result) => {
        if (result.success) {
          setContentState({ charaLinks: result.data });
          scrollToTop(contentContainer);
        }
      }
    );
  };

  // 圣殿分页变化处理
  const handleTemplesPageChange = (page) => {
    currentTemplesPage = page;
    templesRequestManager.execute(
      () => getUserTemples(username, page),
      (result) => {
        if (result.success) {
          setContentState({ temples: result.data });
          scrollToTop(contentContainer);
        }
      }
    );
  };

  // 角色分页变化处理
  const handleCharasPageChange = (page) => {
    currentCharasPage = page;
    charasRequestManager.execute(
      () => getUserCharas(username, page),
      (result) => {
        if (result.success) {
          setContentState({ charas: result.data });
          scrollToTop(contentContainer);
        }
      }
    );
  };

  // ICO分页变化处理
  const handleICOsPageChange = (page) => {
    currentICOsPage = page;
    icosRequestManager.execute(
      () => getUserICOs(username, page),
      (result) => {
        if (result.success) {
          setContentState({ icos: result.data });
          scrollToTop(contentContainer);
        }
      }
    );
  };

  // 加载数据
  loadUserAssets();
  loadCharaData();

  return {
    title: titleContainer,
    content: contentContainer,
  };
}

/**
 * 用户小圣杯组件
 * @param {Object} props
 * @param {string} props.username - 用户名
 * @param {string} props.stickyTop - 粘性定位的top值
 * @returns {HTMLElement} 完整的组件容器
 */
export function UserTinygrail(props) {
  const { username, stickyTop = null } = props || {};

  const { title, content } = createUserTinygrailModal({
    username,
    stickyTop,
    modalId: null,
  });

  const container = (
    <div id="tg-user-tinygrail" data-username={username}>
      {title}
      {content}
    </div>
  );

  return container;
}

/**
 * 打开用户小圣杯弹窗
 * @param {string} username - 用户名
 */
export function openUserTinygrailModal(username) {
  if (!username) {
    showError("用户名不能为空");
    return;
  }

  const modalId = `user-tinygrail-modal-${username}`;

  const { title, content } = createUserTinygrailModal({
    username,
    stickyTop: "0",
    modalId,
    bgClassName: "bg-base-100",
  });

  // 打开弹窗
  openModal(modalId, {
    title,
    content,
    contentClassName: "pt-0",
    size: "xl",
    modalBoxProps: {
      id: "tg-user-tinygrail",
      dataset: {
        username: username.toString(),
      },
    },
  });
}
