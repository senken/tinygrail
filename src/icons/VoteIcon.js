/**
 * 投票图标组件
 * @param {Object} props
 * @param {string} props.className - CSS类名
 */
export function VoteIcon({ className = "w-6 h-6" } = {}) {
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
  path1.setAttribute("d", "m9 12 2 2 4-4");
  
  const path2 = document.createElementNS(svgNS, "path");
  path2.setAttribute("d", "M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z");
  
  const path3 = document.createElementNS(svgNS, "path");
  path3.setAttribute("d", "M22 19H2");

  svg.appendChild(path1);
  svg.appendChild(path2);
  svg.appendChild(path3);

  return svg;
}
