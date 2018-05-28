function bubbleChart() {
  // Constants for sizing
  var width = 600;
  var height = 600;

  // tooltip for mouseover functionality
  var tooltip = floatingTooltip('tooltip', 240);

  // Locations to move bubbles towards, depending
  // on which view mode is selected.
  var center = { x: width / 2, y: height / 2 };
  var forceStrength = 0.1;

  // These will be set in create_nodes and create_vis
  var svg = null;
  var bubbles = null;
  var nodes = [];

  function charge(d) {
    return -Math.pow(d.radius, 2.1) * forceStrength;
  }

  var simulation = d3.forceSimulation()
    .velocityDecay(0.2)
    .force('x', d3.forceX().strength(forceStrength).x(center.x))
    .force('y', d3.forceY().strength(forceStrength).y(center.y))
    .force('charge', d3.forceManyBody().strength(charge))
    .on('tick', ticked);

  simulation.stop();

  var fillColor = d3.scaleOrdinal()
    .domain(["1", "2", "3", "4", "5"])
    .range(["#4E79A7","#F28E2B","#E15759","#76B7B2","#59A14F"]);

  function createNodes(rawData) {
    var maxAmount = d3.max(rawData, function (d) { return +d.Total*50; });
    var radiusScale = d3.scalePow()
      .exponent(0.5)
      .range([2, 85])
      .domain([0, maxAmount]);

	// declarations
	var positions = [];

	function getRandomInt(min, max) {
	  return Math.floor(Math.random() * (max - min)) + min;
	}

	// generate random positions
	function generatePositionsArray(maxX, maxY, safeRadius, irregularity) {
		// declarations
		var positionsArray = [];
		var r, c;
		var rows;
		var columns;
		// count the amount of rows and columns
		rows = Math.floor(maxY / safeRadius);
		columns = Math.floor(maxX / safeRadius);
		// loop through rows
		for (r = 1; r <= rows; r += 1) {
			// loop through columns
			for (c = 1; c <= columns; c += 1) {
				// populate array with point object
				positionsArray.push({
					x: Math.round(maxX * c / columns) + getRandomInt(irregularity * -1, irregularity),
					y: Math.round(maxY * r / rows) + getRandomInt(irregularity * -1, irregularity)
				});
			}
		}
		// return array
		return positionsArray;
	}
	
	var positions = generatePositionsArray(1700, 1700, 600, 10);
	
	function sortPositions(pos, lat, lng) {
	  function dist(l) {
		return (l.x - lat) * (l.x - lat) +
		  (l.y - lng) * (l.y - lng);
	  }

	  pos.sort(function(l1, l2) {
		return dist(l1) - dist(l2);
	  });
	}
	
	sortPositions(positions);

    var myNodes = rawData.map(function (d,i,positions) {
      return {
        id: d.LcmsUnit,
        radius: radiusScale(+d.Total),
        value: +d.Total,
        name: d.UnitLongDesc,
        group: d.InstrLvl,
        x: positions[i].x,
        y: positions[i].y
      };
    });
	

    return myNodes;
  }

  var chart = function chart(selector, rawData) {
    nodes = createNodes(rawData);

    svg = d3.select(selector)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    bubbles = svg.selectAll('.bubble')
      .data(nodes, function (d) { return d.id; });

    var bubblesE = bubbles.enter().append('circle')
      .classed('bubble', true)
      .attr('r', 0)
      .attr('fill', function (d) { return fillColor(d.group); })
      .attr('stroke', function (d) { return d3.rgb(fillColor(d.group)).darker(); })
      .attr('stroke-width', 1)
      .on('mouseover', showTip)
      .on('mouseout', hideTip)
      .on('click', showSchoolDetail);

    bubbles = bubbles.merge(bubblesE);

    bubbles.transition()
      .duration(2000)
      .attr('r', function (d) { return d.radius; });

	  	console.log(rawData);

	var instruction_level_text = ["Special Education", "High School", "Middle School", "Elementry", "Day Care"]
	var instruction_level = ["1", "2", "3", "4", "5"]

	var legend = d3.select("#legend").append("svg")
	legend.selectAll("rect")
		.data(instruction_level)
		.enter().append("rect")
		.attr('x', 0)
		.attr('y', function(d, i) { return (10 + i*20); })
		.attr('width', 25)
		.attr('height', 12)
		.style("fill", function(d) { return fillColor(d); });


	// legend labels	
		legend.selectAll("text")
			.data(instruction_level_text)
		.enter().append("text")
		.attr('x', 40)
		.attr('y', function(d, i) { return (20 + i*20); })
		//.attr('class', 'legend')
		.text(function(d) { return d; });


	var schoolFilter = d3.select("#school_filter");
	
	var dropDown = schoolFilter.append("select")
			.attr("name", "school-list")
			.attr("style", "width:200px;" )
			.attr("id", "select2");

	var options = dropDown.selectAll("option")
        .data(rawData)
        .enter()
        .append("option");

	options.text(function (d) { return d.UnitLongDesc; })
       .attr("value", function (d) { return d.LcmsUnit; });

    $("#select2")
		.on("select2-selecting", Select2OnSelecting)
		.on("select2-loaded", HighLight);


    simulation.nodes(nodes);

    groupBubbles();
  };

  function ticked() {
    bubbles
      .attr('cx', function (d) { return d.x; })
      .attr('cy', function (d) { return d.y; });
  }

  function groupBubbles() {
    simulation.force('x', d3.forceX().strength(forceStrength).x(center.x));
    simulation.alpha(1).restart();
  }

  function showTip(d) {
    // change outline to indicate hover state.
    d3.select(this).attr('stroke', 'black');
    var content = '<span class="name">Title: </span><span class="value">' +
                  d.name +
                  '</span><br/>' +
                  '<span class="name">Amount: </span><span class="value">$' +
                  addCommas(d.value) +
                  '</span><br/>' +
                  '<span class="name">LcmsUnit: </span><span class="value">' +
                  d.id +
                  '</span>';

    tooltip.showTooltip(content, d3.event);
  }

  function showSchoolDetail(d) {
    // change outline to indicate hover state.
	d3.select("#vis").selectAll("circle").style("opacity", 1);
	//console.log(d);
	d3.select(this)
		.attr('stroke', 'black')
		.attr('stroke-width', 3);
    var schoolDetail = d3.select("#school-detail");
    var content = '<span class="name">Title: </span><span class="value">' +
                  d.name +
                  '</span><br/>' +
                  '<span class="name">Amount: </span><span class="value">$' +
                  addCommas(d.value) +
                  '</span><br/>' +
                  '<span class="name">LcmsUnit: </span><span class="value">' +
                  d.id +
                  '</span>';
	schoolDetail.html(content);
  }

  function Select2OnSelecting(d) {
	circles = d3.select("#vis").selectAll("circle");
	circles.style("opacity", 0.3);
	var theSchool = circles.filter(function(data){ return d.val==data.id;});
	console.log(theSchool.data()[0]);
	theSchool.style("opacity", 1);
    var schoolDetail = d3.select("#school-detail");
    var content = '<span class="name">Title: </span><span class="value">' +
                  theSchool.data()[0].name +
                  '</span><br/>' +
                  '<span class="name">Amount: </span><span class="value">$' +
                  addCommas(theSchool.data()[0].value) +
                  '</span><br/>' +
                  '<span class="name">LcmsUnit: </span><span class="value">' +
                  theSchool.data()[0].id +
                  '</span>';
	schoolDetail.html(content);
  }

  function HighLight(d) {
	circles = d3.select("#vis").selectAll("circle");
	circles.style("opacity", 0.3);
	d.items.results.forEach(function(data, i) {
		circles.filter(function(d){ return d.id==data.id;}).style("opacity", 1);
    });
  }

  function hideTip(d) {
    // reset outline
    d3.select(this)
		.attr('stroke', d3.rgb(fillColor(d.group)).darker())
		.attr('stroke-width', 1);
    tooltip.hideTooltip();
  }

  // return the chart function from closure.
  return chart;
}

var myBubbleChart = bubbleChart();

function display(error, data) {
  if (error) {
    console.log(error);
  }

  myBubbleChart('#vis', data);
}

function addCommas(nStr) {
  nStr += '';
  var x = nStr.split('.');
  var x1 = x[0];
  var x2 = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }

  return x1 + x2;
}

// Load the data.
d3.csv('School Budget Bubble Chart.csv', display);