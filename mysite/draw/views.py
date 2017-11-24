# coding: utf-8
from django.shortcuts import render, redirect, reverse, render_to_response
import sys
from django.conf import settings
from django.http import HttpResponse
import os, json
from .forms import UploadFileForm
from .models import UploadFile
from algo import graph_utils as gu
from algo.interface import *

def home(request):
    print "script: views.py,  lineNumber:", sys._getframe().f_lineno,  ",  requst.method: ", request.method
    global graph_loaded
    graph_loaded = "false"
    request.session.set_expiry(0)

    if request.method == "GET":
        print "script: views.py,  lineNumber: ", sys._getframe().f_lineno, ",  request.GET: ", request.GET
        if "check_ip" in request.GET.keys():
            info = checkIpInfo(request)
            return HttpResponse(json.dumps(info), content_type="application/json")
        upload_file_form = UploadFileForm()
        context = {
            "upload_file_form": upload_file_form,
            "graph_loaded": graph_loaded,
            "G": json.dumps(""),
            "G_parent": json.dumps(""),
            "G_sub_graphs": json.dumps(""),
            "clustering": json.dumps("")
        }
        return render(request, 'draw/home.html', context=context)


    if request.method == "POST":
        print "script: views.py,  lineNumber: ", sys._getframe().f_lineno, ",  request.POST: ", request.POST
        upload_file_form = UploadFileForm(request.POST, request.FILES)
        if upload_file_form.is_valid():
            graph_loaded = "true"
            file = upload_file_form.cleaned_data['upload_file']
            file_path = os.path.join(settings.MEDIA_ROOT, 'upload', file.name)
            request.session['file_path'] = file_path
            upload_file = UploadFile()
            if os.path.exists(file_path):
                os.remove(file_path)
                upload_file.file = file
                upload_file.filepath = file_path
                upload_file.filename = file.name
                upload_file.save()
            else:
                upload_file.file = file
                upload_file.filepath = file_path
                upload_file.filename = file.name
                upload_file.save()
            file_path = request.session['file_path']
            G = gu.import_graph(file_path)
            clustering_method = "ip_seg"
            choose_ip_seg = 2
            largest_cc = max(nx.connected_components(G), key=len) #求最大连通点
            cc_graph = nx.subgraph(G, largest_cc) #最大连通子图
            d = nx.diameter(cc_graph) #最大连通子图的直径
            G_parent, G_sub_graphs, clustering = find_community(G=G,
                                                               algorithm=clustering_method,
                                                               ip_seg=choose_ip_seg,
                                                               with_neighbors=True)
            context = {
                "upload_file_form": upload_file_form,
                "graph_loaded": graph_loaded,
                "G": gu.nx_to_json(G),
                "G_parent": G_parent,
                "G_sub_graphs": G_sub_graphs,
                "clustering": clustering,
                "diameter": d
            }
            return render(request, 'draw/home.html', context=context)
        if "clustering_method" in request.POST.keys():
            context = setting_form_response(request)
            return HttpResponse(json.dumps(context), content_type="application/json")

        if "search_ip" in request.POST.keys():
            G = gu.import_graph(request.session['file_path'])

            ip = request.POST['search_ip']
            hop = int(request.POST['hop'])
            search_sub_graph, hop_nbunch = search_node(G, ip, hop)
            # search_result = {"search_result": search_node(G, ip, hop)}
            # print "script: view.py, hop_nbunch: ",hop_nbunch
            search_result = {"search_result": search_sub_graph,
                             "hop_nbunch" : json.dumps(hop_nbunch)}
            return HttpResponse(json.dumps(search_result), content_type="application/json")



        if "filter_condition" in request.POST.keys():
            G = gu.import_graph(request.session['file_path'])
            filter_name = request.POST['filter']
            filter_condition = request.POST['filter_condition']
            print "filter: ", filter_name
            print "filter_condition: ", filter_condition
            filter_result = {"filter_result": my_filter(G, filter_name, filter_condition)}
            # filter_result = {"filter_result":""}
            return HttpResponse(json.dumps(filter_result), content_type="application/json")

        if "manage_type" in request.POST.keys():
            context = manage_response(request)
            return HttpResponse(json.dumps(context), content_type="application/json")


def checkIpInfo(request):
    import sqlite3
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_file = os.path.join(BASE_DIR, 'test.db')
    ip = request.GET['check_ip']
    # def getIpInfo
    ip_info = 'no record!'
    info = {"info": ip_info}
    return info


def setting_form_response(request):
    clustering_method = request.POST['clustering_method']
    choose_ip_seg = int(request.POST['choose_ip_seg'])
    if request.POST['with_neighbors'] == "yes":
        with_neighbors = True
    else:
        with_neighbors = False

    if 'file_path' in request.session:
        file_path = request.session['file_path']
        G = gu.import_graph(file_path)
        # G = request.session['G']
        G_parent, G_sub_graphs, clustering = find_community(G=G,
                                                          algorithm=clustering_method,
                                                          ip_seg=choose_ip_seg,
                                                          with_neighbors=with_neighbors)
        largest_cc = max(nx.connected_components(G), key=len)  # 求最大连通点
        cc_graph = nx.subgraph(G, largest_cc)  # 最大连通子图
        d = nx.diameter(cc_graph)  # 最大连通子图的直径
        context = {
            "graph_loaded": "true",
            "G": gu.nx_to_json(G),
            "G_parent": G_parent,
            "G_sub_graphs": G_sub_graphs,
            "clustering": clustering,
            "diameter": d
        }
    else:
        context = set_empty_context()
    return context

# 数据增删请求的响应
def manage_response(request):
    print "script: interface.py,  lineNumber:", sys._getframe().f_lineno, ",  func:", sys._getframe().f_code.co_name
    manage_type = request.POST['manage_type']
    print request.POST
    if 'file_path' in request.session:
        # import copy
        file_path = request.session['file_path']
        G = gu.import_graph(file_path)
        if manage_type == 'del_node':
            ip = request.POST['ip']
            result = del_node(G, ip)
        elif manage_type == 'del_edge':
            source_ip = request.POST['source']
            target_ip = request.POST['target']
            result = del_edge(G, source_ip, target_ip)
        elif manage_type == 'add_node':
            ip = request.POST['ip']
            result = my_add_node(G, ip)
        elif manage_type == 'add_edge':
            source_ip = request.POST['source']
            target_ip = request.POST['target']
            temp_G = copy.deepcopy(G)
            result = my_add_edge(temp_G, source_ip, target_ip)
        elif manage_type == 'add_attr':
            ip = request.POST['ip']
            attr_key = request.POST['attr_key']
            attr_value = request.POST['attr_value']
            result = add_attr(G, ip, attr_key, attr_value)
        elif manage_type == 'del_attr':
            ip = request.POST['ip']
            attr_key = request.POST.getlist('attr_key')
            result = del_attr(G, ip, attr_key)

        if "error" in result.keys():
            my_context = {"error": result['error']}
        elif 'G' in result.keys():
            new_G = result['G']
            # temp_fp = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'algo', 'temp.gml')
            # nx.write_gml(result['G'], temp_fp)
            # request.session['file_path'] = temp_fp
            nx.write_gml(result['G'], request.session['file_path'])
            G_parent, G_sub_graphs, clustering = find_community(G=new_G,
                                                                algorithm="ip_seg",
                                                                ip_seg=2,
                                                                with_neighbors=True)
            largest_cc = max(nx.connected_components(new_G), key=len)  # 求最大连通点
            cc_graph = nx.subgraph(new_G, largest_cc)  # 最大连通子图
            d = nx.diameter(cc_graph)  # 最大连通子图的直径
            my_context = {
                "graph_loaded": "true",
                "G": gu.nx_to_json(new_G),
                "G_parent": G_parent,
                "G_sub_graphs": G_sub_graphs,
                "clustering": clustering,
                "diameter": d
            }
    else:
        my_context = set_empty_context()
    return my_context


def set_empty_context():
    empty_context = {
        "graph_loaded": "false",
        "G": json.dumps(""),
        "G_parent": json.dumps(""),
        "G_sub_graphs": "",
        "clustering": "",
        "diameter": 0
    }
    return empty_context


def download(request):
    print "script: views.py,  lineNumber:", sys._getframe().f_lineno, ",  func:", sys._getframe().f_code.co_name
    # f=open('./draw/algo/temp.gml','r')
    f = open(request.session['file_path'], 'r')
    d=f.read()
    f.close()
    return HttpResponse(d, content_type="application/octet-stream")


def fileupload(request):
    print " 'view':", "fileupload",
    print " 'method': ", request.method
    # -------------------------------------
    if request.method == "POST":
        upload_file_form = UploadFileForm(request.POST, request.FILES)
        print " 'upload_file':", upload_file_form.is_valid()
        if upload_file_form.is_valid():
            # 获取表单信息
            file = upload_file_form.cleaned_data['upload_file']
            file_path = os.path.join(settings.MEDIA_ROOT, 'upload', file.name)
            # 判断文件是否存在，
            # 如果已经存在，则直接读取文件，并更新上传时间
            # 如果不存在，将相关数据写入数据库中
            upload_file = UploadFile()
            if os.path.exists(file_path):
                print "文件已存在"
            else:
                upload_file.file = file
                upload_file.filepath = file_path
                upload_file.filename = file.name
                upload_file.save()
            context = {"upload_file_form": upload_file_form}
            request.session['file_path'] = file_path
            request.session.set_expiry(0)
            return redirect(reverse('home'), request=request, context=context)
            # return render(request=request, template_name='draw/fileupload.html', context=context)
        else:
            upload_file_form = UploadFileForm()
    else:
        upload_file_form = UploadFileForm()
    return render(request, 'draw/fileupload.html',
                  {"upload_file_form": upload_file_form})


def charts(request):
    return render(request, 'draw/charts.html', {"string:" : "hello world!"})


def dataTsv(request):
    print "script: views.py,  lineNumber:", sys._getframe().f_lineno, ",  func:", sys._getframe().f_code.co_name
    tsv_path = os.path.join(settings.STATIC_ROOT, 'data', 'data.csv')
    # tsv_path = os.path.join(settings.STATIC_ROOT, 'data', 'data.tsv')
    print tsv_path
    f = open(tsv_path, 'r')
    d = f.read()
    f.close()
    # return HttpResponse(d, content_type="text/tab-separated-values")
    return HttpResponse(d, content_type="text/csv")