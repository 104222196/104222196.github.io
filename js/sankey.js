const sankeyScreenRatio = window.innerWidth / 1920;
const sankeyAspectRatio = 800 / 450;

// set the dimensions and sankeyDiagramMarginss of the graph
const sankeyDiagramMargins = { top: 10 * sankeyScreenRatio, right: 0 * sankeyScreenRatio, bottom: 10 * sankeyScreenRatio, left: 0 * sankeyScreenRatio };
const sankeyDiagramWidth = 800 * sankeyScreenRatio - sankeyDiagramMargins.left - sankeyDiagramMargins.right;
const sankeyDiagramHeight = sankeyDiagramWidth / sankeyAspectRatio - sankeyDiagramMargins.top - sankeyDiagramMargins.bottom;
const sankeyNodeWidth = 36 * sankeyScreenRatio;
const sankeyNodePadding = 10 * sankeyScreenRatio;

// Color scale used
const color = d3.scaleOrdinal(d3.schemeTableau10);

function drawSankey(root, nodes, links, handleLinkClick, chartId = "sankey") {
    const rootElement = d3.select(root);

    // append the svg object to the body of the page
    const svg = rootElement.select("svg").node()
        ? rootElement.select("svg")
        : rootElement.append("svg")
            .attr("width", sankeyDiagramWidth + sankeyDiagramMargins.left + sankeyDiagramMargins.right)
            .attr("height", sankeyDiagramHeight + sankeyDiagramMargins.top + sankeyDiagramMargins.bottom)
            .append("g")
            .attr("transform", "translate(" + sankeyDiagramMargins.left + "," + sankeyDiagramMargins.top + ")");

    const linkGroup = svg.select("#linkGroup").node()
        ? svg.select("#linkGroup")
        : svg.append("g")
            .attr("id", "linkGroup")
            .attr("fill", "none")
            .attr("stroke-opacity", .3);

    const nodeGroup = svg.select("#nodeGroup").node()
        ? svg.select("#nodeGroup")
        : svg.append("g")
            .attr("id", "nodeGroup");

    // Set the sankey diagram generator properties
    const sankey = d3.sankey()
        .nodeId(d => d.name)
        .nodeAlign(d3.sankeyCenter)
        .nodeWidth(sankeyNodeWidth)
        .nodePadding(sankeyNodePadding)
        .size([sankeyDiagramWidth, sankeyDiagramHeight]);

    sankey({
        nodes: nodes,
        links: links
    });

    // Find single node
    const sourceNodeCount = nodes.reduce(
        (total, node) => total + (node.sourceLinks.length === 10 ? 1 : 0),
        0
    );

    let singleNode;
    if (sourceNodeCount === 1) {
        singleNode = nodes.filter(node => node.sourceLinks.length === 10)[0];
    } else {
        singleNode = nodes.filter(node => node.targetLinks.length === 10)[0];
    }

    const singleNodeHeight = singleNode.y1 - singleNode.y0
    const oldY0 = singleNode.y0;
    const newY0 = (sankeyDiagramHeight - singleNodeHeight) / 2;
    const newY1 = newY0 + singleNodeHeight;

    singleNode.y0 = newY0;
    singleNode.y1 = newY1;

    const yTranslationAmount = newY0 - oldY0;
    if (sourceNodeCount === 1) {
        links.forEach(link => link.y0 += yTranslationAmount);
    } else {
        links.forEach(link => link.y1 += yTranslationAmount);
    }

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
                .attr("stroke", d => `url(#gradient-${chartId}-${d.index})`)
                .on("mouseover", function () {
                    d3.select(this)
                        .attr("stroke", d => `url(#gradient-${chartId}-${d.index}-darker)`);
                })
                .on("mousemove", function (e, d) {
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

                    // The position of the user's mouse.
                    const [x, y] = d3.pointer(e);

                    // Updates the text in the tooltip box.
                    svg.select("#tooltip")
                        .text(`${d.value} students from ${d.source.name} to ${d.target.name}.`);

                    // Calculates the dimensions of the tooltip text to correctly size the yellow background.
                    const {
                        width: textWidth,
                        height: textHeight
                    } = document.querySelector("#tooltip").getBBox();

                    const tooltipBoxX = Math.min(x + 24, sankeyDiagramWidth - sankeyDiagramMargins.right - textWidth - 24);
                    const tooltipBoxY = Math.min(y + 24, sankeyDiagramHeight - sankeyDiagramMargins.bottom - textHeight - 12);

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
                .on("mouseout", function () {
                    d3.select(this)
                        .attr("stroke", d => `url(#gradient-${chartId}-${d.index})`);

                    svg.select("#tooltip").remove();
                    svg.select("#tooltipBackground").remove();
                })
                .on("click", function (e, d) {
                    handleLinkClick(d);
                });
        });


    function addGradient(selection, datum) {
        const gradient = selection.append("linearGradient")
            .attr("id", `gradient-${chartId}-${datum.index}`)
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", datum.source.x1)
            .attr("x2", datum.target.x0);
        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", color(datum.source.index));
        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", color(datum.target.index));

        const gradientDarker = selection.append("linearGradient")
            .attr("id", `gradient-${chartId}-${datum.index}-darker`)
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", datum.source.x1)
            .attr("x2", datum.target.x0);
        gradientDarker.append("stop")
            .attr("offset", "0%")
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
                .style("fill", d => color(d.index));

            nodeItemGroup.select("rect")
                .selectAll("title")
                .data([d])
                .join("title")
                .text(function (d) { return d.name + "\n" + d.value + " students in " + d.name; });

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
}