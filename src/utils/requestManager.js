/**
 * 创建请求管理器，用于处理竞态条件
 * @returns {Object} 管理器对象
 */
export function createRequestManager() {
  let requestId = 0;

  return {
    /**
     * 执行请求，只有最新的请求结果会被处理
     * @param {Function} requestFn - 返回Promise的请求函数
     * @param {Function} onSuccess - 成功回调
     * @param {Function} onError - 错误回调
     */
    execute: async (requestFn, onSuccess, onError) => {
      const currentRequestId = ++requestId;

      try {
        const result = await requestFn();

        // 只处理最新的请求结果
        if (currentRequestId === requestId) {
          onSuccess(result);
        }
      } catch (error) {
        // 只处理最新的请求错误
        if (currentRequestId === requestId && onError) {
          onError(error);
        }
      }
    },
  };
}
