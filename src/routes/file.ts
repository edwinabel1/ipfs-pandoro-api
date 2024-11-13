import { Hono } from 'hono';

export const fileRouter = new Hono();

// POST /file/assign - 领取文件
fileRouter.post('/assign', async (c) => {
  const { fileId, nodeId } = await c.req.json();
  if (!fileId || !nodeId) {
    return c.text('Missing fileId or nodeId', 400);
  }

  const id = c.env.FILE_STATUS.idFromName('file-status');
  const durableObject = c.env.FILE_STATUS.get(id);

  // 拼接完整的 Durable Object 路径
  const durableObjectUrl = new URL(`/filestatus/assign?file_id=${fileId}&node_id=${nodeId}`, c.req.url).toString();
  
  // 发送请求
  const response = await durableObject.fetch(durableObjectUrl, { method: 'POST' });
  return response;
});

// POST /file/complete - 完成文件处理
fileRouter.post('/complete', async (c) => {
  const { fileId } = await c.req.json();
  if (!fileId) {
    return c.text('Missing fileId', 400);
  }

  const id = c.env.FILE_STATUS.idFromName('file-status');
  const durableObject = c.env.FILE_STATUS.get(id);

  // 拼接完整的 Durable Object 路径
  const durableObjectUrl = new URL(`/filestatus/complete?file_id=${fileId}`, c.req.url).toString();
  
  const response = await durableObject.fetch(durableObjectUrl, { method: 'POST' });
  return response;
});

// GET /file/status/:fileId - 查询文件状态
fileRouter.get('/status/:fileId', async (c) => {
  const fileId = c.req.param('fileId');
  if (!fileId) {
    return c.text('Missing fileId', 400);
  }

  const id = c.env.FILE_STATUS.idFromName('file-status');
  const durableObject = c.env.FILE_STATUS.get(id);

  // 拼接完整的 Durable Object 路径
  const durableObjectUrl = new URL(`/filestatus/status/${fileId}`, c.req.url).toString();
  console.log(durableObjectUrl);
  
  const response = await durableObject.fetch(durableObjectUrl);
  return response;
});

// POST /file/lock - 锁定文件
fileRouter.post('/lock', async (c) => {
  const { fileId } = await c.req.json();
  if (!fileId) {
    return c.text('Missing fileId', 400);
  }

  const id = c.env.FILE_STATUS.idFromName('file-status');
  const durableObject = c.env.FILE_STATUS.get(id);

  // 拼接完整的 Durable Object 路径
  const durableObjectUrl = new URL(`/filestatus/lock?file_id=${fileId}`, c.req.url).toString();

  const response = await durableObject.fetch(durableObjectUrl, { method: 'POST' });
  return response;
});

// POST /file/unlock - 解锁文件
fileRouter.post('/unlock', async (c) => {
  const { fileId } = await c.req.json();
  if (!fileId) {
    return c.text('Missing fileId', 400);
  }

  const id = c.env.FILE_STATUS.idFromName('file-status');
  const durableObject = c.env.FILE_STATUS.get(id);

  // 拼接完整的 Durable Object 路径
  const durableObjectUrl = new URL(`/filestatus/unlock?file_id=${fileId}`, c.req.url).toString();

  const response = await durableObject.fetch(durableObjectUrl, { method: 'POST' });
  return response;
});

// DELETE /file/:fileId - 删除文件
fileRouter.delete('/:fileId', async (c) => {
  const fileId = c.req.param('fileId');
  if (!fileId) {
    return c.text('Missing fileId', 400);
  }

  const id = c.env.FILE_STATUS.idFromName('file-status');
  const durableObject = c.env.FILE_STATUS.get(id);

  // 拼接完整的 Durable Object 路径
  const durableObjectUrl = new URL(`/filestatus/delete?file_id=${fileId}`, c.req.url).toString();

  const response = await durableObject.fetch(durableObjectUrl, { method: 'DELETE' });
  return response;
});
