import {
	Injectable,
	NestInterceptor,
	ExecutionContext,
	CallHandler,
	Logger,
} from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	private readonly logger: Logger = new Logger();

	public intercept(
		context: ExecutionContext,
		next: CallHandler,
	): Observable<any> {
		const recordTime = Date.now();
		const requestType = context.getType<GqlContextType>();

		if (requestType === 'http') {
			// Develop if needed
			return next.handle().pipe();
		} else if (requestType === 'graphql') {
			const gqlContext = GqlExecutionContext.create(context);
			const requestBody = gqlContext.getContext().req.body;
			const shouldLogRequest =
				requestBody?.operationName !== 'GetSessionRequests';
			if (shouldLogRequest) {
				this.logger.verbose(`${this.stringify(requestBody)}`, 'REQUEST');
			}

			return next.handle().pipe(
				tap((responseBody) => {
					if (!shouldLogRequest) return;
					const responseTime = Date.now() - recordTime;
					this.logger.verbose(
						`${this.stringify(responseBody)} - ${responseTime}ms \n\n`,
						'RESPONSE',
					);
				}),
			);
		}
	}

	private stringify(context: ExecutionContext): string {
		return JSON.stringify(context).slice(0, 77); // slices the context body until 75th character
	}
}
