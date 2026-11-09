import { PlayIcon } from "@src/icons/PlayIcon.js";
import { PauseIcon } from "@src/icons/PauseIcon.js";
import { isGifCover } from "@src/utils/oos.js";

/**
 * 圣殿封面，GIF先显示静态画面，用户可切换播放和暂停
 * @param {Object} props 封面配置
 * @param {string} props.src 已规范化的封面地址
 * @param {"left"|"right"} props.playButtonPosition 播放按钮所在底角
 * @param {EventTarget} [props.playbackGroup] 当前LINK持有的联动事件目标，随该LINK一起释放
 * @returns {HTMLElement} 封面图片和播放入口
 */
export function TempleCover({ src, playButtonPosition = "left", playbackGroup }) {
  const container = <div className="absolute inset-0 overflow-hidden" />;
  if (!isGifCover(src)) {
    Object.assign(container.style, {
      backgroundImage: src ? `url(${src})` : "",
      backgroundPosition: "top",
      backgroundSize: "cover",
    });
    return container;
  }

  const canvas = (
    <canvas className="tg-bg-content h-full w-full animate-pulse object-cover object-top" />
  );
  const button = (
    <button
      type="button"
      className={`absolute bottom-1 z-10 flex size-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 ${playButtonPosition === "right" ? "right-1" : "left-1"}`}
      title="播放"
      aria-label="播放"
    >
      <PlayIcon className="size-4" />
    </button>
  );
  button.disabled = true;
  container.append(canvas, button);

  const image = new Image();
  let playing = false;
  let requestedPlaying = false;
  image.className = "h-full w-full object-cover object-top";
  image.alt = "圣殿封面";

  /**
   * 加载或绘制失败时显示失败状态，不自动播放原图
   * @returns {void} 失败状态已显示
   */
  function showFailure() {
    image.onload = null;
    image.onerror = null;
    container.replaceChildren(
      <div className="tg-bg-content flex h-full w-full items-center justify-center text-xs opacity-60">
        图片加载失败
      </div>
    );
  }

  /**
   * 将动图绘制为静态画面，不导出Canvas，兼容跨域图片和透明背景
   * @returns {boolean} 是否成功绘制静态画面
   */
  function showStillFrame() {
    try {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext("2d").drawImage(image, 0, 0);
      canvas.classList.remove("animate-pulse", "tg-bg-content");
      button.disabled = false;
      image.onload = null;
      image.onerror = null;
      return true;
    } catch (error) {
      showFailure();
      return false;
    }
  }

  /**
   * 更新播放状态，尚未加载的封面在加载完成后应用联动状态
   * @param {boolean} nextPlaying 是否播放
   * @returns {void} 播放状态已更新
   */
  function setPlayback(nextPlaying) {
    requestedPlaying = nextPlaying;
    if (button.disabled || playing === nextPlaying) return;
    if (!nextPlaying) {
      if (!showStillFrame()) return;
      image.replaceWith(canvas);
    } else {
      canvas.replaceWith(image);
    }
    playing = nextPlaying;
    const label = playing ? "暂停" : "播放";
    button.title = label;
    button.setAttribute("aria-label", label);
    button.replaceChildren(
      playing ? PauseIcon({ className: "size-4" }) : PlayIcon({ className: "size-4" })
    );
  }

  /**
   * 点击只改变封面播放状态，LINK内同步，不触发打开大图
   * @param {MouseEvent} event 按钮点击事件
   * @returns {void} 当前封面或LINK的播放状态已更新
   */
  function togglePlayback(event) {
    event.stopPropagation();
    if (button.disabled) return;
    if (playbackGroup) {
      playbackGroup.dispatchEvent(new CustomEvent("playback", { detail: !playing }));
    } else {
      setPlayback(!playing);
    }
  }

  /**
   * 响应当前LINK内另一侧发起的播放或暂停
   * @param {CustomEvent<boolean>} event 联动播放状态
   * @returns {void} 当前封面已同步
   */
  function syncPlayback(event) {
    setPlayback(event.detail);
  }

  /**
   * 初始显示静态封面，并应用加载期间收到的LINK播放状态
   * @returns {void} 加载状态已更新
   */
  function handleLoad() {
    if (showStillFrame()) setPlayback(requestedPlaying);
  }

  image.onload = handleLoad;
  image.onerror = showFailure;
  button.addEventListener("click", togglePlayback);
  playbackGroup?.addEventListener("playback", syncPlayback);
  image.src = src;
  return container;
}
