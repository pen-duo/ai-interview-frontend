import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
@Catch()
// 异常过滤器：统一处理项目里抛出的异常，并包装成统一错误响应
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // 切换到 HTTP 上下文，拿到 request 和 response
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 如果是 Nest 的 HttpException，就使用它自带的状态码；否则默认按 500 处理
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // 取出异常里原始的响应内容，后面统一提取 message
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message = '服务器内部错误';
    let data: unknown = null;

    // 异常可能是字符串、对象、数组，这里统一兼容处理
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (exceptionResponse && typeof exceptionResponse === 'object') {
      const responseObject = exceptionResponse as {
        message?: string | string[];
        error?: string;
      };

      message = Array.isArray(responseObject.message)
        ? responseObject.message.join(', ')
        : responseObject.message || responseObject.error || message;

      data = Array.isArray(responseObject.message)
        ? responseObject.message
        : null;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // 统一返回错误响应结构，方便前端统一处理
    response.status(status).json({
      code: status,
      message,
      data,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
