import { get, post } from "@src/utils/http.js";

/**
 * 获取股息预测信息
 * @returns {Promise<Object>} 股息预测数据
 */
export async function getShareBonusTest() {
  try {
    const data = await get("event/share/bonus/test");

    if (!data || data.State !== 0 || !data.Value) {
      return {
        success: false,
        message: data?.Message || "获取股息预测失败",
      };
    }

    const value = data.Value;
    return {
      success: true,
      data: {
        total: value.Total,
        temples: value.Temples,
        daily: value.Daily,
        share: value.Share,
        tax: value.Tax,
      },
    };
  } catch (error) {
    console.error("获取股息预测失败:", error);
    return {
      success: false,
      message: "网络请求失败",
    };
  }
}

/**
 * 获取注册奖励信息
 * @returns {Promise<Object>} 注册奖励信息
 */
export async function getBangumiBonus() {
  try {
    const data = await get("event/bangumi/bonus");

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Value || "获取注册奖励失败",
      };
    }

    return {
      success: true,
      message: data.Value,
    };
  } catch (error) {
    console.error("获取注册奖励失败:", error);
    return {
      success: false,
      message: "网络请求失败",
    };
  }
}

/**
 * 发送红包
 * @param {string} userName - 用户名
 * @param {number} amount - 金额
 * @param {string} message - 留言
 * @returns {Promise<Object>} 发送结果
 */
export async function sendRedPacket(userName, amount, message) {
  try {
    const data = await post(
      `event/send/${userName}/${amount}/${encodeURIComponent(message)}`,
      null
    );

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "发送失败",
      };
    }

    return {
      success: true,
      message: data?.Value || "发送成功",
    };
  } catch (error) {
    console.error("发送红包失败:", error);
    return {
      success: false,
      message: "网络请求失败",
    };
  }
}

/**
 * 检查是否是节日
 * @returns {Promise<Object>} 节日检查结果
 */
export async function checkHolidayBonus() {
  try {
    const data = await get("event/holiday/bonus/check");

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "今天不是节日。",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("检查节日失败:", error);
    return {
      success: false,
      message: "网络请求失败",
    };
  }
}

/**
 * 领取节日奖励
 * @returns {Promise<Object>} 领取结果
 */
export async function claimHolidayBonus() {
  try {
    const data = await get("event/holiday/bonus");

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "领取节日奖励失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("领取节日奖励失败:", error);
    return {
      success: false,
      message: "网络请求失败",
    };
  }
}

/**
 * 领取每日签到奖励
 * @returns {Promise<Object>} 领取结果
 */
export async function claimDailyBonus() {
  try {
    const data = await get("event/bangumi/bonus/daily");

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "领取每日签到奖励失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("领取每日签到奖励失败:", error);
    return {
      success: false,
      message: "领取每日签到奖励失败",
    };
  }
}

/**
 * 领取每周分红
 * @returns {Promise<Object>} 领取结果
 */
export async function claimWeeklyBonus() {
  try {
    const data = await get("event/share/bonus");

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "领取每周分红失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("领取每周分红失败:", error);
    return {
      success: false,
      message: "领取每周分红失败",
    };
  }
}

/**
 * 刮刮乐
 * @param {boolean} isLotus - 是否为幻想乡刮刮乐
 * @returns {Promise<Object>} 刮刮乐结果
 */
export async function scratchBonus(isLotus = false) {
  try {
    const url = isLotus ? "event/scratch/bonus2/true" : "event/scratch/bonus2";
    const data = await get(url);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "刮刮乐施法失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("刮刮乐施法失败:", error);
    return {
      success: false,
      message: "刮刮乐施法失败",
    };
  }
}

/**
 * 获取幻想乡刮刮乐已使用次数
 * @returns {Promise<Object>} 次数结果
 */
export async function getDailyEventCount(eventId) {
  try {
    const data = await get("event/daily/count/10");

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "获取幻想乡刮刮乐已使用次数失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("获取幻想乡刮刮乐已使用次数失败:", error);
    return {
      success: false,
      message: "获取幻想乡刮刮乐已使用次数失败",
    };
  }
}
