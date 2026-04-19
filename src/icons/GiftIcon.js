/**
 * 礼物图标组件
 * @param {Object} props
 * @param {string} props.className - CSS类名
 */
export function GiftIcon({ className = "w-6 h-6" } = {}) {
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
  path1.setAttribute("d", "M12 7v14");

  const path2 = document.createElementNS(svgNS, "path");
  path2.setAttribute("d", "M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8");

  const path3 = document.createElementNS(svgNS, "path");
  path3.setAttribute("d", "M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5");

  const rect = document.createElementNS(svgNS, "rect");
  rect.setAttribute("x", "3");
  rect.setAttribute("y", "7");
  rect.setAttribute("width", "18");
  rect.setAttribute("height", "4");
  rect.setAttribute("rx", "1");

  svg.appendChild(path1);
  svg.appendChild(path2);
  svg.appendChild(path3);
  svg.appendChild(rect);

  return svg;
}
