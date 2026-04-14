import Joi, { type ObjectSchema } from 'joi';

export const envValidationSchema: ObjectSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'), // 限制运行环境只能是这 3 种
  PORT: Joi.number().port().default(3000), // 必须是合法端口号
  CORS_ORIGIN: Joi.string().allow('').default('*'), // 允许为空，默认全部放开
  MONGODB_URI: Joi.string()
    .uri({ scheme: ['mongodb', 'mongodb+srv'] })
    .default('mongodb://127.0.0.1:27017/ai-mianshi-dog'), // MongoDB 连接地址
});

export function validateEnv(config: Record<string, unknown>) {
  const result = envValidationSchema.validate(config, {
    abortEarly: false, // 不要遇到第一个错误就停，尽量一次性报全
    allowUnknown: true, // 允许未知属性
  }) as {
    error?: Error;
    value: Record<string, unknown>;
  };

  if (result.error) {
    throw new Error(`环境变量校验失败: ${result.error.message}`);
  }

  return result.value; // 返回校验并补默认值后的配置
}
