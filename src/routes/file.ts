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
  const response = await durableObject.fetch(`/assign?file_id=${fileId}&node_id=${nodeId}`);
  return response;
});

// POST /file/complete - 完成文件处理
fileRouter.post('/complete', async (c) => {
  const { fileId, nodeId } = await c.req.json();
  if (!fileId || !nodeId) {
    return c.text('Missing fileId or nodeId', 400);
  }

  const id = c.env.FILE_STATUS.idFromName('file-status');
  const durableObject = c.env.FILE_STATUS.get(id);
  const response = await durableObject.fetch(`/complete?file_id=${fileId}&node_id=${nodeId}`);
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
  const response = await durableObject.fetch(`/status/${fileId}`);
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
  const response = await durableObject.fetch(`/lock?file_id=${fileId}`);
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
  const response = await durableObject.fetch(`/unlock?file_id=${fileId}`);
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
  const response = await durableObject.fetch(`/delete?file_id=${fileId}`);
  return response;
});
