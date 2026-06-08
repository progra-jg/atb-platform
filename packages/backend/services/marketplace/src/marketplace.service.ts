import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Product, ProductCategory } from "./product.entity";
import { Order } from "./order.entity";

@Injectable()
export class MarketplaceService {
  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
  ) {}

  async getProducts(category?: ProductCategory) {
    if (category) {
      return this.productRepo.find({ where: { category, isAvailable: true } });
    }
    return this.productRepo.find({ where: { isAvailable: true } });
  }

  async getProduct(id: string) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }

  async createProduct(dto: any) {
    return this.productRepo.save(dto);
  }

  async createOrder(dto: any) {
    let total = 0;
    for (const item of dto.items) {
      const product = await this.getProduct(item.productId);
      if (product.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for ${product.name}`);
      }
      item.productName = product.name;
      item.unitPrice = product.price;
      item.totalPrice = product.price * item.quantity;
      total += item.totalPrice;

      await this.productRepo.update(product.id, { stock: product.stock - item.quantity });
    }

    const order = this.orderRepo.create({
      producteurId: dto.producteurId,
      items: dto.items,
      total,
      deliveryGps: dto.deliveryGps,
    });

    return this.orderRepo.save(order);
  }

  async getOrder(id: string) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  async getProducteurOrders(producteurId: string) {
    return this.orderRepo.find({ where: { producteurId }, order: { createdAt: "DESC" } });
  }

  async updateOrderStatus(id: string, status: string) {
    await this.getOrder(id);
    await this.orderRepo.update(id, { status: status as any });
    return this.getOrder(id);
  }
}
