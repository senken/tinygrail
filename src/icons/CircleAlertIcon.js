export function CircleAlertIcon({ className = "h-6 w-6" } = {}) {
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

  const circle = document.createElementNS(svgNS, "circle");
  circle.setAttribute("cx", "12");
  circle.setAttribute("cy", "12");
  circle.setAttribute("r", "10");
  svg.appendChild(circle);

  const line1 = document.createElementNS(svgNS, "line");
  line1.setAttribute("x1", "12");
  line1.setAttribute("x2", "12");
  line1.setAttribute("y1", "8");
  line1.setAttribute("y2", "12");
  svg.appendChild(line1);

  const line2 = document.createElementNS(svgNS, "line");
  line2.setAttribute("x1", "12");
  line2.setAttribute("x2", "12.01");
  line2.setAttribute("y1", "16");
  line2.setAttribute("y2", "16");
  svg.appendChild(line2);

  return svg;
}
