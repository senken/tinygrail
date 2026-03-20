import { get, post } from "@src/utils/http.js";
import { unescapeHtml } from "@src/utils/escape.js";
import { performBangumiAuth } from "@src/utils/session.js";

/**
 * 获取用户资产信息
 * @param {string} [username] - 可选的用户名，如果不传则获取当前登录用户的资产
 * @returns {Promise<Object>} 用户资产信息
 */
export async function getUserAssets(username) {
  // 处理授权失败的函数
  const handleAuthFailure = () => {
    if (!username) {
      performBangumiAuth(() => {
        // 授权成功后重新加载页面
        window.location.reload();
      });
    }
  };

  try {
    const url = username ? `chara/user/assets/${username}` : "chara/user/assets";
    const data = await get(url);

    if (!data || data.State !== 0 || !data.Value) {
      handleAuthFailure();
      return {
        success: false,
        message: data?.Message || "获取用户资产失败",
      };
    }

    const value = data.Value;
    const result = {
      id: value.Id,
      name: value.Name,
      nickname: unescapeHtml(value.Nickname),
      avatar: value.Avatar,
      balance: value.Balance,
      assets: value.Assets,
      type: value.Type,
      state: value.State,
      lastIndex: value.LastIndex,
      showDaily: !!value.ShowDaily,
      showWeekly: !!value.ShowWeekly,
    };

    // 如果是获取自己的资产，缓存数据
    if (!username) {
      try {
        localStorage.setItem("tinygrail:user-assets", JSON.stringify(result));
      } catch (e) {
        console.warn("缓存用户资产失败:", e);
      }
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("获取用户资产失败:", error);
    handleAuthFailure();
    return {
      success: false,
      message: "获取用户资产失败",
    };
  }
}

/**
 * 退出登录
 * @returns {Promise<Object>} 退出结果
 */
export async function logout() {
  try {
    const data = await post("account/logout");

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "退出登录失败",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("退出登录失败:", error);
    return {
      success: false,
      message: "退出登录失败",
    };
  }
}

/**
 * 获取用户红包记录
 * @param {string} username - 用户名
 * @param {number} [page=1] - 页数
 * @param {number} [pageSize=10] - 每页数量
 * @returns {Promise<Object>} 红包记录
 */
export async function getUserSendLog(username, page = 1, pageSize = 10) {
  try {
    const url = `chara/user/send/log/${username}/${page}/${pageSize}`;
    const data = await get(url);

    if (!data || data.State !== 0 || !data.Value) {
      return {
        success: false,
        message: data?.Message || "获取用户红包记录失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("获取用户红包记录失败:", error);
    return {
      success: false,
      message: "获取用户红包记录失败",
    };
  }
}

/**
 * 获取用户资金日志
 * @param {number} [page=1] - 页数
 * @param {number} [pageSize=50] - 每页数量
 * @returns {Promise<Object>} 资金日志
 */
export async function getUserBalanceLog(page = 1, pageSize = 50) {
  try {
    const url = `chara/user/balance/${page}/${pageSize}`;
    const data = await get(url);

    if (!data || data.State !== 0 || !data.Value) {
      return {
        success: false,
        message: data?.Message || "获取资金日志失败",
      };
    }

    return {
      success: true,
      data: {
        items: data.Value.Items || [],
        currentPage: data.Value.CurrentPage,
        totalPages: data.Value.TotalPages,
        totalItems: data.Value.TotalItems,
        itemsPerPage: data.Value.ItemsPerPage,
      },
    };
  } catch (error) {
    console.error("获取资金日志失败:", error);
    return {
      success: false,
      message: "获取资金日志失败",
    };
  }
}

/**
 * 获取用户拍卖列表
 * @param {number} [page=1] - 页数
 * @param {number} [pageSize=50] - 每页数量
 * @returns {Promise<Object>} 拍卖列表
 */
export async function getUserAuctions(page = 1, pageSize = 50) {
  try {
    const url = `chara/user/auction/${page}/${pageSize}`;
    const data = await get(url);

    if (!data || data.State !== 0 || !data.Value) {
      return {
        success: false,
        message: data?.Message || "获取拍卖列表失败",
      };
    }

    return {
      success: true,
      data: {
        items: data.Value.Items || [],
        currentPage: data.Value.CurrentPage,
        totalPages: data.Value.TotalPages,
        totalItems: data.Value.TotalItems,
        itemsPerPage: data.Value.ItemsPerPage,
      },
    };
  } catch (error) {
    console.error("获取拍卖列表失败:", error);
    return {
      success: false,
      message: "获取拍卖列表失败",
    };
  }
}

/**
 * 封禁用户
 * @param {string} username - 用户名
 * @returns {Promise<Object>} 封禁结果
 */
export async function banUser(username) {
  try {
    const url = `chara/user/ban/${username}`;
    const data = await post(url);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "封禁用户失败",
      };
    }

    return {
      success: true,
      message: "封禁用户成功",
    };
  } catch (error) {
    console.error("封禁用户失败:", error);
    return {
      success: false,
      message: "封禁用户失败",
    };
  }
}

/**
 * 解除封禁用户
 * @param {string} username - 用户名
 * @returns {Promise<Object>} 解封结果
 */
export async function unbanUser(username) {
  try {
    const url = `chara/user/unban/${username}`;
    const data = await get(url);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "解除封禁失败",
      };
    }

    return {
      success: true,
      message: "解除封禁成功",
    };
  } catch (error) {
    console.error("解除封禁失败:", error);
    return {
      success: false,
      message: "解除封禁失败",
    };
  }
}

/**
 * 获取用户交易记录
 * @param {number} userId - 用户ID
 * @param {number} [page=1] - 页数
 * @param {number} [pageSize=48] - 每页数量
 * @returns {Promise<Object>} 交易记录
 */
export async function getUserTradeHistory(userId, page = 1, pageSize = 48) {
  try {
    const url = `chara/user/history/${userId}/${page}/${pageSize}`;
    const data = await get(url);

    if (!data || data.State !== 0 || !data.Value) {
      return {
        success: false,
        message: data?.Message || "获取用户交易记录失败",
      };
    }

    return {
      success: true,
      data: {
        items: data.Value.Items || [],
        currentPage: data.Value.CurrentPage,
        totalPages: data.Value.TotalPages,
        totalItems: data.Value.TotalItems,
        itemsPerPage: data.Value.ItemsPerPage,
      },
    };
  } catch (error) {
    console.error("获取用户交易记录失败:", error);
    return {
      success: false,
      message: "获取用户交易记录失败",
    };
  }
}
