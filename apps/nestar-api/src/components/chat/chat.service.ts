import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { firstValueFrom } from 'rxjs';
import {
	BookAudience,
	BookCategory,
	BookFormat,
	BookLanguage,
	BookType,
} from '../../libs/enums/book.enum';

interface ChatMessage {
	role: string;
	content: string;
}

interface BookCandidate {
	_id?: unknown;
	bookTitle?: string;
	bookAuthor?: string;
	bookIsbn?: string;
	bookCallNumber?: string;
	bookImages?: string[];
	bookCategory?: string;
	bookType?: string;
	bookFormat?: string;
	bookLanguage?: string;
	bookAudience?: string;
	bookPublishedYear?: number;
	bookDescription?: string;
	bookPrice?: { amount?: number; currency?: string; isDiscounted?: boolean; discountPercent?: number };
	bookPages?: number;
	bookRating?: { average?: number; count?: number };
	isBorrowable?: boolean;
	isPurchasable?: boolean;
}

interface ScoredBook {
	book: BookCandidate;
	score: number;
}

export interface ChatBookSuggestion {
	bookId: string;
	title: string;
	author: string;
	image?: string;
	category?: string;
	callNumber?: string;
	isBorrowable: boolean;
	isPurchasable: boolean;
}

export interface ChatResponse {
	reply: string;
	books: ChatBookSuggestion[];
}

const BASE_SYSTEM_PROMPT =
	'You are a helpful library assistant for 같이Go Smart Library at Inha University, Korea. ' +
	'You help students find books, check availability, understand how to borrow or purchase books, ' +
	'and learn about the robot delivery system. ' +
	'The library uses robots with fixed grippers to retrieve books from shelves and deliver them to students. ' +
	'Key app pages: book catalog at /library/books, request history at /library/requests, ' +
	'live robot tracking at /library/tracking, community at /library/community. ' +
	'READY status means the book has been delivered and is ready for student pickup - it is not the same as COMPLETED. ' +
	'Keep responses concise, warm, and helpful. Never invent book details not found in the catalog below.';

const STOP_WORDS = new Set([
	'a',
	'an',
	'and',
	'are',
	'as',
	'at',
	'be',
	'book',
	'books',
	'by',
	'can',
	'for',
	'from',
	'get',
	'help',
	'i',
	'in',
	'is',
	'it',
	'library',
	'me',
	'my',
	'of',
	'on',
	'or',
	'please',
	'recommend',
	'show',
	'the',
	'to',
	'we',
	'with',
]);

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeForMatch = (value: string): string =>
	value
		.toLowerCase()
		.replace(/_/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

const extractKeywords = (value: string): string[] => {
	const cleaned = value
		.toLowerCase()
		.replace(/[^\p{L}\p{N}\s]/gu, ' ')
		.replace(/\s+/g, ' ')
		.trim();

	if (!cleaned) return [];

	const uniqueKeywords = new Set<string>();
	for (const token of cleaned.split(' ')) {
		if (token.length < 2) continue;
		if (STOP_WORDS.has(token)) continue;
		uniqueKeywords.add(token);
		if (uniqueKeywords.size >= 8) break;
	}

	return Array.from(uniqueKeywords);
};

const extractEnumMatches = (text: string, values: string[]): string[] => {
	const normalizedText = normalizeForMatch(text);
	return values.filter((value) => normalizedText.includes(normalizeForMatch(value)));
};

const extractMeaningfulKeywords = (keywords: string[], enumMatches: string[]): string[] => {
	const enumText = enumMatches.map(normalizeForMatch).join(' ');
	return keywords.filter((keyword) => !enumText.includes(keyword));
};

const hasDetailIntent = (text: string): boolean =>
	/\b(about|available|availability|borrow|buy|call number|detail|details|isbn|price|purchase|rating|summary|tell me)\b/i.test(
		text,
	) ||
	text.includes('대출') ||
	text.includes('구매');

const scoreBook = (
	book: BookCandidate,
	normalizedSearch: string,
	keywords: string[],
	wantsBorrow: boolean,
	wantsPurchase: boolean,
): number => {
	let score = 0;
	const title = (book.bookTitle ?? '').toLowerCase();
	const author = (book.bookAuthor ?? '').toLowerCase();
	const category = normalizeForMatch(book.bookCategory ?? '');
	const type = normalizeForMatch(book.bookType ?? '');
	const format = normalizeForMatch(book.bookFormat ?? '');
	const language = normalizeForMatch(book.bookLanguage ?? '');
	const audience = normalizeForMatch(book.bookAudience ?? '');
	const description = (book.bookDescription ?? '').toLowerCase();
	const callNumber = (book.bookCallNumber ?? '').toLowerCase();

	for (const keyword of keywords) {
		if (title.includes(keyword)) score += 6;
		if (author.includes(keyword)) score += 5;
		if (callNumber.includes(keyword)) score += 5;
		if (category.includes(keyword)) score += 3;
		if (type.includes(keyword)) score += 3;
		if (format.includes(keyword)) score += 2;
		if (language.includes(keyword)) score += 2;
		if (audience.includes(keyword)) score += 2;
		if (description.includes(keyword)) score += 1;
	}

	if (normalizedSearch.includes(title) && title.length > 0) score += 4;
	if (normalizedSearch.includes(author) && author.length > 0) score += 4;

	if (wantsBorrow && book.isBorrowable) score += 4;
	if (wantsPurchase && book.isPurchasable) score += 4;

	return score;
};

const formatPrice = (price?: BookCandidate['bookPrice']): string => {
	if (!price?.amount) return 'N/A';
	const base = `${price.amount} ${price.currency ?? 'KRW'}`;
	return price.isDiscounted && price.discountPercent ? `${base} (${price.discountPercent}% off)` : base;
};

const formatBookLine = (book: BookCandidate): string =>
	`- **${book.bookTitle}** by ${book.bookAuthor} | Book ID: ${book._id ?? 'N/A'} | ISBN: ${book.bookIsbn ?? 'N/A'} | Call No: ${book.bookCallNumber ?? 'N/A'} | Category: ${book.bookCategory} | Type: ${book.bookType} | Format: ${book.bookFormat} | Language: ${book.bookLanguage} | Audience: ${book.bookAudience} | Year: ${book.bookPublishedYear ?? 'N/A'} | Pages: ${book.bookPages ?? 'N/A'} | Rating: ${book.bookRating?.average ?? 'N/A'} (${book.bookRating?.count ?? 0} ratings) | Price: ${formatPrice(book.bookPrice)} | Borrow: ${book.isBorrowable ? 'Yes' : 'No'} | Purchase: ${book.isPurchasable ? 'Yes' : 'No'} | Summary: ${(book.bookDescription ?? 'No description available').slice(0, 220)}`;

const toBookSuggestion = (book: BookCandidate): ChatBookSuggestion | null => {
	if (!book._id || !book.bookTitle || !book.bookAuthor) return null;

	return {
		bookId: String(book._id),
		title: book.bookTitle,
		author: book.bookAuthor,
		image: book.bookImages?.[0],
		category: book.bookCategory,
		callNumber: book.bookCallNumber,
		isBorrowable: Boolean(book.isBorrowable),
		isPurchasable: Boolean(book.isPurchasable),
	};
};

@Injectable()
export class ChatService {
	constructor(
		private readonly httpService: HttpService,
		@InjectModel('Book') private readonly bookModel: Model<any>,
	) {}

	async sendMessage(message: string, history: ChatMessage[]): Promise<ChatResponse> {
		const apiKey = process.env.GROQ_API_KEY;
		if (!apiKey) throw new InternalServerErrorException('GROQ_API_KEY is not configured');

		const recentUserHistory = history
			.filter((item) => item.role === 'user')
			.slice(-4)
			.map((item) => item.content)
			.join(' ');
		const searchText = `${recentUserHistory} ${message}`.trim();
		const normalizedSearch = normalizeForMatch(searchText);

		const wantsBorrow =
			/\b(borrow|borrowing|loan|checkout|lend)\b/i.test(searchText) || searchText.includes('대출');
		const wantsPurchase =
			/\b(buy|purchase|purchasing|payment|pay)\b/i.test(searchText) || searchText.includes('구매');

		const categoryMatches = extractEnumMatches(searchText, Object.values(BookCategory));
		const typeMatches = extractEnumMatches(searchText, Object.values(BookType));
		const formatMatches = extractEnumMatches(searchText, Object.values(BookFormat));
		const languageMatches = extractEnumMatches(searchText, Object.values(BookLanguage));
		const audienceMatches = extractEnumMatches(searchText, Object.values(BookAudience));
		const keywords = extractKeywords(searchText);
		const meaningfulKeywords = extractMeaningfulKeywords(keywords, [
			...categoryMatches,
			...typeMatches,
			...formatMatches,
			...languageMatches,
			...audienceMatches,
		]);

		const filter: Record<string, unknown> = { bookStatus: 'ACTIVE' };
		if (wantsBorrow && !wantsPurchase) filter.isBorrowable = true;
		if (wantsPurchase && !wantsBorrow) filter.isPurchasable = true;
		if (categoryMatches.length > 0) filter.bookCategory = { $in: categoryMatches };
		if (typeMatches.length > 0) filter.bookType = { $in: typeMatches };
		if (formatMatches.length > 0) filter.bookFormat = { $in: formatMatches };
		if (languageMatches.length > 0) filter.bookLanguage = { $in: languageMatches };
		if (audienceMatches.length > 0) filter.bookAudience = { $in: audienceMatches };
		if (meaningfulKeywords.length > 0) {
			filter.$or = meaningfulKeywords.flatMap((keyword) => [
				{ bookTitle: { $regex: escapeRegex(keyword), $options: 'i' } },
				{ bookAuthor: { $regex: escapeRegex(keyword), $options: 'i' } },
				{ bookIsbn: { $regex: escapeRegex(keyword), $options: 'i' } },
				{ bookCallNumber: { $regex: escapeRegex(keyword), $options: 'i' } },
				{ bookDescription: { $regex: escapeRegex(keyword), $options: 'i' } },
			]);
		}

		const selectedFields =
			'bookTitle bookAuthor bookIsbn bookCallNumber bookImages bookCategory bookType bookFormat bookLanguage bookAudience bookPublishedYear bookPages bookDescription bookPrice bookRating isBorrowable isPurchasable';

		const matchedBooks = await this.bookModel
			.find(filter)
			.limit(40)
			.select(selectedFields)
			.lean();

		const fallbackBooks =
			matchedBooks.length > 0
				? matchedBooks
				: await this.bookModel
						.find({ bookStatus: 'ACTIVE' })
						.limit(25)
						.select(selectedFields)
						.lean();
		const retrievalNote =
			matchedBooks.length > 0
				? 'The catalog entries below were selected because they match the current user query.'
				: 'No direct catalog match was found for the current query. The catalog entries below are general active books; say clearly when there is no exact match.';

		const scoredBooks: ScoredBook[] = fallbackBooks
			.map((book: BookCandidate) => ({
				book,
				score: scoreBook(book, normalizedSearch, keywords, wantsBorrow, wantsPurchase),
			}))
			.sort((a, b) => b.score - a.score);
		const books = scoredBooks
			.slice(0, 15)
			.map((item) => item.book);
		const topScoredBook = scoredBooks[0];
		const exactDetailBook =
			hasDetailIntent(searchText) && topScoredBook?.book?._id && topScoredBook.score >= 5
				? await this.bookModel
						.findOne({ _id: topScoredBook.book._id, bookStatus: 'ACTIVE' })
						.select(selectedFields)
						.lean()
				: null;

		const bookContext = books
			.map((b: BookCandidate) => formatBookLine(b))
			.join('\n');
		const toolContext = exactDetailBook
			? `\n\nTool result - getBookDetail:\n${formatBookLine(exactDetailBook as BookCandidate)}\nUse this detail result as the primary source for this answer.`
			: '';

		const systemPrompt =
			BASE_SYSTEM_PROMPT +
			`\n\nRetrieval note: ${retrievalNote}\n\nTool result - searchBooks:\n${bookContext}${toolContext}\n` +
			`When recommending books use real titles from the list above. ` +
			`Format book titles in **bold**. Use bullet points for multiple recommendations. ` +
			`If the catalog context has no exact match, explain that briefly and suggest the closest alternatives from the context.`;

		const messages = [
			{ role: 'system', content: systemPrompt },
			...history.map((m) => ({ role: m.role, content: m.content })),
			{ role: 'user', content: message },
		];

		try {
			const response = await firstValueFrom(
				this.httpService.post(
					'https://api.groq.com/openai/v1/chat/completions',
					{
						model: 'llama-3.3-70b-versatile',
						messages,
						max_tokens: 500,
						temperature: 0.7,
					},
					{
						headers: {
							Authorization: `Bearer ${apiKey}`,
							'Content-Type': 'application/json',
						},
					},
				),
			);
			const suggestions = books
				.map((book) => toBookSuggestion(book))
				.filter((book): book is ChatBookSuggestion => Boolean(book))
				.slice(0, 3);

			return {
				reply: response.data.choices[0].message.content as string,
				books: suggestions,
			};
		} catch (err: any) {
			const detail = err?.response?.data?.error?.message ?? err.message;
			throw new InternalServerErrorException(`Groq API error: ${detail}`);
		}
	}
}
