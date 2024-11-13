export class FileStatus {
  storage: DurableObjectStorage;

  constructor(state: DurableObjectState) {
    this.storage = state.storage;
  }

async fetch(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url);
  console.log(pathname);

  // 获取查询参数中的 fileId 和 nodeId
  const fileId = new URL(request.url).searchParams.get('file_id');
  const nodeId = new URL(request.url).searchParams.get('node_id');

  // 简单的路径判断和处理
  if (pathname.startsWith('/assign')) {
    if (fileId && nodeId) {
      return await this.assignNodeToFile(fileId, nodeId);
    } else {
      return new Response('Missing file_id or node_id', { status: 400 });
    }
  } else if (pathname.startsWith('/complete')) {
    if (fileId && nodeId) {
      return await this.completeNodeTask(fileId, nodeId);
    } else {
      return new Response('Missing file_id or node_id', { status: 400 });
    }
  } else if (pathname.startsWith('/status/')) {
    // 获取状态，路径为 /status/:fileId
    const statusFileId = pathname.split('/').pop();
    return await this.getFileStatus(statusFileId);
  } else if (pathname.startsWith('/lock')) {
    return await this.lockFile(fileId);
  } else if (pathname.startsWith('/unlock')) {
    return await this.unlockFile(fileId);
  } else if (pathname.startsWith('/delete')) {
    return await this.deleteFileStatus(fileId);
  } else {
    return new Response('Not Found.', { status: 404 });
  }
}

  async assignNodeToFile(fileId: string, nodeId: string): Promise<Response> {
    const fileData = await this.storage.get(fileId) || { nodes: [], replicaCount: 2 }; // 初始副本数为 2
    if (fileData.nodes.includes(nodeId)) {
      return new Response('Node already assigned', { status: 200 });
    }
    fileData.nodes.push(nodeId);
    await this.storage.put(fileId, fileData);
    return new Response('Node assigned', { status: 200 });
  }

  async completeNodeTask(fileId: string, nodeId: string): Promise<Response> {
    const fileData = await this.storage.get(fileId);
    if (!fileData) {
      return new Response('File not found', { status: 404 });
    }
    fileData.replicaCount -= 1;
    if (fileData.replicaCount <= 0) {
      await this.deleteFileStatus(fileId);
      return new Response('File replicas completed and status deleted', { status: 200 });
    } else {
      await this.storage.put(fileId, fileData);
      return new Response('File replica count updated', { status: 200 });
    }
  }

  async getFileStatus(fileId: string): Promise<Response> {
    const fileData = await this.storage.get(fileId);
    return fileData
      ? new Response(JSON.stringify(fileData), { status: 200 })
      : new Response('File not found', { status: 404 });
  }

  async lockFile(fileId: string): Promise<Response> {
    const fileData = await this.storage.get(fileId) || { locked: false };
    if (fileData.locked) {
      return new Response('File already locked', { status: 200 });
    }
    fileData.locked = true;
    await this.storage.put(fileId, fileData);
    return new Response('File locked', { status: 200 });
  }

  async unlockFile(fileId: string): Promise<Response> {
    const fileData = await this.storage.get(fileId) || { locked: false };
    if (!fileData.locked) {
      return new Response('File already unlocked', { status: 200 });
    }
    fileData.locked = false;
    await this.storage.put(fileId, fileData);
    return new Response('File unlocked', { status: 200 });
  }

  async deleteFileStatus(fileId: string): Promise<Response> {
    await this.storage.delete(fileId);
    return new Response(`File ${fileId} status deleted`, { status: 200 });
  }
}
