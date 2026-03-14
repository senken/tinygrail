export function ChevronsLeftIcon({ className = "w-5 h-5" } = {}) {
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

  const path1 = document.createElementNS(svgNS, "path");
  path1.setAttribute("d", "m11 17-5-5 5-5");
  svg.appendChild(path1);

  const path2 = document.createElementNS(svgNS, "path");
  path2.setAttribute("d", "m18 17-5-5 5-5");
  svg.appendChild(path2);

  return svg;
}
