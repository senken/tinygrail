import { Button } from "@src/components/Button.jsx";
import { TrashIcon, StarIcon } from "@src/icons";
import { normalizeAvatar } from "@src/utils/oos.js";
import { getFavorites, saveFavorites } from "./favoriteStorage.js";
import { uploadToCloud } from "./favoriteSync.js";
import { getCachedUserAssets } from "@src/utils/session.js";

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
      statusDiv.textContent = `已从「${favorite.name}」移除`;
    } else {
      favorite.characters.unshift(characterId); // 添加到数组头部
      statusDiv.textContent = `已添加到「${favorite.name}」`;
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

  // 创建新收藏夹
  const createFavorite = (name, color) => {
    const userAssets = getCachedUserAssets();
    const userId = userAssets?.id;
    
    if (!userId) {
      statusDiv.textContent = "创建失败：无法获取用户信息";
      return null;
    }
    
    const favorites = getFavorites();
    const now = Date.now();
    
    const newFavorite = {
      id: now,
      name,
      color,
      characters: [],
      order: favorites.length,
      createdAt: now,
      updatedAt: now,
      userId, // 添加创建者用户ID
    };
    favorites.push(newFavorite);
    saveFavorites(favorites);
    uploadToCloud(favorites);
    return newFavorite;
  };

  // 删除收藏夹
  const deleteFavorite = (favoriteId) => {
    const favorites = getFavorites();
    const favorite = favorites.find((f) => f.id === favoriteId);

    if (!favorite) return;

    if (!confirm(`确定要删除收藏夹「${favorite.name}」吗？`)) return;

    const index = favorites.findIndex((f) => f.id === favoriteId);
    if (index > -1) {
      // 标记为已删除
      const now = Date.now();
      favorites[index].deleted = true;
      favorites[index].deletedAt = now;
      favorites[index].updatedAt = now;

      saveFavorites(favorites);
      uploadToCloud(favorites);
      renderFavoriteList();
      statusDiv.textContent = "收藏夹已删除";
    }
  };

  const statusDiv = <div className="text-center text-xs opacity-60" />;
  const favoriteListDiv = <div className="flex flex-col gap-2" />;
  const createFormDiv = <div className="hidden flex-col gap-2" />;

  // 初始化createFormDiv的display样式
  createFormDiv.style.display = "none";

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

  let selectedColor = colors[0];
  let newFavoriteName = "";

  // 渲染收藏夹列表
  const renderFavoriteList = () => {
    favoriteListDiv.innerHTML = "";
    const allFavorites = getFavorites();
    const userAssets = getCachedUserAssets();
    const currentUserId = userAssets?.id;

    // 过滤掉已删除的收藏夹和不属于当前用户的收藏夹
    const favorites = allFavorites.filter((f) => !f.deleted && f.userId === currentUserId);

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

  // 渲染创建表单
  const nameInput = (
    <input
      type="text"
      className="tg-bg-content rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 dark:border-gray-600"
      placeholder="收藏夹名称（最多20字）"
      maxLength="20"
      onInput={(e) => {
        newFavoriteName = e.target.value;
      }}
    />
  );

  const colorSelectDiv = <div className="flex flex-wrap gap-2" />;

  colors.forEach((color) => {
    const colorBtn = (
      <button
        type="button"
        className={`h-8 w-8 rounded-full border-2 transition-all ${color.value} ${
          selectedColor === color ? "border-gray-800 dark:border-gray-200" : "border-transparent"
        }`}
        onClick={() => {
          selectedColor = color;
          // 更新所有颜色按钮的边框
          colorSelectDiv.querySelectorAll("button").forEach((btn, index) => {
            if (colors[index] === color) {
              btn.className = `h-8 w-8 rounded-full border-2 transition-all ${color.value} border-gray-800 dark:border-gray-200`;
            } else {
              btn.className = `h-8 w-8 rounded-full border-2 transition-all ${colors[index].value} border-transparent`;
            }
          });
        }}
        title={color.name}
      />
    );
    colorSelectDiv.appendChild(colorBtn);
  });

  const createBtn = (
    <Button
      onClick={() => {
        const trimmedName = newFavoriteName.trim();
        if (!trimmedName) {
          statusDiv.textContent = "请输入收藏夹名称";
          return;
        }
        if (trimmedName.length > 20) {
          statusDiv.textContent = "收藏夹名称不能超过20个字";
          return;
        }
        const newFavorite = createFavorite(trimmedName, selectedColor.value);
        if (newFavorite) {
          nameInput.value = "";
          newFavoriteName = "";
          createFormDiv.style.display = "none";
          renderFavoriteList();
          statusDiv.textContent = "收藏夹创建成功";
        }
      }}
    >
      创建
    </Button>
  );

  const cancelBtn = (
    <Button
      variant="outline"
      onClick={() => {
        createFormDiv.style.display = "none";
        nameInput.value = "";
        newFavoriteName = "";
      }}
    >
      取消
    </Button>
  );

  createFormDiv.appendChild(nameInput);
  createFormDiv.appendChild(<div className="text-xs opacity-60">选择颜色：</div>);
  createFormDiv.appendChild(colorSelectDiv);
  createFormDiv.appendChild(
    <div className="flex justify-end gap-2">
      {createBtn}
      {cancelBtn}
    </div>
  );

  const toggleCreateFormBtn = (
    <Button
      variant="outline"
      onClick={() => {
        if (createFormDiv.style.display === "none") {
          createFormDiv.style.display = "flex";
        } else {
          createFormDiv.style.display = "none";
          nameInput.value = "";
          newFavoriteName = "";
        }
      }}
    >
      新建收藏夹
    </Button>
  );

  // 初始渲染
  renderFavoriteList();

  return (
    <div id="tg-add-to-favorite" className="flex min-w-64 flex-col gap-3">
      {statusDiv}
      {favoriteListDiv}
      {toggleCreateFormBtn}
      {createFormDiv}
    </div>
  );
}
