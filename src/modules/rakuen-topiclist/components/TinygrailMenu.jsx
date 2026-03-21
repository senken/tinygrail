/**
 * 小圣杯菜单组件
 * @param {Object} props - 组件属性
 * @param {Function} props.onRecentClick - 最近活跃点击回调
 * @param {Function} props.onAuctionClick - 我的拍卖点击回调
 * @param {Function} props.onBidClick - 我的买单点击回调
 * @param {Function} props.onAskClick - 我的卖单点击回调
 * @param {Function} props.onItemClick - 我的道具点击回调
 * @param {Function} props.onLogClick - 资金日志点击回调
 * @param {Function} props.onCharasClick - 我的持仓点击回调
 */
export function TinygrailMenu({
  onRecentClick,
  onAuctionClick,
  onBidClick,
  onAskClick,
  onItemClick,
  onLogClick,
  onCharasClick,
}) {
  /**
   * 菜单项点击处理
   * @param {Function} callback - 点击后的回调函数
   */
  const menuItemClicked = (callback) => {
    $(".timelineTabs a").removeClass("focus");
    $(".timelineTabs a").removeClass("top_focus");
    $("#recentMenu > a").addClass("focus");
    if (callback) callback();
  };

  // 返回菜单DOM
  return (
    <li id="recentMenu">
      <a
        href="#"
        class="top"
        onClick={(e) => {
          e.preventDefault();
          menuItemClicked(() => {
            if (onRecentClick) onRecentClick();
          });
        }}
      >
        小圣杯
      </a>
      <ul>
        <li>
          <a
            href="#"
            id="tg-menu-recent"
            onClick={(e) => {
              e.preventDefault();
              menuItemClicked(() => {
                if (onRecentClick) onRecentClick();
              });
            }}
          >
            最近活跃
          </a>
        </li>
        <li>
          <a
            href="#"
            id="tg-menu-charas"
            onClick={(e) => {
              e.preventDefault();
              menuItemClicked(() => {
                if (onCharasClick) onCharasClick();
              });
            }}
          >
            我的持仓
          </a>
        </li>
        <li>
          <a
            href="#"
            id="tg-menu-auction"
            onClick={(e) => {
              e.preventDefault();
              menuItemClicked(() => {
                if (onAuctionClick) onAuctionClick();
              });
            }}
          >
            我的拍卖
          </a>
        </li>
        <li>
          <a
            href="#"
            id="tg-menu-bid"
            onClick={(e) => {
              e.preventDefault();
              menuItemClicked(() => {
                if (onBidClick) onBidClick();
              });
            }}
          >
            我的买单
          </a>
        </li>
        <li>
          <a
            href="#"
            id="tg-menu-ask"
            onClick={(e) => {
              e.preventDefault();
              menuItemClicked(() => {
                if (onAskClick) onAskClick();
              });
            }}
          >
            我的卖单
          </a>
        </li>
        <li>
          <a
            href="#"
            id="tg-menu-item"
            onClick={(e) => {
              e.preventDefault();
              menuItemClicked(() => {
                if (onItemClick) onItemClick();
              });
            }}
          >
            我的道具
          </a>
        </li>
        <li>
          <a
            href="#"
            id="tg-menu-log"
            onClick={(e) => {
              e.preventDefault();
              menuItemClicked(() => {
                if (onLogClick) onLogClick();
              });
            }}
          >
            资金日志
          </a>
        </li>
      </ul>
    </li>
  );
}
