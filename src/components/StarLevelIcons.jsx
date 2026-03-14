import { StarIcon, MoonIcon, SunIcon, CrownIcon } from "@src/icons";

/**
 * 星级图标组件
 * @param {Object} props
 * @param {number} props.level - 星级
 * @param {number} props.size - 图标尺寸（像素），默认 16
 */
export function StarLevelIcons({ level = 0, size = 16 }) {
  const icons = [];

  if (level === 0) {
    // 0级显示一个线条星星
    const icon = <StarIcon className="icon" filled={false} />;
    icon.style.width = `${size}px`;
    icon.style.height = `${size}px`;
    icons.push(icon);
  } else {
    const crownCount = Math.floor(level / 125); // 每125级一个皇冠
    const sunCount = Math.floor((level % 125) / 25); // 每25级一个太阳
    const moonCount = Math.floor((level % 25) / 5); // 每5级一个月亮
    const starCount = level % 5; // 剩余的星星

    // 皇冠图标
    for (let i = 0; i < crownCount; i++) {
      const icon = <CrownIcon className="icon" />;
      icon.style.width = `${size}px`;
      icon.style.height = `${size}px`;
      icons.push(icon);
    }

    // 太阳图标
    for (let i = 0; i < sunCount; i++) {
      const icon = <SunIcon className="icon" />;
      icon.style.width = `${size}px`;
      icon.style.height = `${size}px`;
      icons.push(icon);
    }

    // 月亮图标
    for (let i = 0; i < moonCount; i++) {
      const icon = <MoonIcon className="icon" />;
      icon.style.width = `${size}px`;
      icon.style.height = `${size}px`;
      icons.push(icon);
    }

    // 星星图标
    for (let i = 0; i < starCount; i++) {
      const icon = <StarIcon className="icon" filled={true} />;
      icon.style.width = `${size}px`;
      icon.style.height = `${size}px`;
      icons.push(icon);
    }
  }

  return (
    <div
      id="tg-star-level-icons"
      data-level={level}
      className="inline-flex items-center gap-0.5 text-yellow-400"
    >
      {icons}
    </div>
  );
}
