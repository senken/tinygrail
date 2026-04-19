/**
 * 分币圆圈图标组件
 * @param {Object} props
 * @param {string} props.className - CSS类名
 */
export function CircleCentIcon({ className = "w-6 h-6" } = {}) {
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

  const circle = document.createElementNS(svgNS, "circle");
  circle.setAttribute("cx", "12");
  circle.setAttribute("cy", "12");
  circle.setAttribute("r", "10");

  const path1 = document.createElementNS(svgNS, "path");
  path1.setAttribute("d", "M12 6v12");

  const path2 = document.createElementNS(svgNS, "path");
  path2.setAttribute("d", "M16 9a5 5 0 1 0 0 6");

  svg.appendChild(circle);
  svg.appendChild(path1);
  svg.appendChild(path2);

  return svg;
}
