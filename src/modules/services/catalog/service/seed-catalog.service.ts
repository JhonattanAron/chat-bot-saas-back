import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  ProductPrice,
  ProductPriceDocument,
} from "../schema/product-price.schema";
import { Product, ProductDocument } from "../schema/product.schema";

@Injectable()
export class SeedCatalogService {
  constructor(
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,

    @InjectModel(ProductPrice.name)
    private priceModel: Model<ProductPriceDocument>,
  ) {}

  async seedCatalog(data: { plans: any[]; addons: any[] }) {
    const created: any[] = [];

    // ====== PLANES (RECURRING MONTHLY) ======
    for (const plan of data.plans) {
      const slug = `plan-${plan.id}`;

      let product = await this.productModel.findOne({ slug });

      if (!product) {
        product = await this.productModel.create({
          name: plan.name,
          slug,
          description: `Plan ${plan.name}`,
          category: "saas",
          metadata: {
            credits: plan.credits,
            tokens: plan.tokens,
            monthlyConversations: plan.monthlyConversations,
            dailyConversations: plan.dailyConversations,
            tokensPerConversation: plan.tokensPerConversation,
            costPerToken: plan.costPerToken,
            features: plan.features,
            popular: plan.popular ?? false,
          },
        });
      }

      // Crear precio mensual si no existe
      const existingPrice = await this.priceModel.findOne({
        product: product._id,
        interval: "month",
      });

      if (!existingPrice) {
        await this.priceModel.create({
          product: product._id,
          billingType: "recurring",
          interval: "month",
          price: plan.price,
          currency: "USD",
          isDefault: true,
        });
      }

      created.push(product);
    }

    // ====== ADDONS (ONE TIME) ======
    for (const addon of data.addons) {
      const slug = `addon-${addon.id}`;

      let product = await this.productModel.findOne({ slug });

      if (!product) {
        product = await this.productModel.create({
          name: addon.name,
          slug,
          description: addon.description,
          category: "addon",
          metadata: {
            type: addon.type,
            quantity: addon.quantity,
          },
        });
      }

      const existingPrice = await this.priceModel.findOne({
        product: product._id,
        billingType: "one_time",
      });

      if (!existingPrice) {
        await this.priceModel.create({
          product: product._id,
          billingType: "one_time",
          price: addon.price,
          currency: "USD",
          isDefault: true,
        });
      }

      created.push(product);
    }

    return {
      message: "Catalog seeded successfully",
      totalProductsProcessed: created.length,
    };
  }
}
