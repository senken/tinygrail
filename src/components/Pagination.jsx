import { ChevronLeftIcon, ChevronRightIcon } from "@src/icons/index.js";
import { EllipsisIcon, ChevronsLeftIcon, ChevronsRightIcon } from "@src/icons/index.js";

/**
 * 分页组件
 * @param {Object} props
 * @param {number} props.current - 当前页码
 * @param {number} props.total - 总页数
 * @param {Function} props.onChange - 页码变化回调函数
 * @param {string} props.type - 分页类型
 * @param {string} props.className - 额外的类名
 */
export function Pagination({ current = 1, total = 1, onChange, type = "normal", className = "" }) {
  const prevDisabled = current <= 1;
  const nextDisabled = current >= total;
  // 简单分页
  if (type === "simple") {
    const prevDisabled = current <= 1;

    const prevButton = (
      <button
        className={`flex items-center justify-center rounded-md border border-gray-300 p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          prevDisabled ? "" : "hover:bg-gray-100 dark:hover:bg-gray-700"
        } dark:border-gray-600`}
        onClick={() => onChange && onChange(current - 1)}
      >
        <ChevronLeftIcon />
      </button>
    );
    if (prevDisabled) prevButton.disabled = true;

    const nextButton = (
      <button
        className="flex items-center justify-center rounded-md border border-gray-300 p-1 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
        onClick={() => onChange && onChange(current + 1)}
      >
        <ChevronRightIcon />
      </button>
    );

    return (
      <div id="tg-pagination" className={`flex items-center gap-2 ${className}`}>
        {prevButton}
        <span className="text-sm opacity-60">第 {current} 页</span>
        {nextButton}
      </div>
    );
  }

  // 生成页码数组
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7; // 最多显示7个页码

    if (total <= maxVisible) {
      // 总页数少于最大显示数，显示所有页码
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // 总页数多于最大显示数，使用省略号
      if (current <= 4) {
        // 当前页在前面
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(total);
      } else if (current >= total - 3) {
        // 当前页在后面
        pages.push(1);
        pages.push("...");
        for (let i = total - 4; i <= total; i++) {
          pages.push(i);
        }
      } else {
        // 当前页在中间
        pages.push(1);
        pages.push("...");
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(total);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const prevButton = (
    <button
      className={`flex items-center justify-center rounded-l-md border border-gray-300 p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        prevDisabled ? "" : "hover:bg-gray-100 dark:hover:bg-gray-700"
      } dark:border-gray-600`}
      onClick={() => onChange && onChange(current - 1)}
    >
      <ChevronLeftIcon />
    </button>
  );
  if (prevDisabled) prevButton.disabled = true;

  const nextButton = (
    <button
      className={`flex items-center justify-center rounded-r-md border border-l-0 border-gray-300 p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        nextDisabled ? "" : "hover:bg-gray-100 dark:hover:bg-gray-700"
      } dark:border-gray-600`}
      onClick={() => onChange && onChange(current + 1)}
    >
      <ChevronRightIcon />
    </button>
  );
  if (nextDisabled) nextButton.disabled = true;

  return (
    <div id="tg-pagination" className={`flex flex-wrap items-center justify-center gap-2 ${className}`}>
      {/* 分页按钮组 */}
      <div className="inline-flex rounded-md">
        {/* 上一页 */}
        {prevButton}

        {/* 页码 */}
        {pageNumbers.map((page, index) => {
          if (page === "...") {
            // 判断是左侧还是右侧省略号
            const isLeft = index < pageNumbers.length / 2;
            const targetPage = isLeft
              ? Math.max(1, current - 5)
              : Math.min(total, current + 5);

            const ellipsisButton = (
              <button
                className="group flex min-w-[32px] items-center justify-center rounded-none border border-l-0 border-gray-300 px-2 py-1 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                onClick={() => onChange && onChange(targetPage)}
              >
                <span className="block group-hover:hidden">
                  <EllipsisIcon className="size-5" />
                </span>
                <span className="hidden group-hover:block">
                  {isLeft ? <ChevronsLeftIcon className="size-5" /> : <ChevronsRightIcon className="size-5" />}
                </span>
              </button>
            );

            return ellipsisButton;
          }

          return (
            <button
              className={`min-w-[32px] rounded-none border border-l-0 px-2 py-1 text-sm transition-colors ${
                page === current
                  ? "bgm-border-color bgm-bg text-white"
                  : "border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
              }`}
              onClick={() => {
                if (page !== current) {
                  onChange && onChange(page);
                }
              }}
            >
              {page}
            </button>
          );
        })}

        {/* 下一页 */}
        {nextButton}
      </div>

      {/* 跳转输入框 */}
      <div className="flex items-center gap-2">
        <span className="text-sm opacity-60">跳至</span>
        <input
          type="number"
          min="1"
          max={total}
          className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm text-center focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const value = parseInt(e.target.value);
              if (!isNaN(value)) {
                // 限制在有效范围内
                const targetPage = Math.max(1, Math.min(total, value));
                onChange && onChange(targetPage);
                e.target.value = "";
              }
            }
          }}
        />
        <span className="text-sm opacity-60">页</span>
      </div>
    </div>
  );
}
