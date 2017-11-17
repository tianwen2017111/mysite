#coding: utf-8
# import networkx as nx
import copy
from graph_utils import *
from cluster_method import clustering_by_ip, clustering_by_modularity
import sys
LOG_TAG = "interface"

#根据聚类结果重构图信息
def get_hierarchic_graphs(G, clustering, with_neighbors):
    print "LOG_TAG:", LOG_TAG, ",  lineNumber:", sys._getframe().f_lineno, ",  func:", sys._getframe().f_code.co_name
    new_graph = nx.Graph()
    sub_graph_nodes = dict()
    sub_node_bunches = dict()
    G_sub_graphs = dict()
    clustering_list = [i for i in clustering.values()]
    for i in range(max(clustering_list)+1):
        new_graph.add_node(i, {"id": i, "label": str(i)})
        sub_nodes = [idx for idx, label in enumerate(clustering_list) if label==i]
        sub_node_bunches[i] = sub_nodes

    for i in range(max(clustering_list)+1):
        for j in range(i+1, max(clustering_list)+1):
            i_j_weight = compute_weight(G, sub_node_bunches.get(i), sub_node_bunches.get(j))
            if i_j_weight != 0:
                new_graph.add_edge(i,j,weight=i_j_weight)

    if with_neighbors is False:
        for i in sub_node_bunches.keys():
            sub_graph = nx.subgraph(G, sub_node_bunches[i])
            G_sub_graphs[i] = sub_graph
            sub_graph_nodes[i] = sub_graph.nodes()

    if with_neighbors is True:
        for i in sub_node_bunches.keys():
            sub_nodes = nx.node_boundary(G, sub_node_bunches[i])
            sub_nodes.extend(sub_node_bunches[i])
            G_sub_graphs[i] = nx.subgraph(G, sub_nodes)
            sub_graph_nodes[i] = sub_nodes

    return new_graph, sub_graph_nodes, G_sub_graphs


def find_community(G, algorithm, ip_seg=2, with_neighbors=True):
    print "LOG_TAG:", LOG_TAG, ",  lineNumber:", sys._getframe().f_lineno, ",  func:", sys._getframe().f_code.co_name
    # import cluster as clstr
    import json
    if "ip" in algorithm:
        clustering = clustering_by_ip(G, ip_seg=ip_seg)
    if "modularity" in algorithm:
        clustering = clustering_by_modularity(G, iterations=5)
    G_parent, G_sub_nodes, G_sub_graphs = get_hierarchic_graphs(G, clustering, with_neighbors)
    G_parent = nx_to_json(G_parent)
    for k in G_sub_graphs.keys():
        G_sub_graphs[k] = nx_to_json(G_sub_graphs[k])
    return G_parent, G_sub_graphs, json.dumps(clustering)


#------------从数据库中查询ip信息---------------
def checkIpInfo(request):
    print "LOG_TAG:", LOG_TAG, ",  lineNumber:", sys._getframe().f_lineno, ",  func:", sys._getframe().f_code.co_name
    ip = request.GET['ip']

    # t = ipInfo.objects.filter(ip=ip)
    # if len(t) == 0:
    #     ip_info = 'no record!'
    # else:
    #     ip_info = t[0].information
    # info = {"info": ip_info}
    # return info
    # import sqlite3, os
    # ip = '1'
    # BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    # db_file = os.path.join(BASE_DIR, 'test.db')
    # cx = sqlite3.connect(db_file)
    # cu = cx.cursor()
    # cu.execute("select ip from ip")
    # res = cu.fetchall()
    #
    # print 'row:', cu.rowcount
    # print 'desc:', cu.description
    # for line in res:
    #     # print line
    #     if ip in line:
    #         print line
    # cu.close()
    # cx.close()


#------------"查询节点"功能---------
def search_node(G, node_label, hop):
    print "LOG_TAG:", LOG_TAG, ",  lineNumber:", sys._getframe().f_lineno, ",  func:", sys._getframe().f_code.co_name
    # import networkx as nx
    result = ''
    nbunch = dict()

    # find check node id, add it into nbunch
    for id in G.nodes():
        node = G.node[id]
        if node['label'] == node_label:
            nbunch[0] = [node['id']]

    if nbunch.has_key(0):
        node_cc = nx.node_connected_component(G, nbunch.get(0)[0])
        node_cc_graph = nx.subgraph(G, node_cc)
        d = nx.diameter(node_cc_graph)

        if(hop > d):
            result = 'hop error'
        else:
            for hop_iter in range(1, hop+1):
                temp_bunch = nbunch[hop_iter-1]
                neighbors = list()
                for n in temp_bunch:
                    n_neighbors = nx.neighbors(G, n)
                    neighbors.extend(n_neighbors)
                neighbors.extend(temp_bunch)
                nbunch[hop_iter] = list(set(neighbors))
            # result = nbunch[hop]
        result = nx_to_json(nx.subgraph(G, nbunch[hop]))
    return result


#------------过滤节点--------------
def myfilter(G, filter_condition):
    print "LOG_TAG:", LOG_TAG, ",  lineNumber:", sys._getframe().f_lineno, ",  func:", sys._getframe().f_code.co_name
    import re
    filter_pattern = filter_condition.replace('*','(25[0-5]|2[0-4]\d|[01]?\d\d?)').replace('.','\.')
    p = re.compile('%s'%filter_pattern)
    node_bunch = list()
    for id in G.nodes():
        label = G.node[id]['label']
        if p.match(label):
            node_bunch.append(id)
    if node_bunch:
        filter_result = nx_to_json(nx.subgraph(G, node_bunch))
    else:
        filter_result = ''
    return filter_result


#-----------删除节点---------------
def del_node(G, ip):
    print "LOG_TAG:", LOG_TAG, ",  lineNumber:", sys._getframe().f_lineno, ",  func:", sys._getframe().f_code.co_name
    ip_id = find_node_id(G, ip)
    result = dict()
    if ip_id is None:
        error = "无此节点，请重新输入"
        # error = "error"
        result['error'] = error
        # return error
    else:
        G.remove_node(ip_id)
        result['G'] = G
    return result


#------------删除边------------------
def del_edge(G, source_ip, target_ip):
    print "LOG_TAG:", LOG_TAG, ",  lineNumber:", sys._getframe().f_lineno, ",  func:", sys._getframe().f_code.co_name
    result = dict()
    source_ip_id = find_node_id(G, source_ip)
    target_ip_id = find_node_id(G, target_ip)
    print nx.all_neighbors(G,source_ip_id)
    if source_ip_id is None:
        error = u"%s 不存在，请检查输入" %source_ip
        result['error'] = error
    elif target_ip_id is None:
        error = u"%s 不存在，请检查输入" %target_ip
        result['error'] = error
    elif not check_edge_exist(G, source_ip_id, target_ip_id):
        print "edge not in graph"
        error = u"边不存在，请检查输入"
        result['error'] = error
    else:
        G.remove_edge(source_ip_id, target_ip_id)
        result['G'] = G
    return result


#------------增加节点------------------
def my_add_node(G, ip):
    print "LOG_TAG:", LOG_TAG, ",  lineNumber:", sys._getframe().f_lineno, ",  func:", sys._getframe().f_code.co_name
    result = dict()
    id_exist = find_node_id(G, ip)
    if id_exist is None:
        _my_add_node(G, ip)
        result['G'] = G
    else:
        result['error'] = "节点已存在，请勿重复添加"
    return result


def _my_add_node(G, ip):
    print "LOG_TAG:", LOG_TAG, ",  lineNumber:", sys._getframe().f_lineno, ",  func:", sys._getframe().f_code.co_name
    nodes_id = [i for i in G.nodes()]
    max_id = max(nodes_id)
    new_node_id = max_id + 1
    G.add_node(new_node_id)
    G.node[new_node_id]['id'] = new_node_id
    G.node[new_node_id]['label'] = ip.decode("utf-8")
    # return G


#------------增加边------------------
def my_add_edge(G, source_ip, target_ip):
    print "LOG_TAG:", LOG_TAG, ",  lineNumber:", sys._getframe().f_lineno, ",  func:", sys._getframe().f_code.co_name
    result = dict()
    source_ip_id = find_node_id(G, source_ip)
    target_ip_id = find_node_id(G, target_ip)
    if source_ip_id and target_ip_id:
        if target_ip_id in G.adj[source_ip_id].keys():
            result['error'] = "边已存在，请勿重复添加"
        else:
            G.add_edge(source_ip_id, target_ip_id)
            result['G'] = G
    else:
        if source_ip_id is None and target_ip_id is None:
            source_ip_id = G.number_of_nodes()
            target_ip_id = G.number_of_nodes()+1
            _my_add_node(G, source_ip)
            _my_add_node(G, target_ip)
        elif source_ip_id is None:
            source_ip_id = G.number_of_nodes()
            _my_add_node(G, source_ip)
        elif target_ip_id is None:
            target_ip_id = G.number_of_nodes()
            _my_add_node(G, target_ip)
        G.add_edge(source_ip_id, target_ip_id)
        result['G'] = G
    return result

if __name__ == '__main__':
    file_path = r'G:\study\2017\fifty_seven\ComplexNetwork\data_set\data.gml'
    G = import_graph(file_path)
    temp_G = copy.deepcopy(G)
    # result = my_add_node(G,'192.168.8.9')
    # result = my_add_edge(G, '192.168.8.92', '192.166.6.5')
    # print result
    result = del_edge(G, '128.0.0.143', '128.0.0.235')
    print result
    # result = del_node(temp_G, '192.168.7.2')
    # G_parent, G_sub_graphs, clustering = find_community(G=result['G'],
    #                                                     algorithm="ip_seg",
    #                                                     ip_seg=2,
    #                                                     with_neighbors=True)
    #
    # nx.write_gml(result['G'], 'temp.gml')
    # import os
    # tm = os.path.dirname(os.path.abspath(__file__))
    # print tm
    # H = import_graph(os.path.join(tm, 'temp.gml'))
    # print H.nodes()