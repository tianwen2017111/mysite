var important_nodes = [];
var MAX_GROUP = 40;
var svg_center = {x:480, y:320};  /*绘图空间中心位置坐标*/
/*IPv4地址的正则表达式*/
var ip_ret = /^((?:(?:25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))\.){3}(?:25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d))))$/;
var color = new Array();
var IMP_C = [],
    IMP_node;
var fileChanged = false;

$(document).ready(function(){

    if(django_data == ""){
        $("#plot_graph_btn, #plot_hierarchic_btn, #settings_submit_btn, #search_submit_btn, #filter_submit_btn").click(function(){
            console.log("No file errors!");
            alert("请先上传文件");
        });
    }
    else{
        graph_show(django_data);
    }

    /*-------------添加回车确定效果-------------------*/
    $("form.dropdown-menu, div.md-popover").keydown(function() {
        if (event.keyCode == "13") {//keyCode=13是回车键
            $(this).find("input.btn.submit").click();
        }
    });

    /*-------------设置表单内部的显示与隐藏--------------------*/
    /*$(":radio[name='clustering_method']").each(function(){
            $(this).click(function(){
                var cm = $(this).val();
                if(cm == 'modularity'){
                    $('.choose_ip_seg').hide();
                }
                if(cm == 'ip_seg'){
                    $('.choose_ip_seg').show();
                };
            });
        })*/
//var nodes,nodes_new;  nodes_new == undefined;nodes=nodes_new;nodes_new=undefined
    /*-------------获取“设置”表单的属性,并将数据发送给后端----------*/
    $("#settings_submit_btn").click(function(){
        console.log("__Do__: settings");
        var form_data = {};
//        form_data["clustering_method"] = $(":radio[name='clustering_method']:checked").val();
        form_data["clustering_method"] = "ip_seg";
        form_data["choose_ip_seg"] = $(":radio[name='choose_ip_seg']:checked").val();
        form_data["with_neighbors"] = $(":radio[name='with_neighbors']:checked").val();
        console.log(form_data);
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

    /*-------------数据库查询，显示节点信息----------------------*/
    $("#more_information").click(function(){
        $(this).next().slideToggle();
        $(this).parent().toggleClass('open');

        if(django_data == "") {
            $("#sql_info").text("请先上传文件");
        }else{
            var request_data = {};
            request_data['check_ip'] = $("#node_label").text().slice(5,this.length);
            console.log("__Do__ : more_information   " + "IP: " + request_data['check_ip']);
            $.get('/draw/home/', request_data, function(data){
                $("#sql_info").text(data["info"]);
            });//向后台发送数据
        }
    });//end click()

    /*-------------‘查询节点’表单的输入验证-------------------*/
    $("#search_submit_btn").click(function(){
        var $this = $(this),
            $prev_span = $this.prevAll("span");
        var search_input = $("#search_input").val();
        var errorMsg, search_data = {};
        $prev_span.find(".msg").remove();
        if(search_input == ""){
            errorMsg = "*请输入ip地址";
            $prev_span.addClass("msg onError").text(errorMsg);
        }
        else if(!ip_ret.test(search_input)){
            errorMsg = "*输入错误";
            $prev_span.addClass("msg onError").text(errorMsg);
        }
        else if(ip_ret.test(search_input)){
            $prev_span.addClass("msg onSuccess").text("*输入正确");
            search_data['search_ip'] = search_input;
            search_data['hop'] = $("input[name='hop']").val();
            console.log("__Do__ : search_ip" + ", search : " +search_data['search_ip'] + ", hop : " + search_data['hop']);
            $.post('/draw/home/', search_data, function(data){
                if(data['search_result'] == ''){
                    alert('无此ip， 请重新输入');
                }
                else{
                    $("#svg_sub_graph").html("");
                    Graph = JSON.parse(data['search_result']);
                    show_graph_info(Graph);
                    multi_force(Graph, clustering, 'svg_sub_graph', search_input);
                    $("#svg_graph").hide();
                    $("#svg_hierarchic").hide();
                    $("#svg_sub_graph").show();
                }
            });//向后台发送数据
        }
    });

    /*-------------‘过滤’表单的输入验证-------------------*/
    $("#filter_submit_btn").click(function(){
        var $prev_span = $(this).prevAll("span");
        $prev_span.find(".msg").remove();
        var filter_input = $("input:text[name='filter_input']").val(),
            filter_request = {};
        var filter_pattern = /^((?:((?:25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))|\*)\.){3}((?:25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))|\*))$/;

        if(filter_input == ""){
            errorMsg = "*请输入过滤条件"
            $prev_span.addClass("msg onError").text(errorMsg);
        }
        else if(!filter_pattern.test(filter_input)){
            errorMsg = "*输入错误"
            $prev_span.addClass("msg onError").text(errorMsg);
        }else if(filter_pattern.test(filter_input)){
            $prev_span.addClass("msg onSuccess").text("输入正确");
            filter_request['filter_condition'] = filter_input;
            console.log("__Do__ : filter nodes, filter_condition " + filter_input);
            $.post('/draw/home/', filter_request, function(data){
                if(data['filter_result'] == ''){
                    alert('无匹配项， 请重新输入');
                }
                else{
                    $("#svg_sub_graph").html("");
                    Graph = JSON.parse(data['filter_result']);
                    show_graph_info(Graph);
                    multi_force(Graph, clustering, 'svg_sub_graph');
                    $("#svg_graph").hide();
                    $("#svg_hierarchic").hide();
                    $("#svg_sub_graph").show();
                }
            });//向后台发送数据
        }
    });

    /*-------增删数据的弹框效果----------*/
    $('.md-trigger').click(function(){
        if(django_data == ""){
            alert("请先上传文件");
        }else{
        /*-------弹出弹框-------*/
        $this = $(this);
        $('.popover-mask').fadeIn(100);
        if($this.hasClass("del_node")){
             $('#del_node_div').slideDown(200);
        }
        if($this.hasClass("del_edge")){
             $('#del_edge_div').slideDown(200);
        }
        if($this.hasClass("add_node")){
             $('#add_node_div').slideDown(200);
        }
        if($this.hasClass("add_edge")){
             $('#add_edge_div').slideDown(200);
        }
        if($this.hasClass("set_important_node")){
             $('#set_important_node_div').slideDown(200);
        }
        }
    });
    $(".pop-title .close, .pop-body input.btn.cancel").click(function(){
        /*-------关闭弹框-------*/
        $('.popover-mask').fadeOut(100);
        $(this).closest('.md-popover').slideUp(200);
    });

    /*----------节点删减的输入验证-----------*/
    $(".pop-body input.form-control").blur(function(){
        var $next = $(this).next("span");
        $next.find(".msg").remove();
        $val = $.trim($(this).val());

        if($val == ""){
            var errorMsg = "请输入IP";
            $next.addClass("msg onError").text(errorMsg);
        }
        else if(!ip_ret.test($val)){
            var errorMsg = "输入错误";
            $next.addClass("msg onError").text(errorMsg);
        }
        else  if(ip_ret.test($val)){
            var errorMsg = "输入正确";
            $next.addClass("msg onSuccess").text(errorMsg);
        }
    });

    /*----------节点删减-----------*/
    $(".pop-body input.btn.submit").click(function(){

        var $this = $(this);
        var $parent = $this.closest("div.md-popover");
        var manage_request = {};

        if( $parent.hasClass('del_node')){
            $val = $this.parent().prev().find('.form-control').val();
            if(ip_ret.test($val)){
                manage_request['manage_type'] = 'del_node';
                manage_request['node'] = $val;
            }
        }

        else if( $parent.hasClass('del_edge')){
            $source = $this.parent().prevAll().find('.source').val();
            $target = $this.parent().prev().find('.target').val();
            if(ip_ret.test($source) && ip_ret.test($target)){
                manage_request['manage_type'] = 'del_edge';
                manage_request['source'] = $source;
                manage_request['target'] = $target;
            }
        }

        else if( $parent.hasClass('add_node')){
            $val = $this.parent().prev().find('.form-control').val();
            if(ip_ret.test($val)){
                manage_request['manage_type'] = 'add_node';
                manage_request['node'] = $val;
            }
        }

        else if( $parent.hasClass('add_edge')){
            $source = $this.parent().prevAll().find('.source').val();
            $target = $this.parent().prev().find('.target').val();
            if(ip_ret.test($source) && ip_ret.test($target)){
                manage_request['manage_type'] = 'add_edge';
                manage_request['source'] = $source;
                manage_request['target'] = $target;
            }
        }

        if(!$.isEmptyObject(manage_request)){
            $.post('/draw/home/', manage_request, function(data){
                if("error" in data){
                    alert(data['error']);
                }
                else{
                    fileChanged = true;
                    $('.popover-mask').fadeOut(100);
                    $this.closest('.md-popover').slideUp(200);
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
                }
            });
        }
    });

    /*---------关闭或刷新页面时，对更改文件的保存--------*/
    window.onbeforeunload = function(e){
        console.log("__Do__: check leave")
        if(fileChanged){
            //        setTimeout(doSaveAs, 0);
            return "文件已修改，是否保存更改"
        }
    }
    $(".saveAs").click(function(){
        console.log(file_uploaded);
        if(file_uploaded){
            window.open("/draw/file/download.gml");
        }else{
            alert("请先上传文件");
        }


    })
});

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

$(document).ready(function(){
    $("#set_important_node_div input.btn.ep_submit").click(function(){
        var $this = $(this);
        var $hint = $this.closest(".pop-body").find("span");
        $hint.find(".msg").remove();
        var $val = $this.parent().prev().find('.form-control').val();

        if($val == ""){
            var errorMsg = "请输入IP";
            $hint.addClass("msg onError").text(errorMsg);
        }
        else if(!ip_ret.test($val)){
            var errorMsg = "输入错误";
            $hint.addClass("msg onError").text(errorMsg);
        }
        else  if(ip_ret.test($val)){
            $('.popover-mask').fadeOut(100);
            $("#set_important_node_div").slideUp(200);
            var errorMsg = "输入正确";
            $hint.addClass("msg onSuccess").text(errorMsg);
//            temp_IMP_node = $val;
            IMP_node = $val;
//            IMP_C = "";

            $("#svg_graph").html("");
            $("#svg_hierarchic").html("");
            $("#svg_sub_graph").html("");
            graph_show(django_data);
        }
    });
});

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
//    console.log("__func__ : plot_sub_graph()");
    sub_graphs = G_sub_graphs;
    clustering = clustering;
    sub_graph = std_graph(JSON.parse(G_sub_graphs[sub_graph_id]), clustering);

    show_graph_info(sub_graph);
    multi_force(sub_graph, clustering, svg_id);
//    test(sub_graph, clustering, svg_id)
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
