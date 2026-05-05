import { getCharacterList } from "@src/api/chara.js";
import { LevelBadge } from "@src/components/LevelBadge.jsx";
import { Pagination } from "@src/components/Pagination.jsx";
import { createMountedComponent } from "@src/utils/createMountedComponent.js";
import { get } from "@src/utils/http.js";
import { closeModal, openConfirmModal, openModal } from "@src/utils/modalManager.js";
import { normalizeAvatar } from "@src/utils/oos.js";
import { getCachedUserAssets } from "@src/utils/session.js";
import { showSuccess } from "@src/utils/toastManager.jsx";
import { getFavorites, getVisibleFavorites, saveFavorites } from "./favoriteStorage.js";
import { uploadToCloud } from "./favoriteSync.js";

// 角色名称缓存
const characterNameCache = new Map();
// 正在进行的请求Promise
const pendingRequests = new Map();

/**
 * 实际执行API请求的函数
 * @param {number} characterId - 角色ID
 * @returns {Promise<string|null>} 角色名称
 */
async function doFetchCharacterName(characterId) {
  try {
    const data = await get(
      `https://api.bgm.tv/v0/characters/${characterId}`,
      {},
      { xhrFields: { withCredentials: false } }
    );
    let characterName = null;

    if (data.infobox && Array.isArray(data.infobox)) {
      // 简体中文名
      const simplifiedChinese = data.infobox.find((item) => item.key === "简体中文名");
      if (simplifiedChinese && simplifiedChinese.value) {
        characterName = simplifiedChinese.value;
      }

      // 别名中的中文名
      if (!characterName) {
        const alias = data.infobox.find((item) => item.key === "别名");
        if (alias && alias.value && Array.isArray(alias.value)) {
          for (const item of alias.value) {
            if (item.k && item.k.includes("中文名") && item.v) {
              characterName = item.v;
              break;
            }
          }
        }
      }
    }

    // name字段
    if (!characterName && data.name) {
      characterName = data.name;
    }

    // 缓存结果
    if (characterName) {
      characterNameCache.set(characterId, characterName);
    }

    return characterName;
  } catch (error) {
    console.error(`获取角色 ${characterId} 名称失败:`, error);
    return null;
  } finally {
    // 请求完成后，从pending中移除
    pendingRequests.delete(characterId);
  }
}

/**
 * 从BGM API获取角色信息
 * @param {number} characterId - 角色ID
 * @returns {Promise<string|null>} 角色名称
 */
async function fetchCharacterName(characterId) {
  // 检查缓存
  if (characterNameCache.has(characterId)) {
    return characterNameCache.get(characterId);
  }

  // 检查是否有正在进行的请求，直接返回该Promise
  if (pendingRequests.has(characterId)) {
    return pendingRequests.get(characterId);
  }

  // 创建新的请求Promise
  const requestPromise = doFetchCharacterName(characterId);

  // 将Promise存入pending队列
  pendingRequests.set(characterId, requestPromise);
  return requestPromise;
}

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

  // 计算列数的函数
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

    if (loading && !favorite) {
      // 首次加载显示完整骨架屏
      const skeletonDiv = <div className="flex flex-col gap-1" />;

      // 工具栏骨架
      const toolbarSkeleton = (
        <div className="flex items-center justify-between gap-2 p-1">
          <div className="skeleton h-8 w-32 rounded-full" />
          <div className="skeleton h-8 w-16 rounded-full" />
        </div>
      );

      // 网格骨架
      const gridSkeleton = <div className="grid w-full p-1" />;

      // 渲染骨架屏网格
      const renderSkeleton = (cols) => {
        gridSkeleton.innerHTML = "";
        gridSkeleton.style.display = "grid";
        gridSkeleton.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        gridSkeleton.style.gap = "0.75rem";

        for (let i = 0; i < 48; i++) {
          const skeletonItem = (
            <div className="flex flex-col items-center gap-2 p-2">
              <div className="flex-shrink-0 border-2 border-transparent">
                <div className="tg-avatar skeleton size-14" />
              </div>
              <div className="skeleton my-0.5 h-4 w-16 rounded" />
            </div>
          );
          gridSkeleton.appendChild(skeletonItem);
        }
      };

      // 初始渲染
      const initialCols = calculateLayout(container.offsetWidth || 800);
      renderSkeleton(initialCols);

      // 监听容器宽度变化
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const width = entry.contentRect.width;
          const cols = calculateLayout(width);
          renderSkeleton(cols);
        }
      });
      observer.observe(container);

      skeletonDiv.appendChild(toolbarSkeleton);
      skeletonDiv.appendChild(gridSkeleton);

      return skeletonDiv;
    }

    if (error) {
      return <div className="py-8 text-center text-sm opacity-60">加载失败：{error}</div>;
    }

    if (!favorite) {
      return <div className="py-8 text-center text-sm opacity-60">收藏夹不存在</div>;
    }

    if (!loading && characters.length === 0) {
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
      const currentPageIds = characters.map((c) => c.CharacterId);
      const allCurrentPageSelected = currentPageIds.every((id) => selectedIds.includes(id));

      if (allCurrentPageSelected) {
        // 取消选择当前页的所有角色
        const newSelectedIds = selectedIds.filter((id) => !currentPageIds.includes(id));
        setState({ selectedIds: newSelectedIds });
      } else {
        // 选择当前页的所有角色
        const newSelectedIds = [...new Set([...selectedIds, ...currentPageIds])];
        setState({ selectedIds: newSelectedIds });
      }
    };

    // 移动或复制选中的角色到其他收藏夹
    const transferSelectedCharacters = (isMove) => {
      if (selectedIds.length === 0) return;

      const userAssets = getCachedUserAssets();
      const currentUserId = userAssets?.id;
      const favorites = getFavorites();
      const otherFavorites = getVisibleFavorites(favorites, currentUserId).filter(
        (f) => f.id !== favoriteId
      );

      if (otherFavorites.length === 0) {
        showSuccess(`没有其他收藏夹可以${isMove ? "移动" : "复制"}`);
        return;
      }

      const modalId = `${isMove ? "move" : "copy"}-characters-modal`;

      openModal(modalId, {
        title: `${isMove ? "移动" : "复制"} ${selectedIds.length} 个角色`,
        content: (
          <div className="flex flex-col gap-2 p-1">
            {otherFavorites.map((f) => (
              <div
                className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-gray-200 p-2 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                onClick={async () => {
                  const currentFavorite = favorites.find((fav) => fav.id === favoriteId);
                  if (!currentFavorite) return;

                  // 先过滤出不重复的角色ID
                  const newCharacterIds = selectedIds.filter((id) => !f.characters.includes(id));

                  if (newCharacterIds.length === 0) {
                    closeModal(modalId);
                    showSuccess("所有角色已在目标收藏夹中");
                    return;
                  }

                  // 如果是移动，从当前收藏夹移除
                  if (isMove) {
                    selectedIds.forEach((characterId) => {
                      const index = currentFavorite.characters.indexOf(characterId);
                      if (index > -1) {
                        currentFavorite.characters.splice(index, 1);
                      }
                    });
                  }

                  // 将不重复的角色添加到目标收藏夹开头
                  f.characters.unshift(...newCharacterIds);

                  // 更新目标收藏夹封面
                  if (!f.cover) {
                    f.cover = [];
                  }

                  // 只请求最多8个新角色的数据
                  const idsToFetch = newCharacterIds.slice(0, 8);
                  const charactersData = await getCharacterList(idsToFetch);

                  if (charactersData.success && charactersData.data) {
                    const characterAvatars = charactersData.data.map((c) =>
                      normalizeAvatar(c.Icon)
                    );
                    // 将新头像添加到封面开头
                    f.cover.unshift(...characterAvatars);
                    // 去重并保留前8个
                    f.cover = [...new Set(f.cover)].slice(0, 8);
                  }

                  // 更新时间戳
                  if (isMove) {
                    currentFavorite.updatedAt = Date.now();
                  }
                  f.updatedAt = Date.now();

                  saveFavorites(favorites);
                  uploadToCloud(favorites);

                  closeModal(modalId);
                  showSuccess(
                    `已${isMove ? "移动" : "复制"} ${newCharacterIds.length} 个角色到「${f.name}」`
                  );

                  // 通知父组件数据变化
                  if (onDataChange) {
                    onDataChange();
                  }

                  // 如果是移动，刷新角色列表
                  if (isMove) {
                    setState({
                      isSelecting: false,
                      selectedIds: [],
                      favorite: currentFavorite,
                    });
                    loadCharacters(currentPage);
                  } else {
                    setState({
                      isSelecting: false,
                      selectedIds: [],
                    });
                  }
                }}
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div className={`h-3 w-3 flex-shrink-0 rounded-full ${f.color}`} />
                  <span className="min-w-0 flex-1 truncate text-sm">{f.name}</span>
                  <span className="flex-shrink-0 text-xs opacity-60">{f.characters.length}</span>
                </div>
              </div>
            ))}
          </div>
        ),
        size: "sm",
      });
    };

    const moveSelectedCharacters = () => transferSelectedCharacters(true);
    const copySelectedCharacters = () => transferSelectedCharacters(false);

    // 删除选中的角色
    const deleteSelectedCharacters = () => {
      if (selectedIds.length === 0) return;

      openConfirmModal({
        title: "移除角色",
        message: `确定要从「${favorite.name}」中移除 ${selectedIds.length} 个角色吗？`,
        onConfirm: () => {
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
        },
      });
    };

    const contentDiv = <div className={`flex flex-col gap-1 ${isSelecting ? "pb-9" : ""}`} />;
    const gridDiv = <div className="grid w-full p-1" />;

    // 渲染骨架屏函数
    const renderSkeleton = (cols) => {
      gridDiv.innerHTML = "";
      gridDiv.style.display = "grid";
      gridDiv.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      gridDiv.style.gap = "0.75rem";

      for (let i = 0; i < 48; i++) {
        const skeletonItem = (
          <div className="flex flex-col items-center gap-2 p-2">
            <div className="flex-shrink-0 border-2 border-transparent">
              <div className="tg-avatar skeleton size-14" />
            </div>
            <div className="skeleton my-0.5 h-4 w-16 rounded" />
          </div>
        );
        gridDiv.appendChild(skeletonItem);
      }
    };

    // 渲染实际内容函数
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

        // 创建角色名称元素
        const nameSpan = (
          <span className="w-full min-w-0 truncate text-center text-sm" title={item.Name}>
            {item.Name}
          </span>
        );

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

            {/* 角色名称 */}
            {nameSpan}
          </div>
        );

        gridDiv.appendChild(itemDiv);

        // 如果是未上市角色，异步加载真实名称
        if (item.isUnlisted) {
          fetchCharacterName(item.CharacterId).then((realName) => {
            if (realName) {
              nameSpan.textContent = realName;
              nameSpan.title = realName;
            }
          });
        }
      });
    };

    // 初始渲染
    const initialCols = calculateLayout(container.offsetWidth || 800);
    if (loading) {
      renderSkeleton(initialCols);
    } else {
      renderItems(initialCols);
    }

    // 监听容器宽度变化
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const cols = calculateLayout(width);
        if (loading) {
          renderSkeleton(cols);
        } else {
          renderItems(cols);
        }
      }
    });

    observer.observe(container);

    // 添加工具栏
    const toolbarDiv = (
      <div className="flex items-center justify-between gap-2 p-1">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 dark:bg-gray-800">
            {!isSelecting && (
              <span className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">共</span>
                <span className="bgm-color mx-1 font-bold">{favorite.characters.length}</span>
                <span className="text-gray-600 dark:text-gray-400">个角色</span>
              </span>
            )}
            {isSelecting && (
              <span className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">已选择</span>
                <span className="bgm-color mx-1 font-bold">{selectedIds.length}</span>
                <span className="text-gray-600 dark:text-gray-400">项</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-sm rounded-full px-4" onClick={toggleSelectMode}>
            {isSelecting ? "取消" : "选择"}
          </button>
          {isSelecting && (
            <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-base-300 bg-base-100/80 shadow-lg backdrop-blur-md">
              <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
                <button className="btn btn-ghost btn-sm rounded-full" onClick={toggleSelectAll}>
                  {characters.every((c) => selectedIds.includes(c.CharacterId))
                    ? "取消全选"
                    : "全选"}
                </button>
                <div className="flex gap-2">
                  <button
                    className={`btn btn-primary btn-sm rounded-full text-white ${selectedIds.length === 0 ? "btn-disabled" : ""}`}
                    onClick={moveSelectedCharacters}
                  >
                    移动到
                  </button>
                  <button
                    className={`btn btn-secondary btn-sm rounded-full text-white ${selectedIds.length === 0 ? "btn-disabled" : ""}`}
                    onClick={copySelectedCharacters}
                  >
                    复制到
                  </button>
                  <button
                    className={`btn btn-error btn-sm rounded-full text-white ${selectedIds.length === 0 ? "btn-disabled" : ""}`}
                    onClick={deleteSelectedCharacters}
                  >
                    删除
                  </button>
                </div>
              </div>
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
