import { post } from "@src/utils/http.js";

/**
 * 精炼角色
 * @param {number} characterId - 角色ID
 * @returns {Promise<Object>} 精炼结果
 */
export async function refineCharacter(characterId) {
  try {
    const data = await post(`magic/refine/${characterId}`);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "精炼失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("精炼失败:", error);
    return {
      success: false,
      message: "精炼失败",
    };
  }
}

/**
 * 虚空道标
 * @param {number} fromCharaId - 源角色ID（圣殿角色）
 * @param {number} toCharaId - 目标角色ID
 * @returns {Promise<Object>} 虚空道标结果
 */
export async function guidepost(fromCharaId, toCharaId) {
  try {
    const data = await post(`magic/guidepost/${fromCharaId}/${toCharaId}`);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "虚空道标失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("虚空道标失败:", error);
    return {
      success: false,
      message: "虚空道标失败",
    };
  }
}

/**
 * 鲤鱼之眼
 * @param {number} fromCharaId - 源角色ID（圣殿角色）
 * @param {number} toCharaId - 目标角色ID
 * @returns {Promise<Object>} 鲤鱼之眼结果
 */
export async function fisheye(fromCharaId, toCharaId) {
  try {
    const data = await post(`magic/fisheye/${fromCharaId}/${toCharaId}`);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "鲤鱼之眼失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("鲤鱼之眼失败:", error);
    return {
      success: false,
      message: "鲤鱼之眼失败",
    };
  }
}

/**
 * 星光碎片
 * @param {number} fromCharaId - 源角色ID
 * @param {number} toCharaId - 目标角色ID（圣殿角色）
 * @param {number} amount - 数量
 * @returns {Promise<Object>} 星光碎片结果
 */
export async function stardust(fromCharaId, toCharaId, amount) {
  try {
    const data = await post(`magic/stardust/${fromCharaId}/${toCharaId}/${amount}/false`);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "星光碎片失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("星光碎片失败:", error);
    return {
      success: false,
      message: "星光碎片失败",
    };
  }
}

/**
 * 闪光结晶
 * @param {number} fromCharaId - 源角色ID（圣殿角色）
 * @param {number} toCharaId - 目标角色ID
 * @returns {Promise<Object>} 闪光结晶结果
 */
export async function starbreak(fromCharaId, toCharaId) {
  try {
    const data = await post(`magic/starbreak/${fromCharaId}/${toCharaId}`);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "闪光结晶失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("闪光结晶失败:", error);
    return {
      success: false,
      message: "闪光结晶失败",
    };
  }
}

/**
 * 混沌魔方
 * @param {number} templeId - 圣殿ID
 * @returns {Promise<Object>} 混沌魔方结果
 */
export async function chaosCube(templeId) {
  try {
    const data = await post(`magic/chaos/${templeId}`);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "混沌魔方使用失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("混沌魔方使用失败:", error);
    return {
      success: false,
      message: "混沌魔方使用失败",
    };
  }
}
