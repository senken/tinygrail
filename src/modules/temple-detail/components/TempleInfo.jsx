import { ProgressBar } from "@src/components/ProgressBar.jsx";
import { formatNumber } from "@src/utils/format.js";

/**
 * 圣殿详细信息组件
 * @param {Object} props
 * @param {Object} props.templeData - 圣殿数据
 */
export function TempleInfo({ templeData }) {
  if (!templeData) return null;

  // 根据Level确定圣殿主题色
  const getTempleThemeColor = (level) => {
    if (level === 2) return "#eab308";
    if (level === 3) return "#a855f7";
    return "#9ca3af";
  };

  const themeColor = getTempleThemeColor(templeData.Level);

  const container = (
    <div id="tg-temple-info" className="flex flex-col gap-2 px-4 pb-2 pt-2">
      {/* 进度条 */}
      <div id="tg-temple-info-progress" className="flex w-full flex-col gap-1">
        <div className="text-sm opacity-60">
          {formatNumber(templeData.Assets ?? 0, 0)} / {formatNumber(templeData.Sacrifices ?? 0, 0)}
        </div>
        <ProgressBar
          value={templeData.Assets ?? 0}
          max={templeData.Sacrifices ?? 100}
          color={themeColor}
          height="h-1"
        />
      </div>
    </div>
  );

  return container;
}
