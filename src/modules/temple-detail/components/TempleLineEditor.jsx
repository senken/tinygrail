import { Button } from "@src/components/Button.jsx";

/**
 * 圣殿台词编辑组件
 * @param {Object} props
 * @param {string} props.currentLine - 当前台词
 * @param {Function} props.onSubmit - 提交回调
 * @param {Function} props.onCancel - 取消回调
 */
export function TempleLineEditor({ currentLine, onSubmit, onCancel }) {
  const textarea = (
    <textarea
      className="tg-input w-full resize-none rounded-md border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:focus:border-blue-400 dark:focus:ring-blue-400"
      rows="6"
      placeholder="请输入台词"
      defaultValue={currentLine}
    />
  );

  const handleSubmit = () => {
    if (textarea && textarea.value !== undefined) {
      onSubmit(textarea.value);
    }
  };

  return (
    <div id="tg-temple-line-editor" className="space-y-2">
      {textarea}
      <div id="tg-temple-line-editor-actions" className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button variant="solid" onClick={handleSubmit}>
          确定
        </Button>
      </div>
    </div>
  );
}
