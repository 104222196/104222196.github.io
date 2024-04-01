// set the dimensions and sankeyDiagramMarginss of the graph
const sankeyDiagramMargins = { top: 10, right: 0, bottom: 10, left: 0 },
    sankeyDiagramWidth = 800 - sankeyDiagramMargins.left - sankeyDiagramMargins.right,
    sankeyDiagramHeight = 450 - sankeyDiagramMargins.top - sankeyDiagramMargins.bottom;

// Color scale used
const color = d3.scaleOrdinal(d3.schemeTableau10);

// Set the sankey diagram properties
const sankey = d3.sankey()
    .nodeId(d => d.name)
    .nodeAlign(d3.sankeyCenter)
    .nodeWidth(36)
    .nodePadding(8)
    .size([sankeyDiagramWidth, sankeyDiagramHeight]);

const sankeyTitle = document.querySelector("#sankey-title");
const lineChart = document.querySelector("#line-chart");

// append the svg object to the body of the page
const svg = d3.select("#sankey")
        .append("svg")
        .attr("width", sankeyDiagramWidth + sankeyDiagramMargins.left + sankeyDiagramMargins.right)
        .attr("height", sankeyDiagramHeight + sankeyDiagramMargins.top + sankeyDiagramMargins.bottom)
        .append("g")
        .attr("transform", "translate(" + sankeyDiagramMargins.left + "," + sankeyDiagramMargins.top + ")");

const linkGroup = svg.append("g")
                    .attr("id", "linkGroup")
                    .attr("fill", "none")
                    .attr("stroke-opacity", .3);

const nodeGroup = svg.append("g")
                    .attr("id", "nodeGroup");

d3.csv("./dataset/final.csv").then(data => {
    drawSankey(data, "China");

    document.getElementById("sankey").addEventListener("seriesLocked", (e) => {
        sankeyTitle.textContent = `Preferred destination of students from ${e.detail} from 2017 to 2021`;
        const { topDestinationName, topDestinationColor } = drawSankey(data, e.detail);

        const customData = {
            source: e.detail,
            destination: topDestinationName,
            color: topDestinationColor
        };

        lineChart.dispatchEvent(new CustomEvent("sourceDestinationLocked", {
            detail: customData
        }));
    });
});

function drawSankey(data, sourceCountry) {
    const countryData = data.filter(e => e.source === sourceCountry).sort((a, b) => b.students - a.students);

    const obj = { }
    obj[sourceCountry] = countryData.map(e => e.destination);

    const links = countryData.map(d => ({ source: d.source, target: d.destination, value: d.students }));
    const nodes = Array.from(new Set(countryData.flatMap(d => [d.source, d.destination])), name => ({ name: name }));

    // console.log(graph)
    // // Constructs a new Sankey generator with the default settings.
    sankey({
        nodes: nodes,
        links: links
    });

    // Find source node
    const sourceNode = nodes.filter(node => node.targetLinks.length === 0)[0];
    const sourceNodeHeight = sourceNode.y1 - sourceNode.y0
    const oldY0 = sourceNode.y0;
    const newY0 = (sankeyDiagramHeight - sourceNodeHeight) / 2;
    const newY1 = newY0 + sourceNodeHeight;

    sourceNode.y0 = newY0;
    sourceNode.y1 = newY1;

    console.log(sourceNode);

    const yTranslationAmount = newY0 - oldY0;
    links.forEach(link => link.y0 += yTranslationAmount);


    // add in the links
    const linkItems = linkGroup.selectAll("g").data(links);

    linkItems.enter()
            .append("g")
            .style("mix-blend-mode", "multiply")
            .each(function (d) {
                addGradient(d3.select(this), d);
            })
            .merge(linkItems)
            .each(function (d) {
                const linkItemGroup = d3.select(this);
                linkItemGroup.selectAll("path")
                            .data([d])
                            .join("path")
                            .attr("d", d3.sankeyLinkHorizontal())
                            .attr("stroke-width", d => Math.max(1, d.width))
                            .attr("stroke", d => `url(#gradient-${d.index})`)
                            .on("mouseover", function (e, d) {
                                d3.select(this)
                                    .attr("stroke", d => `url(#gradient-${d.index}-darker)`);
                            })
                            .on("mouseout", function (e, d) {
                                d3.select(this)
                                    .attr("stroke", d => `url(#gradient-${d.index})`);
                            })
                            .on("click", function (e, d) {
                                const customData = {
                                    source: d.source.name,
                                    destination: d.target.name,
                                    color: color(d.target.index)
                                };

                                lineChart.dispatchEvent(new CustomEvent("sourceDestinationLocked", {
                                    detail: customData
                                }));
                            });
            });
            

    function addGradient(selection, datum) {
        const gradient = selection.append("linearGradient")
            .attr("id", `gradient-${datum.index}`)
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", datum.source.x1)
            .attr("x2", datum.target.x0);
        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", color(datum.source.index));
        gradient.append("stop")
            .attr("offset", "60%")
            .attr("stop-color", color(datum.source.index));
        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", color(datum.target.index));

        const gradientDarker = selection.append("linearGradient")
            .attr("id", `gradient-${datum.index}-darker`)
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", datum.source.x1)
            .attr("x2", datum.target.x0);
        gradientDarker.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", d3.rgb(color(datum.source.index)).darker(2));
        gradientDarker.append("stop")
            .attr("offset", "60%")
            .attr("stop-color", d3.rgb(color(datum.source.index)).darker(2));
        gradientDarker.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", d3.rgb(color(datum.target.index)).darker(2));
    }

    const nodeItems = nodeGroup.selectAll("g").data(nodes);

    nodeItems.enter()
            .append("g")
            .merge(nodeItems)
            .attr("transform", d => "translate(" + d.x0 + "," + d.y0 + ")")
            .each(function (d) {
                const nodeItemGroup = d3.select(this);
                nodeItemGroup.selectAll("rect")
                            .data([d])
                            .join("rect")
                            .attr("width", sankey.nodeWidth())
                            .attr("height", d => d.y1 - d.y0)
                            .style("fill", d => color(d.index))
                            .on("click", function (e, d) {
                                if (d.targetLinks.length === 0) return;

                                const customData = {
                                    source: d.targetLinks[0].source.name,
                                    destination: d.name,
                                    color: color(d.index)
                                };

                                lineChart.dispatchEvent(new CustomEvent("sourceDestinationLocked", {
                                    detail: customData
                                }));
                            });

                nodeItemGroup.select("rect")
                            .selectAll("title")
                            .data([d])
                            .join("title")
                            .text(function (d) { return d.name + "\n" + "There were " + d.value + " students in " + d.name; });

                nodeItemGroup.selectAll("text")
                            .data([d])
                            .join("text")
                            .attr("x", d => d.x0 < sankeyDiagramWidth / 2 ? sankey.nodeWidth() + 6 : -6)
                            .attr("y", d => (d.y1 - d.y0) / 2)
                            .attr("fill", "#0F2C59")
                            .attr("font-family", "Inter")
                            .attr("font-weight", "bold")
                            .attr("text-anchor", d => d.x0 < sankeyDiagramWidth / 2 ? "start" : "end")
                            .attr("dominant-baseline", "middle")
                            .attr("pointer-events", "none")
                            .text(function (d) { return d.name; });
            });
            
    return {
        topDestinationName: countryData[0].destination,
        topDestinationColor: color(1)
    }
}