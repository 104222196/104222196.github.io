const w = 950;
const h = 600;
const bumpRadius = 10;
const padding = 20;
const margin = { left: 175, right: 175, top: 20, bottom: 50 };

let isSeriesLocked = false;
const sankeyDiagram = document.getElementById("sankey");

function seq(start, length) {
	return Array.apply(null, { length: length }).map((d, i) => i + start);
}

function drawBumpChart(rootId, data, headerOptions, rankingLimit) {
	const { categoryColumn, timeColumn, comparisonColumn } = headerOptions;

	const svg = d3
		.select(rootId)
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

	const categories = Array.from(new Set(data.map(d => d[categoryColumn])));
	const timePoints = Array.from(new Set(data.map(d => d[timeColumn])));

	// Getting the matrix
	const categoryIndex = new Map(categories.map((category, i) => [category, i]));
	const timePointIndex = new Map(timePoints.map((timePoint, i) => [timePoint, i]));

	const matrix = Array.from(categories, () => new Array(timePoints.length).fill(null));

	// attach category name to each row in the matrix
	matrix.forEach((row, index) => row.category = categories[index]);

	for (const dataItem of data) {
		const category = dataItem[categoryColumn];
		const timePoint = dataItem[timeColumn];
		const comparisonValue = dataItem[comparisonColumn];

		matrix[categoryIndex.get(category)][timePointIndex.get(timePoint)] = {
			time: timePoint,
			rank: 0,
			value: +comparisonValue,
			next: null,
		};
	}

	matrix.forEach(row => {
		for (let i = 0; i < row.length - 1; i++) {
			if (row[i]) row[i].next = row[i + 1];
		}
	});

	timePoints.forEach((_, timePointIndex) => {
		let array = [];
		matrix.forEach(row => array.push(row[timePointIndex]));
		array = array.filter(e => e !== null);
		array.sort((a, b) => b.value - a.value);
		array.forEach((cell, j) => cell.rank = j);
	});

	// An array of countries and their rankings at the start and end of the period.
	const ranking = matrix.map((d, i) => ({
		category: categories[i],
		first: d[0] ? d[0].rank : rankingLimit + 1,
		last: d[timePoints.length - 1] ? d[timePoints.length - 1].rank : rankingLimit + 1,
	}));

	const color = d3
		.scaleOrdinal(d3.schemeTableau10)
		.domain(seq(0, ranking.length));

	// COuntry lists on the left and right axes.
	const left = ranking.sort((a, b) => a.first - b.first).map((d) => d.category).slice(0, rankingLimit);
	const right = ranking.sort((a, b) => a.last - b.last).map((d) => d.category).slice(0, rankingLimit);

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
		.domain(timePoints)
		.range([margin.left + padding, w - margin.right - padding]);

	const bx = d3
		.scalePoint()
		.domain(seq(0, timePoints.length))
		.range([0, w - margin.left - margin.right - padding * 2]);

	const by = d3
		.scalePoint()
		.domain(seq(0, rankingLimit))
		.range([margin.top, h - margin.bottom - padding]);

	// Faint vertical line behind each year's ranking column?
	svg.append("g")
		.attr("transform", `translate(${margin.left + padding},0)`)
		.selectAll("path")
		.data(seq(0, timePoints.length))
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
		.data(matrix) // an array of countries. each country is an array of years.
		.join("g")
		.each(function (_, i) { this.color = color(i); })
		.attr("class", "series")
		.attr("fill", (d, i) => color(i))
		.attr("stroke", (d, i) => color(i))
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
			isSeriesLocked = true;
			sankeyDiagram.dispatchEvent(new CustomEvent("seriesLocked", { detail: d.category }));
			hideAllSeries();
			highlightSeries(d);
		});

	series
		.selectAll("path")
		.data((d) => d.filter(e => e !== null))
		.join("path")
		.attr("stroke-width", 3)
		.attr("d", (d, i) => {
			if (d.next)
				return d3.line()([
					[bx(timePointIndex.get(d.time)), by(d.rank)],
					[bx(timePointIndex.get(d.next.time)), by(d.next.rank)],
				]);
		});

	const bumps = series
		.selectAll("g")
		.data((d, i) => {
			return d.filter(e => e !== null).map((v) => ({ category: categories[i], value: v }));
		}

		)
		.join("g")
		.attr("transform", (d, i) => `translate(${bx(timePointIndex.get(d.value.time))},${by(d.value.rank)})`)
		.call((g) =>
			g.append("title")
				.text((d, i) => `${d.category} - ${d.value.time}\nNumber of students: ${d.value.value}`)
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
		.text((d) => d.value.rank + 1);



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
			.attr("fill", "#0F2C59")

		rightY.selectAll(".tick text")
			.transition()
			.duration(300)
			.attr("fill", "#0F2C59")
	}

	function highlightSeries(datumOfTarget) {
		const targetSeries = series.filter(datum => datum === datumOfTarget);
		const originalColor = targetSeries.node().color;

		targetSeries.transition()
			.duration(300)
			.attr("fill", originalColor)
			.attr("stroke", originalColor);

		targetSeries.selectAll("text")
			.transition()
			.duration(300)
			.attr("fill", "white");

		if (datumOfTarget[0]) {
			leftY.selectAll(".tick text")
				.filter((datum, index) => index === datumOfTarget[0].rank)
				.transition()
				.duration(300)
				.attr("fill", originalColor);
		}

		if (datumOfTarget[datumOfTarget.length - 1]) {
			rightY.selectAll(".tick text")
				.filter((datum, index) => index === datumOfTarget[datumOfTarget.length - 1].rank)
				.transition()
				.duration(300)
				.attr("fill", originalColor);
		}
	}

	function unhighlightSeries(datumOfTarget) {
		const targetSeries = series.filter(datum => datum === datumOfTarget);
		const originalColor = targetSeries.node().color;

		targetSeries.transition()
			.duration(300)
			.attr("fill", originalColor)
			.attr("stroke", originalColor);

		targetSeries.selectAll("text")
			.transition()
			.duration(300)
			.attr("fill", "transparent");

		if (datumOfTarget[0]) {
			leftY.selectAll(".tick text")
				.filter((datum, index) => index === datumOfTarget[0].rank)
				.transition()
				.duration(300)
				.attr("fill", "#0F2C59");
		}

		if (datumOfTarget[datumOfTarget.length - 1]) {
			rightY.selectAll(".tick text")
				.filter((datum, index) => index === datumOfTarget[datumOfTarget.length - 1].rank)
				.transition()
				.duration(300)
				.attr("fill", "#0F2C59");
		}
	}

	function unhideAllSeries() {
		series.transition()
			.duration(300)
			.attr("fill", function () { return this.color; })
			.attr("stroke", function () { return this.color; });

		series.selectAll("text")
			.transition()
			.duration(300)
			.attr("fill", "transparent")

		leftY.selectAll(".tick text")
			.transition()
			.duration(300)
			.attr("fill", "#0F2C59")

		rightY.selectAll(".tick text")
			.transition()
			.duration(300)
			.attr("fill", "#0F2C59")
	}
}

d3.csv("./dataset/top_15_origins.csv").then(function (data) {
	data.forEach(function (d) {
		d.year = +d.year;
		d.student = +d.student;
	});

	const opts = {
		categoryColumn: "country",
		timeColumn: "year",
		comparisonColumn: "students"
	}

	drawBumpChart("#bump", data, opts, 15);
});