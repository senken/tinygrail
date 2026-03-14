export function EllipsisIcon({ className = "w-5 h-5" } = {}) {
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

  const circle1 = document.createElementNS(svgNS, "circle");
  circle1.setAttribute("cx", "12");
  circle1.setAttribute("cy", "12");
  circle1.setAttribute("r", "1");
  svg.appendChild(circle1);

  const circle2 = document.createElementNS(svgNS, "circle");
  circle2.setAttribute("cx", "19");
  circle2.setAttribute("cy", "12");
  circle2.setAttribute("r", "1");
  svg.appendChild(circle2);

  const circle3 = document.createElementNS(svgNS, "circle");
  circle3.setAttribute("cx", "5");
  circle3.setAttribute("cy", "12");
  circle3.setAttribute("r", "1");
  svg.appendChild(circle3);

  return svg;
}
