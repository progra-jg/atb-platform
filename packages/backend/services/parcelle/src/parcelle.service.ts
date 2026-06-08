import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Parcelle } from "./parcelle.entity";

@Injectable()
export class ParcelleService {
  constructor(
    @InjectRepository(Parcelle)
    private parcelleRepo: Repository<Parcelle>,
  ) {}

  async create(dto: any, ownerId: string) {
    if (dto.superficie <= 0.01) {
      throw new BadRequestException("Superficie must be > 0.01 ha");
    }
    const parcelle = this.parcelleRepo.create({
      ...dto,
      ownerId,
      polygone: { type: "Polygon", coordinates: dto.polygone },
    });
    return this.parcelleRepo.save(parcelle);
  }

  async findAll(ownerId?: string) {
    if (ownerId) {
      return this.parcelleRepo.find({ where: { ownerId } });
    }
    return this.parcelleRepo.find();
  }

  async findOne(id: string) {
    const parcelle = await this.parcelleRepo.findOne({ where: { id } });
    if (!parcelle) throw new NotFoundException("Parcelle not found");
    return parcelle;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    await this.parcelleRepo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.parcelleRepo.delete(id);
  }

  async uploadPhoto(id: string, file: Express.Multer.File) {
    const parcelle = await this.findOne(id);
    const photos = parcelle.photos || [];
    photos.push(file.filename || file.originalname);
    await this.parcelleRepo.update(id, { photos });
    return { filename: file.originalname, url: `/uploads/${file.filename}` };
  }
}
