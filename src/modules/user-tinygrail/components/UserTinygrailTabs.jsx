import { Tabs } from "@src/components/Tabs.jsx";
import { LinksTab } from "./LinksTab.jsx";
import { TemplesTab } from "./TemplesTab.jsx";
import { CharasTab } from "./CharasTab.jsx";
import { ICOsTab } from "./ICOsTab.jsx";

/**
 * 用户小圣杯Tabs容器组件
 * @param {Object} props
 * @param {number} props.activeTab - 当前激活的tab索引
 * @param {Function} props.onTabChange - tab切换回调
 * @param {Object} props.charaLinks - 连接数据
 * @param {Object} props.temples - 圣殿数据
 * @param {Object} props.charas - 角色数据
 * @param {Object} props.icos - ICO数据
 * @param {Function} props.onLinksPageChange - 连接分页变化回调
 * @param {Function} props.onTemplesPageChange - 圣殿分页变化回调
 * @param {Function} props.onCharasPageChange - 角色分页变化回调
 * @param {Function} props.onICOsPageChange - ICO分页变化回调
 * @param {Function} props.onCharacterClick - 角色点击回调
 * @param {Function} props.onTempleClick - 圣殿点击回调
 * @param {string} props.stickyTop - Tabs粘性定位的top值
 */
export function UserTinygrailTabs({
  activeTab,
  onTabChange,
  charaLinks,
  temples,
  charas,
  icos,
  onLinksPageChange,
  onTemplesPageChange,
  onCharasPageChange,
  onICOsPageChange,
  onCharacterClick,
  onTempleClick,
  stickyTop = null,
}) {
  const tabItems = [];

  if (charaLinks && charaLinks.totalItems > 0) {
    tabItems.push({
      key: "links",
      label: `${charaLinks.totalItems}组连接`,
      component: () => (
        <LinksTab
          data={charaLinks}
          onPageChange={onLinksPageChange}
          onCharacterClick={onCharacterClick}
          onTempleClick={onTempleClick}
        />
      ),
    });
  }

  if (temples) {
    tabItems.push({
      key: "temples",
      label: `${temples.totalItems}座圣殿`,
      component: () => (
        <TemplesTab
          data={temples}
          onPageChange={onTemplesPageChange}
          onCharacterClick={onCharacterClick}
          onTempleClick={onTempleClick}
        />
      ),
    });
  }

  if (charas) {
    tabItems.push({
      key: "charas",
      label: `${charas.totalItems}个人物`,
      component: () => (
        <CharasTab
          data={charas}
          onPageChange={onCharasPageChange}
          onCharacterClick={onCharacterClick}
        />
      ),
    });
  }

  if (icos) {
    tabItems.push({
      key: "icos",
      label: `${icos.totalItems}个ICO`,
      component: () => (
        <ICOsTab data={icos} onPageChange={onICOsPageChange} onCharacterClick={onCharacterClick} />
      ),
    });
  }

  // 如果没有数据，显示加载中
  if (tabItems.length === 0) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="tg-bg-content rounded-lg p-8 text-center">
          <p className="text-lg opacity-60">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <Tabs
      items={tabItems}
      activeTab={activeTab}
      onTabChange={onTabChange}
      sticky={true}
      stickyTop={stickyTop}
      navBgClass="tg-bg-content"
      contentBgClass="tg-bg-content"
    />
  );
}
