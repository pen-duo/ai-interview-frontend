import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

// 定义统一成功响应的数据结构
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

@Injectable()
// 拦截器：在控制器返回数据后，统一包一层响应格式
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    // 取到当前请求对象，后面要用它的 url
    const request = context
      .switchToHttp()
      .getRequest<Request & { url: string }>();

    // next.handle() 表示继续执行控制器原本逻辑
    // map(...) 表示拿到控制器返回值后，再统一加工成标准响应结构
    return next.handle().pipe(
      map((data) => ({
        code: 200,
        message: 'success',
        data,
        timestamp: new Date().toISOString(),
        path: request.url,
      })),
    );
  }
}
