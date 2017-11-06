var MAX_GROUP = 50;
//var width = 960, height = 660, shiftKey, ctrlKey;
var width = 834, height = 530;
var shiftKey, ctrlKey;
var xScale = d3.scale.linear().domain([0,width]).range([0,width]);
var yScale = d3.scale.linear().domain([0,height]).range([0, height]);
var color = new Array();


//生成颜色
for(var c=0; c<MAX_GROUP; c++){
    var cc = random_color();
    color.push(cc);

    //随机生成十六进制颜色
    function random_color(){
        var colorStr=Math.floor(Math.random()*0xFFFFFF).toString(16).toUpperCase();
    　　return "#"+"000000".substring(0,6-colorStr)+colorStr;
    }
}

//标准化图的格式
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
    var graph = {"nodes": nodes,
                 "links":links,
                 "labelAnchors":labelAnchors,
                 "labelAnchorLinks":labelAnchorLinks};
    return graph;
};

function get_graph(django_data){
    G = django_data["G"];
    G_parent = django_data["G_parent"];
    G_sub_graphs = django_data["G_sub_graphs"];
    clustering = django_data['clustering'];
    checked_clustering = arrCheck(clustering);

    //number_of_clustering：聚类数目，clustering从0开始，所以要加1
    var number_of_clustering = Math.max.apply(null, clustering) + 1;
    std_G = std_graph(G);
    std_G_parent = std_graph(G_parent);

    //为G中的节点添加'group'属性
    for(var i=0; i<G.nodes.length; i++){
        std_G.nodes[i]["group"] = clustering[i];
    }

    //为G_parent中的节点添加'size'和'group'属性
    for(var i=0; i<G_parent.nodes.length; i++){
        var group = checked_clustering[i]["value"];
        var size = checked_clustering[i]["count"];
        std_G_parent.nodes[i]["group"] = group;
        std_G_parent.nodes[i]["size"] = size;
    }
    //为G_parent中的边添加'weight'属性
    for(var i=0; i<G_parent.links.length; i++){
        std_G_parent.links[i]["weight"] = G_parent.links[i]["weight"]
    }

    return [std_G, std_G_parent]
}

function plot_sub_graph(svg_id, sub_graph_id){
    sub_graphs = G_sub_graphs;
    clustering = clustering;
    sub_graph = std_graph(JSON.parse(G_sub_graphs[sub_graph_id]));
    for(var j=0; j<sub_graph.nodes.length; j++){
        node_id = sub_graph.nodes[j]['id']
        sub_graph["nodes"][j]["group"] = clustering[node_id];
    }
    selectableForceDirectedGraph(sub_graph, svg_id)
}

//统计数组元素出现的次数
function arrCheck(arr){
    var item = {};
    for(var i=0; i<arr.length; i++){
        var count = 1;
        var key = arr[i], obj = {};
        if(item[key]){
            item[key].count++;
        }else{
            obj.value = arr[i];
            obj.count = 1;
            item[key] = obj;
        }
    }
    return item;
}

//绘图函数
function selectableForceDirectedGraph(Graph, svg_id) {
    graph = Graph;
    nodeGraph = graph;
//    show_graph_info(Graph);
//    console.log(graph)
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

    var vis = svg_graph.append("svg:g");

    vis.attr('fill', 'red')
        .attr('stroke', 'black')
        .attr('stroke-width', 1)
        .attr('opacity', 0.5)
        .attr('id', 'vis');

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
            .linkDistance(40)
            .on("tick",tick);

    var drag = d3.behavior.drag()
              .on("dragstart", dragstarted)
              .on("drag", dragged)
              .on("dragend", dragended);

    graph.links.forEach(function(d) {
        d.source = graph.nodes[d.source];
        d.target = graph.nodes[d.target];
    });

    force.nodes(graph.nodes).links(graph.links).start();

    link = link.data(graph.links).enter().append("line")
                .attr("stroke-width",function(d){return d.weight*2})
                .on("click", show_link_info);

    node = node.data(graph.nodes).enter().append("circle")
        .attr("r", function(d){return d.size*2;})
        .attr("fill", function(d){return color[d.group];})
        .call(drag)
        .on("click", show_node_info);

    if(svg_id =="svg_hierarchic"){
        force = force.charge(-120).linkDistance(200).on("tick",tick).start();
        node = node.on("dblclick", function(d){
                    $(document).ready(function(){
                        plot_sub_graph("svg_sub_graph", d.id)
                        $("#svg_graph").hide();
                        $("#svg_hierarchic").hide();
                        $("#svg_sub_graph").show();
                    });
                });
    }

    center_view = function() {
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



    function show_node_info(d){
        $(document).ready(function(){
            $("#node_info_title").text("节点信息：");
            $("#node_id").text("ID：" + d.id);
            $("#node_label").text("IP：" + d.label);
            $("#node_group").text("所属类别：" + d.group);
            $("#node_size").text("");
        });
    }

    function show_link_info(d){
        $(document).ready(function(){
            $("#link_info_title").text("边信息：");
            $("#source").text("源节点: " + d.source.id);
            $("#target").text("目的节点: " + d.target.id);
            $("#weight").text("权重: " + d.weight);
        });
        }
}

function no_file_error(){
    $(document).ready(function(){
        $("#plot_graph_btn, #plot_hierarchic_btn").click(function(){
            console.log("graph errors");
            alert("请先上传文件");
        });
    });
}

function show_graph_info(graph){
    $(document).ready(function(){
        $("#graph_info_title").text("图信息：");
        $("#number_of_nodes").text("节点个数: " + graph.nodes.length);
        $("#number_of_edges").text("边条数: " + graph.links.length);
        $("#number_of_cluster").text("聚类数目：" + G_parent.nodes.length);
    });
}

function graph_show(django_data){
    $(document).ready(function(){
        g = get_graph(django_data);
	    std_G = g[0];
	    std_G_parent = g[1];

        selectableForceDirectedGraph(std_G, "svg_graph");
        selectableForceDirectedGraph(std_G_parent, "svg_hierarchic");
        $("#svg_graph").hide();
        $("#svg_hierarchic").hide();
        $("#svg_sub_graph").hide();

        $("#plot_graph_btn").click(function(){
            show_graph_info(std_G);
            $("#instruction").text("绘制所有的节点，节点的颜色代表节点所在的类别")
            $("#svg_graph").show();
            $("#svg_hierarchic").hide();
            $("#svg_sub_graph").hide();
            $("#svg_sub_graph").text("");
        });
        $("#plot_hierarchic_btn").click(function(){
            show_graph_info(std_G_parent);
            $("#instruction").text("分层布局结构，每一个点代表一个社团，点的大小与社团内的点数目相关")
            $("#svg_graph").hide();
            $("#svg_hierarchic").show();
            $("#svg_sub_graph").hide();
            $("#svg_sub_graph").text("");
        });
    });
}

/* “设置”下拉对话框的显示与隐藏 */
$(document).ready(function(){
    var delay=0, setTimeoutConst;
    $('#settings_btn').click(function(){
        console.log("click")
        $('.dropdown-menu').slideToggle();
    });//end click
});

/* 获取“设置”表单的属性,并将数据发送给后端 */
$(document).ready(function(){
    $(":radio[name='clustering_method']").each(function(){
            $(this).click(function(){
                var cm = $(this).val();
                if(cm == 'modularity'){
                    $('.choose_ip_seg').hide();
                }
                if(cm == 'ip_seg'){
                    $('.choose_ip_seg').show();
                };
            });
        })
    var form_data = {};
    $("#settings_submit_btn").click(function(){
        $('.dropdown-menu').hide();
        form_data["clustering_method"] = $(":radio[name='clustering_method']:checked").val();
        form_data["choose_ip_seg"] = $(":radio[name='choose_ip_seg']:checked").val();
        form_data["with_neighbors"] = $(":radio[name='with_neighbors']:checked").val();
        $.post('/draw/home/', form_data, function(data){
            var django_data = {
                                "G" : JSON.parse(data["G"]),
                                "G_parent" : JSON.parse(data["G_parent"]),
                                "G_sub_graphs" : data["G_sub_graphs"],
                                "clustering" : JSON.parse(data['clustering'])
                             };
            $("#svg_graph").html("");
            $("#svg_hierarchic").html("");
            $("#svg_sub_graph").html("");
            graph_show(django_data);
        });//向后台发送数据
    });//end click()
});

/* 查询数据库，显示节点信息 */
$(document).ready(function(){
    $("#more_information").click(function(){
        $("#sql_info").text("更多：");
        request_data = {};
        request_data['ip'] = $("#node_label").text().slice(3,this.length);
        $.get('/draw/home/', request_data, function(data){
            $("#sql_info").append(data["info"]);
        });//向后台发送数据
    });//end click()
});











