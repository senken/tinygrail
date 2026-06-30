/**
 * 合并分组props
 * @param {Object} storeProps store中读取到的分组props
 * @param {Object} componentProps 组件直接传入的分组props
 * @param {string[]} groupKeys 需要合并的分组key
 * @returns {Object} 合并后的分组props
 */
export function mergeGroupedProps(storeProps, componentProps, groupKeys) {
  return groupKeys.reduce((result, groupKey) => {
    result[groupKey] = {
      ...(storeProps?.[groupKey] || {}),
      ...(componentProps?.[groupKey] || {}),
    };
    return result;
  }, {});
}
