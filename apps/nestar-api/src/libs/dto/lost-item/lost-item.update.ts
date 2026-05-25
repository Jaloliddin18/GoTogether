import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { LostItemStatus } from '../../enums/lost-item.enum';

@InputType()
export class UpdateLostItemStatusInput {
	@IsNotEmpty()
	@Field(() => String)
	lostItemId: ObjectId;

	@IsNotEmpty()
	@Field(() => LostItemStatus)
	status: LostItemStatus;
}
