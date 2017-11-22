$(document).ready(function(){


    /*-------------添加回车确定效果-------------------*/
    $("form.dropdown-menu, div.md-popover").keydown(function() {
        if (event.keyCode == "13") {//keyCode=13是回车键
            $(this).find("input.btn.submit").click();
        }
    });

    /*---------关闭或刷新页面时，提示对更改文件的保存--------*/
    window.onbeforeunload = function(e){
        console.log("__Do__: check leave")
        if(fileChanged){
            //        setTimeout(doSaveAs, 0);
            return "文件已修改，是否保存更改"
        }
    }

    /*-----------下载功能的实现------------------*/
    $(".saveAs").click(function(){
        if(file_uploaded){
            window.open("/draw/file/download.gml");
        }else{
            alert("请先上传文件");
        }
    })
});