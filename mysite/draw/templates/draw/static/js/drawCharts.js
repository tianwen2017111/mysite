var margin = {top: 0, right: 20, bottom: 30, left: 40},
    width = 640 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;
$(document).ready(function(){
//    sortable_bar_chart("#bar", "../data.tsv");
    pie_chart("#pie", "../data.csv");

});

function sortable_bar_chart(svg_id, data){
    var formatPercent = d3.format(".0%");

    var x = d3.scale.ordinal().rangeRoundBands([0, width], .1, 1);

    var y = d3.scale.linear().range([height, 0]);

    var xAxis = d3.svg.axis().scale(x).orient("bottom");

    var yAxis = d3.svg.axis().scale(y).orient("left").tickFormat(formatPercent);

    var svg = d3.select(svg_id).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.tsv(data, function(error, data) {
            data.forEach(function(d) {
            d.frequency = +d.frequency;
        });

    x.domain(data.map(function(d) { return d.letter; }));
    y.domain([0, d3.max(data, function(d) { return d.frequency; })]);

    svg.append("g")
       .attr("class", "x axis")
       .attr("transform", "translate(0," + height + ")")
       .call(xAxis);

    svg.append("g")
       .attr("class", "y axis")
       .call(yAxis)
       .append("text")
       .attr("transform", "rotate(-90)")
       .attr("y", 6)
       .attr("dy", ".71em")
       .style("text-anchor", "end")
       .text("Frequency");

    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.letter); })
        .attr("width", x.rangeBand())
        .attr("y", function(d) {return y(d.frequency); })
        .attr("height", function(d) { return height - y(d.frequency); });

    d3.select("input").on("change", change);

    var sortTimeout = setTimeout(function() {
        d3.select("input").property("checked", true).each(change);
    }, 2000);

    function change() {
        clearTimeout(sortTimeout);

        // Copy-on-write since tweens are evaluated after a delay.
        var x0 = x.domain(data.sort(this.checked
                    ? function(a, b) { return b.frequency - a.frequency; }
                    : function(a, b) { return d3.ascending(a.letter, b.letter); })
                    .map(function(d) { return d.letter; }))
                 .copy();

        svg.selectAll(".bar")
            .sort(function(a, b) { return x0(a.letter) - x0(b.letter); });

        var transition = svg.transition().duration(750),
            delay = function(d, i) { return i * 50; };

        transition.selectAll(".bar")
                  .delay(delay)
                  .attr("x", function(d) { return x0(d.letter); });

        transition.select(".x.axis")
                  .call(xAxis)
                  .selectAll("g")
                  .delay(delay);
        }
    });
}

function pie_chart(svg_id, data){
    var m = 10,
        r = 100,
        z = d3.scale.category20c();

    // Define a pie layout: the pie angle encodes the count of flights. Since our
    // data is stored in CSV, the counts are strings which we coerce to numbers.
    var pie = d3.layout.pie()
                .value(function(d) { return +d.count; })
                .sort(function(a, b) { return b.count - a.count; });

    // Define an arc generator. Note the radius is specified here, not the layout.
    var arc = d3.svg.arc().innerRadius(r / 2).outerRadius(r);

    // Load the flight data asynchronously.
    d3.csv(data, function(error, flights) {
        if (error) throw error;

        // Nest the flight data by originating airport. Our data has the counts per
        // airport and carrier, but we want to group counts by aiport.
        var airports = d3.nest()
                         .key(function(d) { return d.origin; })
                         .entries(flights);
        console.log(flights);
        console.log(airports);
        // Insert an svg element (with margin) for each airport in our dataset. A
        // child g element translates the origin to the pie center.
        var svg = d3.select(svg_id)
                    .data(airports)
                    .enter().append("div") // http://code.google.com/p/chromium/issues/detail?id=98951
                    .style("display", "inline-block")
                    .style("width", (r + m) * 2 + "px")
                    .style("height", (r + m) * 2 + "px")
                    .append("svg")
                    .attr("width", (r + m) * 2)
                    .attr("height", (r + m) * 2)
                    .append("g")
                    .attr("transform", "translate(" + (r + m) + "," + (r + m) + ")");

        // Add a label for the airport. The `key` comes from the nest operator.
        svg.append("text")
           .attr("dy", ".35em")
           .attr("text-anchor", "middle")
           .text(function(d) { return d.key; });

        // Pass the nested per-airport values to the pie layout. The layout computes
        // the angles for each arc. Another g element will hold the arc and its label.
        var g = svg.selectAll("g")
                   .data(function(d) { return pie(d.values); })
                   .enter().append("g");

        // Add a colored arc path, with a mouseover title showing the count.
        g.append("path")
            .attr("d", arc)
            .style("fill", function(d) { return z(d.data.carrier); })
            .append("title")
            .text(function(d) { return d.data.carrier + ": " + d.data.count; });

        // Add a label to the larger arcs, translated to the arc centroid and rotated.
        g.filter(function(d) { return d.endAngle - d.startAngle > .2; }).append("text")
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")rotate(" + angle(d) + ")"; })
            .text(function(d) { return d.data.carrier; });

        // Computes the label angle of an arc, converting from radians to degrees.
        function angle(d) {
            var a = (d.startAngle + d.endAngle) * 90 / Math.PI - 90;
            return a > 90 ? a - 180 : a;
        }
    });
}