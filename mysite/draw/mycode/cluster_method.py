# coding: utf-8
import networkx as nx
from graphUtils import *


def clustering_by_modularity(G, iterations=5):
    """
    The vertices in the graph will be clustered into different classes
    according to the degree of modularity

    Parameters
    ----------
    G : NetworkX graph

    iterations : int or None(default=5), the iteration times

    """

    try:
        import random
    except ImportError:
        raise ImportError('community_detection requires random')

    i = 0
    clustering = {}
    while i < iterations:
        i += 1
        community = range(G.number_of_nodes())  # 初始化，将每个节点当做一个社区
        # community = G.nodes()
        edge_items = G.edge.items()  # 打乱节点的顺序，从任意节点开始搜索
        random.shuffle(edge_items)
        for vtx, adj in edge_items:
            neighbors_modularity = {}
            for neighbor in adj.keys():
                new_community = list()
                temp_Q1 = modularity(G, community)
                # 将节点vtx加入其邻居neighbor所在网络
                for idx, value in enumerate(community):
                    if value == vtx:
                        new_community.append(neighbor)
                    else:
                        new_community.append(value)
                temp_Q2 = modularity(G, new_community)
                gain_of_modularity = temp_Q2 - temp_Q1  # 计算模块度的增益
                # 将每个邻居节点对应的模块度增益存入字典neighbors_modularity
                neighbors_modularity[neighbor] = gain_of_modularity
            # 找到vtx所有邻居中能带来最大模块度增益对应的节点k
            max_modularity_neighbor = max(neighbors_modularity, key=neighbors_modularity.get)
            # 如果k对应的增益为正，将vtx加入k所在社团
            if neighbors_modularity[max_modularity_neighbor] > 0:
                for idx, value in enumerate(community):
                    if value == vtx: community[idx] = max_modularity_neighbor
            else:
                pass
        clustering[modularity(G, community)] = community

    max_modularity = max(clustering.keys())
    final_clustering = map_vtx_to_label(clustering.get(max_modularity))
    return final_clustering


def clustering_by_ip(G, ip_seg=2):
    try:
        import socket
    except ImportError:
        raise ImportError('The program requires socket')
    try:
        import struct
    except ImportError:
        raise ImportError('The program requires struct')

    clustering = dict()
    std_ip = dict()  # 将ip地址转换为标准的字符串表达式，即以点号分隔的形式（ip地址有可能是整数形式）

    # vtx_labels = [vtx_label['label'] for _, vtx_label in G.node.iteritems()]    #获取每个顶点的名称，即ip地址
    # map(lambda ip: std_ip.append(ip) if is_ip(ip) else std_ip.append(unicode(socket.inet_ntoa(struct.pack("=l", int(ip))))), vtx_labels)

    for id in G.node:
        vtx = G.node[id]
        if is_ip(vtx['label']):
            std_ip[vtx['id']] = vtx['label']
        else:
            std_ip[vtx['id']] = unicode(socket.inet_ntoa(struct.pack("=l", int(vtx['label']))))

        ip_segs = [ip.split('.') for ip in std_ip.values()] #取出ip地址中的字节

    # "根据ip地址区间划分社团"
    # "以'.'为间隔，将ip地址分成4部分，可以根据任意一部分进行社团划分"
    # "参数'ip_seg'为0、1、2、3，即为根据其中某一段进行社团划分"
    seg_No = ip_seg
    if seg_No > 4 or seg_No <= 0:
        raise TypeError('input error')
    if seg_No == 1:
        seg_group = set([ip[0] for ip in ip_segs])
    if seg_No == 2:
        seg_group = set([ip[0]+'.'+ip[1] for ip in ip_segs])
    if seg_No == 3:
        seg_group = set([ip[0]+'.'+ip[1]+'.'+ip[2] for ip in ip_segs])
    if seg_No == 4:
        seg_group = set(std_ip.values())

    for id in std_ip.keys():
        vtx = std_ip[id]
        label_list = vtx.split(".")[:seg_No]
        s = ".".join(label_list)
        for label, seg_item in enumerate(seg_group):
            if s == seg_item:
                clustering[id] = label
    return clustering


# def get_hierarchic_graphs(G, clustering, with_neighbors):
#     new_graph = nx.Graph()
#     sub_graph_nodes = dict()
#     sub_node_bunches = dict()
#     G_sub_graphs = dict()
#     clustering_list = [i for i in clustering.values()]
#     for i in range(max(clustering_list)+1):
#         new_graph.add_node(i, {"id": i, "label": str(i)})
#         sub_nodes = [idx for idx, label in enumerate(clustering_list) if label==i]
#         sub_node_bunches[i] = sub_nodes
#
#     for i in range(max(clustering_list)+1):
#         for j in range(i+1, max(clustering_list)+1):
#             i_j_weight = compute_weight(G, sub_node_bunches.get(i), sub_node_bunches.get(j))
#             if i_j_weight != 0:
#                 new_graph.add_edge(i,j,weight=i_j_weight)
#
#     if with_neighbors is False:
#         for i in sub_node_bunches.keys():
#             sub_graph = nx.subgraph(G, sub_node_bunches[i])
#             G_sub_graphs[i] = sub_graph
#             sub_graph_nodes[i] = sub_graph.nodes()
#
#     if with_neighbors is True:
#         for i in sub_node_bunches.keys():
#             sub_nodes = nx.node_boundary(G, sub_node_bunches[i])
#             sub_nodes.extend(sub_node_bunches[i])
#             G_sub_graphs[i] = nx.subgraph(G, sub_nodes)
#             sub_graph_nodes[i] = sub_nodes
#
#     return new_graph, sub_graph_nodes, G_sub_graphs


# def generate_new_graph(G, clustering):
#     new_graph = nx.Graph()
#     sub_graph_nodes = dict()
#
#     for i in range(max(clustering)+1):
#         new_graph.add_node(i, {"id": i, "label": str(i)})
#         sub_nodes = [idx for idx, label in enumerate(clustering) if label==i]
#         sub_graph_nodes[i] = sub_nodes
#
#     for i in range(max(clustering)+1):
#         for j in range(i+1, max(clustering)+1):
#             i_j_weight = compute_weight(G, sub_graph_nodes.get(i), sub_graph_nodes.get(j))
#             if i_j_weight != 0:
#                 new_graph.add_edge(i,j,weight=i_j_weight)
#     return new_graph, sub_graph_nodes


# def get_sub_graphs(G, sub_node_bunches, with_neighbors):
#     G_sub_graphs = dict()
#     if with_neighbors is False:
#         for i in sub_node_bunches.keys():
#             G_sub_graphs[i] = nx.subgraph(G, sub_node_bunches[i])
#
#     if with_neighbors is True:
#         for i in sub_node_bunches.keys():
#             sub_nodes = nx.node_boundary(G,sub_node_bunches[i])
#             sub_nodes.extend(sub_node_bunches[i])
#             G_sub_graphs[i] = nx.subgraph(G, sub_nodes)
#     return G_sub_graphs


# def draw_graph(G, layout='circular', colorful=True, with_labels=True, with_weight=True):
#     """
#     Draw a graph
#
#     Parameters
#     ----------
#     G : graph
#        A networkx graph
#
#     layout : string, optional
#         spring, random, shell, spectral, circular(default='circular')
#
#     colorful : bool, optional (default=True)
#
#     with_labels :  bool, optional (default=True)
#        Set to True to draw labels on the nodes.
#
#     with_weight :  bool, optional (default=True)
#        Set to True to draw edge wright on the edges.
#
#     """
#
#     try:
#         import matplotlib.pyplot as plt
#     except ImportError:
#         raise ImportError("Draw graph requires matplotlib")
#
#     # pos
#     pos = nx.circular_layout(G)
#     if 'spring' in layout:
#         pos = nx.spring_layout(G)
#     elif 'random' in layout:
#         pos = nx.random_layout(G)
#     elif 'shell' in layout:
#         pos = nx.shell_layout(G)
#     elif 'spectral' in layout:
#         pos = nx.spectral_layout(G)
#
#     # nodes
#     if colorful is True:
#         nx.draw_networkx_nodes(G, pos,
#                                node_color=range(G.number_of_nodes()),
#                                alpha=0.6)
#     else:
#         nx.draw_networkx_nodes(G, pos, alpha=0.6)
#
#     # edges
#     nx.draw_networkx_edges(G, pos,
#                            edgelist=G.edges())
#
#     # node labels
#     if with_labels is True:
#         labels = dict()
#         for vtx, vtx_label in G.node.iteritems():
#             if vtx_label:
#                 labels[vtx] = vtx_label['label']
#             else:
#                 labels[vtx] = vtx
#         nx.draw_networkx_labels(G, pos, labels=labels)
#     else:
#         nx.draw_networkx_labels(G, pos)
#
#     #edge labels
#     if with_weight is True:
#         edge_label = dict()
#         for u,v,d in G.edges(data=True):
#             if d:
#                 edge_label[u,v] = d['weight']
#             else:
#                 edge_label[u,v] = '1'
#         nx.draw_networkx_edge_labels(G, pos,
#                                      edge_labels=edge_label,
#                                      bbox=None)
#
#     plt.axis('off')
#     plt.show()


# def find_community(G, algorithm, ip_seg=2, with_neighbors=True):
#     # import cluster as clstr
#     import json
#     if "ip" in algorithm:
#         clustering = clustering_by_ip(G, ip_seg=ip_seg)
#     if "modularity" in algorithm:
#         clustering = clustering_by_modularity(G, iterations=5)
#     G_parent, G_sub_nodes, G_sub_graphs = get_hierarchic_graphs(G, clustering, with_neighbors)
#     G_parent = nx_to_json(G_parent)
#     for k in G_sub_graphs.keys():
#         G_sub_graphs[k] = nx_to_json(G_sub_graphs[k])
#     return G_parent, G_sub_graphs, json.dumps(clustering)
#
#
# def checkIpInfo(request):
#     ip = request.GET['ip']
#
#     # t = ipInfo.objects.filter(ip=ip)
#     # if len(t) == 0:
#     #     ip_info = 'no record!'
#     # else:
#     #     ip_info = t[0].information
#     # info = {"info": ip_info}
#     # return info
#     # import sqlite3, os
#     # ip = '1'
#     # BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
#     # db_file = os.path.join(BASE_DIR, 'test.db')
#     # cx = sqlite3.connect(db_file)
#     # cu = cx.cursor()
#     # cu.execute("select ip from ip")
#     # res = cu.fetchall()
#     #
#     # print 'row:', cu.rowcount
#     # print 'desc:', cu.description
#     # for line in res:
#     #     # print line
#     #     if ip in line:
#     #         print line
#     # cu.close()
#     # cx.close()
#
#
# def check_node(G, node_label, hop):
#     import networkx as nx
#     result = ''
#     nbunch = dict()
#
#     # find check node id, add it into nbunch
#     for id in G.nodes():
#         node = G.node[id]
#         if node['label'] == node_label:
#             nbunch[0] = [node['id']]
#
#     if nbunch.has_key(0):
#         node_cc = nx.node_connected_component(G, nbunch.get(0)[0])
#         node_cc_graph = nx.subgraph(G, node_cc)
#         d = nx.diameter(node_cc_graph)
#
#         if(hop > d):
#             result = 'hop error'
#         else:
#             for hop_iter in range(1, hop+1):
#                 temp_bunch = nbunch[hop_iter-1]
#                 neighbors = list()
#                 for n in temp_bunch:
#                     n_neighbors = nx.neighbors(G, n)
#                     neighbors.extend(n_neighbors)
#                 neighbors.extend(temp_bunch)
#                 nbunch[hop_iter] = list(set(neighbors))
#             # result = nbunch[hop]
#         result = nx_to_json(nx.subgraph(G, nbunch[hop]))
#     return result
#
#
# def myfilter(G, filter_condition):
#     import re
#     # filter_result = ''
#     filter_pattern = filter_condition.replace('*','(25[0-5]|2[0-4]\d|[01]?\d\d?)').replace('.','\.')
#     p = re.compile('%s'%filter_pattern)
#     node_bunch = list()
#     for id in G.nodes():
#         label = G.node[id]['label']
#         if p.match(label):
#             node_bunch.append(id)
#     if node_bunch:
#         filter_result = nx_to_json(nx.subgraph(G, node_bunch))
#     else:
#         filter_result = ''
#     return filter_result


if __name__ == '__main__':
    file_path = r'G:\study\2017\fifty_seven\ComplexNetwork\mysite\media\upload\ip_test.gml'
    G = import_graph(file_path)
    c = clustering_by_ip(G)







