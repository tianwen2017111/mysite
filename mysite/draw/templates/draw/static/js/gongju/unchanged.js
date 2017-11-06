G = G;
G_parent = G_parent;
G_sub_nodes = G_sub_nodes;
console.log("-------------G-----------")
console.log(G)
console.log("-------------G_parent-----------")
console.log(G_parent)
console.log("-------------G_sub_nodes-----------")
console.log(G_sub_nodes)


function std_graph(Graph){
    var nodes = [];
    var links = [];
    var labelAnchors = [];
    var labelAnchorLinks = [];

    for(var i=0; i<Graph.nodes.length; i++){
        var node = {"id": Graph.nodes[i].id,
                    "label": Graph.nodes[i].label,
                    "group": 1,
                    "size": 4
                    };
        nodes.push(node);
        labelAnchors.push({ node : node });
        labelAnchors.push({ node : node });
        labelAnchorLinks.push({
            source : i * 2,
            target : i * 2 + 1,
            weight : 1
        });
    };//end nodes_for
    for(var i = 0; i < Graph.links.length; i++) {
        links.push({
            source: Graph.links[i]["source"],
            target: Graph.links[i]["target"],
            weight: 1
        });
    };//end links_for

    var graph = {"nodes": nodes, "links":links,
                 "labelAnchors":labelAnchors, "labelAnchorLinks":labelAnchorLinks};
    return graph;
};

function plot_G(){
    graph = std_graph(G);
    for(var i=0; i<G_parent.nodes.length; i++){
        sub_nodes = G_sub_nodes[i];
        for(var j=0; j<sub_nodes.length; j++){
            n = sub_nodes[j];
            graph.nodes[n]["group"] = i;
        }
    }
    selectableForceDirectedGraph(graph);
}

function plot_G_parent(){
    graph = std_graph(G_parent);
    for(var i=0; i<G_parent.nodes.length; i++){
        graph.nodes[i]["size"] = G_sub_nodes[i].length;
    }
    for(var i=0; i<G_parent.links.length; i++){
        graph.links[i]["weight"] = G_parent.links[i]["weight"]
    }
    selectableForceDirectedGraph(graph);
}

function selectableForceDirectedGraph(Graph) {
    graph = Graph;
//    nodeGraph = graph;
//
//    var svg = d3.select("#d3_selectable_force_directed_graph")
//        .attr("tabindex", 1)
//        .on("keydown.brush", keydown)
//        .on("keyup.brush", keyup)
//        .each(function() { this.focus(); })
//        .append("svg")
//        .attr("width", width)
//        .attr("height", height);
//
//    var zoomer = d3.behavior.zoom().
//        scaleExtent([0.1,10]).
//        x(xScale).
//        y(yScale).
//        on("zoomstart", zoomstart).
//        on("zoom", redraw);
//
//    var brusher = d3.svg.brush()
//        .x(xScale)
//        .y(yScale)
//        .on("brushstart", brushstart)
//        .on("brush", brush)
//        .on("brushend", brushend);//end brusher
//
//    var svg_graph = svg.append('svg:g')
//        .call(zoomer)
////        .call(brusher)
//
//    var rect = svg_graph.append('svg:rect')
//        .attr('width', width)
//        .attr('height', height)
//        .attr('fill', 'transparent')
////        .attr('opacity', 0.5)
//        .attr('stroke', 'transparent')
//        .attr('stroke-width', 1)
////        .attr("pointer-events", "all")
//        .attr("id", "zrect")
//
//    var brush = svg_graph.append("g")
//        .datum(function() { return {selected: false, previouslySelected: false}; })
//        .attr("class", "brush");
//
//    var vis = svg_graph.append("svg:g");
//
//    vis.attr('fill', 'red')
//        .attr('stroke', 'black')
//        .attr('stroke-width', 1)
//        .attr('opacity', 0.5)
//        .attr('id', 'vis');
//
//    brush.call(brusher)
//        .on("mousedown.brush", null)
//        .on("touchstart.brush", null)
//        .on("touchmove.brush", null)
//        .on("touchend.brush", null);
//
//    brush.select('.background').style('cursor', 'auto');
//
//    center_view = function() {
//        // Center the view on the molecule(s) and scale it so that everything
//        // fits in the window
//
//        if (nodeGraph === null)
//            return;
//
//        var nodes = nodeGraph.nodes;
//
//        //no molecules, nothing to do
//        if (nodes.length === 0)
//            return;
//
//        // Get the bounding box
//        min_x = d3.min(nodes.map(function(d) {return d.x;}));
//        min_y = d3.min(nodes.map(function(d) {return d.y;}));
//
//        max_x = d3.max(nodes.map(function(d) {return d.x;}));
//        max_y = d3.max(nodes.map(function(d) {return d.y;}));
//
//        // The width and the height of the graph
//        mol_width = max_x - min_x;
//        mol_height = max_y - min_y;
//
//        // how much larger the drawing area is than the width and the height
//        width_ratio = width / mol_width;
//        height_ratio = height / mol_height;
//
//        // we need to fit it in both directions, so we scale according to
//        // the direction in which we need to shrink the most
//        min_ratio = Math.min(width_ratio, height_ratio) * 0.8;
//
//        // the new dimensions of the molecule
//        new_mol_width = mol_width * min_ratio;
//        new_mol_height = mol_height * min_ratio;
//
//        // translate so that it's in the center of the window
//        x_trans = -(min_x) * min_ratio + (width - new_mol_width) / 2;
//        y_trans = -(min_y) * min_ratio + (height - new_mol_height) / 2;
//
//        // do the actual moving
//        vis.attr("transform",
//                 "translate(" + [x_trans, y_trans] + ")" + " scale(" + min_ratio + ")");
//                 // tell the zoomer what we did so that next we zoom, it uses the
//                 // transformation we entered here
//                 zoomer.translate([x_trans, y_trans ]);
//                 zoomer.scale(min_ratio);
//    };//end center_view

    var link = vis.append("g").attr("class", "link").selectAll("line");
    var node = vis.append("g").attr("class", "node").selectAll("circle");

    var force = d3.layout.force()
        .size([width, height])
        .charge(-400)
        .linkDistance(40)
        .on("tick",tick);

    var drag = d3.behavior.drag()
              .on("dragstart", dragstarted)
              .on("drag", dragged)
              .on("dragend", dragended);
    var color = d3.scale.category20();

    graph.links.forEach(function(d) {
        d.source = graph.nodes[d.source];
        d.target = graph.nodes[d.target];
    });

    force.nodes(graph.nodes).links(graph.links).start();

    link = link.data(graph.links).enter().append("line")
        .attr("stroke-width",function(d){return d.weight});

    node = node.data(graph.nodes).enter().append("circle")
        .attr("r", function(d){return d.size*2;})
        .attr("fill", function(d){return color(d.group);})
        .on("dblclick", function(d) { d3.select(this).classed("fixed", d.fixed = false);})
        .call(drag);
//        .on("dblclick", function(d) { d3.event.stopPropagation(); })
//        .on("click", function(d) {
//            if (d3.event.defaultPrevented) return;
//
//            if (!shiftKey) {
//                //if the shift key isn't down, unselect everything
//                node.classed("selected", function(p) { return p.selected =  p.previouslySelected = false; })
//            }
//
//            // always select this node
//            d3.select(this).classed("selected", d.selected = !d.previouslySelected);
//        })
//        .on("mouseup", function(d) {
//            //if (d.selected && shiftKey) d3.select(this).classed("selected", d.selected = false);
//        })


    function brushstart(d){
        node.each(function(d) {
            d.previouslySelected = shiftKey && d.selected;
            });
    }

    function brush(d){
        var extent = d3.event.target.extent();
            node.classed("selected", function(d) {
                return d.selected = d.previouslySelected ^
                (extent[0][0] <= d.x && d.x < extent[1][0]
                 && extent[0][1] <= d.y && d.y < extent[1][1]);
            });
    }

    function brushend(){
        d3.event.target.clear();
        d3.select(this).call(d3.event.target);
    }

    function tick() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr('cx', function(d) { return d.x; })
        .attr('cy', function(d) { return d.y; });
    };

    function zoomstart() {
        node.each(function(d) {
            d.selected = false;
            d.previouslySelected = false;
        });
        node.classed("selected", false);
    }

    function redraw() {
        vis.attr("transform",
                 "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
    }

    function dragstarted(d) {
        d3.event.sourceEvent.stopPropagation();
        if (!d.selected && !shiftKey) {
            // if this node isn't selected, then we have to unselect every other node
            node.classed("selected", function(p) { return p.selected =  p.previouslySelected = false; });
        }

        d3.select(this).classed("selected", function(p) { d.previouslySelected = d.selected; return d.selected = true; });

        node.filter(function(d) { return d.selected; })
        .each(function(d) { d.fixed |= 2; })
    }

    function dragged(d) {
        node.filter(function(d) { return d.selected; })
        .each(function(d) {
            d.x += d3.event.dx;
            d.y += d3.event.dy;

            d.px += d3.event.dx;
            d.py += d3.event.dy;
//            console.log(d.x)
        });

        force.resume();
    }

    function dragended(d) {
        node.filter(function(d) { return d.selected; })
        force.stop();
    }

    function keydown() {
        shiftKey = d3.event.shiftKey || d3.event.metaKey;
        ctrlKey = d3.event.ctrlKey;

        console.log('d3.event', d3.event)

        if (d3.event.keyCode == 67) {   //the 'c' key
            center_view();
        }

        if (shiftKey) {
            svg_graph.call(zoomer)
            .on("mousedown.zoom", null)
            .on("touchstart.zoom", null)
            .on("touchmove.zoom", null)
            .on("touchend.zoom", null);

            //svg_graph.on('zoom', null);
            vis.selectAll('g.gnode')
            .on('mousedown.drag', null);

            brush.select('.background').style('cursor', 'crosshair')
            brush.call(brusher);
        }
    }

    function keyup() {
        shiftKey = d3.event.shiftKey || d3.event.metaKey;
        ctrlKey = d3.event.ctrlKey;

        brush.call(brusher)
        .on("mousedown.brush", null)
        .on("touchstart.brush", null)
        .on("touchmove.brush", null)
        .on("touchend.brush", null);

        brush.select('.background').style('cursor', 'auto')
        svg_graph.call(zoomer);
    }

}


