import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './libs/interceptor/Logging.interceptor';
import { graphqlUploadExpress } from 'graphql-upload';
import * as express from 'express';
import { WsAdapter } from '@nestjs/platform-ws';
import * as path from 'path';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.useGlobalPipes(new ValidationPipe()); // integrating PIPES globally (middleware)
	app.useGlobalInterceptors(new LoggingInterceptor()); // logging standard (middleware)
	app.enableCors({ origin: true, credentials: true });
	app.use(graphqlUploadExpress({ maxFileSize: 1500000, maxFiles: 10 }));
	app.use(
		'/uploads',
		express.static(path.join(__dirname, '../../..', 'uploads')),
	);

	app.useWebSocketAdapter(new WsAdapter(app));
	//An adapter = a bridge between NestJS and a WebSocket library.
	await app.listen(process.env.PORT_API ?? 3000);
}
bootstrap();
