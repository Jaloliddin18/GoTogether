import { Body, Controller, Post } from '@nestjs/common';
import { ChatResponse, ChatService } from './chat.service';

class ChatMessageDto {
	message: string;
	history: Array<{ role: string; content: string }>;
}

@Controller('chat')
export class ChatController {
	constructor(private readonly chatService: ChatService) {}

	@Post('message')
	async message(@Body() body: ChatMessageDto): Promise<ChatResponse> {
		return this.chatService.sendMessage(body.message, body.history ?? []);
	}
}
