export class FileStatus {
  storage: DurableObjectStorage;
  bucket: R2Bucket;

  constructor(state: DurableObjectState, env: any) {
    this.storage = state.storage;
    this.bucket = env.BUCKET; // 确保传入的 env 中包含 BUCKET
  }

  async checkFileInR2AndGetReplicaCount(
    fileId: string
  ): Promise<number | null> {
    console.log("checkFileInR2AndGetReplicaCount");
    console.log(fileId);
    try {
      const object = await this.bucket.head(fileId);
      if (!object) {
        console.log(`File ${fileId} does not exist in R2.`);
        return null;
      }
      const replicaCount = object.customMetadata?.replicaCount;
      return replicaCount ? parseInt(replicaCount, 10) || 2 : 2;
    } catch (error) {
      console.error(`Failed to check file ${fileId} in R2:`, error);
      return null;
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const fileId = url.searchParams.get("file_id");
    const nodeId = url.searchParams.get("node_id");

    if (pathname.startsWith("/filestatus/assign") && fileId && nodeId) {
      return await this.assignNodeToFile(fileId, nodeId);
    } else if (
      pathname.startsWith("/filestatus/complete") &&
      fileId
    ) {
      return await this.completeNodeTask(fileId);
    } else if (pathname.startsWith("/filestatus/status/")) {
      if (pathname === "/filestatus/status/all") {
        return await this.getAllFileStatuses();
      } else {
        const statusFileId = pathname.replace("/filestatus/status/", ""); // 移除前缀，保留文件ID部分
        return await this.getFileStatus(statusFileId);
      }
    } else if (pathname.startsWith("/filestatus/lock") && fileId) {
      return await this.lockFile(fileId);
    } else if (pathname.startsWith("/filestatus/unlock") && fileId) {
      return await this.unlockFile(fileId);
    } else if (pathname.startsWith("/filestatus/delete") && fileId) {
      return await this.deleteFileStatus(fileId);
    }
    return new Response("Not Found.", { status: 404 });
  }

  async assignNodeToFile(fileId: string, nodeId: string): Promise<Response> {
    // 获取已存在的文件数据（假设 getFileStatus 已经初始化过此文件）
    const fileData = await this.storage.get(fileId);

    // 确保文件数据存在
    if (!fileData) {
      return new Response("File not found", { status: 404 });
    }

    // 检查节点是否已领取该文件
    if (fileData.assignedNodes.includes(nodeId)) {
      return new Response("Node already assigned", { status: 200 });
    }

    // 添加节点到领取集合并更新文件数据
    fileData.assignedNodes.push(nodeId);
    await this.storage.put(fileId, fileData);
    return new Response("Node assigned", { status: 200 });
  }

  async completeNodeTask(fileId: string): Promise<Response> {
    const fileData = await this.storage.get(fileId);
    if (!fileData) {
      return new Response("File not found", { status: 404 });
    }
    fileData.completedReplicas = fileData.completedReplicas + 1;
	await this.storage.put(fileId, fileData);
    if (fileData.replicaCount <= fileData.completedReplicas) {
      return new Response("File replicas completed", { status: 200 });
    } else {

      return new Response("File replica count updated", { status: 200 });
    }
  }

  async getFileStatus(fileId: string): Promise<Response> {
    let fileData = await this.storage.get(fileId);
    if (fileData) {
      return new Response(JSON.stringify(fileData), { status: 200 });
    }
    const replicaCount = await this.checkFileInR2AndGetReplicaCount(fileId);
    if (replicaCount !== null) {
      fileData = {
        fileId,
        replicaCount,
        assignedNodes: [],
        completedReplicas: 0,
        lockCount: 0,
      };
      await this.storage.put(fileId, fileData);
      return new Response(JSON.stringify(fileData), { status: 200 });
    }
    return new Response("File not found", { status: 404 });
  }

  async lockFile(fileId: string): Promise<Response> {
    const fileData = (await this.storage.get(fileId)) || { lockCount: 0 };
    fileData.lockCount += 1;
    await this.storage.put(fileId, fileData);
    return new Response(
      `File locked. Current lock count: ${fileData.lockCount}`,
      { status: 200 }
    );
  }

  async unlockFile(fileId: string): Promise<Response> {
    const fileData = await this.storage.get(fileId);
    if (!fileData || !fileData.lockCount || fileData.lockCount === 0) {
      return new Response("File is not currently locked", { status: 200 });
    }
    fileData.lockCount = Math.max(0, fileData.lockCount - 1);
    await this.storage.put(fileId, fileData);
    return fileData.lockCount === 0
      ? new Response("File completely unlocked", { status: 200 })
      : new Response(
          `Lock count decreased. Current lock count: ${fileData.lockCount}`,
          { status: 200 }
        );
  }

  async deleteFileStatus(fileId: string): Promise<Response> {
    await this.storage.delete(fileId);
    return new Response(`File ${fileId} status deleted`, { status: 200 });
  }

  // 获取 Durable Object 存储中所有文件状态信息
  async getAllFileStatuses(): Promise<Response> {
    const statuses: Record<string, unknown>[] = [];

    try {
      // 使用 Durable Object 的 list 方法遍历所有文件的状态
      const listItems = await this.storage.list();

      for (const [fileId, fileData] of listItems.entries()) {
        statuses.push({ fileId, ...fileData });
      }

      return new Response(JSON.stringify(statuses), { status: 200 });
    } catch (error) {
      console.error("Failed to retrieve all file statuses:", error);
      return new Response("Error retrieving file statuses", { status: 500 });
    }
  }
}
