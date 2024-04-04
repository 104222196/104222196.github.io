const originBumpChart = document.getElementById("origin-bump");
const originSankeyDiagram = document.getElementById("origin-sankey");
const originSankeyTitle = document.getElementById("origin-sankey-title");
const originLineChart = document.getElementById("origin-line");
const originLineTitle = document.getElementById("origin-line-title");

const destinationBumpChart = document.getElementById("destination-bump");
const destinationSankeyDiagram = document.getElementById("destination-sankey");
const destinationSankeyTitle = document.getElementById("destination-sankey-title");
const destinationLineChart = document.getElementById("destination-line");
const destinationLineTitle = document.getElementById("destination-line-title");

d3.csv("./dataset/top_15_origins.csv").then(data => {
	data.forEach(d => {
		d.year = +d.year;
		d.student = +d.student;
	});

	const options = {
		categoryColumn: "country",
		timeColumn: "year",
		comparisonColumn: "students"
	}

	let isChartLocked = false;

	function getLockedState() { 
		return isChartLocked;
	}

	function setLockedState(state) {
		isChartLocked = state;
	}

	function changeOriginSankey(seriesData) {
		originSankeyDiagram.dispatchEvent(new CustomEvent("seriesLocked", { detail: seriesData.category }));
	}
 
	drawBumpChart(originBumpChart, data, options, 15, getLockedState, setLockedState, changeOriginSankey);
});

d3.csv("./dataset/top_15_destinations.csv").then(data => {
	data.forEach(d => {
		d.year = +d.year;
		d.student = +d.student;
	});

	const options = {
		categoryColumn: "country",
		timeColumn: "year",
		comparisonColumn: "students"
	}

	let isChartLocked = false;

	function getLockedState() { 
		return isChartLocked;
	}

	function setLockedState(state) {
		isChartLocked = state;
	}

	function changeDestinationSankey(seriesData) {
		destinationSankeyDiagram.dispatchEvent(new CustomEvent("seriesLocked", { detail: seriesData.category }));
	}

	drawBumpChart(destinationBumpChart, data, options, 15, getLockedState, setLockedState, changeDestinationSankey);
});

d3.csv("./dataset/top_10_destinations_per_origin.csv").then(data => {
	let { nodes, links } = getNodesAndLinks(data, "China");
    drawSankey(originSankeyDiagram, nodes, links, updateLineChart, "origin");

    originSankeyDiagram.addEventListener("seriesLocked", (e) => {
        originSankeyTitle.textContent = `Preferred destination of students from ${e.detail} (2017-2021)`;

		({ nodes, links } = getNodesAndLinks(data, e.detail));
        drawSankey(originSankeyDiagram, nodes, links, updateLineChart, "origin");

        const detail = {
            source: e.detail,
            destination: getTopDestination(data, e.detail),
            color: d3.schemeTableau10[1]
        };

        originLineChart.dispatchEvent(new CustomEvent("sourceDestinationLocked", { detail }));
    });

	function getNodesAndLinks(data, sourceCountry) {
		const countryData = data.filter(e => e.source === sourceCountry).sort((a, b) => b.students - a.students);
		const links = countryData.map(d => ({ 
			source: d.source, 
			target: d.destination, 
			value: d.students 
		}));
		const nodes = Array.from(new Set(countryData.flatMap(d => [d.source, d.destination])), name => ({ name: name }));

		return {nodes, links};
	}

	function getTopDestination(data, sourceCountry) {
		return data.filter(e => e.source === sourceCountry).sort((a, b) => b.students - a.students)[0]["destination"];
	}

	function updateLineChart(d) {
		const detail = {
			source: d.source.name,
			destination: d.target.name,
			color: color(d.target.index)
		};

		originLineChart.dispatchEvent(new CustomEvent("sourceDestinationLocked", { detail }));
	}
});

d3.csv("./dataset/top_10_origins_per_destination.csv").then(data => {
	let { nodes, links } = getNodesAndLinks(data, "United States of America");
    drawSankey(destinationSankeyDiagram, nodes, links, updateLineChart, "destination");

    destinationSankeyDiagram.addEventListener("seriesLocked", (e) => {
        destinationSankeyTitle.textContent = `Origins of students to ${e.detail} (2017-2021)`;

		({ nodes, links } = getNodesAndLinks(data, e.detail));
        drawSankey(destinationSankeyDiagram, nodes, links, updateLineChart, "destination");

        const detail = {
			destination: e.detail,
            origin: getTopOrigin(data, e.detail),
            color: d3.schemeTableau10[0]
        };

        destinationLineChart.dispatchEvent(new CustomEvent("sourceDestinationLocked", { detail }));
    });

	function getNodesAndLinks(data, destinationCountry) {
		const countryData = data.filter(e => e.destination === destinationCountry).sort((a, b) => b.students - a.students);
		const links = countryData.map(d => ({ 
			source: d.origin, 
			target: d.destination, 
			value: d.students 
		}));
		const nodes = Array.from(new Set(countryData.flatMap(d => [d.origin, d.destination])), name => ({ name: name }));

		return {nodes, links};
	}

	function getTopOrigin(data, destinationCountry) {
		return data.filter(e => e.destination === destinationCountry).sort((a, b) => b.students - a.students)[0]["origin"];
	}

	function updateLineChart(d) {
		const detail = {
			origin: d.source.name,
			destination: d.target.name,
			color: color(d.source.index)
		};

		destinationLineChart.dispatchEvent(new CustomEvent("sourceDestinationLocked", { detail }));
	}
});

d3.json("./dataset/origin_line_data.json").then(data => {
	let lineChartData = getLineChartData(data, "China", "United States of America");
	drawLineChart(originLineChart, lineChartData);

	originLineChart.addEventListener("sourceDestinationLocked", (e) => {
		const { source, destination, color } = e.detail;

		originLineTitle.textContent = `Students from ${source} to ${destination} between 2017 and 2021`;
		
		lineChartData = getLineChartData(data, source, destination);
		drawLineChart(originLineChart, lineChartData, color);
	});

	function getLineChartData(data, source, destination) {
		const pair = data[source][destination];

		const chartData = Object.keys(pair).map(year => ({
			time: new Date(year, 0),
			value: pair[year]
		})).filter(e => e.value !== null);

		return chartData;
	}
});

d3.json("./dataset/destination_line_data.json").then(data => {
	let lineChartData = getLineChartData(data, "United States of America", "China");
	drawLineChart(destinationLineChart, lineChartData, "rgb(78, 121, 167)");

	destinationLineChart.addEventListener("sourceDestinationLocked", (e) => {
		const { origin, destination, color } = e.detail;

		destinationLineTitle.textContent = `Students from ${origin} to ${destination} between 2017 and 2021`;
		
		lineChartData = getLineChartData(data, destination, origin);
		drawLineChart(destinationLineChart, lineChartData, color);
	});

	function getLineChartData(data, destination, origin) {
		const pair = data[destination][origin];

		const chartData = Object.keys(pair).map(year => ({
			time: new Date(year, 0),
			value: pair[year]
		})).filter(e => e.value !== null);

		return chartData;
	}
});