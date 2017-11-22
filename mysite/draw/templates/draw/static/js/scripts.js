var isfileChanged = false; //全局变量，监控文件是否被修改

$(document).ready(function(){

    /*----------------文件是否上传的验证-------------*/
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

    /*---------关闭或刷新页面时，提示对更改文件的保存--------*/
    window.onbeforeunload = function(e){
        console.log("__Do__: check leave")
        if(isfileChanged){
            //        setTimeout(doSaveAs, 0);
            return "文件已修改，是否保存更改"
        }
    }

    /*-----------下载功能的实现接口------------------*/
    $(".saveAs").click(function(){
        if(file_uploaded){
            window.open("/draw/file/download.gml");
        }else{
            alert("请先上传文件");
        }
    })

    /*-------------获取“设置”表单的属性,将数据发送给后端，并接收后端回传的数据----------*/
    $("#settings_submit_btn").click(function(){
        console.log("__Do__: settings");
        var form_data = {};
//        form_data["clustering_method"] = $(":radio[name='clustering_method']:checked").val();
        form_data["clustering_method"] = "ip_seg";
        form_data["choose_ip_seg"] = $(":radio[name='choose_ip_seg']:checked").val();
        form_data["with_neighbors"] = $(":radio[name='with_neighbors']:checked").val();
        console.log(form_data);
        $.post('/draw/home/', form_data, function(data){
            django_data = {
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

    /*-------------数据库查询功能的接口----------------------*/
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

    /*-------------'查询节点'功能的输入验证及实现接口-------------------*/
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

                    cls = set_specific_cluster(clustering, JSON.parse(data['hop_nbunch']));
                    multi_force(Graph, cls, 'svg_sub_graph', search_input);
                    $("#svg_graph").hide();
                    $("#svg_hierarchic").hide();
                    $("#svg_sub_graph").show();
                }
            });//向后台发送数据
        }
    });

    /*-------------'过滤'功能的输入验证及实现接口-------------------*/
    $("#filter_submit_btn").click(function(){
        var $filter = $("input:text[name='filter']"),
            $filter_condition = $("input:text[name='filter_condition']");
        console.log($filter.val());
        console.log($filter_condition.val());
//        var $prev_span = $(this).prevAll("span");
//        $prev_span.find(".msg").remove();
//        var filter_input = $("input:text[name='filter_input']").val(),
//            filter_request = {};
//        var filter_pattern = /^((?:((?:25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))|\*)\.){3}((?:25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))|\*))$/;
//
//        if(filter_input == ""){
//            errorMsg = "*请输入过滤条件"
//            $prev_span.addClass("msg onError").text(errorMsg);
//        }
//        else if(!filter_pattern.test(filter_input)){
//            errorMsg = "*输入错误"
//            $prev_span.addClass("msg onError").text(errorMsg);
//        }else if(filter_pattern.test(filter_input)){
//            $prev_span.addClass("msg onSuccess").text("输入正确");
//            filter_request['filter_condition'] = filter_input;
//            console.log("__Do__ : filter nodes, filter_condition: " + filter_input);
//            $.post('/draw/home/', filter_request, function(data){
//                if(data['filter_result'] == ''){
//                    alert('无匹配项， 请重新输入');
//                }
//                else{
//                    $("#svg_sub_graph").html("");
//                    Graph = JSON.parse(data['filter_result']);
//                    show_graph_info(Graph);
//                    multi_force(Graph, clustering, 'svg_sub_graph');
//                    $("#svg_graph").hide();
//                    $("#svg_hierarchic").hide();
//                    $("#svg_sub_graph").show();
//                }
//            });//向后台发送数据
//        }
    });

    /*-------------'数据操作'的弹框效果----------------*/
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
            if($this.hasClass("add_attr")){
                 $('#add_attr_div').slideDown(200);
            }
            if($this.hasClass("del_attr")){
                 $('#del_attr_div').slideDown(200);
            }
        }
    });
    $(".pop-title .close, .pop-body input.btn.cancel").click(function(){
        /*-------关闭弹框-------*/
        $('.popover-mask').fadeOut(100);
        $(this).closest('.md-popover').slideUp(200);
    });

    /*----------'数据操作'的输入验证-----------*/
    $(".pop-body input.ip").blur(function(){
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

    /*----------'增加节点属性'功能的输入验证（仅验证输入是否为空）-----------*/
    $(".pop-body input.form-control").blur(function(){
        var $next = $(this).next("span");
        $next.find(".msg").remove();
        $val = $.trim($(this).val());
        if($val == ""){
            var errorMsg = "输入不能为空";
            $next.addClass("msg onError").text(errorMsg);
        }

    });

    /*----------‘删除节点属性’功能中复选框的显示与隐藏-----------*/
    $("#del_attr_div input.form-control").blur(function(){
        var $this = $(this);
        var $ip = $.trim($this.val());
        var temp_nodes = django_data['G'].nodes;
        var attr_num = 0;
        if($ip == ''){
            //如果输入为空，则隐藏复选框
            $("#ckb").prev("strong").hide();
            $("#ckb").empty();
        }
        else{
            //否则动态显示可删除的属性，并改变div高度
            for(i=0; i<temp_nodes.length; i++){
                if(temp_nodes[i]['label'] == $ip){
                    var attr_key_arr = '';
                    for(var key in temp_nodes[i]){
                        //遍历该节点属性
                        if((key!='id') && (key!='label')){
                            //id和label这两个属性不能被删除
                            attr_num += 1;
                            attr_key_arr += '<input type="checkbox"  name="attr_list"><label>' + key + '</label>:  ' + temp_nodes[i][key] + '<br>'
                        }
                    }
                    if(attr_num == 0){
                        $("#ckb").prev("strong").hide();
                        $("#ckb").html("该节点无可删除的属性").css("font-size", '18px');
                        $("#del_attr_div").height(330);
                    }
                    else{
                        $("#ckb").prev("strong").show();//显示"属性列表"文本
                        $("#ckb").empty().append(attr_key_arr);//显示可删除的属性选项
                        if(attr_num > 2){
                            //动态增加div高度，以适应文本变化
                            $("#del_attr_div").height($("#del_attr_div").height() + 50);
                        }
                    }
                }//end if(temp_nodes[i]['label'] == $ip)
            }//end for
        }//end else
    });

    /*----------'数据操作'的实现接口-----------*/
    $(".pop-body input.btn.submit").click(function(){
        var $this = $(this);
        var $parent = $this.closest("div.md-popover");
        var manage_request = {};

        if( $parent.hasClass('del_node')){
            $val = $this.parent().prev().find('.form-control').val();
            if(ip_ret.test($val)){
                manage_request['manage_type'] = 'del_node';
                manage_request['ip'] = $val;
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
                manage_request['ip'] = $val;
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

        else if($parent.hasClass('add_attr')){
            $ip = $this.parent().prevAll().find('.ip').val();
            $key = $this.parent().prevAll().find('.key').val();
            $value = $this.parent().prevAll().find('.value').val();
            if(ip_ret.test($ip) && $key && $value){
                manage_request['manage_type'] = 'add_attr';
                manage_request['ip'] = $ip;
                manage_request['attr_key'] = $key;
                manage_request['attr_value'] = $value;
            }
        }

        else if($parent.hasClass('del_attr')){
            $ip = $this.parent().prevAll().find('.ip').val();
            $key = [];
            $('input[name="attr_list"]:checked').each(function(){
                $key.push($(this).next().text());
            });
            if($key.length == 0){}
           else if(ip_ret.test($ip)){
                manage_request['manage_type'] = 'del_attr';
                manage_request['ip'] = $ip;
                manage_request['attr_key'] = $key;
            }
        }

        if(!$.isEmptyObject(manage_request)){
            console.log(manage_request);
            jQuery.ajaxSettings.traditional = true;
            $.post('/draw/home/', manage_request, function(data){
                if("error" in data){
                    alert(data['error']);
                }
                else{
                    isfileChanged = true;
                    $('.popover-mask').fadeOut(100);
                    $this.closest('.md-popover').slideUp(200);
                    django_data = {
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


    /*-----------'设置中心节点'的实现----------------*/
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

});