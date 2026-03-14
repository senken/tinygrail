import serve from "rollup-plugin-serve";
import { createBaseConfig } from "./rollup.config.base.mjs";
import { DEV_PORT, DEV_LOADER_URL } from "./scripts/dev/dev-constants.mjs";

const printDevInfo = () => ({
  name: "print-dev-info",
  buildStart() {
    console.log("================ DEV INFO ================");
    console.log(`  \x1b[36m\x1b[4m${DEV_LOADER_URL}\x1b[0m`);
    console.log("==========================================");
  },
});

const baseConfig = createBaseConfig();

export default {
  ...baseConfig,
  plugins: [
    printDevInfo(),
    ...baseConfig.plugins,
    serve({
      contentBase: "dist",
      port: DEV_PORT,
      verbose: false,
    }),
  ],
};
