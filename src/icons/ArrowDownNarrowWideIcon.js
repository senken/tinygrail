/**
 * ArrowDownNarrowWideIcon图标组件 - 降序
 * @param {Object} props
 * @param {string} props.className - CSS类名
 */
export function ArrowDownNarrowWideIcon({ className = "w-5 h-5" } = {}) {
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
  path1.setAttribute("d", "m3 16 4 4 4-4");
  svg.appendChild(path1);

  const path2 = document.createElementNS(svgNS, "path");
  path2.setAttribute("d", "M7 20V4");
  svg.appendChild(path2);

  const path3 = document.createElementNS(svgNS, "path");
  path3.setAttribute("d", "M11 4h4");
  svg.appendChild(path3);

  const path4 = document.createElementNS(svgNS, "path");
  path4.setAttribute("d", "M11 8h7");
  svg.appendChild(path4);

  const path5 = document.createElementNS(svgNS, "path");
  path5.setAttribute("d", "M11 12h10");
  svg.appendChild(path5);

  return svg;
}
