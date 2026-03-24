import { cancelAuction, getAsksList, getAuctionList, getBidsList } from "@src/api/chara.js";
import { getUserAuctions, getUserBalanceLog } from "@src/api/user.js";
import { Modal } from "@src/components/Modal.jsx";
import { Tabs } from "@src/components/Tabs.jsx";
import { CharacterBox } from "@src/modules/character-box/CharacterBox.jsx";
import { createMountedComponent } from "@src/utils/createMountedComponent.js";
import { createRequestManager } from "@src/utils/requestManager.js";
import { scrollToTop } from "@src/utils/scroll.js";
import { BalanceLog } from "./components/BalanceLog.jsx";
import { MyAsks } from "./components/MyAsks.jsx";
import { MyAuctions } from "./components/MyAuctions.jsx";
import { MyBids } from "./components/MyBids.jsx";

/**
 * 用户资产记录组件
 */
export function UserAssetsLog() {
  const container = <div id="tg-user-assets-log" className="mx-auto max-w-4xl" />;

  // 创建请求管理器
  const balanceLogRequestManager = createRequestManager();
  const myAuctionsRequestManager = createRequestManager();
  const myBidsRequestManager = createRequestManager();
  const myAsksRequestManager = createRequestManager();

  // 存储当前页数
  let currentBalanceLogPage = 1;
  let currentMyAuctionsPage = 1;
  let currentMyBidsPage = 1;
  let currentMyAsksPage = 1;

  // 存储Modal生成的ID
  let generatedCharacterModalId = null;

  // 检查Modal是否已存在
  const isModalExist = (modalId) => {
    return (
      modalId &&
      document.querySelector(`#tg-modal[data-modal-id="${modalId}"]`)?.parentNode === document.body
    );
  };

  /**
   * 加载我的拍卖数据
   * @param {number} page - 页码
   * @returns {Promise<Object>} 拍卖数据
   */
  const loadMyAuctionsData = async (page) => {
    const auctionsResult = await getUserAuctions(page, 50);

    if (auctionsResult.success && auctionsResult.data.items.length > 0) {
      // 获取所有角色ID
      const characterIds = auctionsResult.data.items.map((item) => item.CharacterId);

      // 批量获取拍卖详情
      const auctionDetailsResult = await getAuctionList(characterIds);

      // 创建映射表
      const auctionMap = {};

      if (auctionDetailsResult.success) {
        auctionDetailsResult.data.forEach((auction) => {
          auctionMap[auction.CharacterId] = auction;
        });
      }

      // 合并数据
      auctionsResult.data.items = auctionsResult.data.items.map((item) => ({
        ...item,
        auctionDetail: auctionMap[item.CharacterId] || null,
      }));
    }

    return auctionsResult;
  };

  const { setState } = createMountedComponent(
    container,
    (state) => {
      const {
        activeTab = 0,
        balanceLogData = null,
        myAuctionsData = null,
        myBidsData = null,
        myAsksData = null,
        showCharacterModal = false,
        characterModalId = null,
      } = state || {};

      /**
       * 资金日志分页变化处理
       * @param {number} page - 页码
       */
      const handleBalanceLogPageChange = async (page) => {
        currentBalanceLogPage = page;
        balanceLogRequestManager.execute(
          async () => {
            return await getUserBalanceLog(page, 50);
          },
          (result) => {
            if (result.success) {
              setState({ balanceLogData: result.data });
              scrollToTop(container);
            }
          }
        );
      };

      /**
       * 我的拍卖分页变化处理
       * @param {number} page - 页码
       */
      const handleMyAuctionsPageChange = async (page) => {
        currentMyAuctionsPage = page;
        myAuctionsRequestManager.execute(
          async () => {
            return await loadMyAuctionsData(page);
          },
          (result) => {
            if (result.success) {
              setState({ myAuctionsData: result.data });
              scrollToTop(container);
            }
          }
        );
      };

      /**
       * 角色点击处理
       * @param {number} characterId - 角色ID
       */
      const handleCharacterClick = (characterId) => {
        setState({
          showCharacterModal: true,
          characterModalId: characterId,
        });
      };

      /**
       * 取消竞拍处理
       * @param {number} auctionId - 拍卖ID
       */
      const handleCancelAuction = async (auctionId) => {
        if (!confirm("确定要取消竞拍吗？")) {
          return;
        }

        const result = await cancelAuction(auctionId);

        if (result.success) {
          alert("取消竞拍成功");
          // 重新加载当前页数据
          handleMyAuctionsPageChange(currentMyAuctionsPage);
        } else {
          alert(result.message || "取消竞拍失败");
        }
      };

      /**
       * 我的买单分页变化处理
       * @param {number} page - 页码
       */
      const handleMyBidsPageChange = async (page) => {
        currentMyBidsPage = page;
        myBidsRequestManager.execute(
          async () => {
            return await getBidsList(page, 50);
          },
          (result) => {
            if (result.success) {
              setState({ myBidsData: result.data });
              scrollToTop(container);
            }
          }
        );
      };

      /**
       * 我的卖单分页变化处理
       * @param {number} page - 页码
       */
      const handleMyAsksPageChange = async (page) => {
        currentMyAsksPage = page;
        myAsksRequestManager.execute(
          async () => {
            return await getAsksList(page, 50);
          },
          (result) => {
            if (result.success) {
              setState({ myAsksData: result.data });
              scrollToTop(container);
            }
          }
        );
      };

      const tabItems = [
        {
          key: "balance-log",
          label: "资金日志",
          component: () => (
            <BalanceLog
              data={balanceLogData}
              onPageChange={handleBalanceLogPageChange}
              onCharacterClick={handleCharacterClick}
            />
          ),
        },
        {
          key: "my-auctions",
          label: "我的拍卖",
          component: () => (
            <MyAuctions
              data={myAuctionsData}
              onPageChange={handleMyAuctionsPageChange}
              onCharacterClick={handleCharacterClick}
              onCancelAuction={handleCancelAuction}
            />
          ),
        },
        {
          key: "my-bids",
          label: "我的买单",
          component: () => (
            <MyBids
              data={myBidsData}
              onPageChange={handleMyBidsPageChange}
              onCharacterClick={handleCharacterClick}
            />
          ),
        },
        {
          key: "my-asks",
          label: "我的卖单",
          component: () => (
            <MyAsks
              data={myAsksData}
              onPageChange={handleMyAsksPageChange}
              onCharacterClick={handleCharacterClick}
            />
          ),
        },
      ];

      return (
        <div>
          <Tabs
            items={tabItems}
            activeTab={activeTab}
            onTabChange={(index) => {
              setState({ activeTab: index });
              loadTabData(index);
              scrollToTop(container);
            }}
            sticky={true}
            size="small"
            padding="px-1 pt-0 pb-3"
          />
          {showCharacterModal && characterModalId && !isModalExist(generatedCharacterModalId) && (
            <Modal
              visible={showCharacterModal}
              onClose={() => {
                setState({ showCharacterModal: false });
                // 刷新当前tab数据
                loadTabData(activeTab);
              }}
              modalId={generatedCharacterModalId}
              getModalId={(id) => {
                generatedCharacterModalId = id;
              }}
              padding="p-6"
            >
              <CharacterBox characterId={characterModalId} sticky={true} />
            </Modal>
          )}
        </div>
      );
    },
    true
  );

  /**
   * 加载tab数据
   * @param {number} tabIndex - tab索引
   */
  const loadTabData = async (tabIndex) => {
    switch (tabIndex) {
      case 0: {
        // 加载资金日志数据
        const result = await getUserBalanceLog(1, 50);
        if (result.success) {
          setState({ balanceLogData: result.data });
        } else {
          setState({ balanceLogData: { items: [], currentPage: 1, totalPages: 0, totalItems: 0 } });
        }
        break;
      }

      case 1: {
        // 加载我的拍卖数据
        const auctionsResult = await loadMyAuctionsData(1);
        if (auctionsResult.success) {
          setState({ myAuctionsData: auctionsResult.data });
        } else {
          setState({ myAuctionsData: { items: [], currentPage: 1, totalPages: 0, totalItems: 0 } });
        }
        break;
      }

      case 2: {
        // 加载我的买单数据
        const bidsResult = await getBidsList(1, 50);
        if (bidsResult.success) {
          setState({ myBidsData: bidsResult.data });
        } else {
          setState({ myBidsData: { items: [], currentPage: 1, totalPages: 0, totalItems: 0 } });
        }
        break;
      }

      case 3: {
        // 加载我的卖单数据
        const asksResult = await getAsksList(1, 50);
        if (asksResult.success) {
          setState({ myAsksData: asksResult.data });
        } else {
          setState({ myAsksData: { items: [], currentPage: 1, totalPages: 0, totalItems: 0 } });
        }
        break;
      }
    }
  };

  // 初始加载第一个tab的数据
  loadTabData(0);

  return container;
}
