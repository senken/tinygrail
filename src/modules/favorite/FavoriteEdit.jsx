import { openModal } from "@src/utils/modalManager.js";
import { showError, showSuccess } from "@src/utils/toastManager.jsx";
import { FavoriteForm } from "./FavoriteForm.jsx";
import { getFavorites, saveFavorites } from "./favoriteStorage.js";
import { uploadToCloud } from "./favoriteSync.js";

/**
 * 打开编辑收藏夹弹窗
 * @param {number} favoriteId - 收藏夹ID
 * @param {Function} onSave - 保存成功回调
 */
export function openEditFavorite(favoriteId, onSave) {
  const { close } = openModal(`edit-favorite-${favoriteId}`, {
    title: "编辑收藏夹",
    content: (
      <FavoriteEdit
        favoriteId={favoriteId}
        onSave={() => {
          if (onSave) onSave();
          close();
          showSuccess("收藏夹已更新");
        }}
        onCancel={() => {
          close();
        }}
      />
    ),
    size: "sm",
  });
}

/**
 * 编辑收藏夹组件
 */
function FavoriteEdit({ favoriteId, onSave, onCancel }) {
  const currentFavorites = getFavorites();
  const favorite = currentFavorites.find((f) => f.id === favoriteId);

  if (!favorite) {
    return <div className="text-center text-sm opacity-60">收藏夹不存在</div>;
  }

  const handleSubmit = ({ name, color }) => {
    if (!name) {
      showError("请输入收藏夹名称");
      return;
    }
    if (name.length > 10) {
      showError("收藏夹名称不能超过10个字");
      return;
    }

    const currentFavorites = getFavorites();
    const fav = currentFavorites.find((f) => f.id === favoriteId);

    if (!fav) return;

    fav.name = name;
    fav.color = color;
    fav.updatedAt = Date.now();

    saveFavorites(currentFavorites);
    uploadToCloud(currentFavorites);

    if (onSave) onSave();
  };

  return (
    <FavoriteForm
      initialName={favorite.name}
      initialColor={favorite.color}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      submitText="保存"
    />
  );
}
