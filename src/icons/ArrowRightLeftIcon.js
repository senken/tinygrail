export function ArrowRightLeftIcon({ className = "w-4 h-4" } = {}) {
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
  svg.setAttribute("aria-hidden", "true");

  const path1 = document.createElementNS(svgNS, "path");
  path1.setAttribute("d", "m16 3 4 4-4 4");
  svg.appendChild(path1);

  const path2 = document.createElementNS(svgNS, "path");
  path2.setAttribute("d", "M20 7H4");
  svg.appendChild(path2);

  const path3 = document.createElementNS(svgNS, "path");
  path3.setAttribute("d", "m8 21-4-4 4-4");
  svg.appendChild(path3);

  const path4 = document.createElementNS(svgNS, "path");
  path4.setAttribute("d", "M4 17h16");
  svg.appendChild(path4);

  return svg;
}
