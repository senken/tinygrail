/**
 * 日历打勾图标组件
 * @param {Object} props
 * @param {string} props.className - CSS类名
 */
export function CalendarCheckIcon({ className = "w-6 h-6" } = {}) {
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
  path1.setAttribute("d", "M8 2v4");

  const path2 = document.createElementNS(svgNS, "path");
  path2.setAttribute("d", "M16 2v4");

  const rect = document.createElementNS(svgNS, "rect");
  rect.setAttribute("width", "18");
  rect.setAttribute("height", "18");
  rect.setAttribute("x", "3");
  rect.setAttribute("y", "4");
  rect.setAttribute("rx", "2");

  const path3 = document.createElementNS(svgNS, "path");
  path3.setAttribute("d", "M3 10h18");

  const path4 = document.createElementNS(svgNS, "path");
  path4.setAttribute("d", "m9 16 2 2 4-4");

  svg.appendChild(path1);
  svg.appendChild(path2);
  svg.appendChild(rect);
  svg.appendChild(path3);
  svg.appendChild(path4);

  return svg;
}
