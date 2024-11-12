export class NodeStatus {
  storage: DurableObjectStorage;

  constructor(state: DurableObjectState) {
    this.storage = state.storage;
  }

  async fetch(request: Request): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === '/update' && request.method === 'POST') {
      const newStatus = await request.json();
      const nodeId = newStatus.nodeId; // 假设传入的 JSON 包含 nodeId

      if (!nodeId) {
        return new Response('Missing nodeId', { status: 400 });
      }

      // 更新存储中的节点状态
      await this.storage.put(nodeId, JSON.stringify(newStatus));

      return new Response('Node status updated', { status: 200 });
    }

    if (pathname === '/status') {
      // 获取所有节点状态，按剩余磁盘空间排序
      const allStatuses = await this.storage.list();
      const sortedStatuses = Array.from(allStatuses.values())
        .map((status) => JSON.parse(status as string))
        .sort((a, b) => b.remainingDiskSpace - a.remainingDiskSpace); // 降序排序

      return new Response(JSON.stringify(sortedStatuses), { status: 200 });
    }
	
    // 新增的删除节点接口
    if (pathname.startsWith('/node/') && request.method === 'DELETE') {
      const nodeId = pathname.split('/').pop(); // 获取节点 ID
      if (!nodeId) {
        return new Response('Node ID not specified', { status: 400 });
      }

      await this.storage.delete(nodeId);
      return new Response(`Node ${nodeId} deleted`, { status: 200 });
    }

    return new Response('Not Found', { status: 404 });
  }
}
