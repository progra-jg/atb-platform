import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ParcelleService } from "./parcelle.service";
import { CreateParcelleDto } from "./dto/create-parcelle.dto";

@Controller("parcelles")
export class ParcelleController {
  constructor(private readonly parcelleService: ParcelleService) {}

  @Post()
  async create(@Body() dto: CreateParcelleDto, @Req() req) {
    return this.parcelleService.create(dto, req.user?.id || "anonymous");
  }

  @Get()
  async findAll(@Req() req) {
    return this.parcelleService.findAll(req.user?.id);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.parcelleService.findOne(id);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() body: any) {
    return this.parcelleService.update(id, body);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.parcelleService.remove(id);
  }

  @Post(":id/photo")
  @UseInterceptors(FileInterceptor("photo"))
  async uploadPhoto(
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.parcelleService.uploadPhoto(id, file);
  }
}
