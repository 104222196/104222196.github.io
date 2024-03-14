function init() {
  const width = 1500;

  const height = 700;
  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);
  5;

  const projection = d3
    .geoMercator()
    .scale(120)
    .translate([width / 2, height / 2]);

  const path = d3.geoPath(projection);

  const g = svg.append("g");

  d3.json(
    "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
  ).then((data) => {
    const countries = topojson.feature(data, data.objects.countries);

    g.selectAll("path")
      .data(countries.features)
      .enter()
      .append("path")
      .attr("class", "country")
      .attr("d", path)
      .append("title").text(d => `${d.properties["name"]}`);
  });
}

window.onload = init;
