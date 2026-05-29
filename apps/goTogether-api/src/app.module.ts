import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { AppResolver } from './app.resolver';
import { ComponentsModule } from './components/components.module';
import { DatabaseModule } from './database/database.module';
import { T } from './libs/types/common';
import { SocketModule } from './socket/socket.module';
import { MqttRobotModule } from './robot-comm/mqtt.module';

@Module({
	imports: [
		ConfigModule.forRoot(), //  used for envrionmental variable configuration
		GraphQLModule.forRoot({
			driver: ApolloDriver,
			playground: true,
			csrfPrevention: false,
			uploads: false,
			autoSchemaFile: true,
			formatError: (error: T) => {
				const graphQlFormattedError = {
					code: error?.extensions.code,
					message:
						error?.extensions?.exception?.response?.message ||
						error?.extensions?.response?.message ||
						error?.message,
				};
				console.log('GRAPHQL GLOBAL ERR:', graphQlFormattedError);
				return graphQlFormattedError;
			},
		}),
		ComponentsModule,
		DatabaseModule,
		SocketModule,
		MqttRobotModule,
	],
	controllers: [AppController], // rest API server
	providers: [AppService, AppResolver], // graphQL API server
})
export class AppModule {}
