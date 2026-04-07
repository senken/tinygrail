/* eslint-disable no-undef */
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 生成加载器文件
 */
export function generateLoaderPlugin() {
  return {
    name: "generate-loader",
    writeBundle() {
      const metaPath = path.resolve(__dirname, "../meta.json");
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));

      const loaderContent = `// ==UserScript==
// @name      ${meta.name}
// @namespace ${meta.namespace}
// @version   ${meta.version}
// @author    ${meta.author}
${meta.match.map((m) => `// @match     ${m}`).join("\n")}
// @grant     ${meta.grant}
// ==/UserScript==

(async function () {
  if (typeof chiiApp !== 'undefined') {
    window.__chiiApp__ = chiiApp;
  }
  
  const script = document.createElement('script')
  script.type = 'text/javascript'
  script.src = 'https://tinygrail.mange.cn/js/userscript.user.js'
  script.async = true
  document.body.appendChild(script)
})()
`;

      const loaderPath = path.resolve(__dirname, "../dist/loader.user.js");
      fs.writeFileSync(loaderPath, loaderContent, "utf-8");
    },
  };
}
