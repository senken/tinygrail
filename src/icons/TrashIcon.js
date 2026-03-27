/**
 * 垃圾桶图标组件
 * @param {Object} props
 * @param {string} props.className - CSS类名
 */
export function TrashIcon({ className = "w-6 h-6" } = {}) {
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
  path1.setAttribute("d", "M10 11v6");
  
  const path2 = document.createElementNS(svgNS, "path");
  path2.setAttribute("d", "M14 11v6");
  
  const path3 = document.createElementNS(svgNS, "path");
  path3.setAttribute("d", "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6");
  
  const path4 = document.createElementNS(svgNS, "path");
  path4.setAttribute("d", "M3 6h18");
  
  const path5 = document.createElementNS(svgNS, "path");
  path5.setAttribute("d", "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2");

  svg.appendChild(path1);
  svg.appendChild(path2);
  svg.appendChild(path3);
  svg.appendChild(path4);
  svg.appendChild(path5);

  return svg;
}
