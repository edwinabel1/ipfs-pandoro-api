import { Hono } from 'hono';
import { nodeRouter } from './routes/node';
import { NodeStatus } from './objects/NodeStatus'; // 引入 NodeStatus Durable Object

const app = new Hono<{ Bindings: CloudflareBindings }>();

// 路由
app.route('/node', nodeRouter);

// 导出 NodeStatus Durable Object 类
export { NodeStatus };

export default app;
