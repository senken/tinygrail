/**
 * 滚动到最近的可滚动容器顶部
 * @param {HTMLElement} element - 起始元素
 * @param {string} selector - 可滚动容器的选择器
 */
export function scrollToTop(element, selector = null) {
  let scrollableContainer;
  
  if (selector) {
    scrollableContainer = element.closest(selector);
  } else {
    scrollableContainer = element.closest(".overflow-auto, .overflow-y-auto");
  }
  
  if (scrollableContainer) {
    scrollableContainer.scrollTo({ top: 0, behavior: "smooth" });
  }
}
