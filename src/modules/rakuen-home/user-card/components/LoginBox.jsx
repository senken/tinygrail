import { performBangumiAuth } from "@src/utils/session.js";

/**
 * 登录提示盒子组件
 */
export function LoginBox({ onLogin }) {
  const handleLogin = () => {
    performBangumiAuth(onLogin);
  };

  return (
    <div id="tg-rakuen-home-login-box" className="tg-bg-content tg-border-card my-2 flex flex-wrap items-center gap-2 rounded-xl p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="mr-auto text-sm font-medium opacity-80">
        点击授权登录，开启「小圣杯」最萌大战！
      </div>
      <button
        id="tg-rakuen-home-login-button"
        className="bgm-bg whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:opacity-90"
        onClick={handleLogin}
      >
        授权登录
      </button>
    </div>
  );
}
