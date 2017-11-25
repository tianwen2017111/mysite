var margin = {top: 20, right: 20, bottom: 30, left: 40};

$(document).ready(function(){
    sortable_bar_chart("#bar", "../data.csv");
    pie_chart("#pie", "../data.csv");
    table_chart("#table", "../data.csv", degree_detail);
    $("tr:odd").addClass("tr_odd");
});

function sortable_bar_chart(svg_id, data){
    width = 740 - margin.left - margin.right,
    height = 440 - margin.top - margin.bottom;
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

    d3.csv(data, function(error, data) {
            data.forEach(function(d) {d.degree = +d.degree;});
        console.log("-------------data-------------");
        console.log(data);
        sum = 0;
        data.forEach(function(d){sum += Number(d.count);});
        data.forEach(function(d){d['frequency'] = d.count/sum;});

        x.domain(data.map(function(d) { return d.degree; }));
        y.domain([0, d3.max(data, function(d) { return d.frequency; })+0.09]);

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
           .text("百分比");

        svg.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d) { return x(d.degree); })
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
                        : function(a, b) { return d3.ascending(a.degree, b.degree); })
                        .map(function(d) { return d.degree; }))
                     .copy();

            svg.selectAll(".bar")
                .sort(function(a, b) { return x0(a.degree) - x0(b.degree); });

            var transition = svg.transition().duration(750),
                delay = function(d, i) { return i * 50; };

            transition.selectAll(".bar")
                      .delay(delay)
                      .attr("x", function(d) { return x0(d.degree); });

            transition.select(".x.axis")
                      .call(xAxis)
                      .selectAll("g")
                      .delay(delay);
        }
    });
}

function pie_chart(svg_id, data){
    width = 440 - margin.left - margin.right,
    height = 440 - margin.top - margin.bottom;
    var m = 20,
        r = Math.min(width,height)/2.3,
        color = d3.scale.category20c();

    // Define a pie layout: the pie angle encodes the count of flights. Since our
    // data is stored in CSV, the counts are strings which we coerce to numbers.
    var pie = d3.layout.pie()
                .value(function(d) { return + d.count; })
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
        console.log("-----------airports----------");
        console.log(airports);
        // Insert an svg element (with margin) for each airport in our dataset. A
        // child g element translates the origin to the pie center.
        var svg = d3.select(svg_id)
                    .data(airports)
                    .style("width", width)
                    .style("height", height)
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .append("g")
                    .attr("transform", "translate(" + (r + m) + "," + (r + m) + ")");

        // Add a label for the airport. The `key` comes from the nest operator.
        svg.append("text")
           .attr("dy", ".35em")
           .attr("text-anchor", "middle")
           .text("degree");

        // Pass the nested per-airport values to the pie layout. The layout computes
        // the angles for each arc. Another g element will hold the arc and its label.
        var g = svg.selectAll("g")
                   .data(function(d) {return pie(d.values); })
                   .enter().append("g");

        // Add a colored arc path, with a mouseover title showing the count.
        g.append("path")
            .attr("d", arc)
            .style("fill", function(d) { return color(d.data.degree); })
            .append("title")
            .text(function(d) {return d.data.degree + ": " + d.data.count; });

        // Add a label to the larger arcs, translated to the arc centroid and rotated.
        g.filter(function(d) { return d.endAngle - d.startAngle > .2; }).append("text")
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")rotate(" + angle(d) + ")"; })
            .text(function(d) { return d.data.degree; });

        // Computes the label angle of an arc, converting from radians to degrees.
        function angle(d) {
            var a = (d.startAngle + d.endAngle) * 90 / Math.PI - 90;
            return a > 90 ? a - 180 : a;
        }
    });
}

function table_chart(svg_id, data, data_detail){
    data = d3.csv(data, function(error, data){
        for(var i=0; i<data.length; i++){
            var tr = $("<tr></tr>");
            tr.appendTo(svg_id);
            var td = $("<td>" + data[i].degree +"</td>" + "<td>"+ data[i].count + "</td>" + "<td>" + data_detail[data[i].degree] + "</td>");
            td.appendTo(tr);
        }
        $("tr:odd").css("background-color", "#eeeeee");
    });
}

















