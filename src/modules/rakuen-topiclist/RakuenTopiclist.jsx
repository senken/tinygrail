import stylesCSS from "./styles.css?inline";
import { TinygrailMenu } from "./components/TinygrailMenu.jsx";
import { RecentChara } from "@src/modules/user-assets-log/components/RecentChara.jsx";
import { MyAuctions } from "@src/modules/user-assets-log/components/MyAuctions.jsx";
import { MyBids } from "@src/modules/user-assets-log/components/MyBids.jsx";
import { MyAsks } from "@src/modules/user-assets-log/components/MyAsks.jsx";
import { MyItems } from "@src/modules/user-assets-log/components/MyItems.jsx";
import { MyCharas } from "@src/modules/user-assets-log/components/MyCharas.jsx";
import { BalanceLog } from "@src/modules/user-assets-log/components/BalanceLog.jsx";
import {
  getRecentCharacters,
  getBidsList,
  getAsksList,
  getUserItems,
  getUserCharas,
  cancelAuction,
} from "@src/api/chara.js";
import { getUserAuctions, getUserBalanceLog } from "@src/api/user.js";
import { getCachedUserAssets } from "@src/utils/session.js";
import { createMountedComponent } from "@src/utils/createMountedComponent.js";

/**
 * 加载样式到 parent.document
 */
function loadStyles() {
  const styleId = "rakuen-topiclist-styles";

  // 检查是否已经加载过
  if ($(parent.document).find(`#${styleId}`).length > 0) {
    return;
  }

  const styleElement = parent.document.createElement("style");
  styleElement.id = styleId;
  styleElement.textContent = stylesCSS;
  $(parent.document.head).append(styleElement);
}

/**
 * 适配移动端布局
 */
function adaptMobileLayout() {
  // 超展开菜单改下拉
  const parentBody = $("body", parent.document);

  var links = parentBody.find("#rakuenHeader .navigator .link a");
  parentBody.find("#rakuenHeader .navigator .link").html(links);
  var menu = (
    <div class="menu">
      <a href="#">菜单</a>
    </div>
  );
  parentBody.find("#rakuenHeader .navigator .menu").remove();
  parentBody.find("#rakuenHeader .navigator").append(menu);

  parentBody.find("#rakuenHeader .navigator .menu").on("click", () => {
    var link = parentBody.find("#rakuenHeader .navigator .link");
    link.css("display", link.css("display") === "none" ? "flex" : "none");
  });

  // 移动端viewport设置
  const viewportId = "rakuen-mobile-viewport";

  const updateViewport = () => {
    // 判断是否为移动端
    const isMobile = window.matchMedia("(max-width: 960px)").matches;
    const existingViewport = $(parent.document.head).find(`#${viewportId}`);

    if (isMobile && existingViewport.length === 0) {
      const viewport = (
        <meta
          id={viewportId}
          name="viewport"
          content="width=device-width,user-scalable=no,initial-scale=.75,maximum-scale=.75,minimum-scale=.75,viewport-fit=cover"
        />
      );
      $(parent.document.head).append(viewport);
    } else if (!isMobile && existingViewport.length > 0) {
      existingViewport.remove();
    }
  };

  // 初始化
  updateViewport();

  // 使用matchMedia监听屏幕尺寸变化
  const mediaQuery = window.matchMedia("(max-width: 960px)");
  mediaQuery.addEventListener("change", updateViewport);

  // Logo点击切换侧边栏
  parentBody
    .find("#rakuenHeader a.logo")
    .removeAttr("href")
    .off("click")
    .on("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      const container = parentBody.find("#container")[0];
      if (container) {
        container.classList.toggle("sidebar-visible");
      }
    });
}

/**
 * 添加小圣杯菜单
 */
function loadGrailMenu() {
  // 检查是否已经添加过菜单
  if ($("#tinygrail-menu").length > 0) {
    return;
  }

  // 创建容器
  const contentContainer = $("#eden_tpc_list ul")[0];

  // 使用createMountedComponent管理状态和渲染
  const { setState } = createMountedComponent(contentContainer, (state) => {
    const {
      recentCharaData = null,
      myAuctionsData = null,
      myBidsData = null,
      myAsksData = null,
      myItemsData = null,
      myCharasData = null,
      balanceLogData = null,
      activeMenu = null,
    } = state || {};

    /**
     * 角色点击处理
     * @param {number} characterId - 角色ID
     */
    const handleCharacterClick = (characterId) => {
      window.open(`/rakuen/topic/crt/${characterId}`, "right");
    };

    /**
     * 取消拍卖处理
     * @param {number} auctionId - 拍卖ID
     */
    const handleCancelAuction = async (auctionId) => {
      if (!confirm("确定要取消竞拍吗？")) {
        return;
      }

      const result = await cancelAuction(auctionId);

      if (result.success) {
        alert("取消竞拍成功");
        // 重新加载我的拍卖数据
        loadMyAuctions();
      } else {
        alert(result.message || "取消竞拍失败");
      }
    };

    // 加载中状态组件
    const LoadingState = () => (
      <div className="tinygrail">
        <div className="tg-bg-content rounded-lg p-8 text-center">
          <p className="text-sm opacity-60">加载中...</p>
        </div>
      </div>
    );

    // 错误状态组件
    const ErrorState = () => (
      <div className="tinygrail">
        <div className="tg-bg-content rounded-lg p-8 text-center">
          <p className="text-sm opacity-60">加载失败</p>
        </div>
      </div>
    );

    // 根据activeMenu渲染不同的内容
    if (activeMenu === "recent") {
      if (recentCharaData === null) return <LoadingState />;
      if (recentCharaData?.error) return <ErrorState />;

      return (
        <div className="tinygrail">
          <div className="pb-4">
            <RecentChara
              data={recentCharaData}
              onPageChange={(page) => {
                setState({ recentCharaData: null });
                getRecentCharacters(page).then((result) => {
                  setState({
                    recentCharaData: result.success ? result.data : { error: true },
                  });
                });
              }}
              onCharacterClick={handleCharacterClick}
            />
          </div>
        </div>
      );
    }

    if (activeMenu === "auction") {
      if (myAuctionsData === null) return <LoadingState />;
      if (myAuctionsData?.error) return <ErrorState />;

      return (
        <div className="tinygrail">
          <div className="pb-4">
            <MyAuctions
              data={myAuctionsData}
              onPageChange={(page) => {
                setState({ myAuctionsData: null });
                getUserAuctions(page, 50).then((result) => {
                  setState({
                    myAuctionsData: result.success ? result.data : { error: true },
                  });
                });
              }}
              onCharacterClick={handleCharacterClick}
              onCancelAuction={handleCancelAuction}
            />
          </div>
        </div>
      );
    }

    if (activeMenu === "bid") {
      if (myBidsData === null) return <LoadingState />;
      if (myBidsData?.error) return <ErrorState />;

      return (
        <div className="tinygrail">
          <div className="pb-4">
            <MyBids
              data={myBidsData}
              onPageChange={(page) => {
                setState({ myBidsData: null });
                getBidsList(page, 50).then((result) => {
                  setState({
                    myBidsData: result.success ? result.data : { error: true },
                  });
                });
              }}
              onCharacterClick={handleCharacterClick}
            />
          </div>
        </div>
      );
    }

    if (activeMenu === "ask") {
      if (myAsksData === null) return <LoadingState />;
      if (myAsksData?.error) return <ErrorState />;

      return (
        <div className="tinygrail">
          <div className="pb-4">
            <MyAsks
              data={myAsksData}
              onPageChange={(page) => {
                setState({ myAsksData: null });
                getAsksList(page, 50).then((result) => {
                  setState({
                    myAsksData: result.success ? result.data : { error: true },
                  });
                });
              }}
              onCharacterClick={handleCharacterClick}
            />
          </div>
        </div>
      );
    }

    if (activeMenu === "item") {
      if (myItemsData === null) return <LoadingState />;
      if (myItemsData?.error) return <ErrorState />;

      return (
        <div className="tinygrail">
          <div className="pb-4">
            <MyItems
              data={myItemsData}
              onPageChange={(page) => {
                setState({ myItemsData: null });
                getUserItems(page, 50).then((result) => {
                  setState({
                    myItemsData: result.success ? result.data : { error: true },
                  });
                });
              }}
            />
          </div>
        </div>
      );
    }

    if (activeMenu === "log") {
      if (balanceLogData === null) return <LoadingState />;
      if (balanceLogData?.error) return <ErrorState />;

      return (
        <div className="tinygrail">
          <div className="pb-4">
            <BalanceLog
              data={balanceLogData}
              onPageChange={(page) => {
                setState({ balanceLogData: null });
                getUserBalanceLog(page, 50).then((result) => {
                  setState({
                    balanceLogData: result.success ? result.data : { error: true },
                  });
                });
              }}
              onCharacterClick={handleCharacterClick}
            />
          </div>
        </div>
      );
    }

    if (activeMenu === "charas") {
      if (myCharasData === null) return <LoadingState />;
      if (myCharasData?.error) return <ErrorState />;

      return (
        <div className="tinygrail">
          <div className="pb-4">
            <MyCharas
              data={myCharasData}
              onPageChange={(page) => {
                setState({ myCharasData: null });
                const userAssets = getCachedUserAssets();
                if (!userAssets || !userAssets.name) {
                  setState({ myCharasData: { error: true } });
                  return;
                }
                getUserCharas(userAssets.name, page, 48).then((result) => {
                  setState({
                    myCharasData: result.success ? result.data : { error: true },
                  });
                });
              }}
              onCharacterClick={handleCharacterClick}
            />
          </div>
        </div>
      );
    }

    // 默认返回空
    return <div />;
  });

  /**
   * 加载最近活跃角色
   */
  const loadRecentChara = () => {
    setState({ activeMenu: "recent", recentCharaData: null });
    getRecentCharacters(1).then((result) => {
      setState({
        recentCharaData: result.success ? result.data : { error: true },
      });
    });
  };

  /**
   * 加载我的拍卖
   */
  const loadMyAuctions = () => {
    setState({ activeMenu: "auction", myAuctionsData: null });
    getUserAuctions(1, 50).then((result) => {
      setState({
        myAuctionsData: result.success ? result.data : { error: true },
      });
    });
  };

  /**
   * 加载我的买单
   */
  const loadMyBids = () => {
    setState({ activeMenu: "bid", myBidsData: null });
    getBidsList(1, 50).then((result) => {
      setState({
        myBidsData: result.success ? result.data : { error: true },
      });
    });
  };

  /**
   * 加载我的卖单
   */
  const loadMyAsks = () => {
    setState({ activeMenu: "ask", myAsksData: null });
    getAsksList(1, 50).then((result) => {
      setState({
        myAsksData: result.success ? result.data : { error: true },
      });
    });
  };

  /**
   * 加载我的道具
   */
  const loadMyItems = () => {
    setState({ activeMenu: "item", myItemsData: null });
    getUserItems(1, 50).then((result) => {
      setState({
        myItemsData: result.success ? result.data : { error: true },
      });
    });
  };

  /**
   * 加载资金日志
   */
  const loadBalanceLog = () => {
    setState({ activeMenu: "log", balanceLogData: null });
    getUserBalanceLog(1, 50).then((result) => {
      setState({
        balanceLogData: result.success ? result.data : { error: true },
      });
    });
  };

  /**
   * 加载我的持仓
   */
  const loadMyCharas = () => {
    setState({ activeMenu: "charas", myCharasData: null });
    const userAssets = getCachedUserAssets();
    if (!userAssets || !userAssets.name) {
      setState({ myCharasData: { error: true } });
      return;
    }
    getUserCharas(userAssets.name, 1, 48).then((result) => {
      setState({
        myCharasData: result.success ? result.data : { error: true },
      });
    });
  };

  const menuItem = (
    <TinygrailMenu
      onRecentClick={loadRecentChara}
      onAuctionClick={loadMyAuctions}
      onBidClick={loadMyBids}
      onAskClick={loadMyAsks}
      onItemClick={loadMyItems}
      onLogClick={loadBalanceLog}
      onCharasClick={loadMyCharas}
    />
  );
  $(".timelineTabs").append(menuItem);
}

/**
 * 为话题列表项添加点击事件
 */
function setupTopicListClick() {
  const items = $("#eden_tpc_list .item_list");
  const parentBody = $(parent.document.body);

  items.each(function () {
    const item = this;
    const link = $(item).find("a").attr("href");

    if (!link) return;

    // 保存原始链接
    item.dataset.link = link;

    // 添加点击事件
    $(item).on("click", function (e) {
      // 如果点击的是链接本身，阻止默认行为
      if (e.target.tagName === "A") {
        e.preventDefault();
      }

      // 在小屏幕下收起侧边栏
      const isMobile = parent.window.matchMedia("(max-width: 960px)").matches;
      if (isMobile) {
        const container = parentBody.find("#container")[0];
        if (container) {
          container.classList.remove("sidebar-visible");
        }
      }

      // 在右侧框架中打开链接
      window.open(item.dataset.link, "right");
    });
  });
}

/**
 * 超展开侧边栏组件
 */
export function RakuenTopiclist() {
  loadStyles();

  adaptMobileLayout();

  loadGrailMenu();

  setupTopicListClick();
}
