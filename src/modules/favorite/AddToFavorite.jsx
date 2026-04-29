import { StarIcon, TrashIcon } from "@src/icons";
import { closeModal, openConfirmModal, openModal } from "@src/utils/modalManager.js";
import { normalizeAvatar } from "@src/utils/oos.js";
import { getCachedUserAssets } from "@src/utils/session.js";
import { showSuccess } from "@src/utils/toastManager.jsx";
import { FavoriteCreate } from "./FavoriteCreate.jsx";
import {
  getFavorites,
  getVisibleFavorites,
  reindexFavorites,
  saveFavorites,
} from "./favoriteStorage.js";
import { uploadToCloud } from "./favoriteSync.js";

/**
 * 添加到收藏夹组件
 * @param {Object} props
 * @param {Object} props.characterData - 角色数据对象
 */
export function AddToFavorite({ characterData }) {
  const characterId = characterData?.CharacterId;

  if (!characterId) {
    return <div className="p-4 text-center text-sm opacity-60">角色数据无效</div>;
  }

  // 检查角色是否在收藏夹中
  const isInFavorite = (favoriteId) => {
    const favorites = getFavorites();
    const favorite = favorites.find((f) => f.id === favoriteId);
    return favorite && favorite.characters.includes(characterId);
  };

  // 切换收藏状态
  const toggleFavorite = (favoriteId) => {
    const favorites = getFavorites();
    const favorite = favorites.find((f) => f.id === favoriteId);

    if (!favorite) return;

    const index = favorite.characters.indexOf(characterId);
    const isAdding = index === -1;

    if (index > -1) {
      favorite.characters.splice(index, 1);
      showSuccess(`已从「${favorite.name}」移除`);
    } else {
      favorite.characters.unshift(characterId); // 添加到数组头部
      showSuccess(`已添加到「${favorite.name}」`);
    }

    // 对当前收藏夹去重
    favorite.characters = [...new Set(favorite.characters)];

    // 更新封面
    if (!favorite.cover) {
      favorite.cover = [];
    }

    if (isAdding) {
      // 获取头像并插入到第一个位置
      const avatarUrl = normalizeAvatar(characterData.Icon);
      favorite.cover.unshift(avatarUrl);
    } else {
      // 从封面中移除该角色头像
      const avatarUrl = normalizeAvatar(characterData.Icon);
      const coverIndex = favorite.cover.indexOf(avatarUrl);
      if (coverIndex > -1) {
        favorite.cover.splice(coverIndex, 1);
      }
    }

    // 更新时间戳
    favorite.updatedAt = Date.now();

    saveFavorites(favorites);
    uploadToCloud(favorites);
    renderFavoriteList();
  };

  // 打开创建收藏夹弹窗
  const openCreateFavoriteModal = () => {
    openModal("create-favorite", {
      title: "创建收藏夹",
      content: (
        <FavoriteCreate
          onSave={(newFavorite) => {
            closeModal("create-favorite");
            renderFavoriteList();
            showSuccess("收藏夹创建成功");
          }}
          onCancel={() => {
            closeModal("create-favorite");
          }}
        />
      ),
      size: "sm",
    });
  };

  // 删除收藏夹
  const deleteFavorite = (favoriteId) => {
    const userAssets = getCachedUserAssets();
    const currentUserId = userAssets?.id;
    const favorites = getFavorites();
    const favorite = favorites.find((f) => f.id === favoriteId);

    if (!favorite) return;

    openConfirmModal({
      title: "删除收藏夹",
      message: `确定要删除收藏夹「${favorite.name}」吗？`,
      onConfirm: () => {
        const index = favorites.findIndex((f) => f.id === favoriteId);
        if (index > -1) {
          // 只保留必要字段
          const now = Date.now();
          favorites[index] = {
            id: favorites[index].id,
            deleted: true,
            deletedAt: now,
            updatedAt: now,
            userId: favorites[index].userId,
          };

          // 重新索引当前用户的收藏夹order
          reindexFavorites(favorites, currentUserId);

          saveFavorites(favorites);
          uploadToCloud(favorites);
          renderFavoriteList();
          showSuccess("收藏夹已删除");
        }
      },
    });
  };

  const favoriteListDiv = <div className="flex flex-col gap-2" />;

  // 可选颜色
  const colors = [
    { name: "橙色", value: "bg-orange-500", text: "text-orange-500" },
    { name: "红色", value: "bg-red-500", text: "text-red-500" },
    { name: "黄色", value: "bg-yellow-500", text: "text-yellow-500" },
    { name: "绿色", value: "bg-green-500", text: "text-green-500" },
    { name: "蓝色", value: "bg-blue-500", text: "text-blue-500" },
    { name: "紫色", value: "bg-purple-500", text: "text-purple-500" },
    { name: "粉色", value: "bg-pink-500", text: "text-pink-500" },
    { name: "灰色", value: "bg-gray-500", text: "text-gray-500" },
  ];

  // 渲染收藏夹列表
  const renderFavoriteList = () => {
    favoriteListDiv.innerHTML = "";
    const allFavorites = getFavorites();
    const userAssets = getCachedUserAssets();
    const currentUserId = userAssets?.id;

    // 过滤掉已删除的收藏夹和不属于当前用户的收藏夹
    const favorites = getVisibleFavorites(allFavorites, currentUserId);

    if (favorites.length === 0) {
      const emptyDiv = <div className="py-4 text-center text-sm opacity-60">暂无收藏夹</div>;
      favoriteListDiv.appendChild(emptyDiv);
      return;
    }

    favorites.forEach((favorite) => {
      const isIn = isInFavorite(favorite.id);
      const colorClass = colors.find((c) => c.value === favorite.color)?.text || "text-gray-500";

      const itemDiv = (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 p-2 dark:border-gray-600">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className={`h-3 w-3 flex-shrink-0 rounded-full ${favorite.color}`} />
            <span className={`min-w-0 flex-1 truncate text-sm ${colorClass}`}>{favorite.name}</span>
            <span className="flex-shrink-0 text-xs opacity-60">{favorite.characters.length}</span>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              className="flex items-center justify-center p-1 transition-opacity hover:opacity-70"
              onClick={() => toggleFavorite(favorite.id)}
              title={isIn ? "取消收藏" : "添加收藏"}
            >
              <StarIcon
                className={`h-4 w-4 ${isIn ? "bgm-color" : "text-gray-400 dark:text-gray-500"}`}
                filled={isIn}
              />
            </button>
            <button
              type="button"
              className="flex items-center justify-center p-1 transition-opacity hover:opacity-70"
              onClick={() => deleteFavorite(favorite.id)}
              title="删除收藏夹"
            >
              <TrashIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </button>
          </div>
        </div>
      );
      favoriteListDiv.appendChild(itemDiv);
    });
  };

  const toggleCreateFormBtn = (
    <button className="btn-bgm btn btn-sm btn-block" onClick={openCreateFavoriteModal}>
      新建收藏夹
    </button>
  );

  // 初始渲染
  renderFavoriteList();

  return (
    <div id="tg-add-to-favorite" className="flex min-w-64 flex-col gap-3 p-1">
      {favoriteListDiv}
      {toggleCreateFormBtn}
    </div>
  );
}

/**
 * 打开添加到收藏夹弹窗
 * @param {Object} params
 * @param {number} params.characterId - 角色ID
 * @param {Object} params.characterData - 角色数据
 * @param {Function} params.onClose - 关闭回调
 */
export function openAddToFavoriteModal({ characterId, characterData, onClose }) {
  openModal(`favorite-${characterId}`, {
    title: `收藏 - #${characterData?.CharacterId ?? ""}「${characterData?.Name ?? ""}」`,
    content: <AddToFavorite characterData={characterData} />,
    size: "sm",
    onClose,
  });
}
