import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from "@nestjs/common";
import { ApiService } from "../services/api.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { RolesGuard } from "../guards/roles.guard";
import { Roles } from "../decorators/roles.decorator";

@Controller("api")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class UsersController {
  constructor(private readonly api: ApiService) {}

  @Get("users")
  async getUsers() {
    return this.api.getUsers();
  }

  @Post("users")
  async createUser(@Body() dto: any) {
    return this.api.createUser(dto);
  }

  @Put("users/:id")
  async updateUser(@Param("id") id: string, @Body() dto: any) {
    return this.api.updateUser(id, dto);
  }

  @Delete("users/:id")
  async deleteUser(@Param("id") id: string, @Body("userType") userType: string) {
    return this.api.deleteUser(id, userType);
  }
}
