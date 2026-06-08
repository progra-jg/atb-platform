import { Controller, Get, Post, Patch, Param, Body, BadRequestException, UseGuards } from "@nestjs/common";
import { ApiService } from "../services/api.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@Controller("api/messages")
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly api: ApiService) {}

  @Get(":userId")
  async getConversations(@Param("userId") userId: string) {
    return this.api.getConversations(userId);
  }

  @Get(":userId/with/:otherId")
  async getMessages(@Param("userId") userId: string, @Param("otherId") otherId: string) {
    return this.api.getMessagesBetween(userId, otherId);
  }

  @Post()
  async send(@Body() dto: { senderId: string; receiverId: string; lotId?: string; message: string }) {
    if (!dto.senderId || !dto.receiverId || !dto.message) {
      throw new BadRequestException("senderId, receiverId et message sont requis");
    }
    if (dto.message.length > 5000) throw new BadRequestException("Message trop long (max 5000)");
    return this.api.sendMessage(dto);
  }

  @Patch(":id/read")
  async markRead(@Param("id") id: string) {
    return this.api.markMessageRead(id);
  }

  @Get("unread/:userId")
  async getUnreadCount(@Param("userId") userId: string) {
    return this.api.getUnreadMessageCount(userId);
  }
}
