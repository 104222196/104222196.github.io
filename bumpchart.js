function init() {
  function Bumpchart(data) {
    var w = 1000;
    var h = 600;
    var bumpRadius = 13;
    var padding = 20;
    const margin = { left: 130, right: 130, top: 20, bottom: 50 };
    seq = (start, length) =>
      Array.apply(null, { length: length }).map((d, i) => i + start);
    var countries = Array.from(new Set(data.flatMap((d) => [d.country])));
    var years = Array.from(new Set(data.flatMap((d) => [d.year])));
    var y = d3.scalePoint().range([margin.top, h - margin.bottom - padding]);
    var ax = d3
      .scalePoint()
      .domain(years)
      .range([margin.left + padding, w - margin.right - padding]);

    function createChartData(countries, years, data) {
      const ci = new Map(countries.map((country, i) => [country, i]));
      const yi = new Map(years.map((year, i) => [year, i]));

      const matrix = Array.from(ci, () => new Array(years.length).fill(null));
      for (const { country, year, student } of data)
        matrix[ci.get(country)][yi.get(year)] = {
          rank: 0,
          student: +student,
          next: null,
        };

      matrix.forEach((d) => {
        for (let i = 0; i < d.length - 1; i++) d[i].next = d[i + 1];
      });

      years.forEach((d, i) => {
        const array = [];
        matrix.forEach((d) => array.push(d[i]));
        array.sort((a, b) => b.student - a.student);
        array.forEach((d, j) => (d.rank = j));
      });

      return matrix;
    }
    const chartData = createChartData(countries, years, data);
    console.log(chartData);

    function calculateRanking(years, chartData, countries) {
      const len = years.length - 1;
      return chartData.map((d, i) => ({
        country: countries[i],
        first: d[0].rank,
        last: d[len].rank,
      }));
    }
    const ranking = calculateRanking(years, chartData, countries);

    var bx = d3
      .scalePoint()
      .domain(seq(0, years.length))
      .range([0, w - margin.left - margin.right - padding * 2]);

    var by = d3
      .scalePoint()
      .domain(seq(0, ranking.length))
      .range([margin.top, h - margin.bottom - padding]);

    var color = d3
      .scaleOrdinal(d3.schemeTableau10)
      .domain(seq(0, ranking.length));

    var left = ranking.sort((a, b) => a.first - b.first).map((d) => d.country);
    var right = ranking.sort((a, b) => a.last - b.last).map((d) => d.country);
    years = Array.from(new Set(data.flatMap((d) => [d.year])));
    var svg = d3
      .select("#bump")
      .append("svg")
      .attr("width", w)
      .attr("height", h);
    drawAxis = (g, x, y, axis, domain) => {
      g.attr("transform", `translate(${x},${y})`)
        .call(axis)
        .selectAll(".tick text")
        .attr("font-size", "12px");

      if (!domain) g.select(".domain").remove();
    };
    // markTick(leftY, 0);
    // markTick(rightY, years.length - 1);

    svg
      .append("g")
      .attr("transform", `translate(${margin.left + padding},0)`)
      .selectAll("path")
      .data(seq(0, years.length))
      .join("path")
      .attr("stroke", "#ccc")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5")
      .attr("d", (d) =>
        d3.line()([
          [bx(d), 0],
          [bx(d), h - margin.bottom],
        ])
      );

    const series = svg
      .selectAll(".series")
      .data(chartData)
      .join("g")
      .attr("class", "series")
      .attr("opacity", 1)
      .attr("fill", (d) => color(d[0].rank))
      .attr("stroke", (d) => color(d[0].rank))
      .attr("transform", `translate(${margin.left + padding},0)`)
      .on("mouseover", highlight)
      .on("mouseout", restore);

    series
      .selectAll("path")
      .data((d) => d)
      .join("path")
      .attr("stroke-width", 5)
      .attr("d", (d, i) => {
        if (d.next)
          return d3.line()([
            [bx(i), by(d.rank)],
            [bx(i + 1), by(d.next.rank)],
          ]);
      });

    const bumps = series
      .selectAll("g")
      .data((d, i) =>
        d.map((v) => ({ country: countries[i], student: v, first: d[0].rank }))
      )
      .join("g")
      .attr("transform", (d, i) => `translate(${bx(i)},${by(d.student.rank)})`)
      .call((g) =>
        g
          .append("title")
          .text((d, i) => `${d.country} - ${years[i]}\nNumber of students: ${d.student.student}`)
      );

    bumps.append("circle").attr("r", bumpRadius);
    bumps
      .append("text")
      .attr("dy", "0.35em")
      .attr("fill", "white")
      .attr("stroke", "none")
      .attr("text-anchor", "middle")
      .style("font-weight", "bold")
      .style("font-size", "14px")
      .text((d) => d.student.rank + 1);

    svg
      .append("g")
      .call((g) =>
        drawAxis(
          g,
          0,
          h - margin.top - margin.bottom + padding,
          d3.axisBottom(ax),
          true
        )
      );
    const leftY = svg
      .append("g")
      .call((g) => drawAxis(g, margin.left, 0, d3.axisLeft(y.domain(left))));
    const rightY = svg
      .append("g")
      .call((g) =>
        drawAxis(g, w - margin.right, 0, d3.axisRight(y.domain(right)))
      );

    function highlight(e, d) {
      this.parentNode.appendChild(this);
      series
        .filter((s) => s !== d)
        .transition()
        .duration(300)
        .attr("fill", "#F8F0E5")
        .attr("stroke", "#F8F0E5");
      markTick(leftY, 0);
      markTick(rightY, years.length - 1);

      function markTick(axis, pos) {
        axis
          .selectAll(".tick text")
          .filter((s, i) => i === d[pos].rank)
          .transition()
          .duration(500)
          .attr("font-weight", "bold")
          .attr("fill", color(d[0].rank));
      }
    }
    function restore() {
      series
        .transition()
        .duration(500)
        .attr("fill", (s) => color(s[0].rank))
        .attr("stroke", (s) => color(s[0].rank));
      restoreTicks(leftY);
      restoreTicks(rightY);

      function restoreTicks(axis) {
        axis
          .selectAll(".tick text")
          .transition()
          .duration(500)
          .attr("font-weight", "normal")
          .attr("fill", "black");
      }
    }
  }

  d3.csv("top10source.csv").then(function (data) {
    data.forEach(function (d) {
      d.year = +d.year;
      d.student = +d.student;
    });
    Bumpchart(data);
  });
}

window.onload = init;
