import { Button } from "@src/components/Button.jsx";

/**
 * 图片裁剪组件
 * @param {Object} props
 * @param {Function} props.onCrop - 裁剪完成回调，返回裁剪后的图片blob和dataURL
 */
export function ImageCropper({ onCrop }) {
  let img = null;
  let canvas = null;
  let ctx = null;
  let currentImageUrl = null;

  // 裁剪区域状态
  const cropState = {
    x: 0,
    y: 0,
    size: 200,
    isDragging: false,
    dragType: null, // 'move', 'nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'
    dragStartX: 0,
    dragStartY: 0,
    startCropX: 0,
    startCropY: 0,
    startCropSize: 0,
  };

  // 绘制 canvas
  const drawCanvas = () => {
    if (!ctx || !img) return;

    // 计算缩放比例
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;

    // 根据缩放比例调整手柄大小
    const visualHandleSize = 12; // 屏幕上的视觉大小
    const actualHandleSize = visualHandleSize * scale; // canvas上的实际大小

    // 清空canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制原图
    ctx.drawImage(img, 0, 0);

    // 绘制遮罩层
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 清除裁剪区域的遮罩
    ctx.clearRect(cropState.x, cropState.y, cropState.size, cropState.size);
    ctx.drawImage(
      img,
      cropState.x,
      cropState.y,
      cropState.size,
      cropState.size,
      cropState.x,
      cropState.y,
      cropState.size,
      cropState.size
    );

    // 绘制裁剪框边框
    ctx.strokeStyle = "#0ea5e9";
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(cropState.x, cropState.y, cropState.size, cropState.size);

    // 绘制四个角的手柄
    ctx.fillStyle = "#0ea5e9";
    // 左上角
    ctx.fillRect(cropState.x - actualHandleSize / 2, cropState.y - actualHandleSize / 2, actualHandleSize, actualHandleSize);
    // 右上角
    ctx.fillRect(cropState.x + cropState.size - actualHandleSize / 2, cropState.y - actualHandleSize / 2, actualHandleSize, actualHandleSize);
    // 左下角
    ctx.fillRect(cropState.x - actualHandleSize / 2, cropState.y + cropState.size - actualHandleSize / 2, actualHandleSize, actualHandleSize);
    // 右下角
    ctx.fillRect(
      cropState.x + cropState.size - actualHandleSize / 2,
      cropState.y + cropState.size - actualHandleSize / 2,
      actualHandleSize,
      actualHandleSize
    );

    // 绘制四条边的手柄
    const visualEdgeHandleSize = 6;
    const visualEdgeHandleLength = 32;
    const actualEdgeHandleSize = visualEdgeHandleSize * scale;
    const actualEdgeHandleLength = visualEdgeHandleLength * scale;
    
    // 上边
    ctx.fillRect(
      cropState.x + cropState.size / 2 - actualEdgeHandleLength / 2,
      cropState.y - actualEdgeHandleSize / 2,
      actualEdgeHandleLength,
      actualEdgeHandleSize
    );
    // 下边
    ctx.fillRect(
      cropState.x + cropState.size / 2 - actualEdgeHandleLength / 2,
      cropState.y + cropState.size - actualEdgeHandleSize / 2,
      actualEdgeHandleLength,
      actualEdgeHandleSize
    );
    // 左边
    ctx.fillRect(
      cropState.x - actualEdgeHandleSize / 2,
      cropState.y + cropState.size / 2 - actualEdgeHandleLength / 2,
      actualEdgeHandleSize,
      actualEdgeHandleLength
    );
    // 右边
    ctx.fillRect(
      cropState.x + cropState.size - actualEdgeHandleSize / 2,
      cropState.y + cropState.size / 2 - actualEdgeHandleLength / 2,
      actualEdgeHandleSize,
      actualEdgeHandleLength
    );
  };

  // 获取触摸或鼠标位置
  const getPosition = (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // 检测点击位置类型
  const getHitType = (x, y) => {
    // 计算缩放比例
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    
    // 根据缩放比例调整触摸容差
    const visualTolerance = 20; // 屏幕上的视觉大小
    const tolerance = visualTolerance * scale; // canvas上的实际大小

    // 检测四个角
    if (Math.abs(x - cropState.x) < tolerance && Math.abs(y - cropState.y) < tolerance) return "nw";
    if (Math.abs(x - (cropState.x + cropState.size)) < tolerance && Math.abs(y - cropState.y) < tolerance)
      return "ne";
    if (Math.abs(x - cropState.x) < tolerance && Math.abs(y - (cropState.y + cropState.size)) < tolerance)
      return "sw";
    if (
      Math.abs(x - (cropState.x + cropState.size)) < tolerance &&
      Math.abs(y - (cropState.y + cropState.size)) < tolerance
    )
      return "se";

    // 检测四条边
    if (Math.abs(y - cropState.y) < tolerance && x > cropState.x && x < cropState.x + cropState.size) return "n";
    if (
      Math.abs(y - (cropState.y + cropState.size)) < tolerance &&
      x > cropState.x &&
      x < cropState.x + cropState.size
    )
      return "s";
    if (Math.abs(x - cropState.x) < tolerance && y > cropState.y && y < cropState.y + cropState.size) return "w";
    if (
      Math.abs(x - (cropState.x + cropState.size)) < tolerance &&
      y > cropState.y &&
      y < cropState.y + cropState.size
    )
      return "e";

    // 检测裁剪框内部
    if (x > cropState.x && x < cropState.x + cropState.size && y > cropState.y && y < cropState.y + cropState.size) {
      return "move";
    }

    return null;
  };

  // 获取光标样式
  const getCursorStyle = (hitType) => {
    const cursors = {
      nw: "nw-resize",
      ne: "ne-resize",
      sw: "sw-resize",
      se: "se-resize",
      n: "n-resize",
      s: "s-resize",
      w: "w-resize",
      e: "e-resize",
      move: "move",
    };
    return cursors[hitType] || "default";
  };

  // 鼠标/触摸按下
  const handleStart = (e) => {
    e.preventDefault();
    const { x, y } = getPosition(e);

    const hitType = getHitType(x, y);
    if (hitType) {
      cropState.isDragging = true;
      cropState.dragType = hitType;
      cropState.dragStartX = x;
      cropState.dragStartY = y;
      cropState.startCropX = cropState.x;
      cropState.startCropY = cropState.y;
      cropState.startCropSize = cropState.size;
      canvas.style.cursor = getCursorStyle(hitType);
    }
  };

  // 鼠标/触摸移动
  const handleMove = (e) => {
    e.preventDefault();
    const { x, y } = getPosition(e);

    if (cropState.isDragging) {
      const dx = x - cropState.dragStartX;
      const dy = y - cropState.dragStartY;

      switch (cropState.dragType) {
        case "move":
          // 移动裁剪框
          cropState.x = Math.max(0, Math.min(cropState.startCropX + dx, canvas.width - cropState.size));
          cropState.y = Math.max(0, Math.min(cropState.startCropY + dy, canvas.height - cropState.size));
          break;

        case "se":
          // 右下角
          {
            const delta = Math.max(dx, dy);
            const newSize = Math.max(50, Math.min(cropState.startCropSize + delta, canvas.width - cropState.x, canvas.height - cropState.y));
            cropState.size = newSize;
          }
          break;

        case "nw":
          // 左上角
          {
            const delta = Math.min(dx, dy);
            const newSize = Math.max(50, cropState.startCropSize - delta);
            const maxMove = cropState.startCropSize - 50;
            const actualDelta = cropState.startCropSize - newSize;
            cropState.size = newSize;
            cropState.x = Math.max(0, cropState.startCropX + actualDelta);
            cropState.y = Math.max(0, cropState.startCropY + actualDelta);
          }
          break;

        case "ne":
          // 右上角
          {
            const delta = Math.max(dx, -dy);
            const newSize = Math.max(50, Math.min(cropState.startCropSize + delta, canvas.width - cropState.startCropX));
            const actualDelta = newSize - cropState.startCropSize;
            cropState.size = newSize;
            cropState.y = Math.max(0, cropState.startCropY - actualDelta);
          }
          break;

        case "sw":
          // 左下角
          {
            const delta = Math.max(-dx, dy);
            const newSize = Math.max(50, Math.min(cropState.startCropSize + delta, canvas.height - cropState.startCropY));
            const actualDelta = newSize - cropState.startCropSize;
            cropState.size = newSize;
            cropState.x = Math.max(0, cropState.startCropX - actualDelta);
          }
          break;

        case "n":
          // 上边
          {
            const newSize = Math.max(50, cropState.startCropSize - dy);
            const actualDelta = cropState.startCropSize - newSize;
            cropState.size = newSize;
            cropState.y = Math.max(0, cropState.startCropY + actualDelta);
          }
          break;

        case "s":
          // 下边
          {
            const newSize = Math.max(50, Math.min(cropState.startCropSize + dy, canvas.height - cropState.startCropY));
            cropState.size = newSize;
          }
          break;

        case "w":
          // 左边
          {
            const newSize = Math.max(50, cropState.startCropSize - dx);
            const actualDelta = cropState.startCropSize - newSize;
            cropState.size = newSize;
            cropState.x = Math.max(0, cropState.startCropX + actualDelta);
          }
          break;

        case "e":
          // 右边
          {
            const newSize = Math.max(50, Math.min(cropState.startCropSize + dx, canvas.width - cropState.startCropX));
            cropState.size = newSize;
          }
          break;
      }

      drawCanvas();
    } else {
      // 更新鼠标样式
      if (!e.touches) {
        const hitType = getHitType(x, y);
        canvas.style.cursor = getCursorStyle(hitType);
      }
    }
  };

  // 鼠标/触摸释放
  const handleEnd = (e) => {
    e.preventDefault();
    cropState.isDragging = false;
    cropState.dragType = null;
    if (!e.touches) {
      canvas.style.cursor = "default";
    }
  };

  // 处理文件选择
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith("image/")) {
      alert("请选择图片文件");
      return;
    }

    // 读取文件
    const reader = new FileReader();
    reader.onload = (event) => {
      currentImageUrl = event.target.result;
      // 隐藏提示，显示 canvas
      const emptyHint = container.querySelector(".empty-hint");
      const canvasElement = container.querySelector("canvas");
      if (emptyHint) emptyHint.style.display = "none";
      if (canvasElement) canvasElement.style.display = "block";
      loadImage();
    };
    reader.readAsDataURL(file);
  };

  // 执行裁剪
  const handleCrop = async () => {
    if (!img) return;

    // 获取按钮元素并设置加载状态
    const cropButton = container.querySelector(".crop-button");
    if (cropButton) {
      cropButton.disabled = true;
      cropButton.textContent = "上传中...";
    }

    // 创建新的canvas用于输出裁剪后的图片
    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = cropState.size;
    outputCanvas.height = cropState.size;
    const outputCtx = outputCanvas.getContext("2d");

    // 绘制裁剪区域到新canvas
    outputCtx.drawImage(
      img,
      cropState.x,
      cropState.y,
      cropState.size,
      cropState.size,
      0,
      0,
      cropState.size,
      cropState.size
    );

    // 转换为blob
    outputCanvas.toBlob(async (blob) => {
      if (onCrop) {
        await onCrop(blob, outputCanvas.toDataURL());
      }
      
      // 恢复按钮状态
      if (cropButton) {
        cropButton.disabled = false;
        cropButton.textContent = "确认裁剪";
      }
    }, "image/png");
  };

  // 加载图片
  const loadImage = () => {
    if (!currentImageUrl) return;

    img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // 获取canvas元素
      canvas = container.querySelector("canvas");
      if (!canvas) return;

      ctx = canvas.getContext("2d");

      // 设置canvas尺寸为图片尺寸
      canvas.width = img.width;
      canvas.height = img.height;

      // 初始化裁剪区域为图片中心的正方形
      const minSize = Math.min(img.width, img.height);
      cropState.size = minSize;
      cropState.x = (img.width - minSize) / 2;
      cropState.y = (img.height - minSize) / 2;

      // 绑定鼠标事件
      canvas.addEventListener("mousedown", handleStart);
      canvas.addEventListener("mousemove", handleMove);
      canvas.addEventListener("mouseup", handleEnd);
      canvas.addEventListener("mouseleave", handleEnd);

      // 绑定触摸事件
      canvas.addEventListener("touchstart", handleStart, { passive: false });
      canvas.addEventListener("touchmove", handleMove, { passive: false });
      canvas.addEventListener("touchend", handleEnd, { passive: false });
      canvas.addEventListener("touchcancel", handleEnd, { passive: false });

      drawCanvas();
    };
    img.src = currentImageUrl;
  };

  // 文件上传输入
  const fileInput = <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />;

  // 上传按钮
  const uploadButton = (
    <Button
      onClick={() => {
        fileInput.click();
      }}
    >
      上传图片
    </Button>
  );

  // Canvas容器
  const canvasElement = (
    <canvas className="border border-gray-300 dark:border-gray-600" style={{ maxWidth: "100%", cursor: "default", display: "none" }} />
  );

  // 空白提示
  const emptyHint = (
    <div className="empty-hint flex min-h-[200px] items-center justify-center border border-gray-300 text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
      请先上传图片
    </div>
  );

  // 确认裁剪按钮
  const cropButton = <Button className="crop-button" onClick={handleCrop}>确认裁剪</Button>;

  const container = (
    <div className="flex flex-col gap-4">
      {fileInput}
      <div className="flex gap-2">{uploadButton}</div>
      {emptyHint}
      {canvasElement}
      <div className="flex justify-end">{cropButton}</div>
    </div>
  );

  return container;
}
