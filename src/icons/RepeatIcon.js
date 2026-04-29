/**
 * 重复/循环图标组件
 * @param {Object} props
 * @param {string} props.className - CSS类名
 */
export function RepeatIcon({ className = "w-6 h-6" } = {}) {
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
  path1.setAttribute("d", "m17 2 4 4-4 4");

  const path2 = document.createElementNS(svgNS, "path");
  path2.setAttribute("d", "M3 11v-1a4 4 0 0 1 4-4h14");

  const path3 = document.createElementNS(svgNS, "path");
  path3.setAttribute("d", "m7 22-4-4 4-4");

  const path4 = document.createElementNS(svgNS, "path");
  path4.setAttribute("d", "M21 13v1a4 4 0 0 1-4 4H3");

  svg.appendChild(path1);
  svg.appendChild(path2);
  svg.appendChild(path3);
  svg.appendChild(path4);

  return svg;
}
