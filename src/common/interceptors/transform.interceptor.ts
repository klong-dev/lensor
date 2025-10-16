import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/response.interface';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data already has the correct structure, return as is
        if (data && typeof data === 'object' && 'data' in data) {
          return data;
        }

        // Otherwise, wrap it in the standard format
        return {
          data,
          statusCode: context.switchToHttp().getResponse().statusCode,
        };
      }),
    );
  }
}
