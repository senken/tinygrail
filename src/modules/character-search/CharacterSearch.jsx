import { getUserCharas, searchCharacter } from "@src/api/chara.js";
import { LevelBadge } from "@src/components/LevelBadge.jsx";
import { Pagination } from "@src/components/Pagination.jsx";
import { createMountedComponent } from "@src/utils/createMountedComponent.js";
import { openModal } from "@src/utils/modalManager.js";
import { normalizeAvatar } from "@src/utils/oos.js";

/**
 * 角色搜索组件
 * @param {Object} props
 * @param {string} props.username - 用户名
 * @param {Function} props.onCharacterClick - 点击角色回调函数
 * @param {string} props.className - 额外的CSS类名
 */
export function CharacterSearch({ username, onCharacterClick, className = "" }) {
  // 组件容器
  const container = <div id="tg-character-search" className={className} />;

  const { setState } = createMountedComponent(container, (state) => {
    const {
      keyword = "",
      characters = null,
      currentPage = 1,
      totalPages = 0,
      loading = false,
      isSearchMode = false,
    } = state || {};

    // 使用局部变量存储输入框的值避免触发重新渲染
    let currentInputValue = keyword;

    /**
     * 处理搜索
     */
    const handleSearch = () => {
      const searchKeyword = currentInputValue.trim();
      if (searchKeyword) {
        setState({ keyword: searchKeyword, isSearchMode: true });
        loadSearchResults(searchKeyword);
      } else {
        setState({ keyword: "", isSearchMode: false, currentPage: 1 });
        loadCharacters(1);
      }
    };

    /**
     * 处理分页变化
     * @param {number} page - 目标页码
     */
    const handlePageChange = (page) => {
      setState({ currentPage: page });
      loadCharacters(page);
    };

    /**
     * 处理角色点击事件
     * @param {Object} character - 角色对象
     */
    const handleCharacterClick = (character) => {
      if (onCharacterClick) {
        onCharacterClick(character);
      }
    };

    // 内容容器
    const contentDiv = <div className="flex w-full flex-col gap-2" />;

    // 搜索框区域
    const searchDiv = (
      <div id="tg-character-search-input" className="sticky top-0 z-10 flex gap-1 bg-base-100 p-1">
        <div className="join w-full">
          <input
            type="text"
            className="input input-sm join-item input-bordered w-full !bg-base-100"
            placeholder="搜索角色（角色ID或名称）"
            value={keyword}
            onInput={(e) => {
              currentInputValue = e.target.value;
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />
          <button className="btn-bgm btn join-item btn-sm" onClick={handleSearch}>
            搜索
          </button>
        </div>
      </div>
    );
    contentDiv.appendChild(searchDiv);

    // 自动聚焦输入框
    setTimeout(() => {
      const input = searchDiv.querySelector("input");
      if (input) input.focus();
    }, 100);

    // 加载状态
    if (loading) {
      const loadingDiv = <div className="py-8 text-center text-sm opacity-60">加载中...</div>;
      contentDiv.appendChild(loadingDiv);
    }

    // 角色列表
    if (!loading && characters && characters.length > 0) {
      const listDiv = (
        <div
          id="tg-character-search-list"
          className="flex flex-col divide-y divide-gray-200 dark:divide-gray-700"
        />
      );

      characters.forEach((character) => {
        const itemDiv = (
          <div
            className="flex cursor-pointer items-center gap-3 p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => handleCharacterClick(character)}
            data-character-id={character.Id}
            data-level={character.Level}
          >
            {/* 角色头像 */}
            <img
              src={normalizeAvatar(character.Icon)}
              alt={character.Name}
              className="size-12 rounded-md object-cover object-top"
            />
            {/* 角色信息 */}
            <div className="flex flex-1 flex-col gap-0.5">
              {/* 等级徽章、ID和名称 */}
              <div className="flex items-center gap-2">
                <LevelBadge level={character.Level} zeroCount={character.ZeroCount} />
                <span className="text-sm">
                  #{character.Id}「{character.Name}」
                </span>
              </div>
              {/* 持股信息 */}
              <div className="flex flex-col gap-0.5 text-xs opacity-60">
                <div className="flex gap-3">
                  <span>可用：{character.UserAmount}</span>
                  <span>持股：{character.UserTotal}</span>
                </div>
                <div>固定资产：{character.Sacrifices}</div>
              </div>
            </div>
          </div>
        );
        listDiv.appendChild(itemDiv);
      });

      contentDiv.appendChild(listDiv);
    }

    // 空状态
    if (!loading && characters && characters.length === 0) {
      const emptyDiv = <div className="py-8 text-center text-sm opacity-60">未找到相关角色</div>;
      contentDiv.appendChild(emptyDiv);
    }

    // 分页组件
    if (!loading && !isSearchMode && totalPages > 1) {
      const paginationDiv = (
        <div id="tg-character-search-pagination" className="flex justify-center">
          <Pagination
            current={Number(currentPage) || 1}
            total={Number(totalPages)}
            onChange={handlePageChange}
          />
        </div>
      );
      contentDiv.appendChild(paginationDiv);
    }

    return contentDiv;
  });

  /**
   * 加载角色列表
   * @param {number} page - 页码
   */
  const loadCharacters = (page) => {
    setState({ loading: true });

    getUserCharas(username, page).then((result) => {
      if (result.success) {
        setState({
          characters: result.data.items,
          currentPage: result.data.currentPage,
          totalPages: result.data.totalPages,
          loading: false,
        });
      } else {
        setState({
          characters: [],
          loading: false,
        });
      }
    });
  };

  /**
   * 加载搜索结果
   * @param {string} keyword - 搜索关键字
   */
  const loadSearchResults = (keyword) => {
    setState({ loading: true });

    searchCharacter(keyword).then((result) => {
      if (result.success) {
        setState({
          characters: result.data || [],
          loading: false,
        });
      } else {
        setState({
          characters: [],
          loading: false,
        });
      }
    });
  };

  // 组件初始化
  loadCharacters(1);

  return container;
}

/**
 * 打开角色搜索弹窗
 * @param {Object} params
 * @param {string} params.title - 弹窗标题
 * @param {string} params.username - 用户名
 * @param {Function} params.onCharacterClick - 点击角色回调函数
 */
export function openCharacterSearchModal({ title, username, onCharacterClick }) {
  const modalId = `character-search-${username}`;

  openModal(modalId, {
    title,
    content: <CharacterSearch username={username} onCharacterClick={onCharacterClick} />,
  });
}
