import { formatNumber, getTimeDiff } from "@src/utils/format.js";
import { getCachedUserAssets } from "@src/utils/session.js";
import {
  getCharacterPool,
  getUserCharacter,
  getUserCharacterByUsername,
  getCharacterDepth,
  getCharacterLinks,
  getCharacterTemples,
  getCharacterUsers,
  getICOUsers,
  getUserICOInfo,
} from "@src/api/chara.js";

/**
 * 计算用户权限和固定资产
 * @param {Object} params
 * @param {Object} params.topTenUsersResult - 前10名用户数据
 * @param {Object} params.userAssets - 用户资产数据
 * @param {Object} params.linksResult - LINK数据
 * @param {Object} params.templesResult - 圣殿数据
 * @param {Object} params.userCharacterResult - 用户角色数据
 * @returns {Object} { canChangeAvatar, fixedAssets }
 */
export function calculateUserPermissionsAndAssets({
  topTenUsersResult,
  userAssets,
  linksResult,
  templesResult,
  userCharacterResult,
}) {
  let canChangeAvatar = false;
  let fixedAssets = "0";

  // 判断当前用户是否可以更换头像
  if (topTenUsersResult.success && topTenUsersResult.data?.Items && userAssets) {
    const currentUserId = userAssets.id;
    const currentUserName = userAssets.name;

    // 神秘的702用户(641)永远可以更换头像
    if (currentUserId === 702) {
      canChangeAvatar = true;
    } else {
      const topTenUsers = topTenUsersResult.data.Items;

      // 检查当前用户是否在前10名中
      const currentUserIndex = topTenUsers.findIndex((user) => user.Name === currentUserName);

      if (currentUserIndex !== -1) {
        // 获取主席
        const chairman = topTenUsers[0];
        const timeDiff = getTimeDiff(chairman.LastActiveDate);
        const chairmanActive = timeDiff < 1000 * 60 * 60 * 24 * 5 && chairman.State !== 666;

        // 如果主席活跃，只有主席可以更换头像
        if (chairmanActive) {
          canChangeAvatar = currentUserIndex === 0;
        } else {
          // 如果主席不活跃，前2-10名都可以更换头像
          canChangeAvatar = currentUserIndex > 0;
        }
      }
    }
  }

  // 计算固定资产
  if (userAssets && userAssets.name) {
    const userName = userAssets.name;

    // 从links中查找
    let foundData = null;
    if (linksResult.success && linksResult.data) {
      foundData = linksResult.data.find((link) => link.Name === userName);
    }

    // 从temples中查找
    if (!foundData && templesResult.success && templesResult.data) {
      foundData = templesResult.data.find((temple) => temple.Name === userName);
    }

    // 格式化固定资产
    if (foundData) {
      fixedAssets = `${formatNumber(foundData.Assets ?? 0, 0)} / ${formatNumber(foundData.Sacrifices ?? 0, 0)}`;
    } else if (userCharacterResult.success && userCharacterResult.data?.Sacrifices) {
      // 如果在links和temples中都没找到，则只显示Sacrifices
      fixedAssets = formatNumber(userCharacterResult.data.Sacrifices, 0);
    }
  }

  return { canChangeAvatar, fixedAssets };
}

/**
 * 加载TradeBox所需的数据
 * @param {number} characterId - 角色ID
 * @param {number} currentUsersPage - 当前用户列表页数
 * @returns {Promise<Object>} 返回所有数据
 */
export async function loadTradeBoxAllData(characterId, currentUsersPage = 1) {
  const [
    poolResult,
    userCharacterResult,
    tinygrailCharacterResult,
    gensokyoCharacterResult,
    depthResult,
    linksResult,
    templesResult,
    usersResult,
    topTenUsersResult,
  ] = await Promise.all([
    getCharacterPool(characterId),
    getUserCharacter(characterId),
    getUserCharacterByUsername(characterId, "tinygrail"),
    getUserCharacterByUsername(characterId, "blueleaf"),
    getCharacterDepth(characterId),
    getCharacterLinks(characterId),
    getCharacterTemples(characterId),
    getCharacterUsers(characterId, currentUsersPage),
    getCharacterUsers(characterId, 1, 10),
  ]);

  // 从缓存中获取当前用户资产
  const userAssets = getCachedUserAssets();

  // 计算用户权限和固定资产
  const { canChangeAvatar, fixedAssets } = calculateUserPermissionsAndAssets({
    topTenUsersResult,
    userAssets,
    linksResult,
    templesResult,
    userCharacterResult,
  });

  return {
    pool: poolResult.success ? poolResult.data : null,
    userCharacter: userCharacterResult.success ? userCharacterResult.data : null,
    tinygrailCharacter: tinygrailCharacterResult.success ? tinygrailCharacterResult.data : null,
    gensokyoCharacter: gensokyoCharacterResult.success ? gensokyoCharacterResult.data : null,
    depth: depthResult.success ? depthResult.data : null,
    links: linksResult.success ? linksResult.data : null,
    temples: templesResult.success ? templesResult.data : null,
    users: usersResult.success ? usersResult.data : null,
    canChangeAvatar,
    fixedAssets,
  };
}

/**
 * 加载IcoBox所需的数据
 * @param {number} icoId - ICO ID
 * @param {number} currentIcoUsersPage - 当前ICO用户列表页数
 * @returns {Promise<Object>} 返回所有数据
 */
export async function loadIcoBoxAllData(icoId, currentIcoUsersPage = 1) {
  const [icoUsersResult, userIcoInfoResult] = await Promise.all([
    getICOUsers(icoId, currentIcoUsersPage),
    getUserICOInfo(icoId),
  ]);

  return {
    icoUsers: icoUsersResult.success ? icoUsersResult.data : null,
    userIcoInfo: userIcoInfoResult.success ? userIcoInfoResult.data : null,
  };
}
