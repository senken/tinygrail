/**
 * 拍卖锤图标组件
 * @param {Object} props
 * @param {string} props.className - CSS类名
 */
export function GavelIcon({ className = "w-6 h-6" } = {}) {
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
  path1.setAttribute("d", "m14 13-8.381 8.38a1 1 0 0 1-3.001-3l8.384-8.381");

  const path2 = document.createElementNS(svgNS, "path");
  path2.setAttribute("d", "m16 16 6-6");

  const path3 = document.createElementNS(svgNS, "path");
  path3.setAttribute("d", "m21.5 10.5-8-8");

  const path4 = document.createElementNS(svgNS, "path");
  path4.setAttribute("d", "m8 8 6-6");

  const path5 = document.createElementNS(svgNS, "path");
  path5.setAttribute("d", "m8.5 7.5 8 8");

  svg.appendChild(path1);
  svg.appendChild(path2);
  svg.appendChild(path3);
  svg.appendChild(path4);
  svg.appendChild(path5);

  return svg;
}
