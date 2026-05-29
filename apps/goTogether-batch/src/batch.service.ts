import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Book } from 'apps/goTogether-api/src/libs/dto/book/book';
import { Member } from 'apps/goTogether-api/src/libs/dto/member/member';
import {
	MemberStatus,
	MemberType,
} from 'apps/goTogether-api/src/libs/enums/member.enum';
import { BookStatus } from 'apps/goTogether-api/src/libs/enums/book.enum';
import { Model } from 'mongoose';

@Injectable()
export class BatchService {
	constructor(
		@InjectModel('Book') private readonly bookModel: Model<Book>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
	) {}
	public async batchRollBack(): Promise<void> {
		await this.bookModel
			.updateMany({ bookStatus: BookStatus.ACTIVE }, { bookRank: 0 })
			.exec();

		await this.memberModel
			.updateMany({ memberStatus: MemberStatus.ACTIVE }, { memberRank: 0 })
			.exec();
	}

	public async batchTopProperties(): Promise<void> {
		const books: Book[] = await this.bookModel
			.find({ bookStatus: BookStatus.ACTIVE, bookRank: 0 })
			.exec();

		const promisedList = books.map(async (ele: Book) => {
			const { _id, bookLikes, bookViews } = ele;
			const rank = bookLikes * 2 + bookViews;
			return await this.bookModel.findByIdAndUpdate(_id, {
				bookRank: rank,
			});
		});
		await Promise.all(promisedList);
	}

	public async batchTopAgents(): Promise<void> {
		const agents: Member[] = await this.memberModel
			.find({
				memberType: MemberType.USER,
				memberStatus: MemberStatus.ACTIVE,
				memberRank: 0,
			})
			.exec();

		const promisedList = agents.map(async (ele: Member) => {
			const { _id, memberBooks, memberLikes, memberViews, memberTwits } = ele;
			const rank =
				(memberBooks ?? 0) * 5 +
				(memberTwits ?? 0) * 3 +
				(memberLikes ?? 0) * 2 +
				(memberViews ?? 0);
			return await this.memberModel.findByIdAndUpdate(_id, {
				memberRank: rank,
			});
		});
		await Promise.all(promisedList);
	}

	public getHello(): string {
		return 'Welcome to GoTogether BATCH server!';
	}
}
