/**
 * 滚动到最近的可滚动容器顶部
 * @param {HTMLElement} element - 起始元素
 * @param {string} selector - 可滚动容器的选择器
 */
export function scrollToTop(element, selector = ".overflow-auto") {
  const scrollableContainer = element.closest(selector);
  if (scrollableContainer) {
    scrollableContainer.scrollTo({ top: 0, behavior: "smooth" });
  }
}
