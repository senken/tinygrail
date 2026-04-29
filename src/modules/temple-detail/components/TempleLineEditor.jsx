import { changeTempleLine } from "@src/api/chara.js";
import { closeModal, openModal } from "@src/utils/modalManager.js";
import { showError, showSuccess } from "@src/utils/toastManager";

/**
 * 圣殿台词编辑组件
 * @param {Object} props
 * @param {string} props.currentLine - 当前台词
 * @param {Function} props.onSubmit - 提交回调
 * @param {Function} props.onCancel - 取消回调
 */
function TempleLineEditor({ currentLine, onSubmit, onCancel }) {
  const textarea = (
    <textarea className="textarea textarea-bordered w-full" rows="4" placeholder="请输入台词" />
  );

  // 设置初始值
  textarea.value = currentLine || "";

  // 延迟聚焦，确保弹窗已完全渲染
  setTimeout(() => {
    textarea.focus();
  }, 100);

  const handleSubmit = () => {
    if (textarea && textarea.value !== undefined) {
      onSubmit(textarea.value);
    }
  };

  return (
    <div id="tg-temple-line-editor" className="space-y-2">
      <div className="p-1">{textarea}</div>
      <div id="tg-temple-line-editor-actions" className="flex justify-end gap-2 p-1">
        <button className="btn btn-sm" variant="outline" onClick={onCancel}>
          取消
        </button>
        <button className="btn-bgm btn btn-sm" variant="solid" onClick={handleSubmit}>
          确定
        </button>
      </div>
    </div>
  );
}

/**
 * 打开台词编辑弹窗
 * @param {Object} params
 * @param {number} params.characterId - 角色ID
 * @param {string} params.currentLine - 当前台词
 * @param {Function} params.onSuccess - 成功回调，接收新台词作为参数
 */
export function openTempleLineEditorModal({ characterId, currentLine, onSuccess }) {
  const modalId = `temple-line-editor-${characterId}`;

  const handleSubmit = async (newLine) => {
    const trimmedLine = newLine.trim();

    try {
      const result = await changeTempleLine(characterId, trimmedLine);
      if (!result.success) {
        showError(result.message || "修改台词失败");
        return;
      }

      closeModal(modalId);
      showSuccess(result.Value || "修改台词成功");

      if (onSuccess) {
        onSuccess(trimmedLine);
      }
    } catch (error) {
      console.error("修改台词失败:", error);
      showError("修改台词失败");
    }
  };

  openModal(modalId, {
    title: "修改台词",
    content: (
      <TempleLineEditor
        currentLine={currentLine}
        onSubmit={handleSubmit}
        onCancel={() => closeModal(modalId)}
      />
    ),
    size: "sm",
  });
}
