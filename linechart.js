// Setting dimensions
const lineChartMagins = { top: 20, right: 20, bottom: 20, left: 80 },
	lineChartWidth = 800 - lineChartMagins.left - lineChartMagins.right,
	lineChartHeight = 250 - lineChartMagins.top - lineChartMagins.bottom;

const lineChartTitle = document.querySelector("#line-title");

// Appending svg to a selected element
const lineChartSvg = d3
	.select("#line-chart")
	.append("svg")
	.attr("width", lineChartWidth + lineChartMagins.left + lineChartMagins.right)
	.attr("height", 300 + lineChartMagins.top + lineChartMagins.bottom)
	//.attr("viewBox", `0 40 ${lineChartWidth + 80} ${lineChartHeight}`)
	.append("g")
	.attr("transform", `translate(${lineChartMagins.left}, ${lineChartMagins.top})`);

const lineChartXGroup = lineChartSvg.append("g")
									.attr("id", "#xAxis")
									.attr("font-weight", "bold")
									.attr("font-size", "1rem")
									.attr("transform", "translate(0," + lineChartHeight + ")");

const lineChartYGroup = lineChartSvg.append("g")
									.attr("id", "#yAxis")
									.attr("font-weight", "bold")
									.attr("font-size", "1rem");

const linePath = lineChartSvg.append("path")
							.attr("stroke-width", "2")
							.style("fill", "none");

const lineArea = lineChartSvg.append("path").attr("opacity", .5);

function drawLineChart(data, sourceCountry, destinationCountry, color) {
	const sourceDestinationPair = data[sourceCountry][destinationCountry];

	const chartData = Object.keys(sourceDestinationPair).map(year => ({
		year: year,
		students: sourceDestinationPair[year]
	})).filter(e => e.students !== null);

	// Setting X,Y scale ranges
	const xScale = d3
		.scaleTime()
		.domain([new Date(2017, 0), new Date(2021, 0)])
		.range([0, lineChartWidth]);

	const yScale = d3
		.scaleLinear()
		.domain([0, d3.max(chartData, (e) => e.students)])
		.range([lineChartHeight, 0]);

	// Adding the x Axis
	lineChartXGroup.transition()
					.duration(300)
					.call(d3.axisBottom(xScale).ticks(d3.timeYear.every(1)));

	lineChartXGroup.selectAll("text")
					.attr("font-weight", "bold")
					.attr("font-size", ".8rem");

	// Adding the y Axis
	lineChartYGroup.transition()
					.duration(300)
					.call(d3.axisLeft(yScale));

	lineChartYGroup.selectAll("text")
					.attr("font-weight", "bold")
					.attr("font-size", ".8rem");

	// Drawing line with inner gradient and area
	const line = d3.line()
		.x(d => xScale(new Date(d.year, 0)))
		.y(d => yScale(d.students));

	const area = d3
		.area()
		.x(d => xScale(new Date(d.year, 0)))
		.y0(lineChartHeight)
		.y1(d => yScale(d.students));

	// Defining the line path and adding some styles
	linePath.attr("stroke", color)
			.transition()
			.duration(300)
			.attr("d", line(chartData));
			
		
	lineChartSvg.selectAll("circle")
		.data(chartData)
		.join("circle")
		.attr("r", 4)
		.attr("stroke", color)
		.attr("fill", "white")
		.transition()
		.duration(300)
		.attr("cx", d => xScale(new Date(d.year)))
		.attr("cy", d => yScale(d.students));

	// Drawing animated area
	lineArea.attr("fill", color)
			.transition()
			.duration(300)
			.attr("d", area(chartData));
			
}

d3.json("./dataset/source_destination_pair.json").then(data => {
	drawLineChart(data, "China", "United States of America", "rgb(242, 142, 44)");

	document.querySelector("#line-chart").addEventListener("sourceDestinationLocked", (e) => {
		const { source, destination, color } = e.detail;

		lineChartTitle.textContent = `Number of students from ${source} to ${destination} between 2017 and 2021`
		drawLineChart(data, source, destination, color);
	});
});

