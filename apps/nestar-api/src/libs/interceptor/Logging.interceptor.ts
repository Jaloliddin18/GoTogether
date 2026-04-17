import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	private readonly logger: Logger = new Logger();

	public intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const recordTime = Date.now();
		const requestType = context.getType<GqlContextType>();

		if (requestType === 'http') {
			// Develop if needed
			return next.handle().pipe();
		} else if (requestType === 'graphql') {
			// 1.print request
			const gqlContext = GqlExecutionContext.create(context);
			this.logger.verbose(`${this.stringify(gqlContext.getContext().req.body)}`, 'REQUEST');

			// 2.error handlng via GraphhQL

			// 3. if no error, gives below response
			return next.handle().pipe(
				tap((context) => {
					const responseTime = Date.now() - recordTime;
					this.logger.verbose(`${this.stringify(context)} - ${responseTime}ms \n\n`, 'RESPONSE');
				}),
			);
		}
	}

	private stringify(context: ExecutionContext): string {
		return JSON.stringify(context).slice(0, 77); // slices the context body until 75th character
	}
}
