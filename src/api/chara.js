import { get, post } from "@src/utils/http.js";

/**
 * 获取用户圣殿连接列表
 * @param {string} username - 用户名
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise<Object>} 圣殿连接列表
 */
export async function getUserCharaLinks(username, page = 1, pageSize = 12) {
  try {
    const data = await post(`chara/user/link/${username}/${page}/${pageSize}`);

    if (!data || data.State !== 0 || !data.Value) {
      return {
        success: false,
        message: "获取连接列表失败",
      };
    }

    const value = data.Value;
    return {
      success: true,
      data: {
        currentPage: value.CurrentPage,
        totalPages: value.TotalPages,
        totalItems: value.TotalItems,
        itemsPerPage: value.ItemsPerPage,
        items: value.Items || [],
      },
    };
  } catch (error) {
    console.error("获取连接列表失败:", error);
    return {
      success: false,
      message: "获取连接列表失败",
    };
  }
}

/**
 * 获取用户圣殿列表
 * @param {string} username - 用户名
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @param {string} keyword - 搜索关键字（可选）
 * @returns {Promise<Object>} 圣殿列表
 */
export async function getUserTemples(username, page = 1, pageSize = 24, keyword = "") {
  try {
    let url = `chara/user/temple/${username}/${page}/${pageSize}`;
    if (keyword) {
      url += `?keyword=${encodeURIComponent(keyword)}`;
    }
    
    const data = await get(url);

    if (!data || data.State !== 0 || !data.Value) {
      return {
        success: false,
        message: "获取圣殿列表失败",
      };
    }

    const value = data.Value;
    return {
      success: true,
      data: {
        currentPage: value.CurrentPage,
        totalPages: value.TotalPages,
        totalItems: value.TotalItems,
        itemsPerPage: value.ItemsPerPage,
        items: value.Items || [],
      },
    };
  } catch (error) {
    console.error("获取圣殿列表失败:", error);
    return {
      success: false,
      message: "获取圣殿列表失败",
    };
  }
}

/**
 * 获取用户角色列表
 * @param {string} username - 用户名
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @param {string} sort - 排序方式（可选，'asc'或'desc'）
 * @returns {Promise<Object>} 角色列表
 */
export async function getUserCharas(username, page = 1, pageSize = 48, sort = "") {
  try {
    let url = `chara/user/chara/${username}/${page}/${pageSize}`;
    if (sort) {
      url += `?sort=${encodeURIComponent(sort)}`;
    }
    
    const data = await post(url);

    if (!data || data.State !== 0 || !data.Value) {
      return {
        success: false,
        message: "获取角色列表失败",
      };
    }

    const value = data.Value;
    return {
      success: true,
      data: {
        currentPage: value.CurrentPage,
        totalPages: value.TotalPages,
        totalItems: value.TotalItems,
        itemsPerPage: value.ItemsPerPage,
        items: value.Items || [],
      },
    };
  } catch (error) {
    console.error("获取角色列表失败:", error);
    return {
      success: false,
      message: "获取角色列表失败",
    };
  }
}

/**
 * 获取用户ICO列表
 * @param {string} username - 用户名
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise<Object>} ICO 列表
 */
export async function getUserICOs(username, page = 1, pageSize = 48) {
  try {
    const data = await post(`chara/user/initial/${username}/${page}/${pageSize}`);

    if (!data || data.State !== 0 || !data.Value) {
      return {
        success: false,
        message: "获取ICO列表失败",
      };
    }

    const value = data.Value;
    return {
      success: true,
      data: {
        currentPage: value.CurrentPage,
        totalPages: value.TotalPages,
        totalItems: value.TotalItems,
        itemsPerPage: value.ItemsPerPage,
        items: value.Items || [],
      },
    };
  } catch (error) {
    console.error("获取ICO列表失败:", error);
    return {
      success: false,
      message: "获取ICO列表失败",
    };
  }
}

/**
 * 获取角色信息
 * @param {number} characterId - 角色ID
 * @returns {Promise<Object>} 角色信息
 */
export async function getCharacter(characterId) {
  try {
    const data = await get(`chara/${characterId}`);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "获取角色信息失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("获取角色信息失败:", error);
    return {
      success: false,
      message: "获取角色信息失败",
    };
  }
}

/**
 * 获取角色奖池数量
 * @param {number} characterId - 角色ID
 * @returns {Promise<Object>} 奖池数量
 */
export async function getCharacterPool(characterId) {
  try {
    const data = await get(`chara/pool/${characterId}`);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: "获取奖池数量失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("获取奖池数量失败:", error);
    return {
      success: false,
      message: "获取奖池数量失败",
    };
  }
}

/**
 * 获取当前用户的角色数据
 * @param {number} characterId - 角色ID
 * @returns {Promise<Object>} 用户角色数据
 */
export async function getUserCharacter(characterId) {
  try {
    const data = await get(`chara/user/${characterId}`);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "获取用户角色数据失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("获取用户角色数据失败:", error);
    return {
      success: false,
      message: "获取用户角色数据失败",
    };
  }
}

/**
 * 获取指定用户的角色数据
 * @param {number} characterId - 角色ID
 * @param {string} username - 用户名
 * @returns {Promise<Object>} 用户角色数据
 */
export async function getUserCharacterByUsername(characterId, username) {
  try {
    const data = await get(`chara/user/${characterId}/${username}/false`);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "获取用户角色数据失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("获取用户角色数据失败:", error);
    return {
      success: false,
      message: "获取用户角色数据失败",
    };
  }
}

/**
 * 获取角色市场深度数据
 * @param {number} characterId - 角色ID
 * @returns {Promise<Object>} 市场深度数据
 */
export async function getCharacterDepth(characterId) {
  try {
    const data = await get(`chara/depth/${characterId}`);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: "获取市场深度数据失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("获取市场深度数据失败:", error);
    return {
      success: false,
      message: "获取市场深度数据失败",
    };
  }
}

/**
 * 买入角色
 * @param {number} characterId - 角色ID
 * @param {number} price - 价格
 * @param {number} amount - 数量
 * @param {boolean} isIceberg - 是否为冰山委托
 * @returns {Promise<Object>} 买入结果
 */
export async function bidCharacter(characterId, price, amount, isIceberg = false) {
  try {
    const url = isIceberg
      ? `chara/bid/${characterId}/${price}/${amount}/true`
      : `chara/bid/${characterId}/${price}/${amount}`;
    const data = await post(url);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "买入失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("买入失败:", error);
    return {
      success: false,
      message: "买入失败",
    };
  }
}

/**
 * 卖出角色
 * @param {number} characterId - 角色ID
 * @param {number} price - 价格
 * @param {number} amount - 数量
 * @param {boolean} isIceberg - 是否为冰山委托
 * @returns {Promise<Object>} 卖出结果
 */
export async function askCharacter(characterId, price, amount, isIceberg = false) {
  try {
    const url = isIceberg
      ? `chara/ask/${characterId}/${price}/${amount}/true`
      : `chara/ask/${characterId}/${price}/${amount}`;
    const data = await post(url);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "卖出失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("卖出失败:", error);
    return {
      success: false,
      message: "卖出失败",
    };
  }
}

/**
 * 取消买入委托
 * @param {number} bidId - 买入委托ID
 * @returns {Promise<Object>} 取消结果
 */
export async function cancelBid(bidId) {
  try {
    const data = await post(`chara/bid/cancel/${bidId}`);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "取消买入委托失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("取消买入委托失败:", error);
    return {
      success: false,
      message: "取消买入委托失败",
    };
  }
}

/**
 * 获取角色LINK数据
 * @param {number} characterId - 角色ID
 * @returns {Promise<Object>} LINK数据
 */
export async function getCharacterLinks(characterId) {
  try {
    const data = await get(`chara/links/${characterId}`);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: "获取LINK数据失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("获取LINK数据失败:", error);
    return {
      success: false,
      message: "获取LINK数据失败",
    };
  }
}

/**
 * 取消卖出委托
 * @param {number} askId - 卖出委托ID
 * @returns {Promise<Object>} 取消结果
 */
export async function cancelAsk(askId) {
  try {
    const data = await post(`chara/ask/cancel/${askId}`);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "取消卖出委托失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("取消卖出委托失败:", error);
    return {
      success: false,
      message: "取消卖出委托失败",
    };
  }
}

/**
 * 获取角色圣殿数据
 * @param {number} characterId - 角色ID
 * @returns {Promise<Object>} 圣殿数据
 */
export async function getCharacterTemples(characterId) {
  try {
    const data = await get(`chara/temple/${characterId}`);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: "获取圣殿数据失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("获取圣殿数据失败:", error);
    return {
      success: false,
      message: "获取圣殿数据失败",
    };
  }
}

/**
 * 获取角色的持股用户列表
 * @param {number} characterId - 角色ID
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise<Object>} 持股用户列表
 */
export async function getCharacterUsers(characterId, page = 1, pageSize = 24) {
  try {
    const data = await get(`chara/users/${characterId}/${page}/${pageSize}`);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: "获取持股用户列表失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("获取持股用户列表失败:", error);
    return {
      success: false,
      message: "获取持股用户列表失败",
    };
  }
}

/**
 * 获取ICO参与者列表
 * @param {number} characterId - 角色ID
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise<Object>} ICO参与者列表
 */
export async function getICOUsers(characterId, page = 1, pageSize = 24) {
  try {
    const data = await get(`chara/initial/users/${characterId}/${page}/${pageSize}`);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: "获取ICO参与者列表失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("获取ICO参与者列表失败:", error);
    return {
      success: false,
      message: "获取ICO参与者列表失败",
    };
  }
}

/**
 * 获取当前用户ICO注资信息
 * @param {number} icoId - ICO ID
 * @returns {Promise<Object>} 当前用户ICO注资信息
 */
export async function getUserICOInfo(icoId) {
  try {
    const data = await get(`chara/initial/${icoId}`);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: "获取ICO注资信息失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("获取ICO注资信息失败:", error);
    return {
      success: false,
      message: "获取ICO注资信息失败",
    };
  }
}

/**
 * ICO注资
 * @param {number} icoId - ICO ID
 * @param {number} amount - 注资金额
 * @returns {Promise<Object>} 注资结果
 */
export async function joinICO(icoId, amount) {
  try {
    const data = await post(`chara/join/${icoId}/${amount}`);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "注资失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("注资失败:", error);
    return {
      success: false,
      message: "注资失败",
    };
  }
}

/**
 * 启动ICO
 * @param {number} characterId - 角色ID
 * @param {number} amount - 初始注资金额
 * @returns {Promise<Object>} 启动结果
 */
export async function initICO(characterId, amount) {
  try {
    const data = await post(`chara/init/${characterId}/${amount}`);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "启动ICO失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("启动ICO失败:", error);
    return {
      success: false,
      message: "启动ICO失败",
    };
  }
}
/**
 * 献祭角色（资产重组或股权融资）
 * @param {number} characterId - 角色ID
 * @param {number} amount - 数量
 * @param {boolean} isEquity - true为股权融资，false为资产重组
 * @returns {Promise<Object>} 献祭结果
 */
export async function sacrificeCharacter(characterId, amount, isEquity = false) {
  try {
    const data = await post(`chara/sacrifice/${characterId}/${amount}/${isEquity}`);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "献祭失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("献祭失败:", error);
    return {
      success: false,
      message: "献祭失败",
    };
  }
}

/**
 * 查看拍卖列表
 * @param {number[]} characterIds - 角色ID数组
 * @returns {Promise<Object>} 拍卖列表
 */
export async function getAuctionList(characterIds) {
  try {
    const data = await post("chara/auction/list", characterIds);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "获取拍卖列表失败",
      };
    }

    return {
      success: true,
      data: data.Value,
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
 * 拍卖角色
 * @param {number} characterId - 角色ID
 * @param {number} price - 价格
 * @param {number} amount - 数量
 * @returns {Promise<Object>} 拍卖结果
 */
export async function auctionCharacter(characterId, price, amount) {
  try {
    const data = await post(`chara/auction/${characterId}/${price}/${amount}`);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "拍卖失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("拍卖失败:", error);
    return {
      success: false,
      message: "拍卖失败",
    };
  }
}

/**
 * 获取往期拍卖列表
 * @param {number} characterId - 角色ID
 * @param {number} page - 页码
 * @returns {Promise<Object>} 往期拍卖列表
 */
export async function getAuctionHistory(characterId, page = 1) {
  try {
    const data = await get(`chara/auction/list/${characterId}/${page}`);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "获取往期拍卖列表失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("获取往期拍卖列表失败:", error);
    return {
      success: false,
      message: "获取往期拍卖列表失败",
    };
  }
}

/**
 * 更换角色头像
 * @param {number} characterId - 角色ID
 * @param {string} avatarUrl - 头像URL
 * @returns {Promise<Object>} 更换结果
 */
export async function changeCharacterAvatar(characterId, avatarUrl) {
  try {
    const data = await post(`chara/avatar/${characterId}`, avatarUrl);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "更换头像失败",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("更换头像失败:", error);
    return {
      success: false,
      message: "更换头像失败",
    };
  }
}

/**
 * 获取角色图表数据
 * @param {number} characterId - 角色ID
 * @param {string} date - 日期
 * @returns {Promise<Object>} 图表数据
 */
export async function getCharacterCharts(characterId, date = '2019-08-08') {
  try {
    const data = await get(`chara/charts/${characterId}/${date}`);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "获取图表数据失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("获取图表数据失败:", error);
    return {
      success: false,
      message: "获取图表数据失败",
    };
  }
}

/**
 * 获取通天塔数据
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise<Object>} 通天塔数据
 */
export async function getBabelTower(page = 1, pageSize = 24) {
  try {
    const data = await get(`chara/babel/${page}/${pageSize}`);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "获取通天塔数据失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("获取通天塔数据失败:", error);
    return {
      success: false,
      message: "获取通天塔数据失败",
    };
  }
}

/**
 * 获取通天塔日志
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise<Object>} 通天塔日志数据
 */
export async function getStarLog(page = 1, pageSize = 30) {
  try {
    const data = await get(`chara/star/log/${page}/${pageSize}`);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "获取通天塔日志失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("获取通天塔日志失败:", error);
    return {
      success: false,
      message: "获取通天塔日志失败",
    };
  }
}

/**
 * 修改圣殿封面
 * @param {number} characterId - 角色ID
 * @param {string} coverUrl - 封面URL
 * @returns {Promise<Object>} 修改结果
 */
export async function changeTempleCover(characterId, coverUrl) {
  try {
    const data = await post(`chara/temple/cover/${characterId}`, coverUrl);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "修改封面失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("修改封面失败:", error);
    return {
      success: false,
      message: "修改封面失败",
    };
  }
}

/**
 * 重置圣殿封面
 * @param {number} characterId - 角色ID
 * @param {number} userId - 用户ID
 * @returns {Promise<Object>} 重置结果
 */
export async function resetTempleCover(characterId, userId) {
  try {
    const data = await post(`chara/temple/cover/reset/${characterId}/${userId}`, null);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "重置封面失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("重置封面失败:", error);
    return {
      success: false,
      message: "重置封面失败",
    };
  }
}

/**
 * 修改圣殿台词
 * @param {number} characterId - 角色ID
 * @param {string} line - 台词内容
 * @returns {Promise<Object>} 修改结果
 */
export async function changeTempleLine(characterId, line) {
  try {
    const data = await post(`chara/temple/line/${characterId}`, line);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "修改台词失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("修改台词失败:", error);
    return {
      success: false,
      message: "修改台词失败",
    };
  }
}

/**
 * 创建圣殿LINK
 * @param {number} characterId1 - 第一个角色ID
 * @param {number} characterId2 - 第二个角色ID
 * @returns {Promise<Object>} 创建结果
 */
export async function linkTemples(characterId1, characterId2) {
  try {
    const data = await post(`chara/link/${characterId1}/${characterId2}`);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "链接失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("链接失败:", error);
    return {
      success: false,
      message: "链接失败",
    };
  }
}

/**
 * 搜索角色
 * @param {string} keyword - 搜索关键字
 * @returns {Promise<Object>} 搜索结果
 */
export async function searchCharacter(keyword) {
  try {
    const data = await get(`chara/search/character?keyword=${encodeURIComponent(keyword)}`);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "搜索角色失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("搜索角色失败:", error);
    return {
      success: false,
      message: "搜索角色失败",
    };
  }
}

/**
 * 转化星之力
 * @param {number} characterId - 角色ID
 * @param {number} count - 数量
 * @returns {Promise<Object>} 转化结果
 */
export async function convertStarForces(characterId, count) {
  try {
    const data = await post(`chara/star/${characterId}/${count}`);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "转化星之力失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("转化星之力失败:", error);
    return {
      success: false,
      message: "转化星之力失败",
    };
  }
}

/**
 * 拆除圣殿
 * @param {number} characterId - 角色ID
 * @returns {Promise<Object>} 拆除结果
 */
export async function destroyTemple(characterId) {
  try {
    const data = await post(`chara/temple/destroy/${characterId}`);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "拆除圣殿失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("拆除圣殿失败:", error);
    return {
      success: false,
      message: "拆除圣殿失败",
    };
  }
}

/**
 * 批量获取角色信息
 * @param {Array<number>} characterIds - 角色ID数组
 * @returns {Promise<Object>} 角色信息列表
 */
export async function getCharacterList(characterIds) {
  try {
    if (!Array.isArray(characterIds) || characterIds.length === 0) {
      return {
        success: false,
        message: "角色ID数组不能为空",
      };
    }

    const data = await post("chara/list", characterIds);

    if (!data || data.State !== 0 || !data.Value) {
      return {
        success: false,
        message: data?.Message || "获取角色信息失败",
      };
    }

    return {
      success: true,
      data: data.Value || [],
    };
  } catch (error) {
    console.error("获取角色信息失败:", error);
    return {
      success: false,
      message: "获取角色信息失败",
    };
  }
}

/**
 * 取消拍卖
 * @param {number} auctionId - 拍卖ID
 * @returns {Promise<Object>} 取消结果
 */
export async function cancelAuction(auctionId) {
  try {
    const data = await post(`chara/auction/cancel/${auctionId}`, null);

    if (!data || data.State !== 0) {
      return {
        success: false,
        message: data?.Message || "取消竞拍失败",
      };
    }

    return {
      success: true,
      message: "取消竞拍成功",
    };
  } catch (error) {
    console.error("取消竞拍失败:", error);
    return {
      success: false,
      message: "取消竞拍失败",
    };
  }
}

/**
 * 获取买单列表
 * @param {number} [page=1] - 页码
 * @param {number} [pageSize=50] - 每页数量
 * @returns {Promise<Object>} 买单列表
 */
export async function getBidsList(page = 1, pageSize = 50) {
  try {
    const data = await get(`chara/bids/0/${page}/${pageSize}`);

    if (!data || data.State !== 0 || !data.Value) {
      return {
        success: false,
        message: data?.Message || "获取买单列表失败",
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
    console.error("获取买单列表失败:", error);
    return {
      success: false,
      message: "获取买单列表失败",
    };
  }
}

/**
 * 获取卖单列表
 * @param {number} [page=1] - 页码
 * @param {number} [pageSize=50] - 每页数量
 * @returns {Promise<Object>} 卖单列表
 */
export async function getAsksList(page = 1, pageSize = 50) {
  try {
    const data = await get(`chara/asks/0/${page}/${pageSize}`);

    if (!data || data.State !== 0 || !data.Value) {
      return {
        success: false,
        message: data?.Message || "获取卖单列表失败",
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
    console.error("获取卖单列表失败:", error);
    return {
      success: false,
      message: "获取卖单列表失败",
    };
  }
}

/**
 * 获取用户道具列表
 * @param {number} [page=1] - 页码
 * @param {number} [pageSize=50] - 每页数量
 * @returns {Promise<Object>} 道具列表
 */
export async function getUserItems(page = 1, pageSize = 50) {
  try {
    const data = await get(`chara/user/item/0/${page}/${pageSize}`);

    if (!data || data.State !== 0 || !data.Value) {
      return {
        success: false,
        message: data?.Message || "获取道具列表失败",
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
    console.error("获取道具列表失败:", error);
    return {
      success: false,
      message: "获取道具列表失败",
    };
  }
}

/**
 * 获取最近活跃角色列表
 * @param {number} [page=1] - 页码
 * @param {number} [pageSize=50] - 每页数量
 * @returns {Promise<Object>} 最近活跃角色列表
 */
export async function getRecentCharacters(page = 1, pageSize = 50) {
  try {
    const data = await get(`chara/recent/${page}/${pageSize}`);

    if (!data || data.State !== 0 || !data.Value) {
      return {
        success: false,
        message: data?.Message || "获取最近活跃角色失败",
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
    console.error("获取最近活跃角色失败:", error);
    return {
      success: false,
      message: "获取最近活跃角色失败",
    };
  }
}

/**
 * 获取每周萌王数据
 * @returns {Promise<Object>} 每周萌王数据
 */
export async function getTopWeek() {
  try {
    const data = await get("chara/topweek");

    if (!data || data.State !== 0 || !data.Value) {
      return {
        success: false,
        message: data?.Message || "获取每周萌王失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("获取每周萌王失败:", error);
    return {
      success: false,
      message: "获取每周萌王失败",
    };
  }
}

/**
 * 获取往期萌王历史记录
 * @param {number} [page=1] - 页码
 * @param {number} [pageSize=12] - 每页数量
 * @returns {Promise<Object>} 往期萌王历史记录
 */
export async function getTopWeekHistory(page = 1, pageSize = 12) {
  try {
    const data = await get(`chara/topweek/history/${page}/${pageSize}`);

    if (!data || data.State !== 0 || !data.Value) {
      return {
        success: false,
        message: data?.Message || "获取往期萌王失败",
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
    console.error("获取往期萌王失败:", error);
    return {
      success: false,
      message: "获取往期萌王失败",
    };
  }
}

/**
 * 获取最新连接
 * @param {number} [page=1] - 页码
 * @param {number} [pageSize=24] - 每页数量
 * @returns {Promise<Object>} 最新连接列表
 */
export async function getLatestLinks(page = 1, pageSize = 24) {
  try {
    const data = await get(`chara/link/last/${page}/${pageSize}`);

    if (!data || data.State !== 0 || !data.Value) {
      return {
        success: false,
        message: data?.Message || "获取最新连接失败",
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
    console.error("获取最新连接失败:", error);
    return {
      success: false,
      message: "获取最新连接失败",
    };
  }
}

/**
 * 获取最新圣殿
 * @param {number} [page=1] - 页码
 * @param {number} [pageSize=24] - 每页数量
 * @returns {Promise<Object>} 最新圣殿列表
 */
export async function getLatestTemples(page = 1, pageSize = 24) {
  try {
    const data = await get(`chara/temple/last/${page}/${pageSize}`);

    if (!data || data.State !== 0 || !data.Value) {
      return {
        success: false,
        message: data?.Message || "获取最新圣殿失败",
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
    console.error("获取最新圣殿失败:", error);
    return {
      success: false,
      message: "获取最新圣殿失败",
    };
  }
}

/**
 * 获取精炼排行列表
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise<Object>} 精炼排行列表
 */
export async function getRefineRank(page = 1, pageSize = 24) {
  try {
    const data = await get(`chara/refine/temple/${page}/${pageSize}`);

    if (!data || data.State !== 0 || !data.Value) {
      return {
        success: false,
        message: "获取精炼排行失败",
      };
    }

    const value = data.Value;
    return {
      success: true,
      data: {
        currentPage: value.CurrentPage,
        totalPages: value.TotalPages,
        totalItems: value.TotalItems,
        itemsPerPage: value.ItemsPerPage,
        items: value.Items || [],
      },
    };
  } catch (error) {
    console.error("获取精炼排行失败:", error);
    return {
      success: false,
      message: "获取精炼排行失败",
    };
  }
}
/**
 * 获取用户排行列表
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise<Object>} 用户排行列表
 */
export async function getUserRank(page = 1, pageSize = 24) {
  try {
    const data = await get(`chara/top/${page}/${pageSize}`);

    if (!data || data.State !== 0 || !Array.isArray(data.Value)) {
      return {
        success: false,
        message: "获取用户排行失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("获取用户排行失败:", error);
    return {
      success: false,
      message: "获取用户排行失败",
    };
  }
}
/**
 * 获取最高股息列表
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise<Object>} 最高股息列表
 */
export async function getRateRank(page = 1, pageSize = 20) {
  try {
    const data = await get(`chara/msrc/${page}/${pageSize}`);

    if (!data || data.State !== 0 || !Array.isArray(data.Value)) {
      return {
        success: false,
        message: "获取最高股息失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("获取最高股息失败:", error);
    return {
      success: false,
      message: "获取最高股息失败",
    };
  }
}
/**
 * 获取最高市值列表
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise<Object>} 最高市值列表
 */
export async function getMarketValueRank(page = 1, pageSize = 20) {
  try {
    const data = await get(`chara/mvc/${page}/${pageSize}`);

    if (!data || data.State !== 0 || !Array.isArray(data.Value)) {
      return {
        success: false,
        message: "获取最高市值失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("获取最高市值失败:", error);
    return {
      success: false,
      message: "获取最高市值失败",
    };
  }
}

/**
 * 获取最大涨幅列表
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise<Object>} 最大涨幅列表
 */
export async function getMaxRiseRank(page = 1, pageSize = 20) {
  try {
    const data = await get(`chara/mrc/${page}/${pageSize}`);

    if (!data || data.State !== 0 || !Array.isArray(data.Value)) {
      return {
        success: false,
        message: "获取最大涨幅失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("获取最大涨幅失败:", error);
    return {
      success: false,
      message: "获取最大涨幅失败",
    };
  }
}

/**
 * 获取最大跌幅列表
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise<Object>} 最大跌幅列表
 */
export async function getMaxFallRank(page = 1, pageSize = 20) {
  try {
    const data = await get(`chara/mfc/${page}/${pageSize}`);

    if (!data || data.State !== 0 || !Array.isArray(data.Value)) {
      return {
        success: false,
        message: "获取最大跌幅失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("获取最大跌幅失败:", error);
    return {
      success: false,
      message: "获取最大跌幅失败",
    };
  }
}

/**
 * 获取ST角色列表
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise<Object>} ST角色列表
 */
export async function getDelistCharas(page = 1, pageSize = 24) {
  try {
    const data = await post(`chara/delist/chara/${page}/${pageSize}`);

    if (!data || data.State !== 0 || !data.Value) {
      return {
        success: false,
        message: "获取ST角色列表失败",
      };
    }

    const value = data.Value;
    return {
      success: true,
      data: {
        currentPage: value.CurrentPage,
        totalPages: value.TotalPages,
        totalItems: value.TotalItems,
        itemsPerPage: value.ItemsPerPage,
        items: value.Items || [],
      },
    };
  } catch (error) {
    console.error("获取ST角色列表失败:", error);
    return {
      success: false,
      message: "获取ST角色列表失败",
    };
  }
}

/**
 * 获取ICO最多资金列表
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise<Object>} ICO最多资金列表
 */
export async function getMaxValueICO(page = 1, pageSize = 24) {
  try {
    const data = await get(`chara/mvi/${page}/${pageSize}`);

    if (!data || data.State !== 0 || !Array.isArray(data.Value)) {
      return {
        success: false,
        message: "获取ICO最多资金失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("获取ICO最多资金失败:", error);
    return {
      success: false,
      message: "获取ICO最多资金失败",
    };
  }
}

/**
 * 获取ICO最近活跃列表
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise<Object>} ICO最近活跃列表
 */
export async function getRecentActiveICO(page = 1, pageSize = 24) {
  try {
    const data = await get(`chara/rai/${page}/${pageSize}`);

    if (!data || data.State !== 0 || !Array.isArray(data.Value)) {
      return {
        success: false,
        message: "获取ICO最近活跃失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("获取ICO最近活跃失败:", error);
    return {
      success: false,
      message: "获取ICO最近活跃失败",
    };
  }
}

/**
 * 获取ICO即将结束列表
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise<Object>} ICO即将结束列表
 */
export async function getMostRecentICO(page = 1, pageSize = 24) {
  try {
    const data = await get(`chara/mri/${page}/${pageSize}`);

    if (!data || data.State !== 0 || !Array.isArray(data.Value)) {
      return {
        success: false,
        message: "获取ICO即将结束失败",
      };
    }

    return {
      success: true,
      data: data.Value,
    };
  } catch (error) {
    console.error("获取ICO即将结束失败:", error);
    return {
      success: false,
      message: "获取ICO即将结束失败",
    };
  }
}

/**
 * 获取角色交易记录
 * @param {number} characterId - 角色ID
 * @param {number} [page=1] - 页数
 * @param {number} [pageSize=48] - 每页数量
 * @returns {Promise<Object>} 交易记录
 */
export async function getCharacterTradeHistory(characterId, page = 1, pageSize = 48) {
  try {
    const url = `chara/history/${characterId}/${page}/${pageSize}`;
    const data = await get(url);

    if (!data || data.State !== 0 || !data.Value) {
      return {
        success: false,
        message: data?.Message || "获取角色交易记录失败",
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
    console.error("获取角色交易记录失败:", error);
    return {
      success: false,
      message: "获取角色交易记录失败",
    };
  }
}
