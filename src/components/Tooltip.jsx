import { Fragment } from "@src/utils/jsx-dom.js";
import { createMountedComponent } from "@src/utils/createMountedComponent.js";

/**
 * Tooltip组件
 * @param {Object} props
 * @param {JSX.Element} props.children - 触发元素
 * @param {JSX.Element|string} props.content - Tooltip内容
 * @param {('hover'|'click')} props.trigger - 触发方式
 * @param {('top'|'bottom'|'left'|'right')} props.placement - 位置
 */
export function Tooltip({ children, content, trigger = "hover", placement = "top" }) {
  const container = <div id="tg-tooltip" className="relative inline-block" />;
  let tooltipRef = null;

  const { setState } = createMountedComponent(
    container,
    (state, setStateParam) => {
      const { visible } = state || {};

      // 位置样式
      const placementClasses = {
        top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
        bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
        left: "right-full top-1/2 -translate-y-1/2 mr-2",
        right: "left-full top-1/2 -translate-y-1/2 ml-2",
      };

      const handleMouseEnter = () => {
        if (trigger === "hover") {
          setStateParam({ visible: true });
        }
      };

      const handleMouseLeave = () => {
        if (trigger === "hover") {
          setStateParam({ visible: false });
        }
      };

      const handleClick = (e) => {
        if (trigger === "click") {
          e.stopPropagation();
          setStateParam({ visible: !visible });
        }
      };

      return (
        <>
          <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
          >
            {children}
          </div>
          {visible && (
            <div
              id="tg-tooltip-content"
              ref={(el) => (tooltipRef = el)}
              className={`absolute z-50 whitespace-nowrap rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 shadow-lg dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 ${placementClasses[placement]}`}
            >
              {content}
            </div>
          )}
        </>
      );
    },
    true
  );

  return container;
}
