# coding: utf-8
# import networkx as nx
from graphUtils import find_node_id


def del_node(G, ip):
    ip_id = find_node_id(G, ip)
    if ip_id is not None:
        G.remove_node(ip_id)
        return G
    else:
        error = "无此节点，请重新输入"
        return error


def del_edge(G, source_ip, target_ip):
    source_ip_id = find_node_id(G, source_ip)
    target_ip_id = find_node_id(G, target_ip)
    if source_ip_id is None:
        error = "%s 不存在，请检查输入" %source_ip
        return error
    elif target_ip_id is None:
        error = "%s 不存在，请检查输入" %target_ip
        return error
    else:
        G.remove_edge(source_ip_id, target_ip_id)
        return G


def my_add_node(G, ip):
    nodes_id = [i for i in G.nodes()]
    max_id = max(nodes_id)
    new_node_id = max_id + 1
    G.add_node(new_node_id)
    G.node[new_node_id]['id'] = new_node_id
    G.node[new_node_id]['label'] = ip.decode("utf-8")
    return G


def my_add_edge(G, source_ip, target_ip):
    pass