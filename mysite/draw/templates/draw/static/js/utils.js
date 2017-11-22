var important_nodes = [];
var MAX_GROUP = 40;
var svg_center = {x:480, y:320};  /*绘图空间中心位置坐标*/
/*IPv4地址的正则表达式*/
var ip_ret = /^((?:(?:25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))\.){3}(?:25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d))))$/;
var color = new Array();
var IMP_C = [],
    IMP_node;


/*绘图程序*/
function graph_show(django_data){
    $(document).ready(function(){
        clustering = django_data['clustering'];
        G_sub_graphs = django_data['G_sub_graphs'];
        std_G = std_graph(django_data['G'], clustering);
        var m = Math.max.apply(null, obj_to_arr(clustering)) + 1;//聚类数目
        color = set_color(m);

        if(IMP_node != undefined){
            set_IMP_C(IMP_node, clustering, std_G.nodes);
        }

        G_parent_label = get_common_seg(django_data['G'], clustering);
	    std_G_parent = parent_add_attr(django_data['G_parent'], clustering, G_parent_label);

        multi_force(std_G, clustering, "svg_graph");
        selectableForceDirectedGraph(std_G_parent, "svg_hierarchic");
        $("#svg_graph").hide();
        $("#svg_hierarchic").hide();
        $("#svg_sub_graph").hide();

        $("#plot_graph_btn").click(function(){
            $(".banner-bottom").show();
            show_graph_info(std_G);
            $("#introduction").text("绘制所有的节点，节点的颜色代表节点所在的类别")
            $("#svg_graph").show();
            $("#svg_hierarchic").hide();
            $("#svg_sub_graph").hide();
            $("#svg_sub_graph").text("");
        });
        $("#plot_hierarchic_btn").click(function(){
            show_graph_info(std_G_parent);
            $("#introduction").text("分层布局结构，每一个点代表一个社团，点的大小与社团内的点数目相关")
            $("#svg_graph").hide();
            $("#svg_hierarchic").show();
            $("#svg_sub_graph").hide();
            $("#svg_sub_graph").text("");
        });
    });
}

/*设置核心节点，放进IMP_C数组中*/
function set_IMP_C(imp_node, clustering, graph_nodes){
    var temp_IMP_C;
    $.each(graph_nodes,function(idx,item){
        if(item.label == imp_node){
            temp_IMP_C = clustering[idx];
        }
    });
    console.log(temp_IMP_C);
    if(temp_IMP_C == undefined){
        alert("无此节点，请重新输入");
    }else{
        IMP_C.push(temp_IMP_C);
    }
}


//标准化图的格式
function std_graph(Graph, cls){
//    console.log("__func__: std_graph()");
    var nodes = [];
    var links = [];
    var labelAnchors = [];
    var labelAnchorLinks = [];
    for(var i=0; i<Graph.nodes.length; i++){
        var node = {"id": Graph.nodes[i].id,
                    "label": Graph.nodes[i].label,
                    "cluster": cls[Graph.nodes[i].id],
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

//为层次布局图设置属性
function parent_add_attr(G_parent, clustering, label){
//    console.log("__func__: parent_add_attr");
    std_G_parent = std_graph(G_parent, clustering);
    clustering_arr = obj_to_arr(clustering);
    checked_clustering = arrCheck(clustering_arr);
    //为G_parent中的节点添加'size'、'group'和'label'属性
    for(var i=0; i<G_parent.nodes.length; i++){
        var cluster = checked_clustering[i]["value"];
        var size = checked_clustering[i]["count"];
        std_G_parent.nodes[i]["cluster"] = cluster;
        std_G_parent.nodes[i]["size"] = size;
        std_G_parent.nodes[i]["label"] = label[i];
    }

    //为G_parent中的边添加'weight'属性
    for(var i=0; i<G_parent.links.length; i++){
        std_G_parent.links[i]["weight"] = G_parent.links[i]["weight"]
    }
    return std_G_parent;
}

function plot_sub_graph(svg_id, sub_graph_id){
    console.log("__func__ : plot_sub_graph()");
    sub_graphs = G_sub_graphs;
    clustering = clustering;
    sub_graph = std_graph(JSON.parse(G_sub_graphs[sub_graph_id]), clustering);

    show_graph_info(sub_graph);
    multi_force(sub_graph, clustering, svg_id);
}

//统计节点一共被划分成多少组
function count_group_number(nodes){
//    console.log(nodes);
//    console.log("__func__ : count_group_number()");
    var nodes_group = new Array();
        group_number = 0;
    for(var i=0; i<nodes.length; i++){
        nodes_group.push(nodes[i].cluster);
    }
    checked_group = arrCheck(nodes_group);
//    console.log(checked_group);
    for(var key in checked_group){
        group_number++;
    }
//    console.log(group_number);
    return [group_number, checked_group];
}

//提取每一组IP地址的相同段位
function get_common_seg(G, clustering){
    console.log("__func__ : get_common_seg()");
    var nodes_label = [];
    var choose_ip_seg = Number($(":radio[name='choose_ip_seg']:checked").val());
    clustering_arr = obj_to_arr(clustering);
//    console.log(clustering_arr);
    for(var i=0; i<Math.max.apply(null, clustering_arr)+1; i++){
        var idx = clustering_arr.indexOf(i);
        var label = G.nodes[idx].label;
        var label_arr = label.split(".").slice(0, choose_ip_seg) ;
        var common_seg = label_arr.join(".");
        common_seg += new String(".*").repeat(4-choose_ip_seg);
        nodes_label.push(common_seg);
    }
    return nodes_label;
}

//统计数组元素出现的次数
function arrCheck(arr){
//    console.log("__func__ : arrCheck()");
    var item = {};
    var item_arr = [];
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
//    return item;
    for(key in item){
        item_arr.push(item[key]);
    }
    return item_arr;
}

//将json对象转化为数组
function obj_to_arr(obj){
//    console.log("__func__ : obj_to_arr()");
    var arr = [];
    for(var key in obj){
        arr.push(obj[key]);
    }
    return arr;
}

/*添加颜色*/
function set_color(color_number){
//    console.log("__func__ : set_color()");
    var color = [];
     if(color_number>MAX_GROUP){
        for(var i=0;i<MAX_GROUP; i++){
            color[i] = "#000000";
        }
        alert("聚类数目太多，建议修改聚类方法");
    }
    else if(color_number<=MAX_GROUP){
        c1 = d3.scale.category20();
        c2 = d3.scale.category20b();
        for(var i=0; i<20; i++){
            color[i] = c1(i);
            color[i*2] = c2(i);
        }
    }
    return color;
}

/*------交换json对象中的元素位置--------
--------应用场景：交换核心节点和视图中心节点的类别，以将核心节点显示在图中央*/
function swap(obj, item1, item2){
//    console.log("__func__ : swap()");
    var item1_id = [];
    var item2_id = [];
    var new_obj = $.extend(true, {}, obj)
    for(key in new_obj){
        if(new_obj[key] == item1){
            item1_id.push(key);
        }
        if(new_obj[key] == item2){
            item2_id.push(key);
        }
    }
    for(var i=0; i<item1_id.length; i++){
       new_obj[item1_id[i]] = item2;
    }
    for(var j=0; j<item2_id.length; j++){
       new_obj[item2_id[j]] = item1;
    }
    return new_obj
}

/*交换数组中的两个元素位置*/
function swap_arr(arr, item1, item2){
//    console.log("__func__ : swap_arr()");
    var new_arr = $.extend(true, [], arr);
    var temp = new_arr[item1];
    new_arr[item1] = new_arr[item2];
    new_arr[item2] = temp;
    return new_arr;
}

/*计算图中每个节点的位置坐标*/
function get_foci(foci_num){
//    console.log("__func__ : get_foci()");
    var foci = [],
        m_sqrt = Math.ceil(Math.sqrt(foci_num));
    var x_arr = [], y_arr = [];

    var x_min = y_min = 100;
    var x_step = Math.ceil(svg_center.x / m_sqrt *2),
        y_step = Math.ceil(svg_center.y / m_sqrt *2);
    for(var i=0; i<m_sqrt; i++){
        x_arr.push(x_min);
        x_min += x_step;
        y_arr.push(y_min);
        y_min += y_step;
    }

    for(var i=0; i<m_sqrt; i++){
        for(var j=0; j<m_sqrt; j++){
            tmp = {x: x_arr[j], y:y_arr[i]};
            foci.push(tmp);
        }
    }
    return foci;
}

function set_specific_cluster(cls, sp_cls){
    new_cls = JSON.parse(JSON.stringify(cls));
    for(var i in sp_cls){
        for(j=0; j<sp_cls[i].length; j++){
            sp_id = sp_cls[i][j];
            new_cls[sp_id] = i;
        }
    }
    return new_cls;
}
