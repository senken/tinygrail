/**
 * 剪贴板时钟图标组件
 * @param {Object} props
 * @param {string} props.className - CSS类名
 */
export function ClipboardClockIcon({ className = "w-6 h-6" } = {}) {
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
  path1.setAttribute("d", "M16 14v2.2l1.6 1");

  const path2 = document.createElementNS(svgNS, "path");
  path2.setAttribute("d", "M16 4h2a2 2 0 0 1 2 2v.832");

  const path3 = document.createElementNS(svgNS, "path");
  path3.setAttribute("d", "M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h2");

  const circle = document.createElementNS(svgNS, "circle");
  circle.setAttribute("cx", "16");
  circle.setAttribute("cy", "16");
  circle.setAttribute("r", "6");

  const rect = document.createElementNS(svgNS, "rect");
  rect.setAttribute("x", "8");
  rect.setAttribute("y", "2");
  rect.setAttribute("width", "8");
  rect.setAttribute("height", "4");
  rect.setAttribute("rx", "1");

  svg.appendChild(path1);
  svg.appendChild(path2);
  svg.appendChild(path3);
  svg.appendChild(circle);
  svg.appendChild(rect);

  return svg;
}
