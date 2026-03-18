// ==UserScript==
// @name      TinyGrail Exchange Plugin
// @namespace TinyGrail Exchange Plugin
// @version   2.0.1
// @author    senken, mtcode
// @match     *://*.bgm.tv/*
// @match     *://bangumi.tv/*
// @match     *://chii.in/*
// @grant     none
// ==/UserScript==

(function () {
  'use strict';

  function h(tag, props, ...children) {
    props = props || {};
    if (typeof tag === 'function') {
      return tag({
        ...props,
        children
      });
    }
    const $el = window.jQuery ? window.jQuery(`<${tag}>`) : document.createElement(tag);
    const appendChild = (parent, child) => {
      if (child == null || child === false) return;
      if (Array.isArray(child)) {
        child.forEach(c => appendChild(parent, c));
        return;
      }
      if (child instanceof Node) {
        parent.appendChild(child);
      } else if (window.jQuery && child && child.jquery) {
        parent.appendChild(child[0]);
      } else {
        const text = document.createTextNode(String(child));
        parent.appendChild(text);
      }
    };
    Object.entries(props).forEach(([key, value]) => {
      if (key === 'children' || value == null) return;
      if (key === 'className') {
        if (window.jQuery && $el.jquery) {
          $el.addClass(value);
        } else {
          $el.className = value;
        }
        return;
      }
      if (key === 'style' && typeof value === 'object') {
        if (window.jQuery && $el.jquery) {
          $el.css(value);
        } else {
          Object.assign($el.style, value);
        }
        return;
      }
      if (/^on[A-Z]/.test(key) && typeof value === 'function') {
        const eventName = key.slice(2).toLowerCase();
        if (window.jQuery && $el.jquery) {
          $el.on(eventName, value);
        } else {
          $el.addEventListener(eventName, value);
        }
        return;
      }
      if (window.jQuery && $el.jquery) {
        $el.attr(key, value);
      } else {
        $el.setAttribute(key, value);
      }
    });
    const elNode = window.jQuery && $el.jquery ? $el[0] : $el;
    children.forEach(child => appendChild(elNode, child));
    return elNode;
  }
  function Fragment(props) {
    const frag = document.createDocumentFragment();
    const {
      children
    } = props || {};
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach(c => {
        if (c instanceof Node) {
          frag.appendChild(c);
        }
      });
    }
    return frag;
  }
  function mount(node, container) {
    if (!node) return;
    container.appendChild(node);
  }

  function createMountedComponent(container, renderWithState, autoRender = false) {
    let state = {};
    let currentNode = null;
    function setState(partial) {
      state = {
        ...state,
        ...partial
      };
      render();
    }
    function render() {
      const node = renderWithState(state, setState);
      if (currentNode && currentNode.parentNode === container) {
        container.replaceChild(node, currentNode);
      } else {
        container.innerHTML = "";
        mount(node, container);
      }
      currentNode = node;
    }
    if (autoRender) {
      render();
    }
    return {
      setState,
      render
    };
  }

  let baseURL = 'https://tinygrail.com/api/';
  function getFullURL(url) {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return baseURL + url;
  }
  function get(url, data = {}, options = {}) {
    return $.ajax({
      url: getFullURL(url),
      type: 'GET',
      data,
      dataType: 'json',
      xhrFields: {
        withCredentials: true
      },
      ...options
    });
  }
  function post(url, data = {}, options = {}) {
    return $.ajax({
      url: getFullURL(url),
      type: 'POST',
      data: JSON.stringify(data),
      contentType: 'application/json',
      dataType: 'json',
      xhrFields: {
        withCredentials: true
      },
      ...options
    });
  }

  function unescapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.innerHTML = str;
    return div.textContent || div.innerText || "";
  }

  async function getShareBonusTest() {
    try {
      const data = await get("event/share/bonus/test");
      if (!data || data.State !== 0 || !data.Value) {
        return {
          success: false,
          message: data?.Message || "获取股息预测失败"
        };
      }
      const value = data.Value;
      return {
        success: true,
        data: {
          total: value.Total,
          temples: value.Temples,
          daily: value.Daily,
          share: value.Share,
          tax: value.Tax
        }
      };
    } catch (error) {
      console.error("获取股息预测失败:", error);
      return {
        success: false,
        message: "网络请求失败"
      };
    }
  }
  async function getBangumiBonus() {
    try {
      const data = await get("event/bangumi/bonus");
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Value || "获取注册奖励失败"
        };
      }
      return {
        success: true,
        message: data.Value
      };
    } catch (error) {
      console.error("获取注册奖励失败:", error);
      return {
        success: false,
        message: "网络请求失败"
      };
    }
  }
  async function sendRedPacket(userName, amount, message) {
    try {
      const data = await post(`event/send/${userName}/${amount}/${encodeURIComponent(message)}`, null);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "发送失败"
        };
      }
      return {
        success: true,
        message: data?.Value || "发送成功"
      };
    } catch (error) {
      console.error("发送红包失败:", error);
      return {
        success: false,
        message: "网络请求失败"
      };
    }
  }
  async function checkHolidayBonus() {
    try {
      const data = await get("event/holiday/bonus/check");
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "今天不是节日。"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("检查节日失败:", error);
      return {
        success: false,
        message: "网络请求失败"
      };
    }
  }
  async function claimHolidayBonus() {
    try {
      const data = await get("event/holiday/bonus");
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "领取节日奖励失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("领取节日奖励失败:", error);
      return {
        success: false,
        message: "网络请求失败"
      };
    }
  }
  async function claimDailyBonus() {
    try {
      const data = await get("event/bangumi/bonus/daily");
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "领取每日签到奖励失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("领取每日签到奖励失败:", error);
      return {
        success: false,
        message: "领取每日签到奖励失败"
      };
    }
  }
  async function claimWeeklyBonus() {
    try {
      const data = await get("event/share/bonus");
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "领取每周分红失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("领取每周分红失败:", error);
      return {
        success: false,
        message: "领取每周分红失败"
      };
    }
  }
  async function scratchBonus(isLotus = false) {
    try {
      const url = isLotus ? "event/scratch/bonus2/true" : "event/scratch/bonus2";
      const data = await get(url);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "刮刮乐施法失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("刮刮乐施法失败:", error);
      return {
        success: false,
        message: "刮刮乐施法失败"
      };
    }
  }
  async function getDailyEventCount(eventId) {
    try {
      const data = await get("event/daily/count/10");
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "获取幻想乡刮刮乐已使用次数失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("获取幻想乡刮刮乐已使用次数失败:", error);
      return {
        success: false,
        message: "获取幻想乡刮刮乐已使用次数失败"
      };
    }
  }

  function getCachedUserAssets() {
    try {
      const cachedUserAssets = localStorage.getItem("tinygrail:user-assets");
      if (cachedUserAssets) {
        return JSON.parse(cachedUserAssets);
      }
      return null;
    } catch (error) {
      console.warn("读取缓存的用户资产失败:", error);
      return null;
    }
  }
  function performBangumiAuth(onSuccess) {
    return new Promise(resolve => {
      const messageHandler = e => {
        if (e.data === "reloadEditBox") {
          window.removeEventListener("message", messageHandler);
          getBangumiBonus().then(result => {
            if (result.success && result.message) {
              alert(result.message);
            }
            if (onSuccess) {
              onSuccess();
            }
            resolve();
          });
        }
      };
      window.addEventListener("message", messageHandler);
      const loginUrl = "https://bgm.tv/oauth/authorize?response_type=code&client_id=bgm2525b0e4c7d93fec&redirect_uri=https%3A%2F%2Ftinygrail.com%2Fapi%2Faccount%2Fcallback";
      window.open(loginUrl);
    });
  }
  function isGameMaster() {
    const userAssets = getCachedUserAssets();
    if (!userAssets) {
      return false;
    }
    return userAssets.Type >= 999 || userAssets.Id === 702;
  }

  async function getUserAssets(username) {
    const handleAuthFailure = () => {
      if (!username) {
        performBangumiAuth(() => {
          window.location.reload();
        });
      }
    };
    try {
      const url = username ? `chara/user/assets/${username}` : "chara/user/assets";
      const data = await get(url);
      if (!data || data.State !== 0 || !data.Value) {
        handleAuthFailure();
        return {
          success: false,
          message: data?.Message || "获取用户资产失败"
        };
      }
      const value = data.Value;
      const result = {
        id: value.Id,
        name: value.Name,
        nickname: unescapeHtml(value.Nickname),
        avatar: value.Avatar,
        balance: value.Balance,
        assets: value.Assets,
        type: value.Type,
        state: value.State,
        lastIndex: value.LastIndex,
        showDaily: !!value.ShowDaily,
        showWeekly: !!value.ShowWeekly
      };
      if (!username) {
        try {
          localStorage.setItem("tinygrail:user-assets", JSON.stringify(result));
        } catch (e) {
          console.warn("缓存用户资产失败:", e);
        }
      }
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error("获取用户资产失败:", error);
      handleAuthFailure();
      return {
        success: false,
        message: "获取用户资产失败"
      };
    }
  }
  async function logout() {
    try {
      const data = await post("account/logout");
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "退出登录失败"
        };
      }
      return {
        success: true
      };
    } catch (error) {
      console.error("退出登录失败:", error);
      return {
        success: false,
        message: "退出登录失败"
      };
    }
  }
  async function getUserSendLog(username, page = 1, pageSize = 10) {
    try {
      const url = `chara/user/send/log/${username}/${page}/${pageSize}`;
      const data = await get(url);
      if (!data || data.State !== 0 || !data.Value) {
        return {
          success: false,
          message: data?.Message || "获取用户红包记录失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("获取用户红包记录失败:", error);
      return {
        success: false,
        message: "获取用户红包记录失败"
      };
    }
  }
  async function getUserBalanceLog(page = 1, pageSize = 50) {
    try {
      const url = `chara/user/balance/${page}/${pageSize}`;
      const data = await get(url);
      if (!data || data.State !== 0 || !data.Value) {
        return {
          success: false,
          message: data?.Message || "获取资金日志失败"
        };
      }
      return {
        success: true,
        data: {
          items: data.Value.Items || [],
          currentPage: data.Value.CurrentPage,
          totalPages: data.Value.TotalPages,
          totalItems: data.Value.TotalItems,
          itemsPerPage: data.Value.ItemsPerPage
        }
      };
    } catch (error) {
      console.error("获取资金日志失败:", error);
      return {
        success: false,
        message: "获取资金日志失败"
      };
    }
  }
  async function getUserAuctions(page = 1, pageSize = 50) {
    try {
      const url = `chara/user/auction/${page}/${pageSize}`;
      const data = await get(url);
      if (!data || data.State !== 0 || !data.Value) {
        return {
          success: false,
          message: data?.Message || "获取拍卖列表失败"
        };
      }
      return {
        success: true,
        data: {
          items: data.Value.Items || [],
          currentPage: data.Value.CurrentPage,
          totalPages: data.Value.TotalPages,
          totalItems: data.Value.TotalItems,
          itemsPerPage: data.Value.ItemsPerPage
        }
      };
    } catch (error) {
      console.error("获取拍卖列表失败:", error);
      return {
        success: false,
        message: "获取拍卖列表失败"
      };
    }
  }
  async function banUser(username) {
    try {
      const url = `chara/user/ban/${username}`;
      const data = await post(url);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "封禁用户失败"
        };
      }
      return {
        success: true,
        message: "封禁用户成功"
      };
    } catch (error) {
      console.error("封禁用户失败:", error);
      return {
        success: false,
        message: "封禁用户失败"
      };
    }
  }
  async function unbanUser(username) {
    try {
      const url = `chara/user/unban/${username}`;
      const data = await get(url);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "解除封禁失败"
        };
      }
      return {
        success: true,
        message: "解除封禁成功"
      };
    } catch (error) {
      console.error("解除封禁失败:", error);
      return {
        success: false,
        message: "解除封禁失败"
      };
    }
  }

  function formatNumber(num, decimals = 2) {
    if (num == null || isNaN(num)) return "0.00";
    const number = Number(num).toFixed(decimals);
    const [integer, decimal] = number.split(".");
    const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return decimal ? `${formattedInteger}.${decimal}` : formattedInteger;
  }
  function formatCurrency(amount, symbol = "₵", decimals = 2, abbreviate = true) {
    if (amount == null || isNaN(amount)) return `${symbol}0.00`;
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? "-" : "";
    if (!abbreviate) {
      return `${sign}${symbol}${formatNumber(absAmount, decimals)}`;
    }
    if (absAmount >= 100000000) {
      const value = absAmount / 100000000;
      return `${sign}${symbol}${formatNumber(value, decimals)}e`;
    }
    if (absAmount >= 10000) {
      const value = absAmount / 10000;
      return `${sign}${symbol}${formatNumber(value, decimals)}w`;
    }
    return `${sign}${symbol}${formatNumber(absAmount, decimals)}`;
  }
  function formatDateTime(dateStr, format = "YYYY-MM-DD HH:mm:ss") {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return format.replace("YYYY", year).replace("MM", month).replace("DD", day).replace("HH", hours).replace("mm", minutes).replace("ss", seconds);
  }
  function formatRemainingTime(endTime) {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    if (diff <= 0) {
      return "已结束";
    }
    const hours = diff / (1000 * 60 * 60);
    const days = diff / (1000 * 60 * 60 * 24);
    if (days >= 1) {
      return `剩余 ${Math.floor(days)} 天`;
    }
    if (hours >= 12) {
      return `剩余 ${Math.floor(hours)} 小时`;
    }
    return "即将结束";
  }
  function formatTimeAgo(dateTime) {
    if (!dateTime) return "";
    const now = new Date();
    const past = new Date(dateTime);
    const diff = now - past;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 365) {
      return "years ago";
    }
    if (days > 0) {
      return `${days}d ago`;
    }
    if (hours > 0) {
      return `${hours}h ago`;
    }
    if (minutes > 0) {
      return `${minutes}m ago`;
    }
    return `${seconds}s ago`;
  }
  function getTimeDiff(timeStr) {
    const now = new Date();
    const time = new Date(timeStr) - (new Date().getTimezoneOffset() + 8 * 60) * 60 * 1000;
    return now - time;
  }

  function Button({
    children,
    onClick,
    variant = "solid",
    size = "sm",
    rounded = "default",
    className = "",
    ...rest
  }) {
    const baseStyles = "whitespace-nowrap font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed";
    const sizeStyles = {
      sm: "px-3 py-1 text-xs",
      md: "px-4 py-1.5 text-sm",
      lg: "px-5 py-2 text-base"
    };
    const roundedStyles = {
      default: "rounded-md",
      full: "rounded-full"
    };
    const variantStyles = {
      outline: "bgm-color border border-current hover:bgm-bg hover:border-transparent hover:text-white",
      solid: "bgm-bg text-white font-semibold shadow-sm hover:opacity-90"
    };
    const buttonClass = `${baseStyles} ${sizeStyles[size]} ${roundedStyles[rounded]} ${variantStyles[variant]} ${className}`;
    return h("button", Object.assign({
      className: buttonClass,
      onClick: onClick
    }, rest), children);
  }

  function Avatar({
    src,
    alt = "avatar",
    size = "md",
    rank,
    onClick,
    className = ""
  }) {
    const sizeClasses = {
      sm: "h-10 w-10",
      md: "h-12 w-12",
      lg: "h-16 w-16"
    };
    const rankSizeClasses = {
      sm: "text-[10px] px-1",
      md: "text-xs px-1",
      lg: "text-sm px-1.5"
    };
    const baseClasses = "tg-avatar flex-shrink-0 border-2 border-white/30";
    const interactiveClasses = onClick ? "cursor-pointer transition-transform hover:scale-105" : "";
    return h("div", {
      id: "tg-user-avatar",
      className: `relative ${interactiveClasses} ${className}`
    }, h("div", {
      className: `${baseClasses} ${sizeClasses[size]}`,
      style: {
        backgroundImage: `url(${src})`,
        backgroundSize: "cover",
        backgroundPosition: "center"
      },
      onClick: onClick,
      role: onClick ? "button" : undefined,
      tabIndex: onClick ? 0 : undefined,
      "aria-label": alt
    }), rank != null && rank > 0 && h("div", {
      className: `absolute left-0 top-0 -translate-x-1/4 -translate-y-1/4 rounded font-bold text-white shadow-md ${rankSizeClasses[size]}`,
      style: {
        background: "linear-gradient(45deg, #FFC107, #FFEB3B)"
      }
    }, "#", rank));
  }

  function ArrowBigRightIcon({
    className = "w-6 h-6"
  } = {}) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("xmlns", svgNS);
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    if (className) svg.setAttribute("class", className);
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", "M11 9a1 1 0 0 0 1-1V5.061a1 1 0 0 1 1.811-.75l6.836 6.836a1.207 1.207 0 0 1 0 1.707l-6.836 6.835a1 1 0 0 1-1.811-.75V16a1 1 0 0 0-1-1H5a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1z");
    svg.appendChild(path);
    return svg;
  }

  function ArrowRightLeftIcon({
    className = "w-4 h-4"
  } = {}) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("xmlns", svgNS);
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    if (className) svg.setAttribute("class", className);
    svg.setAttribute("aria-hidden", "true");
    const path1 = document.createElementNS(svgNS, "path");
    path1.setAttribute("d", "m16 3 4 4-4 4");
    svg.appendChild(path1);
    const path2 = document.createElementNS(svgNS, "path");
    path2.setAttribute("d", "M20 7H4");
    svg.appendChild(path2);
    const path3 = document.createElementNS(svgNS, "path");
    path3.setAttribute("d", "m8 21-4-4 4-4");
    svg.appendChild(path3);
    const path4 = document.createElementNS(svgNS, "path");
    path4.setAttribute("d", "M4 17h16");
    svg.appendChild(path4);
    return svg;
  }

  function ChevronLeftIcon({
    className = "w-5 h-5"
  } = {}) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("xmlns", svgNS);
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    if (className) svg.setAttribute("class", className);
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", "m15 18-6-6 6-6");
    svg.appendChild(path);
    return svg;
  }

  function ChevronRightIcon({
    className = "w-5 h-5"
  } = {}) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("xmlns", svgNS);
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    if (className) svg.setAttribute("class", className);
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", "M9 18l6-6-6-6");
    svg.appendChild(path);
    return svg;
  }

  function ChevronsLeftIcon({
    className = "w-5 h-5"
  } = {}) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("xmlns", svgNS);
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    if (className) svg.setAttribute("class", className);
    const path1 = document.createElementNS(svgNS, "path");
    path1.setAttribute("d", "m11 17-5-5 5-5");
    svg.appendChild(path1);
    const path2 = document.createElementNS(svgNS, "path");
    path2.setAttribute("d", "m18 17-5-5 5-5");
    svg.appendChild(path2);
    return svg;
  }

  function ChevronsRightIcon({
    className = "w-5 h-5"
  } = {}) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("xmlns", svgNS);
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    if (className) svg.setAttribute("class", className);
    const path1 = document.createElementNS(svgNS, "path");
    path1.setAttribute("d", "m6 17 5-5-5-5");
    svg.appendChild(path1);
    const path2 = document.createElementNS(svgNS, "path");
    path2.setAttribute("d", "m13 17 5-5-5-5");
    svg.appendChild(path2);
    return svg;
  }

  function CrownIcon({
    className = "w-6 h-6"
  } = {}) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("xmlns", svgNS);
    svg.setAttribute("viewBox", "0 0 256 256");
    svg.setAttribute("fill", "currentColor");
    if (className) svg.setAttribute("class", className);
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", "M248,80a28,28,0,1,0-51.12,15.77l-26.79,33L146,73.4a28,28,0,1,0-36.06,0L85.91,128.74l-26.79-33a28,28,0,1,0-26.6,12L47,194.63A16,16,0,0,0,62.78,208H193.22A16,16,0,0,0,209,194.63l14.47-86.85A28,28,0,0,0,248,80ZM128,40a12,12,0,1,1-12,12A12,12,0,0,1,128,40ZM24,80A12,12,0,1,1,36,92,12,12,0,0,1,24,80ZM220,92a12,12,0,1,1,12-12A12,12,0,0,1,220,92Z");
    svg.appendChild(path);
    return svg;
  }

  function EllipsisIcon({
    className = "w-5 h-5"
  } = {}) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("xmlns", svgNS);
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    if (className) svg.setAttribute("class", className);
    const circle1 = document.createElementNS(svgNS, "circle");
    circle1.setAttribute("cx", "12");
    circle1.setAttribute("cy", "12");
    circle1.setAttribute("r", "1");
    svg.appendChild(circle1);
    const circle2 = document.createElementNS(svgNS, "circle");
    circle2.setAttribute("cx", "19");
    circle2.setAttribute("cy", "12");
    circle2.setAttribute("r", "1");
    svg.appendChild(circle2);
    const circle3 = document.createElementNS(svgNS, "circle");
    circle3.setAttribute("cx", "5");
    circle3.setAttribute("cy", "12");
    circle3.setAttribute("r", "1");
    svg.appendChild(circle3);
    return svg;
  }

  function LoaderCircleIcon({
    className = "w-6 h-6"
  } = {}) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("xmlns", svgNS);
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    if (className) svg.setAttribute("class", className);
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", "M21 12a9 9 0 1 1-6.219-8.56");
    svg.appendChild(path);
    return svg;
  }

  function MoonIcon({
    className = "w-6 h-6"
  } = {}) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("xmlns", svgNS);
    svg.setAttribute("viewBox", "0 0 256 256");
    svg.setAttribute("fill", "currentColor");
    if (className) svg.setAttribute("class", className);
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", "M235.54,150.21a104.84,104.84,0,0,1-37,52.91A104,104,0,0,1,32,120,103.09,103.09,0,0,1,52.88,57.48a104.84,104.84,0,0,1,52.91-37,8,8,0,0,1,10,10,88.08,88.08,0,0,0,109.8,109.8,8,8,0,0,1,10,10Z");
    svg.appendChild(path);
    return svg;
  }

  function QuestionIcon({
    className = "w-6 h-6"
  } = {}) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("xmlns", svgNS);
    svg.setAttribute("viewBox", "0 0 256 256");
    svg.setAttribute("fill", "currentColor");
    if (className) svg.setAttribute("class", className);
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", "M144,180a16,16,0,1,1-16-16A16,16,0,0,1,144,180Zm92-52A108,108,0,1,1,128,20,108.12,108.12,0,0,1,236,128Zm-24,0a84,84,0,1,0-84,84A84.09,84.09,0,0,0,212,128ZM128,64c-24.26,0-44,17.94-44,40v4a12,12,0,0,0,24,0v-4c0-8.82,9-16,20-16s20,7.18,20,16-9,16-20,16a12,12,0,0,0-12,12v8a12,12,0,0,0,23.73,2.56C158.31,137.88,172,122.37,172,104,172,81.94,152.26,64,128,64Z");
    svg.appendChild(path);
    return svg;
  }

  function RefreshCwIcon({
    className = "w-5 h-5"
  } = {}) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("xmlns", svgNS);
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    if (className) svg.setAttribute("class", className);
    svg.setAttribute("aria-hidden", "true");
    const path1 = document.createElementNS(svgNS, "path");
    path1.setAttribute("d", "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8");
    svg.appendChild(path1);
    const path2 = document.createElementNS(svgNS, "path");
    path2.setAttribute("d", "M21 3v5h-5");
    svg.appendChild(path2);
    const path3 = document.createElementNS(svgNS, "path");
    path3.setAttribute("d", "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16");
    svg.appendChild(path3);
    const path4 = document.createElementNS(svgNS, "path");
    path4.setAttribute("d", "M8 16H3v5");
    svg.appendChild(path4);
    return svg;
  }

  function SearchIcon({
    className = "w-6 h-6"
  } = {}) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("xmlns", svgNS);
    svg.setAttribute("width", "24");
    svg.setAttribute("height", "24");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    if (className) svg.setAttribute("class", className);
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", "m21 21-4.34-4.34");
    svg.appendChild(path);
    const circle = document.createElementNS(svgNS, "circle");
    circle.setAttribute("cx", "11");
    circle.setAttribute("cy", "11");
    circle.setAttribute("r", "8");
    svg.appendChild(circle);
    return svg;
  }

  function SparklesIcon({
    className = "w-6 h-6"
  } = {}) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("xmlns", svgNS);
    svg.setAttribute("viewBox", "0 0 256 256");
    svg.setAttribute("fill", "currentColor");
    if (className) svg.setAttribute("class", className);
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", "M208,144a15.78,15.78,0,0,1-10.42,14.94L146,178l-19,51.62a15.92,15.92,0,0,1-29.88,0L78,178l-51.62-19a15.92,15.92,0,0,1,0-29.88L78,110l19-51.62a15.92,15.92,0,0,1,29.88,0L146,110l51.62,19A15.78,15.78,0,0,1,208,144ZM152,48h16V64a8,8,0,0,0,16,0V48h16a8,8,0,0,0,0-16H184V16a8,8,0,0,0-16,0V32H152a8,8,0,0,0,0,16Zm88,32h-8V72a8,8,0,0,0-16,0v8h-8a8,8,0,0,0,0,16h8v8a8,8,0,0,0,16,0V96h8a8,8,0,0,0,0-16Z");
    svg.appendChild(path);
    return svg;
  }

  function SquareArrowOutUpRightIcon({
    className = "h-6 w-6"
  } = {}) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("xmlns", svgNS);
    svg.setAttribute("width", "24");
    svg.setAttribute("height", "24");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    if (className) svg.setAttribute("class", className);
    svg.setAttribute("aria-hidden", "true");
    const path1 = document.createElementNS(svgNS, "path");
    path1.setAttribute("d", "M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6");
    svg.appendChild(path1);
    const path2 = document.createElementNS(svgNS, "path");
    path2.setAttribute("d", "m21 3-9 9");
    svg.appendChild(path2);
    const path3 = document.createElementNS(svgNS, "path");
    path3.setAttribute("d", "M15 3h6v6");
    svg.appendChild(path3);
    return svg;
  }

  function StarIcon({
    className = "w-6 h-6",
    filled = true
  } = {}) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("xmlns", svgNS);
    svg.setAttribute("viewBox", "0 0 256 256");
    svg.setAttribute("fill", "currentColor");
    if (className) svg.setAttribute("class", className);
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(svgNS, "path");
    if (filled) {
      path.setAttribute("d", "M234.29,114.85l-45,38.83L203,211.75a16.4,16.4,0,0,1-24.5,17.82L128,198.49,77.47,229.57A16.4,16.4,0,0,1,53,211.75l13.76-58.07-45-38.83A16.46,16.46,0,0,1,31.08,86l59-4.76,22.76-55.08a16.36,16.36,0,0,1,30.27,0l22.75,55.08,59,4.76a16.46,16.46,0,0,1,9.37,28.86Z");
    } else {
      path.setAttribute("d", "M243,96a20.33,20.33,0,0,0-17.74-14l-56.59-4.57L146.83,24.62a20.36,20.36,0,0,0-37.66,0L87.35,77.44,30.76,82A20.45,20.45,0,0,0,19.1,117.88l43.18,37.24-13.2,55.7A20.37,20.37,0,0,0,79.57,233L128,203.19,176.43,233a20.39,20.39,0,0,0,30.49-22.15l-13.2-55.7,43.18-37.24A20.43,20.43,0,0,0,243,96ZM172.53,141.7a12,12,0,0,0-3.84,11.86L181.58,208l-47.29-29.08a12,12,0,0,0-12.58,0L74.42,208l12.89-54.4a12,12,0,0,0-3.84-11.86L41.2,105.24l55.4-4.47a12,12,0,0,0,10.13-7.38L128,41.89l21.27,51.5a12,12,0,0,0,10.13,7.38l55.4,4.47Z");
    }
    svg.appendChild(path);
    return svg;
  }

  function SunIcon({
    className = "w-6 h-6"
  } = {}) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("xmlns", svgNS);
    svg.setAttribute("viewBox", "0 0 256 256");
    svg.setAttribute("fill", "currentColor");
    if (className) svg.setAttribute("class", className);
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", "M120,40V16a8,8,0,0,1,16,0V40a8,8,0,0,1-16,0Zm8,24a64,64,0,1,0,64,64A64.07,64.07,0,0,0,128,64ZM58.34,69.66A8,8,0,0,0,69.66,58.34l-16-16A8,8,0,0,0,42.34,53.66Zm0,116.68-16,16a8,8,0,0,0,11.32,11.32l16-16a8,8,0,0,0-11.32-11.32ZM192,72a8,8,0,0,0,5.66-2.34l16-16a8,8,0,0,0-11.32-11.32l-16,16A8,8,0,0,0,192,72Zm5.66,114.34a8,8,0,0,0-11.32,11.32l16,16a8,8,0,0,0,11.32-11.32ZM48,128a8,8,0,0,0-8-8H16a8,8,0,0,0,0,16H40A8,8,0,0,0,48,128Zm80,80a8,8,0,0,0-8,8v24a8,8,0,0,0,16,0V216A8,8,0,0,0,128,208Zm112-88H216a8,8,0,0,0,0,16h24a8,8,0,0,0,0-16Z");
    svg.appendChild(path);
    return svg;
  }

  function XIcon({
    className = "w-6 h-6"
  } = {}) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("xmlns", svgNS);
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    if (className) svg.setAttribute("class", className);
    svg.setAttribute("aria-hidden", "true");
    const path1 = document.createElementNS(svgNS, "path");
    path1.setAttribute("d", "M18 6 6 18");
    svg.appendChild(path1);
    const path2 = document.createElementNS(svgNS, "path");
    path2.setAttribute("d", "m6 6 12 12");
    svg.appendChild(path2);
    return svg;
  }

  function UserInfoBox(userData) {
    const {
      name,
      nickname,
      avatar,
      balance,
      lastIndex,
      showDaily,
      showWeekly,
      showHoliday,
      holidayName,
      abbreviateBalance,
      onBonus,
      onShareBonus,
      onHolidayBonus,
      onLogout,
      onShareBonusTest,
      onScratch,
      onAvatarClick,
      onToggleAbbreviate,
      onBalanceLog
    } = userData || {};
    const actionButtons = [{
      id: "scratch-button",
      label: "刮刮乐",
      show: true,
      onClick: () => {
        if (onScratch) onScratch();
      }
    }, {
      id: "share-bonus-button",
      label: "每周分红",
      show: showWeekly,
      onClick: () => {
        if (onShareBonus) onShareBonus();
      }
    }, {
      id: "bonus-button",
      label: "签到奖励",
      show: showDaily,
      onClick: () => {
        if (onBonus) onBonus();
      }
    }, {
      id: "holiday-bonus-button",
      label: `${holidayName}福利`,
      show: showHoliday,
      onClick: () => {
        if (onHolidayBonus) onHolidayBonus();
      },
      className: "!bg-gradient-to-r !from-pink-500 !via-purple-500 !to-indigo-500 !text-white !font-semibold hover:!opacity-90 hover:!shadow-lg !transition-all"
    }, {
      id: "balance-log-button",
      label: "资金日志",
      show: true,
      onClick: () => {
        if (onBalanceLog) onBalanceLog();
      }
    }].filter(btn => btn.show);
    return h("div", {
      id: "tg-rakuen-home-user-info-box",
      className: "tg-bg-content tg-border-card my-2 flex flex-wrap items-center gap-2 rounded-xl p-3 shadow-sm transition-shadow hover:shadow-md",
      "data-name": name
    }, h("div", {
      id: "tg-rakuen-home-user-info",
      className: "mr-auto flex flex-shrink-0 items-center gap-3"
    }, h(Avatar, {
      src: avatar,
      alt: nickname,
      onClick: onAvatarClick,
      rank: lastIndex > 0 ? lastIndex : null
    }), h("div", {
      className: "min-w-0"
    }, h("div", {
      className: "mb-1 flex flex-wrap items-center gap-2"
    }, h("a", {
      target: "_blank",
      href: `/user/${name}`,
      className: "tg-link inline-flex items-center gap-1 text-sm font-semibold transition-colors"
    }, h("span", null, nickname), h(SquareArrowOutUpRightIcon, {
      className: "h-3.5 w-3.5"
    })), h("button", {
      id: "tg-rakuen-home-logout-button",
      className: "tg-link cursor-pointer border-none bg-none p-0 text-xs text-gray-500 transition-colors",
      onClick: onLogout
    }, "[退出登录]"), h("button", {
      id: "tg-rakuen-home-test-button",
      className: "tg-link cursor-pointer border-none bg-none p-0 text-xs text-gray-500 transition-colors",
      onClick: onShareBonusTest
    }, "[股息预测]")), h("button", {
      id: "tg-rakuen-home-balance",
      className: "flex items-center gap-0.5 border-none bg-transparent p-0 text-xs font-medium opacity-60 transition-opacity hover:opacity-80",
      onClick: onToggleAbbreviate,
      title: abbreviateBalance ? "显示完整金额" : "显示缩略金额"
    }, h("span", null, "余额：", formatCurrency(balance, "₵", 2, abbreviateBalance)), h(ArrowRightLeftIcon, {
      className: "h-3 w-3"
    })))), h("div", {
      id: "tg-rakuen-home-user-actions",
      className: "flex flex-wrap gap-2 pt-1"
    }, actionButtons.map(({
      id,
      label,
      onClick,
      className
    }) => h(Button, {
      id: `tg-rakuen-home-${id}`,
      onClick: onClick,
      className: className
    }, label))));
  }

  function LoginBox({
    onLogin
  }) {
    const handleLogin = () => {
      performBangumiAuth(onLogin);
    };
    return h("div", {
      id: "tg-rakuen-home-login-box",
      className: "tg-bg-content tg-border-card my-2 flex flex-wrap items-center gap-2 rounded-xl p-3 shadow-sm transition-shadow hover:shadow-md"
    }, h("div", {
      className: "mr-auto text-sm font-medium opacity-80"
    }, "点击授权登录，开启「小圣杯」最萌大战！"), h("button", {
      id: "tg-rakuen-home-login-button",
      className: "bgm-bg whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:opacity-90",
      onClick: handleLogin
    }, "授权登录"));
  }

  function ScratchConfirm({
    isLotus = false,
    lotusCount = 0,
    onConfirm,
    onCancel
  }) {
    let scratchType = isLotus ? "lotus" : "normal";
    const baseTrackClass = "relative inline-block h-6 w-11 rounded-full transition-colors";
    const normalTrackClass = `${baseTrackClass} bg-gray-300 dark:bg-gray-600`;
    const lotusTrackClass = `${baseTrackClass} bgm-bg`;
    const descriptionDiv = h("div", {
      className: "rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
    }, "消费₵1,000购买一张环保刮刮乐彩票？");
    const switchTrack = h("div", {
      className: normalTrackClass
    });
    const switchThumb = h("div", {
      className: "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
    });
    switchTrack.appendChild(switchThumb);
    if (isLotus) {
      scratchType = "lotus";
      switchTrack.className = lotusTrackClass;
      switchThumb.style.transform = "translateX(20px)";
      const price = Math.pow(2, lotusCount) * 2000;
      descriptionDiv.textContent = `消费₵${formatNumber(price, 0)}购买一张幻想乡彩票？`;
    }
    const switchButton = h("button", {
      type: "button",
      className: "flex items-center gap-2 outline-none",
      onClick: () => {
        scratchType = scratchType === "normal" ? "lotus" : "normal";
        const isLotusType = scratchType === "lotus";
        if (isLotusType) {
          switchTrack.className = lotusTrackClass;
          switchThumb.style.transform = "translateX(20px)";
          const price = Math.pow(2, lotusCount) * 2000;
          descriptionDiv.textContent = `消费₵${formatNumber(price, 0)}购买一张幻想乡彩票？`;
        } else {
          switchTrack.className = normalTrackClass;
          switchThumb.style.transform = "translateX(0)";
          descriptionDiv.textContent = "消费₵1,000购买一张环保刮刮乐彩票？";
        }
      }
    }, switchTrack);
    const confirmButton = h(Button, {
      variant: "solid",
      onClick: () => {
        const isLotusType = scratchType === "lotus";
        onConfirm(isLotusType);
      }
    }, "确定");
    return h("div", {
      id: "tg-rakuen-home-scratch-confirm",
      className: "flex min-w-64 flex-col gap-4"
    }, h("div", {
      id: "tg-rakuen-home-scratch-confirm-switch",
      className: "flex items-center gap-3"
    }, switchButton, h("span", {
      className: "text-sm opacity-60"
    }, "幻想乡")), descriptionDiv, h("div", {
      id: "tg-rakuen-home-scratch-confirm-actions",
      className: "flex justify-end gap-2"
    }, h(Button, {
      variant: "outline",
      onClick: onCancel
    }, "取消"), confirmButton));
  }

  function closeModalById(modalId) {
    const modals = document.querySelectorAll("#tg-modal");
    modals.forEach(modal => {
      if (modal.dataset.modalId === modalId && modal.parentNode === document.body) {
        document.body.removeChild(modal);
        document.body.style.overflow = "";
      }
    });
  }
  function Modal({
    visible,
    onClose,
    title,
    position = "top",
    maxWidth,
    modalId,
    padding = "p-4",
    getModalId,
    children
  }) {
    const generatedModalId = modalId || `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    if (getModalId && typeof getModalId === "function") {
      getModalId(generatedModalId);
    }
    const handleClose = () => {
      const modals = document.querySelectorAll("#tg-modal");
      modals.forEach(modal => {
        if (modal.dataset.modalId === generatedModalId && modal.parentNode === document.body) {
          document.body.removeChild(modal);
          document.body.style.overflow = "";
        }
      });
      if (onClose) {
        onClose();
      }
    };
    if (!visible) {
      setTimeout(() => {
        handleClose();
      }, 0);
      return null;
    }
    const existingModal = document.querySelector(`#tg-modal[data-modal-id="${generatedModalId}"]`);
    if (existingModal && existingModal.parentNode === document.body) {
      return null;
    }
    const positionClasses = {
      center: "items-center pt-4 pb-10",
      top: "items-start pt-8 pb-10",
      bottom: "items-end pt-4 pb-10"
    };
    const widthClass = maxWidth ? "w-auto" : "w-full";
    const maxWidthStyle = maxWidth ? {
      maxWidth: `${maxWidth}px`
    } : {};
    let mouseDownOnBackground = false;
    const modalElement = h("div", {
      id: "tg-modal",
      className: "tinygrail",
      "data-modal-id": generatedModalId
    }, h("div", {
      id: "tg-modal-background",
      className: `fixed inset-0 flex justify-center bg-black/20 px-3 ${positionClasses[position]}`,
      style: {
        zIndex: 999
      },
      onMouseDown: e => {
        if (e.target.id === "tg-modal-background") {
          mouseDownOnBackground = true;
        }
      },
      onClick: e => {
        if (e.target.id === "tg-modal-background" && mouseDownOnBackground) {
          handleClose();
        }
        mouseDownOnBackground = false;
      }
    }, h("div", {
      id: "tg-modal-content",
      className: `tg-bg-content relative flex max-h-full ${widthClass} max-w-6xl flex-col overflow-hidden rounded-[15px] shadow-2xl backdrop-blur`,
      style: maxWidthStyle,
      onClick: e => e.stopPropagation()
    }, h("button", {
      className: "tg-link absolute right-1 top-1 z-50 flex items-center justify-center rounded-full p-2 opacity-60 transition-colors hover:bg-gray-100 hover:opacity-100 dark:hover:bg-gray-800",
      onClick: handleClose
    }, h(XIcon, {
      className: "size-4"
    })), title && h("div", {
      id: "tg-modal-title",
      className: "flex flex-shrink-0 items-center border-b border-gray-200 px-4 py-3 pr-12 dark:border-gray-700"
    }, h("h3", {
      className: "text-base font-semibold"
    }, title)), h("div", {
      id: "tg-modal-body",
      className: `min-h-32 overflow-auto ${padding}`
    }, children))));
    setTimeout(() => {
      if (modalElement.parentNode && modalElement.parentNode !== document.body) {
        document.body.appendChild(modalElement);
        document.body.style.overflow = "hidden";
      }
    }, 0);
    return modalElement;
  }

  async function getUserCharaLinks(username, page = 1, pageSize = 12) {
    try {
      const data = await post(`chara/user/link/${username}/${page}/${pageSize}`);
      if (!data || data.State !== 0 || !data.Value) {
        return {
          success: false,
          message: "获取连接列表失败"
        };
      }
      const value = data.Value;
      return {
        success: true,
        data: {
          currentPage: value.CurrentPage,
          totalPages: value.TotalPages,
          totalItems: value.TotalItems,
          itemsPerPage: value.ItemsPerPage,
          items: value.Items || []
        }
      };
    } catch (error) {
      console.error("获取连接列表失败:", error);
      return {
        success: false,
        message: "获取连接列表失败"
      };
    }
  }
  async function getUserTemples(username, page = 1, pageSize = 24, keyword = "") {
    try {
      let url = `chara/user/temple/${username}/${page}/${pageSize}`;
      if (keyword) {
        url += `?keyword=${encodeURIComponent(keyword)}`;
      }
      const data = await get(url);
      if (!data || data.State !== 0 || !data.Value) {
        return {
          success: false,
          message: "获取圣殿列表失败"
        };
      }
      const value = data.Value;
      return {
        success: true,
        data: {
          currentPage: value.CurrentPage,
          totalPages: value.TotalPages,
          totalItems: value.TotalItems,
          itemsPerPage: value.ItemsPerPage,
          items: value.Items || []
        }
      };
    } catch (error) {
      console.error("获取圣殿列表失败:", error);
      return {
        success: false,
        message: "获取圣殿列表失败"
      };
    }
  }
  async function getUserCharas(username, page = 1, pageSize = 48, sort = "") {
    try {
      let url = `chara/user/chara/${username}/${page}/${pageSize}`;
      if (sort) {
        url += `?sort=${encodeURIComponent(sort)}`;
      }
      const data = await post(url);
      if (!data || data.State !== 0 || !data.Value) {
        return {
          success: false,
          message: "获取角色列表失败"
        };
      }
      const value = data.Value;
      return {
        success: true,
        data: {
          currentPage: value.CurrentPage,
          totalPages: value.TotalPages,
          totalItems: value.TotalItems,
          itemsPerPage: value.ItemsPerPage,
          items: value.Items || []
        }
      };
    } catch (error) {
      console.error("获取角色列表失败:", error);
      return {
        success: false,
        message: "获取角色列表失败"
      };
    }
  }
  async function getUserICOs(username, page = 1, pageSize = 48) {
    try {
      const data = await post(`chara/user/initial/${username}/${page}/${pageSize}`);
      if (!data || data.State !== 0 || !data.Value) {
        return {
          success: false,
          message: "获取ICO列表失败"
        };
      }
      const value = data.Value;
      return {
        success: true,
        data: {
          currentPage: value.CurrentPage,
          totalPages: value.TotalPages,
          totalItems: value.TotalItems,
          itemsPerPage: value.ItemsPerPage,
          items: value.Items || []
        }
      };
    } catch (error) {
      console.error("获取ICO列表失败:", error);
      return {
        success: false,
        message: "获取ICO列表失败"
      };
    }
  }
  async function getCharacter(characterId) {
    try {
      const data = await get(`chara/${characterId}`);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "获取角色信息失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("获取角色信息失败:", error);
      return {
        success: false,
        message: "获取角色信息失败"
      };
    }
  }
  async function getCharacterPool(characterId) {
    try {
      const data = await get(`chara/pool/${characterId}`);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: "获取奖池数量失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("获取奖池数量失败:", error);
      return {
        success: false,
        message: "获取奖池数量失败"
      };
    }
  }
  async function getUserCharacter(characterId) {
    try {
      const data = await get(`chara/user/${characterId}`);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "获取用户角色数据失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("获取用户角色数据失败:", error);
      return {
        success: false,
        message: "获取用户角色数据失败"
      };
    }
  }
  async function getUserCharacterByUsername(characterId, username) {
    try {
      const data = await get(`chara/user/${characterId}/${username}/false`);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "获取用户角色数据失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("获取用户角色数据失败:", error);
      return {
        success: false,
        message: "获取用户角色数据失败"
      };
    }
  }
  async function getCharacterDepth(characterId) {
    try {
      const data = await get(`chara/depth/${characterId}`);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: "获取市场深度数据失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("获取市场深度数据失败:", error);
      return {
        success: false,
        message: "获取市场深度数据失败"
      };
    }
  }
  async function bidCharacter(characterId, price, amount, isIceberg = false) {
    try {
      const url = isIceberg ? `chara/bid/${characterId}/${price}/${amount}/true` : `chara/bid/${characterId}/${price}/${amount}`;
      const data = await post(url);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "买入失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("买入失败:", error);
      return {
        success: false,
        message: "买入失败"
      };
    }
  }
  async function askCharacter(characterId, price, amount, isIceberg = false) {
    try {
      const url = isIceberg ? `chara/ask/${characterId}/${price}/${amount}/true` : `chara/ask/${characterId}/${price}/${amount}`;
      const data = await post(url);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "卖出失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("卖出失败:", error);
      return {
        success: false,
        message: "卖出失败"
      };
    }
  }
  async function cancelBid(bidId) {
    try {
      const data = await post(`chara/bid/cancel/${bidId}`);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "取消买入委托失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("取消买入委托失败:", error);
      return {
        success: false,
        message: "取消买入委托失败"
      };
    }
  }
  async function getCharacterLinks(characterId) {
    try {
      const data = await get(`chara/links/${characterId}`);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: "获取LINK数据失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("获取LINK数据失败:", error);
      return {
        success: false,
        message: "获取LINK数据失败"
      };
    }
  }
  async function cancelAsk(askId) {
    try {
      const data = await post(`chara/ask/cancel/${askId}`);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "取消卖出委托失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("取消卖出委托失败:", error);
      return {
        success: false,
        message: "取消卖出委托失败"
      };
    }
  }
  async function getCharacterTemples(characterId) {
    try {
      const data = await get(`chara/temple/${characterId}`);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: "获取圣殿数据失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("获取圣殿数据失败:", error);
      return {
        success: false,
        message: "获取圣殿数据失败"
      };
    }
  }
  async function getCharacterUsers(characterId, page = 1, pageSize = 24) {
    try {
      const data = await get(`chara/users/${characterId}/${page}/${pageSize}`);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: "获取持股用户列表失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("获取持股用户列表失败:", error);
      return {
        success: false,
        message: "获取持股用户列表失败"
      };
    }
  }
  async function getICOUsers(characterId, page = 1, pageSize = 24) {
    try {
      const data = await get(`chara/initial/users/${characterId}/${page}/${pageSize}`);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: "获取ICO参与者列表失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("获取ICO参与者列表失败:", error);
      return {
        success: false,
        message: "获取ICO参与者列表失败"
      };
    }
  }
  async function getUserICOInfo(icoId) {
    try {
      const data = await get(`chara/initial/${icoId}`);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: "获取ICO注资信息失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("获取ICO注资信息失败:", error);
      return {
        success: false,
        message: "获取ICO注资信息失败"
      };
    }
  }
  async function joinICO(icoId, amount) {
    try {
      const data = await post(`chara/join/${icoId}/${amount}`);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "注资失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("注资失败:", error);
      return {
        success: false,
        message: "注资失败"
      };
    }
  }
  async function initICO(characterId, amount) {
    try {
      const data = await post(`chara/init/${characterId}/${amount}`);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "启动ICO失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("启动ICO失败:", error);
      return {
        success: false,
        message: "启动ICO失败"
      };
    }
  }
  async function sacrificeCharacter(characterId, amount, isEquity = false) {
    try {
      const data = await post(`chara/sacrifice/${characterId}/${amount}/${isEquity}`);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "献祭失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("献祭失败:", error);
      return {
        success: false,
        message: "献祭失败"
      };
    }
  }
  async function getAuctionList(characterIds) {
    try {
      const data = await post("chara/auction/list", characterIds);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "获取拍卖列表失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("获取拍卖列表失败:", error);
      return {
        success: false,
        message: "获取拍卖列表失败"
      };
    }
  }
  async function auctionCharacter(characterId, price, amount) {
    try {
      const data = await post(`chara/auction/${characterId}/${price}/${amount}`);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "拍卖失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("拍卖失败:", error);
      return {
        success: false,
        message: "拍卖失败"
      };
    }
  }
  async function getAuctionHistory(characterId, page = 1) {
    try {
      const data = await get(`chara/auction/list/${characterId}/${page}`);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "获取往期拍卖列表失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("获取往期拍卖列表失败:", error);
      return {
        success: false,
        message: "获取往期拍卖列表失败"
      };
    }
  }
  async function changeCharacterAvatar(characterId, avatarUrl) {
    try {
      const data = await post(`chara/avatar/${characterId}`, avatarUrl);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "更换头像失败"
        };
      }
      return {
        success: true
      };
    } catch (error) {
      console.error("更换头像失败:", error);
      return {
        success: false,
        message: "更换头像失败"
      };
    }
  }
  async function getCharacterCharts(characterId, date = '2019-08-08') {
    try {
      const data = await get(`chara/charts/${characterId}/${date}`);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "获取图表数据失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("获取图表数据失败:", error);
      return {
        success: false,
        message: "获取图表数据失败"
      };
    }
  }
  async function getBabelTower(page = 1, pageSize = 24) {
    try {
      const data = await get(`chara/babel/${page}/${pageSize}`);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "获取通天塔数据失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("获取通天塔数据失败:", error);
      return {
        success: false,
        message: "获取通天塔数据失败"
      };
    }
  }
  async function getStarLog(page = 1, pageSize = 30) {
    try {
      const data = await get(`chara/star/log/${page}/${pageSize}`);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "获取通天塔日志失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("获取通天塔日志失败:", error);
      return {
        success: false,
        message: "获取通天塔日志失败"
      };
    }
  }
  async function changeTempleCover(characterId, coverUrl) {
    try {
      const data = await post(`chara/temple/cover/${characterId}`, coverUrl);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "修改封面失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("修改封面失败:", error);
      return {
        success: false,
        message: "修改封面失败"
      };
    }
  }
  async function resetTempleCover(characterId, userId) {
    try {
      const data = await post(`chara/temple/cover/reset/${characterId}/${userId}`, null);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "重置封面失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("重置封面失败:", error);
      return {
        success: false,
        message: "重置封面失败"
      };
    }
  }
  async function changeTempleLine(characterId, line) {
    try {
      const data = await post(`chara/temple/line/${characterId}`, line);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "修改台词失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("修改台词失败:", error);
      return {
        success: false,
        message: "修改台词失败"
      };
    }
  }
  async function linkTemples(characterId1, characterId2) {
    try {
      const data = await post(`chara/link/${characterId1}/${characterId2}`);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "链接失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("链接失败:", error);
      return {
        success: false,
        message: "链接失败"
      };
    }
  }
  async function searchCharacter(keyword) {
    try {
      const data = await get(`chara/search/character?keyword=${encodeURIComponent(keyword)}`);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "搜索角色失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("搜索角色失败:", error);
      return {
        success: false,
        message: "搜索角色失败"
      };
    }
  }
  async function convertStarForces(characterId, count) {
    try {
      const data = await post(`chara/star/${characterId}/${count}`);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "转化星之力失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("转化星之力失败:", error);
      return {
        success: false,
        message: "转化星之力失败"
      };
    }
  }
  async function destroyTemple(characterId) {
    try {
      const data = await post(`chara/temple/destroy/${characterId}`);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "拆除圣殿失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("拆除圣殿失败:", error);
      return {
        success: false,
        message: "拆除圣殿失败"
      };
    }
  }
  async function cancelAuction(auctionId) {
    try {
      const data = await post(`chara/auction/cancel/${auctionId}`, null);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "取消竞拍失败"
        };
      }
      return {
        success: true,
        message: "取消竞拍成功"
      };
    } catch (error) {
      console.error("取消竞拍失败:", error);
      return {
        success: false,
        message: "取消竞拍失败"
      };
    }
  }
  async function getBidsList(page = 1, pageSize = 50) {
    try {
      const data = await get(`chara/bids/0/${page}/${pageSize}`);
      if (!data || data.State !== 0 || !data.Value) {
        return {
          success: false,
          message: data?.Message || "获取买单列表失败"
        };
      }
      return {
        success: true,
        data: {
          items: data.Value.Items || [],
          currentPage: data.Value.CurrentPage,
          totalPages: data.Value.TotalPages,
          totalItems: data.Value.TotalItems,
          itemsPerPage: data.Value.ItemsPerPage
        }
      };
    } catch (error) {
      console.error("获取买单列表失败:", error);
      return {
        success: false,
        message: "获取买单列表失败"
      };
    }
  }
  async function getAsksList(page = 1, pageSize = 50) {
    try {
      const data = await get(`chara/asks/0/${page}/${pageSize}`);
      if (!data || data.State !== 0 || !data.Value) {
        return {
          success: false,
          message: data?.Message || "获取卖单列表失败"
        };
      }
      return {
        success: true,
        data: {
          items: data.Value.Items || [],
          currentPage: data.Value.CurrentPage,
          totalPages: data.Value.TotalPages,
          totalItems: data.Value.TotalItems,
          itemsPerPage: data.Value.ItemsPerPage
        }
      };
    } catch (error) {
      console.error("获取卖单列表失败:", error);
      return {
        success: false,
        message: "获取卖单列表失败"
      };
    }
  }
  async function getUserItems(page = 1, pageSize = 50) {
    try {
      const data = await get(`chara/user/item/0/${page}/${pageSize}`);
      if (!data || data.State !== 0 || !data.Value) {
        return {
          success: false,
          message: data?.Message || "获取道具列表失败"
        };
      }
      return {
        success: true,
        data: {
          items: data.Value.Items || [],
          currentPage: data.Value.CurrentPage,
          totalPages: data.Value.TotalPages,
          totalItems: data.Value.TotalItems,
          itemsPerPage: data.Value.ItemsPerPage
        }
      };
    } catch (error) {
      console.error("获取道具列表失败:", error);
      return {
        success: false,
        message: "获取道具列表失败"
      };
    }
  }
  async function getRecentCharacters(page = 1, pageSize = 50) {
    try {
      const data = await get(`chara/recent/${page}/${pageSize}`);
      if (!data || data.State !== 0 || !data.Value) {
        return {
          success: false,
          message: data?.Message || "获取最近活跃角色失败"
        };
      }
      return {
        success: true,
        data: {
          items: data.Value.Items || [],
          currentPage: data.Value.CurrentPage,
          totalPages: data.Value.TotalPages,
          totalItems: data.Value.TotalItems,
          itemsPerPage: data.Value.ItemsPerPage
        }
      };
    } catch (error) {
      console.error("获取最近活跃角色失败:", error);
      return {
        success: false,
        message: "获取最近活跃角色失败"
      };
    }
  }
  async function getTopWeek() {
    try {
      const data = await get("chara/topweek");
      if (!data || data.State !== 0 || !data.Value) {
        return {
          success: false,
          message: data?.Message || "获取每周萌王失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("获取每周萌王失败:", error);
      return {
        success: false,
        message: "获取每周萌王失败"
      };
    }
  }
  async function getTopWeekHistory(page = 1, pageSize = 12) {
    try {
      const data = await get(`chara/topweek/history/${page}/${pageSize}`);
      if (!data || data.State !== 0 || !data.Value) {
        return {
          success: false,
          message: data?.Message || "获取往期萌王失败"
        };
      }
      return {
        success: true,
        data: {
          items: data.Value.Items || [],
          currentPage: data.Value.CurrentPage,
          totalPages: data.Value.TotalPages,
          totalItems: data.Value.TotalItems,
          itemsPerPage: data.Value.ItemsPerPage
        }
      };
    } catch (error) {
      console.error("获取往期萌王失败:", error);
      return {
        success: false,
        message: "获取往期萌王失败"
      };
    }
  }
  async function getLatestLinks(page = 1, pageSize = 24) {
    try {
      const data = await get(`chara/link/last/${page}/${pageSize}`);
      if (!data || data.State !== 0 || !data.Value) {
        return {
          success: false,
          message: data?.Message || "获取最新连接失败"
        };
      }
      return {
        success: true,
        data: {
          items: data.Value.Items || [],
          currentPage: data.Value.CurrentPage,
          totalPages: data.Value.TotalPages,
          totalItems: data.Value.TotalItems,
          itemsPerPage: data.Value.ItemsPerPage
        }
      };
    } catch (error) {
      console.error("获取最新连接失败:", error);
      return {
        success: false,
        message: "获取最新连接失败"
      };
    }
  }
  async function getLatestTemples(page = 1, pageSize = 24) {
    try {
      const data = await get(`chara/temple/last/${page}/${pageSize}`);
      if (!data || data.State !== 0 || !data.Value) {
        return {
          success: false,
          message: data?.Message || "获取最新圣殿失败"
        };
      }
      return {
        success: true,
        data: {
          items: data.Value.Items || [],
          currentPage: data.Value.CurrentPage,
          totalPages: data.Value.TotalPages,
          totalItems: data.Value.TotalItems,
          itemsPerPage: data.Value.ItemsPerPage
        }
      };
    } catch (error) {
      console.error("获取最新圣殿失败:", error);
      return {
        success: false,
        message: "获取最新圣殿失败"
      };
    }
  }
  async function getRefineRank(page = 1, pageSize = 24) {
    try {
      const data = await get(`chara/refine/temple/${page}/${pageSize}`);
      if (!data || data.State !== 0 || !data.Value) {
        return {
          success: false,
          message: "获取精炼排行失败"
        };
      }
      const value = data.Value;
      return {
        success: true,
        data: {
          currentPage: value.CurrentPage,
          totalPages: value.TotalPages,
          totalItems: value.TotalItems,
          itemsPerPage: value.ItemsPerPage,
          items: value.Items || []
        }
      };
    } catch (error) {
      console.error("获取精炼排行失败:", error);
      return {
        success: false,
        message: "获取精炼排行失败"
      };
    }
  }
  async function getUserRank(page = 1, pageSize = 24) {
    try {
      const data = await get(`chara/top/${page}/${pageSize}`);
      if (!data || data.State !== 0 || !Array.isArray(data.Value)) {
        return {
          success: false,
          message: "获取用户排行失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("获取用户排行失败:", error);
      return {
        success: false,
        message: "获取用户排行失败"
      };
    }
  }
  async function getRateRank(page = 1, pageSize = 20) {
    try {
      const data = await get(`chara/msrc/${page}/${pageSize}`);
      if (!data || data.State !== 0 || !Array.isArray(data.Value)) {
        return {
          success: false,
          message: "获取最高股息失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("获取最高股息失败:", error);
      return {
        success: false,
        message: "获取最高股息失败"
      };
    }
  }
  async function getMarketValueRank(page = 1, pageSize = 20) {
    try {
      const data = await get(`chara/mvc/${page}/${pageSize}`);
      if (!data || data.State !== 0 || !Array.isArray(data.Value)) {
        return {
          success: false,
          message: "获取最高市值失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("获取最高市值失败:", error);
      return {
        success: false,
        message: "获取最高市值失败"
      };
    }
  }
  async function getMaxRiseRank(page = 1, pageSize = 20) {
    try {
      const data = await get(`chara/mrc/${page}/${pageSize}`);
      if (!data || data.State !== 0 || !Array.isArray(data.Value)) {
        return {
          success: false,
          message: "获取最大涨幅失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("获取最大涨幅失败:", error);
      return {
        success: false,
        message: "获取最大涨幅失败"
      };
    }
  }
  async function getMaxFallRank(page = 1, pageSize = 20) {
    try {
      const data = await get(`chara/mfc/${page}/${pageSize}`);
      if (!data || data.State !== 0 || !Array.isArray(data.Value)) {
        return {
          success: false,
          message: "获取最大跌幅失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("获取最大跌幅失败:", error);
      return {
        success: false,
        message: "获取最大跌幅失败"
      };
    }
  }
  async function getDelistCharas(page = 1, pageSize = 24) {
    try {
      const data = await post(`chara/delist/chara/${page}/${pageSize}`);
      if (!data || data.State !== 0 || !data.Value) {
        return {
          success: false,
          message: "获取ST角色列表失败"
        };
      }
      const value = data.Value;
      return {
        success: true,
        data: {
          currentPage: value.CurrentPage,
          totalPages: value.TotalPages,
          totalItems: value.TotalItems,
          itemsPerPage: value.ItemsPerPage,
          items: value.Items || []
        }
      };
    } catch (error) {
      console.error("获取ST角色列表失败:", error);
      return {
        success: false,
        message: "获取ST角色列表失败"
      };
    }
  }
  async function getMaxValueICO(page = 1, pageSize = 24) {
    try {
      const data = await get(`chara/mvi/${page}/${pageSize}`);
      if (!data || data.State !== 0 || !Array.isArray(data.Value)) {
        return {
          success: false,
          message: "获取ICO最多资金失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("获取ICO最多资金失败:", error);
      return {
        success: false,
        message: "获取ICO最多资金失败"
      };
    }
  }
  async function getRecentActiveICO(page = 1, pageSize = 24) {
    try {
      const data = await get(`chara/rai/${page}/${pageSize}`);
      if (!data || data.State !== 0 || !Array.isArray(data.Value)) {
        return {
          success: false,
          message: "获取ICO最近活跃失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("获取ICO最近活跃失败:", error);
      return {
        success: false,
        message: "获取ICO最近活跃失败"
      };
    }
  }
  async function getMostRecentICO(page = 1, pageSize = 24) {
    try {
      const data = await get(`chara/mri/${page}/${pageSize}`);
      if (!data || data.State !== 0 || !Array.isArray(data.Value)) {
        return {
          success: false,
          message: "获取ICO即将结束失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("获取ICO即将结束失败:", error);
      return {
        success: false,
        message: "获取ICO即将结束失败"
      };
    }
  }

  function UserHeader({
    name,
    nickname,
    balance,
    lastIndex,
    assets,
    avatar,
    abbreviateBalance = true,
    onToggleAbbreviate,
    onRedPacketLogClick,
    onSendRedPacketClick,
    onBanClick,
    onUnbanClick
  }) {
    let isSelf = false;
    const myAssets = getCachedUserAssets();
    if (myAssets) {
      isSelf = myAssets.name === name;
    }
    return h("div", {
      id: "tg-user-tinygrail-header",
      className: "tg-bg-content p-2 pt-0"
    }, h("div", {
      className: "mx-auto"
    }, h("div", {
      className: "flex items-center justify-between gap-3"
    }, h("div", {
      className: "flex items-center gap-3"
    }, h(Avatar, {
      src: avatar,
      alt: nickname,
      rank: lastIndex > 0 ? lastIndex : null
    }), h("div", {
      className: "flex flex-col gap-0.5"
    }, h("a", {
      target: "_blank",
      href: `/user/${name}`,
      className: "tg-link inline-flex items-center gap-1 text-sm font-semibold transition-colors"
    }, h("span", null, nickname), h(SquareArrowOutUpRightIcon, {
      className: "h-3.5 w-3.5"
    })), h("span", {
      className: "text-xs opacity-60"
    }, "@", name))), h("div", {
      className: "mr-2 flex shrink-0 gap-2"
    }, h(Button, {
      variant: "outline",
      rounded: "full",
      onClick: onRedPacketLogClick
    }, "红包记录"), !isSelf && h(Button, {
      variant: "outline",
      rounded: "full",
      onClick: onSendRedPacketClick
    }, "发送红包"))), h("div", {
      className: "mt-2 flex gap-4 text-sm"
    }, h("div", {
      className: "text-sm font-medium opacity-60"
    }, "资产: ", formatCurrency(assets)), h("button", {
      className: "flex items-center gap-1 border-none bg-transparent p-0 text-sm font-medium opacity-60 transition-opacity hover:opacity-80",
      onClick: onToggleAbbreviate,
      title: abbreviateBalance ? "显示完整金额" : "显示缩略金额",
      "aria-label": "切换缩略显示"
    }, h("span", null, "余额: ", formatCurrency(balance, "₵", 2, abbreviateBalance)), h(ArrowRightLeftIcon, {
      className: "h-3 w-3"
    }))), isGameMaster() && h("div", {
      className: "mt-2 flex flex-wrap gap-2"
    }, h(Button, null, "资金日志"), h(Button, null, "交易记录"), h(Button, {
      onClick: onBanClick
    }, "封禁"), h(Button, {
      onClick: onUnbanClick
    }, "解封"))));
  }

  function Tabs({
    items,
    activeTab,
    onTabChange,
    sticky = false,
    stickyTop = "0",
    size = "large",
    padding = "px-1 py-3",
    icon = null,
    onIconClick = null
  }) {
    const activeItem = items[activeTab];
    const TabComponent = activeItem?.component;
    const stickyClass = sticky ? "sticky" : "";
    const stickyStyle = sticky ? {
      top: stickyTop,
      zIndex: 5
    } : {};
    const sizeClasses = {
      large: "px-4 py-3 text-sm",
      small: "px-3 py-2 text-xs"
    };
    const tabClass = sizeClasses[size] || sizeClasses.large;
    return h("div", {
      id: "tg-tabs"
    }, h("div", {
      id: "tg-tabs-nav",
      className: `${stickyClass} tg-bg-content border-b border-gray-200 dark:border-gray-600`,
      style: stickyStyle
    }, h("div", {
      className: "mx-auto flex"
    }, h("div", {
      className: "flex flex-1 overflow-x-auto"
    }, items.map((item, index) => h("button", {
      className: `flex-shrink-0 whitespace-nowrap border-b-2 ${tabClass} font-medium transition-colors ${activeTab === index ? "bgm-border-color bgm-color" : "border-transparent opacity-60 hover:opacity-100"}`,
      onClick: () => {
        if (index !== activeTab) {
          onTabChange(index);
        }
      }
    }, item.label))), icon && h("div", {
      className: "flex flex-shrink-0 items-center"
    }, h("button", {
      className: `${tabClass} border-b-2 border-transparent opacity-60 transition-colors hover:opacity-100`,
      onClick: onIconClick
    }, icon)))), h("div", {
      id: "tg-tabs-content",
      className: `mx-auto ${padding}`
    }, TabComponent && h(TabComponent, null)));
  }

  const CDN = "https://tinygrail.mange.cn/";
  const OSS_URL = "https://tinygrail.oss-cn-hangzhou.aliyuncs.com/";
  function getCover(cover, size = "large") {
    if (!cover) return "";
    const width = size === "small" ? "150" : "480";
    if (cover.includes("/crt/")) {
      if (size === "large" && cover.includes("/crt/m/")) {
        return cover.replace("/m/", "/l/");
      }
      if (size === "small" && cover.includes("/crt/g/")) {
        return cover.replace("/g/", "/m/");
      }
      return cover;
    }
    if (cover.startsWith(OSS_URL)) {
      return `${CDN}${cover.substring(OSS_URL.length)}!w${width}`;
    }
    if (cover.startsWith("/cover")) {
      return `${CDN}${cover}!w${width}`;
    }
    if (cover.startsWith("//")) {
      return `https:${cover}`;
    }
    return cover;
  }
  function getLargeCover(cover) {
    return getCover(cover, "large");
  }
  function normalizeAvatar(avatar) {
    if (!avatar) return "//lain.bgm.tv/pic/user/l/icon.jpg";
    if (avatar.startsWith(OSS_URL)) {
      return `${CDN}${avatar.substring(OSS_URL.length)}!w120`;
    }
    if (avatar.startsWith("/avatar")) {
      return `${CDN}${avatar}!w120`;
    }
    const normalized = avatar.replace("http://", "//");
    return normalized;
  }

  function TempleLink({
    temple1,
    temple2,
    size = "default",
    showCharaName = true,
    sort = true,
    onNameClick,
    onCoverClick
  }) {
    if (!temple1 || !temple2) return null;
    let left = temple1;
    let right = temple2;
    if (sort && temple1.Sacrifices < temple2.Sacrifices) {
      right = temple1;
      left = temple2;
    }
    const coverSize = size === "mini" ? "small" : "large";
    const leftCover = getCover(left.Cover, coverSize);
    const rightCover = getCover(right.Cover, coverSize);
    const getLevelColor = level => {
      if (level === 2) return "border-yellow-500";
      if (level === 3) return "border-purple-500";
      return "border-gray-400";
    };
    const leftColor = getLevelColor(left.Level);
    const rightColor = getLevelColor(right.Level);
    const sizeStyles = {
      default: {
        container: "w-[432px] h-[330px]",
        width: "w-[432px]",
        leftOuter: "w-[240px] h-[330px]",
        leftInner: "w-[240px] h-[320px] rounded-bl-[15px] rounded-tl-[15px]",
        rightOuter: "w-[250px] h-[330px] left-[188px]",
        rightInner: "w-[240px] h-[320px] rounded-br-[15px] rounded-tr-[15px]"
      },
      small: {
        container: "w-[214px] h-[165px]",
        width: "w-[214px]",
        leftOuter: "w-[120px] h-[165px]",
        leftInner: "w-[118px] h-[160px] rounded-bl-[10px] rounded-tl-[10px]",
        rightOuter: "w-[120px] h-[165px] left-[93px]",
        rightInner: "w-[118px] h-[160px] rounded-br-[10px] rounded-tr-[10px]"
      },
      mini: {
        container: "w-[188px] h-[150px]",
        width: "w-[188px]",
        leftOuter: "w-[105px] h-[150px]",
        leftInner: "w-[105px] h-[140px] rounded-bl-[10px] rounded-tl-[10px]",
        rightOuter: "w-[120px] h-[150px] left-[80px]",
        rightInner: "w-[105px] h-[140px] rounded-br-[10px] rounded-tr-[10px]"
      }
    };
    const styles = sizeStyles[size];
    return h("div", {
      id: "tg-temple-link",
      className: "flex flex-col items-center"
    }, h("div", {
      className: `relative flex overflow-hidden ${styles.container}`
    }, h("div", {
      id: "tg-temple-link-left",
      "data-character-id": left.CharacterId,
      className: `${styles.leftOuter} origin-top-left overflow-hidden ${onCoverClick ? "cursor-pointer" : ""}`,
      style: {
        transform: "skewX(-10deg)"
      },
      onClick: () => onCoverClick && onCoverClick(left)
    }, h("div", {
      className: `${styles.leftInner} box-content origin-top-left overflow-hidden border-2 border-r-0 ${leftColor}`,
      style: {
        transform: "skewX(10deg)",
        backgroundImage: `url(${leftCover})`,
        backgroundPosition: "top",
        backgroundSize: "cover"
      }
    })), h("div", {
      id: "tg-temple-link-right",
      "data-character-id": right.CharacterId,
      className: `absolute ${styles.rightOuter} origin-bottom-right overflow-hidden ${onCoverClick ? "cursor-pointer" : ""}`,
      style: {
        transform: "skewX(-10deg)"
      },
      onClick: () => onCoverClick && onCoverClick(right)
    }, h("div", {
      className: `${styles.rightInner} box-content origin-bottom-right overflow-hidden border-2 border-l-0 ${rightColor}`,
      style: {
        transform: "skewX(10deg)",
        backgroundImage: `url(${rightCover})`,
        backgroundPosition: "top",
        backgroundSize: "cover"
      }
    }))), showCharaName && h("div", {
      id: "tg-temple-link-names",
      className: `text-left text-sm opacity-80 ${styles.width}`
    }, "「", h("span", {
      className: onNameClick ? "tg-link cursor-pointer" : "",
      onClick: () => onNameClick && onNameClick(left)
    }, left.Name), "」×「", h("span", {
      className: onNameClick ? "tg-link cursor-pointer" : "",
      onClick: () => onNameClick && onNameClick(right)
    }, right.Name), "」"));
  }

  function Pagination({
    current = 1,
    total = 1,
    onChange,
    type = "normal",
    className = ""
  }) {
    const prevDisabled = current <= 1;
    const nextDisabled = current >= total;
    if (type === "simple") {
      const prevDisabled = current <= 1;
      const prevButton = h("button", {
        className: `flex items-center justify-center rounded-md border border-gray-300 p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${prevDisabled ? "" : "hover:bg-gray-100 dark:hover:bg-gray-700"} dark:border-gray-600`,
        onClick: () => onChange && onChange(current - 1)
      }, h(ChevronLeftIcon, null));
      if (prevDisabled) prevButton.disabled = true;
      const nextButton = h("button", {
        className: "flex items-center justify-center rounded-md border border-gray-300 p-1 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700",
        onClick: () => onChange && onChange(current + 1)
      }, h(ChevronRightIcon, null));
      return h("div", {
        id: "tg-pagination",
        className: `flex items-center gap-2 ${className}`
      }, prevButton, h("span", {
        className: "text-sm opacity-60"
      }, "第 ", current, " 页"), nextButton);
    }
    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 7;
      if (total <= maxVisible) {
        for (let i = 1; i <= total; i++) {
          pages.push(i);
        }
      } else {
        if (current <= 4) {
          for (let i = 1; i <= 5; i++) {
            pages.push(i);
          }
          pages.push("...");
          pages.push(total);
        } else if (current >= total - 3) {
          pages.push(1);
          pages.push("...");
          for (let i = total - 4; i <= total; i++) {
            pages.push(i);
          }
        } else {
          pages.push(1);
          pages.push("...");
          for (let i = current - 1; i <= current + 1; i++) {
            pages.push(i);
          }
          pages.push("...");
          pages.push(total);
        }
      }
      return pages;
    };
    const pageNumbers = getPageNumbers();
    const prevButton = h("button", {
      className: `flex items-center justify-center rounded-md border border-gray-300 p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${prevDisabled ? "" : "hover:bg-gray-100 dark:hover:bg-gray-700"} dark:border-gray-600`,
      onClick: () => onChange && onChange(current - 1)
    }, h(ChevronLeftIcon, null));
    if (prevDisabled) prevButton.disabled = true;
    const nextButton = h("button", {
      className: `flex items-center justify-center rounded-md border border-gray-300 p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${nextDisabled ? "" : "hover:bg-gray-100 dark:hover:bg-gray-700"} dark:border-gray-600`,
      onClick: () => onChange && onChange(current + 1)
    }, h(ChevronRightIcon, null));
    if (nextDisabled) nextButton.disabled = true;
    return h("div", {
      id: "tg-pagination",
      className: `flex flex-wrap items-center justify-center gap-1 ${className}`
    }, prevButton, pageNumbers.map((page, index) => {
      if (page === "...") {
        const isLeft = index < pageNumbers.length / 2;
        const targetPage = isLeft ? Math.max(1, current - 5) : Math.min(total, current + 5);
        const ellipsisButton = h("button", {
          className: "group flex min-w-[32px] items-center justify-center rounded-md border border-gray-300 px-2 py-1 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700",
          onClick: () => onChange && onChange(targetPage)
        }, h("span", {
          className: "block group-hover:hidden"
        }, h(EllipsisIcon, {
          className: "size-5"
        })), h("span", {
          className: "hidden group-hover:block"
        }, isLeft ? h(ChevronsLeftIcon, {
          className: "size-5"
        }) : h(ChevronsRightIcon, {
          className: "size-5"
        })));
        return ellipsisButton;
      }
      return h("button", {
        className: `min-w-[32px] rounded-md border px-2 py-1 text-sm transition-colors ${page === current ? "bgm-border-color bgm-bg text-white" : "border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"}`,
        onClick: () => {
          if (page !== current) {
            onChange && onChange(page);
          }
        }
      }, page);
    }), nextButton, h("div", {
      className: "flex items-center gap-2 ml-2"
    }, h("span", {
      className: "text-sm opacity-60"
    }, "跳至"), h("input", {
      type: "number",
      min: "1",
      max: total,
      className: "w-16 rounded-md border border-gray-300 px-2 py-1 text-sm text-center focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800",
      onKeyDown: e => {
        if (e.key === "Enter") {
          const value = parseInt(e.target.value);
          if (!isNaN(value)) {
            const targetPage = Math.max(1, Math.min(total, value));
            onChange && onChange(targetPage);
            e.target.value = "";
          }
        }
      }
    }), h("span", {
      className: "text-sm opacity-60"
    }, "页")));
  }

  function LinksTab({
    data,
    onPageChange,
    onCharacterClick,
    onTempleClick
  }) {
    if (!data || !data.items || data.items.length === 0) {
      return h("div", {
        className: "tg-bg-content rounded-lg p-8 text-center"
      }, h("p", {
        className: "text-lg opacity-60"
      }, "暂无连接"));
    }
    const container = h("div", {
      className: "flex w-full flex-col gap-4"
    });
    const gridDiv = h("div", {
      className: "grid w-full justify-items-center gap-2"
    });
    const paginationDiv = h("div", {
      className: "flex w-full justify-center"
    });
    const renderItems = (cols, size) => {
      gridDiv.innerHTML = "";
      gridDiv.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      data.items.forEach(item => {
        if (!item.Link) return;
        const minAssets = Math.min(item.Assets, item.Link.Assets);
        const itemContainer = h("div", {
          className: "flex flex-col items-start gap-1"
        }, h(TempleLink, {
          temple1: item,
          temple2: item.Link,
          size: size,
          onNameClick: data => {
            if (onCharacterClick) {
              onCharacterClick(data.CharacterId);
            }
          },
          onCoverClick: data => {
            if (onTempleClick) {
              onTempleClick(data);
            }
          }
        }), h("div", {
          className: "text-xs opacity-80"
        }, "+", formatNumber(minAssets, 0)));
        gridDiv.appendChild(itemContainer);
      });
    };
    const calculateColumns = width => {
      const newSize = width >= 440 ? "small" : "mini";
      const minCellWidth = newSize === "small" ? 214 : 188;
      const gap = 8;
      let cols = Math.floor((width + gap) / (minCellWidth + gap));
      const divisors = [12, 6, 4, 3, 2, 1];
      for (const divisor of divisors) {
        if (cols >= divisor) {
          return {
            cols: divisor,
            size: newSize
          };
        }
      }
      return {
        cols: 1,
        size: newSize
      };
    };
    const initial = calculateColumns(container.offsetWidth || 800);
    renderItems(initial.cols, initial.size);
    container.appendChild(gridDiv);
    if (data.totalPages && data.totalPages >= 1) {
      const pagination = h(Pagination, {
        current: Number(data.currentPage) || 1,
        total: Number(data.totalPages),
        onChange: page => onPageChange && onPageChange(page)
      });
      paginationDiv.appendChild(pagination);
      container.appendChild(paginationDiv);
    }
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const result = calculateColumns(width);
        renderItems(result.cols, result.size);
      }
    });
    observer.observe(container);
    return container;
  }

  function ProgressBar({
    value = 0,
    max = 100,
    color = "bg-blue-500",
    bgColor = "bg-gray-200 dark:bg-gray-700",
    height = "h-1",
    className = ""
  }) {
    const percentage = Math.min(Math.max(value / max * 100, 0), 100);
    const isTailwindClass = color.startsWith("bg-");
    return h("div", {
      id: "tg-progress-bar",
      "data-value": value,
      "data-max": max,
      className: `w-full overflow-hidden rounded-full ${bgColor} ${height} ${className}`
    }, h("div", {
      className: `${height} transition-all duration-300 ${isTailwindClass ? color : ""}`,
      style: {
        width: `${percentage}%`,
        backgroundColor: isTailwindClass ? undefined : color
      }
    }));
  }

  function Temple({
    temple,
    bottomText,
    onClick,
    showProgress = true
  }) {
    if (!temple) return null;
    const cover = getCover(temple.Cover, "small");
    const hasCover = !!temple.Cover;
    const avatarUrl = normalizeAvatar(temple.Avatar);
    const hasLine = !!temple.Line;
    const getTempleThemeColor = level => {
      if (level === 2) return {
        border: "border-yellow-500",
        bg: "bg-yellow-500",
        color: "#eab308"
      };
      if (level === 3) return {
        border: "border-purple-500",
        bg: "bg-purple-500",
        color: "#a855f7"
      };
      return {
        border: "border-gray-400",
        bg: "bg-gray-400",
        color: "#9ca3af"
      };
    };
    const getTempleGrade = (level, refine) => {
      if (refine > 0) return "无限圣殿";
      if (level === 1) return "光辉圣殿";
      if (level === 2) return "闪耀圣殿";
      if (level === 3) return "奇迹圣殿";
      return "";
    };
    const templeTheme = getTempleThemeColor(temple.Level);
    const templeGrade = getTempleGrade(temple.Level, temple.Refine);
    const levelText = temple.Refine > 0 ? `+${temple.Refine}` : `${temple.Level}`;
    return h("div", {
      id: "tg-temple",
      "data-character-id": temple.CharacterId,
      "data-level": temple.Level,
      "data-assets": temple.Assets,
      "data-sacrifices": temple.Sacrifices,
      className: "flex w-full flex-col gap-1"
    }, h("div", {
      id: "tg-temple-image",
      className: `group relative aspect-[3/4] w-full overflow-hidden rounded-lg border-2 ${templeTheme.border} ${onClick ? "cursor-pointer" : ""}`,
      onClick: () => onClick && onClick(temple)
    }, hasCover ? h("div", {
      className: "h-full w-full",
      style: {
        backgroundImage: `url(${cover})`,
        backgroundPosition: "top",
        backgroundSize: "cover"
      }
    }) : h("div", null, h("div", {
      className: "absolute inset-0",
      style: {
        backgroundImage: `url(${avatarUrl})`,
        backgroundPosition: "center",
        backgroundSize: "cover",
        filter: "blur(10px)"
      }
    }), h("div", {
      className: "absolute inset-0 flex items-center justify-center"
    }, h("div", {
      className: "aspect-square w-1/2 rounded-full bg-cover bg-top",
      style: {
        backgroundImage: `url(${avatarUrl})`
      }
    }))), h("div", {
      id: "tg-temple-level",
      className: `absolute left-1 top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full ${templeTheme.bg} px-1.5 text-xs font-semibold text-white`,
      title: templeGrade
    }, levelText), bottomText && h("div", {
      id: "tg-temple-bottom-text",
      className: `absolute bottom-5 right-0 rounded-l-md ${templeTheme.bg} px-2 py-0.5 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100`
    }, bottomText), hasLine && h("div", {
      id: "tg-temple-line",
      className: "absolute bottom-1 right-1 px-1 py-0.5 text-base font-bold leading-3 text-white",
      style: {
        textShadow: "1px 1px 1px #000"
      },
      title: temple.Line
    }, "···")), showProgress && h("div", {
      id: "tg-temple-progress",
      className: "flex w-full flex-col gap-0.5"
    }, h("div", {
      className: "text-xs opacity-60"
    }, formatNumber(temple.Assets ?? 0, 0), " / ", formatNumber(temple.Sacrifices ?? 0, 0)), h(ProgressBar, {
      value: temple.Assets ?? 0,
      max: temple.Sacrifices ?? 100,
      color: templeTheme.color,
      height: "h-1"
    })));
  }

  function LevelBadge({
    level,
    zeroCount = 0,
    size = "sm",
    className = ""
  }) {
    const getLevelColor = lv => {
      if (lv === 0) return "#d2d2d2";
      if (lv === 1) return "#45d216";
      if (lv === 2) return "#70bbff";
      if (lv === 3) return "#ffdc51";
      if (lv === 4) return "#FF9800";
      if (lv === 5) return "#d965ff";
      if (lv === 6) return "#ff5555";
      if (lv === 7) return "#e9ea54";
      if (lv === 8) return "#4293e4";
      if (lv >= 9) return "#ffb851";
      return "#d2d2d2";
    };
    const bgColor = getLevelColor(level);
    const sizeClasses = {
      sm: "h-4 text-[10px] leading-4 px-1.5",
      md: "h-5 text-xs leading-5 px-2",
      lg: "h-6 text-sm leading-6 px-2.5"
    };
    const sizeClass = sizeClasses[size] || sizeClasses.sm;
    const displayText = level === 0 && zeroCount !== 0 ? `st${zeroCount}` : `lv${level}`;
    return h("div", {
      id: "tg-level-badge",
      "data-level": level,
      className: `inline-flex items-center ${className}`,
      title: level === 0 && zeroCount !== 0 ? "ST" : "等级"
    }, h("span", {
      className: `inline-block rounded-md py-0 font-semibold text-white ${sizeClass}`,
      style: {
        backgroundColor: bgColor
      }
    }, displayText));
  }

  function TemplesTab({
    data,
    onPageChange,
    onCharacterClick,
    onTempleClick
  }) {
    if (!data || !data.items || data.items.length === 0) {
      return h("div", {
        className: "tg-bg-content rounded-lg p-8 text-center"
      }, h("p", {
        className: "text-lg opacity-60"
      }, "暂无圣殿"));
    }
    const container = h("div", {
      className: "flex w-full flex-col gap-4"
    });
    const gridDiv = h("div", {
      className: "grid w-full gap-4"
    });
    const paginationDiv = h("div", {
      className: "flex w-full justify-center"
    });
    const calculateColumns = width => {
      const minCellWidth = 120;
      const gap = 16;
      let cols = Math.floor((width + gap) / (minCellWidth + gap));
      const divisors = [24, 12, 8, 6, 4, 3, 2, 1];
      for (const divisor of divisors) {
        if (cols >= divisor) {
          return divisor;
        }
      }
      return 1;
    };
    data.items.forEach(item => {
      const itemContainer = h("div", {
        className: "flex w-full min-w-0 flex-col gap-1"
      }, h(Temple, {
        temple: item,
        bottomText: `+${formatNumber(item.Rate)}`,
        onClick: temple => {
          if (onTempleClick) {
            onTempleClick(temple);
          }
        }
      }), h("div", {
        className: "flex min-w-0 items-center justify-start gap-1 text-sm"
      }, h(LevelBadge, {
        level: item.CharacterLevel,
        zeroCount: item.ZeroCount
      }), h("span", {
        className: "tg-link min-w-0 cursor-pointer truncate opacity-80 hover:opacity-100",
        onClick: () => {
          if (onCharacterClick) {
            onCharacterClick(item.CharacterId);
          }
        }
      }, item.Name)));
      gridDiv.appendChild(itemContainer);
    });
    container.appendChild(gridDiv);
    if (data.totalPages && data.totalPages >= 1) {
      const pagination = h(Pagination, {
        current: Number(data.currentPage) || 1,
        total: Number(data.totalPages),
        onChange: page => onPageChange && onPageChange(page)
      });
      paginationDiv.appendChild(pagination);
      container.appendChild(paginationDiv);
    }
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const newCols = calculateColumns(width);
        gridDiv.style.gridTemplateColumns = `repeat(${newCols}, 1fr)`;
      }
    });
    observer.observe(container);
    return container;
  }

  function CharasTab({
    data,
    onPageChange,
    onCharacterClick
  }) {
    if (!data || !data.items || data.items.length === 0) {
      return h("div", {
        className: "tg-bg-content rounded-lg p-8 text-center"
      }, h("p", {
        className: "text-lg opacity-60"
      }, "暂无角色"));
    }
    const container = h("div", {
      className: "flex w-full flex-col gap-4"
    });
    const gridDiv = h("div", {
      className: "grid w-full"
    });
    const paginationDiv = h("div", {
      className: "flex w-full justify-center"
    });
    const renderItems = (cols, isMobile) => {
      gridDiv.innerHTML = "";
      if (isMobile) {
        gridDiv.style.display = "flex";
        gridDiv.style.flexDirection = "column";
        gridDiv.style.gap = "0";
      } else {
        gridDiv.style.display = "grid";
        gridDiv.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        gridDiv.style.gap = "0.75rem";
      }
      data.items.forEach(item => {
        const avatarUrl = normalizeAvatar(item.Icon);
        const itemDiv = h("div", {
          className: `flex items-center gap-3 ${isMobile ? "tg-bg-content border-b border-gray-200 p-3 first:pt-0 last:border-b-0 last:pb-0 dark:border-gray-700" : "tg-bg-content"}`
        }, h("div", {
          className: `flex-shrink-0 cursor-pointer rounded-lg border border-gray-200 bg-cover bg-top dark:border-gray-600 ${isMobile ? "h-12 w-12" : "h-16 w-16"}`,
          style: {
            backgroundImage: `url(${avatarUrl})`
          },
          onClick: () => {
            if (onCharacterClick) {
              onCharacterClick(item.CharacterId);
            }
          }
        }), h("div", {
          className: "flex flex-1 flex-col gap-1"
        }, h("a", {
          href: `https://bgm.tv/character/${item.CharacterId}`,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "tg-link flex items-center gap-1 text-base font-medium hover:opacity-100"
        }, h(LevelBadge, {
          level: item.Level,
          zeroCount: item.ZeroCount
        }), h("span", null, item.Name), h(SquareArrowOutUpRightIcon, {
          className: "h-4 w-4 flex-shrink-0"
        })), isMobile ? h("div", {
          className: "text-sm opacity-60"
        }, h("span", null, "持股：", item.UserTotal === 0 ? '--' : formatNumber(item.UserTotal, 0)), h("span", {
          className: "mx-2"
        }, "•"), h("span", null, "固定资产：", item.Sacrifices === 0 ? '--' : formatNumber(item.Sacrifices, 0))) : h("div", {
          className: "flex flex-col gap-0.5"
        }, h("div", {
          className: "text-sm opacity-60"
        }, "持股：", item.UserTotal === 0 ? '--' : formatNumber(item.UserTotal, 0)), h("div", {
          className: "text-sm opacity-60"
        }, "固定资产：", item.Sacrifices === 0 ? '--' : formatNumber(item.Sacrifices, 0)))));
        gridDiv.appendChild(itemDiv);
      });
    };
    const calculateLayout = width => {
      const isMobile = width < 640;
      if (isMobile) {
        return {
          cols: 1,
          isMobile: true
        };
      }
      const minCellWidth = 240;
      const gap = 12;
      let cols = Math.floor((width + gap) / (minCellWidth + gap));
      const divisors = [48, 24, 16, 12, 8, 6, 4, 3, 2, 1];
      for (const divisor of divisors) {
        if (cols >= divisor) {
          return {
            cols: divisor,
            isMobile: false
          };
        }
      }
      return {
        cols: 1,
        isMobile: false
      };
    };
    const initialLayout = calculateLayout(container.offsetWidth || 800);
    renderItems(initialLayout.cols, initialLayout.isMobile);
    container.appendChild(gridDiv);
    if (data.totalPages && data.totalPages >= 1) {
      const pagination = h(Pagination, {
        current: Number(data.currentPage) || 1,
        total: Number(data.totalPages),
        onChange: page => onPageChange && onPageChange(page)
      });
      paginationDiv.appendChild(pagination);
      container.appendChild(paginationDiv);
    }
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const layout = calculateLayout(width);
        renderItems(layout.cols, layout.isMobile);
      }
    });
    observer.observe(container);
    return container;
  }

  function ICOsTab({
    data,
    onPageChange,
    onCharacterClick
  }) {
    if (!data || !data.items || data.items.length === 0) {
      return h("div", {
        className: "tg-bg-content rounded-lg p-8 text-center"
      }, h("p", {
        className: "text-lg opacity-60"
      }, "暂无ICO"));
    }
    const container = h("div", {
      className: "flex w-full flex-col"
    });
    const gridDiv = h("div", {
      className: "grid w-full"
    });
    const paginationDiv = h("div", {
      className: "flex w-full justify-center"
    });
    const renderItems = (cols, isMobile) => {
      gridDiv.innerHTML = "";
      if (isMobile) {
        gridDiv.style.display = "flex";
        gridDiv.style.flexDirection = "column";
        gridDiv.style.gap = "0";
      } else {
        gridDiv.style.display = "grid";
        gridDiv.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        gridDiv.style.gap = "0.75rem";
      }
      data.items.forEach(item => {
        const avatarUrl = normalizeAvatar(item.Icon);
        const remainingTime = formatRemainingTime(item.End);
        const itemDiv = h("div", {
          className: `flex items-center gap-3 ${isMobile ? "tg-bg-content border-b border-gray-200 p-3 px-3 py-3 first:pt-0 last:border-b-0 last:pb-0 dark:border-gray-700" : "tg-bg-content rounded-lg"}`
        }, h("div", {
          className: `flex-shrink-0 cursor-pointer rounded-lg border border-gray-200 bg-cover bg-top dark:border-gray-600 ${isMobile ? "h-12 w-12" : "h-16 w-16"}`,
          style: {
            backgroundImage: `url(${avatarUrl})`
          },
          onClick: () => {
            if (onCharacterClick) {
              onCharacterClick(item.CharacterId);
            }
          }
        }), h("div", {
          className: "flex flex-1 flex-col gap-1"
        }, h("a", {
          href: `https://bgm.tv/character/${item.CharacterId}`,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "tg-link flex items-center gap-1 text-base font-medium hover:opacity-100"
        }, h("span", {
          className: "truncate"
        }, item.Name), h(SquareArrowOutUpRightIcon, {
          className: "h-4 w-4 flex-shrink-0"
        })), isMobile ? h("div", {
          className: "flex flex-col gap-0.5"
        }, h("div", {
          className: "text-sm opacity-60"
        }, h("span", null, "已筹集：", formatCurrency(item.Total, "₵", 2, false)), h("span", {
          className: "mx-1"
        }, "•"), h("span", null, "已注资：", formatCurrency(item.State, "₵", 2, false))), h("div", {
          className: "text-sm opacity-60"
        }, remainingTime)) : h("div", {
          className: "flex flex-col gap-0.5"
        }, h("div", {
          className: "text-sm opacity-60"
        }, "已筹集：", formatCurrency(item.Total, "₵", 2, false)), h("div", {
          className: "text-sm opacity-60"
        }, "已注资：", formatCurrency(item.State, "₵", 2, false)), h("div", {
          className: "text-sm opacity-60"
        }, remainingTime))));
        gridDiv.appendChild(itemDiv);
      });
    };
    const calculateLayout = width => {
      const isMobile = width < 640;
      if (isMobile) {
        return {
          cols: 1,
          isMobile: true
        };
      }
      const minCellWidth = 280;
      const gap = 12;
      let cols = Math.floor((width + gap) / (minCellWidth + gap));
      const divisors = [48, 24, 16, 12, 8, 6, 4, 3, 2, 1];
      for (const divisor of divisors) {
        if (cols >= divisor) {
          return {
            cols: divisor,
            isMobile: false
          };
        }
      }
      return {
        cols: 1,
        isMobile: false
      };
    };
    const initialLayout = calculateLayout(container.offsetWidth || 800);
    renderItems(initialLayout.cols, initialLayout.isMobile);
    container.appendChild(gridDiv);
    if (data.totalPages && data.totalPages >= 1) {
      const pagination = h(Pagination, {
        current: Number(data.currentPage) || 1,
        total: Number(data.totalPages),
        onChange: page => onPageChange && onPageChange(page)
      });
      paginationDiv.appendChild(pagination);
      container.appendChild(paginationDiv);
    }
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const layout = calculateLayout(width);
        renderItems(layout.cols, layout.isMobile);
      }
    });
    observer.observe(container);
    return container;
  }

  function UserTinygrailTabs({
    activeTab,
    onTabChange,
    charaLinks,
    temples,
    charas,
    icos,
    onLinksPageChange,
    onTemplesPageChange,
    onCharasPageChange,
    onICOsPageChange,
    onCharacterClick,
    onTempleClick,
    stickyTop = null
  }) {
    const tabItems = [];
    if (charaLinks && charaLinks.totalItems > 0) {
      tabItems.push({
        key: "links",
        label: `${charaLinks.totalItems}组连接`,
        component: () => h(LinksTab, {
          data: charaLinks,
          onPageChange: onLinksPageChange,
          onCharacterClick: onCharacterClick,
          onTempleClick: onTempleClick
        })
      });
    }
    if (temples) {
      tabItems.push({
        key: "temples",
        label: `${temples.totalItems}座圣殿`,
        component: () => h(TemplesTab, {
          data: temples,
          onPageChange: onTemplesPageChange,
          onCharacterClick: onCharacterClick,
          onTempleClick: onTempleClick
        })
      });
    }
    if (charas) {
      tabItems.push({
        key: "charas",
        label: `${charas.totalItems}个人物`,
        component: () => h(CharasTab, {
          data: charas,
          onPageChange: onCharasPageChange,
          onCharacterClick: onCharacterClick
        })
      });
    }
    if (icos) {
      tabItems.push({
        key: "icos",
        label: `${icos.totalItems}个ICO`,
        component: () => h(ICOsTab, {
          data: icos,
          onPageChange: onICOsPageChange,
          onCharacterClick: onCharacterClick
        })
      });
    }
    if (tabItems.length === 0) {
      return h("div", {
        className: "mx-auto max-w-4xl p-6"
      }, h("div", {
        className: "tg-bg-content rounded-lg p-8 text-center"
      }, h("p", {
        className: "text-lg opacity-60"
      }, "加载中...")));
    }
    return h(Tabs, {
      items: tabItems,
      activeTab: activeTab,
      onTabChange: onTabChange,
      sticky: true,
      stickyTop: stickyTop
    });
  }

  function createRequestManager() {
    let requestId = 0;
    return {
      execute: async (requestFn, onSuccess, onError) => {
        const currentRequestId = ++requestId;
        try {
          const result = await requestFn();
          if (currentRequestId === requestId) {
            onSuccess(result);
          }
        } catch (error) {
          if (currentRequestId === requestId && onError) {
            onError(error);
          }
        }
      }
    };
  }

  function RedPacketLog({
    username,
    nickname = ""
  }) {
    const container = h("div", {
      id: "tg-red-packet-log",
      className: "max-w-2xl"
    });
    const requestManager = createRequestManager();
    const renderDescription = (description, relatedName, onUserClick) => {
      const regex = /「([^」]+)」/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      while ((match = regex.exec(description)) !== null) {
        if (match.index > lastIndex) {
          parts.push(description.substring(lastIndex, match.index));
        }
        const nickname = match[1];
        parts.push(h("span", {
          className: "tg-link cursor-pointer",
          onClick: e => {
            e.stopPropagation();
            if (onUserClick) {
              onUserClick(relatedName);
            }
          }
        }, "「", unescapeHtml(nickname), "」"));
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < description.length) {
        parts.push(description.substring(lastIndex));
      }
      return h("span", null, parts);
    };
    const {
      setState
    } = createMountedComponent(container, state => {
      const {
        redPacketLogData = null,
        showUserModal = false,
        userModalUsername = null
      } = state || {};
      if (!redPacketLogData) {
        return h("div", {
          className: "p-4"
        }, h("div", null, "加载中..."));
      }
      if (redPacketLogData.error) {
        return h("div", {
          className: "p-4"
        }, h("div", null, "加载失败"));
      }
      const {
        Items: items = [],
        TotalPages: totalPages = 0,
        CurrentPage: currentPage = 1
      } = redPacketLogData;
      const handleUserClick = username => {
        setState({
          showUserModal: true,
          userModalUsername: username
        });
      };
      const handlePageChange = page => {
        loadRedPacketLogPage(page);
      };
      return h("div", null, items.length > 0 ? h("div", null, h("div", {
        className: "divide-y divide-gray-200 dark:divide-gray-700"
      }, items.map((item, index) => {
        const isPositive = item.Change > 0;
        const changeColor = isPositive ? "#ff658d" : "#65bcff";
        const changeText = isPositive ? `+${formatCurrency(item.Change)}` : formatCurrency(item.Change);
        return h("div", {
          className: "py-2 first:pt-0 last:pb-0"
        }, h("div", {
          className: "flex items-center justify-between"
        }, h("span", {
          className: "text-xs font-semibold",
          style: {
            color: changeColor
          }
        }, changeText), h("span", {
          className: "text-xs text-gray-500 dark:text-gray-400"
        }, formatDateTime(item.LogTime))), h("div", {
          className: "mt-1 text-xs text-gray-600 dark:text-gray-300"
        }, renderDescription(item.Description, item.RelatedName, handleUserClick)));
      })), totalPages > 1 && h("div", {
        className: "mt-4"
      }, h(Pagination, {
        current: currentPage,
        total: totalPages,
        onChange: handlePageChange
      }))) : h("div", {
        className: "text-center text-gray-500"
      }, "暂无记录"), showUserModal && userModalUsername && h(Modal, {
        visible: showUserModal,
        onClose: () => setState({
          showUserModal: false
        })
      }, h(UserTinygrail, {
        username: userModalUsername,
        stickyTop: "-16px"
      })));
    });
    const loadRedPacketLogPage = page => {
      requestManager.execute(() => getUserSendLog(username, page), result => {
        if (result.success) {
          setState({
            redPacketLogData: result.data
          });
        } else {
          setState({
            redPacketLogData: {
              error: true
            }
          });
        }
      });
    };
    loadRedPacketLogPage(1);
    return container;
  }

  function SendRedPacket({
    username,
    onSuccess
  }) {
    let message = "";
    let amount = "";
    const messageInput = h("input", {
      type: "text",
      className: "tg-bg-content rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 dark:border-gray-600",
      placeholder: "请输入祝福留言",
      onInput: e => {
        message = e.target.value;
      }
    });
    const amountInput = h("input", {
      type: "number",
      className: "tg-bg-content rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 dark:border-gray-600",
      placeholder: "请输入红包金额",
      onInput: e => {
        amount = e.target.value;
      },
      min: "0",
      step: "1000"
    });
    const statusDiv = h("div", null);
    const updateStatus = (msg, type) => {
      if (msg) {
        let className = "rounded-lg text-xs";
        if (type === "success") {
          className += "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
        } else if (type === "error") {
          className += "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
        } else {
          className += "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
        }
        statusDiv.className = className;
        statusDiv.textContent = msg;
        statusDiv.style.display = "block";
      } else {
        statusDiv.style.display = "none";
      }
    };
    const handleSubmit = async () => {
      if (!amount || isNaN(amount) || Number(amount) <= 0) {
        updateStatus("请输入有效的红包金额", "error");
        return;
      }
      updateStatus("发送中...", "");
      const result = await sendRedPacket(username, Number(amount), message);
      updateStatus(result.message, result.success ? "success" : "error");
      if (result.success && onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 500);
      }
    };
    statusDiv.style.display = "none";
    return h("div", {
      id: "tg-send-red-packet",
      className: "flex flex-col gap-4"
    }, h("div", {
      className: "flex flex-col gap-4"
    }, h("div", {
      className: "flex flex-col gap-2"
    }, amountInput), h("div", {
      className: "flex flex-col gap-2"
    }, messageInput), statusDiv), h("div", null, h("div", {
      className: "flex justify-end gap-2"
    }, h(Button, {
      onClick: handleSubmit
    }, "发送"))));
  }

  function scrollToTop(element, selector = ".overflow-auto") {
    const scrollableContainer = element.closest(selector);
    if (scrollableContainer) {
      scrollableContainer.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  }

  const MD5_CDN_URL = "https://mange.cn/js/md5.min.js";
  let md5LoadPromise = null;
  let md5Function = null;
  async function loadMD5() {
    if (md5Function) {
      return md5Function;
    }
    if (md5LoadPromise) {
      return md5LoadPromise;
    }
    md5LoadPromise = (async () => {
      try {
        const response = await fetch(MD5_CDN_URL);
        if (!response.ok) {
          throw new Error(`加载失败: ${response.status}`);
        }
        const scriptContent = await response.text();
        const wrapper = `
        (function() {
          var exports = {};
          var module = { exports: exports };
          ${scriptContent}
          return module.exports || exports.md5 || window.md5 || md5;
        })()
      `;
        const md5 = eval(wrapper);
        if (typeof md5 !== 'function') {
          throw new Error("MD5函数无效");
        }
        md5Function = md5;
        return md5;
      } catch (error) {
        md5LoadPromise = null;
        console.error("MD5加载失败:", error);
        throw error;
      }
    })();
    return md5LoadPromise;
  }

  function dataURLtoBlob(dataURL) {
    const arr = dataURL.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {
      type: mime
    });
  }
  async function md5(string) {
    const md5Fn = await loadMD5();
    return md5Fn(string);
  }
  async function hashDataURL(dataURL) {
    return md5(dataURL);
  }
  function resizeImage(sourceCanvas, targetSize) {
    const canvas = document.createElement("canvas");
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, 0, 0, targetSize, targetSize);
    return canvas.toDataURL("image/jpeg", 0.9);
  }
  async function processImage(dataUrl, targetSize) {
    const img = new Image();
    img.src = dataUrl;
    await new Promise(resolve => {
      img.onload = resolve;
    });
    const sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = img.width;
    sourceCanvas.height = img.height;
    const sourceCtx = sourceCanvas.getContext("2d");
    sourceCtx.drawImage(img, 0, 0);
    const resizedDataUrl = resizeImage(sourceCanvas, targetSize);
    const hash = await hashDataURL(resizedDataUrl);
    const blob = dataURLtoBlob(resizedDataUrl);
    return {
      hash,
      blob,
      dataUrl: resizedDataUrl
    };
  }

  const OSS_BASE_URL = "https://tinygrail.oss-cn-hangzhou.aliyuncs.com";
  function buildOssUrl(path, hash, extension = "jpg") {
    return `${OSS_BASE_URL}/${path}/${hash}.${extension}`;
  }
  async function getOssSignature(path, hash, type) {
    try {
      const data = await post(`chara/oss/sign/${path}/${hash}/${type}`);
      if (!data || data.State !== 0 || !data.Value) {
        return {
          success: false,
          message: data?.Message || "获取OSS签名失败"
        };
      }
      return {
        success: true,
        data: {
          key: data.Value.Key,
          sign: data.Value.Sign,
          date: data.Value.Date
        }
      };
    } catch (error) {
      console.error("获取OSS签名失败:", error);
      return {
        success: false,
        message: "获取OSS签名失败"
      };
    }
  }
  async function uploadToOss(url, blob, signature) {
    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `OSS ${signature.key}:${signature.sign}`,
          "x-oss-date": signature.date
        },
        body: blob
      });
      if (!response.ok) {
        return {
          success: false,
          message: "上传文件失败"
        };
      }
      return {
        success: true
      };
    } catch (error) {
      console.error("上传文件到OSS失败:", error);
      return {
        success: false,
        message: "上传文件到OSS失败"
      };
    }
  }

  function IcoBoxHeader({
    characterData,
    predicted
  }) {
    if (!characterData) {
      return null;
    }
    const {
      CharacterId,
      Name,
      Icon,
      Begin,
      End,
      Total,
      Users,
      Type,
      Bonus
    } = characterData;
    const avatarUrl = normalizeAvatar(Icon);
    const percent = Math.round(Total / predicted.Next * 100);
    const goal = predicted.Level > 0 ? "下一等级还需要" : "成功上市还需要";
    const needUsers = predicted.Users > 0 ? `${predicted.Users}名参与者` : "";
    const needMoney = predicted.Next - Total > 0 ? `投入${formatCurrency(predicted.Next - Total, "₵", 0, false)}` : "";
    const restText = `${goal}${needUsers}${needMoney}`;
    const countdownSpan = h("span", null, "剩余时间：计算中...");
    if (End) {
      const updateCountdown = () => {
        const endDate = new Date(End);
        const now = new Date();
        const diff = endDate - now;
        if (diff <= 0) {
          countdownSpan.textContent = "剩余时间：已结束";
          return;
        }
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(diff % (1000 * 60 * 60 * 24) / (1000 * 60 * 60));
        const minutes = Math.floor(diff % (1000 * 60 * 60) / (1000 * 60));
        const seconds = Math.floor(diff % (1000 * 60) / 1000);
        let timeText = "剩余时间：";
        timeText += `${days}天`;
        timeText += `${hours}小时`;
        timeText += `${minutes}分`;
        timeText += `${seconds}秒`;
        countdownSpan.textContent = timeText;
      };
      updateCountdown();
      setInterval(updateCountdown, 1000);
    }
    return h("div", {
      id: "tg-ico-box-header",
      "data-character-id": CharacterId,
      className: "flex flex-col gap-2 p-2"
    }, h("div", {
      className: "flex gap-4"
    }, h("div", {
      id: "tg-ico-box-header-avatar",
      className: "size-[72px] flex-shrink-0 rounded-lg border border-gray-200 bg-cover bg-top dark:border-gray-600",
      style: {
        backgroundImage: `url(${avatarUrl})`
      }
    }), h("div", {
      id: "tg-ico-box-header-info",
      className: "flex flex-col justify-center gap-px"
    }, h("div", {
      className: "flex items-center gap-2"
    }, h("a", {
      href: `https://bgm.tv/character/${CharacterId}`,
      target: "_blank",
      rel: "noopener noreferrer",
      className: "tg-link flex items-center gap-1 text-base font-semibold"
    }, h("span", null, "#", CharacterId, " -「", Name, "」"), h(SquareArrowOutUpRightIcon, {
      className: "h-4 w-4 flex-shrink-0"
    })), Type === 1 && Bonus > 0 && h("span", {
      className: "inline-block h-4 rounded-md bg-green-500 px-1.5 py-0 text-[10px] font-semibold leading-4 text-white",
      title: `剩余${Bonus}期额外分红`
    }, "×", Bonus)), h("div", {
      className: "flex flex-col gap-px"
    }, h("div", {
      className: "text-xs text-gray-600 dark:text-gray-400"
    }, h("span", {
      className: "font-semibold"
    }, "已筹集 ", formatCurrency(Total, "₵", 0, false))), h("div", {
      className: "text-xs text-gray-600 dark:text-gray-400"
    }, h("span", null, restText))))), predicted.Level > 0 && h("div", {
      id: "tg-ico-box-header-level",
      className: "flex flex-col gap-1 text-xs"
    }, h("div", {
      className: "flex items-center gap-4"
    }, h("div", {
      className: "flex items-center"
    }, h("span", {
      className: "text-gray-600 dark:text-gray-400"
    }, "ICO等级："), h(LevelBadge, {
      level: predicted.Level,
      size: "sm"
    })), h("div", {
      className: "flex items-center"
    }, h("span", {
      className: "text-gray-600 dark:text-gray-400"
    }, "上市等级："), h(LevelBadge, {
      level: Math.floor(Math.log(predicted.Amount / 7500.0) / Math.log(1.3) + 1),
      size: "sm"
    }))), h("div", {
      className: "text-gray-600 dark:text-gray-400"
    }, "预计发行量：约", formatNumber(predicted.Amount, 0), "股 | 发行价：", formatCurrency(predicted.Price))), h("div", {
      id: "tg-ico-box-header-progress",
      className: "flex flex-col gap-1"
    }, h("div", {
      className: "flex items-center justify-between text-xs opacity-60"
    }, countdownSpan, h("span", null, percent, "%")), h(ProgressBar, {
      value: Total,
      max: predicted.Next,
      color: "#64ee10",
      height: "h-1"
    })));
  }

  function IcoBoxUser({
    users,
    predicted,
    loadUsersPage,
    openUserModal,
    sticky = false,
    stickyTop = 0
  }) {
    const stickyClass = sticky ? "sticky" : "";
    const stickyStyle = sticky ? {
      top: `${stickyTop}px`
    } : {};
    const {
      CurrentPage: currentPage = 1,
      ItemsPerPage: itemsPerPage = 24,
      TotalItems: totalItems = 0,
      TotalPages: totalPages = 0,
      Items: items = []
    } = users || {};
    const nextLevelUsers = predicted.Users + totalItems;
    const handlePageChange = page => {
      if (loadUsersPage) {
        loadUsersPage(page);
      }
    };
    const container = h("div", {
      id: "tg-ico-box-user"
    });
    const gridDiv = h("div", {
      id: "tg-ico-box-user-list",
      className: "grid gap-3"
    });
    const paginationDiv = h("div", {
      id: "tg-ico-box-user-pagination",
      className: "mt-4"
    });
    const renderItems = cols => {
      gridDiv.innerHTML = "";
      gridDiv.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      items.forEach((user, index) => {
        const serialNumber = (currentPage - 1) * itemsPerPage + index + 1;
        const displayAmount = user.Amount > 0 ? `+${formatNumber(user.Amount, 0)}` : "+???";
        let badgeStyle = {};
        if (serialNumber === 1) {
          badgeStyle = {
            backgroundColor: "#FFC107",
            color: "#fff"
          };
        } else {
          badgeStyle = {
            backgroundColor: "#d965ff",
            color: "#fff"
          };
        }
        const itemContainer = h("div", {
          className: "flex min-w-0 items-center gap-2",
          "data-user-name": user.Name,
          "data-amount": user.Amount,
          "data-rank": serialNumber
        }, h(Avatar, {
          src: normalizeAvatar(user.Avatar),
          alt: user.Nickname,
          size: "sm",
          rank: user.LastIndex,
          onClick: () => openUserModal && openUserModal(user.Name)
        }), h("div", {
          className: "min-w-0 flex-1"
        }, h("div", {
          className: "flex min-w-0 items-center gap-1"
        }, h("span", {
          className: "flex-shrink-0 text-sm font-semibold text-gray-400 dark:text-gray-500"
        }, serialNumber), h("a", {
          href: `/user/${user.Name}`,
          target: "_blank",
          className: "tg-link flex min-w-0 items-center gap-1 text-sm",
          onClick: e => {
            e.stopPropagation();
          }
        }, h("span", {
          className: "min-w-0 truncate"
        }, unescapeHtml(user.NickName)), h(SquareArrowOutUpRightIcon, {
          className: "h-3 w-3 flex-shrink-0"
        }))), h("div", {
          className: "inline-block rounded px-1.5 py-1 text-[10px] font-bold leading-none",
          style: badgeStyle
        }, displayAmount)));
        gridDiv.appendChild(itemContainer);
      });
    };
    const calculateColumns = width => {
      const minCellWidth = 200;
      const gap = 8;
      let cols = Math.floor((width + gap) / (minCellWidth + gap));
      const divisors = [24, 12, 8, 6, 4, 3, 2, 1];
      for (const divisor of divisors) {
        if (cols >= divisor) {
          return divisor;
        }
      }
      return 1;
    };
    const initialCols = calculateColumns(container.offsetWidth || 800);
    renderItems(initialCols);
    const contentDiv = h("div", {
      className: "px-2"
    });
    contentDiv.appendChild(gridDiv);
    if (totalPages > 1) {
      const pagination = h(Pagination, {
        current: currentPage,
        total: totalPages,
        onChange: handlePageChange
      });
      paginationDiv.appendChild(pagination);
      contentDiv.appendChild(paginationDiv);
    }
    container.appendChild(h("div", null, h("div", {
      id: "tg-ico-box-user-header",
      className: `tg-bg-content z-10 mb-2 flex items-center justify-between border-b border-gray-200 p-2 dark:border-gray-700 ${stickyClass}`,
      style: stickyStyle
    }, h("span", {
      className: "bgm-color text-sm font-semibold"
    }, "参与者 ", totalItems, " / ", h("span", {
      className: "opacity-60"
    }, nextLevelUsers))), items.length > 0 && contentDiv));
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const newCols = calculateColumns(width);
        renderItems(newCols);
      }
    });
    observer.observe(container);
    return container;
  }

  function IcoBoxInvest({
    userIcoInfo,
    userAssets,
    characterData,
    predicted,
    onInvest
  }) {
    const hasInvested = userIcoInfo?.Amount > 0;
    const investedAmount = userIcoInfo?.Amount || 0;
    const balance = userAssets?.balance || 0;
    const nextLevelAmount = predicted.Next - characterData.Total;
    const container = h("div", {
      id: "tg-ico-box-invest",
      "data-character-id": characterData.CharacterId,
      className: "p-2"
    });
    const input = h("input", {
      id: "tg-ico-box-invest-input",
      type: "number",
      className: "w-full rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800",
      placeholder: "请输入注资金额",
      min: "5000",
      value: "5000"
    });
    container.appendChild(h("div", {
      className: "flex flex-col gap-2"
    }, h("div", {
      className: "text-sm text-gray-600 dark:text-gray-400"
    }, hasInvested ? h("span", null, "已注资", formatCurrency(investedAmount, "₵", 2, false), "，追加注资请在下方输入金额") : h("span", null, "追加注资请在下方输入金额")), h("div", {
      className: "flex items-center gap-2"
    }, input, h(Button, {
      variant: "solid",
      size: "sm",
      onClick: () => {
        const amount = parseFloat(input.value);
        if (isNaN(amount) || amount < 5000) {
          alert("请输入有效的金额（参与众筹至少需要5000cc。）");
          return;
        }
        const newTotal = characterData.Total + amount;
        if (amount > 1000000 && newTotal >= predicted.Next && predicted.Users > 0) {
          if (!confirm("当前参与人数不足，继续注资可能会导致高于正常发行价，是否继续？")) {
            return;
          }
        }
        if (confirm("除非ICO启动失败，注资将不能退回，确定参与ICO？")) {
          if (onInvest) {
            onInvest(amount);
          }
        }
      }
    }, "注资")), h("div", {
      className: "flex items-center justify-between text-xs text-gray-500 dark:text-gray-500"
    }, h(Button, {
      variant: "outline",
      size: "sm",
      rounded: "full",
      className: "px-1.5 py-0 text-[10px] leading-tight",
      onClick: () => {
        if (nextLevelAmount > 0) {
          input.value = nextLevelAmount.toString();
        }
      }
    }, "下一级"), h("span", null, "账户余额：", formatCurrency(balance, "₵", 2, false)))));
    return container;
  }

  function calculateICO(ico) {
    let level = 0;
    let price = 10;
    let amount = 0;
    let next = 600000;
    let nextUser = 15;
    const heads = ico.Users;
    let headLevel = Math.floor((heads - 10) / 5);
    if (headLevel < 0) headLevel = 0;
    while (ico.Total >= next && level < headLevel) {
      level += 1;
      next += Math.pow(level + 1, 2) * 100000;
    }
    amount = 10000 + (level - 1) * 7500;
    price = (ico.Total - 500000) / amount;
    nextUser = (level + 1) * 5 + 10;
    return {
      Level: level,
      Next: next,
      Price: price,
      Amount: amount,
      Users: nextUser - ico.Users
    };
  }

  function IcoBox({
    data,
    userAssets,
    icoUsers,
    userIcoInfo,
    loadIcoUsersPage,
    openUserModal,
    onInvest,
    sticky = false,
    stickyTop = 0
  }) {
    if (!data) {
      return h("div", {
        className: "p-4 text-center"
      }, "暂无数据");
    }
    const predicted = calculateICO({
      Total: data.Total,
      Users: data.Users
    });
    return h("div", {
      id: "tg-ico-box",
      "data-character-id": data.CharacterId,
      className: "flex flex-col"
    }, h(IcoBoxHeader, {
      characterData: data,
      predicted: predicted
    }), icoUsers && h(IcoBoxUser, {
      users: icoUsers,
      predicted: predicted,
      loadUsersPage: loadIcoUsersPage,
      openUserModal: openUserModal,
      sticky: sticky,
      stickyTop: stickyTop
    }), h(IcoBoxInvest, {
      userIcoInfo: userIcoInfo,
      userAssets: userAssets,
      characterData: data,
      predicted: predicted,
      onInvest: onInvest
    }));
  }

  function getCharacterName(characterId) {
    let name = document.querySelector(".nameSingle small")?.textContent;
    if (!name) name = document.querySelector(".nameSingle a")?.textContent;
    if (!name) name = document.querySelector("#pageHeader a.avatar")?.getAttribute("title");
    if (!name && characterId) name = `#${characterId}`;
    return name || "";
  }
  function IcoBoxInit({
    characterId,
    userAssets,
    onInit
  }) {
    const balance = userAssets?.balance || 0;
    const name = getCharacterName(characterId);
    const container = h("div", {
      id: "tg-ico-box-init",
      "data-character-id": characterId,
      className: "flex flex-col items-center justify-center gap-4 p-8"
    });
    const input = h("input", {
      id: "tg-ico-box-init-input",
      type: "number",
      className: "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800",
      placeholder: "请输入注资金额",
      min: "10000",
      value: "10000"
    });
    container.appendChild(h("div", {
      className: "flex w-full flex-col items-center gap-4"
    }, h("div", {
      className: "text-center text-lg text-gray-700 dark:text-gray-300"
    }, "\"", name, "\"已做好准备，点击启动按钮，加入\"小圣杯\"的争夺！"), h("div", {
      className: "flex w-full max-w-md flex-col gap-3"
    }, h("div", {
      className: "text-right text-xs text-gray-500 dark:text-gray-500"
    }, "账户余额：", formatCurrency(balance, "₵", 2, false)), input, h(Button, {
      variant: "solid",
      size: "md",
      onClick: () => {
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
      }
    }, "启动ICO"))));
    return container;
  }

  function ChangeBadge({
    change,
    size = "sm",
    className = ""
  }) {
    let bgColor;
    let text;
    if (change > 0) {
      bgColor = "#ff658d";
      text = `+${(change * 100).toFixed(2)}%`;
    } else if (change < 0) {
      bgColor = "#65bcff";
      text = `${(change * 100).toFixed(2)}%`;
    } else {
      bgColor = "#9e9e9e";
      text = "0.00%";
    }
    const sizeClasses = {
      sm: "h-4 text-[10px] leading-4 px-1.5",
      md: "h-5 text-xs leading-5 px-2",
      lg: "h-6 text-sm leading-6 px-2.5"
    };
    const sizeClass = sizeClasses[size] || sizeClasses.sm;
    return h("div", {
      className: `inline-flex items-center ${className}`,
      title: "涨跌"
    }, h("span", {
      className: `inline-block rounded-md py-0 font-semibold text-white ${sizeClass}`,
      style: {
        backgroundColor: bgColor
      }
    }, text));
  }

  function CrownBadge({
    count,
    size = "sm",
    className = ""
  }) {
    const bgColor = "#FFD700";
    const sizeClasses = {
      sm: "h-4 text-[10px] leading-4 px-1.5",
      md: "h-5 text-xs leading-5 px-2",
      lg: "h-6 text-sm leading-6 px-2.5"
    };
    const sizeClass = sizeClasses[size] || sizeClasses.sm;
    return h("div", {
      className: `inline-flex items-center ${className}`,
      title: "萌王次数"
    }, h("span", {
      className: `inline-block rounded-md py-0 font-semibold text-white ${sizeClass}`,
      style: {
        backgroundColor: bgColor
      }
    }, "×", count));
  }

  function StarRankBadge({
    rank,
    starForces = 0,
    size = "sm",
    className = ""
  }) {
    const bgColor = rank < 500 ? "#673ab7" : "#757575";
    const sizeClasses = {
      sm: "h-4 text-[10px] leading-4 px-1.5",
      md: "h-5 text-xs leading-5 px-2",
      lg: "h-6 text-sm leading-6 px-2.5"
    };
    const iconSizes = {
      sm: "h-2.5 w-2.5",
      md: "h-3 w-3",
      lg: "h-3.5 w-3.5"
    };
    const sizeClass = sizeClasses[size] || sizeClasses.sm;
    const iconSize = iconSizes[size] || iconSizes.sm;
    return h("div", {
      className: `inline-flex items-center ${className}`
    }, h("span", {
      className: `inline-flex items-center rounded-md py-0 font-semibold text-white ${sizeClass}`,
      style: {
        backgroundColor: bgColor
      }
    }, h("span", {
      title: "通天塔排名"
    }, "#", rank), h("span", {
      className: "mx-1.5 h-3 border-l border-white/30"
    }), h("span", {
      className: "inline-flex items-center gap-0.5",
      title: "星之力"
    }, h(SparklesIcon, {
      className: iconSize
    }), formatNumber(starForces, 0))));
  }

  function StarLevelIcons({
    level = 0,
    size = 16
  }) {
    const icons = [];
    if (level === 0) {
      const icon = h(StarIcon, {
        className: "icon",
        filled: false
      });
      icon.style.width = `${size}px`;
      icon.style.height = `${size}px`;
      icons.push(icon);
    } else {
      const crownCount = Math.floor(level / 125);
      const sunCount = Math.floor(level % 125 / 25);
      const moonCount = Math.floor(level % 25 / 5);
      const starCount = level % 5;
      for (let i = 0; i < crownCount; i++) {
        const icon = h(CrownIcon, {
          className: "icon"
        });
        icon.style.width = `${size}px`;
        icon.style.height = `${size}px`;
        icons.push(icon);
      }
      for (let i = 0; i < sunCount; i++) {
        const icon = h(SunIcon, {
          className: "icon"
        });
        icon.style.width = `${size}px`;
        icon.style.height = `${size}px`;
        icons.push(icon);
      }
      for (let i = 0; i < moonCount; i++) {
        const icon = h(MoonIcon, {
          className: "icon"
        });
        icon.style.width = `${size}px`;
        icon.style.height = `${size}px`;
        icons.push(icon);
      }
      for (let i = 0; i < starCount; i++) {
        const icon = h(StarIcon, {
          className: "icon",
          filled: true
        });
        icon.style.width = `${size}px`;
        icon.style.height = `${size}px`;
        icons.push(icon);
      }
    }
    return h("div", {
      id: "tg-star-level-icons",
      "data-level": level,
      className: "inline-flex items-center gap-0.5 text-yellow-400"
    }, icons);
  }

  function Tooltip({
    children,
    content,
    trigger = "hover",
    placement = "top"
  }) {
    const container = h("div", {
      id: "tg-tooltip",
      className: "relative inline-block"
    });
    createMountedComponent(container, (state, setStateParam) => {
      const {
        visible
      } = state || {};
      const placementClasses = {
        top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
        bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
        left: "right-full top-1/2 -translate-y-1/2 mr-2",
        right: "left-full top-1/2 -translate-y-1/2 ml-2"
      };
      const handleMouseEnter = () => {
        if (trigger === "hover") {
          setStateParam({
            visible: true
          });
        }
      };
      const handleMouseLeave = () => {
        if (trigger === "hover") {
          setStateParam({
            visible: false
          });
        }
      };
      const handleClick = e => {
        if (trigger === "click") {
          e.stopPropagation();
          setStateParam({
            visible: !visible
          });
        }
      };
      return h(Fragment, null, h("div", {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onClick: handleClick
      }, children), visible && h("div", {
        id: "tg-tooltip-content",
        ref: el => el,
        className: `absolute z-50 whitespace-nowrap rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 shadow-lg dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 ${placementClasses[placement]}`
      }, content));
    }, true);
    return container;
  }

  function TradeBoxHeader(props) {
    const {
      characterData,
      userCharacter,
      tinygrailCharacter,
      pool,
      canChangeAvatar,
      onSacrificeClick,
      onAuctionClick,
      onAuctionHistoryClick,
      onChangeAvatarClick,
      onTradeHistoryClick
    } = props || {};
    if (!characterData) {
      return null;
    }
    const {
      CharacterId,
      Name,
      Icon,
      Current,
      Total,
      ListedDate,
      Fluctuation,
      Level,
      Crown,
      Rank,
      StarForces,
      Stars,
      Rate,
      ZeroCount
    } = characterData;
    const avatarUrl = normalizeAvatar(Icon);
    const dividend = Rank <= 500 ? Rate * 0.005 * (601 - Rank) : Stars * 2;
    const dividendFormula = Rank <= 500 ? `${formatCurrency(Rate)} × ${formatNumber(0.005 * (601 - Rank))}` : `₵${Stars} × 2`;
    return h("div", {
      id: "tg-trade-box-header",
      className: "flex flex-col gap-2 p-2"
    }, h("div", {
      id: "tg-trade-box-header-info",
      className: "flex gap-4"
    }, h("div", {
      id: "tg-trade-box-header-avatar",
      className: "size-[72px] flex-shrink-0 rounded-lg border border-gray-200 bg-cover bg-top dark:border-gray-600",
      style: {
        backgroundImage: `url(${avatarUrl})`
      }
    }), h("div", {
      className: "flex flex-col justify-center gap-px"
    }, h("div", null, h("a", {
      href: `https://bgm.tv/character/${CharacterId}`,
      target: "_blank",
      rel: "noopener noreferrer",
      className: "tg-link flex items-center gap-1 text-base font-semibold"
    }, h("span", null, "#", CharacterId, " -「", Name, "」"), h(SquareArrowOutUpRightIcon, {
      className: "h-4 w-4 flex-shrink-0"
    }))), h("div", {
      className: "flex flex-col gap-px"
    }, h("div", {
      className: "text-xs text-gray-600 dark:text-gray-400"
    }, h("span", null, "现价：", formatCurrency(Current)), h("span", {
      class: "mx-2"
    }, "•"), h("span", null, "流通：", formatNumber(Total, 0))), h("div", {
      className: "text-xs text-gray-600 dark:text-gray-400"
    }, h("span", null, "奖池：", pool !== undefined ? formatNumber(pool, 0) : "..."), h("span", {
      class: "mx-2"
    }, "•"), h("span", {
      className: "inline-flex items-center gap-1"
    }, "股息：", formatCurrency(dividend), h(Tooltip, {
      content: dividendFormula,
      trigger: "click"
    }, h(QuestionIcon, {
      className: "h-3 w-3 cursor-pointer opacity-60 hover:opacity-100"
    })))), h("div", {
      className: "text-xs text-gray-600 dark:text-gray-400"
    }, h("span", {
      title: "上市时间"
    }, formatDateTime(ListedDate, "YYYY-MM-DD HH:mm")))))), h("div", {
      id: "tg-trade-box-header-badges",
      className: "flex flex-wrap items-center gap-2"
    }, h("div", {
      className: "flex flex-wrap gap-2"
    }, Fluctuation !== undefined && h(ChangeBadge, {
      change: Fluctuation,
      size: "md"
    }), Level !== undefined && h(LevelBadge, {
      level: Level,
      zeroCount: ZeroCount,
      size: "md"
    }), Crown !== undefined && Crown > 0 && h(CrownBadge, {
      count: Crown,
      size: "md"
    }), Rank !== undefined && h(StarRankBadge, {
      rank: Rank,
      starForces: StarForces,
      size: "md"
    })), Stars !== undefined && h(StarLevelIcons, {
      level: Stars,
      size: 20
    })), h("div", {
      id: "tg-trade-box-header-user",
      className: "text-xs opacity-60"
    }, h("span", null, "持股：", userCharacter ? formatNumber(userCharacter.Amount, 0) : "...", "股"), h("span", {
      class: "mx-2"
    }, "•"), h("span", null, "固定资产：", userCharacter ? formatNumber(userCharacter.Sacrifices, 0) : "...")), h("div", {
      id: "tg-trade-box-header-actions",
      className: "flex flex-wrap gap-2"
    }, h(Button, {
      onClick: onSacrificeClick
    }, "资产重组"), h(Button, {
      onClick: onAuctionClick
    }, tinygrailCharacter?.Amount > 0 ? "参与竞拍" : "萌王投票"), h(Button, {
      onClick: onAuctionHistoryClick
    }, "往期拍卖"), h(Button, {
      onClick: onTradeHistoryClick
    }, "交易记录"), canChangeAvatar && h(Button, {
      onClick: onChangeAvatarClick
    }, "更换头像"), isGameMaster() && h(Button, null, "交易记录(gm)")));
  }

  function TradeBoxSection({
    characterData,
    userAssets,
    userCharacter,
    depth,
    sticky = false,
    stickyTop = 0,
    onRefresh,
    setLoading
  }) {
    const stickyClass = sticky ? "sticky" : "";
    const stickyStyle = sticky ? {
      top: `${stickyTop}px`
    } : {};
    const {
      LastOrder: lastOrder = "",
      LastDeal: lastDeal = ""
    } = characterData || {};
    const getMaxAmount = () => {
      if (!depth) return 0;
      const maxAsk = Math.max(...(depth.Asks?.map(item => item.Amount) || [0]));
      const maxBid = Math.max(...(depth.Bids?.map(item => item.Amount) || [0]));
      return Math.max(maxAsk, maxBid);
    };
    const maxAmount = getMaxAmount();
    const updateBidTotal = e => {
      const container = e.target.parentElement;
      const priceInput = container.querySelector("#bid-price-input");
      const amountInput = container.querySelector("#bid-amount-input");
      const totalSpan = container.querySelector("#bid-total");
      const price = parseFloat(priceInput.value) || 0;
      const amount = parseFloat(amountInput.value) || 0;
      totalSpan.textContent = `总计：${formatCurrency(price * amount, "₵", 2, false)}`;
    };
    const updateAskTotal = e => {
      const container = e.target.parentElement;
      const priceInput = container.querySelector("#ask-price-input");
      const amountInput = container.querySelector("#ask-amount-input");
      const totalSpan = container.querySelector("#ask-total");
      const price = parseFloat(priceInput.value) || 0;
      const amount = parseFloat(amountInput.value) || 0;
      totalSpan.textContent = `总计：${formatCurrency(price * amount, "₵", 2, false)}`;
    };
    const handleAskDepthClick = (e, price, amount) => {
      const container = e.currentTarget.closest("#trade-section");
      if (!container) return;
      const priceInput = container.querySelector("#bid-price-input");
      const amountInput = container.querySelector("#bid-amount-input");
      const totalSpan = container.querySelector("#bid-total");
      if (priceInput && amountInput && totalSpan) {
        priceInput.value = price;
        amountInput.value = amount;
        totalSpan.textContent = `总计：${formatCurrency(price * amount, "₵", 2, false)}`;
      }
    };
    const handleBidDepthClick = (e, price, amount) => {
      const container = e.currentTarget.closest("#trade-section");
      if (!container) return;
      const priceInput = container.querySelector("#ask-price-input");
      const amountInput = container.querySelector("#ask-amount-input");
      const totalSpan = container.querySelector("#ask-total");
      if (priceInput && amountInput && totalSpan) {
        priceInput.value = price;
        amountInput.value = amount;
        totalSpan.textContent = `总计：${formatCurrency(price * amount, "₵", 2, false)}`;
      }
    };
    const handleBid = async (e, isIceberg = false) => {
      const container = e.currentTarget.closest("#trade-section");
      if (!container) return;
      const priceInput = container.querySelector("#bid-price-input");
      const amountInput = container.querySelector("#bid-amount-input");
      const price = parseFloat(priceInput.value);
      const amount = parseFloat(amountInput.value);
      if (!price || !amount || price <= 0 || amount <= 0) {
        alert("请输入有效的价格和数量");
        return;
      }
      if (setLoading) setLoading(true);
      const result = await bidCharacter(characterData.Id, price, amount, isIceberg);
      if (setLoading) setLoading(false);
      if (result.success) {
        alert(result.data);
        priceInput.value = "";
        amountInput.value = "";
        const totalSpan = container.querySelector("#bid-total");
        if (totalSpan) totalSpan.textContent = "总计：₵0.00";
        if (onRefresh) onRefresh();
      } else {
        alert(result.message);
        setTimeout(() => {
          const newContainer = document.querySelector("#trade-section");
          if (newContainer) {
            const newPriceInput = newContainer.querySelector("#bid-price-input");
            const newAmountInput = newContainer.querySelector("#bid-amount-input");
            const newTotalSpan = newContainer.querySelector("#bid-total");
            if (newPriceInput) newPriceInput.value = price;
            if (newAmountInput) newAmountInput.value = amount;
            if (newTotalSpan) newTotalSpan.textContent = `总计：${formatCurrency(price * amount, "₵", 2, false)}`;
          }
        }, 0);
      }
    };
    const handleAsk = async (e, isIceberg = false) => {
      const container = e.currentTarget.closest("#trade-section");
      if (!container) return;
      const priceInput = container.querySelector("#ask-price-input");
      const amountInput = container.querySelector("#ask-amount-input");
      const price = parseFloat(priceInput.value);
      const amount = parseFloat(amountInput.value);
      if (!price || !amount || price <= 0 || amount <= 0) {
        alert("请输入有效的价格和数量");
        return;
      }
      if (setLoading) setLoading(true);
      const result = await askCharacter(characterData.Id, price, amount, isIceberg);
      if (setLoading) setLoading(false);
      if (result.success) {
        alert(result.data);
        priceInput.value = "";
        amountInput.value = "";
        const totalSpan = container.querySelector("#ask-total");
        if (totalSpan) totalSpan.textContent = "总计：₵0.00";
        if (onRefresh) onRefresh();
      } else {
        alert(result.message);
        setTimeout(() => {
          const newContainer = document.querySelector("#trade-section");
          if (newContainer) {
            const newPriceInput = newContainer.querySelector("#ask-price-input");
            const newAmountInput = newContainer.querySelector("#ask-amount-input");
            const newTotalSpan = newContainer.querySelector("#ask-total");
            if (newPriceInput) newPriceInput.value = price;
            if (newAmountInput) newAmountInput.value = amount;
            if (newTotalSpan) newTotalSpan.textContent = `总计：${formatCurrency(price * amount, "₵", 2, false)}`;
          }
        }, 0);
      }
    };
    const handleCancelBid = async bidId => {
      if (!confirm("确定要取消这个买入委托吗？")) return;
      if (setLoading) setLoading(true);
      const result = await cancelBid(bidId);
      if (setLoading) setLoading(false);
      if (result.success) {
        alert(result.data);
        if (onRefresh) onRefresh();
      } else {
        alert(result.message);
      }
    };
    const handleCancelAsk = async askId => {
      if (!confirm("确定要取消这个卖出委托吗？")) return;
      if (setLoading) setLoading(true);
      const result = await cancelAsk(askId);
      if (setLoading) setLoading(false);
      if (result.success) {
        alert(result.data);
        if (onRefresh) onRefresh();
      } else {
        alert(result.message);
      }
    };
    return h("div", {
      id: "tg-trade-box-section",
      "data-character-id": characterData?.Id
    }, h("div", {
      id: "tg-trade-box-section-header",
      className: `tg-bg-content z-10 mb-2 flex items-center justify-between border-b border-gray-200 p-2 dark:border-gray-700 ${stickyClass}`,
      style: stickyStyle
    }, h("span", {
      className: "bgm-color text-sm font-semibold"
    }, "交易"), h("span", {
      className: "text-xs opacity-60 mr-2"
    }, "余额：", userAssets ? formatCurrency(userAssets.balance) : "...")), h("div", {
      id: "trade-section",
      className: "flex flex-wrap gap-1"
    }, h("div", {
      id: "tg-trade-bid-section",
      className: "relative mb-2 min-w-[200px] flex-1"
    }, h("div", {
      id: "tg-trade-bid-header",
      className: "mb-1 flex items-center justify-between p-2 pt-0 text-xs opacity-60",
      style: {
        borderBottom: "1px solid rgba(0, 0, 0, 0.1)"
      }
    }, h("span", null, "价格 / 数量 / 总计"), h("span", null, "买入委托")), h("div", {
      id: "tg-trade-bid-list",
      className: "space-y-0.5 px-2 pb-28"
    }, h("div", {
      id: "tg-trade-bid-history",
      className: "space-y-0.5 opacity-60"
    }, userCharacter?.BidHistory && userCharacter.BidHistory.length > 0 && [...userCharacter.BidHistory].reverse().map((bid, index) => {
      const total = bid.Price * bid.Amount;
      return h("div", {
        className: "flex items-center justify-between gap-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700",
        title: formatDateTime(bid.TradeTime),
        "data-bid-id": bid.Id
      }, h("span", {
        className: "flex-shrink truncate"
      }, formatCurrency(bid.Price, "₵", 2, false), " / ", formatNumber(bid.Amount, 0), " /", " ", formatCurrency(-total)), h("span", {
        className: "flex-shrink-0"
      }, "[成交]"));
    })), h("div", {
      id: "tg-trade-bid-current",
      className: "space-y-0.5"
    }, userCharacter?.Bids && userCharacter.Bids.length > 0 && userCharacter.Bids.map((bid, index) => {
      const total = bid.Price * bid.Amount;
      const isIceberg = bid.Type === 1;
      return h("div", {
        className: "flex items-center justify-between gap-1 bg-[#ffdeec] text-xs text-[#e46fa1]",
        title: formatDateTime(bid.Begin),
        "data-bid-id": bid.Id
      }, h("span", {
        className: "flex-shrink truncate"
      }, formatCurrency(bid.Price, "₵", 2, false), " / ", formatNumber(bid.Amount, 0), " /", " ", formatCurrency(-total), isIceberg && " [i]"), h("span", {
        className: "tg-link flex-shrink-0 cursor-pointer",
        onClick: () => handleCancelBid(bid.Id)
      }, "[取消]"));
    }))), h("div", {
      id: "tg-trade-bid-input",
      className: "absolute bottom-0 mt-2 flex w-full px-2"
    }, h("div", {
      className: "w-full space-y-1"
    }, h("input", {
      id: "bid-price-input",
      type: "number",
      placeholder: "单价",
      className: "w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none dark:border-gray-600",
      onInput: updateBidTotal
    }), h("input", {
      id: "bid-amount-input",
      type: "number",
      placeholder: "数量",
      className: "w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none dark:border-gray-600",
      onInput: updateBidTotal
    }), h("div", {
      id: "bid-total",
      className: "text-xs opacity-60"
    }, "总计：₵0.00"), h("div", {
      className: "flex gap-1"
    }, h("button", {
      className: "flex-1 rounded bg-[#ff658d] px-2 py-1 text-xs text-white hover:bg-[#ff4d7a]",
      onClick: e => handleBid(e, false)
    }, "买入"), h("button", {
      className: "flex-1 rounded bg-gray-500 px-2 py-1 text-xs text-white hover:bg-gray-600",
      onClick: e => handleBid(e, true)
    }, "冰山"))))), h("div", {
      id: "tg-trade-ask-section",
      className: "relative mb-2 min-w-[200px] flex-1"
    }, h("div", {
      id: "tg-trade-ask-header",
      className: "mb-1 flex items-center justify-between p-2 pt-0 text-xs opacity-60",
      style: {
        borderBottom: "1px solid rgba(0, 0, 0, 0.1)"
      }
    }, h("span", null, "价格 / 数量 / 总计"), h("span", null, "卖出委托")), h("div", {
      id: "tg-trade-ask-list",
      className: "space-y-0.5 px-2 pb-28"
    }, h("div", {
      id: "tg-trade-ask-history",
      className: "space-y-0.5 opacity-60"
    }, userCharacter?.AskHistory && userCharacter.AskHistory.length > 0 && [...userCharacter.AskHistory].reverse().map((ask, index) => {
      const total = ask.Price * ask.Amount;
      return h("div", {
        className: "flex items-center justify-between gap-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700",
        title: formatDateTime(ask.TradeTime),
        "data-ask-id": ask.Id
      }, h("span", {
        className: "flex-shrink truncate"
      }, formatCurrency(ask.Price, "₵", 2, false), " / ", formatNumber(ask.Amount, 0), " / +", formatCurrency(total)), h("span", {
        className: "flex-shrink-0"
      }, "[成交]"));
    })), h("div", {
      id: "tg-trade-ask-current",
      className: "space-y-0.5"
    }, userCharacter?.Asks && userCharacter.Asks.length > 0 && userCharacter.Asks.map((ask, index) => {
      const total = ask.Price * ask.Amount;
      const isIceberg = ask.Type === 1;
      return h("div", {
        className: "flex items-center justify-between gap-1 bg-[#ceefff] text-xs text-[#22a3de]",
        title: formatDateTime(ask.Begin),
        "data-ask-id": ask.Id
      }, h("span", {
        className: "flex-shrink truncate"
      }, formatCurrency(ask.Price, "₵", 2, false), " / ", formatNumber(ask.Amount, 0), " / +", formatCurrency(total), isIceberg && " [i]"), h("span", {
        className: "tg-link flex-shrink-0 cursor-pointer",
        onClick: () => handleCancelAsk(ask.Id)
      }, "[取消]"));
    }))), h("div", {
      id: "tg-trade-ask-input",
      className: "absolute bottom-0 mt-2 flex w-full px-2"
    }, h("div", {
      className: "w-full space-y-1"
    }, h("input", {
      id: "ask-price-input",
      type: "number",
      placeholder: "单价",
      className: "w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none dark:border-gray-600",
      onInput: updateAskTotal
    }), h("input", {
      id: "ask-amount-input",
      type: "number",
      placeholder: "数量",
      className: "w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none dark:border-gray-600",
      onInput: updateAskTotal
    }), h("div", {
      id: "ask-total",
      className: "text-xs opacity-60"
    }, "总计：₵0.00"), h("div", {
      className: "flex gap-1"
    }, h("button", {
      className: "flex-1 rounded bg-[#3b9edb] px-2 py-1 text-xs text-white hover:bg-[#2a8bc7]",
      onClick: e => handleAsk(e, false)
    }, "卖出"), h("button", {
      className: "flex-1 rounded bg-gray-500 px-2 py-1 text-xs text-white hover:bg-gray-600",
      onClick: e => handleAsk(e, true)
    }, "冰山"))))), h("div", {
      id: "tg-trade-depth-section",
      className: "mb-2 min-w-[200px] flex-1"
    }, h("div", {
      id: "tg-trade-depth-header",
      className: "mb-1 flex items-center justify-between border-b border-gray-200 p-2 pt-0 text-xs opacity-60 dark:border-gray-700"
    }, h("span", null, h("span", {
      title: lastOrder ? `最新成交 ${formatDateTime(lastOrder)}` : ""
    }, formatTimeAgo(lastOrder)), " / ", h("span", {
      title: lastDeal ? `最新挂单 ${formatDateTime(lastDeal)}` : ""
    }, formatTimeAgo(lastDeal))), h("span", null, "深度信息")), h("div", {
      id: "tg-trade-depth-list",
      className: "px-2"
    }, depth?.Asks && depth.Asks.length > 0 && [...depth.Asks].reverse().filter(ask => ask.Amount > 0).map((ask, index) => {
      const percentage = maxAmount > 0 ? Math.ceil(ask.Amount / maxAmount * 100) : 0;
      const isIceberg = ask.Type === 1;
      const price = isIceberg ? "₵--" : formatCurrency(ask.Price, "₵", 2, false);
      return h("div", {
        className: "relative mb-px cursor-pointer overflow-hidden bg-[#ceefff] text-xs font-bold leading-5 text-[#22a3de] hover:bg-[#a7e3ff] hover:text-white dark:bg-[#2d2e2f] dark:hover:bg-[#a7e3ff]",
        title: isIceberg ? "冰山委托" : "",
        onClick: e => !isIceberg && handleAskDepthClick(e, ask.Price, ask.Amount),
        "data-depth-type": "ask",
        "data-price": ask.Price,
        "data-amount": ask.Amount
      }, h("div", {
        className: "absolute inset-y-0 right-0 bg-[#b8e7ff]",
        style: {
          width: `${percentage}%`
        }
      }), h("span", {
        className: "relative block px-1 text-right"
      }, price, " / ", formatNumber(ask.Amount, 0)));
    }), depth?.Bids && depth.Bids.length > 0 && depth.Bids.filter(bid => bid.Amount > 0).map((bid, index) => {
      const percentage = maxAmount > 0 ? Math.ceil(bid.Amount / maxAmount * 100) : 0;
      const isIceberg = bid.Type === 1;
      const price = isIceberg ? "₵--" : formatCurrency(bid.Price, "₵", 2, false);
      return h("div", {
        className: "relative mb-px cursor-pointer overflow-hidden bg-[#ffdeec] text-xs font-bold leading-5 text-[#e46fa1] hover:bg-[#ffc5dd] hover:text-white dark:bg-[#2d2e2f] dark:hover:bg-[#ffc5dd]",
        title: isIceberg ? "冰山委托" : "",
        onClick: e => !isIceberg && handleBidDepthClick(e, bid.Price, bid.Amount),
        "data-depth-type": "bid",
        "data-price": bid.Price,
        "data-amount": bid.Amount
      }, h("div", {
        className: "absolute inset-y-0 right-0 bg-[#ffcfe3]",
        style: {
          width: `${percentage}%`
        }
      }), h("span", {
        className: "relative block px-1 text-right"
      }, price, " / ", formatNumber(bid.Amount, 0)));
    })))));
  }

  function TradeBoxLink({
    characterData,
    links = [],
    openUserModal,
    openCharacterModal,
    openTempleModal,
    sticky = false,
    stickyTop = 0
  }) {
    const stickyClass = sticky ? "sticky" : "";
    const stickyStyle = sticky ? {
      top: `${stickyTop}px`
    } : {};
    const groupedLinks = {};
    links.forEach(link => {
      if (!groupedLinks[link.LinkId]) {
        groupedLinks[link.LinkId] = [];
      }
      groupedLinks[link.LinkId].push(link);
    });
    const sortedGroups = Object.entries(groupedLinks).map(([linkId, items]) => {
      return {
        linkId,
        items,
        count: items.length,
        linkInfo: items[0].Link
      };
    }).sort((a, b) => b.count - a.count);
    return h("div", {
      id: "tg-trade-box-link"
    }, h("div", {
      id: "tg-trade-box-link-header",
      className: `tg-bg-content z-10 mb-2 flex items-center justify-between border-b border-gray-200 p-2 dark:border-gray-700 ${stickyClass}`,
      style: stickyStyle
    }, h("span", {
      className: "bgm-color text-sm font-semibold"
    }, "LINK ", links.length)), h("div", {
      id: "tg-trade-box-link-content",
      className: "space-y-4 p-2"
    }, sortedGroups.map((group, index) => h("div", {
      id: "tg-trade-box-link-group",
      "data-link-id": group.linkId,
      className: "space-y-2"
    }, h("div", {
      className: "text-sm font-semibold"
    }, "第", index + 1, "位", h("span", {
      className: "tg-link cursor-pointer",
      onClick: () => openCharacterModal(group.linkInfo.CharacterId)
    }, "「", group.linkInfo.Name, "」")), h("div", {
      className: "grid w-full grid-cols-[repeat(auto-fill,minmax(188px,1fr))] justify-items-center gap-2"
    }, group.items.map((item, itemIndex) => {
      const sacrifices = Math.min(item.Assets, item.Link.Assets);
      return h("div", {
        className: "flex flex-col"
      }, h(TempleLink, {
        temple1: item,
        temple2: item.Link,
        size: "mini",
        showCharaName: false,
        onCoverClick: temple => {
          if (openTempleModal) {
            openTempleModal(temple);
          }
        }
      }), h("div", {
        className: "tg-link cursor-pointer text-left text-xs opacity-80",
        onClick: () => openUserModal(item.Name)
      }, "@", unescapeHtml(item.Nickname), " +", formatNumber(sacrifices, 0)));
    }))))));
  }

  function getTempleLevelBonus(level) {
    const bonusMap = {
      1: "+0.10",
      2: "+0.30",
      3: "+0.60"
    };
    return bonusMap[level] || "+0.10";
  }
  function TradeBoxTemple({
    characterData,
    userAssets,
    temples = [],
    openUserModal,
    openTempleModal,
    hideDuplicates = true,
    onToggleDuplicates,
    sticky = false,
    stickyTop = 0
  }) {
    const stickyClass = sticky ? "sticky" : "";
    const stickyStyle = sticky ? {
      top: `${stickyTop}px`
    } : {};
    const userTempleName = userAssets?.name;
    const userTempleIndex = temples.findIndex(temple => temple.Name === userTempleName);
    let sortedTemples = [...temples];
    if (userTempleIndex > -1) {
      const userTemple = sortedTemples.splice(userTempleIndex, 1)[0];
      sortedTemples.unshift(userTemple);
    }
    let displayTemples = sortedTemples;
    const templeCounts = {};
    if (hideDuplicates) {
      sortedTemples.forEach(temple => {
        const key = temple.Cover || "empty";
        templeCounts[key] = (templeCounts[key] || 0) + 1;
      });
      const seenCovers = new Set();
      let hasSeenEmptyCover = false;
      displayTemples = sortedTemples.filter((temple, index) => {
        if (index === 0 && userTempleIndex > -1) {
          if (temple.Cover) {
            seenCovers.add(temple.Cover);
          } else {
            hasSeenEmptyCover = true;
          }
          return true;
        }
        if (!temple.Cover) {
          if (hasSeenEmptyCover) {
            return false;
          }
          hasSeenEmptyCover = true;
          return true;
        }
        if (!seenCovers.has(temple.Cover)) {
          seenCovers.add(temple.Cover);
          return true;
        }
        return false;
      });
    }
    return h("div", {
      id: "tg-trade-box-temple",
      "data-character-id": characterData?.Id
    }, h("div", {
      id: "tg-trade-box-temple-header",
      className: `tg-bg-content z-10 mb-2 flex items-center justify-between border-b border-gray-200 p-2 dark:border-gray-700 ${stickyClass}`,
      style: stickyStyle
    }, h("span", {
      className: "bgm-color text-sm font-semibold"
    }, "固定资产 ", temples.length), h("span", {
      className: "tg-link mr-2 cursor-pointer text-sm",
      onClick: () => onToggleDuplicates && onToggleDuplicates()
    }, hideDuplicates ? "[显示重复]" : "[隐藏重复]")), h("div", {
      id: "tg-trade-box-temple-list",
      className: "grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] justify-items-center gap-2 p-2"
    }, displayTemples.map((temple, index) => {
      const coverKey = temple.Cover || "empty";
      const count = hideDuplicates ? templeCounts[coverKey] : 1;
      return h("div", {
        className: "flex w-full flex-col gap-1",
        "data-character-id": temple.CharacterId,
        "data-user-name": temple.Name
      }, h(Temple, {
        temple: temple,
        bottomText: getTempleLevelBonus(temple.Level),
        onClick: templeData => {
          if (openTempleModal) {
            openTempleModal(templeData);
          }
        }
      }), h("div", {
        className: "tg-link w-full cursor-pointer truncate text-left text-xs opacity-80",
        onClick: () => openUserModal(temple.Name)
      }, "@", unescapeHtml(temple.Nickname), " ", hideDuplicates && count > 1 ? `×${count}` : ""));
    })));
  }

  function TradeBoxUser({
    characterData,
    users,
    loadUsersPage,
    openUserModal,
    sticky = false,
    stickyTop = 0
  }) {
    const stickyClass = sticky ? "sticky" : "";
    const stickyStyle = sticky ? {
      top: `${stickyTop}px`
    } : {};
    const {
      CurrentPage: currentPage = 1,
      ItemsPerPage: itemsPerPage = 24,
      TotalItems: totalItems = 0,
      TotalPages: totalPages = 0,
      Items: items = []
    } = users || {};
    const handlePageChange = page => {
      if (loadUsersPage) {
        loadUsersPage(page);
      }
    };
    const container = h("div", {
      id: "tg-trade-box-user",
      "data-character-id": characterData?.Id
    });
    const gridDiv = h("div", {
      id: "tg-trade-box-user-list",
      className: "grid gap-3"
    });
    const paginationDiv = h("div", {
      id: "tg-trade-box-user-pagination",
      className: "mt-4"
    });
    const renderItems = cols => {
      gridDiv.innerHTML = "";
      gridDiv.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      items.forEach((user, index) => {
        const serialNumber = (currentPage - 1) * itemsPerPage + index + 1;
        const displayNumber = serialNumber === 1 ? "主席" : serialNumber;
        const displayBalance = user.Balance > 0 ? formatNumber(user.Balance, 0) : "--";
        const displayPercentage = user.Balance > 0 && characterData.Total > 0 ? `(${(user.Balance / characterData.Total * 100).toFixed(2)}%)` : "(??%)";
        const timeDiff = getTimeDiff(user.LastActiveDate);
        const isInactive = timeDiff >= 1000 * 60 * 60 * 24 * 5;
        const daysSinceActive = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const activeTooltip = daysSinceActive < 1 ? "最近活跃" : `${daysSinceActive}天前活跃`;
        let badgeStyle = {};
        if (isInactive) {
          badgeStyle = {
            backgroundColor: "#d2d2d2",
            color: "#fff"
          };
        } else if (serialNumber === 1) {
          badgeStyle = {
            backgroundColor: "#FFC107",
            color: "#fff"
          };
        } else if (serialNumber >= 2 && serialNumber <= 9) {
          badgeStyle = {
            backgroundColor: "#d965ff",
            color: "#fff"
          };
        } else {
          badgeStyle = {
            backgroundColor: "#45d216",
            color: "#fff"
          };
        }
        const itemContainer = h("div", {
          id: "tg-trade-box-user-item",
          className: "flex min-w-0 items-center gap-2",
          "data-user-name": user.Name,
          "data-balance": user.Balance,
          "data-rank": serialNumber
        }, h(Avatar, {
          src: normalizeAvatar(user.Avatar),
          alt: user.Nickname,
          size: "sm",
          rank: user.LastIndex,
          onClick: () => openUserModal && openUserModal(user.Name)
        }), h("div", {
          className: "min-w-0 flex-1"
        }, h("div", {
          className: "flex min-w-0 items-center gap-1"
        }, h("span", {
          className: "flex-shrink-0 text-sm font-semibold text-gray-400 dark:text-gray-500"
        }, displayNumber), h("a", {
          href: `/user/${user.Name}`,
          target: "_blank",
          className: "tg-link flex min-w-0 items-center gap-1 text-sm",
          onClick: e => {
            e.stopPropagation();
          }
        }, h("span", {
          className: "min-w-0 truncate"
        }, unescapeHtml(user.Nickname)), h(SquareArrowOutUpRightIcon, {
          className: "h-3 w-3 flex-shrink-0"
        }))), h("div", {
          className: "inline-block rounded px-1.5 py-1 text-[10px] font-bold leading-none",
          style: badgeStyle,
          title: activeTooltip
        }, displayBalance, " ", displayPercentage)));
        gridDiv.appendChild(itemContainer);
      });
    };
    const calculateColumns = width => {
      const minCellWidth = 200;
      const gap = 8;
      let cols = Math.floor((width + gap) / (minCellWidth + gap));
      const divisors = [24, 12, 8, 6, 4, 3, 2, 1];
      for (const divisor of divisors) {
        if (cols >= divisor) {
          return divisor;
        }
      }
      return 1;
    };
    const initialCols = calculateColumns(container.offsetWidth || 800);
    renderItems(initialCols);
    const contentDiv = h("div", {
      className: "px-2"
    });
    contentDiv.appendChild(gridDiv);
    if (totalPages > 1) {
      const pagination = h(Pagination, {
        current: currentPage,
        total: totalPages,
        onChange: handlePageChange
      });
      paginationDiv.appendChild(pagination);
      contentDiv.appendChild(paginationDiv);
    }
    container.appendChild(h("div", null, h("div", {
      id: "tg-trade-box-user-header",
      className: `tg-bg-content z-10 mb-2 flex items-center justify-between border-b border-gray-200 p-2 dark:border-gray-700 ${stickyClass}`,
      style: stickyStyle
    }, h("span", {
      className: "bgm-color text-sm font-semibold"
    }, "董事会 ", totalItems)), items.length > 0 && contentDiv));
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const newCols = calculateColumns(width);
        renderItems(newCols);
      }
    });
    observer.observe(container);
    return container;
  }

  function TradeBox(props) {
    const {
      characterData,
      userAssets,
      userCharacter,
      tinygrailCharacter,
      pool,
      depth,
      links,
      temples,
      users,
      onRefresh,
      setLoading,
      loadUsersPage,
      openUserModal,
      openCharacterModal,
      openSacrificeModal,
      openAuctionModal,
      openAuctionHistoryModal,
      openChangeAvatarModal,
      openTradeHistoryModal,
      openTempleModal,
      canChangeAvatar,
      sticky = false,
      stickyTop = 0,
      hideDuplicates = true,
      onToggleDuplicates
    } = props || {};
    if (!characterData) {
      return null;
    }
    return h("div", {
      id: "tg-trade-box",
      "data-character-id": characterData.CharacterId
    }, h(TradeBoxHeader, {
      characterData: characterData,
      userCharacter: userCharacter,
      tinygrailCharacter: tinygrailCharacter,
      pool: pool,
      canChangeAvatar: canChangeAvatar,
      onSacrificeClick: openSacrificeModal,
      onAuctionClick: openAuctionModal,
      onAuctionHistoryClick: openAuctionHistoryModal,
      onChangeAvatarClick: openChangeAvatarModal,
      onTradeHistoryClick: openTradeHistoryModal
    }), h(TradeBoxSection, {
      characterData: characterData,
      userAssets: userAssets,
      userCharacter: userCharacter,
      depth: depth,
      sticky: sticky,
      stickyTop: stickyTop,
      onRefresh: onRefresh,
      setLoading: setLoading
    }), links && links.length > 0 && h(TradeBoxLink, {
      characterData: characterData,
      links: links,
      openUserModal: openUserModal,
      openCharacterModal: openCharacterModal,
      openTempleModal: openTempleModal,
      sticky: sticky,
      stickyTop: stickyTop
    }), temples && temples.length > 0 && h(TradeBoxTemple, {
      characterData: characterData,
      userAssets: userAssets,
      temples: temples,
      openUserModal: openUserModal,
      openTempleModal: openTempleModal,
      sticky: sticky,
      stickyTop: stickyTop,
      hideDuplicates: hideDuplicates,
      onToggleDuplicates: onToggleDuplicates
    }), users && h(TradeBoxUser, {
      characterData: characterData,
      users: users,
      loadUsersPage: loadUsersPage,
      openUserModal: openUserModal,
      sticky: sticky,
      stickyTop: stickyTop
    }));
  }

  function Sacrifice({
    characterId
  }) {
    let sacrificeType = "restructure";
    let amount = "500";
    const amountInput = h("input", {
      type: "number",
      className: "tg-bg-content rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 dark:border-gray-600",
      placeholder: "请输入数量",
      value: "500",
      onInput: e => {
        amount = e.target.value;
      },
      min: "0",
      step: "1"
    });
    const descriptionDiv = h("div", {
      className: "rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
    }, "将股份转化为固定资产，同时获得现金奖励并掉落道具。");
    const switchTrack = h("div", {
      className: "relative inline-block h-6 w-11 rounded-full bg-gray-300 transition-colors dark:bg-gray-600"
    });
    const switchThumb = h("div", {
      className: "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
    });
    switchTrack.appendChild(switchThumb);
    const switchButton = h("button", {
      type: "button",
      className: "flex items-center gap-2 outline-none",
      onClick: () => {
        sacrificeType = sacrificeType === "restructure" ? "equity" : "restructure";
        const isEquity = sacrificeType === "equity";
        amount = "500";
        amountInput.value = "500";
        if (isEquity) {
          switchTrack.className = "relative inline-block h-6 w-11 rounded-full bgm-bg transition-colors";
          switchThumb.style.transform = "translateX(20px)";
          descriptionDiv.textContent = "将股份出售给幻想乡，立刻获取现金。";
          submitButton.textContent = "股权融资";
        } else {
          switchTrack.className = "relative inline-block h-6 w-11 rounded-full bg-gray-300 transition-colors dark:bg-gray-600";
          switchThumb.style.transform = "translateX(0)";
          descriptionDiv.textContent = "将股份转化为固定资产，同时获得现金奖励并掉落道具。";
          submitButton.textContent = "资产重组";
        }
      }
    }, switchTrack);
    const statusDiv = h("div", null);
    const updateStatus = (msg, type) => {
      if (msg) {
        let className = "rounded-lg px-3 py-2 text-xs ";
        if (type === "success") {
          className += "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
        } else if (type === "error") {
          className += "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
        } else {
          className += "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
        }
        statusDiv.className = className;
        statusDiv.textContent = msg;
        statusDiv.style.display = "block";
      } else {
        statusDiv.style.display = "none";
      }
    };
    const handleSubmit = async () => {
      if (!amount || isNaN(amount) || Number(amount) <= 0) {
        updateStatus("请输入有效的数量", "error");
        return;
      }
      const isEquity = sacrificeType === "equity";
      const amountNum = Number(amount);
      if (isEquity && amountNum >= 2500) {
        if (!confirm("当前股权融资数量过大，是否继续？")) {
          return;
        }
      }
      updateStatus("处理中...", "");
      const result = await sacrificeCharacter(characterId, amountNum, isEquity);
      if (result.success) {
        let message = `融资完成！获得资金${formatCurrency(result.data.Balance)}`;
        if (result.data.Items && result.data.Items.length > 0) {
          message += " 掉落道具";
          for (let i = 0; i < result.data.Items.length; i++) {
            const item = result.data.Items[i];
            message += ` 「${item.Name}」×${item.Count}`;
          }
        }
        updateStatus(message, "success");
      } else {
        updateStatus(result.message, "error");
      }
    };
    statusDiv.style.display = "none";
    const submitButton = h(Button, {
      onClick: handleSubmit
    }, "资产重组");
    return h("div", {
      id: "tg-sacrifice",
      className: "flex min-w-64 flex-col gap-4"
    }, h("div", {
      id: "tg-sacrifice-type-switch",
      className: "flex items-center gap-3"
    }, switchButton, h("span", {
      className: "text-sm opacity-60"
    }, "股权融资")), descriptionDiv, h("div", {
      id: "tg-sacrifice-amount-input",
      className: "flex flex-col gap-2"
    }, amountInput), statusDiv, h("div", {
      id: "tg-sacrifice-submit",
      className: "flex justify-end"
    }, submitButton));
  }

  function Auction({
    characterId,
    basePrice = 0,
    maxAmount = 0
  }) {
    const minPrice = Math.ceil(basePrice);
    let price = minPrice.toString();
    let amount = maxAmount;
    let auctionData = null;
    const totalDiv = h("div", {
      id: "tg-auction-total",
      className: "text-sm opacity-60"
    }, "合计：", formatCurrency(minPrice * maxAmount));
    const updateTotal = () => {
      const priceNum = Number(price) || 0;
      const amountNum = Number(amount) || 0;
      const total = priceNum * amountNum;
      totalDiv.textContent = `合计：${formatCurrency(total)}`;
    };
    const priceInput = h("input", {
      id: "tg-auction-price-input",
      type: "number",
      className: "tg-bg-content rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 dark:border-gray-600",
      placeholder: "请输入价格",
      value: minPrice,
      onInput: e => {
        price = e.target.value;
        updateTotal();
      },
      min: minPrice,
      step: "1"
    });
    const amountInput = h("input", {
      id: "tg-auction-amount-input",
      type: "number",
      className: "tg-bg-content rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 dark:border-gray-600",
      placeholder: "请输入数量",
      value: amount,
      onInput: e => {
        amount = e.target.value;
        updateTotal();
      },
      min: "0",
      step: "1"
    });
    const statusDiv = h("div", null);
    const auctionInfoContainer = h("div", {
      style: {
        display: "none"
      },
      className: "flex flex-col gap-1"
    });
    const updateStatus = (msg, type) => {
      if (msg) {
        let className = "rounded-lg px-3 py-2 text-xs ";
        if (type === "success") {
          className += "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
        } else if (type === "error") {
          className += "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
        } else {
          className += "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
        }
        statusDiv.className = className;
        statusDiv.textContent = msg;
        statusDiv.style.display = "block";
      } else {
        statusDiv.style.display = "none";
      }
    };
    const handleSubmit = async () => {
      if (!price || isNaN(price) || Number(price) <= 0) {
        updateStatus("请输入有效的价格", "error");
        return;
      }
      if (!amount || isNaN(amount) || Number(amount) <= 0) {
        updateStatus("请输入有效的数量", "error");
        return;
      }
      updateStatus("处理中...", "");
      const result = await auctionCharacter(characterId, Number(price), Number(amount));
      if (result.success) {
        updateStatus(result.data, "success");
        await loadAuctionList(false);
      } else {
        updateStatus(result.message, "error");
      }
    };
    const loadAuctionList = async (showLoading = true) => {
      if (showLoading) {
        updateStatus("加载中...", "");
      }
      const result = await getAuctionList([characterId]);
      if (result.success) {
        auctionData = result.data;
        if (showLoading) {
          updateStatus("", "");
        }
        if (auctionData && auctionData.length > 0) {
          const auction = auctionData[0];
          auctionInfoContainer.innerHTML = "";
          let hasInfo = false;
          if (auction.State != 0) {
            hasInfo = true;
            const info = h("div", {
              className: "text-xs text-gray-500 dark:text-gray-400"
            }, h("span", null, "竞拍人数：", h("span", {
              className: "bgm-color"
            }, auction.State)), h("span", {
              className: "mx-2"
            }, "•"), h("span", null, "竞拍数量：", h("span", {
              className: "bgm-color"
            }, auction.Type)));
            auctionInfoContainer.appendChild(info);
          }
          if (auction.Price != 0) {
            hasInfo = true;
            const myInfo = h("div", {
              className: "text-xs text-gray-500 dark:text-gray-400"
            }, h("span", null, "出价：", h("span", {
              className: "bgm-color"
            }, formatCurrency(auction.Price))), h("span", {
              className: "mx-2"
            }, "•"), h("span", null, "拍卖数量：", h("span", {
              className: "bgm-color"
            }, auction.Amount)));
            auctionInfoContainer.appendChild(myInfo);
          }
          if (hasInfo) {
            auctionInfoContainer.style.display = "flex";
          }
        }
      } else {
        if (showLoading) {
          updateStatus(result.message, "error");
        }
      }
    };
    statusDiv.style.display = "none";
    loadAuctionList();
    return h("div", {
      id: "tg-auction",
      "data-character-id": characterId,
      "data-base-price": basePrice,
      className: "flex min-w-64 flex-col gap-4"
    }, auctionInfoContainer, h("div", {
      className: "flex flex-col gap-2"
    }, h("label", {
      className: "text-sm opacity-40"
    }, "价格"), priceInput), h("div", {
      className: "flex flex-col gap-2"
    }, h("label", {
      className: "text-sm opacity-40"
    }, "数量"), amountInput), totalDiv, statusDiv, h("div", {
      className: "flex justify-end"
    }, h(Button, {
      onClick: handleSubmit
    }, "拍卖")));
  }

  function AuctionHistory({
    characterId
  }) {
    let historyData = [];
    let currentPage = 1;
    const descDiv = h("div", {
      className: "text-sm text-gray-600 dark:text-gray-400"
    });
    const resultContainer = h("div", {
      className: "flex flex-col"
    });
    const paginationContainer = h("div", {
      className: "flex justify-center"
    });
    const renderPagination = () => {
      paginationContainer.innerHTML = "";
      const pagination = h(Pagination, {
        current: currentPage,
        type: "simple",
        onChange: handlePageChange
      });
      paginationContainer.appendChild(pagination);
    };
    const handlePageChange = page => {
      loadAuctionHistory(page);
    };
    const renderHistoryList = () => {
      resultContainer.innerHTML = "";
      if (!historyData || historyData.length === 0) {
        descDiv.textContent = "暂无拍卖数据";
        resultContainer.style.display = "none";
        renderPagination();
        return;
      }
      let success = 0;
      let total = 0;
      historyData.forEach(auction => {
        let stateClass = "";
        let stateName = "失败";
        if (auction.State === 1) {
          success++;
          total += auction.Amount;
          stateClass = "text-green-600 dark:text-green-400";
          stateName = "成功";
        } else {
          stateClass = "text-red-600 dark:text-red-400";
        }
        const record = h("div", {
          className: "flex items-center justify-between gap-4 border-b border-gray-200 py-2 text-sm last:border-b-0 dark:border-gray-700"
        }, h("div", {
          className: "flex flex-col gap-1"
        }, h("div", {
          className: "flex items-center gap-2"
        }, h("span", {
          className: auction.Username !== "tinygrail" ? "bgm-color" : ""
        }, auction.Nickname), h("span", {
          className: "text-gray-700 dark:text-gray-300"
        }, formatCurrency(auction.Price), " / ", formatNumber(auction.Amount, 0))), h("span", {
          className: "text-xs text-gray-500 dark:text-gray-400"
        }, formatDateTime(auction.Bid, "YYYY-MM-DD HH:mm:ss"))), h("span", {
          className: `font-medium ${stateClass}`
        }, stateName));
        resultContainer.appendChild(record);
      });
      descDiv.textContent = `共有${historyData.length}人参与拍卖，成功${success}人 / ${total}股`;
      resultContainer.style.display = "flex";
      renderPagination();
    };
    const loadAuctionHistory = async (page = 1) => {
      const result = await getAuctionHistory(characterId, page);
      if (result.success) {
        historyData = result.data;
        currentPage = page;
        renderHistoryList();
      } else {
        descDiv.textContent = "暂无拍卖数据";
        resultContainer.style.display = "none";
        renderPagination();
      }
    };
    loadAuctionHistory();
    return h("div", {
      id: "tg-auction-history",
      "data-character-id": characterId,
      className: "flex min-w-64 flex-col gap-2"
    }, h("div", {
      className: "min-h-32"
    }, descDiv, resultContainer), paginationContainer);
  }

  function TradeHistory({
    characterId
  }) {
    let allRecords = [];
    let currentPage = 1;
    const pageSize = 10;
    const loadingDiv = h("div", {
      className: "text-center text-gray-600 dark:text-gray-400"
    }, "加载中...");
    const headerDiv = h("div", {
      className: "grid grid-cols-4 gap-2 border-b border-gray-300 pb-2 text-sm font-medium text-gray-700 dark:border-gray-600 dark:text-gray-300"
    }, h("div", null, "交易时间"), h("div", {
      className: "text-right"
    }, "价格"), h("div", {
      className: "text-right"
    }, "数量"), h("div", {
      className: "text-right"
    }, "交易额"));
    const resultContainer = h("div", {
      className: "flex flex-col gap-2"
    });
    const paginationContainer = h("div", {
      className: "flex justify-center"
    });
    headerDiv.style.display = "none";
    resultContainer.style.display = "none";
    paginationContainer.style.display = "none";
    const renderPagination = () => {
      paginationContainer.innerHTML = "";
      const totalPages = Math.ceil(allRecords.length / pageSize);
      if (totalPages > 1) {
        const pagination = h(Pagination, {
          current: currentPage,
          total: totalPages,
          onChange: handlePageChange
        });
        paginationContainer.appendChild(pagination);
        paginationContainer.style.display = "flex";
      } else {
        paginationContainer.style.display = "none";
      }
    };
    const renderTradeList = () => {
      resultContainer.innerHTML = "";
      Math.ceil(allRecords.length / pageSize);
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const records = allRecords.slice(startIndex, endIndex);
      if (records.length === 0) {
        const emptyDiv = h("div", {
          className: "text-center text-gray-600 dark:text-gray-400"
        }, "暂无交易记录");
        resultContainer.appendChild(emptyDiv);
        resultContainer.style.display = "block";
        return;
      }
      records.forEach(record => {
        const price = record.Amount > 0 ? record.Price / record.Amount : 0;
        const row = h("div", {
          className: "grid grid-cols-4 gap-2 text-sm"
        }, h("span", {
          className: "text-gray-600 dark:text-gray-400",
          title: "交易时间"
        }, formatDateTime(record.Time, "YYYY-MM-DD HH:mm")), h("span", {
          className: "text-right text-gray-900 dark:text-gray-100",
          title: "价格"
        }, formatCurrency(price, "₵", 2, false)), h("span", {
          className: "text-right text-gray-900 dark:text-gray-100",
          title: "数量"
        }, formatNumber(record.Amount, 0)), h("span", {
          className: "text-right text-gray-900 dark:text-gray-100",
          title: "交易额"
        }, formatCurrency(record.Price)));
        resultContainer.appendChild(row);
      });
      resultContainer.style.display = "flex";
      renderPagination();
    };
    const handlePageChange = page => {
      currentPage = page;
      renderTradeList();
    };
    const loadTradeHistory = async () => {
      const result = await getCharacterCharts(characterId);
      if (result.success) {
        allRecords = (result.data || []).reverse();
        renderTradeList();
      } else {
        const emptyDiv = h("div", {
          className: "text-center text-gray-600 dark:text-gray-400"
        }, "暂无交易记录");
        resultContainer.appendChild(emptyDiv);
        resultContainer.style.display = "block";
      }
      loadingDiv.style.display = "none";
      headerDiv.style.display = "grid";
    };
    loadTradeHistory();
    return h("div", {
      id: "tg-trade-history",
      "data-character-id": characterId,
      className: "flex min-w-64 flex-col gap-2"
    }, loadingDiv, headerDiv, resultContainer, paginationContainer);
  }

  function ImageCropper({
    onCrop
  }) {
    let img = null;
    let canvas = null;
    let ctx = null;
    let currentImageUrl = null;
    const cropState = {
      x: 0,
      y: 0,
      size: 200,
      isDragging: false,
      dragType: null,
      dragStartX: 0,
      dragStartY: 0,
      startCropX: 0,
      startCropY: 0,
      startCropSize: 0
    };
    const drawCanvas = () => {
      if (!ctx || !img) return;
      const rect = canvas.getBoundingClientRect();
      const scale = canvas.width / rect.width;
      const visualHandleSize = 12;
      const actualHandleSize = visualHandleSize * scale;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.clearRect(cropState.x, cropState.y, cropState.size, cropState.size);
      ctx.drawImage(img, cropState.x, cropState.y, cropState.size, cropState.size, cropState.x, cropState.y, cropState.size, cropState.size);
      ctx.strokeStyle = "#0ea5e9";
      ctx.lineWidth = 2 * scale;
      ctx.strokeRect(cropState.x, cropState.y, cropState.size, cropState.size);
      ctx.fillStyle = "#0ea5e9";
      ctx.fillRect(cropState.x - actualHandleSize / 2, cropState.y - actualHandleSize / 2, actualHandleSize, actualHandleSize);
      ctx.fillRect(cropState.x + cropState.size - actualHandleSize / 2, cropState.y - actualHandleSize / 2, actualHandleSize, actualHandleSize);
      ctx.fillRect(cropState.x - actualHandleSize / 2, cropState.y + cropState.size - actualHandleSize / 2, actualHandleSize, actualHandleSize);
      ctx.fillRect(cropState.x + cropState.size - actualHandleSize / 2, cropState.y + cropState.size - actualHandleSize / 2, actualHandleSize, actualHandleSize);
      const visualEdgeHandleSize = 6;
      const visualEdgeHandleLength = 32;
      const actualEdgeHandleSize = visualEdgeHandleSize * scale;
      const actualEdgeHandleLength = visualEdgeHandleLength * scale;
      ctx.fillRect(cropState.x + cropState.size / 2 - actualEdgeHandleLength / 2, cropState.y - actualEdgeHandleSize / 2, actualEdgeHandleLength, actualEdgeHandleSize);
      ctx.fillRect(cropState.x + cropState.size / 2 - actualEdgeHandleLength / 2, cropState.y + cropState.size - actualEdgeHandleSize / 2, actualEdgeHandleLength, actualEdgeHandleSize);
      ctx.fillRect(cropState.x - actualEdgeHandleSize / 2, cropState.y + cropState.size / 2 - actualEdgeHandleLength / 2, actualEdgeHandleSize, actualEdgeHandleLength);
      ctx.fillRect(cropState.x + cropState.size - actualEdgeHandleSize / 2, cropState.y + cropState.size / 2 - actualEdgeHandleLength / 2, actualEdgeHandleSize, actualEdgeHandleLength);
    };
    const getPosition = e => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      let clientX, clientY;
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };
    const getHitType = (x, y) => {
      const rect = canvas.getBoundingClientRect();
      const scale = canvas.width / rect.width;
      const visualTolerance = 20;
      const tolerance = visualTolerance * scale;
      if (Math.abs(x - cropState.x) < tolerance && Math.abs(y - cropState.y) < tolerance) return "nw";
      if (Math.abs(x - (cropState.x + cropState.size)) < tolerance && Math.abs(y - cropState.y) < tolerance) return "ne";
      if (Math.abs(x - cropState.x) < tolerance && Math.abs(y - (cropState.y + cropState.size)) < tolerance) return "sw";
      if (Math.abs(x - (cropState.x + cropState.size)) < tolerance && Math.abs(y - (cropState.y + cropState.size)) < tolerance) return "se";
      if (Math.abs(y - cropState.y) < tolerance && x > cropState.x && x < cropState.x + cropState.size) return "n";
      if (Math.abs(y - (cropState.y + cropState.size)) < tolerance && x > cropState.x && x < cropState.x + cropState.size) return "s";
      if (Math.abs(x - cropState.x) < tolerance && y > cropState.y && y < cropState.y + cropState.size) return "w";
      if (Math.abs(x - (cropState.x + cropState.size)) < tolerance && y > cropState.y && y < cropState.y + cropState.size) return "e";
      if (x > cropState.x && x < cropState.x + cropState.size && y > cropState.y && y < cropState.y + cropState.size) {
        return "move";
      }
      return null;
    };
    const getCursorStyle = hitType => {
      const cursors = {
        nw: "nw-resize",
        ne: "ne-resize",
        sw: "sw-resize",
        se: "se-resize",
        n: "n-resize",
        s: "s-resize",
        w: "w-resize",
        e: "e-resize",
        move: "move"
      };
      return cursors[hitType] || "default";
    };
    const handleStart = e => {
      e.preventDefault();
      const {
        x,
        y
      } = getPosition(e);
      const hitType = getHitType(x, y);
      if (hitType) {
        cropState.isDragging = true;
        cropState.dragType = hitType;
        cropState.dragStartX = x;
        cropState.dragStartY = y;
        cropState.startCropX = cropState.x;
        cropState.startCropY = cropState.y;
        cropState.startCropSize = cropState.size;
        canvas.style.cursor = getCursorStyle(hitType);
      }
    };
    const handleMove = e => {
      e.preventDefault();
      const {
        x,
        y
      } = getPosition(e);
      if (cropState.isDragging) {
        const dx = x - cropState.dragStartX;
        const dy = y - cropState.dragStartY;
        switch (cropState.dragType) {
          case "move":
            cropState.x = Math.max(0, Math.min(cropState.startCropX + dx, canvas.width - cropState.size));
            cropState.y = Math.max(0, Math.min(cropState.startCropY + dy, canvas.height - cropState.size));
            break;
          case "se":
            {
              const delta = Math.max(dx, dy);
              const newSize = Math.max(50, Math.min(cropState.startCropSize + delta, canvas.width - cropState.x, canvas.height - cropState.y));
              cropState.size = newSize;
            }
            break;
          case "nw":
            {
              const delta = Math.min(dx, dy);
              const newSize = Math.max(50, cropState.startCropSize - delta);
              const actualDelta = cropState.startCropSize - newSize;
              cropState.size = newSize;
              cropState.x = Math.max(0, cropState.startCropX + actualDelta);
              cropState.y = Math.max(0, cropState.startCropY + actualDelta);
            }
            break;
          case "ne":
            {
              const delta = Math.max(dx, -dy);
              const newSize = Math.max(50, Math.min(cropState.startCropSize + delta, canvas.width - cropState.startCropX));
              const actualDelta = newSize - cropState.startCropSize;
              cropState.size = newSize;
              cropState.y = Math.max(0, cropState.startCropY - actualDelta);
            }
            break;
          case "sw":
            {
              const delta = Math.max(-dx, dy);
              const newSize = Math.max(50, Math.min(cropState.startCropSize + delta, canvas.height - cropState.startCropY));
              const actualDelta = newSize - cropState.startCropSize;
              cropState.size = newSize;
              cropState.x = Math.max(0, cropState.startCropX - actualDelta);
            }
            break;
          case "n":
            {
              const newSize = Math.max(50, cropState.startCropSize - dy);
              const actualDelta = cropState.startCropSize - newSize;
              cropState.size = newSize;
              cropState.y = Math.max(0, cropState.startCropY + actualDelta);
            }
            break;
          case "s":
            {
              const newSize = Math.max(50, Math.min(cropState.startCropSize + dy, canvas.height - cropState.startCropY));
              cropState.size = newSize;
            }
            break;
          case "w":
            {
              const newSize = Math.max(50, cropState.startCropSize - dx);
              const actualDelta = cropState.startCropSize - newSize;
              cropState.size = newSize;
              cropState.x = Math.max(0, cropState.startCropX + actualDelta);
            }
            break;
          case "e":
            {
              const newSize = Math.max(50, Math.min(cropState.startCropSize + dx, canvas.width - cropState.startCropX));
              cropState.size = newSize;
            }
            break;
        }
        drawCanvas();
      } else {
        if (!e.touches) {
          const hitType = getHitType(x, y);
          canvas.style.cursor = getCursorStyle(hitType);
        }
      }
    };
    const handleEnd = e => {
      e.preventDefault();
      cropState.isDragging = false;
      cropState.dragType = null;
      if (!e.touches) {
        canvas.style.cursor = "default";
      }
    };
    const handleFileSelect = e => {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        alert("请选择图片文件");
        return;
      }
      const reader = new FileReader();
      reader.onload = event => {
        currentImageUrl = event.target.result;
        const emptyHint = container.querySelector(".empty-hint");
        const canvasElement = container.querySelector("canvas");
        if (emptyHint) emptyHint.style.display = "none";
        if (canvasElement) canvasElement.style.display = "block";
        loadImage();
      };
      reader.readAsDataURL(file);
    };
    const handleCrop = async () => {
      if (!img) return;
      const cropButton = container.querySelector(".crop-button");
      if (cropButton) {
        cropButton.disabled = true;
        cropButton.textContent = "上传中...";
      }
      const outputCanvas = document.createElement("canvas");
      outputCanvas.width = cropState.size;
      outputCanvas.height = cropState.size;
      const outputCtx = outputCanvas.getContext("2d");
      outputCtx.drawImage(img, cropState.x, cropState.y, cropState.size, cropState.size, 0, 0, cropState.size, cropState.size);
      outputCanvas.toBlob(async blob => {
        if (onCrop) {
          await onCrop(blob, outputCanvas.toDataURL());
        }
        if (cropButton) {
          cropButton.disabled = false;
          cropButton.textContent = "确认裁剪";
        }
      }, "image/png");
    };
    const loadImage = () => {
      if (!currentImageUrl) return;
      img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        canvas = container.querySelector("canvas");
        if (!canvas) return;
        ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        const minSize = Math.min(img.width, img.height);
        cropState.size = minSize;
        cropState.x = (img.width - minSize) / 2;
        cropState.y = (img.height - minSize) / 2;
        canvas.addEventListener("mousedown", handleStart);
        canvas.addEventListener("mousemove", handleMove);
        canvas.addEventListener("mouseup", handleEnd);
        canvas.addEventListener("mouseleave", handleEnd);
        canvas.addEventListener("touchstart", handleStart, {
          passive: false
        });
        canvas.addEventListener("touchmove", handleMove, {
          passive: false
        });
        canvas.addEventListener("touchend", handleEnd, {
          passive: false
        });
        canvas.addEventListener("touchcancel", handleEnd, {
          passive: false
        });
        drawCanvas();
      };
      img.src = currentImageUrl;
    };
    const fileInput = h("input", {
      type: "file",
      accept: "image/*",
      className: "hidden",
      onChange: handleFileSelect
    });
    const uploadButton = h(Button, {
      onClick: () => {
        fileInput.click();
      }
    }, "上传图片");
    const canvasElement = h("canvas", {
      className: "border border-gray-300 dark:border-gray-600",
      style: {
        maxWidth: "100%",
        cursor: "default",
        display: "none"
      }
    });
    const emptyHint = h("div", {
      className: "empty-hint flex min-h-[200px] items-center justify-center border border-gray-300 text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400"
    }, "请先上传图片");
    const cropButton = h(Button, {
      className: "crop-button",
      onClick: handleCrop
    }, "确认裁剪");
    const container = h("div", {
      className: "flex flex-col gap-4"
    }, fileInput, h("div", {
      className: "flex gap-2"
    }, uploadButton), emptyHint, canvasElement, h("div", {
      className: "flex justify-end"
    }, cropButton));
    return container;
  }

  function TempleImage({
    imageUrl,
    characterName,
    line,
    onLoad
  }) {
    const minWidth = 480;
    const minHeight = 680;
    const img = h("img", {
      src: imageUrl,
      alt: characterName,
      className: "h-auto max-w-full",
      style: {
        display: "none"
      }
    });
    const container = h("div", {
      id: "tg-temple-image",
      className: "relative flex items-center justify-center bg-gray-100 dark:bg-gray-800",
      style: {
        width: `${minWidth}px`,
        minHeight: `${minHeight}px`
      }
    });
    const loader = h("div", {
      className: "flex flex-col items-center gap-2"
    }, h(LoaderCircleIcon, {
      className: "tg-spin h-8 w-8 text-gray-400"
    }), h("span", {
      className: "text-sm text-gray-500"
    }, "加载中..."));
    container.appendChild(loader);
    let lineOverlay = null;
    if (line) {
      lineOverlay = h("div", {
        className: "absolute bottom-3 left-3 right-3"
      }, h("div", {
        className: "px-1 py-1"
      }, h("div", {
        className: "text-base font-bold text-white",
        style: {
          textShadow: "1px 1px 1px #000"
        }
      }, characterName)), h("div", {
        className: "rounded-lg bg-white/70 px-4 py-3 backdrop-blur-sm"
      }, h("div", {
        className: "whitespace-pre-wrap text-sm text-gray-800"
      }, line)));
    }
    img.onload = () => {
      const naturalWidth = img.naturalWidth;
      let finalWidth;
      if (naturalWidth >= minWidth) {
        finalWidth = naturalWidth;
        container.style.width = `${naturalWidth}px`;
        container.style.maxWidth = "100%";
      } else {
        finalWidth = minWidth;
        container.style.width = `${minWidth}px`;
        container.style.maxWidth = "100%";
        img.style.width = `${minWidth}px`;
      }
      container.style.minHeight = "auto";
      container.style.background = "none";
      container.classList.remove("flex", "items-center", "justify-center", "bg-gray-100", "dark:bg-gray-800");
      loader.remove();
      img.style.display = "block";
      if (lineOverlay) {
        container.appendChild(lineOverlay);
      }
      if (onLoad) {
        onLoad(finalWidth);
      }
    };
    container.appendChild(img);
    return container;
  }

  function TempleInfo({
    templeData
  }) {
    if (!templeData) return null;
    const getTempleThemeColor = level => {
      if (level === 2) return "#eab308";
      if (level === 3) return "#a855f7";
      return "#9ca3af";
    };
    const themeColor = getTempleThemeColor(templeData.Level);
    const container = h("div", {
      id: "tg-temple-info",
      className: "flex flex-col gap-2 px-4 pb-2 pt-2"
    }, h("div", {
      id: "tg-temple-info-progress",
      className: "flex w-full flex-col gap-1"
    }, h("div", {
      className: "text-sm opacity-60"
    }, formatNumber(templeData.Assets ?? 0, 0), " / ", formatNumber(templeData.Sacrifices ?? 0, 0)), h(ProgressBar, {
      value: templeData.Assets ?? 0,
      max: templeData.Sacrifices ?? 100,
      color: themeColor,
      height: "h-1"
    })));
    return container;
  }

  function TempleActions({
    temple,
    onChangeCover,
    onResetCover,
    onChangeLine,
    onLink,
    onRefine,
    onPost,
    onFisheye,
    onStardust,
    onAttack,
    onStarForces,
    onChaosCube,
    onDestroy
  }) {
    let isOwnTemple = false;
    let isGameMaster = false;
    try {
      const cachedUserAssets = localStorage.getItem("tinygrail:user-assets");
      if (cachedUserAssets) {
        const userAssets = JSON.parse(cachedUserAssets);
        const currentUserId = userAssets.id;
        const userType = userAssets.type;
        isOwnTemple = temple.UserId === currentUserId;
        isGameMaster = userType >= 999 || currentUserId === 702;
      }
    } catch (e) {
      console.warn("读取用户资产缓存失败:", e);
    }
    const buttons = [{
      label: "修改",
      show: isOwnTemple,
      onClick: onChangeCover
    }, {
      label: "重置",
      show: isOwnTemple || isGameMaster,
      onClick: onResetCover
    }, {
      label: "LINK",
      show: isOwnTemple,
      onClick: onLink
    }, {
      label: "台词",
      show: isOwnTemple,
      onClick: onChangeLine
    }, {
      label: "精炼",
      show: isOwnTemple,
      onClick: onRefine
    }, {
      label: "混沌魔方",
      show: isOwnTemple,
      onClick: onChaosCube
    }, {
      label: "虚空道标",
      show: isOwnTemple,
      onClick: onPost
    }, {
      label: "鲤鱼之眼",
      show: isOwnTemple,
      onClick: onFisheye
    }, {
      label: "星光碎片",
      show: isOwnTemple,
      onClick: onStardust
    }, {
      label: "闪光结晶",
      show: isOwnTemple,
      onClick: onAttack
    }, {
      label: "星之力",
      show: isOwnTemple,
      onClick: onStarForces
    }, {
      label: "拆除",
      show: isOwnTemple && temple.Assets == temple.Sacrifices,
      onClick: onDestroy
    }];
    const visibleButtons = buttons.filter(btn => btn.show);
    if (visibleButtons.length === 0) {
      return null;
    }
    return h("div", {
      id: "tg-temple-actions",
      className: "flex flex-wrap gap-2 p-4 pt-2"
    }, visibleButtons.map((btn, index) => h(Button, {
      variant: btn.label === "拆除" ? "solid" : "outline",
      onClick: btn.onClick,
      className: btn.label === "拆除" ? "!bg-red-500 hover:!bg-red-600" : ""
    }, btn.label)));
  }

  function TempleLineEditor({
    currentLine,
    onSubmit,
    onCancel
  }) {
    const textarea = h("textarea", {
      className: "tg-input w-full resize-none rounded-md border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:focus:border-blue-400 dark:focus:ring-blue-400",
      rows: "6",
      placeholder: "请输入台词",
      defaultValue: currentLine
    });
    const handleSubmit = () => {
      if (textarea && textarea.value !== undefined) {
        onSubmit(textarea.value);
      }
    };
    return h("div", {
      id: "tg-temple-line-editor",
      className: "space-y-2"
    }, textarea, h("div", {
      id: "tg-temple-line-editor-actions",
      className: "flex justify-end gap-2"
    }, h(Button, {
      variant: "outline",
      onClick: onCancel
    }, "取消"), h(Button, {
      variant: "solid",
      onClick: handleSubmit
    }, "确定")));
  }

  async function refineCharacter(characterId) {
    try {
      const data = await post(`magic/refine/${characterId}`);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "精炼失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("精炼失败:", error);
      return {
        success: false,
        message: "精炼失败"
      };
    }
  }
  async function guidepost(fromCharaId, toCharaId) {
    try {
      const data = await post(`magic/guidepost/${fromCharaId}/${toCharaId}`);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "虚空道标失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("虚空道标失败:", error);
      return {
        success: false,
        message: "虚空道标失败"
      };
    }
  }
  async function fisheye(fromCharaId, toCharaId) {
    try {
      const data = await post(`magic/fisheye/${fromCharaId}/${toCharaId}`);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "鲤鱼之眼失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("鲤鱼之眼失败:", error);
      return {
        success: false,
        message: "鲤鱼之眼失败"
      };
    }
  }
  async function stardust(fromCharaId, toCharaId, amount) {
    try {
      const data = await post(`magic/stardust/${fromCharaId}/${toCharaId}/${amount}/false`);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "星光碎片失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("星光碎片失败:", error);
      return {
        success: false,
        message: "星光碎片失败"
      };
    }
  }
  async function starbreak(fromCharaId, toCharaId) {
    try {
      const data = await post(`magic/starbreak/${fromCharaId}/${toCharaId}`);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "闪光结晶失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("闪光结晶失败:", error);
      return {
        success: false,
        message: "闪光结晶失败"
      };
    }
  }
  async function chaosCube(templeId) {
    try {
      const data = await post(`magic/chaos/${templeId}`);
      if (!data || data.State !== 0) {
        return {
          success: false,
          message: data?.Message || "混沌魔方使用失败"
        };
      }
      return {
        success: true,
        data: data.Value
      };
    } catch (error) {
      console.error("混沌魔方使用失败:", error);
      return {
        success: false,
        message: "混沌魔方使用失败"
      };
    }
  }

  function TempleSearch({
    username,
    onTempleClick,
    className = ""
  }) {
    const container = h("div", {
      id: "tg-temple-search",
      className: className
    });
    const {
      setState
    } = createMountedComponent(container, state => {
      const {
        keyword = "",
        temples = null,
        currentPage = 1,
        totalPages = 0,
        loading = false
      } = state || {};
      let currentInputValue = keyword;
      const handleSearch = () => {
        const searchKeyword = currentInputValue.trim();
        setState({
          keyword: searchKeyword,
          currentPage: 1
        });
        loadTemples(searchKeyword, 1);
      };
      const handlePageChange = page => {
        setState({
          currentPage: page
        });
        loadTemples(keyword, page);
      };
      const handleTempleClick = temple => {
        if (onTempleClick) {
          onTempleClick(temple);
        }
      };
      const calculateColumns = width => {
        const minCellWidth = 120;
        const gap = 16;
        let cols = Math.floor((width + gap) / (minCellWidth + gap));
        const divisors = [24, 12, 8, 6, 4, 3, 2, 1];
        for (const divisor of divisors) {
          if (cols >= divisor) {
            return divisor;
          }
        }
        return 1;
      };
      const renderItems = (gridDiv, cols) => {
        gridDiv.innerHTML = "";
        gridDiv.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        if (!temples) return;
        temples.forEach(temple => {
          const itemContainer = h("div", {
            "data-character-id": temple.CharacterId,
            className: "flex w-full cursor-pointer flex-col gap-1 rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
            onClick: () => handleTempleClick(temple)
          }, h(Temple, {
            temple: temple
          }), h("div", {
            className: "flex flex-col gap-0.5 text-sm"
          }, h("div", {
            className: "flex items-center gap-1"
          }, h(LevelBadge, {
            level: temple.CharacterLevel,
            zeroCount: temple.ZeroCount
          }), h("span", {
            className: "opacity-80"
          }, temple.Name)), h("div", {
            className: "text-xs opacity-60"
          }, temple.Link ? `×「${temple.Link.Name}」` : "NO LINK")));
          gridDiv.appendChild(itemContainer);
        });
      };
      const contentDiv = h("div", {
        id: "tg-temple-search-content",
        className: "flex w-full flex-col gap-4"
      });
      const searchDiv = h("div", {
        id: "tg-temple-search-input",
        className: "flex gap-2"
      }, h("input", {
        type: "text",
        className: "tg-input flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 dark:border-gray-600",
        placeholder: "搜索圣殿（角色ID或名称）",
        value: keyword,
        onInput: e => {
          currentInputValue = e.target.value;
        },
        onKeyPress: e => {
          if (e.key === "Enter") {
            handleSearch();
          }
        }
      }), h(Button, {
        variant: "solid",
        size: "sm",
        onClick: handleSearch
      }, "搜索"));
      contentDiv.appendChild(searchDiv);
      if (loading) {
        const loadingDiv = h("div", {
          className: "py-8 text-center text-sm opacity-60"
        }, "加载中...");
        contentDiv.appendChild(loadingDiv);
      }
      if (!loading && temples && temples.length > 0) {
        const gridDiv = h("div", {
          className: "grid w-full gap-1"
        });
        const initialCols = calculateColumns(container.offsetWidth || 800);
        renderItems(gridDiv, initialCols);
        contentDiv.appendChild(gridDiv);
        const observer = new ResizeObserver(() => {
          const newCols = calculateColumns(container.offsetWidth);
          renderItems(gridDiv, newCols);
        });
        observer.observe(container);
      }
      if (!loading && temples && temples.length === 0) {
        const emptyDiv = h("div", {
          className: "py-8 text-center text-sm opacity-60"
        }, "未找到相关圣殿");
        contentDiv.appendChild(emptyDiv);
      }
      if (!loading && totalPages > 1) {
        const paginationDiv = h("div", {
          className: "flex justify-center"
        }, h(Pagination, {
          current: Number(currentPage) || 1,
          total: Number(totalPages),
          onChange: handlePageChange
        }));
        contentDiv.appendChild(paginationDiv);
      }
      return contentDiv;
    });
    const loadTemples = (keyword, page) => {
      setState({
        loading: true
      });
      getUserTemples(username, page, 24, keyword).then(result => {
        if (result.success) {
          setState({
            temples: result.data.items,
            currentPage: result.data.currentPage,
            totalPages: result.data.totalPages,
            loading: false
          });
        } else {
          setState({
            temples: [],
            loading: false
          });
        }
      });
    };
    loadTemples("", 1);
    return container;
  }

  function CharacterSearch({
    username,
    onCharacterClick,
    className = ""
  }) {
    const container = h("div", {
      id: "tg-character-search",
      className: className
    });
    const {
      setState
    } = createMountedComponent(container, state => {
      const {
        keyword = "",
        characters = null,
        currentPage = 1,
        totalPages = 0,
        loading = false,
        isSearchMode = false
      } = state || {};
      let currentInputValue = keyword;
      const handleSearch = () => {
        const searchKeyword = currentInputValue.trim();
        if (searchKeyword) {
          setState({
            keyword: searchKeyword,
            isSearchMode: true
          });
          loadSearchResults(searchKeyword);
        } else {
          setState({
            keyword: "",
            isSearchMode: false,
            currentPage: 1
          });
          loadCharacters(1);
        }
      };
      const handlePageChange = page => {
        setState({
          currentPage: page
        });
        loadCharacters(page);
      };
      const handleCharacterClick = character => {
        if (onCharacterClick) {
          onCharacterClick(character);
        }
      };
      const contentDiv = h("div", {
        className: "flex w-96 flex-col gap-2"
      });
      const searchDiv = h("div", {
        id: "tg-character-search-input",
        className: "flex gap-2"
      }, h("input", {
        type: "text",
        className: "tg-input flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 dark:border-gray-600",
        placeholder: "搜索角色（角色ID或名称）",
        value: keyword,
        onInput: e => {
          currentInputValue = e.target.value;
        },
        onKeyPress: e => {
          if (e.key === "Enter") {
            handleSearch();
          }
        }
      }), h(Button, {
        variant: "solid",
        size: "sm",
        onClick: handleSearch
      }, "搜索"));
      contentDiv.appendChild(searchDiv);
      if (loading) {
        const loadingDiv = h("div", {
          className: "py-8 text-center text-sm opacity-60"
        }, "加载中...");
        contentDiv.appendChild(loadingDiv);
      }
      if (!loading && characters && characters.length > 0) {
        const listDiv = h("div", {
          id: "tg-character-search-list",
          className: "flex flex-col divide-y divide-gray-200 dark:divide-gray-700"
        });
        characters.forEach(character => {
          const itemDiv = h("div", {
            className: "flex cursor-pointer items-center gap-3 p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
            onClick: () => handleCharacterClick(character),
            "data-character-id": character.Id,
            "data-level": character.Level
          }, h("img", {
            src: normalizeAvatar(character.Icon),
            alt: character.Name,
            className: "h-16 w-16 rounded-md object-cover object-top"
          }), h("div", {
            className: "flex flex-1 flex-col gap-1"
          }, h("div", {
            className: "flex items-center gap-2"
          }, h(LevelBadge, {
            level: character.Level,
            zeroCount: character.ZeroCount
          }), h("span", {
            className: "text-sm"
          }, "#", character.Id, "「", character.Name, "」")), h("div", {
            className: "flex flex-col gap-0.5 text-xs opacity-60"
          }, h("div", {
            className: "flex gap-3"
          }, h("span", null, "可用：", character.UserAmount), h("span", null, "持股：", character.UserTotal)), h("div", null, "固定资产：", character.Sacrifices))));
          listDiv.appendChild(itemDiv);
        });
        contentDiv.appendChild(listDiv);
      }
      if (!loading && characters && characters.length === 0) {
        const emptyDiv = h("div", {
          className: "py-8 text-center text-sm opacity-60"
        }, "未找到相关角色");
        contentDiv.appendChild(emptyDiv);
      }
      if (!loading && !isSearchMode && totalPages > 1) {
        const paginationDiv = h("div", {
          id: "tg-character-search-pagination",
          className: "flex justify-center"
        }, h(Pagination, {
          current: Number(currentPage) || 1,
          total: Number(totalPages),
          onChange: handlePageChange
        }));
        contentDiv.appendChild(paginationDiv);
      }
      return contentDiv;
    });
    const loadCharacters = page => {
      setState({
        loading: true
      });
      getUserCharas(username, page).then(result => {
        if (result.success) {
          setState({
            characters: result.data.items,
            currentPage: result.data.currentPage,
            totalPages: result.data.totalPages,
            loading: false
          });
        } else {
          setState({
            characters: [],
            loading: false
          });
        }
      });
    };
    const loadSearchResults = keyword => {
      setState({
        loading: true
      });
      searchCharacter(keyword).then(result => {
        if (result.success) {
          setState({
            characters: result.data || [],
            loading: false
          });
        } else {
          setState({
            characters: [],
            loading: false
          });
        }
      });
    };
    loadCharacters(1);
    return container;
  }

  function Guidepost({
    temple,
    character,
    onSuccess
  }) {
    const handleGuidepost = async () => {
      try {
        const result = await guidepost(temple.CharacterId, character.Id);
        if (!result.success) {
          alert(result.message);
          return;
        }
        const count = result.data.Amount;
        const price = formatNumber(count * result.data.SellPrice, 0);
        alert(`成功获取「${character.Name}」${count}股，市值₵${price}`);
        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        console.error("虚空道标失败:", error);
        alert("虚空道标失败");
      }
    };
    return h("div", {
      id: "tg-guidepost",
      "data-temple-character-id": temple.CharacterId,
      "data-target-character-id": character.Id,
      className: "flex flex-col gap-4"
    }, h("div", {
      id: "tg-guidepost-content",
      className: "flex items-center justify-center gap-4"
    }, h("div", {
      id: "tg-guidepost-temple",
      className: "w-[120px]",
      "data-character-id": temple.CharacterId
    }, h(Temple, {
      temple: temple
    })), h("div", {
      id: "tg-guidepost-arrow",
      className: "flex-shrink-0 opacity-60"
    }, h(ArrowBigRightIcon, {
      className: "h-6 w-6"
    })), h("div", {
      id: "tg-guidepost-character",
      className: "flex flex-col items-center gap-1",
      "data-character-id": character.Id
    }, h("img", {
      src: normalizeAvatar(character.Icon),
      alt: character.Name,
      className: "h-20 w-20 rounded-md object-cover object-top"
    }), h("div", {
      className: "text-xs opacity-60"
    }, "持股：", character.UserTotal))), h("div", {
      id: "tg-guidepost-description",
      className: "text-center text-sm opacity-80"
    }, "消耗「", temple.Name, "」100固定资产获取「", character.Name, "」的随机数量（10-100）股份"), h("div", {
      id: "tg-guidepost-action",
      className: "flex justify-center"
    }, h(Button, {
      variant: "solid",
      onClick: handleGuidepost
    }, "POST")));
  }

  function Fisheye({
    temple,
    character,
    onSuccess
  }) {
    const handleFisheye = async () => {
      try {
        const result = await fisheye(temple.CharacterId, character.Id);
        if (!result.success) {
          alert(result.message);
          return;
        }
        alert(result.data);
        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        console.error("鲤鱼之眼失败:", error);
        alert("鲤鱼之眼失败");
      }
    };
    return h("div", {
      id: "tg-fisheye",
      "data-temple-character-id": temple.CharacterId,
      "data-target-character-id": character.Id,
      className: "flex flex-col gap-4"
    }, h("div", {
      id: "tg-fisheye-content",
      className: "flex items-center justify-center gap-4"
    }, h("div", {
      id: "tg-fisheye-temple",
      className: "w-[120px]",
      "data-character-id": temple.CharacterId
    }, h(Temple, {
      temple: temple
    })), h("div", {
      id: "tg-fisheye-arrow",
      className: "flex-shrink-0 opacity-60"
    }, h(ArrowBigRightIcon, {
      className: "w-6 h-6"
    })), h("div", {
      id: "tg-fisheye-character",
      className: "flex flex-col items-center gap-1",
      "data-character-id": character.Id
    }, h("img", {
      src: normalizeAvatar(character.Icon),
      alt: character.Name,
      className: "h-20 w-20 rounded-md object-cover object-top"
    }), h("div", {
      className: "text-xs opacity-60"
    }, "持股：", character.UserTotal))), h("div", {
      id: "tg-fisheye-description",
      className: "text-sm text-center opacity-80"
    }, "消耗「", temple.Name, "」100固定资产将「", character.Name, "」的部分股份转移到英灵殿"), h("div", {
      id: "tg-fisheye-action",
      className: "flex justify-center"
    }, h(Button, {
      variant: "solid",
      onClick: handleFisheye
    }, "TRANSFER")));
  }

  function Stardust({
    temple,
    character,
    onSuccess
  }) {
    let inputElement = null;
    const handleStardust = async () => {
      const amount = inputElement?.value?.trim();
      if (!amount || isNaN(amount) || Number(amount) <= 0) {
        alert("请输入有效的数量");
        return;
      }
      try {
        const result = await stardust(character.Id, temple.CharacterId, Number(amount));
        if (!result.success) {
          alert(result.message);
          return;
        }
        alert(result.data);
        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        console.error("星光碎片失败:", error);
        alert("星光碎片失败");
      }
    };
    const input = h("input", {
      type: "number",
      className: "mx-1 w-20 rounded border border-gray-300 px-2 py-1 text-center text-sm focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800",
      placeholder: "数量",
      min: "1"
    });
    inputElement = input;
    return h("div", {
      id: "tg-stardust",
      className: "flex flex-col gap-4"
    }, h("div", {
      id: "tg-stardust-content",
      className: "flex items-center justify-center gap-4"
    }, h("div", {
      className: "flex flex-col items-center gap-1"
    }, h("img", {
      src: normalizeAvatar(character.Icon),
      alt: character.Name,
      className: "h-20 w-20 rounded-md object-cover object-top"
    }), h("div", {
      className: "text-xs opacity-60"
    }, "持股：", character.UserTotal)), h("div", {
      className: "flex-shrink-0 opacity-60"
    }, h(ArrowBigRightIcon, {
      className: "h-6 w-6"
    })), h("div", {
      className: "w-[120px]"
    }, h(Temple, {
      temple: temple
    }))), h("div", {
      id: "tg-stardust-input",
      className: "flex flex-col items-center gap-2"
    }, h("div", {
      className: "text-center text-sm opacity-80"
    }, "消耗「", character.Name, "」", input, "股补充「", temple.Name, "」的固定资产")), h("div", {
      id: "tg-stardust-submit",
      className: "flex justify-center"
    }, h(Button, {
      variant: "solid",
      onClick: handleStardust
    }, "CONVERT")));
  }

  function Attack({
    temple,
    character,
    onSuccess
  }) {
    const handleAttack = async () => {
      try {
        const result = await starbreak(temple.CharacterId, character.Id);
        if (!result.success) {
          alert(result.message);
          return;
        }
        alert(result.data);
        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        console.error("闪光结晶失败:", error);
        alert("闪光结晶失败");
      }
    };
    return h("div", {
      id: "tg-attack",
      "data-temple-character-id": temple.CharacterId,
      "data-character-id": character.Id,
      className: "flex flex-col gap-4"
    }, h("div", {
      className: "flex items-center justify-center gap-4"
    }, h("div", {
      className: "w-[120px]"
    }, h(Temple, {
      temple: temple
    })), h("div", {
      className: "flex-shrink-0 opacity-60"
    }, h(ArrowBigRightIcon, {
      className: "h-6 w-6"
    })), h("div", {
      className: "flex flex-col items-center gap-1"
    }, h("img", {
      src: normalizeAvatar(character.Icon),
      alt: character.Name,
      className: "h-20 w-20 rounded-md object-cover object-top"
    }), h("div", {
      className: "text-xs opacity-60"
    }, "星之力：", character.StarForces))), h("div", {
      className: "text-center text-sm opacity-80"
    }, "消耗「", temple.Name, "」100固定资产攻击「", character.Name, "」的星之力"), h("div", {
      className: "flex justify-center"
    }, h(Button, {
      variant: "solid",
      onClick: handleAttack
    }, "ATTACK")));
  }

  function StarForces({
    temple,
    onSuccess
  }) {
    let amount = 500;
    const amountInput = h("input", {
      type: "number",
      className: "tg-bg-content rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500 dark:border-gray-600",
      placeholder: "请输入数量",
      value: 100,
      onInput: e => {
        amount = Number(e.target.value);
      },
      min: "0",
      step: "1"
    });
    const descriptionDiv = h("div", {
      className: "rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
    }, "将固定资产转化为星之力。");
    const statusDiv = h("div", null);
    const updateStatus = (msg, type) => {
      if (msg) {
        let className = "rounded-lg px-3 py-2 text-xs ";
        if (type === "success") {
          className += "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
        } else if (type === "error") {
          className += "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
        } else {
          className += "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
        }
        statusDiv.className = className;
        statusDiv.textContent = msg;
        statusDiv.style.display = "block";
      } else {
        statusDiv.style.display = "none";
      }
    };
    const handleSubmit = async () => {
      if (!amount || isNaN(amount) || amount <= 0) {
        updateStatus("请输入有效的数量", "error");
        return;
      }
      updateStatus("处理中...", "");
      const result = await convertStarForces(temple.CharacterId, amount);
      if (result.success) {
        updateStatus(result.data, "success");
        if (onSuccess) {
          onSuccess(amount);
        }
      } else {
        updateStatus(result.message, "error");
      }
    };
    statusDiv.style.display = "none";
    const submitButton = h(Button, {
      onClick: handleSubmit
    }, "确定");
    return h("div", {
      id: "tg-star-forces",
      className: "flex min-w-64 flex-col gap-4"
    }, descriptionDiv, h("div", {
      id: "tg-star-forces-amount-input",
      className: "flex flex-col gap-2"
    }, amountInput), statusDiv, h("div", {
      id: "tg-star-forces-submit",
      className: "flex justify-end"
    }, submitButton));
  }

  function ScratchCardItem({
    chara,
    onSell,
    onFinance,
    onCharge,
    onCharacterClick,
    index,
    hasRevealed,
    chargedCardIds
  }) {
    const cover = getLargeCover(chara.Cover);
    const isCharged = chargedCardIds.includes(chara.Id);
    const inner = h("div", {
      className: "relative aspect-[3/4]",
      style: {
        transformStyle: "preserve-3d",
        WebkitTransformStyle: "preserve-3d",
        transition: "transform 0.7s ease-in-out",
        WebkitTransition: "transform 0.7s ease-in-out",
        transform: "translateZ(0)",
        WebkitTransform: "translateZ(0)"
      }
    }, h("div", {
      className: "absolute inset-0 rounded-lg bg-cover bg-center shadow-lg",
      style: {
        backgroundImage: "url(https://tinygrail.mange.cn/image/tinygrail_card2.png!w240)",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: "rotateY(0deg) translateZ(1px)",
        WebkitTransform: "rotateY(0deg) translateZ(1px)"
      }
    }), h("div", {
      className: "absolute inset-0 rounded-lg shadow-lg",
      style: {
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: "rotateY(180deg) translateZ(1px)",
        WebkitTransform: "rotateY(180deg) translateZ(1px)"
      }
    }, h("div", {
      className: "h-full w-full rounded-lg bg-cover bg-center",
      style: {
        backgroundImage: `url(${cover})`
      }
    }, h("div", {
      className: "absolute left-2 top-2"
    }, h(LevelBadge, {
      level: chara.Level,
      zeroCount: chara.ZeroCount,
      size: "md"
    })), h("div", {
      className: "absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm"
    }, "₵", formatNumber(chara.CurrentPrice, 0)))));
    const nameSpan = h("span", {
      className: "tg-link min-w-0 flex-1 cursor-pointer truncate text-sm font-medium opacity-80 transition-opacity duration-300 hover:opacity-100",
      onClick: e => {
        e.stopPropagation();
        onCharacterClick && onCharacterClick(chara.Id);
      }
    }, "???");
    const actions = h("div", {
      className: "mb-0.5 mt-2 flex flex-col gap-1 overflow-hidden transition-all duration-300",
      style: {
        maxHeight: "0",
        opacity: "0"
      }
    }, chara.SellPrice > 0 && chara.SellAmount > 0 && h(Button, {
      variant: "solid",
      size: "sm",
      className: "w-full",
      onClick: e => {
        e.stopPropagation();
        onSell && onSell(chara);
      }
    }, "出售 (₵", formatNumber(chara.SellPrice, 0), ")"), chara.Amount > 0 && h(Button, {
      variant: "outline",
      size: "sm",
      className: "w-full",
      onClick: e => {
        e.stopPropagation();
        onFinance && onFinance(chara);
      }
    }, "融资"), chara.Amount > 0 && !isCharged && h(Button, {
      variant: "outline",
      size: "sm",
      className: "w-full",
      onClick: e => {
        e.stopPropagation();
        onCharge && onCharge(chara);
      }
    }, "充能"));
    const cardContainer = h("div", {
      id: "tg-scratch-card-item",
      "data-character-id": chara.Id,
      className: "relative w-40",
      "data-id": chara.Id,
      style: {
        perspective: "1000px",
        WebkitPerspective: "1000px"
      }
    }, inner, h("div", {
      className: "mt-2 flex items-center justify-between gap-2"
    }, nameSpan, h("span", {
      className: "flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium dark:bg-gray-800"
    }, "×", chara.Amount)), actions);
    if (!hasRevealed) {
      const delay = 500 + index * 300;
      setTimeout(() => {
        inner.style.transform = "rotateY(180deg)";
        inner.style.WebkitTransform = "rotateY(180deg)";
        setTimeout(() => {
          nameSpan.textContent = chara.Name;
          actions.style.maxHeight = "200px";
          actions.style.opacity = "1";
        }, 350);
      }, delay);
    } else {
      inner.style.transform = "rotateY(180deg)";
      inner.style.WebkitTransform = "rotateY(180deg)";
      nameSpan.textContent = chara.Name;
      actions.style.maxHeight = "200px";
      actions.style.opacity = "1";
    }
    return cardContainer;
  }

  function ScratchCard({
    charas,
    onSell,
    onFinance,
    onCharge
  }) {
    const container = h("div", {
      id: "tg-scratch-card",
      className: "flex min-w-80 flex-wrap justify-evenly gap-4 p-4"
    });
    let generatedChargeModalId = null;
    let generatedChargeConfirmModalId = null;
    let generatedCharacterModalId = null;
    let hasRevealed = false;
    let currentCardData = charas || [];
    const {
      setState} = createMountedComponent(container, state => {
      const {
        cardData = charas || [],
        showChargeModal = false,
        showChargeConfirmModal = false,
        showCharacterModal = false,
        selectedChargeCharacter = null,
        selectedChargeTemple = null,
        characterModalId = null,
        chargedCardIds = []
      } = state || {};
      if (cardData.length === 0) {
        return h("div", {
          className: "text-center text-sm opacity-60"
        }, "暂无角色");
      }
      const isModalExist = modalId => {
        return modalId && document.querySelector(`#tg-modal[data-modal-id="${modalId}"]`)?.parentNode === document.body;
      };
      return h("div", {
        className: "contents"
      }, cardData.map((chara, index) => {
        const card = h(ScratchCardItem, {
          chara: chara,
          onSell: handleSell,
          onFinance: handleFinance,
          onCharge: handleChargeClick,
          onCharacterClick: handleCharacterClick,
          index: index,
          hasRevealed: hasRevealed,
          chargedCardIds: chargedCardIds
        });
        if (index === cardData.length - 1 && !hasRevealed) {
          hasRevealed = true;
        }
        return card;
      }), showChargeModal && !isModalExist(generatedChargeModalId) && h(Modal, {
        visible: showChargeModal,
        onClose: closeChargeModal,
        title: "选择「星光碎片」充能的目标",
        modalId: generatedChargeModalId,
        maxWidth: 640,
        getModalId: id => {
          generatedChargeModalId = id;
        }
      }, h(TempleSearch, {
        username: getCurrentUsername(),
        onTempleClick: handleTempleSelect
      })), showChargeConfirmModal && !isModalExist(generatedChargeConfirmModalId) && h(Modal, {
        visible: showChargeConfirmModal,
        onClose: closeChargeConfirmModal,
        title: "确定「星光碎片」充能的目标",
        position: "center",
        maxWidth: 480,
        modalId: generatedChargeConfirmModalId,
        getModalId: id => {
          generatedChargeConfirmModalId = id;
        }
      }, h(Stardust, {
        temple: selectedChargeTemple,
        character: selectedChargeCharacter,
        onSuccess: () => {
          setState({
            chargedCardIds: [...chargedCardIds, selectedChargeCharacter.Id]
          });
          closeChargeConfirmModal();
          closeChargeModal();
        }
      })), showCharacterModal && characterModalId && !isModalExist(generatedCharacterModalId) && h(Modal, {
        visible: showCharacterModal,
        onClose: () => setState({
          showCharacterModal: false
        }),
        modalId: generatedCharacterModalId,
        getModalId: id => {
          generatedCharacterModalId = id;
        }
      }, h(CharacterBox, {
        characterId: characterModalId,
        sticky: true,
        stickyTop: -16
      })));
    });
    const getCurrentUsername = () => {
      try {
        const cachedUserAssets = localStorage.getItem("tinygrail:user-assets");
        if (cachedUserAssets) {
          const userAssets = JSON.parse(cachedUserAssets);
          return userAssets.name || "";
        }
      } catch (e) {
        console.warn("读取用户资产缓存失败:", e);
      }
      return "";
    };
    const handleSell = async chara => {
      try {
        const result = await askCharacter(chara.Id, chara.SellPrice, chara.SellAmount);
        if (!result.success) {
          alert(result.message);
          return;
        }
        const updatedCards = currentCardData.map(card => {
          if (card.Id === chara.Id) {
            const restAmount = card.Amount - chara.SellAmount;
            return {
              ...card,
              Amount: restAmount,
              SellAmount: 0,
              SellPrice: 0
            };
          }
          return card;
        });
        currentCardData = updatedCards;
        setState({
          cardData: updatedCards
        });
        alert(`出售完成：获得资金 ₵${formatNumber(chara.SellPrice * chara.SellAmount, 0)}`);
        if (onSell) {
          onSell(chara);
        }
      } catch (error) {
        console.error("出售失败:", error);
        alert("出售失败");
      }
    };
    const handleFinance = async chara => {
      try {
        const result = await sacrificeCharacter(chara.Id, chara.Amount, true);
        if (!result.success) {
          alert(result.message);
          return;
        }
        const updatedCards = currentCardData.map(card => {
          if (card.Id === chara.Id) {
            return {
              ...card,
              Amount: 0,
              SellAmount: 0,
              SellPrice: 0
            };
          }
          return card;
        });
        currentCardData = updatedCards;
        setState({
          cardData: updatedCards
        });
        alert(`融资完成：获得资金 ₵${formatNumber(result.data.Balance, 0)}`);
        if (onFinance) {
          onFinance(chara);
        }
      } catch (error) {
        console.error("融资失败:", error);
        alert("融资失败");
      }
    };
    const handleChargeClick = async chara => {
      const username = getCurrentUsername();
      if (!username) {
        alert("无法获取用户名");
        return;
      }
      const result = await getUserCharacterByUsername(chara.Id, username);
      if (!result.success) {
        alert(result.message || "获取角色数据失败");
        return;
      }
      const mergedCharacter = {
        ...result.data,
        Id: result.data.CharacterId,
        Name: chara.Name,
        Icon: chara.Cover,
        UserTotal: result.data.Total,
        UserAmount: result.data.Amount
      };
      setState({
        selectedChargeCharacter: mergedCharacter,
        showChargeModal: true
      });
    };
    const closeChargeModal = () => {
      closeModalById(generatedChargeModalId);
      setState({
        showChargeModal: false
      });
    };
    const handleTempleSelect = temple => {
      setState({
        selectedChargeTemple: temple,
        showChargeConfirmModal: true
      });
    };
    const closeChargeConfirmModal = () => {
      closeModalById(generatedChargeConfirmModalId);
      setState({
        showChargeConfirmModal: false
      });
    };
    const handleCharacterClick = characterId => {
      setState({
        showCharacterModal: true,
        characterModalId: characterId
      });
    };
    setState({
      cardData: charas || []
    });
    return container;
  }

  function TempleDetail({
    temple,
    characterName,
    imageOnly = false
  }) {
    const minWidth = 480;
    const container = h("div", {
      id: "tg-temple-detail",
      "data-character-id": temple.CharacterId,
      className: "tg-bg-content",
      style: {
        width: `${minWidth}px`
      }
    });
    let generatedLineModalId = null;
    let generatedLinkModalId = null;
    let generatedLinkConfirmModalId = null;
    let generatedPostModalId = null;
    let generatedPostConfirmModalId = null;
    let generatedFisheyeModalId = null;
    let generatedFisheyeConfirmModalId = null;
    let generatedStardustModalId = null;
    let generatedStardustConfirmModalId = null;
    let generatedAttackModalId = null;
    let generatedAttackConfirmModalId = null;
    let generatedStarForcesModalId = null;
    let generatedChaosCubeModalId = null;
    let hasSetWidth = false;
    const isModalExist = modalId => {
      return modalId && document.querySelector(`#tg-modal[data-modal-id="${modalId}"]`)?.parentNode === document.body;
    };
    const {
      setState} = createMountedComponent(container, state => {
      const {
        templeData = temple,
        imageUrl = temple.Cover ? getLargeCover(temple.Cover) : normalizeAvatar(temple.Avatar),
        containerWidth = minWidth,
        showLineModal = false,
        showLinkModal = false,
        showLinkConfirmModal = false,
        showPostModal = false,
        showPostConfirmModal = false,
        showFisheyeModal = false,
        showFisheyeConfirmModal = false,
        showStardustModal = false,
        showStardustConfirmModal = false,
        showAttackModal = false,
        showAttackConfirmModal = false,
        showStarForcesModal = false,
        showChaosCubeModal = false,
        currentLine = temple.Line || "",
        selectedTemple = null,
        selectedPostCharacter = null,
        selectedFisheyeCharacter = null,
        selectedStardustCharacter = null,
        selectedAttackCharacter = null,
        chaosCubeData = []
      } = state || {};
      container.style.width = `${containerWidth}px`;
      container.style.maxWidth = "100%";
      let currentSelectedTemple = null;
      const handleImageLoad = width => {
        if (!hasSetWidth && width !== minWidth) {
          hasSetWidth = true;
          setState({
            containerWidth: width
          });
        }
      };
      const handleChangeCover = async () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async e => {
          const file = e.target.files[0];
          if (!file) return;
          if (!/image/.test(file.type)) {
            alert("请选择图片文件");
            return;
          }
          try {
            const reader = new FileReader();
            reader.onload = async ev => {
              const dataUrl = ev.target.result;
              const hash = await hashDataURL(dataUrl);
              const blob = dataURLtoBlob(dataUrl);
              const ossUrl = buildOssUrl("cover", hash, "jpg");
              const signatureResult = await getOssSignature("cover", hash, encodeURIComponent(file.type));
              if (!signatureResult.success) {
                alert(signatureResult.message || "获取签名失败");
                return;
              }
              const uploadResult = await uploadToOss(ossUrl, blob, signatureResult.data);
              if (!uploadResult.success) {
                alert(uploadResult.message || "上传失败");
                return;
              }
              const changeResult = await changeTempleCover(templeData.CharacterId, ossUrl);
              if (!changeResult.success) {
                alert(changeResult.message || "更换封面失败");
                return;
              }
              alert("更换封面成功");
              setState({
                imageUrl: dataUrl
              });
            };
            reader.readAsDataURL(file);
          } catch (error) {
            console.error("更换封面失败:", error);
            alert("更换封面失败");
          }
        };
        input.click();
      };
      const handleResetCover = async () => {
        if (!confirm("确定要重置封面吗？")) {
          return;
        }
        try {
          const result = await resetTempleCover(templeData.CharacterId, templeData.UserId);
          if (!result.success) {
            alert(result.message || "重置封面失败");
            return;
          }
          alert("重置封面成功");
          const newImageUrl = result.data.Cover ? getLargeCover(result.data.Cover) : normalizeAvatar(templeData.Avatar);
          setState({
            imageUrl: newImageUrl
          });
        } catch (error) {
          console.error("重置封面失败:", error);
          alert("重置封面失败");
        }
      };
      const handleChangeLine = () => {
        setState({
          showLineModal: true
        });
      };
      const closeLineModal = () => {
        closeModalById(generatedLineModalId);
        setState({
          showLineModal: false
        });
      };
      const handleLineSubmit = async newLine => {
        const trimmedLine = newLine.trim();
        try {
          const result = await changeTempleLine(templeData.CharacterId, trimmedLine);
          if (!result.success) {
            alert(result.message || "修改台词失败");
            return;
          }
          alert(result.Value || "修改台词成功");
          closeLineModal();
          setState({
            currentLine: trimmedLine
          });
        } catch (error) {
          console.error("修改台词失败:", error);
          alert("修改台词失败");
        }
      };
      const handleLink = () => {
        setState({
          showLinkModal: true
        });
      };
      const closeLinkModal = () => {
        closeModalById(generatedLinkModalId);
        setState({
          showLinkModal: false
        });
      };
      const handleRefine = async () => {
        const cost = Math.pow(1.3, templeData.Refine) * 10000;
        if (!confirm(`确定要消耗1股固定资产和${formatNumber(cost, 0)}cc进行精炼？`)) {
          return;
        }
        try {
          const result = await refineCharacter(templeData.CharacterId);
          if (!result.success) {
            alert(result.message);
            return;
          }
          alert(result.data);
          if (result.data.indexOf("成功") !== -1) {
            setState({
              templeData: {
                ...templeData,
                Refine: templeData.Refine + 1,
                Assets: templeData.Assets - 1
              }
            });
          } else if (result.data.indexOf("失败") !== -1) {
            setState({
              templeData: {
                ...templeData,
                Refine: 0,
                Assets: templeData.Assets - 1
              }
            });
          }
        } catch (error) {
          console.error("精炼失败:", error);
          alert("精炼失败");
        }
      };
      const openPostSearchModal = () => {
        setState({
          showPostModal: true
        });
      };
      const closePostSearchModal = () => {
        closeModalById(generatedPostModalId);
        setState({
          showPostModal: false
        });
      };
      const handlePostCharacterSelect = character => {
        setState({
          selectedPostCharacter: character,
          showPostConfirmModal: true
        });
      };
      const closePostConfirmModal = () => {
        closeModalById(generatedPostConfirmModalId);
        setState({
          showPostConfirmModal: false
        });
      };
      const openFisheyeSearchModal = () => {
        setState({
          showFisheyeModal: true
        });
      };
      const closeFisheyeSearchModal = () => {
        closeModalById(generatedFisheyeModalId);
        setState({
          showFisheyeModal: false
        });
      };
      const handleFisheyeCharacterSelect = character => {
        setState({
          selectedFisheyeCharacter: character,
          showFisheyeConfirmModal: true
        });
      };
      const closeFisheyeConfirmModal = () => {
        closeModalById(generatedFisheyeConfirmModalId);
        setState({
          showFisheyeConfirmModal: false
        });
      };
      const openStardustSearchModal = () => {
        setState({
          showStardustModal: true
        });
      };
      const closeStardustSearchModal = () => {
        closeModalById(generatedStardustModalId);
        setState({
          showStardustModal: false
        });
      };
      const handleStardustCharacterSelect = character => {
        setState({
          selectedStardustCharacter: character,
          showStardustConfirmModal: true
        });
      };
      const closeStardustConfirmModal = () => {
        closeModalById(generatedStardustConfirmModalId);
        setState({
          showStardustConfirmModal: false
        });
      };
      const openAttackSearchModal = () => {
        setState({
          showAttackModal: true
        });
      };
      const closeAttackSearchModal = () => {
        closeModalById(generatedAttackModalId);
        setState({
          showAttackModal: false
        });
      };
      const handleAttackCharacterSelect = character => {
        setState({
          selectedAttackCharacter: character,
          showAttackConfirmModal: true
        });
      };
      const closeAttackConfirmModal = () => {
        closeModalById(generatedAttackConfirmModalId);
        setState({
          showAttackConfirmModal: false
        });
      };
      const openStarForcesModal = () => {
        setState({
          showStarForcesModal: true
        });
      };
      const closeStarForcesModal = () => {
        closeModalById(generatedStarForcesModalId);
        setState({
          showStarForcesModal: false
        });
      };
      const openChaosCubeModal = async () => {
        if (!confirm("确定消耗10点资产值使用1个「混沌魔方」？")) {
          return;
        }
        try {
          const result = await chaosCube(templeData.CharacterId);
          if (!result.success) {
            alert(result.message);
            return;
          }
          const cardData = [result.data];
          setState({
            templeData: {
              ...templeData,
              Assets: templeData.Assets - 10
            },
            chaosCubeData: cardData,
            showChaosCubeModal: true
          });
        } catch (error) {
          console.error("混沌魔方使用失败:", error);
          alert("混沌魔方使用失败");
        }
      };
      const closeChaosCubeModal = () => {
        closeModalById(generatedChaosCubeModalId);
        setState({
          showChaosCubeModal: false
        });
      };
      const handleDestroy = async () => {
        if (!confirm("拆除操作不可逆，请谨慎确认，确定要拆除圣殿？")) {
          return;
        }
        try {
          const result = await destroyTemple(templeData.CharacterId);
          if (!result.success) {
            alert(result.message);
            return;
          }
          alert(result.data || "圣殿拆除成功");
        } catch (error) {
          console.error("拆除圣殿失败:", error);
          alert("拆除圣殿失败");
        }
      };
      const handleTempleSelect = selectedTemple => {
        currentSelectedTemple = selectedTemple;
        setState({
          selectedTemple,
          showLinkConfirmModal: true
        });
      };
      const closeLinkConfirmModal = () => {
        closeModalById(generatedLinkConfirmModalId);
        setState({
          showLinkConfirmModal: false
        });
      };
      const handleConfirmLink = async () => {
        if (!currentSelectedTemple) return;
        try {
          const result = await linkTemples(templeData.CharacterId, currentSelectedTemple.CharacterId);
          if (!result.success) {
            alert(result.message);
            return;
          }
          alert(result.data);
          closeLinkConfirmModal();
          closeLinkModal();
        } catch (error) {
          console.error("链接失败:", error);
          alert("链接失败");
        }
      };
      const getCurrentUsername = () => {
        try {
          const cachedUserAssets = localStorage.getItem("tinygrail:user-assets");
          if (cachedUserAssets) {
            const userAssets = JSON.parse(cachedUserAssets);
            return userAssets.name || "";
          }
        } catch (e) {
          console.warn("读取用户资产缓存失败:", e);
        }
        return "";
      };
      return h(Fragment, null, h(TempleImage, {
        imageUrl: imageUrl,
        characterName: characterName,
        line: currentLine,
        onLoad: handleImageLoad
      }), !imageOnly && h(Fragment, null, h(TempleInfo, {
        templeData: templeData
      }), h(TempleActions, {
        temple: templeData,
        onChangeCover: handleChangeCover,
        onResetCover: handleResetCover,
        onChangeLine: handleChangeLine,
        onLink: handleLink,
        onRefine: handleRefine,
        onPost: openPostSearchModal,
        onFisheye: openFisheyeSearchModal,
        onStardust: openStardustSearchModal,
        onAttack: openAttackSearchModal,
        onStarForces: openStarForcesModal,
        onChaosCube: openChaosCubeModal,
        onDestroy: handleDestroy
      })), showLineModal && !isModalExist(generatedLineModalId) && h(Modal, {
        visible: showLineModal,
        onClose: closeLineModal,
        title: "修改台词",
        position: "center",
        maxWidth: 640,
        modalId: generatedLineModalId,
        getModalId: id => {
          generatedLineModalId = id;
        }
      }, h(TempleLineEditor, {
        currentLine: currentLine,
        onSubmit: handleLineSubmit,
        onCancel: closeLineModal
      })), showLinkModal && !isModalExist(generatedLinkModalId) && h(Modal, {
        visible: showLinkModal,
        onClose: closeLinkModal,
        title: "选择你想要「连接」的圣殿",
        modalId: generatedLinkModalId,
        getModalId: id => {
          generatedLinkModalId = id;
        }
      }, h(TempleSearch, {
        username: getCurrentUsername(),
        onTempleClick: handleTempleSelect
      })), showLinkConfirmModal && !isModalExist(generatedLinkConfirmModalId) && h(Modal, {
        visible: showLinkConfirmModal,
        onClose: closeLinkConfirmModal,
        title: "确定「连接」的圣殿",
        position: "center",
        maxWidth: 240,
        modalId: generatedLinkConfirmModalId,
        getModalId: id => {
          generatedLinkConfirmModalId = id;
        }
      }, h("div", {
        className: "flex flex-col items-center gap-4"
      }, h(TempleLink, {
        temple1: templeData,
        temple2: selectedTemple,
        sort: false,
        size: "small"
      }), h("div", {
        className: "flex gap-2"
      }, h(Button, {
        variant: "outline",
        onClick: closeLinkConfirmModal
      }, "取消"), h(Button, {
        variant: "solid",
        onClick: handleConfirmLink
      }, "确定")))), showPostModal && !isModalExist(generatedPostModalId) && h(Modal, {
        visible: showPostModal,
        onClose: closePostSearchModal,
        title: "选择「虚空道标」获取的目标",
        modalId: generatedPostModalId,
        maxWidth: 640,
        getModalId: id => {
          generatedPostModalId = id;
        }
      }, h(CharacterSearch, {
        username: getCurrentUsername(),
        onCharacterClick: handlePostCharacterSelect
      })), showPostConfirmModal && !isModalExist(generatedPostConfirmModalId) && h(Modal, {
        visible: showPostConfirmModal,
        onClose: closePostConfirmModal,
        title: "确定「虚空道标」获取的目标",
        position: "center",
        maxWidth: 480,
        modalId: generatedPostConfirmModalId,
        getModalId: id => {
          generatedPostConfirmModalId = id;
        }
      }, h(Guidepost, {
        temple: templeData,
        character: selectedPostCharacter,
        onSuccess: () => {
          setState({
            templeData: {
              ...templeData,
              Assets: templeData.Assets - 100
            }
          });
          closePostConfirmModal();
        }
      })), showFisheyeModal && !isModalExist(generatedFisheyeModalId) && h(Modal, {
        visible: showFisheyeModal,
        onClose: closeFisheyeSearchModal,
        title: "选择「鲤鱼之眼」获取的目标",
        modalId: generatedFisheyeModalId,
        maxWidth: 640,
        getModalId: id => {
          generatedFisheyeModalId = id;
        }
      }, h(CharacterSearch, {
        username: getCurrentUsername(),
        onCharacterClick: handleFisheyeCharacterSelect
      })), showFisheyeConfirmModal && !isModalExist(generatedFisheyeConfirmModalId) && h(Modal, {
        visible: showFisheyeConfirmModal,
        onClose: closeFisheyeConfirmModal,
        title: "确定「鲤鱼之眼」获取的目标",
        position: "center",
        maxWidth: 480,
        modalId: generatedFisheyeConfirmModalId,
        getModalId: id => {
          generatedFisheyeConfirmModalId = id;
        }
      }, h(Fisheye, {
        temple: templeData,
        character: selectedFisheyeCharacter,
        onSuccess: () => {
          setState({
            templeData: {
              ...templeData,
              Assets: templeData.Assets - 100
            }
          });
          closeFisheyeConfirmModal();
          closeFisheyeSearchModal();
        }
      })), showStardustModal && !isModalExist(generatedStardustModalId) && h(Modal, {
        visible: showStardustModal,
        onClose: closeStardustSearchModal,
        title: "选择「星光碎片」消耗的目标",
        modalId: generatedStardustModalId,
        maxWidth: 640,
        getModalId: id => {
          generatedStardustModalId = id;
        }
      }, h(CharacterSearch, {
        username: getCurrentUsername(),
        onCharacterClick: handleStardustCharacterSelect
      })), showStardustConfirmModal && !isModalExist(generatedStardustConfirmModalId) && h(Modal, {
        visible: showStardustConfirmModal,
        onClose: closeStardustConfirmModal,
        title: "确定「星光碎片」消耗的目标",
        position: "center",
        maxWidth: 480,
        modalId: generatedStardustConfirmModalId,
        getModalId: id => {
          generatedStardustConfirmModalId = id;
        }
      }, h(Stardust, {
        temple: templeData,
        character: selectedStardustCharacter,
        onSuccess: () => {
          closeStardustConfirmModal();
          closeStardustSearchModal();
        }
      })), showAttackModal && !isModalExist(generatedAttackModalId) && h(Modal, {
        visible: showAttackModal,
        onClose: closeAttackSearchModal,
        title: "选择「闪光结晶」攻击的目标",
        modalId: generatedAttackModalId,
        maxWidth: 640,
        getModalId: id => {
          generatedAttackModalId = id;
        }
      }, h(CharacterSearch, {
        username: getCurrentUsername(),
        onCharacterClick: handleAttackCharacterSelect
      })), showAttackConfirmModal && !isModalExist(generatedAttackConfirmModalId) && h(Modal, {
        visible: showAttackConfirmModal,
        onClose: closeAttackConfirmModal,
        title: "确定「闪光结晶」攻击的目标",
        position: "center",
        maxWidth: 480,
        modalId: generatedAttackConfirmModalId,
        getModalId: id => {
          generatedAttackConfirmModalId = id;
        }
      }, h(Attack, {
        temple: templeData,
        character: selectedAttackCharacter,
        onSuccess: () => {
          setState({
            templeData: {
              ...templeData,
              Assets: templeData.Assets - 100
            }
          });
          closeAttackConfirmModal();
          closeAttackSearchModal();
        }
      })), showStarForcesModal && !isModalExist(generatedStarForcesModalId) && h(Modal, {
        visible: showStarForcesModal,
        onClose: closeStarForcesModal,
        title: "转化星之力",
        position: "center",
        maxWidth: 400,
        modalId: generatedStarForcesModalId,
        getModalId: id => {
          generatedStarForcesModalId = id;
        }
      }, h(StarForces, {
        temple: templeData,
        onSuccess: amount => {
          setState({
            templeData: {
              ...templeData,
              Assets: Math.max(0, templeData.Assets - amount)
            }
          });
          closeStarForcesModal();
        }
      })), showChaosCubeModal && !isModalExist(generatedChaosCubeModalId) && h(Modal, {
        visible: showChaosCubeModal,
        onClose: closeChaosCubeModal,
        title: "混沌魔方",
        maxWidth: 640,
        modalId: generatedChaosCubeModalId,
        getModalId: id => {
          generatedChaosCubeModalId = id;
        }
      }, h(ScratchCard, {
        charas: chaosCubeData
      })));
    });
    setState({
      templeData: temple,
      imageUrl: temple.Cover ? getLargeCover(temple.Cover) : normalizeAvatar(temple.Avatar),
      containerWidth: minWidth,
      currentLine: temple.Line || ""
    });
    return container;
  }

  function CharacterBox(props) {
    const {
      characterId,
      sticky = false,
      stickyTop = 0
    } = props || {};
    const container = h("div", {
      id: "tg-character-box",
      className: "relative"
    });
    let overlayRef = null;
    const instanceId = `overlay-${Math.random().toString(36).substr(2, 9)}`;
    let currentUsersPage = 1;
    let currentIcoUsersPage = 1;
    const usersRequestManager = createRequestManager();
    const icoUsersRequestManager = createRequestManager();
    let generatedUserModalId = null;
    let generatedCharacterModalId = null;
    let generatedSacrificeModalId = null;
    let generatedAuctionModalId = null;
    let generatedAuctionHistoryModalId = null;
    let generatedChangeAvatarModalId = null;
    let generatedTradeHistoryModalId = null;
    let generatedTempleModalId = null;
    const isModalExist = modalId => {
      return modalId && document.querySelector(`#tg-modal[data-modal-id="${modalId}"]`)?.parentNode === document.body;
    };
    const {
      setState
    } = createMountedComponent(container, state => {
      const {
        characterData,
        userAssets,
        userCharacter,
        tinygrailCharacter,
        pool,
        depth,
        links,
        temples,
        users,
        icoUsers,
        userIcoInfo,
        loading,
        error,
        showUserModal,
        userModalUsername,
        showCharacterModal,
        characterModalId,
        showSacrificeModal,
        showAuctionModal,
        showAuctionHistoryModal,
        showChangeAvatarModal,
        showTradeHistoryModal,
        showTempleModal,
        templeModalData,
        canChangeAvatar,
        hideDuplicates = true
      } = state || {};
      if (error) {
        return h("div", {
          className: "p-4 text-center"
        }, "加载失败");
      }
      const openUserModal = username => {
        setState({
          showUserModal: true,
          userModalUsername: username
        });
      };
      const closeUserModal = () => {
        setState({
          showUserModal: false
        });
      };
      const openCharacterModal = characterId => {
        setState({
          showCharacterModal: true,
          characterModalId: characterId
        });
      };
      const closeCharacterModal = () => {
        setState({
          showCharacterModal: false
        });
      };
      const openSacrificeModal = () => {
        setState({
          showSacrificeModal: true
        });
      };
      const closeSacrificeModal = () => {
        setState({
          showSacrificeModal: false
        });
        refreshTradeBoxData();
      };
      const openAuctionModal = () => {
        setState({
          showAuctionModal: true
        });
      };
      const closeAuctionModal = () => {
        setState({
          showAuctionModal: false
        });
        refreshTradeBoxData();
      };
      const openAuctionHistoryModal = () => {
        setState({
          showAuctionHistoryModal: true
        });
      };
      const closeAuctionHistoryModal = () => {
        setState({
          showAuctionHistoryModal: false
        });
      };
      const openChangeAvatarModal = () => {
        setState({
          showChangeAvatarModal: true
        });
      };
      const closeChangeAvatarModal = () => {
        setState({
          showChangeAvatarModal: false
        });
      };
      const openTradeHistoryModal = () => {
        setState({
          showTradeHistoryModal: true
        });
      };
      const closeTradeHistoryModal = () => {
        setState({
          showTradeHistoryModal: false
        });
      };
      const openTempleModal = temple => {
        setState({
          showTempleModal: true,
          templeModalData: temple
        });
      };
      const closeTempleModal = () => {
        setState({
          showTempleModal: false
        });
        refreshTradeBoxData();
      };
      let content = null;
      if (characterData) {
        if (characterData.Current !== undefined) {
          content = h(TradeBox, {
            characterData: characterData,
            userAssets: userAssets,
            userCharacter: userCharacter,
            tinygrailCharacter: tinygrailCharacter,
            pool: pool,
            depth: depth,
            links: links,
            temples: temples,
            users: users,
            onRefresh: refreshTradeBoxData,
            setLoading: setLoading,
            loadUsersPage: loadUsersPage,
            openUserModal: openUserModal,
            openCharacterModal: openCharacterModal,
            openSacrificeModal: openSacrificeModal,
            openAuctionModal: openAuctionModal,
            openAuctionHistoryModal: openAuctionHistoryModal,
            openChangeAvatarModal: openChangeAvatarModal,
            openTradeHistoryModal: openTradeHistoryModal,
            openTempleModal: openTempleModal,
            canChangeAvatar: canChangeAvatar,
            hideDuplicates: hideDuplicates,
            onToggleDuplicates: () => setState({
              hideDuplicates: !hideDuplicates
            }),
            sticky: sticky,
            stickyTop: stickyTop
          });
        } else {
          content = h(IcoBox, {
            data: characterData,
            userAssets: userAssets,
            icoUsers: icoUsers,
            userIcoInfo: userIcoInfo,
            loadIcoUsersPage: page => loadIcoUsersPage(page, characterData.Id),
            openUserModal: openUserModal,
            onInvest: amount => handleIcoInvest(amount, characterData.Id),
            sticky: sticky,
            stickyTop: stickyTop
          });
        }
      } else if (userAssets) {
        content = h(IcoBoxInit, {
          characterId: characterId,
          userAssets: userAssets,
          onInit: amount => handleInitICO(amount)
        });
      }
      const createOverlay = () => {
        const oldOverlay = document.querySelector(`.loading-overlay[data-instance="${instanceId}"]`);
        if (oldOverlay && oldOverlay.parentNode) {
          oldOverlay.parentNode.removeChild(oldOverlay);
        }
        const overlay = h("div", {
          className: "loading-overlay absolute inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm dark:bg-black/30",
          "data-instance": instanceId
        }, h(LoaderCircleIcon, {
          className: "tg-spin h-8 w-8 text-gray-600 dark:text-white"
        }));
        overlayRef = overlay;
        setTimeout(() => {
          const modalElement = overlay.closest("#tg-modal");
          if (modalElement) {
            const modalContent = modalElement.querySelector("#tg-modal-content");
            if (modalContent && overlay.parentNode) {
              overlay.parentNode.removeChild(overlay);
              modalContent.appendChild(overlay);
            }
          }
        }, 0);
        return overlay;
      };
      if (!loading && overlayRef) {
        setTimeout(() => {
          const overlay = document.querySelector(`.loading-overlay[data-instance="${instanceId}"]`);
          if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
          overlayRef = null;
        }, 0);
      }
      return h(Fragment, null, h("div", {
        className: "relative min-h-[200px]"
      }, content, loading && createOverlay()), showUserModal && userModalUsername && !isModalExist(generatedUserModalId) && h(Modal, {
        visible: showUserModal,
        onClose: closeUserModal,
        modalId: generatedUserModalId,
        getModalId: id => {
          generatedUserModalId = id;
        }
      }, h(UserTinygrail, {
        username: userModalUsername,
        stickyTop: "-16px"
      })), showCharacterModal && characterModalId && !isModalExist(generatedCharacterModalId) && h(Modal, {
        visible: showCharacterModal,
        onClose: closeCharacterModal,
        modalId: generatedCharacterModalId,
        getModalId: id => {
          generatedCharacterModalId = id;
        }
      }, h(CharacterBox, {
        characterId: characterModalId,
        sticky: true,
        stickyTop: -17
      })), showSacrificeModal && !isModalExist(generatedSacrificeModalId) && h(Modal, {
        visible: showSacrificeModal,
        onClose: closeSacrificeModal,
        title: `资产重组 - #${characterData?.CharacterId ?? ""}「${characterData?.Name ?? ""}」`,
        position: "center",
        maxWidth: 480,
        modalId: generatedSacrificeModalId,
        getModalId: id => {
          generatedSacrificeModalId = id;
        }
      }, h(Sacrifice, {
        characterId: characterId
      })), showAuctionModal && !isModalExist(generatedAuctionModalId) && h(Modal, {
        visible: showAuctionModal,
        onClose: closeAuctionModal,
        title: `拍卖 - #${characterData?.CharacterId ?? ""}「${characterData?.Name ?? ""}」`,
        position: "center",
        maxWidth: 480,
        modalId: generatedAuctionModalId,
        getModalId: id => {
          generatedAuctionModalId = id;
        }
      }, h(Auction, {
        characterId: characterId,
        basePrice: tinygrailCharacter?.Price ?? 0,
        maxAmount: tinygrailCharacter?.Amount ?? 0
      })), showAuctionHistoryModal && !isModalExist(generatedAuctionHistoryModalId) && h(Modal, {
        visible: showAuctionHistoryModal,
        onClose: closeAuctionHistoryModal,
        title: `往期拍卖 - #${characterData?.CharacterId ?? ""}「${characterData?.Name ?? ""}」`,
        position: "center",
        maxWidth: 800,
        modalId: generatedAuctionHistoryModalId,
        getModalId: id => {
          generatedAuctionHistoryModalId = id;
        }
      }, h(AuctionHistory, {
        characterId: characterId
      })), showChangeAvatarModal && !isModalExist(generatedChangeAvatarModalId) && h(Modal, {
        visible: showChangeAvatarModal,
        onClose: closeChangeAvatarModal,
        title: `更换头像 - #${characterData?.CharacterId ?? ""}「${characterData?.Name ?? ""}」`,
        position: "center",
        maxWidth: 800,
        modalId: generatedChangeAvatarModalId,
        getModalId: id => {
          generatedChangeAvatarModalId = id;
        }
      }, h(ImageCropper, {
        onCrop: async (blob, dataUrl) => {
          try {
            const {
              hash,
              blob: resizedBlob
            } = await processImage(dataUrl, 256);
            const ossUrl = buildOssUrl("avatar", hash, "jpg");
            const signatureResult = await getOssSignature("avatar", hash, encodeURIComponent("image/jpeg"));
            if (!signatureResult.success) {
              alert(signatureResult.message || "获取签名失败");
              return;
            }
            const uploadResult = await uploadToOss(ossUrl, resizedBlob, signatureResult.data);
            if (!uploadResult.success) {
              alert(uploadResult.message || "上传失败");
              return;
            }
            const changeResult = await changeCharacterAvatar(characterId, ossUrl);
            if (!changeResult.success) {
              alert(changeResult.message || "更换头像失败");
              return;
            }
            alert("更换头像成功");
            closeChangeAvatarModal();
            await refreshTradeBoxData();
          } catch (error) {
            console.error("更换头像失败:", error);
            alert("更换头像失败");
          }
        }
      })), showTradeHistoryModal && !isModalExist(generatedTradeHistoryModalId) && h(Modal, {
        visible: showTradeHistoryModal,
        onClose: closeTradeHistoryModal,
        title: `交易记录 - #${characterData?.CharacterId ?? ""}「${characterData?.Name ?? ""}」`,
        position: "center",
        maxWidth: 800,
        modalId: generatedTradeHistoryModalId,
        getModalId: id => {
          generatedTradeHistoryModalId = id;
        }
      }, h(TradeHistory, {
        characterId: characterId
      })), showTempleModal && templeModalData && !isModalExist(generatedTempleModalId) && h(Modal, {
        visible: showTempleModal,
        onClose: closeTempleModal,
        position: "center",
        maxWidth: 1080,
        padding: "p-0",
        modalId: generatedTempleModalId,
        getModalId: id => {
          generatedTempleModalId = id;
        }
      }, h(TempleDetail, {
        temple: templeModalData,
        characterName: characterData?.Name ?? ""
      })));
    });
    const setLoading = isLoading => {
      setState({
        loading: isLoading
      });
    };
    const loadCharacterAndUserData = async () => {
      const [characterResult, userAssetsResult] = await Promise.all([getCharacter(characterId), getUserAssets()]);
      return {
        characterResult,
        userAssetsResult
      };
    };
    const updateCharacterAndUserData = async () => {
      const {
        characterResult,
        userAssetsResult
      } = await loadCharacterAndUserData();
      if (characterResult.success && userAssetsResult.success) {
        setState({
          characterData: characterResult.data,
          userAssets: userAssetsResult.data
        });
        return true;
      }
      return false;
    };
    const loadInitialData = async () => {
      setState({
        loading: true
      });
      const {
        characterResult,
        userAssetsResult
      } = await loadCharacterAndUserData();
      if (!userAssetsResult.success) {
        setState({
          loading: false,
          error: true
        });
        return;
      }
      if (!characterResult.success) {
        setState({
          loading: false,
          characterData: null,
          userAssets: userAssetsResult.data
        });
        return;
      }
      setState({
        characterData: characterResult.data,
        userAssets: userAssetsResult.data
      });
      if (characterResult.data?.Current !== undefined) {
        await loadTradeBoxData();
      } else {
        await loadIcoBoxData(characterResult.data.Id);
      }
      setState({
        loading: false
      });
    };
    const loadTradeBoxData = async () => {
      const [poolResult, userCharacterResult, tinygrailCharacterResult, depthResult, linksResult, templesResult, usersResult, topTenUsersResult] = await Promise.all([getCharacterPool(characterId), getUserCharacter(characterId), getUserCharacterByUsername(characterId, "tinygrail"), getCharacterDepth(characterId), getCharacterLinks(characterId), getCharacterTemples(characterId), getCharacterUsers(characterId, currentUsersPage), getCharacterUsers(characterId, 1, 10)]);
      let canChangeAvatar = false;
      if (topTenUsersResult.success && topTenUsersResult.data?.Items) {
        const userAssets = getCachedUserAssets();
        if (userAssets) {
          const currentUserId = userAssets.id;
          const currentUserName = userAssets.name;
          if (currentUserId === 702) {
            canChangeAvatar = true;
          } else {
            const topTenUsers = topTenUsersResult.data.Items;
            const currentUserIndex = topTenUsers.findIndex(user => user.Name === currentUserName);
            if (currentUserIndex !== -1) {
              const chairman = topTenUsers[0];
              const timeDiff = getTimeDiff(chairman.LastActiveDate);
              const chairmanActive = timeDiff < 1000 * 60 * 60 * 24 * 5 && chairman.State !== 666;
              if (chairmanActive) {
                canChangeAvatar = currentUserIndex === 0;
              } else {
                canChangeAvatar = currentUserIndex > 0;
              }
            }
          }
        }
      }
      setState({
        pool: poolResult.success ? poolResult.data : null,
        userCharacter: userCharacterResult.success ? userCharacterResult.data : null,
        tinygrailCharacter: tinygrailCharacterResult.success ? tinygrailCharacterResult.data : null,
        depth: depthResult.success ? depthResult.data : null,
        links: linksResult.success ? linksResult.data : null,
        temples: templesResult.success ? templesResult.data : null,
        users: usersResult.success ? usersResult.data : null,
        canChangeAvatar
      });
    };
    const loadUsersPage = page => {
      currentUsersPage = page;
      usersRequestManager.execute(() => getCharacterUsers(characterId, page), result => {
        if (result.success) {
          setState({
            users: result.data
          });
        }
      });
    };
    const loadIcoBoxData = async icoId => {
      const [icoUsersResult, userIcoInfoResult] = await Promise.all([getICOUsers(icoId, currentIcoUsersPage), getUserICOInfo(icoId)]);
      setState({
        icoUsers: icoUsersResult.success ? icoUsersResult.data : null,
        userIcoInfo: userIcoInfoResult.success ? userIcoInfoResult.data : null
      });
    };
    const loadIcoUsersPage = (page, icoId) => {
      currentIcoUsersPage = page;
      icoUsersRequestManager.execute(() => getICOUsers(icoId, page), result => {
        if (result.success) {
          setState({
            icoUsers: result.data
          });
        }
      });
    };
    const refreshTradeBoxData = async (showLoading = false) => {
      if (showLoading) {
        setLoading(true);
      }
      await updateCharacterAndUserData();
      await loadTradeBoxData();
      if (showLoading) {
        setLoading(false);
      }
    };
    const refreshIcoBoxData = async icoId => {
      await updateCharacterAndUserData();
      await loadIcoBoxData(icoId);
    };
    const handleIcoInvest = async (amount, icoId) => {
      const result = await joinICO(icoId, amount);
      if (result.success) {
        alert("注资成功");
        await refreshIcoBoxData(icoId);
      } else {
        alert(result.message || "注资失败");
      }
    };
    const handleInitICO = async amount => {
      const result = await initICO(characterId, amount);
      if (result.success) {
        alert("ICO启动成功，邀请更多朋友加入吧。");
        await loadInitialData();
      } else {
        alert(result.message || "启动ICO失败");
      }
    };
    if (characterId) {
      loadInitialData();
    }
    return container;
  }

  function UserTinygrail(props) {
    const {
      username,
      stickyTop = null
    } = props || {};
    const container = h("div", {
      id: "tg-user-tinygrail",
      "data-username": username,
      className: "user-tinygrail-container"
    });
    const templesRequestManager = createRequestManager();
    const charasRequestManager = createRequestManager();
    const icosRequestManager = createRequestManager();
    const linksRequestManager = createRequestManager();
    let generatedCharacterModalId = null;
    let generatedTempleModalId = null;
    let generatedRedPacketLogModalId = null;
    let generatedSendRedPacketModalId = null;
    const isModalExist = modalId => {
      return modalId && document.querySelector(`#tg-modal[data-modal-id="${modalId}"]`)?.parentNode === document.body;
    };
    let currentLinksPage = 1;
    let currentTemplesPage = 1;
    let currentCharasPage = 1;
    let currentICOsPage = 1;
    const {
      setState
    } = createMountedComponent(container, state => {
      const {
        name,
        nickname,
        balance,
        lastIndex,
        assets,
        avatar,
        activeTab = 0,
        charaLinks,
        temples,
        charas,
        icos,
        showCharacterModal = false,
        characterModalId = null,
        showTempleModal = false,
        templeModalData = null,
        showRedPacketLogModal = false,
        showSendRedPacketModal = false,
        abbreviateBalance = true
      } = state || {};
      if (!nickname) {
        return h("div", {
          className: "p-4 text-center"
        }, "加载中...");
      }
      return h("div", null, h(UserHeader, {
        name: name,
        nickname: nickname,
        balance: balance,
        lastIndex: lastIndex,
        assets: assets,
        avatar: avatar,
        abbreviateBalance: abbreviateBalance,
        onToggleAbbreviate: () => setState({
          abbreviateBalance: !abbreviateBalance
        }),
        onRedPacketLogClick: handleRedPacketLogClick,
        onSendRedPacketClick: handleSendRedPacketClick,
        onBanClick: handleBanClick,
        onUnbanClick: handleUnbanClick
      }), h(UserTinygrailTabs, {
        activeTab: activeTab,
        onTabChange: index => {
          setState({
            activeTab: index
          });
          scrollToTop(container);
        },
        charaLinks: charaLinks,
        temples: temples,
        charas: charas,
        icos: icos,
        onLinksPageChange: handleLinksPageChange,
        onTemplesPageChange: handleTemplesPageChange,
        onCharasPageChange: handleCharasPageChange,
        onICOsPageChange: handleICOsPageChange,
        onCharacterClick: handleCharacterClick,
        onTempleClick: handleTempleClick,
        stickyTop: stickyTop
      }), showCharacterModal && characterModalId && !isModalExist(generatedCharacterModalId) && h(Modal, {
        visible: showCharacterModal,
        onClose: () => setState({
          showCharacterModal: false
        }),
        modalId: generatedCharacterModalId,
        getModalId: id => {
          generatedCharacterModalId = id;
        }
      }, h(CharacterBox, {
        characterId: characterModalId,
        sticky: true,
        stickyTop: -16
      })), showTempleModal && templeModalData && !isModalExist(generatedTempleModalId) && h(Modal, {
        visible: showTempleModal,
        onClose: () => {
          setState({
            showTempleModal: false
          });
          if (username) {
            loadCharaData(username);
          }
        },
        position: "center",
        maxWidth: 1080,
        padding: "p-0",
        modalId: generatedTempleModalId,
        getModalId: id => {
          generatedTempleModalId = id;
        }
      }, h(TempleDetail, {
        temple: templeModalData,
        characterName: templeModalData.Name
      })), showRedPacketLogModal && !isModalExist(generatedRedPacketLogModalId) && h(Modal, {
        visible: showRedPacketLogModal,
        onClose: () => setState({
          showRedPacketLogModal: false
        }),
        title: `「${nickname}」的红包记录`,
        position: "center",
        maxWidth: 672,
        modalId: generatedRedPacketLogModalId,
        getModalId: id => {
          generatedRedPacketLogModalId = id;
        }
      }, h(RedPacketLog, {
        username: username
      })), showSendRedPacketModal && !isModalExist(generatedSendRedPacketModalId) && h(Modal, {
        visible: showSendRedPacketModal,
        onClose: closeSendRedPacketModal,
        title: `发送红包给「${nickname}」`,
        position: "center",
        maxWidth: 480,
        modalId: generatedSendRedPacketModalId,
        getModalId: id => {
          generatedSendRedPacketModalId = id;
        }
      }, h(SendRedPacket, {
        username: username,
        onSuccess: () => {
          closeSendRedPacketModal();
          if (username) {
            loadCharaData(username);
          }
        }
      })));
    });
    const loadUserAssets = () => {
      getUserAssets(username).then(result => {
        if (!result.success) {
          setState({
            nickname: "加载失败"
          });
          return;
        }
        setState(result.data);
      });
    };
    const loadCharaData = name => {
      Promise.all([getUserCharaLinks(name, currentLinksPage), getUserTemples(name, currentTemplesPage), getUserCharas(name, currentCharasPage), getUserICOs(name, currentICOsPage)]).then(([linksResult, templesResult, charasResult, icosResult]) => {
        setState({
          charaLinks: linksResult.success ? linksResult.data : null,
          temples: templesResult.success ? templesResult.data : null,
          charas: charasResult.success ? charasResult.data : null,
          icos: icosResult.success ? icosResult.data : null
        });
      });
    };
    const handleLinksPageChange = page => {
      currentLinksPage = page;
      linksRequestManager.execute(() => getUserCharaLinks(username, page), result => {
        if (result.success) {
          setState({
            charaLinks: result.data
          });
          scrollToTop(container);
        }
      });
    };
    const handleTemplesPageChange = page => {
      currentTemplesPage = page;
      templesRequestManager.execute(() => getUserTemples(username, page), result => {
        if (result.success) {
          setState({
            temples: result.data
          });
          scrollToTop(container);
        }
      });
    };
    const handleCharasPageChange = page => {
      currentCharasPage = page;
      charasRequestManager.execute(() => getUserCharas(username, page), result => {
        if (result.success) {
          setState({
            charas: result.data
          });
          scrollToTop(container);
        }
      });
    };
    const handleICOsPageChange = page => {
      currentICOsPage = page;
      icosRequestManager.execute(() => getUserICOs(username, page), result => {
        if (result.success) {
          setState({
            icos: result.data
          });
          scrollToTop(container);
        }
      });
    };
    const handleCharacterClick = characterId => {
      setState({
        showCharacterModal: true,
        characterModalId: characterId
      });
    };
    const handleTempleClick = temple => {
      setState({
        showTempleModal: true,
        templeModalData: temple
      });
    };
    const handleRedPacketLogClick = () => {
      setState({
        showRedPacketLogModal: true
      });
    };
    const handleSendRedPacketClick = () => {
      setState({
        showSendRedPacketModal: true
      });
    };
    const closeSendRedPacketModal = () => {
      closeModalById(generatedSendRedPacketModalId);
      setState({
        showSendRedPacketModal: false
      });
    };
    const handleBanClick = async () => {
      if (!confirm("封禁之后只有管理员才能解除，确认要封禁用户？")) {
        return;
      }
      const result = await banUser(username);
      if (result.success) {
        alert(result.message);
        loadUserAssets();
      } else {
        alert(result.message);
      }
    };
    const handleUnbanClick = async () => {
      if (!confirm("确认要解除封禁用户？")) {
        return;
      }
      const result = await unbanUser(username);
      if (result.success) {
        alert(result.message);
        loadUserAssets();
      } else {
        alert(result.message);
      }
    };
    loadUserAssets();
    if (username) {
      loadCharaData(username);
    }
    return container;
  }

  function BalanceLogTab({
    data,
    onPageChange,
    onCharacterClick
  }) {
    const parseDescription = text => {
      if (!text) return text;
      const regex = /#(\d+)/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          parts.push(h("span", {
            className: "opacity-75"
          }, text.substring(lastIndex, match.index)));
        }
        const characterId = match[1];
        parts.push(h("span", {
          className: "bgm-color cursor-pointer hover:opacity-75",
          onClick: e => {
            e.stopPropagation();
            if (onCharacterClick) {
              onCharacterClick(parseInt(characterId));
            }
          }
        }, "#", characterId));
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < text.length) {
        parts.push(h("span", {
          className: "opacity-75"
        }, text.substring(lastIndex)));
      }
      return h("span", null, parts);
    };
    if (!data) {
      return h("div", {
        className: "tg-bg-content rounded-lg p-8 text-center"
      }, h("p", {
        className: "text-lg opacity-60"
      }, "加载中..."));
    }
    if (!data.items || data.items.length === 0) {
      return h("div", {
        className: "tg-bg-content rounded-lg p-8 text-center"
      }, h("p", {
        className: "text-lg opacity-60"
      }, "暂无数据"));
    }
    return h("div", {
      id: "tg-balance-log-tab",
      className: "flex w-full flex-col gap-4"
    }, h("div", {
      id: "tg-balance-log-list",
      className: "tg-bg-content rounded-lg"
    }, h("ul", {
      className: "divide-y divide-gray-200 dark:divide-gray-700"
    }, data.items.map((item, index) => {
      return h("li", {
        id: "tg-balance-log-item",
        className: "flex items-center justify-between gap-2 px-4 py-3 transition-colors even:bg-gray-50/50 dark:even:bg-gray-800/30"
      }, h("div", {
        className: "flex flex-1 items-center gap-3"
      }, h("div", {
        className: "flex-1"
      }, h("div", {
        className: "flex items-center gap-2"
      }, h("span", {
        className: "text-base font-bold"
      }, formatCurrency(item.Balance, "₵", 2, false)), h("span", {
        className: "text-xs opacity-60"
      }, formatTimeAgo(item.LogTime))), h("div", {
        className: "mt-1 text-sm"
      }, parseDescription(item.Description)))), h("div", {
        className: "flex items-center gap-2"
      }, item.Change !== 0 && h("span", {
        className: "rounded px-2 py-0.5 text-xs font-bold",
        style: {
          backgroundColor: item.Change > 0 ? "#ff658d" : "#65bcff",
          color: "#fff"
        }
      }, item.Change > 0 ? "+" : "-", "₵", formatCurrency(Math.abs(item.Change), "", 2, false)), item.Amount !== 0 && h("span", {
        className: "rounded px-2 py-0.5 text-xs font-bold",
        style: {
          backgroundColor: item.Amount > 0 ? "#45d216" : "#d2d2d2",
          color: "#fff"
        }
      }, item.Amount > 0 ? "+" : "", item.Amount)));
    }))), data.totalPages && data.totalPages >= 1 && h("div", {
      className: "flex w-full justify-center"
    }, h(Pagination, {
      current: Number(data.currentPage) || 1,
      total: Number(data.totalPages),
      onChange: page => onPageChange && onPageChange(page)
    })));
  }

  function MyAuctionsTab({
    data,
    onPageChange,
    onCharacterClick,
    onCancelAuction
  }) {
    if (!data) {
      return h("div", {
        className: "tg-bg-content rounded-lg p-8 text-center"
      }, h("p", {
        className: "text-lg opacity-60"
      }, "加载中..."));
    }
    if (!data.items || data.items.length === 0) {
      return h("div", {
        className: "tg-bg-content rounded-lg p-8 text-center"
      }, h("p", {
        className: "text-lg opacity-60"
      }, "暂无数据"));
    }
    const getAuctionStatus = state => {
      switch (state) {
        case 0:
          return {
            text: "竞拍中",
            color: "#45d216"
          };
        case 1:
          return {
            text: "竞拍成功",
            color: "#ff658d"
          };
        case 2:
          return {
            text: "竞拍失败",
            color: "#d2d2d2"
          };
        default:
          return {
            text: "竞拍失败",
            color: "#d2d2d2"
          };
      }
    };
    return h("div", {
      id: "tg-my-auctions-tab",
      className: "flex w-full flex-col gap-4"
    }, h("div", {
      id: "tg-my-auctions-list",
      className: "tg-bg-content rounded-lg"
    }, h("ul", {
      className: "divide-y divide-gray-200 dark:divide-gray-700"
    }, data.items.map((item, index) => {
      const status = getAuctionStatus(item.State ?? 2);
      const isAuctioning = item.State === 0;
      return h("li", {
        id: "tg-my-auctions-item",
        "data-character-id": item.CharacterId,
        className: "flex cursor-pointer items-center justify-between gap-3 px-4 py-3 transition-colors even:bg-gray-50/50 hover:bg-gray-100 dark:even:bg-gray-800/30 dark:hover:bg-gray-800/50",
        onClick: () => onCharacterClick && onCharacterClick(item.CharacterId)
      }, item.Icon && h("div", null, h("img", {
        src: normalizeAvatar(item.Icon),
        alt: item.Name || `#${item.CharacterId}`,
        className: "h-12 w-12 rounded-lg border border-gray-200 object-cover object-top dark:border-gray-700"
      })), h("div", {
        className: "flex-1"
      }, h("div", {
        className: "flex items-center gap-2"
      }, h("span", {
        className: "text-base font-bold"
      }, item.Name || `#${item.CharacterId}`), isAuctioning && h("span", {
        className: "tg-link cursor-pointer text-xs hover:opacity-75",
        onClick: e => {
          e.stopPropagation();
          onCancelAuction && onCancelAuction(item.Id);
        }
      }, "[取消]"), h("span", {
        className: "text-xs opacity-60"
      }, formatTimeAgo(item.Bid))), h("div", {
        className: "mt-1 text-xs opacity-60"
      }, "拍卖底价：", formatCurrency(item.Start || 0, "₵", 2, false), h("span", {
        className: "mx-2"
      }, "•"), "英灵殿：", item.Type || 0), h("div", {
        className: "mt-1 text-xs",
        style: isAuctioning ? {
          color: "#ffa7cc"
        } : {
          opacity: 0.6
        }
      }, "出价：", formatCurrency(item.Price, "₵", 2, false), h("span", {
        className: "mx-2"
      }, "•"), "数量：", item.Amount), isAuctioning && item.auctionDetail && h("div", {
        className: "mt-1 text-xs",
        style: {
          color: "#a7e3ff"
        }
      }, "竞拍人数：", item.auctionDetail.State || 0, h("span", {
        className: "mx-2"
      }, "•"), "竞拍数量：", item.auctionDetail.Type || 0)), h("div", null, h("span", {
        className: "rounded px-2 py-0.5 text-xs font-bold",
        style: {
          backgroundColor: status.color,
          color: "#fff"
        }
      }, status.text)));
    }))), data.totalPages && data.totalPages >= 1 && h("div", {
      className: "flex w-full justify-center"
    }, h(Pagination, {
      current: Number(data.currentPage) || 1,
      total: Number(data.totalPages),
      onChange: page => onPageChange && onPageChange(page)
    })));
  }

  function MyBidsTab({
    data,
    onPageChange,
    onCharacterClick
  }) {
    if (!data) {
      return h("div", {
        className: "tg-bg-content rounded-lg p-8 text-center"
      }, h("p", {
        className: "text-lg opacity-60"
      }, "加载中..."));
    }
    if (!data.items || data.items.length === 0) {
      return h("div", {
        className: "tg-bg-content rounded-lg p-8 text-center"
      }, h("p", {
        className: "text-lg opacity-60"
      }, "暂无数据"));
    }
    return h("div", {
      id: "tg-my-bids-tab",
      className: "flex w-full flex-col gap-4"
    }, h("div", {
      id: "tg-my-bids-list",
      className: "tg-bg-content rounded-lg"
    }, h("ul", {
      className: "divide-y divide-gray-200 dark:divide-gray-700"
    }, data.items.map((item, index) => {
      const fluctuation = item.Fluctuation || 0;
      let bgColor = "#d2d2d2";
      let fluText = "--";
      if (fluctuation > 0) {
        bgColor = "#ff658d";
        fluText = `+${formatNumber(fluctuation * 100, 2)}%`;
      } else if (fluctuation < 0) {
        bgColor = "#65bcff";
        fluText = `${formatNumber(fluctuation * 100, 2)}%`;
      }
      return h("li", {
        id: "tg-my-bids-item",
        "data-character-id": item.CharacterId,
        className: "flex cursor-pointer items-center justify-between gap-3 px-4 py-3 transition-colors even:bg-gray-50/50 hover:bg-gray-100 dark:even:bg-gray-800/30 dark:hover:bg-gray-800/50",
        onClick: () => onCharacterClick && onCharacterClick(item.CharacterId)
      }, item.Icon && h("div", null, h("img", {
        src: normalizeAvatar(item.Icon),
        alt: item.Name || `#${item.CharacterId}`,
        className: "h-12 w-12 rounded-lg border border-gray-200 object-cover object-top dark:border-gray-700"
      })), h("div", {
        className: "flex-1"
      }, h("div", {
        className: "flex items-center gap-2"
      }, h(LevelBadge, {
        level: item.Level,
        zeroCount: item.ZeroCount
      }), h("span", {
        className: "text-base font-bold"
      }, item.Name || `#${item.CharacterId}`), h("span", {
        className: "text-xs opacity-60"
      }, formatTimeAgo(item.LastOrder))), h("div", {
        className: "mt-1 text-xs opacity-60"
      }, "买单数量：", item.State || 0)), h("div", null, h("span", {
        className: "rounded px-2 py-0.5 text-xs font-bold",
        style: {
          backgroundColor: bgColor,
          color: "#fff"
        },
        title: `₵${formatNumber(item.MarketValue || 0, 0)} / ${formatNumber(item.Total || 0, 0)}`
      }, formatCurrency(item.Current || 0, "₵", 2, false), " ", fluText)));
    }))), data.totalPages && data.totalPages >= 1 && h("div", {
      className: "flex w-full justify-center"
    }, h(Pagination, {
      current: Number(data.currentPage) || 1,
      total: Number(data.totalPages),
      onChange: page => onPageChange && onPageChange(page)
    })));
  }

  function MyAsksTab({
    data,
    onPageChange,
    onCharacterClick
  }) {
    if (!data) {
      return h("div", {
        className: "tg-bg-content rounded-lg p-8 text-center"
      }, h("p", {
        className: "text-lg opacity-60"
      }, "加载中..."));
    }
    if (!data.items || data.items.length === 0) {
      return h("div", {
        className: "tg-bg-content rounded-lg p-8 text-center"
      }, h("p", {
        className: "text-lg opacity-60"
      }, "暂无数据"));
    }
    return h("div", {
      id: "tg-my-asks-tab",
      className: "flex w-full flex-col gap-4"
    }, h("div", {
      id: "tg-my-asks-list",
      className: "tg-bg-content rounded-lg"
    }, h("ul", {
      className: "divide-y divide-gray-200 dark:divide-gray-700"
    }, data.items.map((item, index) => {
      const fluctuation = item.Fluctuation || 0;
      let bgColor = "#d2d2d2";
      let fluText = "--";
      if (fluctuation > 0) {
        bgColor = "#ff658d";
        fluText = `+${formatNumber(fluctuation * 100, 2)}%`;
      } else if (fluctuation < 0) {
        bgColor = "#65bcff";
        fluText = `${formatNumber(fluctuation * 100, 2)}%`;
      }
      return h("li", {
        id: "tg-my-asks-item",
        "data-character-id": item.CharacterId,
        className: "flex cursor-pointer items-center justify-between gap-3 px-4 py-3 transition-colors even:bg-gray-50/50 hover:bg-gray-100 dark:even:bg-gray-800/30 dark:hover:bg-gray-800/50",
        onClick: () => onCharacterClick && onCharacterClick(item.CharacterId)
      }, item.Icon && h("div", null, h("img", {
        src: normalizeAvatar(item.Icon),
        alt: item.Name || `#${item.CharacterId}`,
        className: "h-12 w-12 rounded-lg border border-gray-200 object-cover object-top dark:border-gray-700"
      })), h("div", {
        className: "flex-1"
      }, h("div", {
        className: "flex items-center gap-2"
      }, h(LevelBadge, {
        level: item.Level,
        zeroCount: item.ZeroCount
      }), h("span", {
        className: "text-base font-bold"
      }, item.Name || `#${item.CharacterId}`), h("span", {
        className: "text-xs opacity-60"
      }, formatTimeAgo(item.LastOrder))), h("div", {
        className: "mt-1 text-xs opacity-60"
      }, "卖单数量：", item.State || 0)), h("div", null, h("span", {
        className: "rounded px-2 py-0.5 text-xs font-bold",
        style: {
          backgroundColor: bgColor,
          color: "#fff"
        },
        title: `₵${formatNumber(item.MarketValue || 0, 0)} / ${formatNumber(item.Total || 0, 0)}`
      }, formatCurrency(item.Current || 0, "₵", 2, false), " ", fluText)));
    }))), data.totalPages && data.totalPages >= 1 && h("div", {
      className: "flex w-full justify-center"
    }, h(Pagination, {
      current: Number(data.currentPage) || 1,
      total: Number(data.totalPages),
      onChange: page => onPageChange && onPageChange(page)
    })));
  }

  function MyItemsTab({
    data,
    onPageChange
  }) {
    if (!data) {
      return h("div", {
        className: "tg-bg-content rounded-lg p-8 text-center"
      }, h("p", {
        className: "text-lg opacity-60"
      }, "加载中..."));
    }
    if (!data.items || data.items.length === 0) {
      return h("div", {
        className: "tg-bg-content rounded-lg p-8 text-center"
      }, h("p", {
        className: "text-lg opacity-60"
      }, "暂无数据"));
    }
    return h("div", {
      id: "tg-my-items-tab",
      className: "flex w-full flex-col gap-4"
    }, h("div", {
      id: "tg-my-items-list",
      className: "tg-bg-content rounded-lg"
    }, h("ul", {
      className: "divide-y divide-gray-200 dark:divide-gray-700"
    }, data.items.map((item, index) => {
      return h("li", {
        id: "tg-my-items-item",
        "data-item-id": item.Id,
        className: "flex items-center justify-between gap-3 px-4 py-3 transition-colors even:bg-gray-50/50 dark:even:bg-gray-800/30"
      }, item.Icon && h("div", null, h("img", {
        src: normalizeAvatar(item.Icon),
        alt: item.Name || `#${item.Id}`,
        className: "h-12 w-12 rounded-lg border border-gray-200 object-cover object-top dark:border-gray-700"
      })), h("div", {
        className: "flex-1"
      }, h("div", {
        className: "flex items-center gap-2"
      }, h("span", {
        className: "text-base font-bold"
      }, item.Name || `#${item.Id}`), h("span", {
        className: "text-xs opacity-60"
      }, formatTimeAgo(item.Last))), h("div", {
        className: "mt-1 text-xs opacity-60"
      }, "「", item.Line || "", "」")), h("div", null, h("span", {
        className: "rounded px-2 py-0.5 text-xs font-bold text-white",
        style: {
          backgroundColor: "#FFC107"
        }
      }, "×", formatNumber(item.Amount || 0, 0))));
    }))), data.totalPages && data.totalPages >= 1 && h("div", {
      className: "flex w-full justify-center"
    }, h(Pagination, {
      current: Number(data.currentPage) || 1,
      total: Number(data.totalPages),
      onChange: page => onPageChange && onPageChange(page)
    })));
  }

  function RecentCharaTab({
    data,
    onPageChange,
    onCharacterClick
  }) {
    if (!data) {
      return h("div", {
        className: "tg-bg-content rounded-lg p-8 text-center"
      }, h("p", {
        className: "text-lg opacity-60"
      }, "加载中..."));
    }
    if (!data.items || data.items.length === 0) {
      return h("div", {
        className: "tg-bg-content rounded-lg p-8 text-center"
      }, h("p", {
        className: "text-lg opacity-60"
      }, "暂无数据"));
    }
    return h("div", {
      id: "tg-recent-chara-tab",
      className: "flex w-full flex-col gap-4"
    }, h("div", {
      id: "tg-recent-chara-list",
      className: "tg-bg-content rounded-lg"
    }, h("ul", {
      className: "divide-y divide-gray-200 dark:divide-gray-700"
    }, data.items.map((item, index) => {
      const fluctuation = item.Fluctuation || 0;
      let bgColor = "#d2d2d2";
      let fluText = "--";
      if (fluctuation > 0) {
        bgColor = "#ff658d";
        fluText = `+${formatNumber(fluctuation * 100, 2)}%`;
      } else if (fluctuation < 0) {
        bgColor = "#65bcff";
        fluText = `${formatNumber(fluctuation * 100, 2)}%`;
      }
      return h("li", {
        id: "tg-recent-chara-item",
        "data-character-id": item.CharacterId,
        className: "flex cursor-pointer items-center justify-between gap-3 px-4 py-3 transition-colors even:bg-gray-50/50 hover:bg-gray-100 dark:even:bg-gray-800/30 dark:hover:bg-gray-800/50",
        onClick: () => onCharacterClick && onCharacterClick(item.CharacterId)
      }, item.Icon && h("div", null, h("img", {
        src: normalizeAvatar(item.Icon),
        alt: item.Name || `#${item.CharacterId}`,
        className: "h-12 w-12 rounded-lg border border-gray-200 object-cover object-top dark:border-gray-700"
      })), h("div", {
        className: "flex-1"
      }, h("div", {
        className: "flex items-center gap-2"
      }, h(LevelBadge, {
        level: item.Level,
        zeroCount: item.ZeroCount
      }), h("span", {
        className: "text-base font-bold"
      }, item.Name || `#${item.CharacterId}`), h("span", {
        className: "text-xs opacity-60"
      }, formatTimeAgo(item.LastOrder))), h("div", {
        className: "mt-1 text-xs opacity-60",
        title: "股息 / 流通量 / 市值"
      }, "+", formatNumber(item.Rate || 0, 2), " / ", formatNumber(item.Total || 0, 0), " /", " ", formatCurrency(item.MarketValue || 0, "₵", 0, false)), h("div", {
        className: "mt-1 flex gap-2 text-xs",
        title: "固定资产 / 买入 / 卖出 / 成交"
      }, h("span", {
        className: "opacity-60"
      }, formatNumber(item.Sacrifices || 0, 0)), h("span", {
        style: {
          color: "#ffa7cc"
        }
      }, "+", formatNumber(item.Bids || 0, 0)), h("span", {
        style: {
          color: "#a7e3ff"
        }
      }, "-", formatNumber(item.Asks || 0, 0)), h("span", {
        style: {
          color: "#d2d2d2"
        }
      }, formatNumber(item.Deals || 0, 0)))), h("div", null, h("span", {
        className: "rounded px-2 py-0.5 text-xs font-bold",
        style: {
          backgroundColor: bgColor,
          color: "#fff"
        },
        title: `₵${formatNumber(item.MarketValue || 0, 0)} / ${formatNumber(item.Total || 0, 0)}`
      }, formatCurrency(item.Current || 0, "₵", 2, false), " ", fluText)));
    }))), data.totalPages && data.totalPages >= 1 && h("div", {
      className: "flex w-full justify-center"
    }, h(Pagination, {
      current: Number(data.currentPage) || 1,
      total: Number(data.totalPages),
      onChange: page => onPageChange && onPageChange(page)
    })));
  }

  function BalanceLog() {
    const container = h("div", {
      id: "tg-balance-log",
      className: "mx-auto max-w-4xl"
    });
    const balanceLogRequestManager = createRequestManager();
    const myAuctionsRequestManager = createRequestManager();
    const myBidsRequestManager = createRequestManager();
    const myAsksRequestManager = createRequestManager();
    const myItemsRequestManager = createRequestManager();
    const recentCharaRequestManager = createRequestManager();
    let currentMyAuctionsPage = 1;
    let generatedCharacterModalId = null;
    const isModalExist = modalId => {
      return modalId && document.querySelector(`#tg-modal[data-modal-id="${modalId}"]`)?.parentNode === document.body;
    };
    const loadMyAuctionsData = async page => {
      const auctionsResult = await getUserAuctions(page, 50);
      if (auctionsResult.success && auctionsResult.data.items.length > 0) {
        const characterIds = auctionsResult.data.items.map(item => item.CharacterId);
        const auctionDetailsResult = await getAuctionList(characterIds);
        const auctionMap = {};
        if (auctionDetailsResult.success) {
          auctionDetailsResult.data.forEach(auction => {
            auctionMap[auction.CharacterId] = auction;
          });
        }
        auctionsResult.data.items = auctionsResult.data.items.map(item => ({
          ...item,
          auctionDetail: auctionMap[item.CharacterId] || null
        }));
      }
      return auctionsResult;
    };
    const {
      setState
    } = createMountedComponent(container, state => {
      const {
        activeTab = 0,
        balanceLogData = null,
        myAuctionsData = null,
        myBidsData = null,
        myAsksData = null,
        myItemsData = null,
        recentCharaData = null,
        showCharacterModal = false,
        characterModalId = null
      } = state || {};
      const handleBalanceLogPageChange = async page => {
        balanceLogRequestManager.execute(async () => {
          return await getUserBalanceLog(page, 50);
        }, result => {
          if (result.success) {
            setState({
              balanceLogData: result.data
            });
            scrollToTop(container);
          }
        });
      };
      const handleMyAuctionsPageChange = async page => {
        currentMyAuctionsPage = page;
        myAuctionsRequestManager.execute(async () => {
          return await loadMyAuctionsData(page);
        }, result => {
          if (result.success) {
            setState({
              myAuctionsData: result.data
            });
            scrollToTop(container);
          }
        });
      };
      const handleCharacterClick = characterId => {
        setState({
          showCharacterModal: true,
          characterModalId: characterId
        });
      };
      const handleCancelAuction = async auctionId => {
        if (!confirm("确定要取消竞拍吗？")) {
          return;
        }
        const result = await cancelAuction(auctionId);
        if (result.success) {
          alert("取消竞拍成功");
          handleMyAuctionsPageChange(currentMyAuctionsPage);
        } else {
          alert(result.message || "取消竞拍失败");
        }
      };
      const handleMyBidsPageChange = async page => {
        myBidsRequestManager.execute(async () => {
          return await getBidsList(page, 50);
        }, result => {
          if (result.success) {
            setState({
              myBidsData: result.data
            });
            scrollToTop(container);
          }
        });
      };
      const handleMyAsksPageChange = async page => {
        myAsksRequestManager.execute(async () => {
          return await getAsksList(page, 50);
        }, result => {
          if (result.success) {
            setState({
              myAsksData: result.data
            });
            scrollToTop(container);
          }
        });
      };
      const handleMyItemsPageChange = async page => {
        myItemsRequestManager.execute(async () => {
          return await getUserItems(page, 50);
        }, result => {
          if (result.success) {
            setState({
              myItemsData: result.data
            });
            scrollToTop(container);
          }
        });
      };
      const handleRecentCharaPageChange = async page => {
        recentCharaRequestManager.execute(async () => {
          return await getRecentCharacters(page, 50);
        }, result => {
          if (result.success) {
            setState({
              recentCharaData: result.data
            });
            scrollToTop(container);
          }
        });
      };
      const tabItems = [{
        key: "balance-log",
        label: "资金日志",
        component: () => h(BalanceLogTab, {
          data: balanceLogData,
          onPageChange: handleBalanceLogPageChange,
          onCharacterClick: handleCharacterClick
        })
      }, {
        key: "my-auctions",
        label: "我的拍卖",
        component: () => h(MyAuctionsTab, {
          data: myAuctionsData,
          onPageChange: handleMyAuctionsPageChange,
          onCharacterClick: handleCharacterClick,
          onCancelAuction: handleCancelAuction
        })
      }, {
        key: "my-bids",
        label: "我的买单",
        component: () => h(MyBidsTab, {
          data: myBidsData,
          onPageChange: handleMyBidsPageChange,
          onCharacterClick: handleCharacterClick
        })
      }, {
        key: "my-asks",
        label: "我的卖单",
        component: () => h(MyAsksTab, {
          data: myAsksData,
          onPageChange: handleMyAsksPageChange,
          onCharacterClick: handleCharacterClick
        })
      }, {
        key: "my-items",
        label: "我的道具",
        component: () => h(MyItemsTab, {
          data: myItemsData,
          onPageChange: handleMyItemsPageChange
        })
      }, {
        key: "recent-chara",
        label: "最近活跃",
        component: () => h(RecentCharaTab, {
          data: recentCharaData,
          onPageChange: handleRecentCharaPageChange,
          onCharacterClick: handleCharacterClick
        })
      }];
      return h("div", null, h(Tabs, {
        items: tabItems,
        activeTab: activeTab,
        onTabChange: index => {
          setState({
            activeTab: index
          });
          loadTabData(index);
          scrollToTop(container);
        },
        sticky: true,
        size: "small",
        padding: "px-1 pt-0 pb-3"
      }), showCharacterModal && characterModalId && !isModalExist(generatedCharacterModalId) && h(Modal, {
        visible: showCharacterModal,
        onClose: () => {
          setState({
            showCharacterModal: false
          });
          loadTabData(activeTab);
        },
        modalId: generatedCharacterModalId,
        getModalId: id => {
          generatedCharacterModalId = id;
        }
      }, h(CharacterBox, {
        characterId: characterModalId,
        sticky: true,
        stickyTop: -16
      })));
    }, true);
    const loadTabData = async tabIndex => {
      switch (tabIndex) {
        case 0:
          {
            const result = await getUserBalanceLog(1, 50);
            if (result.success) {
              setState({
                balanceLogData: result.data
              });
            } else {
              setState({
                balanceLogData: {
                  items: [],
                  currentPage: 1,
                  totalPages: 0,
                  totalItems: 0
                }
              });
            }
            break;
          }
        case 1:
          {
            const auctionsResult = await loadMyAuctionsData(1);
            if (auctionsResult.success) {
              setState({
                myAuctionsData: auctionsResult.data
              });
            } else {
              setState({
                myAuctionsData: {
                  items: [],
                  currentPage: 1,
                  totalPages: 0,
                  totalItems: 0
                }
              });
            }
            break;
          }
        case 2:
          {
            const bidsResult = await getBidsList(1, 50);
            if (bidsResult.success) {
              setState({
                myBidsData: bidsResult.data
              });
            } else {
              setState({
                myBidsData: {
                  items: [],
                  currentPage: 1,
                  totalPages: 0,
                  totalItems: 0
                }
              });
            }
            break;
          }
        case 3:
          {
            const asksResult = await getAsksList(1, 50);
            if (asksResult.success) {
              setState({
                myAsksData: asksResult.data
              });
            } else {
              setState({
                myAsksData: {
                  items: [],
                  currentPage: 1,
                  totalPages: 0,
                  totalItems: 0
                }
              });
            }
            break;
          }
        case 4:
          {
            const itemsResult = await getUserItems(1, 50);
            if (itemsResult.success) {
              setState({
                myItemsData: itemsResult.data
              });
            } else {
              setState({
                myItemsData: {
                  items: [],
                  currentPage: 1,
                  totalPages: 0,
                  totalItems: 0
                }
              });
            }
            break;
          }
        case 5:
          {
            const recentResult = await getRecentCharacters(1, 50);
            if (recentResult.success) {
              setState({
                recentCharaData: recentResult.data
              });
            } else {
              setState({
                recentCharaData: {
                  items: [],
                  currentPage: 1,
                  totalPages: 0,
                  totalItems: 0
                }
              });
            }
            break;
          }
      }
    };
    loadTabData(0);
    return container;
  }

  function UserCard() {
    const container = h("div", {
      id: "tg-rakuen-home-user-card"
    });
    let generatedScratchModalId = null;
    let generatedScratchResultModalId = null;
    const {
      setState
    } = createMountedComponent(container, (state, setState) => {
      const {
        authorized,
        name,
        nickname,
        avatar,
        balance,
        assets,
        lastIndex,
        showDaily,
        showWeekly,
        showHoliday,
        holidayName,
        showModal,
        showScratchModal = false,
        showScratchResultModal = false,
        showBalanceLogModal = false,
        scratchResultData = null,
        isLotus = false,
        lotusCount = 0,
        abbreviateBalance = true
      } = state || {};
      if (!authorized) {
        return h(LoginBox, {
          onLogin: () => {
            loadUserAssets();
          }
        });
      }
      const isModalExist = modalId => {
        return modalId && document.querySelector(`#tg-modal[data-modal-id="${modalId}"]`)?.parentNode === document.body;
      };
      return h("div", null, h(UserInfoBox, {
        name: name,
        nickname: nickname,
        avatar: avatar,
        balance: balance,
        lastIndex: lastIndex,
        showDaily: showDaily,
        showWeekly: showWeekly,
        showHoliday: showHoliday,
        holidayName: holidayName,
        abbreviateBalance: abbreviateBalance,
        onBonus: handleDailyBonus,
        onShareBonus: handleWeeklyBonus,
        onHolidayBonus: handleHolidayBonus,
        onLogout: handleLogout,
        onShareBonusTest: handleShareBonusTest,
        onScratch: handleOpenScratch,
        onAvatarClick: () => {
          setState({
            showModal: true
          });
        },
        onToggleAbbreviate: () => {
          setState({
            abbreviateBalance: !abbreviateBalance
          });
        },
        onBalanceLog: () => {
          setState({
            showBalanceLogModal: true
          });
        }
      }), showModal && h(Modal, {
        visible: showModal,
        onClose: () => setState({
          showModal: false
        })
      }, h(UserTinygrail, {
        username: name,
        stickyTop: "-16px"
      })), showScratchModal && !isModalExist(generatedScratchModalId) && h(Modal, {
        visible: showScratchModal,
        onClose: closeScratchModal,
        title: "彩票抽奖",
        position: "center",
        maxWidth: 400,
        modalId: generatedScratchModalId,
        getModalId: id => {
          generatedScratchModalId = id;
        }
      }, h(ScratchConfirm, {
        isLotus: isLotus,
        lotusCount: lotusCount,
        onConfirm: handleConfirmScratch,
        onCancel: closeScratchModal
      })), showScratchResultModal && scratchResultData && !isModalExist(generatedScratchResultModalId) && h(Modal, {
        visible: showScratchResultModal,
        onClose: closeScratchResultModal,
        title: "彩票抽奖",
        position: "center",
        maxWidth: 800,
        padding: "",
        modalId: generatedScratchResultModalId,
        getModalId: id => {
          generatedScratchResultModalId = id;
        }
      }, h(ScratchCard, {
        charas: scratchResultData
      })), showBalanceLogModal && h(Modal, {
        visible: showBalanceLogModal,
        onClose: () => setState({
          showBalanceLogModal: false
        }),
        title: "交易记录",
        position: "center",
        padding: "p-4 pt-0",
        maxWidth: 960
      }, h(BalanceLog, null)));
    });
    const loadUserAssets = () => {
      getUserAssets().then(result => {
        if (!result.success) {
          setState({
            authorized: false
          });
          return;
        }
        setState({
          authorized: true,
          ...result.data
        });
        checkHoliday();
      });
    };
    const checkHoliday = () => {
      checkHolidayBonus().then(result => {
        if (result.success && result.data) {
          setState({
            showHoliday: true,
            holidayName: result.data
          });
        }
      });
    };
    const handleLogout = async () => {
      const result = await logout();
      if (result.success) {
        setState({
          authorized: false
        });
      }
    };
    const handleShareBonusTest = async () => {
      const result = await getShareBonusTest();
      if (!result.success) {
        alert(result.message);
        return;
      }
      const {
        total,
        temples,
        daily,
        share,
        tax
      } = result.data;
      if (daily) {
        alert(`本期计息股份共${formatNumber(total, 0)}股，圣殿${formatNumber(temples, 0)}座，登录奖励₵${formatNumber(daily, 0)}，预期股息₵${formatNumber(share, 0)}，需缴纳个人所得税₵${formatNumber(tax, 0)}`);
      } else {
        alert(`本期计息股份共${formatNumber(total, 0)}股，圣殿${formatNumber(temples, 0)}座，预期股息₵${formatNumber(share, 0)}，需缴纳个人所得税₵${formatNumber(tax, 0)}`);
      }
    };
    const handleHolidayBonus = async () => {
      const result = await claimHolidayBonus();
      if (result.success) {
        alert(result.data);
        setState({
          showHoliday: false
        });
        loadUserAssets();
      } else {
        alert(result.message);
      }
    };
    const handleDailyBonus = async () => {
      const result = await claimDailyBonus();
      if (result.success) {
        alert(result.data);
        setState({
          showDaily: false
        });
        loadUserAssets();
      } else {
        alert(result.message);
      }
    };
    const handleWeeklyBonus = async () => {
      const result = await claimWeeklyBonus();
      if (result.success) {
        alert(result.data);
        setState({
          showWeekly: false
        });
        loadUserAssets();
      } else {
        alert(result.message);
      }
    };
    const handleOpenScratch = async () => {
      const result = await getDailyEventCount();
      const count = result.success ? result.data : 0;
      setState({
        showScratchModal: true,
        lotusCount: count,
        isLotus: false
      });
    };
    const closeScratchModal = () => {
      closeModalById(generatedScratchModalId);
      setState({
        showScratchModal: false
      });
    };
    const closeScratchResultModal = () => {
      closeModalById(generatedScratchResultModalId);
      setState({
        showScratchResultModal: false,
        scratchResultData: null
      });
    };
    const handleConfirmScratch = async isLotusType => {
      const result = await scratchBonus(isLotusType);
      if (!result.success) {
        alert(result.message);
        return;
      }
      closeScratchModal();
      setState({
        showScratchResultModal: true,
        scratchResultData: result.data
      });
      loadUserAssets();
    };
    loadUserAssets();
    return container;
  }

  const SIGNALR_CDN_URL = "https://cdnjs.cloudflare.com/ajax/libs/microsoft-signalr/8.0.7/signalr.min.js";
  let signalRLoadPromise = null;
  let signalRInstance = null;
  async function loadSignalR() {
    if (signalRInstance) {
      return signalRInstance;
    }
    if (signalRLoadPromise) {
      return signalRLoadPromise;
    }
    signalRLoadPromise = (async () => {
      try {
        const response = await fetch(SIGNALR_CDN_URL);
        if (!response.ok) {
          throw new Error(`加载失败: ${response.status}`);
        }
        const scriptContent = await response.text();
        const wrapper = `
        (function() {
          var exports = {};
          var module = { exports: exports };
          ${scriptContent}
          return module.exports || exports || window.signalR || window.SignalR;
        })()
      `;
        const signalR = eval(wrapper);
        if (!signalR || !signalR.HubConnectionBuilder) {
          throw new Error("SignalR对象无效");
        }
        signalRInstance = signalR;
        return signalR;
      } catch (error) {
        signalRLoadPromise = null;
        console.error("SignalR加载失败:", error);
        throw error;
      }
    })();
    return signalRLoadPromise;
  }
  async function createHubConnection(url, options = {}) {
    const signalR = await loadSignalR();
    const builder = new signalR.HubConnectionBuilder().withUrl(url);
    if (options.automaticReconnect !== false) {
      builder.withAutomaticReconnect();
    }
    return builder.build();
  }

  const FIREWORKS_CDN_URL = "https://cdn.jsdelivr.net/npm/fireworks-js@2.10.8/dist/index.umd.js";
  let fireworksLoadPromise = null;
  let fireworksInstance = null;
  async function loadFireworks() {
    if (fireworksInstance) {
      return fireworksInstance;
    }
    if (fireworksLoadPromise) {
      return fireworksLoadPromise;
    }
    fireworksLoadPromise = (async () => {
      try {
        const response = await fetch(FIREWORKS_CDN_URL);
        if (!response.ok) {
          throw new Error(`加载失败: ${response.status}`);
        }
        const scriptContent = await response.text();
        const wrapper = `
        (function() {
          var exports = {};
          var module = { exports: exports };
          ${scriptContent}
          return module.exports || exports || window.Fireworks;
        })()
      `;
        const Fireworks = eval(wrapper);
        if (!Fireworks || !Fireworks.Fireworks) {
          throw new Error("Fireworks对象无效");
        }
        fireworksInstance = Fireworks;
        return Fireworks;
      } catch (error) {
        fireworksLoadPromise = null;
        console.error("Fireworks加载失败:", error);
        throw error;
      }
    })();
    return fireworksLoadPromise;
  }

  function SegmentedControl({
    options,
    value,
    onChange,
    size = "medium"
  }) {
    if (!options || options.length === 0) {
      return null;
    }
    const sizeClasses = {
      small: "px-2 py-0.5 text-xs",
      medium: "px-4 py-2 text-sm",
      large: "px-5 py-2.5 text-base"
    };
    const buttonClass = sizeClasses[size] || sizeClasses.medium;
    return h("div", {
      id: "tg-segmented-control",
      className: "inline-flex rounded-full bg-gray-100 p-1 dark:bg-gray-800"
    }, options.map(option => {
      const isActive = option.value === value;
      return h("button", {
        className: `${buttonClass} rounded-full font-medium transition-all ${isActive ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white" : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"}`,
        onClick: () => {
          if (!isActive) {
            onChange(option.value);
          }
        }
      }, option.label);
    }));
  }

  function BabelTowerMain({
    data,
    loading,
    onOpenCharacter
  }) {
    if (loading) {
      return h("div", {
        className: "p-4 text-center"
      }, h("p", {
        className: "opacity-60"
      }, "加载中..."));
    }
    if (!data || data.length === 0) {
      return h("div", {
        className: "p-4 text-center"
      }, h("p", {
        className: "opacity-60"
      }, "暂无数据"));
    }
    const cols = data.length === 24 ? 6 : 10;
    const container = h("div", {
      id: "tg-rakuen-home-babel-tower-main",
      className: "grid w-full gap-0.5",
      style: {
        gridTemplateColumns: `repeat(${cols}, 1fr)`
      }
    });
    let currentOpenInfoBox = null;
    const isTouchDevice = "ontouchstart" in window || window.matchMedia("(pointer: coarse)").matches;
    data.forEach((item, index) => {
      const isLeftHalf = index % cols < cols / 2;
      const itemDiv = h("div", {
        "data-character-id": item.Id,
        className: "group relative aspect-square cursor-pointer overflow-visible rounded transition-all hover:scale-105 hover:shadow-lg",
        style: {
          backgroundImage: `url(${normalizeAvatar(item.Icon)})`,
          backgroundSize: "cover",
          backgroundPosition: "top",
          zIndex: 1
        }
      });
      const infoBox = h("div", {
        className: `absolute top-full mt-2 hidden w-48 rounded-lg bg-white p-3 shadow-xl dark:bg-gray-800 ${isLeftHalf ? "left-0" : "right-0"}`,
        style: {
          zIndex: 1000
        }
      });
      const infoContent = h("div", {
        className: "space-y-2 text-xs"
      });
      const rankDiv = h("div", {
        className: "flex items-center gap-2 font-semibold"
      });
      rankDiv.appendChild(h("span", null, "第", item.Rank, "位"));
      rankDiv.appendChild(h(StarLevelIcons, {
        level: item.Stars,
        size: 14
      }));
      infoContent.appendChild(rankDiv);
      const nameDiv = h("div", {
        className: "opacity-80"
      }, "#", item.Id, "「", item.Name, "」");
      infoContent.appendChild(nameDiv);
      const forceDiv = h("div", {
        className: "opacity-60"
      }, "星之力 +", formatNumber(item.StarForces, 0));
      infoContent.appendChild(forceDiv);
      if (isTouchDevice) {
        const viewButton = h(Button, {
          variant: "solid",
          size: "sm",
          className: "mt-1 w-full",
          onClick: e => {
            e.stopPropagation();
            if (onOpenCharacter) {
              onOpenCharacter(item.Id);
            }
          }
        }, "查看角色");
        infoContent.appendChild(viewButton);
      }
      infoBox.appendChild(infoContent);
      itemDiv.appendChild(infoBox);
      itemDiv.addEventListener("mouseenter", () => {
        if (!isTouchDevice) {
          infoBox.style.display = "block";
          itemDiv.style.zIndex = "10";
        }
      });
      itemDiv.addEventListener("mouseleave", () => {
        if (!isTouchDevice) {
          infoBox.style.display = "none";
          itemDiv.style.zIndex = "1";
        }
      });
      itemDiv.addEventListener("click", e => {
        if (e.target.tagName === "BUTTON") {
          return;
        }
        if (isTouchDevice) {
          if (infoBox.style.display === "block") {
            infoBox.style.display = "none";
            itemDiv.style.zIndex = "1";
            currentOpenInfoBox = null;
          } else {
            if (currentOpenInfoBox && currentOpenInfoBox !== infoBox) {
              currentOpenInfoBox.style.display = "none";
              currentOpenInfoBox.parentElement.style.zIndex = "1";
            }
            infoBox.style.display = "block";
            itemDiv.style.zIndex = "10";
            currentOpenInfoBox = infoBox;
          }
        } else {
          if (onOpenCharacter) {
            onOpenCharacter(item.Id);
          }
        }
      });
      container.appendChild(itemDiv);
    });
    document.addEventListener("click", e => {
      if (currentOpenInfoBox && !container.contains(e.target)) {
        currentOpenInfoBox.style.display = "none";
        currentOpenInfoBox.parentElement.style.zIndex = "1";
        currentOpenInfoBox = null;
      }
    });
    return container;
  }

  function ArrowUpIcon({
    className = "w-5 h-5"
  } = {}) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("xmlns", svgNS);
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    if (className) svg.setAttribute("class", className);
    svg.setAttribute("aria-hidden", "true");
    const path1 = document.createElementNS(svgNS, "path");
    path1.setAttribute("d", "m5 12 7-7 7 7");
    svg.appendChild(path1);
    const path2 = document.createElementNS(svgNS, "path");
    path2.setAttribute("d", "M12 19V5");
    svg.appendChild(path2);
    return svg;
  }

  function ArrowDownIcon({
    className = "w-5 h-5"
  } = {}) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("xmlns", svgNS);
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    if (className) svg.setAttribute("class", className);
    svg.setAttribute("aria-hidden", "true");
    const path1 = document.createElementNS(svgNS, "path");
    path1.setAttribute("d", "M12 5v14");
    svg.appendChild(path1);
    const path2 = document.createElementNS(svgNS, "path");
    path2.setAttribute("d", "m19 12-7 7-7-7");
    svg.appendChild(path2);
    return svg;
  }

  function BabelTowerLog({
    logData,
    onOpenCharacter,
    onOpenUser,
    onPageChange
  }) {
    const container = h("div", {
      id: "tg-rakuen-home-babel-tower-log",
      className: "flex flex-col gap-2"
    });
    const logsContainer = h("div", {
      id: "tg-rakuen-home-babel-tower-log-list",
      className: "flex flex-col divide-y divide-gray-200 dark:divide-gray-700"
    });
    container.appendChild(logsContainer);
    const paginationContainer = h("div", {
      className: "mt-2 flex justify-center"
    });
    container.appendChild(paginationContainer);
    const renderLogItem = log => {
      const rankBadge = h(StarRankBadge, {
        rank: log.Rank,
        starForces: log.StarForces,
        size: "sm"
      });
      let rankChange = null;
      if (log.Rank > log.OldRank) {
        rankChange = h("span", {
          className: "inline-flex items-center gap-0.5 text-xs text-[#a7e3ff]"
        }, h(ArrowDownIcon, {
          className: "h-3 w-3"
        }), log.Rank - log.OldRank);
      } else if (log.Rank < log.OldRank) {
        rankChange = h("span", {
          className: "inline-flex items-center gap-0.5 text-xs text-[#ffa7cc]"
        }, h(ArrowUpIcon, {
          className: "h-3 w-3"
        }), log.OldRank - log.Rank);
      }
      let actionInfo;
      switch (log.Type) {
        case 0:
          actionInfo = h("span", {
            className: "tg-link inline-flex cursor-pointer items-center gap-1 leading-none text-[#ffa7cc] hover:opacity-80",
            onClick: e => {
              e.stopPropagation();
              onOpenUser && onOpenUser(log.UserName);
            }
          }, h("span", null, "@", log.Nickname), h("span", null, "+", formatNumber(log.Amount, 0)));
          break;
        case 2:
          actionInfo = h("span", {
            className: "tg-link inline-flex cursor-pointer items-center gap-1 leading-none text-[#ffa7cc] hover:opacity-80",
            onClick: e => {
              e.stopPropagation();
              onOpenUser && onOpenUser(log.UserName);
            }
          }, h("span", null, "@", log.Nickname), h("span", null, "鲤鱼之眼 +", formatNumber(log.Amount, 0)));
          break;
        case 3:
          actionInfo = h("span", {
            className: "tg-link inline-flex cursor-pointer items-center gap-1 leading-none text-[#ffa7cc] hover:opacity-80",
            onClick: e => {
              e.stopPropagation();
              onOpenUser && onOpenUser(log.UserName);
            }
          }, h("span", null, "@", log.Nickname), h("span", null, "精炼成功 +", formatNumber(log.Amount, 0)));
          break;
        case 4:
          actionInfo = h("span", {
            className: "tg-link inline-flex cursor-pointer items-center gap-1 leading-none text-[#a7e3ff] hover:opacity-80",
            onClick: e => {
              e.stopPropagation();
              onOpenUser && onOpenUser(log.UserName);
            }
          }, h("span", null, "@", log.Nickname), h("span", null, "精炼失败 +", formatNumber(log.Amount, 0)));
          break;
        case 5:
          actionInfo = h("span", {
            className: "tg-link inline-flex cursor-pointer items-center gap-1 leading-none text-[#ffa7cc] hover:opacity-80",
            onClick: e => {
              e.stopPropagation();
              onOpenUser && onOpenUser(log.UserName);
            }
          }, h("span", null, "@", log.Nickname), h("span", null, "+", formatNumber(log.Amount, 0)), h("span", {
            className: "inline-flex items-center text-yellow-400"
          }, h(StarIcon, {
            className: "size-3"
          })));
          break;
        default:
          actionInfo = h("span", {
            className: "inline-flex items-center gap-1 leading-none text-[#a7e3ff]"
          }, h("span", null, "受到攻击"), h("span", null, "-", formatNumber(log.Amount, 0)));
      }
      const logItem = h("div", {
        "data-character-id": log.CharacterId,
        className: "flex cursor-pointer gap-2 rounded p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
        onClick: () => onOpenCharacter && onOpenCharacter(log.CharacterId)
      }, h("div", {
        className: "h-10 w-10 flex-shrink-0 cursor-pointer rounded bg-cover bg-top",
        style: {
          backgroundImage: `url(${normalizeAvatar(log.Icon)})`
        }
      }), h("div", {
        className: "flex min-w-0 flex-1 flex-col gap-1"
      }, h("div", {
        className: "flex min-w-0 items-center gap-1.5 text-sm"
      }, h("span", {
        className: "min-w-0 cursor-pointer truncate font-medium hover:opacity-80"
      }, log.CharacterName), h("span", {
        className: "flex flex-shrink-0 items-center gap-1"
      }, rankBadge, rankChange)), h("div", {
        className: "flex items-center justify-between gap-1 text-xs"
      }, actionInfo, h("span", {
        className: "flex-shrink-0 opacity-60"
      }, formatTimeAgo(log.LogTime)))));
      return logItem;
    };
    const renderLogs = () => {
      logsContainer.innerHTML = "";
      if (!logData || !logData.Items || logData.Items.length === 0) {
        const emptyDiv = h("div", {
          className: "p-4 text-center text-sm opacity-60"
        }, "暂无日志");
        logsContainer.appendChild(emptyDiv);
        return;
      }
      logData.Items.forEach(log => {
        const logItem = renderLogItem(log);
        logsContainer.appendChild(logItem);
      });
    };
    const renderPagination = () => {
      paginationContainer.innerHTML = "";
      if (!logData || !logData.Items || logData.Items.length === 0) {
        return;
      }
      const currentPage = logData.CurrentPage || 1;
      const pagination = h(Pagination, {
        current: currentPage,
        type: "simple",
        onChange: page => onPageChange && onPageChange(page)
      });
      paginationContainer.appendChild(pagination);
    };
    renderLogs();
    renderPagination();
    return container;
  }

  function BabelTower() {
    const container = h("div", {
      id: "tg-rakuen-home-babel-tower",
      className: "tg-bg-content tg-border-card my-2 rounded-xl p-3 shadow-sm transition-shadow hover:shadow-md"
    });
    let generatedCharacterModalId = null;
    let generatedUserModalId = null;
    let generatedLogModalId = null;
    const isModalExist = modalId => {
      return modalId && document.querySelector(`#tg-modal[data-modal-id="${modalId}"]`)?.parentNode === document.body;
    };
    const dataOptions = [{
      value: 24,
      label: "24"
    }, {
      value: 100,
      label: "100"
    }, {
      value: 200,
      label: "200"
    }, {
      value: 300,
      label: "300"
    }, {
      value: 400,
      label: "400"
    }, {
      value: 500,
      label: "500"
    }];
    const openCharacter = characterId => {
      setState({
        showCharacterModal: true,
        characterModalId: characterId
      });
    };
    const openUser = userName => {
      setState({
        showUserModal: true,
        userModalName: userName
      });
    };
    let signalRConnection = null;
    let currentState = {};
    let lastFireworksTime = 0;
    const FIREWORKS_COOLDOWN = 5000;
    const {
      setState
    } = createMountedComponent(container, state => {
      currentState = state || {};
      const {
        showLogOnSide = true,
        data = null,
        loading = true,
        dataCount = 24,
        showCharacterModal = false,
        characterModalId = null,
        showUserModal = false,
        userModalName = null,
        showLogModal = false,
        logData = null
      } = state || {};
      const headerDiv = h("div", {
        id: "tg-rakuen-home-babel-tower-header",
        className: "mb-3 flex items-center justify-between gap-2"
      });
      const leftDiv = h("div", {
        className: "flex items-center gap-2"
      });
      const titleDiv = h("div", {
        id: "tg-rakuen-home-babel-tower-title",
        className: "text-sm font-semibold"
      }, "/ 通天塔(β)");
      leftDiv.appendChild(titleDiv);
      if (!showLogOnSide) {
        const logButton = h("button", {
          className: "flex items-center gap-0.5 rounded-full border border-gray-300 px-2 py-0.5 text-xs transition-colors hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700",
          onClick: () => setState({
            showLogModal: true
          })
        }, h("span", null, "通天塔日志"), h("span", {
          className: "opacity-60"
        }, h(ChevronRightIcon, {
          className: "size-3"
        })));
        leftDiv.appendChild(logButton);
      }
      headerDiv.appendChild(leftDiv);
      const segmentedControl = h(SegmentedControl, {
        options: dataOptions,
        value: dataCount,
        onChange: value => {
          setState({
            dataCount: value
          });
          loadBabelTowerData(value);
        },
        size: "small"
      });
      headerDiv.appendChild(segmentedControl);
      const contentDiv = h("div", {
        id: "tg-rakuen-home-babel-tower-content",
        className: "grid auto-rows-min grid-cols-[2fr_1fr] gap-4"
      });
      const mainDiv = h("div", null);
      mainDiv.appendChild(h(BabelTowerMain, {
        data: data,
        loading: loading,
        onOpenCharacter: openCharacter
      }));
      contentDiv.appendChild(mainDiv);
      if (showLogOnSide) {
        const logDiv = h("div", {
          className: "h-0 max-h-full min-h-full overflow-y-auto"
        });
        const logComponent = h(BabelTowerLog, {
          logData: logData,
          onOpenCharacter: openCharacter,
          onOpenUser: openUser,
          onPageChange: page => loadBabelTowerLogData(page)
        });
        logDiv.appendChild(logComponent);
        contentDiv.appendChild(logDiv);
      } else {
        contentDiv.style.gridTemplateColumns = "1fr";
      }
      const wrapper = h("div", null);
      wrapper.appendChild(headerDiv);
      wrapper.appendChild(contentDiv);
      if (showCharacterModal && characterModalId && !isModalExist(generatedCharacterModalId)) {
        const modal = h(Modal, {
          visible: showCharacterModal,
          onClose: () => setState({
            showCharacterModal: false
          }),
          modalId: generatedCharacterModalId,
          getModalId: id => {
            generatedCharacterModalId = id;
          }
        }, h(CharacterBox, {
          characterId: characterModalId,
          sticky: true,
          stickyTop: -16
        }));
        wrapper.appendChild(modal);
      }
      if (showUserModal && userModalName && !isModalExist(generatedUserModalId)) {
        const userModal = h(Modal, {
          visible: showUserModal,
          onClose: () => setState({
            showUserModal: false
          }),
          modalId: generatedUserModalId,
          getModalId: id => {
            generatedUserModalId = id;
          }
        }, h(UserTinygrail, {
          username: userModalName
        }));
        wrapper.appendChild(userModal);
      }
      if (showLogModal && !isModalExist(generatedLogModalId)) {
        const logModal = h(Modal, {
          visible: showLogModal,
          onClose: () => setState({
            showLogModal: false
          }),
          title: "通天塔日志",
          padding: "p-4 pt-0",
          modalId: generatedLogModalId,
          getModalId: id => {
            generatedLogModalId = id;
          }
        }, h(BabelTowerLog, {
          logData: logData,
          onOpenCharacter: openCharacter,
          onOpenUser: openUser,
          onPageChange: page => loadBabelTowerLogData(page)
        }));
        wrapper.appendChild(logModal);
      }
      return wrapper;
    });
    const loadBabelTowerData = async dataCount => {
      setState({
        loading: true
      });
      let page, pageSize;
      if (dataCount === 24) {
        page = 1;
        pageSize = 24;
      } else {
        page = dataCount / 100;
        pageSize = 100;
      }
      const result = await getBabelTower(page, pageSize);
      if (result.success) {
        setState({
          data: result.data,
          loading: false
        });
      } else {
        setState({
          data: null,
          loading: false
        });
      }
    };
    const loadBabelTowerLogData = async (page = 1) => {
      const result = await getStarLog(page, 30);
      if (result.success) {
        const newLogData = result.data;
        setState({
          logData: newLogData
        });
        if (currentState.showLogModal && generatedLogModalId) {
          const modalBody = document.querySelector(`#tg-modal[data-modal-id="${generatedLogModalId}"] #tg-modal-body`);
          if (modalBody) {
            modalBody.innerHTML = "";
            const newLogComponent = h(BabelTowerLog, {
              logData: newLogData,
              onOpenCharacter: openCharacter,
              onOpenUser: openUser,
              onPageChange: page => loadBabelTowerLogData(page)
            });
            modalBody.appendChild(newLogComponent);
          }
        }
      }
    };
    const initSignalRConnection = async () => {
      if (signalRConnection) {
        return;
      }
      try {
        const connection = await createHubConnection("https://tinygrail.com/actionhub", {
          automaticReconnect: true
        });
        connection.on("ReceiveStarLog", log => {
          const currentLogData = currentState.logData;
          if (currentLogData && currentLogData.CurrentPage === 1 && currentLogData.Items) {
            const isDuplicate = currentLogData.Items.some(item => item.Id === log.Id);
            if (isDuplicate) {
              return;
            }
            const newItems = [log, ...currentLogData.Items];
            if (newItems.length > 30) {
              newItems.length = 30;
            }
            setState({
              logData: {
                ...currentLogData,
                Items: newItems
              }
            });
          }
          if (log.Type === 3 || log.Type === 4) {
            beginFireworks(log.Amount);
          }
        });
        await connection.start();
        connection.onreconnecting(error => {
          console.warn("SignalR正在重连...", error);
        });
        connection.onreconnected(connectionId => {
          console.log("SignalR重连成功:", connectionId);
        });
        connection.onclose(error => {
          console.error("SignalR连接关闭:", error);
        });
        signalRConnection = connection;
      } catch (error) {
        console.error("SignalR初始化失败:", error);
      }
    };
    const beginFireworks = async count => {
      const now = Date.now();
      if (now - lastFireworksTime < FIREWORKS_COOLDOWN) {
        return;
      }
      lastFireworksTime = now;
      const num = Math.floor(Math.random() * 10001);
      const id = `fireBox${num}`;
      let totalTime = 0;
      const existingBox = document.getElementById(id);
      if (existingBox) {
        existingBox.remove();
      }
      const fireboxDiv = h("div", {
        id: id,
        style: {
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 9999
        }
      });
      document.body.appendChild(fireboxDiv);
      try {
        const Fireworks = await loadFireworks();
        const param = {
          autoresize: true,
          opacity: 0.5,
          acceleration: 1,
          friction: 0.97,
          gravity: 0.98,
          particles: 180,
          traceLength: 3,
          traceSpeed: 5,
          explosion: 1,
          intensity: 30,
          flickering: 50
        };
        const fireworks = new Fireworks.Fireworks(fireboxDiv, param);
        for (let i = 0; i < count; i++) {
          const time = Math.random() * 1000;
          totalTime += time;
          setTimeout(() => {
            fireworks.launch(1);
          }, totalTime);
        }
        setTimeout(() => {
          fireworks.stop();
          const box = document.getElementById(id);
          if (box) {
            box.remove();
          }
        }, totalTime + count * 1000);
      } catch (error) {
        console.error("烟花效果失败:", error);
        const box = document.getElementById(id);
        if (box) {
          box.remove();
        }
      }
    };
    const updateLayout = width => {
      const showLogOnSide = width >= 768;
      setState({
        showLogOnSide
      });
    };
    const initialWidth = container.offsetWidth || window.innerWidth;
    updateLayout(initialWidth);
    loadBabelTowerData(24);
    loadBabelTowerLogData();
    initSignalRConnection();
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        updateLayout(width);
      }
    });
    observer.observe(container);
    return container;
  }

  function TopWeekHistory({
    historyData = [],
    currentPage = 1,
    onPageChange,
    onCharacterClick
  }) {
    const container = h("div", {
      id: "tg-rakuen-home-top-week-history",
      className: "min-w-96"
    });
    if (!historyData || historyData.length === 0) {
      container.appendChild(h("div", {
        className: "text-center text-sm opacity-60"
      }, h("p", null, "暂无数据")));
      return container;
    }
    const getWeek = date => {
      const d1 = new Date(date);
      const d2 = new Date(date);
      d2.setMonth(0);
      d2.setDate(1);
      const rq = d1 - d2;
      const days = Math.ceil(rq / (24 * 60 * 60 * 1000));
      const week = Math.ceil(days / 7);
      return {
        year: d1.getFullYear(),
        week
      };
    };
    const firstItem = historyData[0];
    const {
      year,
      week
    } = getWeek(firstItem.Create);
    const weekTitle = h("div", {
      id: "tg-rakuen-home-top-week-history-title",
      className: "text-sm font-semibold opacity-80"
    }, year, "年第", week, "周");
    container.appendChild(weekTitle);
    const itemsContainer = h("div", {
      id: "tg-rakuen-home-top-week-history-list",
      className: "divide-y divide-gray-200 dark:divide-gray-700"
    });
    [...historyData].reverse().forEach(item => {
      const avatarUrl = normalizeAvatar(item.Avatar);
      const rank = item.Level;
      const getRankColor = rank => {
        if (rank === 1) return "#ffc107";
        if (rank === 2) return "#c0c0c0";
        if (rank === 3) return "#b36b00";
        return "#ddd";
      };
      const rankColor = getRankColor(rank);
      const itemDiv = h("div", {
        className: "flex cursor-pointer items-center gap-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800",
        onClick: () => onCharacterClick && onCharacterClick(item.CharacterId),
        "data-character-id": item.CharacterId,
        "data-rank": rank
      }, h("div", {
        className: "flex w-6 flex-shrink-0 justify-center text-base font-bold",
        style: {
          color: rankColor
        }
      }, rank), h("div", {
        className: `size-10 flex-shrink-0 rounded-lg border ${rank <= 3 ? "border-opacity-80" : "border-transparent"}`,
        style: {
          borderColor: rank <= 3 ? rankColor : "transparent",
          boxShadow: rank === 1 ? "#fff555 0px 0px 3px 1px" : "none"
        }
      }, h("div", {
        className: "size-full rounded-lg bg-cover bg-top",
        style: {
          backgroundImage: `url(${avatarUrl})`
        }
      })), h("div", {
        className: "flex-1"
      }, h("div", {
        className: "flex items-center gap-1 text-sm font-semibold"
      }, h(LevelBadge, {
        level: item.CharacterLevel,
        zeroCount: item.ZeroCount
      }), h("span", null, item.Name)), h("div", {
        className: "mt-0.5 text-xs opacity-60",
        title: "超出总额 / 总额 / 人数"
      }, "+", formatCurrency(item.Extra || 0, "₵", 0, false), " /", " ", formatCurrency(item.Price || 0, "₵", 0, false), " / ", formatNumber(item.Assets || 0, 0))));
      itemsContainer.appendChild(itemDiv);
    });
    container.appendChild(itemsContainer);
    if (historyData.length > 0) {
      const paginationDiv = h("div", {
        id: "tg-rakuen-home-top-week-history-pagination",
        className: "mt-2 flex justify-center"
      }, h(Pagination, {
        current: currentPage,
        onChange: onPageChange,
        type: "simple"
      }));
      container.appendChild(paginationDiv);
    }
    return container;
  }

  function TopWeek() {
    const container = h("div", {
      id: "tg-rakuen-home-top-week",
      className: "tg-bg-content tg-border-card my-2 rounded-xl p-3 shadow-sm transition-shadow hover:shadow-md"
    });
    let generatedCharacterModalId = null;
    let generatedAuctionModalId = null;
    let generatedHistoryModalId = null;
    const isModalExist = modalId => {
      return modalId && document.querySelector(`#tg-modal[data-modal-id="${modalId}"]`)?.parentNode === document.body;
    };
    const {
      setState
    } = createMountedComponent(container, state => {
      const {
        topWeekData = null,
        showCharacterModal = false,
        characterModalId = null,
        showTempleModal = false,
        templeModalData = null,
        showAuctionModal = false,
        auctionData = null,
        isRefreshing = false,
        showHistoryModal = false,
        historyData = null,
        historyCurrentPage = 1
      } = state || {};
      const handleRefresh = async () => {
        if (isRefreshing) return;
        setState({
          isRefreshing: true
        });
        await loadTopWeekData();
        setState({
          isRefreshing: false
        });
      };
      const handleCharacterClick = characterId => {
        setState({
          showCharacterModal: true,
          characterModalId: characterId
        });
      };
      const handleTempleClick = temple => {
        setState({
          showTempleModal: true,
          templeModalData: temple
        });
      };
      const handleAuctionClick = item => {
        setState({
          showAuctionModal: true,
          auctionData: item
        });
      };
      const handleHistoryClick = async () => {
        setState({
          showHistoryModal: true,
          historyData: null,
          historyCurrentPage: 1
        });
        const result = await getTopWeekHistory(1);
        if (result.success) {
          setState({
            historyData: result.data.items,
            historyCurrentPage: result.data.currentPage
          });
        }
      };
      const handleHistoryPageChange = async page => {
        const result = await getTopWeekHistory(page);
        if (result.success) {
          const newHistoryData = result.data.items;
          const newCurrentPage = result.data.currentPage;
          setState({
            historyData: newHistoryData,
            historyCurrentPage: newCurrentPage
          });
          if (generatedHistoryModalId) {
            const modalBody = document.querySelector(`#tg-modal[data-modal-id="${generatedHistoryModalId}"] #tg-modal-body > div`);
            if (modalBody) {
              modalBody.innerHTML = "";
              const newHistoryComponent = h(TopWeekHistory, {
                historyData: newHistoryData,
                currentPage: newCurrentPage,
                onPageChange: handleHistoryPageChange,
                onCharacterClick: characterId => {
                  setState({
                    showHistoryModal: false,
                    showCharacterModal: true,
                    characterModalId: characterId
                  });
                }
              });
              modalBody.appendChild(newHistoryComponent);
            }
          }
        }
      };
      const titleDiv = h("div", {
        id: "tg-rakuen-home-top-week-header",
        className: "flex items-center justify-between"
      }, h("div", {
        className: "flex items-center gap-2"
      }, h("div", {
        className: "text-sm font-semibold"
      }, "/ 每周萌王"), h("button", {
        id: "tg-rakuen-home-top-week-history-button",
        className: "flex items-center gap-0.5 rounded-full border border-gray-300 px-2 py-0.5 text-xs transition-colors hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700",
        onClick: handleHistoryClick
      }, h("span", null, "往期萌王"), h("span", {
        className: "opacity-60"
      }, h(ChevronRightIcon, {
        className: "size-3"
      })))), h("button", {
        id: "tg-rakuen-home-top-week-refresh",
        className: "tg-link flex items-center gap-1 text-xs opacity-60 transition-opacity hover:opacity-100",
        onClick: handleRefresh,
        title: "刷新"
      }, h(RefreshCwIcon, {
        className: `size-4 ${isRefreshing ? "animate-spin" : ""}`
      })));
      const contentDiv = h("div", {
        id: "tg-rakuen-home-top-week-content",
        className: "mt-3"
      });
      if (!topWeekData) {
        contentDiv.appendChild(h("div", {
          className: "text-center text-sm opacity-60"
        }, h("p", null, "加载中...")));
      } else if (!topWeekData.length || topWeekData.length === 0) {
        contentDiv.appendChild(h("div", {
          className: "text-center text-sm opacity-60"
        }, h("p", null, "暂无数据")));
      } else {
        const gridDiv = h("div", {
          id: "tg-rakuen-home-top-week-list",
          className: "grid w-full gap-4"
        });
        const renderItems = cols => {
          gridDiv.innerHTML = "";
          gridDiv.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
          topWeekData.forEach((item, index) => {
            const cover = getCover(item.Cover);
            const hasCover = !!item.Cover;
            const avatarUrl = normalizeAvatar(item.Avatar);
            const rank = index + 1;
            const getRankColor = rank => {
              if (rank === 1) return "#ffc107";
              if (rank === 2) return "#c0c0c0";
              if (rank === 3) return "#b36b00";
              return "#ddd";
            };
            const rankColor = getRankColor(rank);
            const itemContainer = h("div", {
              className: "flex w-full flex-col gap-1",
              "data-character-id": item.CharacterId,
              "data-rank": rank
            }, h("div", {
              className: "group relative aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-lg border-2",
              style: {
                borderColor: rankColor
              },
              onClick: () => handleTempleClick(item)
            }, hasCover ? h("div", {
              className: "h-full w-full",
              style: {
                backgroundImage: `url(${cover})`,
                backgroundPosition: "top",
                backgroundSize: "cover"
              }
            }) : h("div", null, h("div", {
              className: "absolute inset-0",
              style: {
                backgroundImage: `url(${avatarUrl})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
                filter: "blur(10px)"
              }
            }), h("div", {
              className: "absolute inset-0 flex items-center justify-center"
            }, h("div", {
              className: "aspect-square w-1/2 rounded-full bg-cover bg-top",
              style: {
                backgroundImage: `url(${avatarUrl})`
              }
            }))), h("div", {
              className: `absolute left-1 top-1 flex items-center justify-center rounded-full px-2 text-white ${rank <= 3 ? "size-6 text-base font-bold" : "size-5 text-xs font-semibold"}`,
              style: {
                backgroundColor: rankColor
              }
            }, rank), item.Extra !== undefined && h("div", {
              className: `absolute bottom-5 right-0 rounded-l-md px-2 py-0.5 text-xs font-semibold ${rank <= 3 ? "text-white" : "text-gray-700"}`,
              style: {
                backgroundColor: rankColor
              },
              title: "超出总额"
            }, "+", formatCurrency(item.Extra, "₵", 0, false))), h("div", {
              className: "flex flex-col gap-0.5"
            }, h("div", {
              className: "flex items-center justify-start gap-1 text-sm"
            }, h(LevelBadge, {
              level: item.CharacterLevel,
              zeroCount: item.ZeroCount
            }), h("span", {
              className: "tg-link cursor-pointer font-semibold opacity-80 hover:opacity-100",
              onClick: () => handleCharacterClick(item.CharacterId)
            }, item.CharacterName)), h("div", {
              className: "tg-link cursor-pointer text-xs opacity-60 hover:opacity-100",
              title: "竞拍人数 / 竞拍数量 / 拍卖总数",
              onClick: () => handleAuctionClick(item)
            }, formatNumber(item.Type || 0, 0), " / ", formatNumber(item.Assets || 0, 0), " /", " ", formatNumber(item.Sacrifices || 0, 0))));
            gridDiv.appendChild(itemContainer);
          });
        };
        const calculateColumns = width => {
          const minCellWidth = 120;
          const gap = 16;
          let cols = Math.floor((width + gap) / (minCellWidth + gap));
          const divisors = [12, 6, 4, 3, 2, 1];
          for (const divisor of divisors) {
            if (cols >= divisor) {
              return divisor;
            }
          }
          return 1;
        };
        const initialCols = calculateColumns(contentDiv.offsetWidth || 800);
        renderItems(initialCols);
        contentDiv.appendChild(gridDiv);
        const observer = new ResizeObserver(entries => {
          for (const entry of entries) {
            const width = entry.contentRect.width;
            const newCols = calculateColumns(width);
            renderItems(newCols);
          }
        });
        observer.observe(contentDiv);
      }
      return h("div", null, titleDiv, contentDiv, showCharacterModal && characterModalId && !isModalExist(generatedCharacterModalId) && h(Modal, {
        visible: showCharacterModal,
        onClose: () => setState({
          showCharacterModal: false
        }),
        modalId: generatedCharacterModalId,
        getModalId: id => {
          generatedCharacterModalId = id;
        }
      }, h(CharacterBox, {
        characterId: characterModalId,
        sticky: true,
        stickyTop: -16
      })), showTempleModal && templeModalData && h(Modal, {
        visible: showTempleModal,
        onClose: () => setState({
          showTempleModal: false
        }),
        position: "center",
        maxWidth: 1080,
        padding: "p-0"
      }, h(TempleDetail, {
        temple: templeModalData,
        characterName: templeModalData.Name,
        imageOnly: true
      })), showAuctionModal && auctionData && !isModalExist(generatedAuctionModalId) && h(Modal, {
        visible: showAuctionModal,
        onClose: () => {
          setState({
            showAuctionModal: false
          });
          handleRefresh();
        },
        title: `拍卖 - #${auctionData.CharacterId ?? ""}「${auctionData.CharacterName ?? ""}」`,
        position: "center",
        maxWidth: 480,
        modalId: generatedAuctionModalId,
        getModalId: id => {
          generatedAuctionModalId = id;
        }
      }, h(Auction, {
        characterId: auctionData.CharacterId,
        basePrice: auctionData.Price ?? 0,
        maxAmount: auctionData.Sacrifices ?? 0
      })), showHistoryModal && historyData && !isModalExist(generatedHistoryModalId) && h(Modal, {
        visible: showHistoryModal,
        onClose: () => setState({
          showHistoryModal: false
        }),
        title: "往期萌王",
        position: "center",
        maxWidth: 600,
        padding: "p-4",
        modalId: generatedHistoryModalId,
        getModalId: id => {
          generatedHistoryModalId = id;
        }
      }, h(TopWeekHistory, {
        historyData: historyData,
        currentPage: historyCurrentPage,
        onPageChange: handleHistoryPageChange,
        onCharacterClick: characterId => {
          setState({
            showHistoryModal: false,
            showCharacterModal: true,
            characterModalId: characterId
          });
        }
      })));
    });
    const loadTopWeekData = async () => {
      const result = await getTopWeek();
      if (result.success) {
        setState({
          topWeekData: result.data
        });
      } else {
        setState({
          topWeekData: []
        });
      }
    };
    loadTopWeekData();
    return container;
  }

  function LatestLinks() {
    const container = h("div", {
      id: "tg-rakuen-home-latest-links",
      className: "tg-bg-content tg-border-card my-2 rounded-xl p-3 shadow-sm transition-shadow hover:shadow-md"
    });
    let generatedCharacterModalId = null;
    let generatedUserModalId = null;
    const isModalExist = modalId => {
      return modalId && document.querySelector(`#tg-modal[data-modal-id="${modalId}"]`)?.parentNode === document.body;
    };
    const {
      setState
    } = createMountedComponent(container, state => {
      const {
        linksData = null,
        showCharacterModal = false,
        characterModalId = null,
        showTempleModal = false,
        templeModalData = null,
        showUserModal = false,
        userModalName = null
      } = state || {};
      const handleCharacterClick = characterId => {
        setState({
          showCharacterModal: true,
          characterModalId: characterId
        });
      };
      const handleTempleClick = temple => {
        setState({
          showTempleModal: true,
          templeModalData: temple
        });
      };
      const handleUserClick = username => {
        setState({
          showUserModal: true,
          userModalName: username
        });
      };
      const handlePageChange = async page => {
        const result = await getLatestLinks(page);
        if (result.success) {
          setState({
            linksData: result.data
          });
        }
      };
      const titleDiv = h("div", {
        id: "tg-rakuen-home-latest-links-header",
        className: "flex items-center justify-between"
      }, h("div", {
        id: "tg-rakuen-home-latest-links-title",
        className: "text-sm font-semibold"
      }, "/ 最新连接"));
      const contentDiv = h("div", {
        id: "tg-rakuen-home-latest-links-content",
        className: "mt-3"
      });
      if (!linksData) {
        contentDiv.appendChild(h("div", {
          className: "text-center text-sm opacity-60"
        }, h("p", null, "加载中...")));
      } else if (!linksData.items || linksData.items.length === 0) {
        contentDiv.appendChild(h("div", {
          className: "text-center text-sm opacity-60"
        }, h("p", null, "暂无数据")));
      } else {
        const gridDiv = h("div", {
          className: "grid w-full justify-items-center gap-4"
        });
        const renderItems = (cols, size) => {
          gridDiv.innerHTML = "";
          gridDiv.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
          let i = 0;
          while (i < linksData.items.length - 1) {
            const temple1 = linksData.items[i];
            const temple2 = linksData.items[i + 1];
            if (temple1.LinkId === temple2.CharacterId) {
              const processedTemple1 = {
                ...temple1,
                Name: temple1.CharacterName
              };
              const processedTemple2 = {
                ...temple2,
                Name: temple2.CharacterName
              };
              const minAssets = Math.min(temple1.Assets, temple2.Assets);
              const itemContainer = h("div", {
                className: "flex flex-col items-start gap-1"
              }, h(TempleLink, {
                temple1: processedTemple1,
                temple2: processedTemple2,
                size: size,
                onNameClick: data => {
                  handleCharacterClick(data.CharacterId);
                },
                onCoverClick: data => {
                  handleTempleClick(data);
                }
              }), h("div", {
                className: "tg-link cursor-pointer text-xs opacity-80 hover:opacity-100",
                onClick: () => handleUserClick(temple1.Name)
              }, "@", temple1.Nickname, " +", formatNumber(minAssets, 0)));
              gridDiv.appendChild(itemContainer);
              i += 2;
            } else {
              i += 1;
            }
          }
        };
        const calculateColumns = width => {
          const newSize = width >= 440 ? "small" : "mini";
          const minCellWidth = newSize === "small" ? 214 : 188;
          const gap = 8;
          let cols = Math.floor((width + gap) / (minCellWidth + gap));
          const divisors = [12, 6, 4, 3, 2, 1];
          for (const divisor of divisors) {
            if (cols >= divisor) {
              return {
                cols: divisor,
                size: newSize
              };
            }
          }
          return {
            cols: 1,
            size: newSize
          };
        };
        const initial = calculateColumns(contentDiv.offsetWidth || 800);
        renderItems(initial.cols, initial.size);
        contentDiv.appendChild(gridDiv);
        if (linksData.totalPages && linksData.totalPages >= 1) {
          const paginationDiv = h("div", {
            className: "mt-4 flex w-full justify-center"
          });
          const pagination = h(Pagination, {
            current: Number(linksData.currentPage) || 1,
            onChange: handlePageChange,
            type: "simple"
          });
          paginationDiv.appendChild(pagination);
          contentDiv.appendChild(paginationDiv);
        }
        const observer = new ResizeObserver(entries => {
          for (const entry of entries) {
            const width = entry.contentRect.width;
            const result = calculateColumns(width);
            renderItems(result.cols, result.size);
          }
        });
        observer.observe(contentDiv);
      }
      return h("div", null, titleDiv, contentDiv, showCharacterModal && characterModalId && !isModalExist(generatedCharacterModalId) && h(Modal, {
        visible: showCharacterModal,
        onClose: () => setState({
          showCharacterModal: false
        }),
        modalId: generatedCharacterModalId,
        getModalId: id => {
          generatedCharacterModalId = id;
        }
      }, h(CharacterBox, {
        characterId: characterModalId,
        sticky: true,
        stickyTop: -16
      })), showTempleModal && templeModalData && h(Modal, {
        visible: showTempleModal,
        onClose: () => setState({
          showTempleModal: false
        }),
        position: "center",
        maxWidth: 1080,
        padding: "p-0"
      }, h(TempleDetail, {
        temple: templeModalData,
        characterName: templeModalData.Name
      })), showUserModal && userModalName && !isModalExist(generatedUserModalId) && h(Modal, {
        visible: showUserModal,
        onClose: () => setState({
          showUserModal: false
        }),
        modalId: generatedUserModalId,
        getModalId: id => {
          generatedUserModalId = id;
        }
      }, h(UserTinygrail, {
        username: userModalName,
        stickyTop: "-16px"
      })));
    });
    const loadLatestLinksData = async () => {
      const result = await getLatestLinks(1);
      if (result.success) {
        setState({
          linksData: result.data
        });
      } else {
        setState({
          linksData: {
            items: []
          }
        });
      }
    };
    loadLatestLinksData();
    return container;
  }

  function LatestTemples() {
    const container = h("div", {
      id: "tg-rakuen-home-latest-temples",
      className: "tg-bg-content tg-border-card my-2 rounded-xl p-3 shadow-sm transition-shadow hover:shadow-md"
    });
    let generatedCharacterModalId = null;
    let generatedUserModalId = null;
    const isModalExist = modalId => {
      return modalId && document.querySelector(`#tg-modal[data-modal-id="${modalId}"]`)?.parentNode === document.body;
    };
    const {
      setState
    } = createMountedComponent(container, state => {
      const {
        templesData = null,
        showCharacterModal = false,
        characterModalId = null,
        showTempleModal = false,
        templeModalData = null,
        showUserModal = false,
        userModalName = null
      } = state || {};
      const handleCharacterClick = characterId => {
        setState({
          showCharacterModal: true,
          characterModalId: characterId
        });
      };
      const handleTempleClick = temple => {
        setState({
          showTempleModal: true,
          templeModalData: temple
        });
      };
      const handleUserClick = username => {
        setState({
          showUserModal: true,
          userModalName: username
        });
      };
      const handlePageChange = async page => {
        const result = await getLatestTemples(page);
        if (result.success) {
          setState({
            templesData: result.data
          });
        }
      };
      const titleDiv = h("div", {
        id: "tg-rakuen-home-latest-temples-header",
        className: "flex items-center justify-between"
      }, h("div", {
        id: "tg-rakuen-home-latest-temples-title",
        className: "text-sm font-semibold"
      }, "/ 最新圣殿"));
      const contentDiv = h("div", {
        id: "tg-rakuen-home-latest-temples-content",
        className: "mt-3"
      });
      if (!templesData) {
        contentDiv.appendChild(h("div", {
          className: "text-center text-sm opacity-60"
        }, h("p", null, "加载中...")));
      } else if (!templesData.items || templesData.items.length === 0) {
        contentDiv.appendChild(h("div", {
          className: "text-center text-sm opacity-60"
        }, h("p", null, "暂无数据")));
      } else {
        const gridDiv = h("div", {
          className: "grid w-full gap-4"
        });
        const renderItems = cols => {
          gridDiv.innerHTML = "";
          gridDiv.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
          templesData.items.forEach(item => {
            const processedTemple = {
              ...item,
              Name: item.CharacterName
            };
            const itemContainer = h("div", {
              className: "flex w-full min-w-0 flex-col gap-1"
            }, h(Temple, {
              temple: processedTemple,
              bottomText: `+${formatNumber(item.Rate)}`,
              onClick: temple => {
                handleTempleClick(temple);
              },
              showProgress: false
            }), h("div", {
              className: "flex min-w-0 items-center justify-start gap-1 text-sm"
            }, h(LevelBadge, {
              level: item.CharacterLevel,
              zeroCount: item.ZeroCount
            }), h("span", {
              className: "tg-link min-w-0 cursor-pointer truncate opacity-80 hover:opacity-100",
              onClick: () => {
                handleCharacterClick(item.CharacterId);
              }
            }, item.CharacterName)), h("div", {
              className: "text-xs opacity-60"
            }, h("div", {
              className: "tg-link cursor-pointer truncate hover:opacity-100",
              onClick: () => handleUserClick(item.Name)
            }, "@", item.Nickname)));
            gridDiv.appendChild(itemContainer);
          });
        };
        const calculateColumns = width => {
          const minCellWidth = 120;
          const gap = 16;
          let cols = Math.floor((width + gap) / (minCellWidth + gap));
          const divisors = [24, 12, 8, 6, 4, 3, 2, 1];
          for (const divisor of divisors) {
            if (cols >= divisor) {
              return divisor;
            }
          }
          return 1;
        };
        const initialCols = calculateColumns(contentDiv.offsetWidth || 800);
        renderItems(initialCols);
        contentDiv.appendChild(gridDiv);
        if (templesData.totalPages && templesData.totalPages >= 1) {
          const paginationDiv = h("div", {
            className: "mt-4 flex w-full justify-center"
          });
          const pagination = h(Pagination, {
            current: Number(templesData.currentPage) || 1,
            onChange: handlePageChange,
            type: "simple"
          });
          paginationDiv.appendChild(pagination);
          contentDiv.appendChild(paginationDiv);
        }
        const observer = new ResizeObserver(entries => {
          for (const entry of entries) {
            const width = entry.contentRect.width;
            const newCols = calculateColumns(width);
            renderItems(newCols);
          }
        });
        observer.observe(contentDiv);
      }
      return h("div", null, titleDiv, contentDiv, showCharacterModal && characterModalId && !isModalExist(generatedCharacterModalId) && h(Modal, {
        visible: showCharacterModal,
        onClose: () => setState({
          showCharacterModal: false
        }),
        modalId: generatedCharacterModalId,
        getModalId: id => {
          generatedCharacterModalId = id;
        }
      }, h(CharacterBox, {
        characterId: characterModalId,
        sticky: true,
        stickyTop: -16
      })), showTempleModal && templeModalData && h(Modal, {
        visible: showTempleModal,
        onClose: () => setState({
          showTempleModal: false
        }),
        position: "center",
        maxWidth: 1080,
        padding: "p-0"
      }, h(TempleDetail, {
        temple: templeModalData,
        characterName: templeModalData.Name
      })), showUserModal && userModalName && !isModalExist(generatedUserModalId) && h(Modal, {
        visible: showUserModal,
        onClose: () => setState({
          showUserModal: false
        }),
        modalId: generatedUserModalId,
        getModalId: id => {
          generatedUserModalId = id;
        }
      }, h(UserTinygrail, {
        username: userModalName,
        stickyTop: "-16px"
      })));
    });
    const loadLatestTemplesData = async () => {
      const result = await getLatestTemples(1);
      if (result.success) {
        setState({
          templesData: result.data
        });
      } else {
        setState({
          templesData: {
            items: []
          }
        });
      }
    };
    loadLatestTemplesData();
    return container;
  }

  function HomeTab() {
    return h("div", {
      id: "tg-rakuen-home-home-tab"
    }, h(BabelTower, null), h(TopWeek, null), h(LatestLinks, null), h(LatestTemples, null));
  }

  function RefineRank({
    data,
    onPageChange,
    onCharacterClick,
    onTempleClick,
    onUserClick
  }) {
    if (!data || !data.items || data.items.length === 0) {
      return h("div", {
        className: "text-center text-sm opacity-60"
      }, h("p", null, "暂无数据"));
    }
    const container = h("div", {
      id: "tg-rakuen-home-refine-rank",
      className: "flex w-full flex-col gap-4"
    });
    const gridDiv = h("div", {
      id: "tg-rakuen-home-refine-rank-list",
      className: "grid w-full gap-4"
    });
    const paginationDiv = h("div", {
      id: "tg-rakuen-home-refine-rank-pagination",
      className: "flex w-full justify-center"
    });
    const renderItems = cols => {
      gridDiv.innerHTML = "";
      gridDiv.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
      gridDiv.style.gap = "16px";
      data.items.forEach((item, index) => {
        const processedItem = {
          ...item,
          Name: item.CharacterName
        };
        const currentPage = data.currentPage || 1;
        const pageSize = data.pageSize || 24;
        const rank = (currentPage - 1) * pageSize + index + 1;
        const itemContainer = h("div", {
          className: "flex w-full min-w-0 flex-col gap-1",
          "data-character-id": item.CharacterId,
          "data-user-name": item.Name
        }, h(Temple, {
          temple: processedItem,
          bottomText: `+${formatNumber(item.Rate)}`,
          onClick: temple => {
            if (onTempleClick) {
              onTempleClick(temple);
            }
          }
        }), h("div", {
          className: "flex min-w-0 items-center justify-start gap-1 text-sm"
        }, h("span", {
          className: "inline-block h-4 rounded-md px-1.5 py-0 text-[10px] font-semibold leading-4 text-white",
          style: {
            backgroundColor: "#FFC107"
          }
        }, "#", rank), h("span", {
          className: "tg-link min-w-0 cursor-pointer truncate opacity-80 hover:opacity-100",
          onClick: () => {
            if (onCharacterClick) {
              onCharacterClick(item.CharacterId);
            }
          }
        }, item.CharacterName)), h("div", {
          className: "flex h-5 min-w-0 items-center justify-start gap-1 text-xs opacity-60"
        }, h("span", {
          className: "tg-link min-w-0 cursor-pointer truncate hover:opacity-100",
          onClick: () => {
            if (onUserClick) {
              onUserClick(item.Name);
            }
          }
        }, "@", item.Nickname)), h("div", {
          className: "flex min-w-0 justify-start text-xs opacity-60"
        }, h("span", {
          className: "truncate"
        }, formatTimeAgo(item.LastActive))));
        gridDiv.appendChild(itemContainer);
      });
    };
    const calculateColumns = width => {
      const minCellWidth = 120;
      const gap = 16;
      let cols = Math.floor((width + gap) / (minCellWidth + gap));
      const divisors = [24, 12, 8, 6, 4, 3, 2, 1];
      for (const divisor of divisors) {
        if (cols >= divisor) {
          return divisor;
        }
      }
      return 1;
    };
    const initialCols = calculateColumns(container.offsetWidth || 800);
    renderItems(initialCols);
    container.appendChild(gridDiv);
    if (data.totalPages && data.totalPages >= 1) {
      const maxPages = Math.min(data.totalPages, 5);
      const pagination = h(Pagination, {
        current: Number(data.currentPage) || 1,
        total: maxPages,
        onChange: page => onPageChange && onPageChange(page)
      });
      paginationDiv.appendChild(pagination);
      container.appendChild(paginationDiv);
    }
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const newCols = calculateColumns(width);
        renderItems(newCols);
      }
    });
    observer.observe(container);
    return container;
  }

  function UserRank({
    data,
    currentPage = 1,
    onPageChange,
    onUserClick
  }) {
    if (!data || data.length === 0) {
      return h("div", {
        className: "text-center text-sm opacity-60"
      }, h("p", null, "暂无数据"));
    }
    const container = h("div", {
      id: "tg-rakuen-home-user-rank",
      className: "flex w-full flex-col gap-4"
    });
    const gridDiv = h("div", {
      id: "tg-rakuen-home-user-rank-list",
      className: "grid w-full gap-4"
    });
    const paginationDiv = h("div", {
      id: "tg-rakuen-home-user-rank-pagination",
      className: "flex w-full justify-center"
    });
    const getRankChange = (item, currentRank) => {
      if (item.LastIndex === 0) {
        return {
          text: "new",
          color: "#45d216"
        };
      }
      if (item.LastIndex > currentRank) {
        return {
          text: `+${item.LastIndex - currentRank}`,
          color: "#ff658d"
        };
      }
      if (item.LastIndex < currentRank) {
        return {
          text: `${item.LastIndex - currentRank}`,
          color: "#65bcff"
        };
      }
      return {
        text: "-",
        color: "#d2d2d2"
      };
    };
    const renderItems = cols => {
      gridDiv.innerHTML = "";
      gridDiv.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
      gridDiv.style.gap = "16px";
      data.forEach((item, index) => {
        const pageSize = 20;
        const currentRank = (currentPage - 1) * pageSize + index + 1;
        const rankChange = getRankChange(item, currentRank);
        const nickname = unescapeHtml(item.Nickname);
        const userItem = h("div", {
          className: "tg-bg-content tg-border-card flex min-w-0 cursor-pointer flex-col items-center gap-3 rounded-lg p-3 transition-shadow hover:shadow-md",
          onClick: () => {
            if (onUserClick) {
              onUserClick(item.Name);
            }
          },
          "data-user-name": item.Name,
          "data-rank": currentRank
        }, h(Avatar, {
          src: item.Avatar,
          alt: nickname,
          size: "lg",
          rank: currentRank
        }), h("div", {
          className: "flex w-full min-w-0 flex-col items-center gap-2"
        }, h("div", {
          className: "flex w-full min-w-0 items-center justify-center gap-2 px-2"
        }, h("span", {
          className: "min-w-0 truncate text-sm font-semibold",
          title: nickname
        }, nickname), h("span", {
          className: "inline-block h-4 rounded-md px-1.5 py-0 text-[10px] font-semibold leading-4 text-white",
          style: {
            backgroundColor: rankChange.color
          }
        }, rankChange.text)), h("div", {
          className: "flex w-full min-w-0 flex-col gap-1.5 text-xs"
        }, h("div", {
          className: "flex min-w-0 items-center justify-center gap-1 font-semibold",
          title: `总资产: ${formatCurrency(item.Assets, "₵", 2, false)}`
        }, h("span", {
          className: "opacity-60"
        }, "总资产"), h("span", {
          style: {
            color: rankChange.color
          }
        }, formatCurrency(item.Assets, "₵", 2))), h("div", {
          className: "grid w-full grid-cols-3 gap-2 opacity-60"
        }, h("div", {
          className: "flex min-w-0 flex-col items-center gap-0.5",
          title: `每周股息: ${formatCurrency(item.Share, "₵", 2, false)}`
        }, h("span", {
          className: "truncate text-[10px]"
        }, "股息"), h("span", {
          className: "truncate text-xs font-semibold"
        }, formatCurrency(item.Share, "₵", 2))), h("div", {
          className: "flex min-w-0 flex-col items-center gap-0.5",
          title: `流动资金: ${formatCurrency(item.TotalBalance, "₵", 2, false)}`
        }, h("span", {
          className: "truncate text-[10px]"
        }, "流动"), h("span", {
          className: "truncate text-xs font-semibold"
        }, formatCurrency(item.TotalBalance, "₵", 2))), h("div", {
          className: "flex min-w-0 flex-col items-center gap-0.5",
          title: `初始资金: ${formatCurrency(item.Principal, "₵", 2, false)}`
        }, h("span", {
          className: "truncate text-[10px]"
        }, "初始"), h("span", {
          className: "truncate text-xs font-semibold"
        }, formatCurrency(item.Principal, "₵", 2)))), h("div", {
          className: "truncate text-center opacity-60",
          title: `最后活跃: ${formatTimeAgo(item.LastActiveDate)}`
        }, formatTimeAgo(item.LastActiveDate)))));
        gridDiv.appendChild(userItem);
      });
    };
    const calculateColumns = width => {
      const minCellWidth = 200;
      const gap = 16;
      let cols = Math.floor((width + gap) / (minCellWidth + gap));
      const divisors = [10, 5, 4, 2, 1];
      for (const divisor of divisors) {
        if (cols >= divisor) {
          return divisor;
        }
      }
      return 1;
    };
    const initialCols = calculateColumns(container.offsetWidth || 800);
    renderItems(initialCols);
    container.appendChild(gridDiv);
    const totalPages = 5;
    {
      const pagination = h(Pagination, {
        current: currentPage,
        total: totalPages,
        onChange: page => onPageChange && onPageChange(page)
      });
      paginationDiv.appendChild(pagination);
      container.appendChild(paginationDiv);
    }
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const newCols = calculateColumns(width);
        renderItems(newCols);
      }
    });
    observer.observe(container);
    return container;
  }

  function CharacterRankItem({
    item,
    rank,
    onClick
  }) {
    const getFluctuationInfo = fluctuation => {
      if (fluctuation > 0) {
        return {
          text: `+${(fluctuation * 100).toFixed(2)}%`,
          color: "#ffa7cc"
        };
      }
      if (fluctuation < 0) {
        return {
          text: `${(fluctuation * 100).toFixed(2)}%`,
          color: "#a7e3ff"
        };
      }
      return {
        text: "0.00%",
        color: "#d2d2d2"
      };
    };
    const fluctuationInfo = getFluctuationInfo(item.Fluctuation);
    return h("div", {
      "data-character-id": item.Id,
      className: "tg-bg-content tg-border-card flex min-w-0 cursor-pointer flex-col items-center gap-3 rounded-lg p-3 transition-shadow hover:shadow-md",
      onClick: () => {
        if (onClick) {
          onClick(item.Id);
        }
      }
    }, h("div", {
      className: "relative"
    }, h("div", {
      className: "tg-avatar h-16 w-16 border-2 border-white/30",
      style: {
        backgroundImage: `url(${normalizeAvatar(item.Icon)})`,
        backgroundSize: "cover",
        backgroundPosition: "center top"
      }
    }), h("div", {
      className: "absolute left-0 top-0 -translate-x-1/4 -translate-y-1/4 rounded px-1.5 text-sm font-bold text-white shadow-md",
      style: {
        background: "linear-gradient(45deg, #FFC107, #FFEB3B)"
      }
    }, "#", rank)), h("div", {
      className: "flex w-full min-w-0 flex-col items-center gap-2"
    }, h("div", {
      className: "flex w-full min-w-0 items-center justify-center gap-2 px-2"
    }, h(LevelBadge, {
      level: item.Level,
      zeroCount: item.ZeroCount,
      size: "sm"
    }), h("span", {
      className: "min-w-0 truncate text-sm font-semibold",
      title: item.CharacterName || item.Name
    }, item.CharacterName || item.Name)), h("div", {
      className: "flex w-full min-w-0 flex-col gap-1.5 text-xs"
    }, h("div", {
      className: "flex min-w-0 items-center justify-center gap-2",
      title: `现价: ${formatCurrency(item.Current, "₵", 2, false)}`
    }, h("div", {
      className: "flex items-center gap-1"
    }, h("span", {
      className: "font-semibold",
      style: {
        color: fluctuationInfo.color
      }
    }, formatCurrency(item.Current, "₵", 2))), h(ChangeBadge, {
      change: item.Fluctuation,
      size: "sm"
    })), h("div", {
      className: "grid w-full grid-cols-3 gap-2"
    }, h("div", {
      className: "flex min-w-0 flex-col items-center gap-0.5",
      title: `股息: ${formatCurrency(item.Rate, "₵", 2, false)}`
    }, h("span", {
      className: "truncate text-[10px] opacity-60"
    }, "股息"), h("span", {
      className: "truncate text-xs font-semibold"
    }, "+", formatCurrency(item.Rate, "₵", 2))), h("div", {
      className: "flex min-w-0 flex-col items-center gap-0.5",
      title: `总股份: ${item.Total.toLocaleString()}`
    }, h("span", {
      className: "truncate text-[10px] opacity-60"
    }, "总股份"), h("span", {
      className: "truncate text-xs font-semibold"
    }, item.Total.toLocaleString())), h("div", {
      className: "flex min-w-0 flex-col items-center gap-0.5",
      title: `总市值: ${formatCurrency(item.MarketValue, "₵", 2, false)}`
    }, h("span", {
      className: "truncate text-[10px] opacity-60"
    }, "总市值"), h("span", {
      className: "truncate text-xs font-semibold"
    }, formatCurrency(item.MarketValue, "₵", 2)))), h("div", {
      className: "flex items-center justify-center gap-2 text-[10px]",
      title: "买入 / 卖出 / 成交量"
    }, h("span", {
      style: {
        color: "#ffa7cc"
      }
    }, "+", item.Bids?.toLocaleString() || 0), h("span", {
      style: {
        color: "#a7e3ff"
      }
    }, "-", item.Asks?.toLocaleString() || 0), h("span", {
      style: {
        color: "#d2d2d2"
      }
    }, item.Change?.toLocaleString() || 0)), h("div", {
      className: "truncate text-center opacity-60"
    }, formatTimeAgo(item.LastOrder)))));
  }

  function RateRank({
    data,
    currentPage = 1,
    onPageChange,
    onCharacterClick
  }) {
    if (!data || data.length === 0) {
      return h("div", {
        className: "text-center text-sm opacity-60"
      }, h("p", null, "暂无数据"));
    }
    const container = h("div", {
      id: "tg-rakuen-home-rate-rank",
      className: "flex w-full flex-col gap-4"
    });
    const gridDiv = h("div", {
      id: "tg-rakuen-home-rate-rank-list",
      className: "grid w-full gap-4"
    });
    const paginationDiv = h("div", {
      id: "tg-rakuen-home-rate-rank-pagination",
      className: "flex w-full justify-center"
    });
    const renderItems = cols => {
      gridDiv.innerHTML = "";
      gridDiv.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
      gridDiv.style.gap = "16px";
      data.forEach((item, index) => {
        const pageSize = 20;
        const currentRank = (currentPage - 1) * pageSize + index + 1;
        const characterItem = h(CharacterRankItem, {
          item: item,
          rank: currentRank,
          onClick: onCharacterClick
        });
        gridDiv.appendChild(characterItem);
      });
    };
    const calculateColumns = width => {
      const minCellWidth = 200;
      const gap = 16;
      let cols = Math.floor((width + gap) / (minCellWidth + gap));
      const divisors = [20, 10, 5, 4, 2, 1];
      for (const divisor of divisors) {
        if (cols >= divisor) {
          return divisor;
        }
      }
      return 1;
    };
    const initialCols = calculateColumns(container.offsetWidth || 800);
    renderItems(initialCols);
    container.appendChild(gridDiv);
    const totalPages = 5;
    {
      const pagination = h(Pagination, {
        current: currentPage,
        total: totalPages,
        onChange: page => onPageChange && onPageChange(page)
      });
      paginationDiv.appendChild(pagination);
      container.appendChild(paginationDiv);
    }
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const newCols = calculateColumns(width);
        renderItems(newCols);
      }
    });
    observer.observe(container);
    return container;
  }

  function HotTab() {
    const container = h("div", {
      id: "tg-rakuen-home-hot-tab",
      className: "tg-bg-content tg-border-card my-2 rounded-xl p-3 shadow-sm transition-shadow hover:shadow-md"
    });
    const rankingOptions = [{
      value: "refineRank",
      label: "精炼排行"
    }, {
      value: "userRank",
      label: "番市首富"
    }, {
      value: "rateRank",
      label: "最高股息"
    }];
    let generatedCharacterModalId = null;
    let generatedTempleModalId = null;
    let generatedUserModalId = null;
    const isModalExist = modalId => {
      return modalId && document.querySelector(`#tg-modal[data-modal-id="${modalId}"]`)?.parentNode === document.body;
    };
    const {
      setState
    } = createMountedComponent(container, state => {
      const {
        activeRanking = "refineRank",
        refineRankData = null,
        refineRankLoading = true,
        userRankData = null,
        userRankLoading = true,
        userRankPage = 1,
        rateRankData = null,
        rateRankLoading = true,
        rateRankPage = 1,
        showCharacterModal = false,
        characterModalId = null,
        showTempleModal = false,
        templeModalData = null,
        showUserModal = false,
        userModalUsername = null
      } = state || {};
      const headerDiv = h("div", {
        id: "tg-rakuen-home-hot-tab-header",
        className: "mb-3 flex items-center justify-between gap-2"
      }, h("div", {
        className: "flex items-center gap-2"
      }, h("div", {
        id: "tg-rakuen-home-hot-tab-title",
        className: "text-sm font-semibold"
      }, "/ ", getRankingTitle(activeRanking))), h(SegmentedControl, {
        options: rankingOptions,
        value: activeRanking,
        onChange: value => {
          setState({
            activeRanking: value,
            userRankPage: 1,
            rateRankPage: 1
          });
          if (value === "refineRank") {
            loadRefineRankData();
          } else if (value === "userRank") {
            loadUserRankData();
          } else if (value === "rateRank") {
            loadRateRankData();
          }
        },
        size: "small"
      }));
      const handleCharacterClick = characterId => {
        setState({
          showCharacterModal: true,
          characterModalId: characterId
        });
      };
      const handleTempleClick = temple => {
        setState({
          showTempleModal: true,
          templeModalData: temple
        });
      };
      const handleUserClick = username => {
        setState({
          showUserModal: true,
          userModalUsername: username
        });
      };
      const handleRefineRankPageChange = page => {
        loadRefineRankData(page);
      };
      const handleUserRankPageChange = page => {
        setState({
          userRankPage: page
        });
        loadUserRankData(page);
      };
      const handleRateRankPageChange = page => {
        setState({
          rateRankPage: page
        });
        loadRateRankData(page);
      };
      const renderRankingContent = type => {
        switch (type) {
          case "refineRank":
            if (refineRankLoading) {
              return h("div", {
                className: "text-center text-sm opacity-60"
              }, h("p", null, "加载中..."));
            }
            return h(RefineRank, {
              data: refineRankData,
              onPageChange: handleRefineRankPageChange,
              onCharacterClick: handleCharacterClick,
              onTempleClick: handleTempleClick,
              onUserClick: handleUserClick
            });
          case "userRank":
            if (userRankLoading) {
              return h("div", {
                className: "text-center text-sm opacity-60"
              }, h("p", null, "加载中..."));
            }
            return h(UserRank, {
              data: userRankData,
              currentPage: userRankPage,
              onPageChange: handleUserRankPageChange,
              onUserClick: handleUserClick
            });
          case "rateRank":
            if (rateRankLoading) {
              return h("div", {
                className: "text-center text-sm opacity-60"
              }, h("p", null, "加载中..."));
            }
            return h(RateRank, {
              data: rateRankData,
              currentPage: rateRankPage,
              onPageChange: handleRateRankPageChange,
              onCharacterClick: handleCharacterClick
            });
          default:
            return h(RefineRank, {
              data: refineRankData,
              onPageChange: handleRefineRankPageChange,
              onCharacterClick: handleCharacterClick,
              onTempleClick: handleTempleClick,
              onUserClick: handleUserClick
            });
        }
      };
      const contentDiv = h("div", {
        id: "tg-rakuen-home-hot-tab-content",
        className: "mt-3"
      }, renderRankingContent(activeRanking));
      const wrapper = h("div", null);
      wrapper.appendChild(headerDiv);
      wrapper.appendChild(contentDiv);
      if (showCharacterModal && characterModalId && !isModalExist(generatedCharacterModalId)) {
        const modal = h(Modal, {
          visible: showCharacterModal,
          onClose: () => setState({
            showCharacterModal: false
          }),
          modalId: generatedCharacterModalId,
          getModalId: id => {
            generatedCharacterModalId = id;
          }
        }, h(CharacterBox, {
          characterId: characterModalId,
          sticky: true,
          stickyTop: -16
        }));
        wrapper.appendChild(modal);
      }
      if (showTempleModal && templeModalData && !isModalExist(generatedTempleModalId)) {
        const templeModal = h(Modal, {
          visible: showTempleModal,
          onClose: () => setState({
            showTempleModal: false
          }),
          position: "center",
          maxWidth: 1080,
          padding: "p-0",
          modalId: generatedTempleModalId,
          getModalId: id => {
            generatedTempleModalId = id;
          }
        }, h(TempleDetail, {
          temple: templeModalData,
          characterName: templeModalData.Name
        }));
        wrapper.appendChild(templeModal);
      }
      if (showUserModal && userModalUsername && !isModalExist(generatedUserModalId)) {
        const userModal = h(Modal, {
          visible: showUserModal,
          onClose: () => setState({
            showUserModal: false
          }),
          modalId: generatedUserModalId,
          getModalId: id => {
            generatedUserModalId = id;
          }
        }, h(UserTinygrail, {
          username: userModalUsername,
          stickyTop: "-16px"
        }));
        wrapper.appendChild(userModal);
      }
      return wrapper;
    });
    const loadRefineRankData = async (page = 1) => {
      setState({
        refineRankLoading: true
      });
      const result = await getRefineRank(page, 24);
      if (result.success) {
        setState({
          refineRankData: result.data,
          refineRankLoading: false
        });
      } else {
        setState({
          refineRankData: null,
          refineRankLoading: false
        });
      }
    };
    const loadUserRankData = async (page = 1) => {
      setState({
        userRankLoading: true
      });
      const result = await getUserRank(page, 20);
      if (result.success) {
        setState({
          userRankData: result.data,
          userRankLoading: false
        });
      } else {
        setState({
          userRankData: null,
          userRankLoading: false
        });
      }
    };
    const loadRateRankData = async (page = 1) => {
      setState({
        rateRankLoading: true
      });
      const result = await getRateRank(page, 20);
      if (result.success) {
        setState({
          rateRankData: result.data,
          rateRankLoading: false
        });
      } else {
        setState({
          rateRankData: null,
          rateRankLoading: false
        });
      }
    };
    const getRankingTitle = type => {
      switch (type) {
        case "refineRank":
          return "精炼排行";
        case "userRank":
          return "番市首富";
        case "rateRank":
          return "最高股息";
        default:
          return "精炼排行";
      }
    };
    loadRefineRankData();
    return container;
  }

  function TradeTab() {
    const container = h("div", {
      id: "tg-rakuen-home-trade-tab",
      className: "tg-bg-content tg-border-card my-2 rounded-xl p-3 shadow-sm transition-shadow hover:shadow-md"
    });
    const tradeOptions = [{
      value: "marketValue",
      label: "最高市值"
    }, {
      value: "maxRise",
      label: "最大涨幅"
    }, {
      value: "maxFall",
      label: "最大跌幅"
    }];
    let generatedCharacterModalId = null;
    const isModalExist = modalId => {
      return modalId && document.querySelector(`#tg-modal[data-modal-id="${modalId}"]`)?.parentNode === document.body;
    };
    const {
      setState
    } = createMountedComponent(container, state => {
      const {
        activeTradeType = "marketValue",
        marketValueData = null,
        marketValueLoading = true,
        marketValuePage = 1,
        maxRiseData = null,
        maxRiseLoading = true,
        maxRisePage = 1,
        maxFallData = null,
        maxFallLoading = true,
        maxFallPage = 1,
        showCharacterModal = false,
        characterModalId = null
      } = state || {};
      const headerDiv = h("div", {
        id: "tg-rakuen-home-trade-header",
        className: "mb-3 flex items-center justify-between gap-2"
      }, h("div", {
        className: "flex items-center gap-2"
      }, h("div", {
        className: "text-sm font-semibold"
      }, "/ ", getTradeTitle(activeTradeType))), h(SegmentedControl, {
        options: tradeOptions,
        value: activeTradeType,
        onChange: value => {
          setState({
            activeTradeType: value,
            marketValuePage: 1,
            maxRisePage: 1,
            maxFallPage: 1
          });
          if (value === "marketValue") {
            loadMarketValueData();
          } else if (value === "maxRise") {
            loadMaxRiseData();
          } else if (value === "maxFall") {
            loadMaxFallData();
          }
        },
        size: "small"
      }));
      const handleCharacterClick = characterId => {
        setState({
          showCharacterModal: true,
          characterModalId: characterId
        });
      };
      const renderTradeContent = type => {
        let data, loading, currentPage, onPageChange;
        switch (type) {
          case "marketValue":
            data = marketValueData;
            loading = marketValueLoading;
            currentPage = marketValuePage;
            onPageChange = page => {
              setState({
                marketValuePage: page
              });
              loadMarketValueData(page);
            };
            break;
          case "maxRise":
            data = maxRiseData;
            loading = maxRiseLoading;
            currentPage = maxRisePage;
            onPageChange = page => {
              setState({
                maxRisePage: page
              });
              loadMaxRiseData(page);
            };
            break;
          case "maxFall":
            data = maxFallData;
            loading = maxFallLoading;
            currentPage = maxFallPage;
            onPageChange = page => {
              setState({
                maxFallPage: page
              });
              loadMaxFallData(page);
            };
            break;
          default:
            data = marketValueData;
            loading = marketValueLoading;
            currentPage = marketValuePage;
            onPageChange = page => {
              setState({
                marketValuePage: page
              });
              loadMarketValueData(page);
            };
        }
        if (loading) {
          return h("div", {
            className: "text-center text-sm opacity-60"
          }, h("p", null, "加载中..."));
        }
        if (!data || data.length === 0) {
          return h("div", {
            className: "text-center text-sm opacity-60"
          }, h("p", null, "暂无数据"));
        }
        const gridContainer = h("div", {
          id: "tg-rakuen-home-trade-content",
          className: "flex w-full flex-col gap-4"
        });
        const gridDiv = h("div", {
          id: "tg-rakuen-home-trade-list",
          className: "grid w-full gap-4"
        });
        const paginationDiv = h("div", {
          id: "tg-rakuen-home-trade-pagination",
          className: "flex w-full justify-center"
        });
        const renderItems = cols => {
          gridDiv.innerHTML = "";
          gridDiv.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
          gridDiv.style.gap = "16px";
          data.forEach((item, index) => {
            const pageSize = 20;
            const currentRank = (currentPage - 1) * pageSize + index + 1;
            const characterItem = h(CharacterRankItem, {
              item: item,
              rank: currentRank,
              onClick: handleCharacterClick
            });
            gridDiv.appendChild(characterItem);
          });
        };
        const calculateColumns = width => {
          const minCellWidth = 200;
          const gap = 16;
          let cols = Math.floor((width + gap) / (minCellWidth + gap));
          const divisors = [20, 10, 5, 4, 2, 1];
          for (const divisor of divisors) {
            if (cols >= divisor) {
              return divisor;
            }
          }
          return 1;
        };
        const initialCols = calculateColumns(gridContainer.offsetWidth || 800);
        renderItems(initialCols);
        gridContainer.appendChild(gridDiv);
        const totalPages = 5;
        {
          const pagination = h(Pagination, {
            current: currentPage,
            total: totalPages,
            onChange: onPageChange
          });
          paginationDiv.appendChild(pagination);
          gridContainer.appendChild(paginationDiv);
        }
        const observer = new ResizeObserver(entries => {
          for (const entry of entries) {
            const width = entry.contentRect.width;
            const newCols = calculateColumns(width);
            renderItems(newCols);
          }
        });
        observer.observe(gridContainer);
        return gridContainer;
      };
      const contentDiv = h("div", {
        className: "mt-3"
      }, renderTradeContent(activeTradeType));
      const wrapper = h("div", null);
      wrapper.appendChild(headerDiv);
      wrapper.appendChild(contentDiv);
      if (showCharacterModal && characterModalId && !isModalExist(generatedCharacterModalId)) {
        const modal = h(Modal, {
          visible: showCharacterModal,
          onClose: () => setState({
            showCharacterModal: false
          }),
          modalId: generatedCharacterModalId,
          getModalId: id => {
            generatedCharacterModalId = id;
          }
        }, h(CharacterBox, {
          characterId: characterModalId,
          sticky: true,
          stickyTop: -16
        }));
        wrapper.appendChild(modal);
      }
      return wrapper;
    });
    const loadMarketValueData = async (page = 1) => {
      setState({
        marketValueLoading: true
      });
      const result = await getMarketValueRank(page, 20);
      if (result.success) {
        setState({
          marketValueData: result.data,
          marketValueLoading: false
        });
      } else {
        setState({
          marketValueData: null,
          marketValueLoading: false
        });
      }
    };
    const loadMaxRiseData = async (page = 1) => {
      setState({
        maxRiseLoading: true
      });
      const result = await getMaxRiseRank(page, 20);
      if (result.success) {
        setState({
          maxRiseData: result.data,
          maxRiseLoading: false
        });
      } else {
        setState({
          maxRiseData: null,
          maxRiseLoading: false
        });
      }
    };
    const loadMaxFallData = async (page = 1) => {
      setState({
        maxFallLoading: true
      });
      const result = await getMaxFallRank(page, 20);
      if (result.success) {
        setState({
          maxFallData: result.data,
          maxFallLoading: false
        });
      } else {
        setState({
          maxFallData: null,
          maxFallLoading: false
        });
      }
    };
    const getTradeTitle = type => {
      switch (type) {
        case "marketValue":
          return "最高市值";
        case "maxRise":
          return "最大涨幅";
        case "maxFall":
          return "最大跌幅";
        default:
          return "最高市值";
      }
    };
    loadMarketValueData();
    return container;
  }

  function CharacterPoolItem({
    item,
    rank,
    auction,
    showAuction = true,
    showButtons = true,
    onClick,
    onAuctionClick,
    onHistoryClick
  }) {
    const getFluctuationInfo = fluctuation => {
      if (fluctuation > 0) {
        return {
          color: "#ffa7cc"
        };
      }
      if (fluctuation < 0) {
        return {
          color: "#a7e3ff"
        };
      }
      return {
        color: "#d2d2d2"
      };
    };
    const fluctuationInfo = getFluctuationInfo(item.Fluctuation);
    const container = h("div", {
      "data-character-id": item.Id,
      className: "tg-bg-content tg-border-card flex min-w-0 cursor-pointer flex-col items-center gap-3 rounded-lg p-3 transition-shadow hover:shadow-md",
      onClick: () => onClick && onClick(item.Id)
    }, h("div", {
      className: "relative"
    }, h("div", {
      className: "tg-avatar h-16 w-16 border-2 border-white/30",
      style: {
        backgroundImage: `url(${normalizeAvatar(item.Icon)})`,
        backgroundSize: "cover",
        backgroundPosition: "center top"
      }
    }), h("div", {
      className: "absolute left-0 top-0 -translate-x-1/4 -translate-y-1/4 rounded px-1.5 text-sm font-bold text-white shadow-md",
      style: {
        background: "linear-gradient(45deg, #FFC107, #FFEB3B)"
      }
    }, "#", rank)), h("div", {
      className: "flex w-full min-w-0 flex-col items-center gap-2"
    }, h("div", {
      className: "flex w-full min-w-0 items-center justify-center gap-2 px-2"
    }, h(LevelBadge, {
      level: item.Level,
      zeroCount: item.ZeroCount,
      size: "sm"
    }), h("span", {
      className: "min-w-0 truncate text-sm font-semibold",
      title: item.Name
    }, item.Name)), h("div", {
      className: "flex w-full min-w-0 flex-col gap-1.5 text-xs"
    }, h("div", {
      className: "flex min-w-0 items-center justify-center gap-2",
      title: `现价: ${formatCurrency(item.Current, "₵", 2, false)}`
    }, h("div", {
      className: "flex items-center gap-1"
    }, h("span", {
      className: "font-semibold",
      style: {
        color: fluctuationInfo.color
      }
    }, formatCurrency(item.Current, "₵", 2))), h(ChangeBadge, {
      change: item.Fluctuation,
      size: "sm"
    })), h("div", {
      className: "grid w-full grid-cols-3 gap-2"
    }, h("div", {
      className: "flex min-w-0 flex-col items-center gap-0.5",
      title: `股息: ${formatCurrency(item.Rate, "₵", 2, false)}`
    }, h("span", {
      className: "truncate text-[10px] opacity-60"
    }, "股息"), h("span", {
      className: "truncate text-xs font-semibold"
    }, "+", formatCurrency(item.Rate, "₵", 2))), h("div", {
      className: "flex min-w-0 flex-col items-center gap-0.5",
      title: `底价: ${formatCurrency(item.Price, "₵", 0, false)}`
    }, h("span", {
      className: "truncate text-[10px] opacity-60"
    }, "底价"), h("span", {
      className: "truncate text-xs font-semibold"
    }, formatCurrency(item.Price, "₵", 0))), h("div", {
      className: "flex min-w-0 flex-col items-center gap-0.5",
      title: `数量: ${item.State?.toLocaleString() || 0}`
    }, h("span", {
      className: "truncate text-[10px] opacity-60"
    }, "数量"), h("span", {
      className: "truncate text-xs font-semibold"
    }, item.State?.toLocaleString() || 0))), showAuction && h("div", {
      className: "flex w-full min-w-0 items-center justify-center gap-2 text-[10px]"
    }, h("div", {
      className: "flex min-w-0 items-center justify-center gap-1",
      title: "竞拍人数 / 竞拍数量",
      style: {
        color: "#a7e3ff"
      }
    }, h("span", {
      className: "font-semibold"
    }, auction?.State?.toLocaleString() || 0, " / ", auction?.Type?.toLocaleString() || 0)), auction && auction.Price != 0 && h("div", {
      className: "flex min-w-0 items-center justify-center gap-1",
      title: "出价 / 数量",
      style: {
        color: "#ffa7cc"
      }
    }, h("span", {
      className: "font-semibold"
    }, formatCurrency(auction.Price, "₵", 2), " /", " ", auction.Amount?.toLocaleString() || 0))), showButtons && h("div", {
      className: "flex w-full min-w-0 items-center justify-center gap-2"
    }, h(Button, {
      variant: "solid",
      size: "sm",
      onClick: e => {
        e.stopPropagation();
        onAuctionClick && onAuctionClick(item);
      }
    }, "出价"), h(Button, {
      variant: "outline",
      size: "sm",
      onClick: e => {
        e.stopPropagation();
        onHistoryClick && onHistoryClick(item);
      }
    }, "往期")))));
    return container;
  }

  function ValhallaTab() {
    const container = h("div", {
      id: "tg-rakuen-home-valhalla-tab",
      className: "tg-bg-content tg-border-card my-2 rounded-xl p-3 shadow-sm transition-shadow hover:shadow-md"
    });
    const valhallaOptions = [{
      value: "valhalla",
      label: "英灵殿"
    }, {
      value: "gensokyo",
      label: "幻想乡"
    }];
    let generatedCharacterModalId = null;
    let generatedAuctionModalId = null;
    let generatedAuctionHistoryModalId = null;
    const isModalExist = modalId => {
      return modalId && document.querySelector(`#tg-modal[data-modal-id="${modalId}"]`)?.parentNode === document.body;
    };
    const {
      setState
    } = createMountedComponent(container, state => {
      const {
        activeValhallaType = "valhalla",
        valhallaData = null,
        valhallaLoading = true,
        valhallaPage = 1,
        valhallaAuctions = {},
        gensokyoData = null,
        gensokyoLoading = true,
        gensokyoPage = 1,
        showCharacterModal = false,
        characterModalId = null,
        showAuctionModal = false,
        auctionCharacterId = null,
        auctionCharacterName = null,
        auctionBasePrice = 0,
        auctionMaxAmount = 0,
        showAuctionHistoryModal = false,
        auctionHistoryCharacterId = null,
        auctionHistoryCharacterName = null
      } = state || {};
      const headerDiv = h("div", {
        id: "tg-rakuen-home-valhalla-header",
        className: "mb-3 flex items-center justify-between gap-2"
      }, h("div", {
        className: "flex items-center gap-2"
      }, h("div", {
        className: "text-sm font-semibold"
      }, "/ ", getValhallaTitle(activeValhallaType))), h(SegmentedControl, {
        options: valhallaOptions,
        value: activeValhallaType,
        onChange: value => {
          setState({
            activeValhallaType: value,
            valhallaPage: 1,
            gensokyoPage: 1
          });
          if (value === "valhalla") {
            loadValhallaData();
          } else if (value === "gensokyo") {
            loadGensokyoData();
          }
        },
        size: "small"
      }));
      const handleCharacterClick = characterId => {
        setState({
          showCharacterModal: true,
          characterModalId: characterId
        });
      };
      const handleAuctionClick = item => {
        setState({
          showAuctionModal: true,
          auctionCharacterId: item.Id,
          auctionCharacterName: item.Name,
          auctionBasePrice: item.Price || 0,
          auctionMaxAmount: item.State || 0
        });
      };
      const handleHistoryClick = item => {
        setState({
          showAuctionHistoryModal: true,
          auctionHistoryCharacterId: item.Id,
          auctionHistoryCharacterName: item.Name
        });
      };
      const renderValhallaContent = type => {
        let data, loading, currentPage, onPageChange, totalPages;
        if (type === "valhalla") {
          data = valhallaData;
          loading = valhallaLoading;
          currentPage = valhallaPage;
          totalPages = valhallaData?.totalPages || 1;
          onPageChange = page => {
            setState({
              valhallaPage: page
            });
            loadValhallaData(page);
          };
        } else {
          data = gensokyoData;
          loading = gensokyoLoading;
          currentPage = gensokyoPage;
          totalPages = gensokyoData?.totalPages || 1;
          onPageChange = page => {
            setState({
              gensokyoPage: page
            });
            loadGensokyoData(page);
          };
        }
        if (loading) {
          return h("div", {
            className: "text-center text-sm opacity-60"
          }, h("p", null, "加载中..."));
        }
        if (!data || !data.items || data.items.length === 0) {
          return h("div", {
            className: "text-center text-sm opacity-60"
          }, h("p", null, "暂无数据"));
        }
        const gridContainer = h("div", {
          id: "tg-rakuen-home-valhalla-content",
          className: "flex w-full flex-col gap-4"
        });
        const gridDiv = h("div", {
          id: "tg-rakuen-home-valhalla-list",
          className: "grid w-full gap-4"
        });
        const paginationDiv = h("div", {
          id: "tg-rakuen-home-valhalla-pagination",
          className: "flex w-full justify-center"
        });
        const renderItems = cols => {
          gridDiv.innerHTML = "";
          gridDiv.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
          gridDiv.style.gap = "16px";
          const auctions = type === "valhalla" ? valhallaAuctions : {};
          data.items.forEach((item, index) => {
            const pageSize = 24;
            const currentRank = (currentPage - 1) * pageSize + index + 1;
            const auction = auctions[item.Id];
            const characterItem = h(CharacterPoolItem, {
              item: item,
              rank: currentRank,
              auction: auction,
              showAuction: type === "valhalla",
              showButtons: type === "valhalla",
              onClick: handleCharacterClick,
              onAuctionClick: handleAuctionClick,
              onHistoryClick: handleHistoryClick
            });
            gridDiv.appendChild(characterItem);
          });
        };
        const calculateColumns = width => {
          const minCellWidth = 200;
          const gap = 16;
          let cols = Math.floor((width + gap) / (minCellWidth + gap));
          const divisors = [24, 12, 8, 6, 4, 3, 2, 1];
          for (const divisor of divisors) {
            if (cols >= divisor) {
              return divisor;
            }
          }
          return 1;
        };
        const initialCols = calculateColumns(gridContainer.offsetWidth || 800);
        renderItems(initialCols);
        gridContainer.appendChild(gridDiv);
        if (totalPages > 1) {
          const pagination = h(Pagination, {
            current: currentPage,
            total: totalPages,
            onChange: onPageChange
          });
          paginationDiv.appendChild(pagination);
          gridContainer.appendChild(paginationDiv);
        }
        const observer = new ResizeObserver(entries => {
          for (const entry of entries) {
            const width = entry.contentRect.width;
            const newCols = calculateColumns(width);
            renderItems(newCols);
          }
        });
        observer.observe(gridContainer);
        return gridContainer;
      };
      const contentDiv = h("div", {
        className: "mt-3"
      }, renderValhallaContent(activeValhallaType));
      const wrapper = h("div", null);
      wrapper.appendChild(headerDiv);
      wrapper.appendChild(contentDiv);
      if (showCharacterModal && characterModalId && !isModalExist(generatedCharacterModalId)) {
        const modal = h(Modal, {
          visible: showCharacterModal,
          onClose: () => setState({
            showCharacterModal: false
          }),
          modalId: generatedCharacterModalId,
          getModalId: id => {
            generatedCharacterModalId = id;
          }
        }, h(CharacterBox, {
          characterId: characterModalId,
          sticky: true,
          stickyTop: -16
        }));
        wrapper.appendChild(modal);
      }
      if (showAuctionModal && auctionCharacterId && !isModalExist(generatedAuctionModalId)) {
        const modal = h(Modal, {
          visible: showAuctionModal,
          onClose: () => {
            setState({
              showAuctionModal: false
            });
            if (activeValhallaType === "valhalla") {
              loadValhallaData(valhallaPage, false);
            }
          },
          title: `拍卖 - #${auctionCharacterId}「${auctionCharacterName}」`,
          position: "center",
          maxWidth: 480,
          modalId: generatedAuctionModalId,
          getModalId: id => {
            generatedAuctionModalId = id;
          }
        }, h(Auction, {
          characterId: auctionCharacterId,
          basePrice: auctionBasePrice,
          maxAmount: auctionMaxAmount
        }));
        wrapper.appendChild(modal);
      }
      if (showAuctionHistoryModal && auctionHistoryCharacterId && !isModalExist(generatedAuctionHistoryModalId)) {
        const modal = h(Modal, {
          visible: showAuctionHistoryModal,
          onClose: () => setState({
            showAuctionHistoryModal: false
          }),
          title: `往期拍卖 - #${auctionHistoryCharacterId}「${auctionHistoryCharacterName}」`,
          position: "center",
          maxWidth: 800,
          modalId: generatedAuctionHistoryModalId,
          getModalId: id => {
            generatedAuctionHistoryModalId = id;
          }
        }, h(AuctionHistory, {
          characterId: auctionHistoryCharacterId
        }));
        wrapper.appendChild(modal);
      }
      return wrapper;
    });
    const loadValhallaData = async (page = 1, showLoading = true) => {
      if (showLoading) {
        setState({
          valhallaLoading: true
        });
      }
      const result = await getUserCharas("tinygrail", page, 24);
      if (result.success) {
        setState({
          valhallaData: result.data,
          valhallaLoading: false
        });
        loadAuctionData(result.data.items);
      } else {
        setState({
          valhallaData: null,
          valhallaLoading: false
        });
      }
    };
    const loadGensokyoData = async (page = 1) => {
      setState({
        gensokyoLoading: true
      });
      const result = await getUserCharas("blueleaf", page, 24);
      if (result.success) {
        setState({
          gensokyoData: result.data,
          gensokyoLoading: false
        });
      } else {
        setState({
          gensokyoData: null,
          gensokyoLoading: false
        });
      }
    };
    const loadAuctionData = async items => {
      if (!items || items.length === 0) return;
      const characterIds = items.map(item => item.Id);
      const result = await getAuctionList(characterIds);
      if (result.success && result.data) {
        const auctionMap = {};
        result.data.forEach(auction => {
          auctionMap[auction.CharacterId] = auction;
        });
        setState({
          valhallaAuctions: auctionMap
        });
      }
    };
    const getValhallaTitle = type => {
      switch (type) {
        case "valhalla":
          return "英灵殿";
        case "gensokyo":
          return "幻想乡";
        default:
          return "英灵殿";
      }
    };
    loadValhallaData();
    return container;
  }

  function ICOTab() {
    const container = h("div", {
      id: "tg-rakuen-home-ico-tab",
      className: "tg-bg-content tg-border-card my-2 rounded-xl p-3 shadow-sm transition-shadow hover:shadow-md"
    });
    const icoOptions = [{
      value: "maxValue",
      label: "最多资金"
    }, {
      value: "recentActive",
      label: "最近活跃"
    }, {
      value: "mostRecent",
      label: "即将结束"
    }];
    let generatedCharacterModalId = null;
    const isModalExist = modalId => {
      return modalId && document.querySelector(`#tg-modal[data-modal-id="${modalId}"]`)?.parentNode === document.body;
    };
    const {
      setState
    } = createMountedComponent(container, state => {
      const {
        activeICOType = "maxValue",
        maxValueData = null,
        maxValueLoading = true,
        maxValuePage = 1,
        recentActiveData = null,
        recentActiveLoading = true,
        recentActivePage = 1,
        mostRecentData = null,
        mostRecentLoading = true,
        mostRecentPage = 1,
        showCharacterModal = false,
        characterModalId = null
      } = state || {};
      const headerDiv = h("div", {
        id: "tg-rakuen-home-ico-tab-header",
        className: "mb-3 flex items-center justify-between gap-2"
      }, h("div", {
        className: "flex items-center gap-2"
      }, h("div", {
        id: "tg-rakuen-home-ico-tab-title",
        className: "text-sm font-semibold"
      }, "/ ", getICOTitle(activeICOType))), h(SegmentedControl, {
        options: icoOptions,
        value: activeICOType,
        onChange: value => {
          setState({
            activeICOType: value,
            maxValuePage: 1,
            recentActivePage: 1,
            mostRecentPage: 1
          });
          if (value === "maxValue" && !maxValueData) {
            loadMaxValueData();
          } else if (value === "recentActive" && !recentActiveData) {
            loadRecentActiveData();
          } else if (value === "mostRecent" && !mostRecentData) {
            loadMostRecentData();
          }
        },
        size: "small"
      }));
      const handleCharacterClick = characterId => {
        setState({
          showCharacterModal: true,
          characterModalId: characterId
        });
      };
      const renderICOItem = (item, rank) => {
        const predicted = calculateICO(item);
        const percent = Math.round(item.Total / predicted.Next * 100);
        const countdownSpan = h("span", {
          className: "text-xs opacity-60"
        }, "计算中...");
        if (item.End) {
          const updateCountdown = () => {
            const endDate = new Date(item.End);
            const now = new Date();
            const diff = endDate - now;
            if (diff <= 0) {
              countdownSpan.textContent = "已结束";
              return;
            }
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor(diff % (1000 * 60 * 60 * 24) / (1000 * 60 * 60));
            const minutes = Math.floor(diff % (1000 * 60 * 60) / (1000 * 60));
            const seconds = Math.floor(diff % (1000 * 60) / 1000);
            let timeText = "";
            timeText += `${days}天`;
            timeText += `${hours}小时`;
            timeText += `${minutes}分`;
            timeText += `${seconds}秒`;
            countdownSpan.textContent = timeText;
          };
          updateCountdown();
          setInterval(updateCountdown, 1000);
        }
        const icoItem = h("div", {
          "data-character-id": item.CharacterId,
          className: "tg-bg-content tg-border-card flex min-w-0 cursor-pointer flex-col items-center gap-3 rounded-lg p-3 transition-shadow hover:shadow-md",
          onClick: () => handleCharacterClick(item.CharacterId)
        }, h("div", {
          className: "relative"
        }, h("div", {
          className: "tg-avatar h-16 w-16 border-2 border-white/30",
          style: {
            backgroundImage: `url(${normalizeAvatar(item.Icon)})`,
            backgroundSize: "cover",
            backgroundPosition: "center top"
          }
        }), h("div", {
          className: "absolute left-0 top-0 -translate-x-1/4 -translate-y-1/4 rounded px-1.5 text-sm font-bold text-white shadow-md",
          style: {
            background: "linear-gradient(45deg, #FFC107, #FFEB3B)"
          }
        }, "#", rank), item.Type === 1 && item.Bonus > 0 && h("div", {
          className: "absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 rounded-md bg-green-500 px-1.5 text-[10px] font-semibold text-white shadow-md",
          title: `剩余${item.Bonus}期额外分红`
        }, "×", item.Bonus)), h("div", {
          className: "flex w-full min-w-0 flex-col items-center gap-2"
        }, h("div", {
          className: "flex w-full min-w-0 items-center justify-center gap-2 px-2"
        }, h(LevelBadge, {
          level: predicted.Level,
          size: "sm"
        }), h("span", {
          className: "min-w-0 truncate text-sm font-semibold",
          title: item.Name
        }, item.Name)), h("div", {
          className: "text-xs opacity-80"
        }, formatCurrency(item.Total, "₵", 0, false), " / ", formatNumber(item.Users, 0), "人"), h("div", {
          className: "flex w-full flex-col gap-1"
        }, h("div", {
          className: "flex items-center justify-between text-xs opacity-60"
        }, countdownSpan, h("span", null, percent, "%")), h(ProgressBar, {
          value: item.Total,
          max: predicted.Next,
          color: "#64ee10",
          height: "h-1"
        }))));
        return icoItem;
      };
      const renderICOContent = type => {
        let data, loading, currentPage, onPageChange;
        const pageSize = 24;
        if (type === "maxValue") {
          data = maxValueData;
          loading = maxValueLoading;
          currentPage = maxValuePage;
          onPageChange = page => setState({
            maxValuePage: page
          });
        } else if (type === "recentActive") {
          data = recentActiveData;
          loading = recentActiveLoading;
          currentPage = recentActivePage;
          onPageChange = page => setState({
            recentActivePage: page
          });
        } else {
          data = mostRecentData;
          loading = mostRecentLoading;
          currentPage = mostRecentPage;
          onPageChange = page => setState({
            mostRecentPage: page
          });
        }
        if (loading) {
          return h("div", {
            className: "text-center text-sm opacity-60"
          }, h("p", null, "加载中..."));
        }
        if (!data || data.length === 0) {
          return h("div", {
            className: "text-center text-sm opacity-60"
          }, h("p", null, "暂无数据"));
        }
        const gridContainer = h("div", {
          className: "flex w-full flex-col gap-4"
        });
        const gridDiv = h("div", {
          className: "grid w-full gap-4"
        });
        const paginationDiv = h("div", {
          className: "flex w-full justify-center"
        });
        const renderItems = cols => {
          gridDiv.innerHTML = "";
          gridDiv.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
          gridDiv.style.gap = "16px";
          const startIndex = (currentPage - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          const pageData = data.slice(startIndex, endIndex);
          pageData.forEach((item, index) => {
            const currentRank = startIndex + index + 1;
            const icoItem = renderICOItem(item, currentRank);
            gridDiv.appendChild(icoItem);
          });
        };
        const calculateColumns = width => {
          const minCellWidth = 200;
          const gap = 16;
          let cols = Math.floor((width + gap) / (minCellWidth + gap));
          const divisors = [24, 12, 8, 6, 4, 3, 2, 1];
          for (const divisor of divisors) {
            if (cols >= divisor) {
              return divisor;
            }
          }
          return 1;
        };
        const initialCols = calculateColumns(gridContainer.offsetWidth || 800);
        renderItems(initialCols);
        gridContainer.appendChild(gridDiv);
        const totalPages = Math.ceil(data.length / pageSize);
        if (totalPages > 1) {
          const pagination = h(Pagination, {
            current: currentPage,
            total: totalPages,
            onChange: onPageChange
          });
          paginationDiv.appendChild(pagination);
          gridContainer.appendChild(paginationDiv);
        }
        const observer = new ResizeObserver(entries => {
          for (const entry of entries) {
            const width = entry.contentRect.width;
            const newCols = calculateColumns(width);
            renderItems(newCols);
          }
        });
        observer.observe(gridContainer);
        return gridContainer;
      };
      const contentDiv = h("div", {
        id: "tg-rakuen-home-ico-tab-content",
        className: "mt-3"
      }, renderICOContent(activeICOType));
      const wrapper = h("div", null);
      wrapper.appendChild(headerDiv);
      wrapper.appendChild(contentDiv);
      if (showCharacterModal && characterModalId && !isModalExist(generatedCharacterModalId)) {
        const modal = h(Modal, {
          visible: showCharacterModal,
          onClose: () => setState({
            showCharacterModal: false
          }),
          modalId: generatedCharacterModalId,
          getModalId: id => {
            generatedCharacterModalId = id;
          }
        }, h(CharacterBox, {
          characterId: characterModalId,
          sticky: true,
          stickyTop: -16
        }));
        wrapper.appendChild(modal);
      }
      return wrapper;
    });
    const loadMaxValueData = async () => {
      setState({
        maxValueLoading: true
      });
      const result = await getMaxValueICO(1, 999999);
      if (result.success) {
        setState({
          maxValueData: result.data,
          maxValueLoading: false
        });
      } else {
        setState({
          maxValueData: null,
          maxValueLoading: false
        });
      }
    };
    const loadRecentActiveData = async () => {
      setState({
        recentActiveLoading: true
      });
      const result = await getRecentActiveICO(1, 999999);
      if (result.success) {
        setState({
          recentActiveData: result.data,
          recentActiveLoading: false
        });
      } else {
        setState({
          recentActiveData: null,
          recentActiveLoading: false
        });
      }
    };
    const loadMostRecentData = async () => {
      setState({
        mostRecentLoading: true
      });
      const result = await getMostRecentICO(1, 999999);
      if (result.success) {
        setState({
          mostRecentData: result.data,
          mostRecentLoading: false
        });
      } else {
        setState({
          mostRecentData: null,
          mostRecentLoading: false
        });
      }
    };
    const getICOTitle = type => {
      switch (type) {
        case "maxValue":
          return "最多资金";
        case "recentActive":
          return "最近活跃";
        case "mostRecent":
          return "即将结束";
        default:
          return "最多资金";
      }
    };
    loadMaxValueData();
    return container;
  }

  function STTab() {
    const container = h("div", {
      id: "tg-rakuen-home-st-tab",
      className: "tg-bg-content tg-border-card my-2 rounded-xl p-3 shadow-sm transition-shadow hover:shadow-md"
    });
    let generatedCharacterModalId = null;
    const isModalExist = modalId => {
      return modalId && document.querySelector(`#tg-modal[data-modal-id="${modalId}"]`)?.parentNode === document.body;
    };
    const {
      setState
    } = createMountedComponent(container, state => {
      const {
        stData = null,
        stLoading = true,
        stPage = 1,
        showCharacterModal = false,
        characterModalId = null
      } = state || {};
      const headerDiv = h("div", {
        id: "tg-rakuen-home-st-header",
        className: "mb-3 flex items-center justify-between gap-2"
      }, h("div", {
        className: "flex items-center gap-2"
      }, h("div", {
        className: "text-sm font-semibold"
      }, "/ ST角色")));
      const handleCharacterClick = characterId => {
        setState({
          showCharacterModal: true,
          characterModalId: characterId
        });
      };
      const renderSTContent = () => {
        if (stLoading) {
          return h("div", {
            className: "text-center text-sm opacity-60"
          }, h("p", null, "加载中..."));
        }
        if (!stData || !stData.items || stData.items.length === 0) {
          return h("div", {
            className: "text-center text-sm opacity-60"
          }, h("p", null, "暂无数据"));
        }
        const gridContainer = h("div", {
          id: "tg-rakuen-home-st-content",
          className: "flex w-full flex-col gap-4"
        });
        const gridDiv = h("div", {
          id: "tg-rakuen-home-st-list",
          className: "grid w-full gap-4"
        });
        const paginationDiv = h("div", {
          id: "tg-rakuen-home-st-pagination",
          className: "flex w-full justify-center"
        });
        const renderItems = cols => {
          gridDiv.innerHTML = "";
          gridDiv.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
          gridDiv.style.gap = "16px";
          stData.items.forEach((item, index) => {
            const pageSize = 24;
            const currentRank = (stPage - 1) * pageSize + index + 1;
            const characterItem = h(CharacterPoolItem, {
              item: item,
              rank: currentRank,
              auction: null,
              showAuction: false,
              showButtons: false,
              onClick: handleCharacterClick
            });
            gridDiv.appendChild(characterItem);
          });
        };
        const calculateColumns = width => {
          const minCellWidth = 200;
          const gap = 16;
          let cols = Math.floor((width + gap) / (minCellWidth + gap));
          const divisors = [24, 12, 8, 6, 4, 3, 2, 1];
          for (const divisor of divisors) {
            if (cols >= divisor) {
              return divisor;
            }
          }
          return 1;
        };
        const initialCols = calculateColumns(gridContainer.offsetWidth || 800);
        renderItems(initialCols);
        gridContainer.appendChild(gridDiv);
        const totalPages = stData.totalPages || 1;
        if (totalPages > 1) {
          const pagination = h(Pagination, {
            current: stPage,
            total: totalPages,
            onChange: page => {
              setState({
                stPage: page
              });
              loadSTData(page);
            }
          });
          paginationDiv.appendChild(pagination);
          gridContainer.appendChild(paginationDiv);
        }
        const observer = new ResizeObserver(entries => {
          for (const entry of entries) {
            const width = entry.contentRect.width;
            const newCols = calculateColumns(width);
            renderItems(newCols);
          }
        });
        observer.observe(gridContainer);
        return gridContainer;
      };
      const contentDiv = h("div", {
        className: "mt-3"
      }, renderSTContent());
      const wrapper = h("div", null);
      wrapper.appendChild(headerDiv);
      wrapper.appendChild(contentDiv);
      if (showCharacterModal && characterModalId && !isModalExist(generatedCharacterModalId)) {
        const modal = h(Modal, {
          visible: showCharacterModal,
          onClose: () => setState({
            showCharacterModal: false
          }),
          modalId: generatedCharacterModalId,
          getModalId: id => {
            generatedCharacterModalId = id;
          }
        }, h(CharacterBox, {
          characterId: characterModalId,
          sticky: true,
          stickyTop: -16
        }));
        wrapper.appendChild(modal);
      }
      return wrapper;
    });
    const loadSTData = async (page = 1) => {
      setState({
        stLoading: true
      });
      const result = await getDelistCharas(page, 24);
      if (result.success) {
        setState({
          stData: result.data,
          stLoading: false
        });
      } else {
        setState({
          stData: null,
          stLoading: false
        });
      }
    };
    loadSTData();
    return container;
  }

  function RakuenHomeTabs({
    searchIcon,
    onSearchClick
  }) {
    const container = h("div", {
      id: "tg-rakuen-home-tabs"
    });
    let activeTab = 0;
    let size = "large";
    const tabContents = {};
    const tabItems = [{
      key: "home",
      label: "首页",
      component: () => {
        if (!tabContents.home) {
          tabContents.home = h(HomeTab, null);
        }
        return tabContents.home;
      }
    }, {
      key: "hot",
      label: "热门排行",
      component: () => {
        if (!tabContents.hot) {
          tabContents.hot = h(HotTab, null);
        }
        return tabContents.hot;
      }
    }, {
      key: "trade",
      label: "交易榜单",
      component: () => {
        if (!tabContents.trade) {
          tabContents.trade = h(TradeTab, null);
        }
        return tabContents.trade;
      }
    }, {
      key: "valhalla",
      label: "英灵殿",
      component: () => {
        if (!tabContents.valhalla) {
          tabContents.valhalla = h(ValhallaTab, null);
        }
        return tabContents.valhalla;
      }
    }, {
      key: "ico",
      label: "ICO",
      component: () => {
        if (!tabContents.ico) {
          tabContents.ico = h(ICOTab, null);
        }
        return tabContents.ico;
      }
    }, {
      key: "st",
      label: "ST",
      component: () => {
        if (!tabContents.st) {
          tabContents.st = h(STTab, null);
        }
        return tabContents.st;
      }
    }];
    const render = () => {
      container.innerHTML = "";
      const tabs = h(Tabs, {
        items: tabItems,
        activeTab: activeTab,
        onTabChange: index => {
          activeTab = index;
          render();
          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });
        },
        sticky: true,
        size: size,
        icon: searchIcon,
        onIconClick: onSearchClick
      });
      container.appendChild(tabs);
    };
    const updateSize = width => {
      const newSize = width < 640 ? "small" : "large";
      if (newSize !== size) {
        size = newSize;
        render();
      }
    };
    render();
    const initialWidth = container.offsetWidth || window.innerWidth;
    updateSize(initialWidth);
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        updateSize(width);
      }
    });
    observer.observe(container);
    return container;
  }

  var stylesCSS$1 = "/* html 滚动条样式 */\r\nhtml {\r\n  scrollbar-width: thin;\r\n  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;\r\n}\r\n\r\nhtml[data-theme=\"dark\"] {\r\n  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;\r\n}\r\n\r\nhtml::-webkit-scrollbar {\r\n  width: 6px;\r\n  height: 6px;\r\n}\r\n\r\nhtml::-webkit-scrollbar-track {\r\n  background: transparent;\r\n}\r\n\r\nhtml::-webkit-scrollbar-thumb {\r\n  background-color: rgba(0, 0, 0, 0.2);\r\n  border-radius: 3px;\r\n}\r\n\r\nhtml::-webkit-scrollbar-thumb:hover {\r\n  background-color: rgba(0, 0, 0, 0.3);\r\n}\r\n\r\nhtml[data-theme=\"dark\"]::-webkit-scrollbar-thumb {\r\n  background-color: rgba(255, 255, 255, 0.2);\r\n}\r\n\r\nhtml[data-theme=\"dark\"]::-webkit-scrollbar-thumb:hover {\r\n  background-color: rgba(255, 255, 255, 0.3);\r\n}\r\n";

  function loadStyles$1() {
    const styleId = "tg-rakuen-home-styles";
    if (document.getElementById(styleId)) {
      return;
    }
    const styleElement = document.createElement("style");
    styleElement.id = styleId;
    styleElement.textContent = stylesCSS$1;
    document.head.appendChild(styleElement);
  }
  function RakuenHome() {
    loadStyles$1();
    const handleCharacterSearchClick = () => {
      const userAssets = getCachedUserAssets();
      if (!userAssets) {
        return;
      }
      const username = userAssets.name || "";
      const characterSearchModal = h(Modal, {
        visible: true,
        title: "搜索角色",
        maxWidth: 640
      }, h(CharacterSearch, {
        username: username,
        onCharacterClick: character => {
          const characterModal = h(Modal, {
            visible: true
          }, h(CharacterBox, {
            characterId: character.Id,
            sticky: true,
            stickyTop: -16
          }));
          document.body.appendChild(characterModal);
        }
      }));
      document.body.appendChild(characterSearchModal);
    };
    const container = h("div", {
      id: "tg-rakuen-home",
      className: "tinygrail"
    }, h("div", {
      className: "mx-auto max-w-screen-xl"
    }, h("div", {
      className: "space-y-3"
    }, h(UserCard, null), h(RakuenHomeTabs, {
      searchIcon: h(SearchIcon, {
        className: "size-4"
      }),
      onSearchClick: handleCharacterSearchClick
    }))));
    $("body").empty().append(container);
  }

  var stylesCSS = "#container {\r\n  height: 100dvh !important;\r\n}\r\n\r\n/* 超展开Header */\r\n#rakuenHeader {\r\n  a.logo {\r\n    cursor: pointer;\r\n  }\r\n\r\n  .navigator a {\r\n    margin: 0 5px 0 0;\r\n  }\r\n\r\n  .navigator a::after {\r\n    content: \"|\";\r\n    margin-left: 5px;\r\n  }\r\n\r\n  .navigator a:last-child::after {\r\n    content: \"\";\r\n  }\r\n\r\n  .navigator .menu {\r\n    display: none;\r\n  }\r\n}\r\n\r\n/* 移动端适配 */\r\n@media (max-width: 960px) {\r\n  /* 修改容器为单列布局 */\r\n  #container {\r\n    grid-template-columns: 0 auto !important;\r\n    width: 100vw !important;\r\n  }\r\n\r\n  /* 隐藏子菜单 */\r\n  #rakuenHeader {\r\n    ul.rakuen_nav {\r\n      z-index: -1;\r\n      margin-left: -160px;\r\n    }\r\n\r\n    ul.rakuen_nav li {\r\n      display: none;\r\n    }\r\n  }\r\n\r\n  /* 下拉菜单 */\r\n  #rakuenHeader {\r\n    .navigator .link {\r\n      display: none;\r\n      flex-direction: column;\r\n      position: absolute;\r\n      top: 60px;\r\n      right: 5px;\r\n      border-radius: 5px;\r\n      background: rgba(0, 0, 0, 0.6);\r\n      padding: 10px;\r\n      width: 100px;\r\n      text-align: right;\r\n      z-index: 101;\r\n    }\r\n\r\n    div.navigator a {\r\n      margin: 8px 0;\r\n      font-size: 18px;\r\n    }\r\n\r\n    div.navigator a::after {\r\n      content: \"\";\r\n    }\r\n\r\n    .navigator .menu {\r\n      display: block;\r\n      padding: 3px 0 0 6px;\r\n    }\r\n  }\r\n\r\n  /* 侧边栏改为绝对定位，默认隐藏在屏幕外 */\r\n  #listFrameWrapper {\r\n    position: absolute !important;\r\n    top: 60px !important;\r\n    bottom: 0 !important;\r\n    left: -400px !important;\r\n    width: 400px !important;\r\n    z-index: 100;\r\n    transition: left 0.3s ease;\r\n    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);\r\n  }\r\n\r\n  /* 侧边栏显示状态 */\r\n  #container.sidebar-visible #listFrameWrapper {\r\n    left: 0 !important;\r\n  }\r\n}\r\n";

  function loadStyles() {
    const styleId = "rakuen-topiclist-styles";
    if ($(parent.document).find(`#${styleId}`).length > 0) {
      return;
    }
    const styleElement = parent.document.createElement("style");
    styleElement.id = styleId;
    styleElement.textContent = stylesCSS;
    $(parent.document.head).append(styleElement);
  }
  function adaptMobileLayout() {
    const parentBody = $("body", parent.document);
    var links = parentBody.find("#rakuenHeader .navigator .link a");
    parentBody.find("#rakuenHeader .navigator .link").html(links);
    var menu = h("div", {
      class: "menu"
    }, h("a", {
      href: "#"
    }, "菜单"));
    parentBody.find("#rakuenHeader .navigator .menu").remove();
    parentBody.find("#rakuenHeader .navigator").append(menu);
    parentBody.find("#rakuenHeader .navigator .menu").on("click", () => {
      var link = parentBody.find("#rakuenHeader .navigator .link");
      link.css("display", link.css("display") === "none" ? "flex" : "none");
    });
    const viewportId = "rakuen-mobile-viewport";
    const updateViewport = () => {
      const isMobile = window.matchMedia("(max-width: 960px)").matches;
      const existingViewport = $(parent.document.head).find(`#${viewportId}`);
      if (isMobile && existingViewport.length === 0) {
        const viewport = h("meta", {
          id: viewportId,
          name: "viewport",
          content: "width=device-width,user-scalable=no,initial-scale=.75,maximum-scale=.75,minimum-scale=.75,viewport-fit=cover"
        });
        $(parent.document.head).append(viewport);
      } else if (!isMobile && existingViewport.length > 0) {
        existingViewport.remove();
      }
    };
    updateViewport();
    const mediaQuery = window.matchMedia("(max-width: 960px)");
    mediaQuery.addEventListener("change", updateViewport);
    parentBody.find("#rakuenHeader a.logo").removeAttr("href").off("click").on("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const container = parentBody.find("#container")[0];
      if (container) {
        container.classList.toggle("sidebar-visible");
      }
    });
  }
  function RakuenTopiclist() {
    loadStyles();
    adaptMobileLayout();
    const items = $("#eden_tpc_list .item_list");
    const parentBody = $(parent.document.body);
    items.each(function () {
      const item = this;
      const link = $(item).find("a").attr("href");
      if (!link) return;
      item.dataset.link = link;
      $(item).on("click", function (e) {
        if (e.target.tagName === "A") {
          e.preventDefault();
        }
        const isMobile = parent.window.matchMedia("(max-width: 960px)").matches;
        if (isMobile) {
          const container = parentBody.find("#container")[0];
          if (container) {
            container.classList.remove("sidebar-visible");
          }
        }
        window.open(item.dataset.link, "right");
      });
    });
  }

  function RakuenTopicCrt() {
    const path = window.location.pathname;
    const match = path.match(/\/rakuen\/topic\/crt\/(\d+)/);
    if (!match) {
      console.error("无法获取角色ID");
      return;
    }
    const characterId = parseInt(match[1]);
    const mountPoint = $("#subject_info .board").first();
    if (mountPoint.length === 0) {
      return;
    }
    const container = h("div", {
      id: "tinygrail",
      class: "section"
    }, h("div", {
      class: "horizontalOptions clearit",
      style: "display: flex; justify-content: space-between; align-items: center;"
    }, h("ul", {
      style: "margin-right: auto;"
    }, h("li", {
      class: "title"
    }, h("h2", null, h("span", null, "小圣杯")))), h("div", {
      id: "tinygrail-toggle",
      style: "cursor: pointer; opacity: 0.6;"
    }, "[折叠]")), h("div", {
      className: "tinygrail"
    }), h("div", {
      class: "section_line clear"
    }));
    mountPoint.after(container);
    const tinygrailDiv = container.querySelector(".tinygrail");
    const toggleBtn = container.querySelector("#tinygrail-toggle");
    const storageKey = "tinygrail:rakuen-topic-crt-collapsed";
    let isCollapsed = localStorage.getItem(storageKey) === "true";
    tinygrailDiv.style.display = isCollapsed ? "none" : "block";
    toggleBtn.textContent = isCollapsed ? "[展开]" : "[折叠]";
    toggleBtn.addEventListener("click", () => {
      isCollapsed = !isCollapsed;
      tinygrailDiv.style.display = isCollapsed ? "none" : "block";
      toggleBtn.textContent = isCollapsed ? "[展开]" : "[折叠]";
      localStorage.setItem(storageKey, isCollapsed);
    });
    const characterBox = h("div", {
      className: "pt-2"
    }, h(CharacterBox, {
      characterId: characterId
    }));
    tinygrailDiv.appendChild(characterBox);
  }

  function User() {
    const path = window.location.pathname;
    const match = path.match(/\/user\/([^/]+)/);
    if (!match) {
      console.error("无法获取用户名");
      return;
    }
    const username = match[1];
    const mountPoint = $("#user_home .user_box");
    if (mountPoint.length === 0) {
      return;
    }
    const navTabs = $("#headerProfile .navTabsWrapper .navTabs")[0];
    if (navTabs) {
      const updateNavTabsGap = () => {
        const isMobile = window.matchMedia("(max-width: 767px)").matches;
        navTabs.style.gap = isMobile ? "0" : "5px";
      };
      updateNavTabsGap();
      const mediaQuery = window.matchMedia("(max-width: 767px)");
      mediaQuery.addEventListener("change", updateNavTabsGap);
    }
    getUserAssets(username).then(result => {
      if (!result.success) {
        return;
      }
      const container = h("div", {
        id: "tinygrail",
        class: "section"
      }, h("div", {
        class: "horizontalOptions clearit",
        style: "display: flex; justify-content: space-between; align-items: center;"
      }, h("ul", {
        style: "margin-right: auto;"
      }, h("li", {
        class: "title"
      }, h("h2", null, h("span", null, "小圣杯")))), h("div", {
        id: "tinygrail-toggle",
        style: "cursor: pointer; opacity: 0.6;"
      }, "[折叠]")), h("div", {
        className: "tinygrail"
      }));
      mountPoint.after(container);
      const tinygrailDiv = container.querySelector(".tinygrail");
      const toggleBtn = container.querySelector("#tinygrail-toggle");
      let isCollapsed = false;
      toggleBtn.addEventListener("click", () => {
        isCollapsed = !isCollapsed;
        tinygrailDiv.style.display = isCollapsed ? "none" : "block";
        toggleBtn.textContent = isCollapsed ? "[展开]" : "[折叠]";
      });
      const userTinygrail = h("div", {
        className: "pt-2"
      }, h(UserTinygrail, {
        username: username
      }));
      tinygrailDiv.appendChild(userTinygrail);
    });
  }

  function Character() {
    const path = window.location.pathname;
    const match = path.match(/\/character\/(\d+)/);
    if (!match) {
      console.error("无法获取角色ID");
      return;
    }
    const characterId = parseInt(match[1]);
    const mountPoint = $("#columnCrtB .clearit").first();
    if (mountPoint.length === 0) {
      return;
    }
    const container = h("div", {
      id: "tinygrail"
    }, h("a", {
      id: "tinygrail-character-toggle",
      href: "javascript:void(0);",
      class: "more"
    }, "[折叠]"), h("h2", {
      class: "subtitle"
    }, "小圣杯"), h("div", {
      className: "tinygrail"
    }), h("div", {
      class: "section_line clear"
    }));
    mountPoint.after(container);
    const tinygrailDiv = container.querySelector(".tinygrail");
    const toggleBtn = container.querySelector("#tinygrail-character-toggle");
    const storageKey = "tinygrail:character-collapsed";
    let isCollapsed = localStorage.getItem(storageKey) === "true";
    tinygrailDiv.style.display = isCollapsed ? "none" : "block";
    toggleBtn.textContent = isCollapsed ? "[展开]" : "[折叠]";
    toggleBtn.addEventListener("click", () => {
      isCollapsed = !isCollapsed;
      tinygrailDiv.style.display = isCollapsed ? "none" : "block";
      toggleBtn.textContent = isCollapsed ? "[展开]" : "[折叠]";
      localStorage.setItem(storageKey, isCollapsed);
    });
    const characterBox = h("div", {
      className: "pt-2"
    }, h(CharacterBox, {
      characterId: characterId
    }));
    tinygrailDiv.appendChild(characterBox);
  }

  const routes = [{
    path: "/rakuen/home",
    component: RakuenHome
  }, {
    path: "/rakuen/topic/crt/",
    component: RakuenTopicCrt
  }, {
    path: "/rakuen/topiclist",
    component: RakuenTopiclist
  }, {
    path: "/character/",
    component: Character
  }, {
    path: "/user/",
    component: User
  }];
  function matchRoute(path) {
    const matchedRoute = routes.find(route => path.startsWith(route.path));
    if (matchedRoute && matchedRoute.component) {
      const Component = matchedRoute.component;
      Component();
    }
  }

  (function () {

    matchRoute(window.location.pathname);
  })();

})();
