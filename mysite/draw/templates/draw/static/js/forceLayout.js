var width = 960, height = 640, shiftKey, ctrlKey;
var xScale = d3.scale.linear().domain([0,width]).range([0,width]);
var yScale = d3.scale.linear().domain([0,height]).range([0, height]);
var foci = [];

function swap_foci(foci, svg_center, IMP_C){
//    console.log("__func__ : swap_foci(), " + "important node list: " + IMP_C);
    if(IMP_C){
        for(var i=0; i<IMP_C.length ;i++){
            console.log("i:  " + i);
            var skew = Math.floor((i+1)/2);
            console.log("svg_center:  " + svg_center);
            console.log("skew:  " + skew);
            console.log("IMP_C[i]:  " + IMP_C[i]);
            if(i % 2 == 0){
                foci = swap_arr(foci, svg_center-skew, IMP_C[i]);
            }
            if(i % 2 == 1){
                foci = swap_arr(foci, svg_center+skew, IMP_C[i]);
            }
        }
    }
    return foci;
}

//绘图函数
function selectableForceDirectedGraph(Graph, svg_id) {
    graph = Graph;
    nodeGraph = graph;

    var labelAnchors = graph.labelAnchors,
        labelAnchorLinks = graph.labelAnchorLinks;
    var svg = d3.select("#".concat(svg_id))
        .attr("tabindex", 1)
        .on("keydown.brush", keydown)
        .on("keyup.brush", keyup)
        .each(function() { this.focus(); })
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    var zoomer = d3.behavior.zoom().
        scaleExtent([0.1,10]).
        x(xScale).
        y(yScale).
        on("zoomstart", zoomstart).
        on("zoom", redraw);

    var brusher = d3.svg.brush()
        .x(xScale)
        .y(yScale)
        .on("brushstart", brushstart)
        .on("brush", brush)
        .on("brushend", brushend);//end brusher

    var svg_graph = svg.append('svg:g')
        .call(zoomer)
//        .call(brusher)

    var rect = svg_graph.append('svg:rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'transparent')
        .attr('stroke', 'transparent')
        .attr('stroke-width', 1)
        .attr("id", "zrect")

    var brush = svg_graph.append("g")
        .datum(function() { return {selected: false, previouslySelected: false}; })
        .attr("class", "brush");

    var vis = svg_graph.append("svg:g").attr('id', 'vis');

    brush.call(brusher)
        .on("mousedown.brush", null)
        .on("touchstart.brush", null)
        .on("touchmove.brush", null)
        .on("touchend.brush", null);

//    brush.select('.background').style('cursor', 'auto');

    var link = vis.append("g").attr("class", "link").selectAll("line");
    var node = vis.append("g").attr("class", "node").selectAll("circle");

    var force = d3.layout.force().size([width, height])
            .charge(-120)
            .linkDistance(60);
//            .on("tick",tick);

    var drag = d3.behavior.drag()
              .on("dragstart", dragstarted)
              .on("drag", dragged)
              .on("dragend", dragended);

    graph.links.forEach(function(d) {
        d.source = graph.nodes[d.source];
        d.target = graph.nodes[d.target];
    });
    var link_weight = new Array();
    var node_size = new Array();
    for(var i=0; i<graph.nodes.length; i++){
        node_size[i] = graph.nodes[i].size;
    }
    for(var i=0; i<graph.links.length; i++){
       link_weight[i] = graph.links[i].weight;
    }

    link_scale = d3.scale.linear().domain([d3.min(link_weight),d3.max(link_weight)]).range([1,10]);
    node_scale = d3.scale.linear().domain([d3.min(node_size),d3.max(node_size)]).range([8,30])

    force.nodes(graph.nodes).links(graph.links).start();

    link = link.data(graph.links).enter().append("line")
                .attr("stroke-width",function(d){return link_scale(d.weight);})
                .on("click", show_link_info);

    node = node.data(graph.nodes).enter().append("circle")
        .attr("r", function(d){return node_scale(d.size);})
        .attr("fill", function(d){return color[d.cluster];})
        .call(drag)
        .on("click", show_node_info);

    if(svg_id =="svg_hierarchic"){
        force = force.charge(-120)
                    .linkDistance(function(){return 1200/graph.nodes.length;})
//                    .on("tick",tick)
                    .start();
        node = node.on("dblclick", function(d){
                    $(document).ready(function(){
                        plot_sub_graph("svg_sub_graph", d.id)
                        $("#svg_graph").hide();
                        $("#svg_hierarchic").hide();
                        $("#svg_sub_graph").show();
                    });
                });
    }

    var force2 = d3.layout.force().nodes(labelAnchors).links(labelAnchorLinks)
                    .gravity(0).linkDistance(0).linkStrength(8).charge(-100).size([width, height]).start();

    var anchorLink = vis.selectAll("line.anchorLink").data(labelAnchorLinks)//.enter().append("svg:line").attr("class", "anchorLink").style("stroke", "#999");

    var anchorNode = vis.selectAll("g.anchorNode").data(force2.nodes()).enter().append("svg:g").attr("class", "anchorNode");
    anchorNode.append("svg:circle").attr("r", 0).style("fill", "#FFF");
        anchorNode.append("svg:text").text(function(d, i) {
        return i % 2 == 0 ? "" : d.node.label
    }).style("fill", "#555").style("font-family", "Arial").style("font-size", 12);

    var updateLink = function() {
        this.attr("x1", function(d) {return d.source.x;})
            .attr("y1", function(d) {return d.source.y;})
            .attr("x2", function(d) {return d.target.x;})
            .attr("y2", function(d) {return d.target.y;});

    }

    var updateNode = function() {
        this.attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });

    }

    center_view = function() {
        console.log("center_view()");
        // Center the view on the molecule(s) and scale it so that everything
        // fits in the window

        if (nodeGraph === null)
            return;

        var nodes = nodeGraph.nodes;

        //no molecules, nothing to do
        if (nodes.length === 0)
            return;

        // Get the bounding box
        min_x = d3.min(nodes.map(function(d) {return d.x;}));
        min_y = d3.min(nodes.map(function(d) {return d.y;}));

        max_x = d3.max(nodes.map(function(d) {return d.x;}));
        max_y = d3.max(nodes.map(function(d) {return d.y;}));

        // The width and the height of the graph
        mol_width = max_x - min_x;
        mol_height = max_y - min_y;

        // how much larger the drawing area is than the width and the height
        width_ratio = width / mol_width;
        height_ratio = height / mol_height;

        // we need to fit it in both directions, so we scale according to
        // the direction in which we need to shrink the most
        min_ratio = Math.min(width_ratio, height_ratio) * 0.8;

        // the new dimensions of the molecule
        new_mol_width = mol_width * min_ratio;
        new_mol_height = mol_height * min_ratio;

        // translate so that it's in the center of the window
        x_trans = -(min_x) * min_ratio + (width - new_mol_width) / 2;
        y_trans = -(min_y) * min_ratio + (height - new_mol_height) / 2;

        // do the actual moving
        vis.attr("transform",
                 "translate(" + [x_trans, y_trans] + ")" + " scale(" + min_ratio + ")");
                 // tell the zoomer what we did so that next we zoom, it uses the
                 // transformation we entered here
                 zoomer.translate([x_trans, y_trans ]);
                 zoomer.scale(min_ratio);
    };

    force.on("tick", function() {

        force2.start();

        node.call(updateNode);

        anchorNode.each(function(d, i) {
            if(i % 2 == 0) {
                d.x = d.node.x;
                d.y = d.node.y;
            } else {
                var b = this.childNodes[1].getBBox();

                var diffX = d.x - d.node.x;
                var diffY = d.y - d.node.y;

                var dist = Math.sqrt(diffX * diffX + diffY * diffY);

                var shiftX = b.width * (diffX - dist) / (dist * 2);
                shiftX = Math.max(-b.width, Math.min(0, shiftX));
                var shiftY = 5;
                this.childNodes[1].setAttribute("transform", "translate(" + shiftX + "," + shiftY + ")");
            }
        });


        anchorNode.call(updateNode);

        link.call(updateLink);
        anchorLink.call(updateLink);

    });

    function brushstart(d){
//    console.log("brushstart()");
    node.each(function(d) {
        d.previouslySelected = shiftKey && d.selected;
        });
}

    function brush(d){
//        console.log("brush()");
        var extent = d3.event.target.extent();
            node.classed("selected", function(d) {
                return d.selected = d.previouslySelected ^
                (extent[0][0] <= d.x && d.x < extent[1][0]
                 && extent[0][1] <= d.y && d.y < extent[1][1]);
            });
    }

    function brushend(){
//        console.log("brushed()");
        d3.event.target.clear();
        d3.select(this).call(d3.event.target);
    }

    function zoomstart() {
//        console.log("zoomstart()");
        node.each(function(d) {
            d.selected = false;
            d.previouslySelected = false;
        });
        node.classed("selected", false);
    }

    function redraw() {
//        console.log("redraw()");
        vis.attr("transform",
                 "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
    }

    function dragstarted(d) {
//        console.log("dragstart()");
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
//        console.log("dragged()");
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
//        console.log("dragended()");
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
//        console.log("keyup()");
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

function multi_force(Graph, clustering, svg_id, special_nodes){
//    console.log(IMP_C);
    console.log("__func__: muti_force()");

//    var graph_new;
//    console.log("-------------------Graph: ------------------");
//    console.log(Graph);
//    if(Graph != undefined){
//        console.log("Graph != undefined");
//        graph = JSON.parse(JSON.stringify(Graph));
//        console.log("-------------------graph------------------");
//        console.log(graph);

    graph = Graph;
    var special_nodes = special_nodes || "";
    clustering_arr = obj_to_arr(clustering);
    var n = graph.nodes.length,// total number of circles
        m = Math.max.apply(null, clustering_arr) + 1;// number of distinct clusters

    foci = get_foci(m);
    var svg_center = Math.floor((Math.ceil(Math.sqrt(m)) * Math.ceil(Math.sqrt(m)))/2);
    foci = swap_foci(foci, svg_center, IMP_C);

    var svg = d3.select("#".concat(svg_id)).attr("tabindex", 1)
        .on("keydown.brush", keydown)
        .on("keyup.brush", keyup)
        .each(function() { this.focus(); }).append("svg").attr("width", width).attr("height", height);

    var zoomer = d3.behavior.zoom().scaleExtent([0.1,10]).x(xScale).y(yScale)
        .on("zoomstart", zoomstart)
        .on("zoom", redraw);

    var brusher = d3.svg.brush().x(xScale).y(yScale)
        .on("brushstart", brushstart)
        .on("brush", brush)
        .on("brushend", brushend);//end brusher

    var svg_graph = svg.append('svg:g').call(zoomer);
//                        .call(brusher);

    var brush = svg_graph.append("g")
        .datum(function() { return {selected: false, previouslySelected: false}; })
        .attr("class", "brush");

    var vis = svg_graph.append("svg:g").attr('id', 'vis');

    brush.call(brusher)
         .on("mousedown.brush", null)
         .on("touchstart.brush", null)
         .on("touchmove.brush", null)
         .on("touchend.brush", null);

    /*-----------定义link、node、force、clusters---------------*/

    var clusters = new Array(m);

    force = d3.layout.force().size([width, height])
        .charge(-20);
//        .alpha(1)
//        .gravity(.02)
//        .on("tick",tick);

    var drag = d3.behavior.drag()
              .on("dragstart", dragstarted)
              .on("drag", dragged)
              .on("dragend", dragended);

    /*--------给clusters,node,link,force赋值------------*/
    var j=0, k=0;
    var arr = new Array();

    var nodes = d3.range(n).map(function() {
        var i = Math.floor(Math.random() * m);
        var id = graph.nodes[j]['id'],
            label = graph.nodes[j]['label'],
            c = clustering[graph.nodes[j]['id']],
            r = 8,
            size = 0;
        var d = {id:id, label: label, radius: r, cluster: c, size: size};
        if(arr.indexOf(c) === -1){
            arr.push(c);
            clusters[c] = d;
            k++;
        }
        j++;
        return d;
    });

    var labelAnchors = [];
    var labelAnchorLinks = [];

    for(var i=0; i<nodes.length; i++){
        var node = nodes[i];
        labelAnchors.push({ node : node });
        labelAnchors.push({ node : node });
        labelAnchorLinks.push({
            source : i * 2,
            target : i * 2 + 1,
            weight : 1
        });
    };//end nodes_for


    //标记特殊节点
    for(var i=0;i<n; i++){
        for(var j=0;j<important_nodes.length; j++){
            if(nodes[i]['label'] == important_nodes[j]){
                nodes[i].radius = 16;
            }
        }
        if(nodes[i]['label'] == special_nodes){
            nodes[i].radius = 16;
        }
    }

    graph.links.forEach(function(d) {
        d.source = nodes[d.source];
        d.target = nodes[d.target];
    });

    /*--------给clusters,node,link,force赋值 end ------------*/
    var link = vis.append("g").attr("class", "link").selectAll("line");
    var node = vis.append("g").attr("class", "node").selectAll("circle");

    link = link.data(graph.links).enter().append("line")
                .attr("stroke-width",function(d){return d.weight*2})
                .on("click", show_link_info);

    node = node.data(nodes).enter().append("circle")
//                .attr("cx", function(d) { return d.x; })
//                .attr("cy", function(d) { return d.y; })
                .attr("r", function(d){return d.radius})
                .style("fill", function(d, i) {return color[d.cluster]; })
                .call(drag)
                .on("click", show_node_info);
    force.nodes(nodes).start();

    var force2 = d3.layout.force().nodes(labelAnchors).links(labelAnchorLinks)
                    .gravity(0).linkDistance(0).linkStrength(8).charge(-20).size([width, height]);
//                    .start();
    var anchorLink = vis.selectAll("line.anchorLink").data(labelAnchorLinks)//.enter().append("svg:line").attr("class", "anchorLink").style("stroke", "#999");

    var anchorNode = vis.selectAll("g.anchorNode").data(force2.nodes()).enter().append("svg:g").attr("class", "anchorNode").call(drag);
    anchorNode.append("svg:circle").attr("r", 0).style("fill", "#FFF");
    anchorNode.append("svg:text").text(function(d, i) {
        return i % 2 == 0 ? "" : d.node.label})
    .style("fill", "#555").style("font-family", "Arial").style("font-size", 10);


    var updateLink = function() {
        this.attr("x1", function(d) {return d.source.x;})
            .attr("y1", function(d) {return d.source.y;})
            .attr("x2", function(d) {return d.target.x;})
            .attr("y2", function(d) {return d.target.y;});
    }

    var updateNode = function() {
        this.attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });
    }

//    nodes.forEach(function(o ,i){
//        console.log("o.id:" + o.id + ",  o.cluster:" + o.cluster + ",  foci[o.cluster].y:" + foci[o.cluster].y + ",  o.y:" + o.y);
//    })

//    console.log("---------------------tick()----------------------");
    force.on("tick", function(e) {

        var k = .1 * e.alpha;
        // Push nodes toward their designated focus.
        try{
            nodes.forEach(function(o, i) {
                o.y += (foci[o.cluster].y - o.y) * k;
                o.x += (foci[o.cluster].x - o.x) * k;
            });
        }catch(TypeError){
            console.log("TypeError");
            return ;
        }
        force2.start();

        anchorNode.each(function(d, i) {
            if(i % 2 == 0) {
                d.x = d.node.x;
                d.y = d.node.y;
            } else {
                var b = this.childNodes[1].getBBox();

                var diffX = d.x - d.node.x;
                var diffY = d.y - d.node.y;

                var dist = Math.sqrt(diffX * diffX + diffY * diffY);

                var shiftX = b.width * (diffX - dist) / (dist * 2);
                shiftX = Math.max(-b.width, Math.min(0, shiftX));
                var shiftY = 5;
                this.childNodes[1].setAttribute("transform", "translate(" + shiftX + "," + shiftY + ")");
            }
        });

        anchorNode.call(updateNode);
                node.call(updateNode);

        link.call(updateLink);

        anchorLink.call(updateLink);
    });


//    function mousedown() {
//      nodes.forEach(function(o, i) {
//        o.x += (Math.random() - .5) * 40;
//        o.y += (Math.random() - .5) * 40;
//      });
//      force.resume();
//    }

    function brushstart(d){
//        console.log("brushstart()");
        node.each(function(d) {
            d.previouslySelected = shiftKey && d.selected;
            });
    }

    function brush(d){
//        console.log("brush()");
        var extent = d3.event.target.extent();
            node.classed("selected", function(d) {
                return d.selected = d.previouslySelected ^
                (extent[0][0] <= d.x && d.x < extent[1][0]
                 && extent[0][1] <= d.y && d.y < extent[1][1]);
            });
    }

    function brushend(){
//        console.log("brush()");
        d3.event.target.clear();
        d3.select(this).call(d3.event.target);
    }

    function zoomstart() {
//        console.log("zoomstart()");
        node.each(function(d) {
            d.selected = false;
            d.previouslySelected = false;
        });
        node.classed("selected", false);
    }

    function redraw() {
//        console.log("redraw()");
        vis.attr("transform",
                 "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
    }

    function dragstarted(d) {
//        console.log("dragstarted()");
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
//        console.log("dragged()");
        node.filter(function(d) { return d.selected; })
        .each(function(d) {
            d.x += d3.event.dx;
            d.y += d3.event.dy;

            d.px += d3.event.dx;
            d.py += d3.event.dy;
        });
        force.resume();
    }

    function dragended(d) {
//        console.log("dragended()");
        node.filter(function(d) { return d.selected; })
        force.stop();
    }

    function keydown() {
        shiftKey = d3.event.shiftKey || d3.event.metaKey;
        ctrlKey = d3.event.ctrlKey;

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
//}
//    Graph = undefined;
//    console.log("-------------------Graph------------------");
//    console.log(Graph);
//    console.log("-------------------graph------------------");
//    console.log(graph);
}

function show_graph_info(graph){
    $(document).ready(function(){
        $("#number_of_nodes").text("节点数目: " + graph.nodes.length);
        $("#number_of_edges").text("边数目: " + graph.links.length);
        $("#number_of_cluster").text("聚类数目：" + count_group_number(graph.nodes)[0]);
    });
}

function show_node_info(d){
    $(document).ready(function(){
        $("#node_label").text("节点IP：" + d.label);
        $("#node_group").text("所属类别：" + d.cluster);
        $("#node_size").text("子节点个数：" +d.size);
    });
}

function show_link_info(d){
    $(document).ready(function(){
        $("#link_info_title").text("边信息：");
        $("#source").text("源节点: " + d.source.label);
        $("#target").text("目的节点: " + d.target.label);
        $("#weight").text("权重: " + d.weight);
    });
}

