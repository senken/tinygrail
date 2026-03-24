import { getBabelTower, getStarLog } from "@src/api/chara.js";
import { createMountedComponent } from "@src/utils/createMountedComponent.js";
import { createHubConnection } from "@src/utils/signalr-loader.js";
import { loadFireworks } from "@src/utils/fireworks-loader.js";
import { SegmentedControl } from "@src/components/SegmentedControl.jsx";
import { ChevronRightIcon } from "@src/icons/ChevronRightIcon.js";
import { Modal } from "@src/components/Modal.jsx";
import { CharacterBox } from "@src/modules/character-box/CharacterBox.jsx";
import { UserTinygrail } from "@src/modules/user-tinygrail/UserTinygrail.jsx";
import { BabelTowerMain } from "./components/BabelTowerMain.jsx";
import { BabelTowerLog } from "./components/BabelTowerLog.jsx";
import { scrollToTop } from "@src/utils/scroll.js";

/**
 * 通天塔组件
 */
export function BabelTower() {
  const container = (
    <div
      id="tg-rakuen-home-babel-tower"
      className="tg-bg-content tg-border-card my-2 rounded-xl p-3 shadow-sm transition-shadow hover:shadow-md"
    />
  );

  // 存储Modal生成的ID
  let generatedCharacterModalId = null;
  let generatedUserModalId = null;
  let generatedLogModalId = null;

  // 检查Modal是否已存在
  const isModalExist = (modalId) => {
    return (
      modalId &&
      document.querySelector(`#tg-modal[data-modal-id="${modalId}"]`)?.parentNode === document.body
    );
  };

  // 数据量选项
  const dataOptions = [
    { value: 24, label: "24" },
    { value: 100, label: "100" },
    { value: 200, label: "200" },
    { value: 300, label: "300" },
    { value: 400, label: "400" },
    { value: 500, label: "500" },
  ];

  // 打开角色弹窗的方法
  const openCharacter = (characterId) => {
    setState({ showCharacterModal: true, characterModalId: characterId });
  };

  // 打开用户弹窗的方法
  const openUser = (userName) => {
    setState({ showUserModal: true, userModalName: userName });
  };

  // SignalR连接(只创建一次)
  let signalRConnection = null;

  // 保存当前state，用于SignalR回调中访问
  let currentState = {};

  // 烟花冷却时间（5秒）
  let lastFireworksTime = 0;
  const FIREWORKS_COOLDOWN = 5000;

  const { setState } = createMountedComponent(container, (state) => {
    // 更新currentState引用
    currentState = state || {};

    const {
      showLogOnSide = true,
      data = null,
      loading = true,
      dataCount = 24,
      showCharacterModal = false,
      characterModalId = null,
      showUserModal = false,
      userModalName = null,
      showLogModal = false,
      logData = null,
    } = state || {};

    // 标题栏
    const headerDiv = (
      <div
        id="tg-rakuen-home-babel-tower-header"
        className="mb-3 flex items-center justify-between gap-2"
      />
    );

    // 标题和日志按钮
    const leftDiv = <div className="flex items-center gap-2" />;
    const titleDiv = (
      <div id="tg-rakuen-home-babel-tower-title" className="text-sm font-semibold">
        / 通天塔(β)
      </div>
    );
    leftDiv.appendChild(titleDiv);

    // 小屏幕时添加日志按钮
    if (!showLogOnSide) {
      const logButton = (
        <button
          className="flex items-center gap-0.5 rounded-full border border-gray-300 px-2 py-0.5 text-xs transition-colors hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
          onClick={() => setState({ showLogModal: true })}
        >
          <span>通天塔日志</span>
          <span className="opacity-60">
            <ChevronRightIcon className="size-3" />
          </span>
        </button>
      );
      leftDiv.appendChild(logButton);
    }

    headerDiv.appendChild(leftDiv);

    // 切换控制器
    const segmentedControl = (
      <SegmentedControl
        options={dataOptions}
        value={dataCount}
        onChange={(value) => {
          setState({ dataCount: value });
          loadBabelTowerData(value);
        }}
        size="small"
      />
    );
    headerDiv.appendChild(segmentedControl);

    // 内容区域
    const contentDiv = (
      <div
        id="tg-rakuen-home-babel-tower-content"
        className="grid auto-rows-min grid-cols-[2fr_1fr] gap-4"
      />
    );

    // 主体部分
    const mainDiv = <div />;
    mainDiv.appendChild(
      <BabelTowerMain data={data} loading={loading} onOpenCharacter={openCharacter} />
    );
    contentDiv.appendChild(mainDiv);

    // 日志部分
    if (showLogOnSide) {
      const logDiv = <div className="h-0 max-h-full min-h-full overflow-y-auto" />;
      const logComponent = (
        <BabelTowerLog
          logData={logData}
          onOpenCharacter={openCharacter}
          onOpenUser={openUser}
          onPageChange={(page) => loadBabelTowerLogData(page)}
        />
      );
      logDiv.appendChild(logComponent);
      contentDiv.appendChild(logDiv);
    } else {
      // 如果不显示日志,调整grid为单列
      contentDiv.style.gridTemplateColumns = "1fr";
    }

    const wrapper = <div />;
    wrapper.appendChild(headerDiv);
    wrapper.appendChild(contentDiv);

    // 角色弹窗
    if (showCharacterModal && characterModalId && !isModalExist(generatedCharacterModalId)) {
      const modal = (
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
      );
      wrapper.appendChild(modal);
    }

    // 用户弹窗
    if (showUserModal && userModalName && !isModalExist(generatedUserModalId)) {
      const userModal = (
        <Modal
          visible={showUserModal}
          onClose={() => setState({ showUserModal: false })}
          modalId={generatedUserModalId}
          getModalId={(id) => {
            generatedUserModalId = id;
          }}
        >
          <UserTinygrail username={userModalName} stickyTop="-8px" />
        </Modal>
      );
      wrapper.appendChild(userModal);
    }

    // 日志弹窗
    if (showLogModal && !isModalExist(generatedLogModalId)) {
      const logModal = (
        <Modal
          visible={showLogModal}
          onClose={() => setState({ showLogModal: false })}
          title="通天塔日志"
          modalId={generatedLogModalId}
          getModalId={(id) => {
            generatedLogModalId = id;
          }}
        >
          <BabelTowerLog
            logData={logData}
            onOpenCharacter={openCharacter}
            onOpenUser={openUser}
            onPageChange={(page) => loadBabelTowerLogData(page)}
          />
        </Modal>
      );
      wrapper.appendChild(logModal);
    }

    return wrapper;
  });

  // 加载通天塔主体数据
  const loadBabelTowerData = async (dataCount) => {
    setState({ loading: true });

    // 根据数据量计算页码和每页数量
    let page, pageSize;
    if (dataCount === 24) {
      page = 1;
      pageSize = 24;
    } else {
      // 100, 200, 300, 400, 500
      page = dataCount / 100;
      pageSize = 100;
    }

    const result = await getBabelTower(page, pageSize);
    if (result.success) {
      setState({ data: result.data, loading: false });
    } else {
      setState({ data: null, loading: false });
    }
  };

  // 加载通天塔日志数据
  const loadBabelTowerLogData = async (page = 1) => {
    const result = await getStarLog(page, 30);
    if (result.success) {
      const newLogData = result.data;
      setState({ logData: newLogData });

      // 如果日志Modal是打开的，手动更新Modal内容
      if (currentState.showLogModal && generatedLogModalId) {
        const modalContent = document.querySelector(
          `#tg-modal[data-modal-id="${generatedLogModalId}"] #tg-modal-content`
        );
        if (modalContent) {
          modalContent.innerHTML = "";
          const newLogComponent = (
            <BabelTowerLog
              logData={newLogData}
              onOpenCharacter={openCharacter}
              onOpenUser={openUser}
              onPageChange={(page) => loadBabelTowerLogData(page)}
            />
          );
          modalContent.appendChild(newLogComponent);
          scrollToTop(modalContent);
        }
      }
    }
  };

  // 初始化SignalR连接
  const initSignalRConnection = async () => {
    if (signalRConnection) {
      return; // 已经连接,不重复创建
    }

    try {
      const connection = await createHubConnection("https://tinygrail.com/actionhub", {
        automaticReconnect: true,
      });

      connection.on("ReceiveStarLog", (log) => {
        const currentLogData = currentState.logData;

        // 只有在第一页时才插入新日志
        if (currentLogData && currentLogData.CurrentPage === 1 && currentLogData.Items) {
          // 检查是否已存在相同ID的日志
          const isDuplicate = currentLogData.Items.some((item) => item.Id === log.Id);
          if (isDuplicate) {
            return;
          }

          // 将新日志插入到第一条
          const newItems = [log, ...currentLogData.Items];

          // 只保留前30条
          if (newItems.length > 30) {
            newItems.length = 30;
          }

          // 更新logData
          setState({
            logData: {
              ...currentLogData,
              Items: newItems,
            },
          });
        }

        // 触发烟花效果（Type 3: 精炼成功, Type 4: 精炼失败）
        if (log.Type === 3 || log.Type === 4) {
          beginFireworks(log.Amount);
        }
      });

      await connection.start();

      connection.onreconnecting((error) => {
        console.warn("SignalR正在重连...", error);
      });

      connection.onreconnected((connectionId) => {
        console.log("SignalR重连成功:", connectionId);
      });

      connection.onclose((error) => {
        console.error("SignalR连接关闭:", error);
      });

      signalRConnection = connection;
    } catch (error) {
      console.error("SignalR初始化失败:", error);
    }
  };

  /**
   * 开始烟花效果
   * @param {number} count - 烟花数量
   */
  const beginFireworks = async (count) => {
    // 检查冷却时间
    const now = Date.now();
    if (now - lastFireworksTime < FIREWORKS_COOLDOWN) {
      return;
    }
    lastFireworksTime = now;

    const num = Math.floor(Math.random() * 10001);
    const id = `fireBox${num}`;
    let totalTime = 0;

    // 移除可能存在的同ID元素
    const existingBox = document.getElementById(id);
    if (existingBox) {
      existingBox.remove();
    }

    // 创建烟花容器
    const fireboxDiv = (
      <div id={id} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999 }} />
    );
    document.body.appendChild(fireboxDiv);

    try {
      // 从CDN加载fireworks-js
      const Fireworks = await loadFireworks();

      const param = {
        autoresize: true,
        opacity: 0.5,
        acceleration: 1,
        friction: 0.97,
        gravity: 0.98,
        particles: 180,
        traceLength: 3,
        traceSpeed: 5,
        explosion: 1,
        intensity: 30,
        flickering: 50,
      };

      const fireworks = new Fireworks.Fireworks(fireboxDiv, param);

      // 依次发射烟花
      for (let i = 0; i < count; i++) {
        const time = Math.random() * 1000;
        totalTime += time;

        setTimeout(() => {
          fireworks.launch(1);
        }, totalTime);
      }

      // 清理容器
      setTimeout(
        () => {
          fireworks.stop();
          const box = document.getElementById(id);
          if (box) {
            box.remove();
          }
        },
        totalTime + count * 1000
      );
    } catch (error) {
      console.error("烟花效果失败:", error);
      // 清理容器
      const box = document.getElementById(id);
      if (box) {
        box.remove();
      }
    }
  };

  // 更新布局
  const updateLayout = (width) => {
    const showLogOnSide = width >= 768;
    setState({ showLogOnSide });
  };

  // 初始化
  const initialWidth = container.offsetWidth || window.innerWidth;
  updateLayout(initialWidth);
  loadBabelTowerData(24);
  loadBabelTowerLogData();
  initSignalRConnection();

  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const width = entry.contentRect.width;
      updateLayout(width);
    }
  });

  observer.observe(container);

  return container;
}
