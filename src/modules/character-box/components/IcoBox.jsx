import { IcoBoxHeader } from "./IcoBoxHeader.jsx";
import { IcoBoxUser } from "./IcoBoxUser.jsx";
import { IcoBoxInvest } from "./IcoBoxInvest.jsx";
import { calculateICO } from "@src/utils/ico.js";

/**
 * ICO信息盒子组件
 * @param {Object} props
 * @param {Object} props.data - 角色ICO数据
 * @param {Object} props.userAssets - 用户资产数据
 * @param {Object} props.icoUsers - ICO参与者数据
 * @param {Object} props.userIcoInfo - 当前用户ICO注资信息
 * @param {Function} props.loadIcoUsersPage - 加载指定页ICO参与者数据的函数
 * @param {Function} props.openUserModal - 打开用户信息Modal的函数
 * @param {Function} props.onInvest - 注资回调函数
 * @param {boolean} props.sticky - 是否启用粘性布局
 * @param {number} props.stickyTop - 粘性布局的top值
 */
export function IcoBox({
  data,
  userAssets,
  icoUsers,
  userIcoInfo,
  loadIcoUsersPage,
  openUserModal,
  onInvest,
  sticky = false,
  stickyTop = 0,
}) {
  if (!data) {
    return <div className="p-4 text-center">暂无数据</div>;
  }

  // 计算ICO数据
  const predicted = calculateICO({ Total: data.Total, Users: data.Users });

  const stickyClass = sticky ? "sticky z-20" : "";
  const stickyStyle = sticky ? { top: `${stickyTop}px` } : {};

  // 其他区域的stickyTop需要加上IcoBoxHeader的高度
  const otherStickyTop = stickyTop + 140;

  return (
    <div id="tg-ico-box" data-character-id={data.CharacterId} className="flex flex-col">
      <div 
        className={`tg-bg-content ${stickyClass}`}
        style={stickyStyle}
      >
        <IcoBoxHeader characterData={data} predicted={predicted} />
      </div>
      {/* ICO参与者列表 */}
      {icoUsers && (
        <IcoBoxUser
          users={icoUsers}
          predicted={predicted}
          loadUsersPage={loadIcoUsersPage}
          openUserModal={openUserModal}
          sticky={sticky}
          stickyTop={otherStickyTop}
        />
      )}
      {/* ICO注资 */}
      <IcoBoxInvest
        userIcoInfo={userIcoInfo}
        userAssets={userAssets}
        characterData={data}
        predicted={predicted}
        onInvest={onInvest}
      />
    </div>
  );
}
