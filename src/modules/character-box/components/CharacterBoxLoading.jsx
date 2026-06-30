/**
 * CharacterBox加载动画
 * @returns {HTMLElement} 加载动画节点
 */
export function CharacterBoxLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <span
        className="loading loading-ring loading-lg"
        style={{ color: "var(--primary-color, #f09199)" }}
      ></span>
    </div>
  );
}
