import { IcoBoxHeader } from "./IcoBoxHeader.jsx";
import { IcoBoxUser } from "./IcoBoxUser.jsx";
import { IcoBoxInvest } from "./IcoBoxInvest.jsx";
import { calculateICO } from "@src/utils/ico.js";
import {
  createIcoBoxTitlePropsFromComponentProps,
  createIcoBoxContentPropsFromComponentProps,
} from "./icoBoxProps.js";

/**
 * 计算IcoBox展示所需的数据
 * @param {Object} data 角色ICO数据
 * @returns {Object} 计算后的ICO数据
 */
export function calculateIcoBoxPredicted(data) {
  return calculateICO({ Total: data.Total, Users: data.Users });
}

/**
 * IcoBox标题区域
 * @param {Object} props 组件参数
 * @param {Object} props.data 角色ICO数据
 * @param {Object} props.actions 标题操作
 * @param {Object} props.predicted 计算后的ICO数据
 * @param {string} props.storeKey 标题区storeKey
 * @returns {HTMLElement} 标题区域元素
 */
export function IcoBoxTitle(props) {
  const {
    predicted,
  } = props || {};
  const { data, actions } = createIcoBoxTitlePropsFromComponentProps(props);
  const { characterData } = data;

  if (!characterData) {
    return <div />;
  }

  const icoPredicted = predicted || calculateIcoBoxPredicted(characterData);

  return (
    <IcoBoxHeader
      characterData={characterData}
      predicted={icoPredicted}
      onFavoriteClick={actions.openFavoriteModal}
    />
  );
}

/**
 * IcoBox内容区域
 * @param {Object} props 组件参数
 * @param {Object} props.data 内容数据
 * @param {Object} props.actions 内容操作
 * @param {Object} props.options 内容配置
 * @param {Object} props.predicted 计算后的ICO数据
 * @param {string} props.storeKey 内容区storeKey
 * @returns {HTMLElement} 内容区域元素
 */
export function IcoBoxContent(props) {
  const {
    predicted,
  } = props || {};
  const { data, actions, options } = createIcoBoxContentPropsFromComponentProps(props);
  const { characterData, userAssets, icoUsers, userIcoInfo } = data;
  const { stickyTop: resolvedStickyTop, headerBgClass: resolvedHeaderBgClass } = options;

  if (!characterData) {
    return <div />;
  }

  const icoPredicted = predicted || calculateIcoBoxPredicted(characterData);

  return (
    <div>
      <IcoBoxUser
        users={icoUsers}
        predicted={icoPredicted}
        loadIcoUsersPage={actions.loadIcoUsersPage}
        openUserModal={actions.openUserModal}
        stickyTop={resolvedStickyTop}
        headerBgClass={resolvedHeaderBgClass}
      />
      <IcoBoxInvest
        userIcoInfo={userIcoInfo}
        userAssets={userAssets}
        characterData={characterData}
        predicted={icoPredicted}
        onInvest={actions.onInvest}
      />
    </div>
  );
}

/**
 * IcoBox组件
 * @param {Object} props 组件参数
 * @param {Object} props.titleProps 标题组件参数
 * @param {Object} props.contentProps 内容组件参数
 * @returns {HTMLElement} 完整的组件容器
 */
export function IcoBox(props) {
  const {
    titleProps,
    contentProps,
  } = props || {};
  const characterData =
    titleProps?.data?.characterData || contentProps?.data?.characterData;

  if (!characterData) {
    return <div />;
  }

  const predicted = calculateIcoBoxPredicted(characterData);

  return (
    <div className="flex flex-col">
      <div>
        <IcoBoxTitle {...titleProps} predicted={predicted} />
      </div>
      <IcoBoxContent
        {...contentProps}
        predicted={predicted}
      />
    </div>
  );
}
