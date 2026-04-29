/**
 * PostCSS插件：将prefers-color-scheme媒体查询替换为data-theme选择器
 */
module.exports = () => {
  return {
    postcssPlugin: "postcss-replace-prefers-color-scheme",
    AtRule: {
      media: (atRule) => {
        // 匹配prefers-color-scheme
        const match = atRule.params.match(/prefers-color-scheme:\s*(\w+)/);
        
        if (match) {
          const theme = match[1]; // 提取主题名称
          
          // 将@media规则转换为普通规则
          const newRule = atRule.clone();
          
          // 遍历所有子规则
          newRule.each((rule) => {
            if (rule.type === "rule") {
              // 为每个选择器添加html[data-theme='theme']前缀
              rule.selector = rule.selector
                .split(",")
                .map((selector) => {
                  const trimmed = selector.trim();
                  // 如果选择器以:root开头，替换为 html[data-theme='theme']
                  if (trimmed.startsWith(":root")) {
                    return trimmed.replace(":root", `html[data-theme='${theme}']`);
                  }

                  return `html[data-theme='${theme}'] ${trimmed}`;
                })
                .join(", ");
            }
          });
          
          // 将子规则插入到原位置
          newRule.each((child) => {
            atRule.parent.insertBefore(atRule, child);
          });
          
          // 移除 @media规则
          atRule.remove();
        }
      },
    },
  };
};

module.exports.postcss = true;
