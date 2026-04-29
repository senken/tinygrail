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
 * @param {Function} props.onFavoriteClick - 点击收藏按钮的回调
 * @returns {HTMLElement} 完整的组件容器
 */
export function IcoBox(props) {
  const {
    data,
    userAssets,
    icoUsers,
    userIcoInfo,
    loadIcoUsersPage,
    openUserModal,
    onInvest,
    onFavoriteClick,
  } = props || {};

  if (!data) {
    return <div />;
  }

  // 计算ICO数据
  const predicted = calculateICO({ Total: data.Total, Users: data.Users });

  return (
    <div className="flex flex-col">
      <div>
        <IcoBoxHeader characterData={data} predicted={predicted} onFavoriteClick={onFavoriteClick} />
      </div>
      <div>
        <IcoBoxUser
          users={icoUsers}
          predicted={predicted}
          loadUsersPage={loadIcoUsersPage}
          openUserModal={openUserModal}
        />
        <IcoBoxInvest
          userIcoInfo={userIcoInfo}
          userAssets={userAssets}
          characterData={data}
          predicted={predicted}
          onInvest={onInvest}
        />
      </div>
    </div>
  );
}
