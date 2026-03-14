/**
 * RefreshCwIcon图标组件
 * @param {Object} props
 * @param {string} props.className - CSS类名
 */
export function RefreshCwIcon({ className = "w-5 h-5" } = {}) {
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
