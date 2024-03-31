const w = 950;
const h = 700;
const bumpRadius = 10;
const padding = 20;
const margin = { left: 175, right: 175, top: 20, bottom: 50 };

let isSeriesLocked = false;
const sankeyDiagram = document.getElementById("sankey");

function drawBumpChart(data) {
	const svg = d3
		.select("#bump")
		.append("svg")
		.attr("width", w)
		.attr("height", h);

	svg.append("rect")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", w)
		.attr("height", h)
		.attr("fill", "transparent")
		.attr("z-index", "-100")
		.on("click", () => {
			isSeriesLocked = false;
			unhideAllSeries();
		});

	let seq = (start, length) =>
		Array.apply(null, { length: length }).map((d, i) => i + start);

	console.log(seq(5, 15))

	const countries = Array.from(new Set(data.map(d => d.country)));
	const years = Array.from(new Set(data.map(d => d.year)));


	function createChartData(countries, years, data) {
		const ci = new Map(countries.map((country, i) => [country, i]));
		const yi = new Map(years.map((year, i) => [year, i]));

		const matrix = Array.from(ci, () => new Array(years.length).fill(null));

		// attach country name to each row in the matrix
		matrix.forEach((row, index) => row.country = countries[index]);

		for (const { country, year, student } of data) {
			matrix[ci.get(country)][yi.get(year)] = {
				rank: 0,
				student: +student,
				next: null,
			};
		}

		matrix.forEach((d) => {
			for (let i = 0; i < d.length - 1; i++) d[i].next = d[i + 1];
		});

		years.forEach((d, yearIndex) => {
			const array = [];
			matrix.forEach(country => array.push(country[yearIndex]));
			array.sort((a, b) => b.student - a.student);
			array.forEach((countryInYear, j) => countryInYear.rank = j);
		});

		return matrix;
	}

	const chartData = createChartData(countries, years, data);

	function calculateRanking(years, chartData, countries) {
		const len = years.length - 1;
		return chartData.map((d, i) => ({
			country: countries[i],
			first: d[0].rank,
			last: d[len].rank,
		}));
	}
	// An array of countries and their rankings at the start and end of the period.
	const ranking = calculateRanking(years, chartData, countries);

	console.log(ranking)



	var color = d3
		.scaleOrdinal(d3.schemeTableau10)
		.domain(seq(0, ranking.length));

	// COuntry lists on the left and right axes.
	var left = ranking.sort((a, b) => a.first - b.first).map((d) => d.country);
	var right = ranking.sort((a, b) => a.last - b.last).map((d) => d.country);

	// AXIS RELATED STUFF

	drawAxis = (g, x, y, axis, domain) => {
		g.attr("transform", `translate(${x},${y})`)
			.call(axis)
			.selectAll(".tick text")
			.attr("font-size", "12px")
			.attr("font-weight", "bold");

		if (!domain) g.select(".domain").remove();
	};

	const ax = d3
		.scalePoint()
		.domain(years)
		.range([margin.left + padding, w - margin.right - padding]);

	var bx = d3
		.scalePoint()
		.domain(seq(0, years.length))
		.range([0, w - margin.left - margin.right - padding * 2]);

	var by = d3
		.scalePoint()
		.domain(seq(0, ranking.length))
		.range([margin.top, h - margin.bottom - padding]);

	// Faint vertical line behind each year's ranking column?
	svg.append("g")
		.attr("transform", `translate(${margin.left + padding},0)`)
		.selectAll("path")
		.data(seq(0, years.length))
		.join("path")
		.attr("stroke", "#ccc")
		.attr("stroke-width", 1)
		.attr("d", (d) =>
			d3.line()([
				[bx(d), 0],
				[bx(d), h - margin.bottom],
			])
		);

	// Bottom x axis.
	svg.append("g")
		.call((g) =>
			drawAxis(g, 0,
				h - margin.top - margin.bottom + padding,
				d3.axisBottom(ax),
				true
			)
		)
		.selectAll("text")
		.attr("font-family", "Inter")
		.attr("font-size", ".8rem");

	// Left and right Y axes.
	const y = d3.scalePoint().range([margin.top, h - margin.bottom - padding]);
	const leftY = svg
		.append("g")
		.call((g) => drawAxis(g, margin.left, 0, d3.axisLeft(y.domain(left)), false));

		leftY.selectAll("text")
		.attr("font-family", "Inter")
		.attr("font-size", ".8rem");
	const rightY = svg
		.append("g")
		.call((g) =>
			drawAxis(g, w - margin.right, 0, d3.axisRight(y.domain(right)))
		);
		rightY
		.selectAll("text")
		.attr("font-family", "Inter")
		.attr("font-size", ".8rem");

	// SERIES RELATED STUFF

	const series = svg
		.selectAll(".series")
		.data(chartData) // an array of countries. each country is an array of years.
		.join("g")
		.attr("class", "series")
		.attr("opacity", 1)
		.attr("fill", (d) => color(d[0].rank))
		.attr("stroke", (d) => color(d[0].rank))
		.attr("cursor", "pointer")
		.attr("transform", `translate(${margin.left + padding}, 0)`)
		.on("mouseover", (e, d) => {
			if (!isSeriesLocked) {
				hideAllSeries();
				highlightSeries(d);
			}
		})
		.on("mouseout", (e, d) => {
			if (!isSeriesLocked) {
				unhighlightSeries(d);
				unhideAllSeries(d);
			}
		})
		.on("click", (e, d) => {
			console.log(d)
			isSeriesLocked = true;
			console.log(d.country)
			sankeyDiagram.dispatchEvent(new CustomEvent("seriesLocked", { detail: d.country }));
			hideAllSeries();
			highlightSeries(d);
		});

	series
		.selectAll("path")
		.data((d) => d)
		.join("path")
		.attr("stroke-width", 3)
		.attr("d", (d, i) => {
			if (d.next)
				return d3.line()([
					[bx(i), by(d.rank)],
					[bx(i + 1), by(d.next.rank)],
				]);
		});

	const bumps = series
		.selectAll("g")
		.data((d, i) => {
			console.log(d, i);
			const ret = d.map((v) => ({ country: countries[i], student: v, first: d[0].rank }))
			console.log(ret)
			return ret
		}

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
		.attr("fill", "transparent")
		.attr("stroke", "none")
		.attr("text-anchor", "middle")
		.attr("font-family", "Inter")
		.style("font-weight", "bold")
		.style("font-size", "12px")
		.text((d) => d.student.rank + 1);

	

	function hideAllSeries() {
		series.transition()
			.duration(300)
			.attr("fill", "#EADBC8")
			.attr("stroke", "#EADBC8");

		series.selectAll("text")
			.transition()
			.duration(300)
			.attr("fill", "transparent")

		leftY.selectAll(".tick text")
			.transition()
			.duration(300)
			.attr("fill", "black")

		rightY.selectAll(".tick text")
			.transition()
			.duration(300)
			.attr("fill", "black")
	}

	function highlightSeries(datumOfTarget) {
		const targetSeries = series.filter(datum => datum === datumOfTarget);

		console.log(datumOfTarget)
		
		targetSeries.transition()
			.duration(300)
			.attr("fill", (datum) => color(datum[0].rank))
			.attr("stroke", (datum) => color(datum[0].rank));

		targetSeries.selectAll("text")
			.transition()
			.duration(300)
			.attr("fill", "white");

		leftY.selectAll(".tick text")
			.filter((datum, index) => index === datumOfTarget[0].rank)
			.transition()
			.duration(300)
			.attr("fill", (datum) => color(datumOfTarget[0].rank));

		rightY.selectAll(".tick text")
			.filter((datum, index) => index === datumOfTarget[datumOfTarget.length - 1].rank)
			.transition()
			.duration(300)
			.attr("fill", (datum) => color(datumOfTarget[0].rank));
	}

	function unhighlightSeries(datumOfTarget) {
		const targetSeries = series.filter(datum => datum === datumOfTarget);
		
		targetSeries.transition()
			.duration(300)
			.attr("fill", (datum) => color(datum[0].rank))
			.attr("stroke", (datum) => color(datum[0].rank));

		targetSeries.selectAll("text")
			.transition()
			.duration(300)
			.attr("fill", "transparent");

		leftY.selectAll(".tick text")
			.filter((datum, index) => index === datumOfTarget[0].rank)
			.transition()
			.duration(300)
			.attr("fill", "black");

		rightY.selectAll(".tick text")
			.filter((datum, index) => index === datumOfTarget[datumOfTarget.length - 1].rank)
			.transition()
			.duration(300)
			.attr("fill", "black");
	}

	function unhideAllSeries() {
		series.transition()
			.duration(300)
			.attr("fill", (datum) => color(datum[0].rank))
			.attr("stroke", (datum) => color(datum[0].rank));

		series.selectAll("text")
			.transition()
			.duration(300)
			.attr("fill", "transparent")

		leftY.selectAll(".tick text")
			.transition()
			.duration(300)
			.attr("fill", "black")

		rightY.selectAll(".tick text")
			.transition()
			.duration(300)
			.attr("fill", "black")
	}
}

d3.csv("./dataset/top10source.csv").then(function (data) {
	data.forEach(function (d) {
		d.year = +d.year;
		d.student = +d.student;
	});
	drawBumpChart(data);
});