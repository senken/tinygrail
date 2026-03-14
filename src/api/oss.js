import { post } from "@src/utils/http.js";

// OSS基础URL
const OSS_BASE_URL = "https://tinygrail.oss-cn-hangzhou.aliyuncs.com";

/**
 * 构建 OSS URL
 * @param {string} path - 路径
 * @param {string} hash - 文件哈希
 * @param {string} extension - 文件扩展名
 * @returns {string} 完整的OSSURL
 */
export function buildOssUrl(path, hash, extension = "jpg") {
  return `${OSS_BASE_URL}/${path}/${hash}.${extension}`;
}

/**
 * 获取 OSS 签名
 * @param {string} path - 路径
 * @param {string} hash - 文件哈希
 * @param {string} type - 文件类型（encodeURIComponent）
 * @returns {Promise<Object>} OSS签名信息
 */
export async function getOssSignature(path, hash, type) {
  try {
    const data = await post(`chara/oss/sign/${path}/${hash}/${type}`);

    if (!data || data.State !== 0 || !data.Value) {
      return {
        success: false,
        message: data?.Message || "获取OSS签名失败",
      };
    }

    return {
      success: true,
      data: {
        key: data.Value.Key,
        sign: data.Value.Sign,
        date: data.Value.Date,
      },
    };
  } catch (error) {
    console.error("获取OSS签名失败:", error);
    return {
      success: false,
      message: "获取OSS签名失败",
    };
  }
}

/**
 * 上传文件到OSS
 * @param {string} url - OSS URL
 * @param {Blob} blob - 文件 blob
 * @param {Object} signature - OSS 签名信息
 * @returns {Promise<Object>} 上传结果
 */
export async function uploadToOss(url, blob, signature) {
  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `OSS ${signature.key}:${signature.sign}`,
        "x-oss-date": signature.date,
      },
      body: blob,
    });

    if (!response.ok) {
      return {
        success: false,
        message: "上传文件失败",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("上传文件到OSS失败:", error);
    return {
      success: false,
      message: "上传文件到OSS失败",
    };
  }
}
