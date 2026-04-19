/**
 * 骰子图标组件
 * @param {Object} props
 * @param {string} props.className - CSS类名
 */
export function DicesIcon({ className = "w-6 h-6" } = {}) {
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

  // 第一个骰子
  const rect = document.createElementNS(svgNS, "rect");
  rect.setAttribute("width", "12");
  rect.setAttribute("height", "12");
  rect.setAttribute("x", "2");
  rect.setAttribute("y", "10");
  rect.setAttribute("rx", "2");
  rect.setAttribute("ry", "2");

  // 第二个骰子的路径
  const path1 = document.createElementNS(svgNS, "path");
  path1.setAttribute("d", "m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6");

  // 骰子点数
  const path2 = document.createElementNS(svgNS, "path");
  path2.setAttribute("d", "M6 18h.01");

  const path3 = document.createElementNS(svgNS, "path");
  path3.setAttribute("d", "M10 14h.01");

  const path4 = document.createElementNS(svgNS, "path");
  path4.setAttribute("d", "M15 6h.01");

  const path5 = document.createElementNS(svgNS, "path");
  path5.setAttribute("d", "M18 9h.01");

  svg.appendChild(rect);
  svg.appendChild(path1);
  svg.appendChild(path2);
  svg.appendChild(path3);
  svg.appendChild(path4);
  svg.appendChild(path5);

  return svg;
}
