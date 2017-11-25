# coding: utf-8
from graph_utils import *


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
            try:
                std_ip[vtx['id']] = unicode(socket.inet_ntoa(struct.pack("=l", int(vtx['label']))))
            except:
                print "第", id, "个节点ip地址错误"
        # print std_ip
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


if __name__ == '__main__':
    file_path = r'G:\study\2017\fifty_seven\ComplexNetwork\data_set\ip_test.gml'
    G = import_graph(file_path)
    c = clustering_by_ip(G)







