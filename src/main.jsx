import { syncFromCloud } from "./modules/favorite/favoriteSync.js";
import { matchRoute } from "./router/index.jsx";
import "./styles/base.css";

(function () {
  "use strict";

  matchRoute(window.location.pathname);

  // 从云端同步收藏夹
  syncFromCloud();
})();
