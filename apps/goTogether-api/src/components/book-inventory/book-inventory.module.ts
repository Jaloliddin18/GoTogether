import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { BookInventoryResolver } from './book-inventory.resolver';
import { BookInventoryService } from './book-inventory.service';
import BookInventorySchema from '../../schemas/BookInventory.model';
import BookSchema from '../../schemas/Book.model';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'BookInventory', schema: BookInventorySchema },
		]),
		MongooseModule.forFeature([{ name: 'Book', schema: BookSchema }]),
		AuthModule,
	],
	providers: [BookInventoryResolver, BookInventoryService],
	exports: [BookInventoryService],
})
export class BookInventoryModule {}
