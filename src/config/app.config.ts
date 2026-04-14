export default () => ({
  app: {
    nodeEnv: process.env.NODE_ENV || 'development', // 当前运行环境
    port: Number(process.env.PORT) || 3000, // 服务启动端口
    corsOrigin: process.env.CORS_ORIGIN || '*', // 允许跨域的来源
  },
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai-mianshi-dog', // MongoDB 连接地址
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-jwt-secret-key', // JWT 签名密钥
    expiresIn: process.env.JWT_EXPIRES_IN || '7d', // JWT 过期时间
  },
});
