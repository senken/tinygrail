import { Fragment } from "@src/utils/jsx-dom.js";
import { createMountedComponent } from "@src/utils/createMountedComponent.js";
import { createRequestManager } from "@src/utils/requestManager.js";
import { formatNumber, getTimeDiff } from "@src/utils/format.js";
import { processImage } from "@src/utils/image.js";
import { getCachedUserAssets } from "@src/utils/session.js";
import {
  getCharacter,
  getCharacterPool,
  getUserCharacter,
  getUserCharacterByUsername,
  getCharacterDepth,
  getCharacterLinks,
  getCharacterTemples,
  getCharacterUsers,
  getICOUsers,
  getUserICOInfo,
  changeCharacterAvatar,
  joinICO,
  initICO,
} from "@src/api/chara.js";
import { getUserAssets } from "@src/api/user.js";
import { getOssSignature, uploadToOss, buildOssUrl } from "@src/api/oss.js";
import { IcoBox } from "./components/IcoBox.jsx";
import { IcoBoxInit } from "./components/IcoBoxInit.jsx";
import { TradeBox } from "./components/TradeBox.jsx";
import { LoaderCircleIcon } from "@src/icons/index.js";
import { Modal } from "@src/components/Modal.jsx";
import { UserTinygrail } from "@src/modules/user-tinygrail/index.js";
import { Sacrifice } from "@src/modules/sacrifice/index.js";
import { Auction } from "@src/modules/auction/index.js";
import { AuctionHistory } from "@src/modules/auction-history/index.js";
import { TradeHistory } from "@src/modules/trade-history/index.js";
import { GMTradeHistory } from "@src/modules/gm-trade-history/GMTradeHistory.jsx";
import { ImageCropper } from "@src/components/ImageCropper.jsx";
import { TempleDetail } from "@src/modules/temple-detail/TempleDetail.jsx";

/**
 * 角色页面组件
 * @param {Object} props
 * @param {number} props.characterId - 角色ID
 * @param {boolean} props.sticky - 是否启用粘性布局
 * @param {number} props.stickyTop - 粘性布局的top值
 */
export function CharacterBox(props) {
  const { characterId, sticky = false, stickyTop = 0 } = props || {};

  const container = <div id="tg-character-box" className="tg-bg-content relative" />;

  // 在外部作用域存储蒙版引用和唯一ID
  let overlayRef = null;
  const instanceId = `overlay-${Math.random().toString(36).substr(2, 9)}`;

  // 存储当前用户列表页数
  let currentUsersPage = 1;
  let currentIcoUsersPage = 1;

  // 创建请求管理器
  const usersRequestManager = createRequestManager();
  const icoUsersRequestManager = createRequestManager();

  // 存储Modal生成的ID
  let generatedUserModalId = null;
  let generatedCharacterModalId = null;
  let generatedSacrificeModalId = null;
  let generatedAuctionModalId = null;
  let generatedAuctionHistoryModalId = null;
  let generatedChangeAvatarModalId = null;
  let generatedTradeHistoryModalId = null;
  let generatedGMTradeHistoryModalId = null;
  let generatedTempleModalId = null;

  // 检查Modal是否已存在
  const isModalExist = (modalId) => {
    return (
      modalId &&
      document.querySelector(`#tg-modal[data-modal-id="${modalId}"]`)?.parentNode === document.body
    );
  };

  // 从 localStorage 读取所有折叠状态
  const getCollapsedStates = () => {
    try {
      const stored = localStorage.getItem("tinygrail:character-box-trade-collapsed-states");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("读取折叠状态失败:", e);
    }
    return {
      link: false,
      section: false,
      temple: false,
      user: false,
    };
  };

  // 保存所有折叠状态到 localStorage
  const saveCollapsedStates = (states) => {
    try {
      localStorage.setItem(
        "tinygrail:character-box-trade-collapsed-states",
        JSON.stringify(states)
      );
    } catch (e) {
      console.warn("保存折叠状态失败:", e);
    }
  };

  const initialCollapsedStates = getCollapsedStates();

  const { setState } = createMountedComponent(container, (state) => {
    const {
      characterData,
      userAssets,
      userCharacter,
      tinygrailCharacter,
      gensokyoCharacter,
      pool,
      depth,
      links,
      temples,
      users,
      fixedAssets,
      icoUsers,
      userIcoInfo,
      loading,
      error,
      showUserModal,
      userModalUsername,
      showCharacterModal,
      characterModalId,
      showSacrificeModal,
      showAuctionModal,
      showAuctionHistoryModal,
      showChangeAvatarModal,
      showTradeHistoryModal,
      showGMTradeHistoryModal,
      showTempleModal,
      templeModalData,
      canChangeAvatar,
      hideDuplicates = true,
      isLinkCollapsed = initialCollapsedStates.link,
      isSectionCollapsed = initialCollapsedStates.section,
      isTempleCollapsed = initialCollapsedStates.temple,
      isUserCollapsed = initialCollapsedStates.user,
    } = state || {};

    if (error) {
      return <div className="p-4 text-center">加载失败</div>;
    }

    // 打开用户Modal
    const openUserModal = (username) => {
      setState({ showUserModal: true, userModalUsername: username });
    };

    // 关闭用户Modal
    const closeUserModal = () => {
      setState({ showUserModal: false });
    };

    // 打开角色Modal
    const openCharacterModal = (characterId) => {
      setState({ showCharacterModal: true, characterModalId: characterId });
    };

    // 关闭角色Modal
    const closeCharacterModal = () => {
      setState({ showCharacterModal: false });
    };

    // 打开资产重组Modal
    const openSacrificeModal = () => {
      setState({ showSacrificeModal: true });
    };

    // 关闭资产重组Modal
    const closeSacrificeModal = () => {
      setState({ showSacrificeModal: false });
      refreshTradeBoxData();
    };

    // 打开拍卖Modal
    const openAuctionModal = () => {
      setState({ showAuctionModal: true });
    };

    // 关闭拍卖Modal
    const closeAuctionModal = () => {
      setState({ showAuctionModal: false });
      refreshTradeBoxData();
    };

    // 打开往期拍卖Modal
    const openAuctionHistoryModal = () => {
      setState({ showAuctionHistoryModal: true });
    };

    // 关闭往期拍卖Modal
    const closeAuctionHistoryModal = () => {
      setState({ showAuctionHistoryModal: false });
    };

    // 打开更换头像Modal
    const openChangeAvatarModal = () => {
      setState({ showChangeAvatarModal: true });
    };

    // 关闭更换头像Modal
    const closeChangeAvatarModal = () => {
      setState({ showChangeAvatarModal: false });
    };

    // 打开交易记录Modal
    const openTradeHistoryModal = () => {
      setState({ showTradeHistoryModal: true });
    };

    // 关闭交易记录Modal
    const closeTradeHistoryModal = () => {
      setState({ showTradeHistoryModal: false });
    };

    // 打开GM交易记录Modal
    const openGMTradeHistoryModal = () => {
      setState({ showGMTradeHistoryModal: true });
    };

    // 关闭GM交易记录Modal
    const closeGMTradeHistoryModal = () => {
      setState({ showGMTradeHistoryModal: false });
    };

    // 打开圣殿Modal
    const openTempleModal = (temple) => {
      setState({ showTempleModal: true, templeModalData: temple });
    };

    // 关闭圣殿Modal
    const closeTempleModal = () => {
      setState({ showTempleModal: false });
      refreshTradeBoxData();
    };

    // 渲染内容
    let content = null;
    if (characterData) {
      if (characterData.Current !== undefined) {
        // 已上市角色，显示交易窗口
        content = (
          <TradeBox
            characterData={characterData}
            userAssets={userAssets}
            userCharacter={userCharacter}
            tinygrailCharacter={tinygrailCharacter}
            gensokyoCharacter={gensokyoCharacter}
            pool={pool}
            depth={depth}
            links={links}
            temples={temples}
            users={users}
            fixedAssets={fixedAssets}
            onRefresh={refreshTradeBoxData}
            setLoading={setLoading}
            loadUsersPage={loadUsersPage}
            openUserModal={openUserModal}
            openCharacterModal={openCharacterModal}
            openSacrificeModal={openSacrificeModal}
            openAuctionModal={openAuctionModal}
            openAuctionHistoryModal={openAuctionHistoryModal}
            openChangeAvatarModal={openChangeAvatarModal}
            openTradeHistoryModal={openTradeHistoryModal}
            openGMTradeHistoryModal={openGMTradeHistoryModal}
            openTempleModal={openTempleModal}
            canChangeAvatar={canChangeAvatar}
            hideDuplicates={hideDuplicates}
            onToggleDuplicates={() => setState({ hideDuplicates: !hideDuplicates })}
            isLinkCollapsed={isLinkCollapsed}
            onToggleLinkCollapse={() => {
              const newValue = !isLinkCollapsed;
              setState({ isLinkCollapsed: newValue });
              const states = getCollapsedStates();
              states.link = newValue;
              saveCollapsedStates(states);
            }}
            isSectionCollapsed={isSectionCollapsed}
            onToggleSectionCollapse={() => {
              const newValue = !isSectionCollapsed;
              setState({ isSectionCollapsed: newValue });
              const states = getCollapsedStates();
              states.section = newValue;
              saveCollapsedStates(states);
            }}
            isTempleCollapsed={isTempleCollapsed}
            onToggleTempleCollapse={() => {
              const newValue = !isTempleCollapsed;
              setState({ isTempleCollapsed: newValue });
              const states = getCollapsedStates();
              states.temple = newValue;
              saveCollapsedStates(states);
            }}
            isUserCollapsed={isUserCollapsed}
            onToggleUserCollapse={() => {
              const newValue = !isUserCollapsed;
              setState({ isUserCollapsed: newValue });
              const states = getCollapsedStates();
              states.user = newValue;
              saveCollapsedStates(states);
            }}
            sticky={sticky}
            stickyTop={stickyTop}
          />
        );
      } else {
        // 显示ICO窗口
        content = (
          <IcoBox
            data={characterData}
            userAssets={userAssets}
            icoUsers={icoUsers}
            userIcoInfo={userIcoInfo}
            loadIcoUsersPage={(page) => loadIcoUsersPage(page, characterData.Id)}
            openUserModal={openUserModal}
            onInvest={(amount) => handleIcoInvest(amount, characterData.Id)}
            sticky={sticky}
            stickyTop={stickyTop}
          />
        );
      }
    } else if (userAssets) {
      // 角色未上市，渲染启动ICO组件
      content = (
        <IcoBoxInit
          characterId={characterId}
          userAssets={userAssets}
          onInit={(amount) => handleInitICO(amount)}
        />
      );
    }

    // 创建蒙版元素并动态设置位置
    const createOverlay = () => {
      // 先清理自己的旧蒙版
      const oldOverlay = document.querySelector(`.loading-overlay[data-instance="${instanceId}"]`);
      if (oldOverlay && oldOverlay.parentNode) {
        oldOverlay.parentNode.removeChild(oldOverlay);
      }

      const overlay = (
        <div
          className="loading-overlay absolute inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm dark:bg-black/30"
          data-instance={instanceId}
        >
          <LoaderCircleIcon className="tg-spin h-8 w-8 text-gray-600 dark:text-white" />
        </div>
      );

      // 保存引用
      overlayRef = overlay;

      // 延迟检测是否在Modal中
      setTimeout(() => {
        // 找到离自己最近的 Modal
        const modalElement = overlay.closest("#tg-modal");
        if (modalElement) {
          // 将蒙版移动到Modal的内容区域
          const modalContent = modalElement.querySelector("#tg-modal-content");
          if (modalContent && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
            modalContent.appendChild(overlay);
          }
        }
      }, 0);

      return overlay;
    };

    // 清理蒙版
    if (!loading && overlayRef) {
      setTimeout(() => {
        // 只清理自己的蒙版
        const overlay = document.querySelector(`.loading-overlay[data-instance="${instanceId}"]`);
        if (overlay && overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        overlayRef = null;
      }, 0);
    }

    return (
      <>
        <div className="relative min-h-[200px]">
          {content}
          {/* 全局加载蒙版 */}
          {loading && createOverlay()}
        </div>
        {/* 用户信息Modal */}
        {showUserModal && userModalUsername && !isModalExist(generatedUserModalId) && (
          <Modal
            visible={showUserModal}
            onClose={closeUserModal}
            modalId={generatedUserModalId}
            getModalId={(id) => {
              generatedUserModalId = id;
            }}
          >
            <UserTinygrail username={userModalUsername} stickyTop="-8px" />
          </Modal>
        )}
        {/* 角色信息Modal */}
        {showCharacterModal && characterModalId && !isModalExist(generatedCharacterModalId) && (
          <Modal
            visible={showCharacterModal}
            onClose={closeCharacterModal}
            modalId={generatedCharacterModalId}
            getModalId={(id) => {
              generatedCharacterModalId = id;
            }}
            padding="p-6"
          >
            <CharacterBox characterId={characterModalId} sticky={true} />
          </Modal>
        )}
        {/* 资产重组Modal */}
        {showSacrificeModal && !isModalExist(generatedSacrificeModalId) && (
          <Modal
            visible={showSacrificeModal}
            onClose={closeSacrificeModal}
            title={`资产重组 - #${characterData?.CharacterId ?? ""}「${characterData?.Name ?? ""}」`}
            position="center"
            maxWidth={480}
            modalId={generatedSacrificeModalId}
            getModalId={(id) => {
              generatedSacrificeModalId = id;
            }}
          >
            <Sacrifice characterId={characterId} availableAmount={userCharacter?.Amount ?? 0} />
          </Modal>
        )}
        {/* 拍卖Modal */}
        {showAuctionModal && !isModalExist(generatedAuctionModalId) && (
          <Modal
            visible={showAuctionModal}
            onClose={closeAuctionModal}
            title={`拍卖 - #${characterData?.CharacterId ?? ""}「${characterData?.Name ?? ""}」`}
            position="center"
            maxWidth={480}
            modalId={generatedAuctionModalId}
            getModalId={(id) => {
              generatedAuctionModalId = id;
            }}
          >
            <Auction
              characterId={characterId}
              basePrice={tinygrailCharacter?.Price ?? 0}
              maxAmount={tinygrailCharacter?.Total ?? 0}
            />
          </Modal>
        )}
        {/* 往期拍卖Modal */}
        {showAuctionHistoryModal && !isModalExist(generatedAuctionHistoryModalId) && (
          <Modal
            visible={showAuctionHistoryModal}
            onClose={closeAuctionHistoryModal}
            title={`往期拍卖 - #${characterData?.CharacterId ?? ""}「${characterData?.Name ?? ""}」`}
            position="center"
            maxWidth={800}
            modalId={generatedAuctionHistoryModalId}
            getModalId={(id) => {
              generatedAuctionHistoryModalId = id;
            }}
          >
            <AuctionHistory characterId={characterId} />
          </Modal>
        )}
        {/* 更换头像Modal */}
        {showChangeAvatarModal && !isModalExist(generatedChangeAvatarModalId) && (
          <Modal
            visible={showChangeAvatarModal}
            onClose={closeChangeAvatarModal}
            title={`更换头像 - #${characterData?.CharacterId ?? ""}「${characterData?.Name ?? ""}」`}
            position="center"
            maxWidth={800}
            modalId={generatedChangeAvatarModalId}
            getModalId={(id) => {
              generatedChangeAvatarModalId = id;
            }}
          >
            <ImageCropper
              onCrop={async (blob, dataUrl) => {
                try {
                  // 处理图片
                  const { hash, blob: resizedBlob } = await processImage(dataUrl, 256);

                  // 构建OSSURL
                  const ossUrl = buildOssUrl("avatar", hash, "jpg");

                  // 获取OSS签名
                  const signatureResult = await getOssSignature(
                    "avatar",
                    hash,
                    encodeURIComponent("image/jpeg")
                  );
                  if (!signatureResult.success) {
                    alert(signatureResult.message || "获取签名失败");
                    return;
                  }

                  // 上传到OSS
                  const uploadResult = await uploadToOss(ossUrl, resizedBlob, signatureResult.data);
                  if (!uploadResult.success) {
                    alert(uploadResult.message || "上传失败");
                    return;
                  }

                  // 更新角色头像
                  const changeResult = await changeCharacterAvatar(characterId, ossUrl);
                  if (!changeResult.success) {
                    alert(changeResult.message || "更换头像失败");
                    return;
                  }

                  alert("更换头像成功");
                  closeChangeAvatarModal();

                  // 刷新页面数据
                  await refreshTradeBoxData();
                } catch (error) {
                  console.error("更换头像失败:", error);
                  alert("更换头像失败");
                }
              }}
            />
          </Modal>
        )}
        {/* 交易记录Modal */}
        {showTradeHistoryModal && !isModalExist(generatedTradeHistoryModalId) && (
          <Modal
            visible={showTradeHistoryModal}
            onClose={closeTradeHistoryModal}
            title={`交易记录 - #${characterData?.CharacterId ?? ""}「${characterData?.Name ?? ""}」`}
            position="center"
            maxWidth={800}
            modalId={generatedTradeHistoryModalId}
            getModalId={(id) => {
              generatedTradeHistoryModalId = id;
            }}
          >
            <TradeHistory characterId={characterId} />
          </Modal>
        )}
        {/* GM交易记录Modal */}
        {showGMTradeHistoryModal && !isModalExist(generatedGMTradeHistoryModalId) && (
          <Modal
            visible={showGMTradeHistoryModal}
            onClose={closeGMTradeHistoryModal}
            title={`交易记录(GM) - #${characterData?.CharacterId ?? ""}「${characterData?.Name ?? ""}」`}
            position="center"
            maxWidth={480}
            modalId={generatedGMTradeHistoryModalId}
            getModalId={(id) => {
              generatedGMTradeHistoryModalId = id;
            }}
          >
            <GMTradeHistory
              characterId={characterId}
              onUserClick={openUserModal}
              onCharacterClick={openCharacterModal}
            />
          </Modal>
        )}
        {/* 圣殿Modal */}
        {showTempleModal && templeModalData && !isModalExist(generatedTempleModalId) && (
          <Modal
            visible={showTempleModal}
            onClose={closeTempleModal}
            position="top"
            maxWidth={1080}
            padding="p-0"
            scrollMode="outside"
            modalId={generatedTempleModalId}
            getModalId={(id) => {
              generatedTempleModalId = id;
            }}
          >
            <TempleDetail temple={templeModalData} characterName={characterData?.Name ?? ""} />
          </Modal>
        )}
      </>
    );
  });

  // 设置加载状态
  const setLoading = (isLoading) => {
    setState({ loading: isLoading });
  };

  // 加载角色和用户资产数据
  const loadCharacterAndUserData = async () => {
    const [characterResult, userAssetsResult] = await Promise.all([
      getCharacter(characterId),
      getUserAssets(),
    ]);

    return { characterResult, userAssetsResult };
  };

  // 更新角色和用户资产数据
  const updateCharacterAndUserData = async () => {
    const { characterResult, userAssetsResult } = await loadCharacterAndUserData();

    if (characterResult.success && userAssetsResult.success) {
      setState({
        characterData: characterResult.data,
        userAssets: userAssetsResult.data,
      });
      return true;
    }
    return false;
  };

  // 加载初始数据
  const loadInitialData = async () => {
    setState({ loading: true });

    const { characterResult, userAssetsResult } = await loadCharacterAndUserData();

    // 如果用户资产加载失败，显示错误
    if (!userAssetsResult.success) {
      setState({ loading: false, error: true });
      return;
    }

    // 如果查询不到角色数据，显示启动ICO界面
    if (!characterResult.success) {
      setState({
        loading: false,
        characterData: null,
        userAssets: userAssetsResult.data,
      });
      return;
    }

    setState({
      characterData: characterResult.data,
      userAssets: userAssetsResult.data,
    });

    // 已上市角色，加载TradeBox数据
    if (characterResult.data?.Current !== undefined) {
      await loadTradeBoxData();
    } else {
      // ICO角色，加载IcoBox数据
      await loadIcoBoxData(characterResult.data.Id);
    }

    // 所有数据加载完成后结束loading状态
    setState({ loading: false });
  };

  // 加载TradeBox组件数据
  const loadTradeBoxData = async () => {
    const [
      poolResult,
      userCharacterResult,
      tinygrailCharacterResult,
      gensokyoCharacterResult,
      depthResult,
      linksResult,
      templesResult,
      usersResult,
      topTenUsersResult,
    ] = await Promise.all([
      getCharacterPool(characterId),
      getUserCharacter(characterId),
      getUserCharacterByUsername(characterId, "tinygrail"),
      getUserCharacterByUsername(characterId, "blueleaf"),
      getCharacterDepth(characterId),
      getCharacterLinks(characterId),
      getCharacterTemples(characterId),
      getCharacterUsers(characterId, currentUsersPage),
      getCharacterUsers(characterId, 1, 10), // 获取前10名用户用于判断权限
    ]);

    // 判断当前用户是否可以更换头像和计算固定资产
    let canChangeAvatar = false;
    let fixedAssets = "0";

    // 从缓存中获取当前用户资产
    const userAssets = getCachedUserAssets();

    if (topTenUsersResult.success && topTenUsersResult.data?.Items && userAssets) {
      const currentUserId = userAssets.id;
      const currentUserName = userAssets.name;

      // 神秘的702用户(641)永远可以更换头像
      if (currentUserId === 702) {
        canChangeAvatar = true;
      } else {
        const topTenUsers = topTenUsersResult.data.Items;

        // 检查当前用户是否在前10名中
        const currentUserIndex = topTenUsers.findIndex((user) => user.Name === currentUserName);

        if (currentUserIndex !== -1) {
          // 获取主席
          const chairman = topTenUsers[0];
          const timeDiff = getTimeDiff(chairman.LastActiveDate);
          const chairmanActive = timeDiff < 1000 * 60 * 60 * 24 * 5 && chairman.State !== 666;

          // 如果主席活跃，只有主席可以更换头像
          if (chairmanActive) {
            canChangeAvatar = currentUserIndex === 0;
          } else {
            // 如果主席不活跃，前2-10名都可以更换头像
            canChangeAvatar = currentUserIndex > 0;
          }
        }
      }
    }

    // 计算固定资产
    if (userAssets && userAssets.name) {
      const userName = userAssets.name;

      // 从links中查找
      let foundData = null;
      if (linksResult.success && linksResult.data) {
        foundData = linksResult.data.find((link) => link.Name === userName);
      }

      // 从temples中查找
      if (!foundData && templesResult.success && templesResult.data) {
        foundData = templesResult.data.find((temple) => temple.Name === userName);
      }

      // 格式化固定资产
      if (foundData) {
        fixedAssets = `${formatNumber(foundData.Assets ?? 0, 0)} / ${formatNumber(foundData.Sacrifices ?? 0, 0)}`;
      }
    }

    setState({
      pool: poolResult.success ? poolResult.data : null,
      userCharacter: userCharacterResult.success ? userCharacterResult.data : null,
      tinygrailCharacter: tinygrailCharacterResult.success ? tinygrailCharacterResult.data : null,
      gensokyoCharacter: gensokyoCharacterResult.success ? gensokyoCharacterResult.data : null,
      depth: depthResult.success ? depthResult.data : null,
      links: linksResult.success ? linksResult.data : null,
      temples: templesResult.success ? templesResult.data : null,
      users: usersResult.success ? usersResult.data : null,
      canChangeAvatar,
      fixedAssets,
    });
  };

  // 加载指定页的持股用户数据
  const loadUsersPage = (page) => {
    currentUsersPage = page; // 存储当前页数
    usersRequestManager.execute(
      () => getCharacterUsers(characterId, page),
      (result) => {
        if (result.success) {
          setState({ users: result.data });
        }
      }
    );
  };

  // 加载IcoBox组件数据
  const loadIcoBoxData = async (icoId) => {
    const [icoUsersResult, userIcoInfoResult] = await Promise.all([
      getICOUsers(icoId, currentIcoUsersPage),
      getUserICOInfo(icoId),
    ]);

    setState({
      icoUsers: icoUsersResult.success ? icoUsersResult.data : null,
      userIcoInfo: userIcoInfoResult.success ? userIcoInfoResult.data : null,
    });
  };

  // 加载指定页的ICO参与者数据
  const loadIcoUsersPage = (page, icoId) => {
    currentIcoUsersPage = page; // 存储当前页数
    icoUsersRequestManager.execute(
      () => getICOUsers(icoId, page),
      (result) => {
        if (result.success) {
          setState({ icoUsers: result.data });
        }
      }
    );
  };

  // 刷新TradeBox组件数据
  const refreshTradeBoxData = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }
    await updateCharacterAndUserData();
    await loadTradeBoxData();
    if (showLoading) {
      setLoading(false);
    }
  };

  // 刷新IcoBox组件数据
  const refreshIcoBoxData = async (icoId) => {
    await updateCharacterAndUserData();
    await loadIcoBoxData(icoId);
  };

  // 处理ICO注资
  const handleIcoInvest = async (amount, icoId) => {
    const result = await joinICO(icoId, amount);

    if (result.success) {
      alert("注资成功");
      await refreshIcoBoxData(icoId);
    } else {
      alert(result.message || "注资失败");
    }
  };

  // 处理启动ICO
  const handleInitICO = async (amount) => {
    const result = await initICO(characterId, amount);

    if (result.success) {
      alert("ICO启动成功，邀请更多朋友加入吧。");
      // 重新加载初始数据
      await loadInitialData();
    } else {
      alert(result.message || "启动ICO失败");
    }
  };

  if (characterId) {
    loadInitialData();
  }

  return container;
}
