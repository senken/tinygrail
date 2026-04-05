import { formatCurrency } from "@src/utils/format.js";
import { Button } from "@src/components/Button.jsx";
import { get } from "@src/utils/http.js";

/**
 * 获取角色名称
 * @param {number} characterId - 角色ID
 * @param {HTMLElement} nameElement - 名称显示元素
 */
function getCharacterName(characterId, nameElement) {
  let name = document.querySelector(".nameSingle small")?.textContent;
  if (!name) name = document.querySelector(".nameSingle a")?.textContent;
  // 超展开子页面
  if (!name) name = document.querySelector("#pageHeader a.avatar")?.getAttribute("title");
  
  // 如果都获取不到，尝试从BGM API获取
  if (!name && characterId) {
    name = `#${characterId}`;
    
    nameElement.textContent = name;
    
    get(
      `https://api.bgm.tv/v0/characters/${characterId}`,
      {},
      { xhrFields: { withCredentials: false } }
    ).then((data) => {
      let characterName = null;

      // 简体中文名
      if (data.infobox && Array.isArray(data.infobox)) {
        const simplifiedChinese = data.infobox.find((item) => item.key === "简体中文名");
        if (simplifiedChinese && simplifiedChinese.value) {
          characterName = simplifiedChinese.value;
        }

        // 别名中的中文名
        if (!characterName) {
          const alias = data.infobox.find((item) => item.key === "别名");
          if (alias && alias.value && Array.isArray(alias.value)) {
            for (const item of alias.value) {
              if (item.k && item.k.includes("中文名") && item.v) {
                characterName = item.v;
                break;
              }
            }
          }
        }
      }

      // name字段
      if (!characterName && data.name) {
        characterName = data.name;
      }

      // 更新DOM
      if (characterName) {
        nameElement.textContent = characterName;
      }
    }).fail((error) => {
      console.error(`获取角色 ${characterId} 名称失败:`, error);
    });
  } else {
    // 如果从DOM获取到了名称，直接设置
    nameElement.textContent = name || "";
  }
}

/**
 * ICO启动组件
 * @param {Object} props
 * @param {number} props.characterId - 角色ID
 * @param {Object} props.userAssets - 用户资产数据
 * @param {Function} props.onInit - 启动ICO回调函数
 */
export function IcoBoxInit({ characterId, userAssets, onInit }) {
  const balance = userAssets?.balance || 0;

  const container = <div id="tg-ico-box-init" data-character-id={characterId} className="flex flex-col items-center justify-center gap-4 p-8" />;
  
  // 创建角色名称元素
  const nameSpan = <span />;
  getCharacterName(characterId, nameSpan);
  
  const input = (
    <input
      id="tg-ico-box-init-input"
      type="number"
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
      placeholder="请输入注资金额"
      min="10000"
      value="10000"
    />
  );

  container.appendChild(
    <div className="flex w-full flex-col items-center gap-4">
      {/* 提示文字 */}
      <div className="text-center text-lg text-gray-700 dark:text-gray-300">
        "{nameSpan}"已做好准备，点击启动按钮，加入"小圣杯"的争夺！
      </div>

      {/* 输入框和按钮 */}
      <div className="flex w-full max-w-md flex-col gap-3">
        <div className="text-right text-xs text-gray-500 dark:text-gray-500">
          账户余额：{formatCurrency(balance, "₵", 2, false)}
        </div>
        {input}
        <Button
          variant="solid"
          size="md"
          onClick={() => {
            const amount = parseFloat(input.value);
            if (isNaN(amount) || amount < 10000) {
              alert("请输入有效的金额（启动ICO至少需要10000cc。）");
              return;
            }

            if (confirm("项目启动之后将不能主动退回资金直到ICO结束，确定要启动ICO？")) {
              if (onInit) {
                onInit(amount);
              }
            }
          }}
        >
          启动ICO
        </Button>
      </div>
    </div>
  );

  return container;
}
