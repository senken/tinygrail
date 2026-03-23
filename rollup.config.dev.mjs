import serve from "rollup-plugin-serve";
import { createBaseConfig } from "./rollup.config.base.mjs";
import { DEV_PORT, DEV_LOADER_URL } from "./scripts/dev/dev-constants.mjs";
import { enhancedDevInfo } from "./scripts/dev/enhanced-dev-info.mjs";

const baseConfig = createBaseConfig();

export default {
  ...baseConfig,
  plugins: [
    enhancedDevInfo(),
    ...baseConfig.plugins,
    serve({
      contentBase: "dist",
      port: DEV_PORT,
      host: "0.0.0.0",
      verbose: false,
      open: true,
      openPage: DEV_LOADER_URL.replace(/http:\/\/[^:]+:/, `http://localhost:`),
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    }),
  ],
};
