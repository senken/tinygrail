/**
 * 计算ICO相关数据
 * @param {Object} ico - ICO数据对象
 * @param {number} ico.Users - 参与人数
 * @param {number} ico.Total - 总资金
 * @returns {Object} 计算结果
 * @returns {number} return.Level - 当前等级
 * @returns {number} return.Next - 下一等级所需资金
 * @returns {number} return.Price - 当前价格
 * @returns {number} return.Amount - 当前数量
 * @returns {number} return.Users - 距离下一等级所需人数
 */
export function calculateICO(ico) {
  let level = 0;
  let price = 10;
  let amount = 0;
  let next = 600000;
  let nextUser = 15;

  // 人数等级
  const heads = ico.Users;
  let headLevel = Math.floor((heads - 10) / 5);
  if (headLevel < 0) headLevel = 0;

  // 资金等级
  while (ico.Total >= next && level < headLevel) {
    level += 1;
    next += Math.pow(level + 1, 2) * 100000;
  }

  amount = 10000 + (level - 1) * 7500;
  price = (ico.Total - 500000) / amount;
  nextUser = (level + 1) * 5 + 10;

  return {
    Level: level,
    Next: next,
    Price: price,
    Amount: amount,
    Users: nextUser - ico.Users,
  };
}
