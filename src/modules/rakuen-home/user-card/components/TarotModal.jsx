import { openModal } from "@src/utils/modalManager.js";

/**
 * 塔罗占卜弹窗内容组件
 */
function TarotContent() {
  return (
    <div style={{ width: "440px", height: "80vh" }}>
      <iframe
        src="https://tinygrail.mange.cn/tarot2.html"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
        }}
        title="塔罗占卜"
      />
    </div>
  );
}

/**
 * 打开塔罗占卜弹窗
 */
export function openTarotModal() {
  openModal("tarot-modal", {
    content: TarotContent(),
    borderless: true,
    size: "md",
    showCloseButton: false,
    position: "middle",
  });
}
