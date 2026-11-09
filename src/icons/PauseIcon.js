/**
 * 暂停图标组件
 * @param {Object} props 图标配置
 * @param {string} props.className CSS类名
 * @returns {SVGElement} 暂停图标
 */
export function PauseIcon({ className = "h-6 w-6" } = {}) {
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

  for (const x of [14, 5]) {
    const rect = document.createElementNS(svgNS, "rect");
    rect.setAttribute("x", String(x));
    rect.setAttribute("y", "3");
    rect.setAttribute("width", "5");
    rect.setAttribute("height", "18");
    rect.setAttribute("rx", "1");
    svg.appendChild(rect);
  }
  return svg;
}
