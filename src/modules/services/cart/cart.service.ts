import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Cart, CartDocument } from "./schemas/cart.schema";
import { AddToCartDto } from "./dto/add-to-cart.dto";
import { CatalogService } from "../catalog/service/catalog.service";

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    private readonly productsService: CatalogService,
  ) {}

  async getCart(userId: string) {
    let cart = await this.cartModel.findOne({ user: userId });

    if (!cart) {
      cart = await this.cartModel.create({
        user: userId,
        items: [],
        total: 0,
      });
    }

    return cart;
  }

  async addToCart(userId: string, dto: AddToCartDto) {
    const cart = await this.getCart(userId);

    let product;
    let price = 0;
    let name = "";
    if (dto.type === "plan") {
      if (!dto.billingInterval) {
        throw new BadRequestException("Billing interval is required for plans");
      }

      const product = await this.productsService.findProductById(dto.itemId);

      if (!product) {
        throw new NotFoundException("Plan not found");
      }

      const priceData = await this.resolvePlanPrice(
        dto.itemId,
        dto.billingInterval,
      );

      // 🚨 SOLO UN PLAN EN CARRITO
      cart.items = cart.items.filter((i) => i.type !== "plan");

      cart.items.push({
        itemId: dto.itemId,
        type: "plan",
        name: product.name,
        price: priceData.amount,
        currency: priceData.currency,
        billingInterval: dto.billingInterval,
        quantity: 1,
      });
    }

    if (dto.type === "addon") {
      product = await this.productsService.findProductById(dto.itemId);

      if (!product) throw new NotFoundException("Addon not found");

      const priceData = await this.resolveAddonPrice(dto.itemId);

      price = priceData.amount;
      name = product.name;

      const existing = cart.items.find((i) => i.itemId === dto.itemId);

      if (existing) {
        existing.quantity += dto.quantity || 1;
      } else {
        cart.items.push({
          itemId: dto.itemId,
          type: "addon",
          name,
          price,
          quantity: dto.quantity || 1,
          currency: "",
          billingInterval: "one-paid",
        });
      }
    }

    cart.total = this.calculateTotal(cart.items);

    await cart.save();
    return cart;
  }

  async removeFromCart(userId: string, itemId: string) {
    const cart = await this.getCart(userId);

    cart.items = cart.items.filter((item) => item.itemId !== itemId);

    cart.total = this.calculateTotal(cart.items);

    await cart.save();
    return cart;
  }

  private calculateTotal(items: any[]) {
    return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }

  async clearCart(userId: string) {
    const cart = await this.getCart(userId);
    cart.items = [];
    cart.total = 0;
    await cart.save();
    return cart;
  }

  private async resolvePlanPrice(
    productId: string,
    interval: "month" | "year",
  ) {
    const priceResponse =
      await this.productsService.getPricesByProductId(productId);

    if (!priceResponse || !priceResponse.prices?.length) {
      throw new NotFoundException("No prices found for product");
    }

    const priceData = priceResponse.prices.find(
      (p) => p.interval === interval && p.active,
    );

    if (!priceData) {
      throw new NotFoundException(
        `No active price found for interval ${interval}`,
      );
    }

    return {
      amount: priceData.price,
      currency: priceData.currency,
    };
  }

  private async resolveAddonPrice(productId: string) {
    const priceResponse =
      await this.productsService.getPricesByProductId(productId);

    const priceData = priceResponse.prices.find((p) => p.active && p.isDefault);

    if (!priceData) {
      throw new NotFoundException("No active default price found");
    }

    return {
      amount: priceData.price,
      currency: priceData.currency,
    };
  }
}
