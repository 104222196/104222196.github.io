const width = 400;
const height = 400;
const gap = 12;
const squareDimension = (width - gap * 9) / 10;

const svg = d3.select("#section-2")
                .append("svg")
                .attr("width", width)
                .attr("height", height);

const squares = Array(100);

svg.selectAll("rect")
    .data(squares)
    .enter()
    .append("rect")
    .attr("x", (d, i) => (squareDimension + gap) * (i % 10))
    .attr("y", (d, i) => (squareDimension + gap) * Math.floor(i / 10))
    .attr("width", squareDimension)
    .attr("height", squareDimension)
    .attr("fill", (d, i) => {
        if (i >= 90 && i <= 92) {
            return "#0F2C59";
        } else {
            return "#DAC0A3";
        }
    });

const fractionTrianglePoints = 
    `${(squareDimension + gap) * 3}, ${(squareDimension + gap) * 9} ` +
    `${(squareDimension + gap) * 3}, ${(squareDimension + gap) * 9 + squareDimension} ` +
    `${(squareDimension + gap) * 3 + squareDimension}, ${(squareDimension + gap) * 9 + squareDimension}`;

svg.append("polygon")
    .attr("points", fractionTrianglePoints)
    .attr("fill", "#0F2C59");