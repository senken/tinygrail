import stylesCSS from "./styles.css?inline";

/**
 * 加载样式到 parent.document
 */
function loadStyles() {
  const styleId = "rakuen-topiclist-styles";

  // 检查是否已经加载过
  if ($(parent.document).find(`#${styleId}`).length > 0) {
    return;
  }

  const styleElement = parent.document.createElement("style");
  styleElement.id = styleId;
  styleElement.textContent = stylesCSS;
  $(parent.document.head).append(styleElement);
}

/**
 * 适配移动端布局
 */
function adaptMobileLayout() {
  // 超展开菜单改下拉
  const parentBody = $("body", parent.document);

  var links = parentBody.find("#rakuenHeader .navigator .link a");
  parentBody.find("#rakuenHeader .navigator .link").html(links);
  var menu = (
    <div class="menu">
      <a href="#">菜单</a>
    </div>
  );
  parentBody.find("#rakuenHeader .navigator .menu").remove();
  parentBody.find("#rakuenHeader .navigator").append(menu);

  parentBody.find("#rakuenHeader .navigator .menu").on("click", () => {
    var link = parentBody.find("#rakuenHeader .navigator .link");
    link.css("display", link.css("display") === "none" ? "flex" : "none");
  });

  // 移动端viewport设置
  const viewportId = "rakuen-mobile-viewport";

  const updateViewport = () => {
    // 判断是否为移动端
    const isMobile = window.matchMedia("(max-width: 960px)").matches;
    const existingViewport = $(parent.document.head).find(`#${viewportId}`);

    if (isMobile && existingViewport.length === 0) {
      const viewport = (
        <meta
          id={viewportId}
          name="viewport"
          content="width=device-width,user-scalable=no,initial-scale=.75,maximum-scale=.75,minimum-scale=.75,viewport-fit=cover"
        />
      );
      $(parent.document.head).append(viewport);
    } else if (!isMobile && existingViewport.length > 0) {
      existingViewport.remove();
    }
  };

  // 初始化
  updateViewport();

  // 使用matchMedia监听屏幕尺寸变化
  const mediaQuery = window.matchMedia("(max-width: 960px)");
  mediaQuery.addEventListener("change", updateViewport);

  // Logo点击切换侧边栏
  parentBody
    .find("#rakuenHeader a.logo")
    .removeAttr("href")
    .off("click")
    .on("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      const container = parentBody.find("#container")[0];
      if (container) {
        container.classList.toggle("sidebar-visible");
      }
    });
}

/**
 * 超展开侧边栏组件
 */
export function RakuenTopiclist() {
  loadStyles();

  adaptMobileLayout();

  // 为话题列表项添加点击事件
  const items = $("#eden_tpc_list .item_list");
  const parentBody = $(parent.document.body);
  
  items.each(function() {
    const item = this;
    const link = $(item).find("a").attr("href");
    
    if (!link) return;
    
    // 保存原始链接
    item.dataset.link = link;
    
    // 添加点击事件
    $(item).on("click", function(e) {
      // 如果点击的是链接本身，阻止默认行为
      if (e.target.tagName === "A") {
        e.preventDefault();
      }
      
      // 在小屏幕下收起侧边栏（和点击 logo 一样的效果）
      const isMobile = parent.window.matchMedia("(max-width: 960px)").matches;
      if (isMobile) {
        const container = parentBody.find("#container")[0];
        if (container) {
          container.classList.remove("sidebar-visible");
        }
      }
      
      // 在右侧框架中打开链接
      window.open(item.dataset.link, "right");
    });
  });
}
