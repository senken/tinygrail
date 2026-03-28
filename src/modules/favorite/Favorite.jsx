import { createMountedComponent } from "@src/utils/createMountedComponent.js";
import { Button } from "@src/components/Button.jsx";
import { TrashIcon, SquarePenIcon, FolderIcon, ArrowUpIcon, ArrowDownIcon } from "@src/icons";
import { Modal } from "@src/components/Modal.jsx";
import { FavoriteDetail } from "./FavoriteDetail.jsx";
import { CharacterBox } from "@src/modules/character-box/CharacterBox.jsx";
import { normalizeAvatar } from "@src/utils/oos.js";
import { getFavorites, saveFavorites } from "./favoriteStorage.js";
import { uploadToCloud, syncFromCloud } from "./favoriteSync.js";

/**
 * 收藏夹管理组件
 */
export function Favorite() {
  const container = <div id="tg-favorite" className="flex min-w-96 flex-col gap-3" />;

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

  let generatedDetailModalId = null;
  let generatedCharacterModalId = null;

  const { setState } = createMountedComponent(container, (state) => {
    const {
      favorites = [],
      statusMessage = "",
      isEditing = false,
      editingFavoriteId = null,
      editingName = "",
      editingColor = colors[0],
      showDetailModal = false,
      showCharacterModal = false,
      selectedFavorite = null,
      selectedCharacterId = null,
    } = state || {};

    // 删除收藏夹
    const deleteFavorite = (favoriteId) => {
      const currentFavorites = getFavorites();
      const favorite = currentFavorites.find((f) => f.id === favoriteId);

      if (!favorite) return;

      if (!confirm(`确定要删除收藏夹「${favorite.name}」吗？`)) return;

      const index = currentFavorites.findIndex((f) => f.id === favoriteId);
      if (index > -1) {
        currentFavorites.splice(index, 1);
        saveFavorites(currentFavorites);
        uploadToCloud(currentFavorites);
        setState({
          favorites: currentFavorites,
          statusMessage: "收藏夹已删除",
        });
      }
    };

    // 上移收藏夹
    const moveFavoriteUp = (favoriteId) => {
      const currentFavorites = getFavorites();
      const index = currentFavorites.findIndex((f) => f.id === favoriteId);

      if (index <= 0) return;

      // 交换位置
      [currentFavorites[index - 1], currentFavorites[index]] = [
        currentFavorites[index],
        currentFavorites[index - 1],
      ];

      // 交换order值
      [currentFavorites[index - 1].order, currentFavorites[index].order] = [
        currentFavorites[index].order,
        currentFavorites[index - 1].order,
      ];

      // 更新两个收藏夹的时间戳
      const now = Date.now();
      currentFavorites[index - 1].updatedAt = now;
      currentFavorites[index].updatedAt = now;

      saveFavorites(currentFavorites);
      uploadToCloud(currentFavorites);
      setState({ favorites: currentFavorites });
    };

    // 下移收藏夹
    const moveFavoriteDown = (favoriteId) => {
      const currentFavorites = getFavorites();
      const index = currentFavorites.findIndex((f) => f.id === favoriteId);

      if (index === -1 || index >= currentFavorites.length - 1) return;

      // 交换位置
      [currentFavorites[index], currentFavorites[index + 1]] = [
        currentFavorites[index + 1],
        currentFavorites[index],
      ];

      // 交换order值
      [currentFavorites[index].order, currentFavorites[index + 1].order] = [
        currentFavorites[index + 1].order,
        currentFavorites[index].order,
      ];

      // 更新两个收藏夹的时间戳
      const now = Date.now();
      currentFavorites[index].updatedAt = now;
      currentFavorites[index + 1].updatedAt = now;

      saveFavorites(currentFavorites);
      uploadToCloud(currentFavorites);
      setState({ favorites: currentFavorites });
    };

    // 开始编辑收藏夹
    const startEditFavorite = (favoriteId) => {
      const currentFavorites = getFavorites();
      const favorite = currentFavorites.find((f) => f.id === favoriteId);

      if (!favorite) return;

      const color = colors.find((c) => c.value === favorite.color) || colors[0];

      setState({
        isEditing: true,
        editingFavoriteId: favoriteId,
        editingName: favorite.name,
        editingColor: color,
      });
    };

    // 保存编辑
    const saveEdit = () => {
      const trimmedName = editingName.trim();
      if (!trimmedName) {
        setState({ statusMessage: "请输入收藏夹名称" });
        return;
      }
      if (trimmedName.length > 20) {
        setState({ statusMessage: "收藏夹名称不能超过20个字" });
        return;
      }

      const currentFavorites = getFavorites();
      const favorite = currentFavorites.find((f) => f.id === editingFavoriteId);

      if (!favorite) return;

      favorite.name = trimmedName;
      favorite.color = editingColor.value;
      favorite.updatedAt = Date.now();

      saveFavorites(currentFavorites);
      uploadToCloud(currentFavorites);
      setState({
        favorites: currentFavorites,
        isEditing: false,
        editingFavoriteId: null,
        editingName: "",
        editingColor: colors[0],
        statusMessage: "收藏夹已更新",
      });
    };

    // 取消编辑
    const cancelEdit = () => {
      setState({
        isEditing: false,
        editingFavoriteId: null,
        editingName: "",
        editingColor: colors[0],
      });
    };

    // 打开收藏夹详情
    const openFavoriteDetail = (favorite) => {
      setState({
        showDetailModal: true,
        selectedFavorite: favorite,
      });
    };

    // 关闭收藏夹详情
    const closeFavoriteDetail = () => {
      setState({
        showDetailModal: false,
        selectedFavorite: null,
      });
      // 刷新收藏夹列表
      loadFavorites();
    };

    // 打开角色详情
    const openCharacterDetail = (characterId) => {
      setState({
        showCharacterModal: true,
        selectedCharacterId: characterId,
      });
    };

    // 关闭角色详情
    const closeCharacterDetail = () => {
      setState({
        showCharacterModal: false,
        selectedCharacterId: null,
      });
    };

    // 检查Modal是否已存在
    const isModalExist = (modalId) => {
      return (
        modalId &&
        document.querySelector(`#tg-modal[data-modal-id="${modalId}"]`)?.parentNode ===
          document.body
      );
    };

    // 渲染收藏夹列表
    const renderFavoriteList = () => {
      if (favorites.length === 0) {
        return <div className="py-4 text-center text-sm opacity-60">暂无收藏夹</div>;
      }

      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {favorites.map((favorite, index) => {
            const colorClass =
              colors.find((c) => c.value === favorite.color)?.text || "text-gray-500";

            // 获取封面图片
            const coverImages = favorite.cover || [];
            const hasImages = coverImages.length > 0;

            const isFirst = index === 0;
            const isLast = index === favorites.length - 1;

            return (
              <div key={favorite.id} className="relative">
                {/* 收藏夹卡片 */}
                <div
                  className="group relative cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-gray-50 transition-all hover:shadow-md dark:border-gray-600 dark:bg-gray-800"
                  onClick={() => openFavoriteDetail(favorite)}
                >
                  {/* 封面区域 */}
                  <div className="relative aspect-square w-full">
                    {hasImages ? (
                      <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5 bg-gray-200 dark:bg-gray-700">
                        {[0, 1, 2, 3].map((index) => {
                          const imageUrl = coverImages[index];
                          return (
                            <div
                              key={index}
                              className="relative overflow-hidden bg-gray-100 dark:bg-gray-600"
                              style={{
                                backgroundImage: imageUrl ? `url(${imageUrl})` : "none",
                                backgroundSize: "cover",
                                backgroundPosition: "center top",
                              }}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-700">
                        <FolderIcon className="h-16 w-16 text-gray-300 dark:text-gray-600" />
                      </div>
                    )}

                    {/* 操作按钮 */}
                    <div
                      className="absolute right-1 top-1 flex gap-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!isFirst && (
                        <button
                          type="button"
                          className="flex items-center justify-center rounded-full bg-white/90 p-1.5 shadow-sm transition-all hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800"
                          onClick={() => moveFavoriteUp(favorite.id)}
                          title="上移"
                        >
                          <ArrowUpIcon className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                        </button>
                      )}
                      {!isLast && (
                        <button
                          type="button"
                          className="flex items-center justify-center rounded-full bg-white/90 p-1.5 shadow-sm transition-all hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800"
                          onClick={() => moveFavoriteDown(favorite.id)}
                          title="下移"
                        >
                          <ArrowDownIcon className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                        </button>
                      )}
                      <button
                        type="button"
                        className="flex items-center justify-center rounded-full bg-white/90 p-1.5 shadow-sm transition-all hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800"
                        onClick={() => startEditFavorite(favorite.id)}
                        title="编辑收藏夹"
                      >
                        <SquarePenIcon className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button
                        type="button"
                        className="flex items-center justify-center rounded-full bg-white/90 p-1.5 shadow-sm transition-all hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800"
                        onClick={() => deleteFavorite(favorite.id)}
                        title="删除收藏夹"
                      >
                        <TrashIcon className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* 信息区域 */}
                  <div className="flex items-center gap-2 p-2">
                    <div className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${favorite.color}`} />
                    <span className={`min-w-0 flex-1 truncate text-sm font-medium ${colorClass}`}>
                      {favorite.name}
                    </span>
                    <span className="flex-shrink-0 text-xs opacity-60">
                      {favorite.characters.length}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    };

    // 渲染编辑表单
    const renderEditForm = () => {
      return (
        <div className="flex flex-col gap-2">
          <div className="text-sm font-medium">编辑收藏夹</div>
          <input
            type="text"
            className="tg-bg-content rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 dark:border-gray-600"
            placeholder="收藏夹名称（最多20字）"
            maxLength="20"
            value={editingName}
            onInput={(e) => {
              setState({ editingName: e.target.value });
            }}
          />
          <div className="text-xs opacity-60">选择颜色：</div>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color.value}
                type="button"
                className={`h-8 w-8 rounded-full border-2 transition-all ${color.value} ${
                  editingColor.value === color.value
                    ? "border-gray-800 dark:border-gray-200"
                    : "border-transparent"
                }`}
                onClick={() => {
                  setState({ editingColor: color });
                }}
                title={color.name}
              />
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button onClick={saveEdit}>保存</Button>
            <Button variant="outline" onClick={cancelEdit}>
              取消
            </Button>
          </div>
        </div>
      );
    };

    return (
      <div>
        {/* 状态消息 */}
        {statusMessage && (
          <div className="mb-2 text-center text-xs opacity-60">{statusMessage}</div>
        )}

        {/* 收藏夹列表或编辑表单 */}
        {isEditing ? renderEditForm() : renderFavoriteList()}

        {/* 收藏夹详情Modal */}
        {showDetailModal && selectedFavorite && !isModalExist(generatedDetailModalId) && (
          <Modal
            visible={showDetailModal}
            onClose={closeFavoriteDetail}
            title={`收藏夹 - ${selectedFavorite.name}`}
            position="center"
            maxWidth={1080}
            modalId={generatedDetailModalId}
            getModalId={(id) => {
              generatedDetailModalId = id;
            }}
          >
            <FavoriteDetail
              favoriteId={selectedFavorite.id}
              onCharacterClick={openCharacterDetail}
              onDataChange={loadFavorites}
            />
          </Modal>
        )}

        {/* 角色详情Modal */}
        {showCharacterModal && selectedCharacterId && !isModalExist(generatedCharacterModalId) && (
          <Modal
            visible={showCharacterModal}
            onClose={closeCharacterDetail}
            padding="p-6"
            modalId={generatedCharacterModalId}
            getModalId={(id) => {
              generatedCharacterModalId = id;
            }}
          >
            <CharacterBox characterId={selectedCharacterId} sticky={true} />
          </Modal>
        )}
      </div>
    );
  });

  // 初始化加载收藏夹列表
  const loadFavorites = () => {
    // 先从云端同步
    let favorites = syncFromCloud();
    
    // 按order字段排序
    favorites.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    setState({ favorites });
  };

  loadFavorites();

  return container;
}
