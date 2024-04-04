const lineChartMargins = { top: 20, right: 20, bottom: 20, left: 80 };
const lineChartWidth = 800 - lineChartMargins.left - lineChartMargins.right;
const lineChartHeight = 250 - lineChartMargins.top - lineChartMargins.bottom;

function drawLineChart(root, data, color = "rgb(242, 142, 44)") {
	const rootElement = d3.select(root);

	const svg = rootElement.select("svg").node()
		? rootElement.select("svg").select("g")
		: rootElement.append("svg")
			.attr("width", lineChartWidth + lineChartMargins.left + lineChartMargins.right)
			.attr("height", lineChartHeight + lineChartMargins.top + lineChartMargins.bottom)
			.append("g")
			.attr("transform", `translate(${lineChartMargins.left}, ${lineChartMargins.top})`);

	const xGroup = svg.select("#xAxis").node()
		? svg.select("#xAxis")
		: svg.append("g")
			.attr("id", "xAxis")
			.attr("font-weight", "bold")
			.attr("font-size", "1rem")
			.attr("transform", "translate(0," + lineChartHeight + ")");

	const yGroup = svg.select("#yAxis").node()
		? svg.select("#yAxis")
		: svg.append("g")
			.attr("id", "yAxis")
			.attr("font-weight", "bold")
			.attr("font-size", "1rem");

	const linePath = svg.select("#linePath").node()
		? svg.select("#linePath")
		: svg.append("path")
			.attr("id", "linePath")
			.attr("stroke-width", "2")
			.style("fill", "none");

	const areaPath = svg.select("#areaPath").node()
		? svg.select("#areaPath")
		: svg.append("path")
			.attr("id", "areaPath")
			.attr("opacity", .5);

	const hoverArea = svg.select("#hoverArea").node()
		? svg.select("#hoverArea")
		: svg.append("rect")
			.attr("id", "hoverArea")
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", lineChartWidth)
			.attr("height", lineChartHeight)
			.attr("fill", "transparent");

	const time = data.map(d => d.time);
	const value = data.map(d => d.value);

	// Setting X,Y scale ranges
	const xScale = d3
		.scaleTime()
		.domain(d3.extent(time))
		.range([0, lineChartWidth]);

	const xScaleReverse = d3
		.scaleTime()
		.domain(xScale.range())
		.range(xScale.domain());

	const yScale = d3
		.scaleLinear()
		.domain([0, d3.max(value)])
		.range([lineChartHeight, 0]);

	// Adding the x Axis
	xGroup.transition()
		.duration(300)
		.call(d3.axisBottom(xScale).ticks(d3.timeYear.every(1)));

	xGroup.selectAll("text")
		.attr("font-weight", "bold")
		.attr("font-size", ".8rem");

	// Adding the y Axis
	yGroup.transition()
		.duration(300)
		.call(d3.axisLeft(yScale));

	yGroup.selectAll("text")
		.attr("font-weight", "bold")
		.attr("font-size", ".8rem");

	// Drawing line with inner gradient and area
	const line = d3.line()
		.x(d => xScale(d.time))
		.y(d => yScale(d.value));

	const area = d3
		.area()
		.x(d => xScale(d.time))
		.y0(lineChartHeight)
		.y1(d => yScale(d.value));

	// Defining the line path and adding some styles
	linePath.attr("stroke", color)
		.transition()
		.duration(300)
		.attr("d", line(data));

	// Drawing area
	areaPath.attr("fill", color)
		.transition()
		.duration(300)
		.attr("d", area(data));

	svg.selectAll("circle")
		.data(data)
		.join("circle")
		.attr("r", 4)
		.attr("stroke", color)
		.attr("fill", "white")
		.transition()
		.duration(300)
		.attr("cx", d => xScale(d.time))
		.attr("cy", d => yScale(d.value));

	console.log(data)
	console.log()

	hoverArea
		.on("mousemove", function (e, d) {
			const [x, _] = d3.pointer(e);

			const date = xScaleReverse(x);
			let roundedYear = date.getFullYear() + (date.getMonth() >= 7 ? 1 : 0);

			const matchingYear = data.filter(d => d.time.getFullYear() === roundedYear);
			if (matchingYear.length === 0) {
				return;
			}

			const value = matchingYear[0].value;

			const tipX = xScale(new Date(roundedYear, 0));
			const tipY = yScale(value);

			if (!svg.select("#verticalLine").node()) {
				svg.append("line")
					.attr("id", "verticalLine")
					.attr("stroke", "#0F2C59")
					.attr("stroke-width", 2)
					.attr("stroke-dasharray", 4);
			}

			if (!svg.select("#tooltipBackground").node()) {
				svg.append("rect")
					.attr("id", "tooltipBackground")
					.attr("fill", "#0F2C59")
					.attr("pointer-events", "none");
			}

			if (!svg.select("#tooltip").node()) {
				svg.append("text")
					.attr("id", "tooltip")
					.attr("fill", "#F8F0E5")
					.attr("font-family", "Inter")
					.attr("alignment-baseline", "hanging")
					.attr("pointer-events", "none");
			}

			svg.select("#verticalLine")
				.attr("x1", tipX)
				.attr("y1", tipY)
				.attr("x2", tipX)
				.attr("y2", lineChartHeight);

			// Updates the text in the tooltip box.
			svg.select("#tooltip")
				.text(`${value} students in ${roundedYear}.`);

			// Calculates the dimensions of the tooltip text to correctly size the yellow background.
			const {
				width: textWidth,
				height: textHeight
			} = document.querySelector("#tooltip").getBBox();

			const tooltipBoxX = Math.min(tipX + 12, lineChartWidth - lineChartMargins.right - textWidth - 24);
			const tooltipBoxY = Math.min(tipY + 12, lineChartHeight - lineChartMargins.bottom - textHeight - 12);

			// Positions the tooltip text.
			svg.select("#tooltip")
				.attr("x", tooltipBoxX + 12)
				.attr("y", tooltipBoxY + 12);

			// Positions the yellow background of the tooltip.
			svg.select("#tooltipBackground")
				.attr("x", tooltipBoxX)
				.attr("y", tooltipBoxY)
				.attr("width", textWidth + 24)
				.attr("height", textHeight + 24);
		})
		.on("mouseout", () => {
			svg.select("#verticalLine").remove();

			svg.select("#tooltip").remove();
			svg.select("#tooltipBackground").remove();
		});
}