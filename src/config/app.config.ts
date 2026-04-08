export default () => ({
  app: {
    nodeEnv: process.env.NODE_ENV || 'development', // 当前运行环境
    port: Number(process.env.PORT) || 3000, // 服务启动端口
    corsOrigin: process.env.CORS_ORIGIN || '*', // 允许跨域的来源
  },
});
