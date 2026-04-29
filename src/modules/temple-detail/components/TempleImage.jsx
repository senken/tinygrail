import { LoaderCircleIcon } from "@src/icons/index.js";

/**
 * 圣殿大图组件
 * @param {Object} props
 * @param {string} props.imageUrl - 图片URL
 * @param {string} props.characterName - 角色名称
 * @param {string} props.line - 角色台词
 * @param {Function} props.onImageLoad - 图片加载完成回调，接收图片宽度作为参数
 */
export function TempleImage({ imageUrl, characterName, line, onImageLoad }) {
  const minWidth = 320;
  const maxWidth = window.innerWidth * 0.9; // 最大宽度为视口宽度的90%，避免横向滚动条
  const maxHeight = window.innerHeight * 0.6; // 最大高度为视口高度的60%
  
  const img = (
    <img
      src={imageUrl}
      alt={characterName}
      className="mx-auto"
      style={{ 
        display: "none",
      }}
    />
  );
  
  const container = (
    <div
      id="tg-temple-image"
      className="relative flex items-center justify-center w-full"
      style={{
        minWidth: `${minWidth}px`,
        minHeight: "200px",
        backgroundColor: "#1B1B1B",
      }}
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
    // 获取图片实际尺寸
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    
    if (naturalWidth === 0 || naturalHeight === 0) {
      console.error("图片加载失败");
      return;
    }
    
    // 计算最终显示尺寸
    let finalWidth = naturalWidth;
    let finalHeight = naturalHeight;
    
    // 如果图片宽度小于最小宽度，放大到最小宽度
    if (finalWidth < minWidth) {
      const scale = minWidth / finalWidth;
      finalWidth = minWidth;
      finalHeight = Math.round(finalHeight * scale);
    }
    
    // 如果图片宽度超过最大宽度，缩小到最大宽度
    if (finalWidth > maxWidth) {
      const scale = maxWidth / finalWidth;
      finalWidth = maxWidth;
      finalHeight = Math.round(finalHeight * scale);
    }
    
    // 如果图片高度超过最大高度，缩小到最大高度
    if (finalHeight > maxHeight) {
      const scale = maxHeight / finalHeight;
      finalHeight = maxHeight;
      finalWidth = Math.round(finalWidth * scale);
      
      // 确保缩小后宽度不小于最小宽度
      if (finalWidth < minWidth) {
        finalWidth = minWidth;
      }
    }
    
    // 设置图片尺寸
    img.style.width = `${finalWidth}px`;
    img.style.height = `${finalHeight}px`;
    img.style.objectFit = "contain";
    
    // 设置容器尺寸
    container.style.minHeight = "0";
    container.style.width = `${finalWidth}px`;
    container.style.height = `${finalHeight}px`;
    container.style.maxWidth = "none";
    
    // 移除加载状态，显示图片
    container.classList.remove("flex", "items-center", "justify-center");
    loader.remove();
    img.style.display = "block";
    
    // 修改父组件宽度
    if (onImageLoad && finalWidth > 0) {
      onImageLoad(finalWidth);
    }

    // 添加台词和角色名称覆盖层
    if (lineOverlay) {
      container.appendChild(lineOverlay);
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
