/**
 * 创建DOM节点
 * @param tag 标签名
 * @param props 属性
 * @param children 子节点
 * @returns DOM节点
 */
export function h(tag, props, ...children) {
  props = props || {};

  if (typeof tag === 'function') {
    return tag({ ...props, children });
  }

  const $el = window.jQuery ? window.jQuery(`<${tag}>`) : document.createElement(tag);

  const appendChild = (parent, child) => {
    if (child == null || child === false) return;

    if (Array.isArray(child)) {
      child.forEach((c) => appendChild(parent, c));
      return;
    }

    if (child instanceof Node) {
      parent.appendChild(child);
    } else if (window.jQuery && child && child.jquery) {
      parent.appendChild(child[0]);
    } else {
      const text = document.createTextNode(String(child));
      parent.appendChild(text);
    }
  };

  Object.entries(props).forEach(([key, value]) => {
    if (key === 'children' || value == null) return;

    if (key === 'className') {
      if (window.jQuery && $el.jquery) {
        $el.addClass(value);
      } else {
        $el.className = value;
      }
      return;
    }

    if (key === 'style' && typeof value === 'object') {
      if (window.jQuery && $el.jquery) {
        $el.css(value);
      } else {
        Object.assign($el.style, value);
      }
      return;
    }

    if (/^on[A-Z]/.test(key) && typeof value === 'function') {
      const eventName = key.slice(2).toLowerCase();
      if (window.jQuery && $el.jquery) {
        $el.on(eventName, value);
      } else {
        $el.addEventListener(eventName, value);
      }
      return;
    }

    if (window.jQuery && $el.jquery) {
      $el.attr(key, value);
    } else {
      $el.setAttribute(key, value);
    }
  });

  const elNode = window.jQuery && $el.jquery ? $el[0] : $el;

  children.forEach((child) => appendChild(elNode, child));

  return elNode;
}

/**
 * Fragment：处理<></>标签
 * @param props 
 * @returns DOM节点
 */
export function Fragment(props) {
  const frag = document.createDocumentFragment();
  const { children } = props || {};
  if (children) {
    (Array.isArray(children) ? children : [children]).forEach((c) => {
      if (c instanceof Node) {
        frag.appendChild(c);
      }
    });
  }
  return frag;
}

/**
 * 把节点挂载到容器下
 * @param node 节点
 * @param container 容器
 */
export function mount(node, container) {
  if (!node) return;
  container.appendChild(node);
}
