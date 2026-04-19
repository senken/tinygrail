module.exports = {
  plugins: {
    'postcss-nesting': {},
    tailwindcss: {},
    autoprefixer: {},
    // 给所有样式添加.tinygrail前缀
    'postcss-prefix-selector': {
      prefix: '.tinygrail',
      // 排除不需要添加前缀的选择器
      exclude: [
        /^html/,
        /^body/,
        /^:root/,
        /\.tinygrail/,
        /^@keyframes/,
      ],
      // 自定义转换函数
      transform: function (prefix, selector, prefixedSelector) {
        // 如果选择器已经包含.tinygrail，不添加前缀
        if (selector.includes('.tinygrail')) {
          return selector;
        }
        return prefixedSelector;
      },
    },
  },
};
