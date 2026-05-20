import { createMountedComponent } from "./createMountedComponent.js";
import { destroyStore, getOrCreateStore } from "./store.js";

/**
 * 统一整理可选参数
 *
 * @param {Object} options 外部传入选项
 * @returns {Object} 标准化后的选项对象
 */
function normalizeOptions(options) {
  return {
    initialState: options.initialState || {},
    autoRender: options.autoRender === true,
    destroyStoreOnDestroy: options.destroyStoreOnDestroy === true,
  };
}

/**
 * 创建一个绑定全局store的挂载组件
 *
 * @param {HTMLElement} container 挂载容器
 * @param {string} storeKey 全局store唯一标识
 * @param {Function} renderWithStore 渲染函数 (state,setState,store)=>node
 * @param {Object} options 配置项
 * @returns {Object} 组件控制对象
 */
export function createMountedComponentWithStore(
  container,
  storeKey,
  renderWithStore,
  options = {}
) {
  if (typeof renderWithStore !== "function") {
    throw new TypeError("renderWithStore must be a function");
  }

  const { initialState, autoRender, destroyStoreOnDestroy } = normalizeOptions(options);

  const store = getOrCreateStore(storeKey, initialState);

  const mountedComponent = createMountedComponent(
    container,
    () => renderWithStore(store.getState(), store.setState, store),
    false
  );

  const unsubscribe = store.subscribe(() => {
    mountedComponent.render();
  });

  if (autoRender) {
    mountedComponent.render();
  }

  function destroy() {
    unsubscribe();

    if (destroyStoreOnDestroy && store.getSubscriberCount() === 0) {
      destroyStore(storeKey);
    }
  }

  return {
    storeKey,
    store,
    render: mountedComponent.render,
    destroy,
    unsubscribe,
    getState: store.getState,
    setState: store.setState,
    replaceState: store.replaceState,
    resetState: store.resetState,
    subscribe: store.subscribe,
  };
}
