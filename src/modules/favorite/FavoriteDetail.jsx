import { createMountedComponent } from "@src/utils/createMountedComponent.js";
import { getCharacterList } from "@src/api/chara.js";
import { normalizeAvatar } from "@src/utils/oos.js";
import { LevelBadge } from "@src/components/LevelBadge.jsx";
import { Pagination } from "@src/components/Pagination.jsx";
import { Button } from "@src/components/Button.jsx";
import { LoaderCircleIcon, TrashIcon } from "@src/icons";
import { getFavorites, saveFavorites } from "./favoriteStorage.js";
import { uploadToCloud } from "./favoriteSync.js";

/**
 * 收藏夹详情组件
 * @param {Object} props
 * @param {number} props.favoriteId - 收藏夹ID
 * @param {Function} props.onCharacterClick - 角色点击回调
 * @param {Function} props.onDataChange - 数据变化回调
 */
export function FavoriteDetail({ favoriteId, onCharacterClick, onDataChange }) {
  const container = <div id="tg-favorite-detail" className="flex min-w-96 flex-col gap-3" />;

  const pageSize = 48;

  const { setState } = createMountedComponent(container, (state) => {
    const {
      favorite = null,
      characters = [],
      loading = true,
      error = null,
      currentPage = 1,
      totalPages = 1,
      isSelecting = false,
      selectedIds = [],
    } = state || {};

    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <LoaderCircleIcon className="tg-spin h-8 w-8 text-gray-600 dark:text-white" />
        </div>
      );
    }

    if (error) {
      return <div className="py-8 text-center text-sm opacity-60">加载失败：{error}</div>;
    }

    if (!favorite) {
      return <div className="py-8 text-center text-sm opacity-60">收藏夹不存在</div>;
    }

    if (characters.length === 0) {
      return <div className="py-8 text-center text-sm opacity-60">该收藏夹暂无角色</div>;
    }

    // 处理分页变化
    const handlePageChange = (page) => {
      loadCharacters(page);
    };

    // 切换选择模式
    const toggleSelectMode = () => {
      setState({
        isSelecting: !isSelecting,
        selectedIds: [],
      });
    };

    // 切换角色选中状态
    const toggleCharacterSelect = (characterId) => {
      const newSelectedIds = [...selectedIds];
      const index = newSelectedIds.indexOf(characterId);

      if (index > -1) {
        newSelectedIds.splice(index, 1);
      } else {
        newSelectedIds.push(characterId);
      }

      setState({ selectedIds: newSelectedIds });
    };

    // 全选/取消全选
    const toggleSelectAll = () => {
      if (selectedIds.length === characters.length) {
        setState({ selectedIds: [] });
      } else {
        setState({ selectedIds: characters.map((c) => c.CharacterId) });
      }
    };

    // 删除选中的角色
    const deleteSelectedCharacters = () => {
      if (selectedIds.length === 0) return;

      if (!confirm(`确定要从「${favorite.name}」中移除 ${selectedIds.length} 个角色吗？`)) return;

      const favorites = getFavorites();
      const currentFavorite = favorites.find((f) => f.id === favoriteId);

      if (!currentFavorite) return;

      // 从收藏夹中移除选中的角色
      selectedIds.forEach((characterId) => {
        const index = currentFavorite.characters.indexOf(characterId);
        if (index > -1) {
          currentFavorite.characters.splice(index, 1);
        }
      });

      // 更新时间戳
      currentFavorite.updatedAt = Date.now();

      saveFavorites(favorites);
      uploadToCloud(favorites);

      // 通知父组件数据变化
      if (onDataChange) {
        onDataChange();
      }

      // 重新加载当前页
      setState({
        isSelecting: false,
        selectedIds: [],
        favorite: currentFavorite,
      });
      loadCharacters(currentPage);
    };

    const contentDiv = <div className="flex flex-col gap-1" />;
    const gridDiv = <div className="grid w-full p-1" />;

    // 渲染函数
    const renderItems = (cols) => {
      gridDiv.innerHTML = "";

      gridDiv.style.display = "grid";
      gridDiv.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      gridDiv.style.gap = "0.75rem";

      characters.forEach((item) => {
        // 判断角色类型
        let avatarUrl;
        let badgeType = "default";

        if (item.isUnlisted) {
          // 未上市角色
          avatarUrl = `https://api.bgm.tv/v0/characters/${item.CharacterId}/image?type=small`;
          badgeType = "unlisted";
        } else if (item.Current !== undefined) {
          // 已上市角色
          avatarUrl = normalizeAvatar(item.Icon);
          badgeType = "default";
        } else {
          // ICO角色
          avatarUrl = normalizeAvatar(item.Icon);
          badgeType = "ico";
        }

        const isSelected = selectedIds.includes(item.CharacterId);

        const itemDiv = (
          <div
            className={`flex min-w-0 cursor-pointer flex-col items-center gap-2 rounded-lg p-2 transition-colors ${
              isSelected
                ? "bg-blue-50 ring-2 ring-blue-500 dark:bg-blue-900/20"
                : "hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
            onClick={() => {
              if (isSelecting) {
                toggleCharacterSelect(item.CharacterId);
              } else if (onCharacterClick) {
                onCharacterClick(item.CharacterId);
              }
            }}
          >
            {/* 头像 */}
            <div className="relative">
              <div className="tg-avatar-border flex-shrink-0 border-2 border-gray-300 dark:border-white/30">
                <div
                  className="tg-avatar size-14 bg-cover bg-top"
                  style={{ backgroundImage: `url(${avatarUrl})` }}
                />
              </div>
              <div className="absolute -left-1 -top-1">
                <LevelBadge level={item.Level} zeroCount={item.ZeroCount} type={badgeType} />
              </div>
              {isSelecting && (
                <div className="absolute -right-1 -top-1">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded border-2 ${
                      isSelected
                        ? "border-blue-500 bg-white dark:bg-gray-800"
                        : "border-gray-400 bg-white dark:bg-gray-800"
                    }`}
                  >
                    {isSelected && <div className="h-3 w-3 rounded-sm bg-blue-500" />}
                  </div>
                </div>
              )}
            </div>

            {/* 名称 */}
            <span className="w-full min-w-0 truncate text-center text-sm" title={item.Name}>
              {item.Name}
            </span>
          </div>
        );

        gridDiv.appendChild(itemDiv);
      });
    };

    // 计算列数
    const calculateLayout = (width) => {
      const minCellWidth = 80;
      const gap = 12;

      // 计算可以容纳的最大列数
      let cols = Math.floor((width + gap) / (minCellWidth + gap));

      // 确保列数是48的因数
      const divisors = [48, 24, 16, 12, 8, 6, 4, 3, 2, 1];
      for (const divisor of divisors) {
        if (cols >= divisor) {
          return divisor;
        }
      }
      return 1;
    };

    // 初始渲染
    const initialCols = calculateLayout(container.offsetWidth || 800);
    renderItems(initialCols);

    // 使用 ResizeObserver 监听容器宽度变化
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const cols = calculateLayout(width);
        renderItems(cols);
      }
    });

    observer.observe(container);

    // 添加工具栏
    const toolbarDiv = (
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm opacity-60">
          {isSelecting ? (
            <span>已选择 {selectedIds.length} 个角色</span>
          ) : (
            <span>共 {favorite.characters.length} 个角色</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={toggleSelectMode}>
            {isSelecting ? "取消" : <TrashIcon className="h-4 w-4" />}
          </Button>
          {isSelecting && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={toggleSelectAll}>
                {selectedIds.length === characters.length ? "取消全选" : "全选"}
              </Button>
              <Button variant="outline" onClick={deleteSelectedCharacters}>
                删除 ({selectedIds.length})
              </Button>
            </div>
          )}
        </div>
      </div>
    );

    contentDiv.appendChild(toolbarDiv);
    contentDiv.appendChild(gridDiv);

    // 添加分页
    if (totalPages > 1) {
      const paginationDiv = <div className="flex w-full justify-center pb-1" />;
      const pagination = (
        <Pagination current={currentPage} total={totalPages} onChange={handlePageChange} />
      );
      paginationDiv.appendChild(pagination);
      contentDiv.appendChild(paginationDiv);
    }

    return contentDiv;
  });

  // 加载收藏夹数据
  const loadFavorite = () => {
    const favorites = getFavorites();
    const favorite = favorites.find((f) => f.id === favoriteId);

    if (!favorite) {
      setState({ loading: false, error: "收藏夹不存在" });
      return;
    }

    setState({ favorite });
    loadCharacters(1);
  };

  // 加载角色数据
  const loadCharacters = async (page = 1) => {
    const favorites = getFavorites();
    const favorite = favorites.find((f) => f.id === favoriteId);

    if (!favorite || !favorite.characters || favorite.characters.length === 0) {
      // 如果是第一页且没有角色，清空封面
      if (page === 1 && favorite) {
        const allFavorites = getFavorites();
        const targetFavorite = allFavorites.find((f) => f.id === favoriteId);
        if (targetFavorite) {
          targetFavorite.cover = [];
          saveFavorites(allFavorites);
          uploadToCloud(allFavorites);
        }
      }
      setState({ loading: false, characters: [], currentPage: 1, totalPages: 1 });
      return;
    }

    setState({ loading: true, currentPage: page, favorite });

    // 计算分页
    const totalCharacters = favorite.characters.length;
    const totalPages = Math.ceil(totalCharacters / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalCharacters);
    const pageCharacterIds = favorite.characters.slice(startIndex, endIndex);

    const result = await getCharacterList(pageCharacterIds);

    if (result.success) {
      // 处理返回的数据
      const characterMap = new Map();
      result.data.forEach((char) => {
        characterMap.set(char.CharacterId, char);
      });

      // 构建完整的角色列表
      const fullCharacters = pageCharacterIds.map((id) => {
        const char = characterMap.get(id);
        if (char) {
          // 已上市或ICO角色
          return char;
        } else {
          // 未上市角色
          return {
            CharacterId: id,
            Name: `角色 #${id}`,
            Icon: null,
            Level: 0,
            ZeroCount: 0,
            isUnlisted: true,
          };
        }
      });

      // 如果是第一页，保存前8个角色的头像作为封面
      if (page === 1 && fullCharacters.length > 0) {
        const coverImages = fullCharacters.slice(0, 8).map((char) => {
          if (char.isUnlisted) {
            return `https://api.bgm.tv/v0/characters/${char.CharacterId}/image?type=small`;
          } else {
            return normalizeAvatar(char.Icon);
          }
        });

        // 更新收藏夹的封面
        const allFavorites = getFavorites();
        const targetFavorite = allFavorites.find((f) => f.id === favoriteId);
        if (targetFavorite) {
          targetFavorite.cover = coverImages;
          saveFavorites(allFavorites);
          uploadToCloud(allFavorites);
        }
      }

      setState({
        loading: false,
        characters: fullCharacters,
        currentPage: page,
        totalPages: totalPages,
        favorite,
      });
    } else {
      setState({
        loading: false,
        error: result.message || "加载失败",
        currentPage: page,
        totalPages: totalPages,
        favorite,
      });
    }
  };

  loadFavorite();

  return container;
}
