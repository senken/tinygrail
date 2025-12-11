import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import serve from "rollup-plugin-serve";
import metablock from "rollup-plugin-userscript-metablock";
import babel from "@rollup/plugin-babel";
import postcss from "rollup-plugin-postcss";
import { DEV_PORT, DEV_LOADER_URL } from "./scripts/dev/dev-constants.mjs";

const printDevInfo = () => ({
  name: "print-dev-info",
  buildStart() {
    console.log("================ DEV INFO ================");
    console.log(`  \x1b[36m\x1b[4m${DEV_LOADER_URL}\x1b[0m`);
    console.log("==========================================");
  },
});

export default {
  input: "src/main.jsx",
  output: {
    file: "dist/userscript.user.js",
    format: "iife",
    name: "UserscriptBundle",
  },
  plugins: [
    printDevInfo(),
    metablock({
      file: "meta.json",
    }),
    resolve(),
    commonjs(),
    postcss({
      config: {
        path: "postcss.config.cjs",
      },
      inject: false,
      extract: "userscript.css",
      minimize: false,
    }),
    babel({
      babelHelpers: "bundled",
      extensions: [".js", ".jsx"],
      include: ["src/**/*"],
      comments: false,
      presets: [],
      plugins: [[
        "@babel/plugin-transform-react-jsx",
        {
          runtime: "classic",
          pragma: "h",
          pragmaFrag: "Fragment",
        },
      ]],
    }),
    serve({
      contentBase: "dist",
      port: DEV_PORT,
      verbose: false,
    }),
  ],
};
