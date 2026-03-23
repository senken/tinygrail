/* eslint-disable no-undef */
import { DEV_PORT, DEV_LOADER_URL } from "./dev-constants.mjs";
import { networkInterfaces } from "os";

// 获取局域网IP地址
const getNetworkAddress = () => {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // 跳过内部地址和非IPv4地址
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
};

// 记录构建状态
let isFirstBuild = true;
let buildStartTime = 0;

// 格式化时间
const formatTime = (ms) => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

/**
 * 增强的开发信息插件
 */
export const enhancedDevInfo = () => ({
  name: "enhanced-dev-info",
  buildStart() {
    buildStartTime = Date.now();

    if (isFirstBuild) {
      console.clear();
      console.log("\x1b[36m%s\x1b[0m", "\n  ROLLUP v" + this.meta.rollupVersion);
      console.log("\x1b[32m%s\x1b[0m", "  Starting development server...\n");
    } else {
      console.log("\x1b[33m%s\x1b[0m", "\n  Rebuilding...");
    }
  },
  buildEnd() {
    const buildTime = Date.now() - buildStartTime;

    if (isFirstBuild) {
      console.log("\x1b[32m%s\x1b[0m", "  Build completed!");
      console.log("\x1b[2m%s\x1b[0m", `  Ready in ${formatTime(buildTime)}\n`);
      console.log("\x1b[1m%s\x1b[0m", "  Local:   \x1b[36m\x1b[4m" + DEV_LOADER_URL + "\x1b[0m");
      
      // 显示局域网地址
      const networkIP = getNetworkAddress();
      if (networkIP) {
        const networkURL = `http://${networkIP}:${DEV_PORT}/dev-loader.user.js`;
        console.log("\x1b[1m%s\x1b[0m", `  Network: \x1b[36m${networkURL}\x1b[0m\n`);
      } else {
        console.log();
      }
      
      console.log("\x1b[32m%s\x1b[0m", "  Server ready - watching for changes...");
      console.log("\x1b[2m%s\x1b[0m", "  Hot reload enabled (experimental)\n");

      isFirstBuild = false;
    } else {
      console.log(
        "\x1b[32m%s\x1b[0m",
        `  Rebuilt in ${formatTime(buildTime)} \x1b[2m${new Date().toLocaleTimeString()}\x1b[0m`
      );
      console.log("\x1b[2m%s\x1b[0m", "  Hot reload will update automatically...\n");
    }
  },
  watchChange(id) {
    const fileName = id.split(/[\\/]/).pop();
    console.log("\x1b[2m%s\x1b[0m", `  ${fileName} changed`);
  },
});
