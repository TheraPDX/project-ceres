function addAxesAndLegend (svg, xAxis, yAxis, margin, chartWidth, chartHeight) {
  var legendWidth  = 200,
      legendHeight = 100;

  // clipping to make sure nothing appears behind legend
  svg.append('clipPath')
    .attr('id', 'axes-clip')
    .append('polygon')
      .attr('points', (-margin.left)                 + ',' + (-margin.top)                 + ' ' +
                      (chartWidth - legendWidth - 1) + ',' + (-margin.top)                 + ' ' +
                      (chartWidth - legendWidth - 1) + ',' + legendHeight                  + ' ' +
                      (chartWidth + margin.right)    + ',' + legendHeight                  + ' ' +
                      (chartWidth + margin.right)    + ',' + (chartHeight + margin.bottom) + ' ' +
                      (-margin.left)                 + ',' + (chartHeight + margin.bottom));

  var axes = svg.append('g')
    .attr('clip-path', 'url(#axes-clip)');

  axes.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + chartHeight + ')')
    .call(xAxis);

  axes.append('g')
    .attr('class', 'y axis')
    .call(yAxis)
    .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '.71em')
      .style('text-anchor', 'end')
      .text('Temperature (°C)');
	  
  var legend = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', 'translate(' + (chartWidth - legendWidth) + ', 0)');

  legend.append('rect')
    .attr('class', 'legend-bg')
    .attr('width',  legendWidth)
    .attr('height', legendHeight);

  legend.append('path')
    .attr('class', 'temp-line')
    .attr('d', 'M10,20L60,20');

  legend.append('text')
    .attr('x', 70)
    .attr('y', 25)
    .text('Temperature (°C)');

  legend.append('path')
    .attr('class', 'mois-line')
    .attr('d', 'M10,50L60,50');

  legend.append('text')
    .attr('x', 70)
    .attr('y', 55)
    .text('Moisture (%)');

  legend.append('path')
    .attr('class', 'light-line')
    .attr('d', 'M10,80L60,80');

  legend.append('text')
    .attr('x', 70)
    .attr('y', 85)
    .text('Light (lumens)');
}

function drawPaths (svg, data, x, y) {
  
  //var upperOuterArea = d3.svg.area()
  //.interpolate('basis')
  //.x (function (d) { return x(d.date) || 1; })
  //.y0(function (d) { return y(d.pct95); })
  //.y1(function (d) { return y(d.pct75); });

  var light_line = d3.svg.line()
    .interpolate('linear')
    .x(function (d) { return x(d.date); })
    .y(function (d) { return y(d.light); });

  var temp_line = d3.svg.line()
    .interpolate('linear')
    .x(function (d) { return x(d.date); })
    .y(function (d) { return y(d.temp); });

  var mois_line = d3.svg.line()
    .interpolate('linear')
    .x(function (d) { return x(d.date); })
    .y(function (d) { return y(d.mois); });

  svg.datum(data);

  svg.append('path')
    .attr('class', 'mois-line')
    .attr('d', mois_line)
    .attr('clip-path', 'url(#rect-clip)');
	
  svg.append('path')
    .attr('class', 'light-line')
    .attr('d', light_line)
    .attr('clip-path', 'url(#rect-clip)');
	
  svg.append('path')
    .attr('class', 'temp-line')
    .attr('d', temp_line)
    .attr('clip-path', 'url(#rect-clip)');
}

function addMarker (marker, svg, chartHeight, x) {
  var radius = 32,
      xPos = x(marker.date) - radius - 3,
      yPosStart = chartHeight - radius - 3,
      yPosEnd = (marker.type === 'PumpManual' ? 160 : 80) + radius - 3;

  var markerG = svg.append('g')
    .attr('class', 'marker '+marker.type.toLowerCase())
    .attr('transform', 'translate(' + xPos + ', ' + yPosStart + ')')
    .attr('opacity', 0);

  markerG.transition()
    .duration(1000)
    .attr('transform', 'translate(' + xPos + ', ' + yPosEnd + ')')
    .attr('opacity', 1);

  markerG.append('path')
    .attr('d', 'M' + radius + ',' + (chartHeight-yPosStart) + 'L' + radius + ',' + (chartHeight-yPosStart))
    .transition()
      .duration(1000)
      .attr('d', 'M' + radius + ',' + (chartHeight-yPosEnd) + 'L' + radius + ',' + (radius*2));

  markerG.append('circle')
    .attr('class', 'marker-bg')
    .attr('cx', radius)
    .attr('cy', radius)
    .attr('r', radius);

  markerG.append('text')
    .attr('x', radius)
    .attr('y', radius*0.9)
    .text((marker.type === 'PumpManual' ? "Manual" : "Auto"));

  markerG.append('text')
    .attr('x', radius)
    .attr('y', radius*1.5)
    .text(marker.quantity/100 + "mL");
}

function startTransitions (svg, chartWidth, chartHeight, rectClip, markers, x) {
  rectClip.transition()
    .duration(1000*markers.length)
    .attr('width', chartWidth);

  markers.forEach(function (marker, i) {
    setTimeout(function () {
      addMarker(marker, svg, chartHeight, x);
    }, 1000 + 500*i);
  });
}

function makeChart (data, markers) {
  var svgWidth  = 1000,
      svgHeight = 500,
      margin = { top: 20, right: 20, bottom: 40, left: 40 },
      chartWidth  = svgWidth  - margin.left - margin.right,
      chartHeight = svgHeight - margin.top  - margin.bottom;

  var x = d3.time.scale().range([0, chartWidth])
            .domain(d3.extent(data, function (d) { return d.date; })),
      y = d3.scale.linear().range([chartHeight, 0])
            .domain([0, d3.max(data, function (d) { return d.light; })]);

  var xAxis = d3.svg.axis().scale(x).orient('bottom')
                .innerTickSize(-chartHeight).outerTickSize(0).tickPadding(10),
      yAxis = d3.svg.axis().scale(y).orient('left')
                .innerTickSize(-chartWidth).outerTickSize(0).tickPadding(10);

  var svg = d3.select('#lineChart').append('svg')
    .attr('width',  svgWidth)
    .attr('height', svgHeight)
    .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  var bisectDate = d3.bisector(function(d) { return d.date; }).left;
  
  // clipping to start chart hidden and slide it in later
  var rectClip = svg.append('clipPath')
    .attr('id', 'rect-clip')
    .append('rect')
      .attr('width', 0)
      .attr('height', chartHeight);

  addAxesAndLegend(svg, xAxis, yAxis, margin, chartWidth, chartHeight);
  drawPaths(svg, data, x, y);
  
  var focusTemp = svg.append("g")
      .attr("class", "focusTemp")
      .style("display", "none");
  var focusMois = svg.append("g")
      .attr("class", "focusMois")
      .style("display", "none");
  var focusLight = svg.append("g")
      .attr("class", "focusLight")
      .style("display", "none");

  focusTemp.append("circle")
      .attr("r", 4.5);
  focusMois.append("circle")
      .attr("r", 4.5);
  focusLight.append("circle")
      .attr("r", 4.5);
	  
  focusTemp.append("text")
      .attr("x", 9)
      .attr("dy", "-.65em");
  focusMois.append("text")
      .attr("x", 9)
      .attr("dy", "-.65em");
  focusLight.append("text")
      .attr("x", 9)
      .attr("dy", "-.65em");
	  
  svg.append("rect")
      .attr("class", "overlay")
      .attr("width", svgWidth)
      .attr("height", svgHeight)
      .on("mouseover", function() { 
		focusTemp.style("display", null);
		focusMois.style("display", null);
		focusLight.style("display", null);
		})
      .on("mouseout", function() {
		focusTemp.style("display", "none");
		focusMois.style("display", "none");
		focusLight.style("display", "none");
		})
      .on("mousemove", mousemove);

  function mousemove() {
  
    console.log(x.invert(d3.mouse(this)[0]))
	
    var x0 = x.invert(d3.mouse(this)[0]),
        i = bisectDate(data, x0, 1),
        d0 = data[i - 1],
        d1 = data[i],
        d = x0 - d0.date > d1.date - x0 ? d1 : d0;
		
    focusTemp.attr("transform", "translate(" + x(d.date) + "," + y(d.temp) + ")");
    focusMois.attr("transform", "translate(" + x(d.date) + "," + y(d.mois) + ")");
    focusLight.attr("transform", "translate(" + x(d.date) + "," + y(d.light) + ")");

    focusTemp.select("text").text(d.temp);
    focusMois.select("text").text(d.mois);
    focusLight.select("text").text(d.light);

  }
  
  startTransitions(svg, chartWidth, chartHeight, rectClip, markers, x);
}
