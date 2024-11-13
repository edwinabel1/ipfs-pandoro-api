import { Hono } from 'hono';
import { nodeRouter } from './routes/node';
import { fileRouter } from './routes/file';
import { NodeStatus } from './objects/NodeStatus'; // 引入 NodeStatus Durable Object
import { FileStatus } from './objects/FileStatus';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// 路由
app.route('/node', nodeRouter);
app.route('/file', fileRouter);

// 导出 NodeStatus Durable Object 类
export { NodeStatus };
export { FileStatus };

export default app;
