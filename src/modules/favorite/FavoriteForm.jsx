/**
 * 收藏夹表单组件（纯展示组件）
 * 只负责渲染UI和返回数据，不处理业务逻辑
 */
export function FavoriteForm({
  initialName = "",
  initialColor,
  onSubmit,
  onCancel,
  submitText = "保存",
}) {
  // 可选颜色
  const colors = [
    { name: "橙色", value: "bg-orange-500", text: "text-orange-500" },
    { name: "红色", value: "bg-red-500", text: "text-red-500" },
    { name: "黄色", value: "bg-yellow-500", text: "text-yellow-500" },
    { name: "绿色", value: "bg-green-500", text: "text-green-500" },
    { name: "蓝色", value: "bg-blue-500", text: "text-blue-500" },
    { name: "紫色", value: "bg-purple-500", text: "text-purple-500" },
    { name: "粉色", value: "bg-pink-500", text: "text-pink-500" },
    { name: "灰色", value: "bg-gray-500", text: "text-gray-500" },
  ];

  const defaultColor = initialColor || colors[0].value;
  const formId = `favorite-form-${Date.now()}`;

  // 存储选中的颜色
  let selectedColor = defaultColor;

  const handleSubmit = () => {
    const nameInput = document.getElementById(`${formId}-name`);
    const name = nameInput.value.trim();

    if (onSubmit) {
      onSubmit({ name, color: selectedColor });
    }
  };

  const container = (
    <div className="flex flex-col gap-4 p-1">
      <input
        type="text"
        className="input input-sm input-bordered w-full !bg-base-100"
        placeholder="收藏夹名称（最多10字）"
        maxLength="10"
        value={initialName}
        id={`${formId}-name`}
      />
      <div className="flex flex-wrap gap-2" id={`${formId}-color-picker`}>
        {colors.map((c) => (
          <button
            type="button"
            className={`h-8 w-8 rounded-full transition-all ${c.value} ${
              c.value === defaultColor
                ? "ring-2 ring-gray-800 ring-offset-2 ring-offset-base-100 dark:ring-gray-200"
                : ""
            }`}
            onClick={(e) => {
              // 存储选中的颜色
              selectedColor = c.value;

              // 更新选中颜色的按钮样式
              const colorPicker = e.currentTarget.closest('[id$="-color-picker"]');
              const buttons = colorPicker.querySelectorAll("button");
              buttons.forEach((btn) => {
                btn.classList.remove(
                  "ring-2",
                  "ring-gray-800",
                  "ring-offset-2",
                  "ring-offset-base-100",
                  "dark:ring-gray-200"
                );
              });
              e.currentTarget.classList.add(
                "ring-2",
                "ring-gray-800",
                "ring-offset-2",
                "ring-offset-base-100",
                "dark:ring-gray-200"
              );
            }}
            title={c.name}
          />
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <button className="btn-bgm btn btn-sm" onClick={handleSubmit}>
          {submitText}
        </button>
        <button className="btn btn-sm" onClick={onCancel}>
          取消
        </button>
      </div>
    </div>
  );

  // 自动聚焦输入框
  setTimeout(() => {
    const input = container.querySelector(`#${formId}-name`);
    if (input) {
      input.focus();
      // 将光标移到文字末尾
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }, 100);

  return container;
}
