/**
 * 搜索图标组件
 * @param {Object} props
 * @param {string} props.className - CSS类名
 */
export function SearchIcon({ className = "w-6 h-6" } = {}) {
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

  // 搜索路径
  const path = document.createElementNS(svgNS, "path");
  path.setAttribute("d", "m21 21-4.34-4.34");
  svg.appendChild(path);

  // 搜索圆圈
  const circle = document.createElementNS(svgNS, "circle");
  circle.setAttribute("cx", "11");
  circle.setAttribute("cy", "11");
  circle.setAttribute("r", "8");
  svg.appendChild(circle);

  return svg;
}