/**
 * 全局store注册表
 */
const storeRegistry = new Map();

/**
 * 判断是否为普通对象
 *
 * @param {*} value 任意值
 * @returns {boolean} 是否为普通对象
 */
function isPlainObject(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

/**
 * 克隆初始状态
 *
 * @param {*} initialState 初始状态
 * @returns {Object} 克隆后的状态对象
 */
function cloneInitialState(initialState) {
  return isPlainObject(initialState) ? { ...initialState } : {};
}

/**
 * 校验storeKey
 *
 * @param {string} storeKey store唯一标识
 */
function assertStoreKey(storeKey) {
  if (storeKey == null || storeKey === "") {
    throw new TypeError("storeKey is required");
  }
}

/**
 * 创建一个独立store
 *
 * @param {Object} initialState 初始状态
 * @param {Object} options 可选项
 * @param {Function} options.onDestroy 销毁时的回调
 * @returns {Object} store实例
 */
export function createStore(initialState = {}, options = {}) {
  const { onDestroy } = options;
  const baseState = cloneInitialState(initialState);
  let state = { ...baseState };
  let destroyed = false;
  const listeners = new Set();

  const api = {
    getState,
    setState,
    replaceState,
    resetState,
    subscribe,
    destroy,
    isDestroyed,
    getSubscriberCount,
  };

  /**
   * 获取当前状态
   *
   * @returns {Object} 当前状态
   */
  function getState() {
    return state;
  }

  /**
   * 通知订阅者
   *
   * @param {Object} nextState 更新后的状态
   * @param {Object} previousState 更新前的状态
   */
  function notify(nextState, previousState) {
    listeners.forEach((listener) => {
      listener(nextState, previousState, api);
    });
  }

  /**
   * 浅合并更新状态
   *
   * @param {Object|Function} partial 局部状态或状态计算函数
   * @returns {Object} 更新后的完整状态
   */
  function setState(partial) {
    if (destroyed) {
      return state;
    }

    const nextPartial = typeof partial === "function" ? partial(state) : partial;
    if (!isPlainObject(nextPartial)) {
      return state;
    }

    const previousState = state;
    state = { ...state, ...nextPartial };
    notify(state, previousState);

    return state;
  }

  /**
   * 整体替换状态
   *
   * @param {Object|Function} nextState 新状态或状态计算函数
   * @returns {Object} 更新后的完整状态
   */
  function replaceState(nextState) {
    if (destroyed) {
      return state;
    }

    const resolvedState = typeof nextState === "function" ? nextState(state) : nextState;
    const previousState = state;
    state = cloneInitialState(resolvedState);
    notify(state, previousState);

    return state;
  }

  /**
   * 重置状态
   *
   * @returns {Object} 重置后的状态
   */
  function resetState() {
    return replaceState(baseState);
  }

  /**
   * 订阅状态变化
   *
   * @param {Function} listener 状态变化回调
   * @param {Object} options 订阅选项
   * @param {boolean} options.immediate 是否立即触发一次
   * @returns {Function} 取消订阅函数
   */
  function subscribe(listener, options = {}) {
    if (destroyed || typeof listener !== "function") {
      return () => {};
    }

    listeners.add(listener);

    if (options.immediate) {
      listener(state, state, api);
    }

    return () => {
      listeners.delete(listener);
    };
  }

  /**
   * 销毁store
   *
   * @returns {boolean} 是否成功销毁
   */
  function destroy() {
    if (destroyed) {
      return false;
    }

    destroyed = true;
    listeners.clear();

    if (typeof onDestroy === "function") {
      onDestroy(api);
    }

    return true;
  }

  /**
   * 判断store是否已销毁
   *
   * @returns {boolean}
   */
  function isDestroyed() {
    return destroyed;
  }

  /**
   * 获取订阅者数量
   *
   * @returns {number}
   */
  function getSubscriberCount() {
    return listeners.size;
  }

  return api;
}

/**
 * 判断store是否存在
 *
 * @param {string} storeKey store唯一标识
 * @returns {boolean}
 */
export function hasStore(storeKey) {
  assertStoreKey(storeKey);
  return storeRegistry.has(storeKey);
}

/**
 * 获取已有store
 *
 * @param {string} storeKey store唯一标识
 * @returns {Object|null}
 */
export function getStore(storeKey) {
  assertStoreKey(storeKey);
  return storeRegistry.get(storeKey) || null;
}

/**
 * 获取或创建store
 *
 * @param {string} storeKey store唯一标识
 * @param {Object} initialState store不存在时使用的初始状态
 * @returns {Object} store实例
 */
export function getOrCreateStore(storeKey, initialState = {}) {
  assertStoreKey(storeKey);
  const existingStore = getStore(storeKey);
  if (existingStore) {
    return existingStore;
  }

  const store = createStore(initialState, {
    onDestroy: () => {
      if (storeRegistry.get(storeKey) === store) {
        storeRegistry.delete(storeKey);
      }
    },
  });

  storeRegistry.set(storeKey, store);
  return store;
}

/**
 * 通过storeKey获取状态
 *
 * @param {string} storeKey store唯一标识
 * @param {Object} fallbackState store不存在时返回的默认状态
 * @returns {Object}
 */
export function getStoreState(storeKey, fallbackState = {}) {
  const store = getStore(storeKey);
  return store ? store.getState() : cloneInitialState(fallbackState);
}

/**
 * 通过storeKey浅合并更新状态
 *
 * @param {string} storeKey store唯一标识
 * @param {Object|Function} partial 局部状态或状态计算函数
 * @param {Object} initialState store不存在时的初始状态
 * @returns {Object}
 */
export function setStoreState(storeKey, partial, initialState = {}) {
  return getOrCreateStore(storeKey, initialState).setState(partial);
}

/**
 * 通过storeKey整体替换状态
 *
 * @param {string} storeKey store唯一标识
 * @param {Object|Function} nextState 新状态或状态计算函数
 * @param {Object} initialState store不存在时的初始状态
 * @returns {Object}
 */
export function replaceStoreState(storeKey, nextState, initialState = {}) {
  return getOrCreateStore(storeKey, initialState).replaceState(nextState);
}

/**
 * 重置指定store
 *
 * @param {string} storeKey store唯一标识
 * @returns {Object|null}
 */
export function resetStoreState(storeKey) {
  const store = getStore(storeKey);
  return store ? store.resetState() : null;
}

/**
 * 通过storeKey订阅状态变化
 *
 * @param {string} storeKey store唯一标识
 * @param {Function} listener 状态变化回调
 * @param {Object} options 订阅选项
 * @param {Object} initialState store不存在时的初始状态
 * @returns {Function} 取消订阅函数
 */
export function subscribeStore(storeKey, listener, options = {}, initialState = {}) {
  return getOrCreateStore(storeKey, initialState).subscribe(listener, options);
}

/**
 * 销毁指定store
 *
 * @param {string} storeKey store唯一标识
 * @returns {boolean}
 */
export function destroyStore(storeKey) {
  const store = getStore(storeKey);
  if (!store) {
    return false;
  }

  return store.destroy();
}

/**
 * 清空所有store
 */
export function clearStores() {
  Array.from(storeRegistry.keys()).forEach((storeKey) => {
    destroyStore(storeKey);
  });
}

/**
 * 获取所有storeKey
 *
 * @returns {string[]}
 */
export function getStoreKeys() {
  return Array.from(storeRegistry.keys());
}
