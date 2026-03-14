import { getCover } from "@src/utils/oos.js";

/**
 * 角色连接组件
 * @param {Object} props
 * @param {Object} props.temple1 - 第一个圣殿数据
 * @param {Object} props.temple2 - 第二个圣殿数据
 * @param {('default'|'small'|'mini')} props.size - 尺寸
 * @param {boolean} props.showCharaName - 是否显示角色名称
 * @param {boolean} props.sort - 是否根据Sacrifices排序，默认true
 * @param {Function} props.onNameClick - 点击角色名称的回调函数
 * @param {Function} props.onCoverClick - 点击圣殿图片的回调函数
 */
export function TempleLink({
  temple1,
  temple2,
  size = "default",
  showCharaName = true,
  sort = true,
  onNameClick,
  onCoverClick,
}) {
  if (!temple1 || !temple2) return null;

  // 根据sort决定是否排序
  let left = temple1;
  let right = temple2;
  if (sort && temple1.Sacrifices < temple2.Sacrifices) {
    right = temple1;
    left = temple2;
  }

  // 根据尺寸获取封面
  const coverSize = size === "mini" ? "small" : "large";
  const leftCover = getCover(left.Cover, coverSize);
  const rightCover = getCover(right.Cover, coverSize);

  // 根据Level确定边框颜色
  const getLevelColor = (level) => {
    if (level === 2) return "border-yellow-500";
    if (level === 3) return "border-purple-500";
    return "border-gray-400";
  };

  const leftColor = getLevelColor(left.Level);
  const rightColor = getLevelColor(right.Level);

  // 根据尺寸设置样式
  const sizeStyles = {
    default: {
      container: "w-[432px] h-[330px]",
      width: "w-[432px]",
      leftOuter: "w-[240px] h-[330px]",
      leftInner: "w-[240px] h-[320px] rounded-bl-[15px] rounded-tl-[15px]",
      rightOuter: "w-[250px] h-[330px] left-[188px]",
      rightInner: "w-[240px] h-[320px] rounded-br-[15px] rounded-tr-[15px]",
    },
    small: {
      container: "w-[214px] h-[165px]",
      width: "w-[214px]",
      leftOuter: "w-[120px] h-[165px]",
      leftInner: "w-[118px] h-[160px] rounded-bl-[10px] rounded-tl-[10px]",
      rightOuter: "w-[120px] h-[165px] left-[93px]",
      rightInner: "w-[118px] h-[160px] rounded-br-[10px] rounded-tr-[10px]",
    },
    mini: {
      container: "w-[188px] h-[150px]",
      width: "w-[188px]",
      leftOuter: "w-[105px] h-[150px]",
      leftInner: "w-[105px] h-[140px] rounded-bl-[10px] rounded-tl-[10px]",
      rightOuter: "w-[120px] h-[150px] left-[80px]",
      rightInner: "w-[105px] h-[140px] rounded-br-[10px] rounded-tr-[10px]",
    },
  };

  const styles = sizeStyles[size];

  return (
    <div id="tg-temple-link" className="flex flex-col items-center">
      <div className={`relative flex overflow-hidden ${styles.container}`}>
        {/* 左侧 */}
        <div
          id="tg-temple-link-left"
          data-character-id={left.CharacterId}
          className={`${styles.leftOuter} origin-top-left overflow-hidden ${onCoverClick ? "cursor-pointer" : ""}`}
          style={{ transform: "skewX(-10deg)" }}
          onClick={() => onCoverClick && onCoverClick(left)}
        >
          <div
            className={`${styles.leftInner} box-content origin-top-left overflow-hidden border-2 border-r-0 ${leftColor}`}
            style={{
              transform: "skewX(10deg)",
              backgroundImage: `url(${leftCover})`,
              backgroundPosition: "top",
              backgroundSize: "cover",
            }}
          />
        </div>

        {/* 右侧 */}
        <div
          id="tg-temple-link-right"
          data-character-id={right.CharacterId}
          className={`absolute ${styles.rightOuter} origin-bottom-right overflow-hidden ${onCoverClick ? "cursor-pointer" : ""}`}
          style={{ transform: "skewX(-10deg)" }}
          onClick={() => onCoverClick && onCoverClick(right)}
        >
          <div
            className={`${styles.rightInner} box-content origin-bottom-right overflow-hidden border-2 border-l-0 ${rightColor}`}
            style={{
              transform: "skewX(10deg)",
              backgroundImage: `url(${rightCover})`,
              backgroundPosition: "top",
              backgroundSize: "cover",
            }}
          />
        </div>
      </div>

      {/* 角色名称 */}
      {showCharaName && (
        <div id="tg-temple-link-names" className={`text-left text-sm opacity-80 ${styles.width}`}>
          「
          <span
            className={onNameClick ? "tg-link cursor-pointer" : ""}
            onClick={() => onNameClick && onNameClick(left)}
          >
            {left.Name}
          </span>
          」×「
          <span
            className={onNameClick ? "tg-link cursor-pointer" : ""}
            onClick={() => onNameClick && onNameClick(right)}
          >
            {right.Name}
          </span>
          」
        </div>
      )}
    </div>
  );
}
