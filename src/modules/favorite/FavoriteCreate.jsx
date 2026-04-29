import { getCachedUserAssets } from "@src/utils/session.js";
import { showError } from "@src/utils/toastManager.jsx";
import { FavoriteForm } from "./FavoriteForm.jsx";
import { getFavorites, reindexFavorites, saveFavorites } from "./favoriteStorage.js";
import { uploadToCloud } from "./favoriteSync.js";

/**
 * 创建收藏夹组件
 */
export function FavoriteCreate({ onSave, onCancel }) {
  const handleSubmit = ({ name, color }) => {
    if (!name) {
      showError("请输入收藏夹名称");
      return;
    }
    if (name.length > 10) {
      showError("收藏夹名称不能超过10个字");
      return;
    }

    const userAssets = getCachedUserAssets();
    const userId = userAssets?.id;

    if (!userId) {
      showError("创建失败：无法获取用户信息");
      return;
    }

    const favorites = getFavorites();
    const now = Date.now();

    // 重新索引当前用户的收藏夹order
    reindexFavorites(favorites, userId);

    // 获取当前用户未删除的收藏夹数量
    const userFavoritesCount = favorites.filter((f) => !f.deleted && f.userId === userId).length;

    const newFavorite = {
      id: now,
      name,
      color,
      characters: [],
      cover: [],
      order: userFavoritesCount,
      createdAt: now,
      updatedAt: now,
      userId,
    };

    favorites.push(newFavorite);
    saveFavorites(favorites);
    uploadToCloud(favorites);

    if (onSave) onSave(newFavorite);
  };

  return (
    <FavoriteForm
      initialName=""
      initialColor={null}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      submitText="创建"
    />
  );
}
