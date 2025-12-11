import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import postcss from "rollup-plugin-postcss";
import metablock from "rollup-plugin-userscript-metablock";

export default {
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
  ],
};
