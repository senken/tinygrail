import { normalizeAvatar } from "@src/utils/oos.js";
import { formatNumber } from "@src/utils/format.js";
import { StarLevelIcons } from "@src/components/StarLevelIcons.jsx";
import { Button } from "@src/components/Button.jsx";

/**
 * 通天塔主体组件
 * @param {Object} props
 * @param {Array} props.data - 通天塔数据
 * @param {boolean} props.loading - 加载状态
 * @param {Function} props.onOpenCharacter - 打开角色回调函数
 */
export function BabelTowerMain({ data, loading, onOpenCharacter }) {
  if (loading) {
    return (
      <div className="p-4 text-center">
        <p className="opacity-60">加载中...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="opacity-60">暂无数据</p>
      </div>
    );
  }

  // 根据数据长度决定列数
  const cols = data.length === 24 ? 6 : 10;

  const container = (
    <div
      id="tg-rakuen-home-babel-tower-main"
      className="grid w-full gap-0.5"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    />
  );

  // 用于跟踪当前显示信息框的元素
  let currentOpenInfoBox = null;

  // 检测是否为触摸设备
  const isTouchDevice =
    "ontouchstart" in window || window.matchMedia("(pointer: coarse)").matches;

  data.forEach((item, index) => {
    // 判断是否在左半部分(信息框靠右显示)
    const isLeftHalf = (index % cols) < cols / 2;

    const itemDiv = (
      <div
        data-character-id={item.Id}
        className="group relative aspect-square cursor-pointer overflow-visible rounded transition-all hover:scale-105 hover:shadow-lg"
        style={{
          backgroundImage: `url(${normalizeAvatar(item.Icon)})`,
          backgroundSize: "cover",
          backgroundPosition: "top",
          zIndex: 1,
        }}
      />
    );

    // 信息框
    const infoBox = (
      <div
        className={`absolute top-full mt-2 hidden w-48 rounded-lg bg-white p-3 shadow-xl dark:bg-gray-800 ${
          isLeftHalf ? "left-0" : "right-0"
        }`}
        style={{ zIndex: 1000 }}
      />
    );

    // 信息内容
    const infoContent = <div className="space-y-2 text-xs" />;

    // 排名和星级
    const rankDiv = <div className="flex items-center gap-2 font-semibold" />;
    rankDiv.appendChild(<span>第{item.Rank}位</span>);
    rankDiv.appendChild(<StarLevelIcons level={item.Stars} size={14} />);
    infoContent.appendChild(rankDiv);

    // ID和名称
    const nameDiv = (
      <div className="opacity-80">
        #{item.Id}「{item.Name}」
      </div>
    );
    infoContent.appendChild(nameDiv);

    // 星之力
    const forceDiv = (
      <div className="opacity-60">星之力 +{formatNumber(item.StarForces, 0)}</div>
    );
    infoContent.appendChild(forceDiv);

    // 查看角色按钮(仅触摸设备显示)
    if (isTouchDevice) {
      const viewButton = (
        <Button
          variant="solid"
          size="sm"
          className="mt-1 w-full"
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenCharacter) {
              onOpenCharacter(item.Id);
            }
          }}
        >
          查看角色
        </Button>
      );
      infoContent.appendChild(viewButton);
    }

    infoBox.appendChild(infoContent);
    itemDiv.appendChild(infoBox);

    // 鼠标悬停事件(仅非触摸设备)
    itemDiv.addEventListener("mouseenter", () => {
      if (!isTouchDevice) {
        infoBox.style.display = "block";
        itemDiv.style.zIndex = "10";
      }
    });

    itemDiv.addEventListener("mouseleave", () => {
      if (!isTouchDevice) {
        infoBox.style.display = "none";
        itemDiv.style.zIndex = "1";
      }
    });

    // 点击事件
    itemDiv.addEventListener("click", (e) => {
      // 如果点击的是按钮,不处理
      if (e.target.tagName === "BUTTON") {
        return;
      }

      if (isTouchDevice) {
        // 触摸设备:切换信息框显示
        if (infoBox.style.display === "block") {
          // 隐藏信息框
          infoBox.style.display = "none";
          itemDiv.style.zIndex = "1";
          currentOpenInfoBox = null;
        } else {
          // 先关闭之前打开的信息框
          if (currentOpenInfoBox && currentOpenInfoBox !== infoBox) {
            currentOpenInfoBox.style.display = "none";
            currentOpenInfoBox.parentElement.style.zIndex = "1";
          }

          // 显示当前信息框
          infoBox.style.display = "block";
          itemDiv.style.zIndex = "10";
          currentOpenInfoBox = infoBox;
        }
      } else {
        // 鼠标设备:直接打开角色
        if (onOpenCharacter) {
          onOpenCharacter(item.Id);
        }
      }
    });

    container.appendChild(itemDiv);
  });

  // 点击容器外部关闭所有信息框
  document.addEventListener("click", (e) => {
    if (currentOpenInfoBox && !container.contains(e.target)) {
      currentOpenInfoBox.style.display = "none";
      currentOpenInfoBox.parentElement.style.zIndex = "1";
      currentOpenInfoBox = null;
    }
  });

  return container;
}
