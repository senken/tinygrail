import { matchRoute } from "./router/index.jsx";
import "./styles/base.css";

(function () {
  "use strict";

  matchRoute(window.location.pathname);
})();
