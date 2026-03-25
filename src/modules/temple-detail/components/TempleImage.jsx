import { LoaderCircleIcon } from "@src/icons/index.js";

/**
 * 圣殿大图组件
 * @param {Object} props
 * @param {string} props.imageUrl - 图片URL
 * @param {string} props.characterName - 角色名称
 * @param {string} props.line - 角色台词
 * @param {Function} props.onLoad - 图片加载完成回调
 */
export function TempleImage({ imageUrl, characterName, line, onLoad }) {
  const minWidth = 480;
  const minHeight = 680;
  const img = (
    <img
      src={imageUrl}
      alt={characterName}
      className="h-auto max-w-full"
      style={{ display: "none" }}
    />
  );
  const container = (
    <div
      id="tg-temple-image"
      className="relative flex items-center justify-center bg-gray-100 dark:bg-gray-800"
      style={{ width: `${minWidth}px`, minHeight: `${minHeight}px` }}
    />
  );

  // 加载状态
  const loader = (
    <div className="flex flex-col items-center gap-2">
      <LoaderCircleIcon className="tg-spin h-8 w-8 text-gray-400" />
      <span className="text-sm text-gray-500">加载中...</span>
    </div>
  );
  container.appendChild(loader);

  // 台词和角色名称覆盖层
  let lineOverlay = null;
  if (line) {
    lineOverlay = (
      <div className="absolute bottom-3 left-3 right-3">
        {/* 角色名称 */}
        <div className="px-1 py-1">
          <div
            className="text-base font-bold text-white"
            style={{
              textShadow: "1px 1px 1px #000",
            }}
          >
            {characterName}
          </div>
        </div>
        {/* 台词覆盖层 */}
        <div className="rounded-lg bg-white/70 px-4 py-3 backdrop-blur-sm">
          <div className="whitespace-pre-wrap text-sm text-gray-800">{line}</div>
        </div>
      </div>
    );
  }

  const handleImageLoad = () => {
    const naturalWidth = img.naturalWidth;
    let finalWidth;

    if (naturalWidth >= minWidth) {
      finalWidth = naturalWidth;
      container.style.width = `${naturalWidth}px`;
      container.style.maxWidth = "100%";
    } else {
      finalWidth = minWidth;
      container.style.width = `${minWidth}px`;
      container.style.maxWidth = "100%";
      img.style.width = `${minWidth}px`;
    }

    // 移除加载状态，显示图片
    container.style.minHeight = "auto";
    container.style.background = "none";
    container.classList.remove(
      "flex",
      "items-center",
      "justify-center",
      "bg-gray-100",
      "dark:bg-gray-800"
    );
    loader.remove();
    img.style.display = "block";

    // 添加台词和角色名称覆盖层
    if (lineOverlay) {
      container.appendChild(lineOverlay);
    }

    // 通知父组件
    if (onLoad) {
      onLoad(finalWidth);
    }
  };

  img.onload = handleImageLoad;

  // 如果图片已经加载完成，立即触发回调
  if (img.complete && img.naturalWidth > 0) {
    handleImageLoad();
  }

  container.appendChild(img);

  return container;
}
