# -*- coding:utf8-*-
import networkx as nx
import sys

def map_vtx_to_label(clustering):
    """将每个元素所在类别映射成其类别标签（相当于将聚类中心映射成类别标签）"""
    label_list = list()
    cluster_category = list()
    map(lambda x: cluster_category.append(x) if x not in cluster_category else None, clustering)
    for c in clustering:
        for idx, label in enumerate(cluster_category):
            if c == label: label_list.append(idx)
    return label_list


def modularity(G, clustering):
    """Calculating the modularity of the graph with respect to a given clustring
        parameter:
            G: a graph created by networkx
            clustering: a list of clustering result, such as [0,0,1,1,1,1,....]
        return:
            Q: the modularity score
            Q = sum(L_c/m) - sum((D_c/2*m)^2)
            which   m: the number of edges in the graph
                    L_c: the number of edges in the community
                    D_c: the sum of node_degree in the community"""

    e = 0.0
    a_2 = 0.0
    m = G.number_of_edges()
    cluster_degree_dict = {}
    for vtx, adj in G.edge.iteritems():
        label = clustering[vtx]
        for neighbor in adj.keys():
            if label == clustering[neighbor]:
                e += 1
            if label not in cluster_degree_dict:
                cluster_degree_dict[label] = 0
        cluster_degree_dict[label] += len(adj)
    e /= (2 * m)

    for label, cnt in cluster_degree_dict.iteritems():
        a = 0.5 * cnt / m
        a_2 += a * a
    Q = e - a_2
    return Q


def import_graph(filepath):
    try:
        import networkx
    except ImportError:
        raise ImportError('The program requires networkx')
    try:
        import os
    except ImportError:
        raise ImportError('The program requires os')
    G = networkx.read_gml(filepath)
    # G = networkx.read_graphml(filepath)
    return G


def nx_to_json(G):
    from networkx.readwrite import json_graph
    import json
    return json.dumps(json_graph.node_link_data(G))


def get_keys(d, value):
    return [k for k, v in d.items() if v == value]


def is_ip(ip):
    """判断是否为标准的ip地址表达式"""
    # print "script: graph_utils,  lineNumber:", sys._getframe().f_lineno, ",  func:", sys._getframe().f_code.co_name
    try:
        import re
    except ImportError:
        raise ImportError('The program requires re')
    p = re.compile('^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$')
    if p.match(ip):
        return True
    else:
        return False


def compute_weight(G, bunch1, bunch2):
    # print "script: graph_utils,  lineNumber:", sys._getframe().f_lineno, ",  func:", sys._getframe().f_code.co_name

    """
    计算图中bunch1和bunch2之间边的个数
    :param bunch1: list of nodes
    :param bunch2: list of nodes
    :return:
    """
    import networkx as nx
    weight = 0
    bunch1_neighbors = [edge[1] for edge in nx.edge_boundary(G, bunch1)]
    if bunch1_neighbors:
        for bunch1_neighbor in bunch1_neighbors:
            if bunch1_neighbor in bunch2:
                weight += 1
    return weight


def get_node_id(G, node_label):
    """Find node id by label"""
    # print "script: graph_utils,  lineNumber:", sys._getframe().f_lineno, ",  func:", sys._getframe().f_code.co_name,
    for id in G.nodes():
        node = G.node[id]
        if node['label'] == node_label:
            print ", IP:", node_label, ", ID:", id
            return id


def check_edge_exist(G, source, target):
    """check whether the edge exist 
        parameter:
            G : A networkx graph  
                          
            sourch : int 
                the sourch_node_id            
            
            target : int
                the target_node_id
        return:
            True if edge exist in graph          
    """
    print "script: graph_utils,  lineNumber:", sys._getframe().f_lineno, ",  func:", sys._getframe().f_code.co_name
    source_neighbors = [n for n in nx.all_neighbors(G, source)]
    if target in source_neighbors:
        return True
    else:
        return False


if __name__ == '__main__':
    G=import_graph(r'G:\study\2017\fifty_seven\ComplexNetwork\data_set\data.gml')
    check_edge_exist(G, 0, 55)
    # find_node_id(G, '128.0.0.143')
