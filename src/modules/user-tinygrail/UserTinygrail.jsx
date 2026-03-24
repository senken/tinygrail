import { createMountedComponent } from "@src/utils/createMountedComponent.js";
import { getUserAssets, banUser, unbanUser } from "@src/api/user.js";
import { getUserCharaLinks, getUserTemples, getUserCharas, getUserICOs } from "@src/api/chara.js";
import { UserHeader } from "./components/UserHeader.jsx";
import { UserTinygrailTabs } from "./components/UserTinygrailTabs.jsx";
import { RedPacketLog } from "./components/RedPacketLog.jsx";
import { SendRedPacket } from "./components/SendRedPacket.jsx";
import { GMTradeHistory } from "@src/modules/gm-trade-history/GMTradeHistory.jsx";
import { createRequestManager } from "@src/utils/requestManager.js";
import { scrollToTop } from "@src/utils/scroll.js";
import { Modal, closeModalById } from "@src/components/Modal.jsx";
import { CharacterBox } from "@src/modules/character-box/CharacterBox.jsx";
import { TempleDetail } from "@src/modules/temple-detail/TempleDetail.jsx";

/**
 * 用户小圣杯页面组件
 * @param {Object} props - 组件属性
 * @param {string} props.username - 用户名
 * @param {string} props.stickyTop - Tabs粘性定位的top值
 */
export function UserTinygrail(props) {
  const { username, stickyTop = null } = props || {};

  const container = (
    <div id="tg-user-tinygrail" data-username={username} className="user-tinygrail-container" />
  );

  // 创建请求管理器
  const templesRequestManager = createRequestManager();
  const charasRequestManager = createRequestManager();
  const icosRequestManager = createRequestManager();
  const linksRequestManager = createRequestManager();

  // 存储Modal生成的ID
  let generatedCharacterModalId = null;
  let generatedTempleModalId = null;
  let generatedRedPacketLogModalId = null;
  let generatedSendRedPacketModalId = null;
  let generatedTradeHistoryModalId = null;
  let generatedUserModalId = null;

  // 存储用户ID
  let userId = null;

  // 检查Modal是否已存在
  const isModalExist = (modalId) => {
    return (
      modalId &&
      document.querySelector(`#tg-modal[data-modal-id="${modalId}"]`)?.parentNode === document.body
    );
  };

  // 存储当前页数
  let currentLinksPage = 1;
  let currentTemplesPage = 1;
  let currentCharasPage = 1;
  let currentICOsPage = 1;

  const { setState } = createMountedComponent(container, (state) => {
    const {
      id,
      name,
      nickname,
      balance,
      lastIndex,
      assets,
      avatar,
      state: userState,
      activeTab = 0,
      charaLinks,
      temples,
      charas,
      icos,
      showCharacterModal = false,
      characterModalId = null,
      showTempleModal = false,
      templeModalData = null,
      showRedPacketLogModal = false,
      showSendRedPacketModal = false,
      showTradeHistoryModal = false,
      showUserModal = false,
      userModalUsername = null,
      abbreviateBalance = true,
    } = state || {};

    // 更新userId
    if (id) {
      userId = id;
    }

    if (!nickname) {
      return <div className="p-4 text-center">加载中...</div>;
    }

    return (
      <div>
        <UserHeader
          name={name}
          nickname={nickname}
          balance={balance}
          lastIndex={lastIndex}
          assets={assets}
          avatar={avatar}
          state={userState}
          abbreviateBalance={abbreviateBalance}
          onToggleAbbreviate={() => setState({ abbreviateBalance: !abbreviateBalance })}
          onRedPacketLogClick={handleRedPacketLogClick}
          onSendRedPacketClick={handleSendRedPacketClick}
          onTradeHistoryClick={handleTradeHistoryClick}
          onBanClick={handleBanClick}
          onUnbanClick={handleUnbanClick}
        />
        <UserTinygrailTabs
          activeTab={activeTab}
          onTabChange={(index) => {
            setState({ activeTab: index });
            scrollToTop(container);
          }}
          charaLinks={charaLinks}
          temples={temples}
          charas={charas}
          icos={icos}
          onLinksPageChange={handleLinksPageChange}
          onTemplesPageChange={handleTemplesPageChange}
          onCharasPageChange={handleCharasPageChange}
          onICOsPageChange={handleICOsPageChange}
          onCharacterClick={handleCharacterClick}
          onTempleClick={handleTempleClick}
          stickyTop={stickyTop}
        />
        {showCharacterModal && characterModalId && !isModalExist(generatedCharacterModalId) && (
          <Modal
            visible={showCharacterModal}
            onClose={() => setState({ showCharacterModal: false })}
            modalId={generatedCharacterModalId}
            getModalId={(id) => {
              generatedCharacterModalId = id;
            }}
            padding="p-6"
          >
            <CharacterBox characterId={characterModalId} sticky={true} />
          </Modal>
        )}
        {showTempleModal && templeModalData && !isModalExist(generatedTempleModalId) && (
          <Modal
            visible={showTempleModal}
            onClose={() => {
              setState({ showTempleModal: false });
              if (username) {
                loadCharaData(username);
              }
            }}
            position="center"
            maxWidth={1080}
            padding="p-0"
            modalId={generatedTempleModalId}
            getModalId={(id) => {
              generatedTempleModalId = id;
            }}
          >
            <TempleDetail temple={templeModalData} characterName={templeModalData.Name} />
          </Modal>
        )}
        {showRedPacketLogModal && !isModalExist(generatedRedPacketLogModalId) && (
          <Modal
            visible={showRedPacketLogModal}
            onClose={() => setState({ showRedPacketLogModal: false })}
            title={`「${nickname}」的红包记录`}
            position="center"
            maxWidth={672}
            modalId={generatedRedPacketLogModalId}
            getModalId={(id) => {
              generatedRedPacketLogModalId = id;
            }}
          >
            <RedPacketLog username={username} />
          </Modal>
        )}
        {showSendRedPacketModal && !isModalExist(generatedSendRedPacketModalId) && (
          <Modal
            visible={showSendRedPacketModal}
            onClose={closeSendRedPacketModal}
            title={`发送红包给「${nickname}」`}
            position="center"
            maxWidth={480}
            modalId={generatedSendRedPacketModalId}
            getModalId={(id) => {
              generatedSendRedPacketModalId = id;
            }}
          >
            <SendRedPacket
              username={username}
              onSuccess={() => {
                closeSendRedPacketModal();
                if (username) {
                  loadCharaData(username);
                }
              }}
            />
          </Modal>
        )}
        {showTradeHistoryModal && userId && !isModalExist(generatedTradeHistoryModalId) && (
          <Modal
            visible={showTradeHistoryModal}
            onClose={() => setState({ showTradeHistoryModal: false })}
            title={`「${nickname}」的交易记录`}
            position="center"
            maxWidth={480}
            modalId={generatedTradeHistoryModalId}
            getModalId={(id) => {
              generatedTradeHistoryModalId = id;
            }}
          >
            <GMTradeHistory
              userId={userId}
              onUserClick={handleUserClick}
              onCharacterClick={handleCharacterClick}
            />
          </Modal>
        )}
        {showUserModal && userModalUsername && !isModalExist(generatedUserModalId) && (
          <Modal
            visible={showUserModal}
            onClose={() => setState({ showUserModal: false })}
            modalId={generatedUserModalId}
            getModalId={(id) => {
              generatedUserModalId = id;
            }}
          >
            <UserTinygrail username={userModalUsername} stickyTop="-8px" />
          </Modal>
        )}
      </div>
    );
  });

  // 加载用户资产
  const loadUserAssets = () => {
    getUserAssets(username).then((result) => {
      if (!result.success) {
        setState({ nickname: "加载失败" });
        return;
      }

      setState(result.data);
    });
  };

  // 加载角色数据
  const loadCharaData = (name) => {
    Promise.all([
      getUserCharaLinks(name, currentLinksPage),
      getUserTemples(name, currentTemplesPage),
      getUserCharas(name, currentCharasPage),
      getUserICOs(name, currentICOsPage),
    ]).then(([linksResult, templesResult, charasResult, icosResult]) => {
      setState({
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
          setState({ charaLinks: result.data });
          scrollToTop(container);
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
          setState({ temples: result.data });
          scrollToTop(container);
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
          setState({ charas: result.data });
          scrollToTop(container);
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
          setState({ icos: result.data });
          scrollToTop(container);
        }
      }
    );
  };

  // 角色点击处理
  const handleCharacterClick = (characterId) => {
    setState({
      showCharacterModal: true,
      characterModalId: characterId,
    });
  };

  // 圣殿点击处理
  const handleTempleClick = (temple) => {
    setState({
      showTempleModal: true,
      templeModalData: temple,
    });
  };

  // 红包记录点击处理
  const handleRedPacketLogClick = () => {
    setState({ showRedPacketLogModal: true });
  };

  // 发送红包点击处理
  const handleSendRedPacketClick = () => {
    setState({ showSendRedPacketModal: true });
  };

  // 交易记录点击处理
  const handleTradeHistoryClick = () => {
    setState({ showTradeHistoryModal: true });
  };

  // 用户点击处理
  const handleUserClick = (username) => {
    setState({
      showUserModal: true,
      userModalUsername: username,
    });
  };

  // 关闭发送红包Modal
  const closeSendRedPacketModal = () => {
    closeModalById(generatedSendRedPacketModalId);
    setState({ showSendRedPacketModal: false });
  };

  // 封禁用户处理
  const handleBanClick = async () => {
    if (!confirm("封禁之后只有管理员才能解除，确认要封禁用户？")) {
      return;
    }

    const result = await banUser(username);
    if (result.success) {
      alert(result.message);
      loadUserAssets();
    } else {
      alert(result.message);
    }
  };

  // 解封用户处理
  const handleUnbanClick = async () => {
    if (!confirm("确认要解除封禁用户？")) {
      return;
    }

    const result = await unbanUser(username);
    if (result.success) {
      alert(result.message);
      loadUserAssets();
    } else {
      alert(result.message);
    }
  };

  loadUserAssets();
  if (username) {
    loadCharaData(username);
  }

  return container;
}
