import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CreatePriceDto } from "../dto/create-price.dto";
import { CreateProductDto } from "../dto/create-product.dto";
import { QueryProductDto } from "../dto/query-product.dto";
import { UpdatePriceDto } from "../dto/update-price.dto";
import { UpdateProductDto } from "../dto/update-product.dto";
import {
  ProductPrice,
  ProductPriceDocument,
} from "../schema/product-price.schema";
import { Product, ProductDocument } from "../schema/product.schema";

@Injectable()
export class CatalogService {
  constructor(
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,

    @InjectModel(ProductPrice.name)
    private priceModel: Model<ProductPriceDocument>,
  ) {}

  async createProduct(dto: CreateProductDto) {
    return this.productModel.create(dto);
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    return this.productModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async findProductById(id: string) {
    return this.productModel.findById(id);
  }

  async findProducts(query: QueryProductDto) {
    const { page = 1, limit = 10, search, category } = query;

    const filter: any = { active: true };

    if (search) filter.$text = { $search: search };
    if (category) filter.category = category;

    const products = await this.productModel
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await this.productModel.countDocuments(filter);

    return {
      data: products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createPrice(dto: CreatePriceDto) {
    return this.priceModel.create({
      product: dto.productId,
      ...dto,
    });
  }

  async updatePrice(id: string, dto: UpdatePriceDto) {
    return this.priceModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async getProductWithPrices(slug: string) {
    const product = await this.productModel.findOne({ slug });

    if (!product) throw new NotFoundException("Product not found");

    const prices = await this.priceModel.find({
      product: product._id,
      active: true,
    });

    return { product, prices };
  }

  async getPricesByProductId(productId: string) {
    const product = await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException("Product not found");
    }

    const prices = await this.priceModel.find({
      product: product._id,
      active: true,
    });

    return {
      productId: product._id,
      prices,
    };
  }
}
