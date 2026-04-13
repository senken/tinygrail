import { Button } from "@src/components/Button.jsx";

/**
 * 圣殿操作区域组件
 * @param {Object} props
 * @param {Object} props.temple - 圣殿对象
 * @param {Function} props.onChangeCover - 修改封面回调
 * @param {Function} props.onResetCover - 重置封面回调
 * @param {Function} props.onChangeLine - 修改台词回调
 * @param {Function} props.onLink - LINK回调
 * @param {Function} props.onRefine - 精炼回调
 * @param {Function} props.onPost - 虚空道标回调
 * @param {Function} props.onFisheye - 鲤鱼之眼回调
 * @param {Function} props.onStardust - 星光碎片回调
 * @param {Function} props.onAttack - 闪光结晶回调
 * @param {Function} props.onStarForces - 星之力回调
 * @param {Function} props.onChaosCube - 混沌魔方回调
 * @param {Function} props.onDestroy - 拆除回调
 */
export function TempleActions({
  temple,
  onChangeCover,
  onResetCover,
  onChangeLine,
  onLink,
  onRefine,
  onPost,
  onFisheye,
  onStardust,
  onAttack,
  onStarForces,
  onChaosCube,
  onDestroy,
}) {
  // 从缓存中获取当前用户资产
  let isOwnTemple = false;
  let isGameMaster = false;

  try {
    const cachedUserAssets = localStorage.getItem("tinygrail:user-assets");
    if (cachedUserAssets) {
      const userAssets = JSON.parse(cachedUserAssets);
      const currentUserId = userAssets.id;
      const userType = userAssets.type;

      // 判断是否是自己的圣殿
      isOwnTemple = temple.UserId === currentUserId;

      // 判断是否是管理员（type >= 999 或 id == 702）
      isGameMaster = userType >= 999 || currentUserId === 702;
    }
  } catch (e) {
    console.warn("读取用户资产缓存失败:", e);
  }

  // 定义按钮配置
  const buttons = [
    {
      label: "修改",
      show: isOwnTemple,
      onClick: onChangeCover,
    },
    {
      label: "重置",
      show: isOwnTemple || isGameMaster,
      onClick: onResetCover,
    },
    {
      label: "LINK",
      show: isOwnTemple,
      onClick: onLink,
    },
    {
      label: "台词",
      show: isOwnTemple,
      onClick: onChangeLine,
    },
    {
      label: "精炼",
      show: isOwnTemple,
      onClick: onRefine,
    },
    {
      label: "混沌魔方",
      show: isOwnTemple,
      onClick: onChaosCube,
    },
    {
      label: "虚空道标",
      show: isOwnTemple,
      onClick: onPost,
    },
    {
      label: "鲤鱼之眼",
      show: isOwnTemple,
      onClick: onFisheye,
    },
    {
      label: "星光碎片",
      show: isOwnTemple,
      onClick: onStardust,
    },
    {
      label: "闪光结晶",
      show: isOwnTemple,
      onClick: onAttack,
    },
    {
      label: "星之力",
      show: isOwnTemple,
      onClick: onStarForces,
    },
    {
      label: "拆除",
      show: isOwnTemple && temple.Assets == temple.Sacrifices,
      onClick: onDestroy,
    },
  ];

  // 过滤出需要显示的按钮
  const visibleButtons = buttons.filter((btn) => btn.show);

  // 如果没有可显示的按钮，不渲染
  if (visibleButtons.length === 0) {
    return <div id="tg-temple-actions" className="flex flex-wrap gap-2" />;
  }

  return (
    <div id="tg-temple-actions" className="flex flex-wrap gap-2 p-4 pt-2">
      {visibleButtons.map((btn, index) => (
        <Button
          variant={btn.label === "拆除" ? "solid" : "outline"}
          onClick={btn.onClick}
          className={btn.label === "拆除" ? "!bg-red-500 hover:!bg-red-600" : ""}
        >
          {btn.label}
        </Button>
      ))}
    </div>
  );
}
