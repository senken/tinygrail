import { mount } from "./jsx-dom.js";

/**
 * 组件挂载器
 * @param {*} container 渲染目标容器节点
 * @param {*} renderWithState 渲染函数 (state, setState) => node
 * @param {boolean} autoRender 是否自动渲染，默认 false
 * @returns {*}
 */
export function createMountedComponent(container, renderWithState, autoRender = false) {
  // 当前组件的状态对象
  let state = {};
  // 当前已经挂载在页面上的根节点
  let currentNode = null;

  /**
   * 更新组件的状态对象
   * @param {*} partial
   */
  function setState(partial) {
    state = { ...state, ...partial };
    render();
  }

  /**
   * 渲染节点
   */
  function render() {
    const node = renderWithState(state, setState);

    if (currentNode && currentNode.parentNode === container) {
      container.replaceChild(node, currentNode);
    } else {
      container.innerHTML = "";
      mount(node, container);
    }

    currentNode = node;
  }

  // 如果启用自动渲染，立即执行首次渲染
  if (autoRender) {
    render();
  }

  return { setState, render };
}
