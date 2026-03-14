import { BabelTower } from "../../babel-tower";
import { TopWeek } from "../../top-week";
import { LatestLinks } from "../../latest-links";
import { LatestTemples } from "../../latest-temples";

/**
 * 首页Tab组件
 */
export function HomeTab() {
  return (
    <div id="tg-rakuen-home-home-tab">
      <BabelTower />
      <TopWeek />
      <LatestLinks />
      <LatestTemples />
    </div>
  );
}
