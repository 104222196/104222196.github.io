function Barchart() {
  // Setting the width and height of the SVG container
  var w = 600;
  var h = 250;
  // Setting the padding between bars
  var barPadding = 2;

  //This file using the data taken from the data.json file to get the total students go to each countries. There are things that haven't done yet:
  //Changing the value of the argData based on the user mouse interaction in the bump chart
  //Restyle the chart, add axis and somehow link it to the next line chart
  d3.json("dataset/data.json").then(function (data) {
    var argData = data["ARG"]["origin"];
    var result = [];
    for (var key in argData) {
      if (!isNaN(argData[key])) {
        result.push([key, argData[key]]);
      }
    }
    result.sort(function(a, b) {
      return b[1] - a[1];
    });
    // Take the first 15 elements
    var top15 = result.slice(0, 15);
    var dataset = top15.map(function (pair) {
      return Number(pair[1]);
    });
    console.log(top15);
    console.log(result);
    console.log(dataset);

    // Creating an SVG element and setting its width and height
    var svg = d3
      .select("#bar-chart")
      .append("svg")
      .attr("width", w)
      .attr("height", h);

    var xScale = d3
      .scaleBand()
      .domain(d3.range(dataset.length))
      .rangeRound([0, w])
      .paddingInner(0.05);
    var yScale = d3
      .scaleLinear()
      .domain([0, d3.max(dataset)])
      .range([0, h]);

    // Creating a rectangle for each data point in the dataset
    svg
      .selectAll("rect")
      .data(dataset)
      .enter()
      .append("rect")
      .attr("x", function (d, i) {
        // Setting the x position for each rectangle
        return xScale(i);
      })
      .attr("y", function (d) {
        // Setting the y position for each rectangle
        return h - yScale(d);
      })
      .attr("width", xScale.bandwidth())
      .attr("height", function (d) {
        // Setting the height of each rectangle
        return yScale(d);
      })
      .attr("fill", function (d) {
        return "rgb(0, " + Math.round(d * 10) + ",0)";
      })
      .attr("fill", "slategrey")
      .on("mouseover", function (event, d) {
        var xPosition =
          parseFloat(d3.select(this).attr("x")) + xScale.bandwidth() / 2;
        var yPosition = parseFloat(d3.select(this).attr("y")) + 15;
        d3.select(this).transition().duration(100).attr("fill", "orange");
        svg
          .append("text")
          .attr("id", "tooltip")
          .attr("x", xPosition)
          .attr("y", yPosition)
          .text(d);
      })
      .on("mouseout", function () {
        d3.select(this).transition().duration(100).attr("fill", "slategrey");
        d3.select("#tooltip").remove();
      });

  });
}
window.onload = Barchart();
