import { Hono } from 'hono';

export const nodeRouter = new Hono();

nodeRouter.post('/update', async (c) => {
  // 从请求体中解析字段
  const { nodeId, remainingDiskSpace } = await c.req.json();

  if (!nodeId || remainingDiskSpace === undefined ) {
    return c.text('Invalid data', 400);
  }

  // 构建 status 对象并添加当前时间戳
  const status = {
    nodeId,
    remainingDiskSpace,
    timestamp: Date.now(),
  };

  // 使用全局唯一 ID 获取 Durable Object
  const id = c.env.NODE_STATUS.idFromName('global-node-status'); // 全局唯一的 Durable Object 名称
  const durableObject = c.env.NODE_STATUS.get(id);

  // 使用完整的 URL 构造 `fetch` 请求
  const durableObjectUrl = new URL('/nodestatus/update', c.req.url).toString();

  // 向 Durable Object 发起请求
  const response = await durableObject.fetch(durableObjectUrl, {
    method: 'POST',
    body: JSON.stringify(status),
  });

  return response;
});

nodeRouter.get('/status', async (c) => {
  // 获取全局 Durable Object 实例
  const id = c.env.NODE_STATUS.idFromName('global-node-status');
  const durableObject = c.env.NODE_STATUS.get(id);

  // 使用完整的 URL 构造 `fetch` 请求
  const durableObjectUrl = new URL('/nodestatus/status', c.req.url).toString();

  // 直接向 Durable Object 请求所有节点的 /status
  const response = await durableObject.fetch(durableObjectUrl);
  
  // 检查是否成功，避免解析错误
  if (response.status === 200) {
    const allStatuses = await response.json();
    return c.json(allStatuses);
  } else {
    return c.text('Status not found', 404);
  }
});

// 添加删除节点的 `DELETE` 路由
nodeRouter.delete('/:nodeId', async (c) => {
  const nodeId = c.req.param('nodeId');

  if (!nodeId) {
    return c.text('Node ID not specified', 400);
  }

  const id = c.env.NODE_STATUS.idFromName('global-node-status');
  const durableObject = c.env.NODE_STATUS.get(id);

  // 向 Durable Object 发起 `DELETE` 请求删除节点状态
  const durableObjectUrl = new URL(`/nodestatus/node/${nodeId}`, c.req.url).toString();
  const response = await durableObject.fetch(durableObjectUrl, { method: 'DELETE' });

  if (response.status === 200) {
    return c.text(`Node ${nodeId} deleted successfully`, 200);
  } else {
    return c.text('Failed to delete node', 500);
  }
});