import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import alias from "@rollup/plugin-alias";
import babel from "@rollup/plugin-babel";
import postcss from "rollup-plugin-postcss";
import metablock from "rollup-plugin-userscript-metablock";
import discardComments from "postcss-discard-comments";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 自定义插件：支持 CSS 文件的 ?inline 导入
 */
function inlineCSSPlugin() {
  return {
    name: "inline-css",
    resolveId(source, importer) {
      if (source.endsWith("?inline")) {
        // 移除 ?inline 后缀，解析真实路径
        const cleanSource = source.replace("?inline", "");
        const resolved = path.resolve(path.dirname(importer), cleanSource);
        // 返回带 ?inline 的完整路径
        return resolved + "?inline";
      }
      return null;
    },
    load(id) {
      if (id.endsWith("?inline")) {
        const filePath = id.replace("?inline", "");
        const css = fs.readFileSync(filePath, "utf-8");
        return `export default ${JSON.stringify(css)};`;
      }
      return null;
    },
  };
}

export function createBaseConfig() {
  return {
    input: "src/main.jsx",
    output: {
      file: "dist/userscript.user.js",
      format: "iife",
      name: "UserscriptBundle",
    },
    plugins: [
      metablock({
        file: "meta.json",
      }),
      alias({
        entries: [
          { find: "@src", replacement: path.resolve(__dirname, "src") },
          { find: "jsx-dom", replacement: path.resolve(__dirname, "src/utils/jsx-dom.js") },
        ],
      }),
      inlineCSSPlugin(), // 添加自定义插件
      resolve({
        extensions: [".js", ".jsx"],
      }),
      commonjs(),
      postcss({
        config: {
          path: "postcss.config.cjs",
        },
        inject: false,
        extract: "userscript.css",
        minimize: false,
        plugins: [
          discardComments({ removeAll: true }), // 移除注释
        ],
      }),
      babel({
        babelHelpers: "bundled",
        extensions: [".js", ".jsx"],
        include: ["src/**/*"],
        comments: false,
        presets: [],
        plugins: [
          [
            "jsx-pragmatic",
            {
              module: "jsx-dom",
              export: "h",
              import: "h",
              fragmentModule: "jsx-dom",
              fragmentExport: "Fragment",
              fragmentImport: "Fragment",
            },
          ],
          [
            "@babel/plugin-transform-react-jsx",
            {
              runtime: "classic",
              pragma: "h",
              pragmaFrag: "Fragment",
              useBuiltIns: true,
            },
          ],
        ],
        // 配置Babel输出选项
        generatorOpts: {
          jsescOption: {
            minimal: true,
          },
        },
      }),
    ],
  };
}
