import { voteKillCharacter, revokeKillVote, getKillVotes } from "@src/api/chara.js";
import { showSuccess, showError } from "@src/utils/toastManager.jsx";
import { openModal, openConfirmModal } from "@src/utils/modalManager.js";
import { formatDateTime } from "@src/utils/format.js";

/**
 * 处理投票删除
 * @param {number} characterId - 角色ID
 */
export function handleVoteKill(characterId) {
  const modalId = `vote-kill-${characterId}`;
  
  let reasonValue = "";
  const reasonInput = (
    <textarea 
      className="textarea textarea-bordered w-full" 
      placeholder="请输入删除理由（可选）" 
      rows="3"
      onInput={(e) => {
        reasonValue = e.target.value;
      }}
    />
  );
  
  const { close } = openModal(modalId, {
    title: "投票删除角色",
    content: (
      <div className="space-y-4">
        <div className="p-1">
          {reasonInput}
        </div>
        <div className="flex gap-2">
          <button
            className="btn no-animation btn-sm flex-1"
            onClick={() => close()}
          >
            取消
          </button>
          <button
            className="btn-bgm btn no-animation btn-sm flex-1"
            onClick={async () => {
              const result = await voteKillCharacter(characterId, reasonValue);
              
              if (result.success) {
                close();
                showSuccess("投票成功");
              } else {
                showError(result.message || "投票失败");
              }
            }}
          >
            确认投票
          </button>
        </div>
      </div>
    ),
    size: "sm",
  });
}

/**
 * 处理撤回投票
 * @param {number} characterId - 角色ID
 */
export function handleRevokeVote(characterId) {
  openConfirmModal({
    title: "撤回投票",
    message: "确定要撤回投票吗？",
    confirmText: "撤回",
    onConfirm: async () => {
      const result = await revokeKillVote(characterId);
      
      if (result.success) {
        showSuccess("撤回投票成功");
      } else {
        showError(result.message || "撤回投票失败");
      }
    },
  });
}

/**
 * 查看投票结果
 * @param {number} characterId - 角色ID
 */
export async function handleViewVotes(characterId) {
  const result = await getKillVotes(characterId);
  
  if (result.success) {
    const votes = result.data;
    const modalId = `view-votes-${characterId}`;
    
    const { close } = openModal(modalId, {
      title: "投票删除结果",
      content: (
        <div className="space-y-4">
          <div className="text-sm">
            <p>总投票数: {votes?.length || 0}</p>
            {votes && votes.length > 0 ? (
              <div className="mt-4 space-y-2">
                <p className="font-semibold">投票列表:</p>
                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {votes.map((vote, index) => (
                    <div key={index} className="rounded border border-base-300 p-2">
                      <p className="font-medium">{vote.UserId !== 0 ? "我的投票" : "其他GM"}</p>
                      {vote.Reason && <p className="mt-1 text-xs opacity-70">理由: {vote.Reason}</p>}
                      <p className="mt-1 text-xs opacity-50">投票时间: {formatDateTime(vote.VoteTime)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-center opacity-60">暂无投票</p>
            )}
          </div>
          <button
            className="btn no-animation btn-sm w-full"
            onClick={() => close()}
          >
            关闭
          </button>
        </div>
      ),
      size: "sm",
    });
  } else {
    showError(result.message || "获取投票结果失败");
  }
}
