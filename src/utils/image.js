import { loadMD5 } from "./md5-loader.js";

/**
 * 将 dataURL转换为Blob
 * @param {string} dataURL - dataURL 字符串
 * @returns {Blob} Blob 对象
 */
export function dataURLtoBlob(dataURL) {
  const arr = dataURL.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * 计算字符串的MD5哈希值
 * @param {string} string - 输入字符串
 * @returns {Promise<string>} MD5哈希值
 */
export async function md5(string) {
  const md5Fn = await loadMD5();
  return md5Fn(string);
}

/**
 * 计算 dataURL的MD5哈希值
 * @param {string} dataURL - dataURL字符串
 * @returns {Promise<string>} MD5哈希值
 */
export async function hashDataURL(dataURL) {
  return md5(dataURL);
}

/**
 * 调整图片大小
 * @param {HTMLCanvasElement} sourceCanvas - 源canvas
 * @param {number} targetSize - 目标尺寸
 * @returns {string} 调整后的dataURL
 */
export function resizeImage(sourceCanvas, targetSize) {
  const canvas = document.createElement("canvas");
  canvas.width = targetSize;
  canvas.height = targetSize;

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, 0, 0, targetSize, targetSize);

  return canvas.toDataURL("image/jpeg", 0.9);
}

/**
 * 处理图片
 * @param {string} dataUrl - 原始图片的dataURL
 * @param {number} targetSize - 目标尺寸
 * @returns {Promise<{hash: string, blob: Blob, dataUrl: string}>} 处理后的结果
 */
export async function processImage(dataUrl, targetSize) {
  // 创建图片对象
  const img = new Image();
  img.src = dataUrl;
  await new Promise((resolve) => {
    img.onload = resolve;
  });
  
  // 创建canvas 绘制裁剪后的图片
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = img.width;
  sourceCanvas.height = img.height;
  const sourceCtx = sourceCanvas.getContext("2d");
  sourceCtx.drawImage(img, 0, 0);
  
  // 调整为目标尺寸
  const resizedDataUrl = resizeImage(sourceCanvas, targetSize);
  const hash = await hashDataURL(resizedDataUrl);
  const blob = dataURLtoBlob(resizedDataUrl);
  
  return { hash, blob, dataUrl: resizedDataUrl };
}
