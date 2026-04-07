import heapq


def dijkstra_optimized(graph: dict, start_node: str) -> dict:
    """
    지연 삭제(Lazy Deletion) 기법이 결합된 파이썬 내장 heapq 기반 다익스트라 알고리즘 구현체.
    
    :param graph: 딕셔너리 형태의 인접 리스트 표기 (예: {'A': {'B': 8, 'C': 3}})
    :param start_node: 경로 탐색의 기준이 되는 출발 정점
    :return: 출발 정점으로부터 그래프 내 모든 정점까지의 최단 거리가 기록된 딕셔너리
    """
    # 1. 초기화: 모든 노드에 대한 최단 거리 매핑 딕셔너리를 무한대로 설정, 시작점은 0 할당
    distances = {node: float('inf') for node in graph}
    distances[start_node] = 0
    
    # 2. 힙 큐 배열 초기화. 튜플의 첫 번째 요소를 기준으로 최소 힙이 자동 정렬됨 (거리, 노드)
    priority_queue = [(0, start_node)]
    
    # 3. 메인 탐욕 탐색 루프 전개
    while priority_queue:
        # 힙 트리 상단에서 가장 거리가 짧은 튜플 데이터 추출 (O(log V))
        current_distance, current_node = heapq.heappop(priority_queue)
        
        # [지연 삭제 핵심 로직] 꺼낸 거리가 최단 거리 딕셔너리에 기록된 값보다 크다면,
        # 과거에 들어갔던 버려진 상태 공간(Stale state)이므로 연산을 생략하고 스킵함
        if current_distance > distances[current_node]:
            continue
            
        # 4. 현재 노드에 인접한 모든 이웃 노드를 순회하며 간선 완화
        for neighbor, edge_weight in graph[current_node].items():
            # 기존 거리에 현재 간선 가중치를 더해 우회 경로의 총합 비용 산출
            alt_distance = current_distance + edge_weight
            
            # 5. 발견한 우회 경로가 기존에 알려진 최단 거리보다 우수할 때만 상태 갱신
            if alt_distance < distances[neighbor]:
                distances[neighbor] = alt_distance
                # 거리가 짧아졌으므로 힙 내의 위치를 찾는 대신 새롭게 튜플을 밀어넣음 (Lazy push)
                heapq.heappush(priority_queue, (alt_distance, neighbor))
                
    return distances


if __name__ == "__main__":
    # 알파벳 형태의 노드와 양의 가중치를 포함하는 8개 노드 복합 그래프 선언
    network_topology = {
        'A': {'B': 8, 'C': 3, 'D': 6},
        'B': {'A': 8, 'E': 5},
        'C': {'A': 3, 'D': 2},
        'D': {'A': 6, 'C': 2, 'E': 5, 'G': 3},
        'E': {'B': 5, 'D': 5, 'F': 5},
        'F': {'E': 5, 'G': 3, 'H': 6},
        'G': {'D': 3, 'F': 3, 'H': 4},
        'H': {'G': 4, 'F': 6}
    }
    
    start_point = 'A'
    result_paths = dijkstra_optimized(network_topology, start_point)
    
    print(f"=== 탐색 완료: 기준 정점 [{start_point}]의 최단 경로 분석 도표 ===")
    for target_node, min_cost in sorted(result_paths.items()):
        print(f"목적지 [{target_node}] 도달 최소 누적 비용 => {min_cost}")
