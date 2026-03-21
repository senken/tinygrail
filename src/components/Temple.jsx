import { getCover, normalizeAvatar } from "@src/utils/oos.js";
import { ProgressBar } from "@src/components/ProgressBar.jsx";
import { formatNumber } from "@src/utils/format.js";
import { StarIcon } from "@src/icons/StarIcon.js";

/**
 * 圣殿组件
 * @param {Object} props
 * @param {Object} props.temple - 圣殿数据
 * @param {string} props.bottomText - 右下角显示的文本
 * @param {Function} props.onClick - 点击回调函数
 * @param {boolean} props.showProgress - 是否显示进度条
 */
export function Temple({ temple, bottomText, onClick, showProgress = true }) {
  if (!temple) return null;

  const cover = getCover(temple.Cover, "small");
  const hasCover = !!temple.Cover;
  const avatarUrl = normalizeAvatar(temple.Avatar);
  const hasLine = !!temple.Line;

  // 根据Level确定圣殿主题色
  const getTempleThemeColor = (level) => {
    if (level === 2) return { border: "border-yellow-500", bg: "bg-yellow-500", color: "#eab308" };
    if (level === 3) return { border: "border-purple-500", bg: "bg-purple-500", color: "#a855f7" };
    return { border: "border-gray-400", bg: "bg-gray-400", color: "#9ca3af" };
  };

  // 获取圣殿等级名称
  const getTempleGrade = (level, refine) => {
    if (refine > 0) return "无限圣殿";
    if (level === 1) return "光辉圣殿";
    if (level === 2) return "闪耀圣殿";
    if (level === 3) return "奇迹圣殿";
    return "";
  };

  const templeTheme = getTempleThemeColor(temple.Level);
  const templeGrade = getTempleGrade(temple.Level, temple.Refine);

  // 圣殿等级文本
  const levelText = temple.Refine > 0 ? `+${temple.Refine}` : `${temple.Level}`;

  return (
    <div
      id="tg-temple"
      data-character-id={temple.CharacterId}
      data-level={temple.Level}
      data-assets={temple.Assets}
      data-sacrifices={temple.Sacrifices}
      className="flex w-full flex-col gap-1"
    >
      <div
        id="tg-temple-image"
        className={`group relative aspect-[3/4] w-full overflow-hidden rounded-lg border-2 ${templeTheme.border} ${onClick ? "cursor-pointer" : ""}`}
        onClick={() => onClick && onClick(temple)}
      >
        {hasCover ? (
          // 有圣殿图片
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `url(${cover})`,
              backgroundPosition: "top",
              backgroundSize: "cover",
            }}
          />
        ) : (
          // 无圣殿图片
          <div>
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${avatarUrl})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
                filter: "blur(10px)",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="aspect-square w-1/2 rounded-full bg-cover bg-top"
                style={{
                  backgroundImage: `url(${avatarUrl})`,
                }}
              />
            </div>
          </div>
        )}

        {/* 圣殿等级 */}
        <div
          id="tg-temple-level"
          className={`absolute left-1 top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full ${templeTheme.bg} px-1.5 text-xs font-semibold text-white`}
          title={templeGrade}
        >
          {levelText}
        </div>

        {/* 右下角文本 */}
        {bottomText && (
          <div
            id="tg-temple-bottom-text"
            className={`absolute bottom-5 right-0 rounded-l-md ${templeTheme.bg} px-2 py-0.5 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100`}
          >
            {bottomText}
          </div>
        )}

        {/* 台词省略号 */}
        {hasLine && (
          <div
            id="tg-temple-line"
            className="absolute bottom-1 right-1 px-1 py-0.5 text-base font-bold leading-3 text-white"
            style={{
              textShadow: "1px 1px 1px #000",
            }}
            title={temple.Line}
          >
            ···
          </div>
        )}
      </div>

      {/* 进度条 */}
      {showProgress && (
        <div id="tg-temple-progress" className="flex w-full flex-col gap-0.5">
          <div className="flex items-center justify-between gap-1">
            <div className="text-xs opacity-60">
              {formatNumber(temple.Assets ?? 0, 0)} / {formatNumber(temple.Sacrifices ?? 0, 0)}
            </div>
            {temple.starForces >= 10000 && (
              <StarIcon className="h-3 w-3 text-yellow-400" filled={true} />
            )}
          </div>
          <ProgressBar
            value={temple.Assets ?? 0}
            max={temple.Sacrifices ?? 100}
            color={templeTheme.color}
            height="h-1"
          />
        </div>
      )}
    </div>
  );
}
