import { Product, ProductDocument } from "./schemas/product.schema";
import { Model } from "mongoose";
import { CreateProductDto } from "./dto/create-product.dto";
export declare class ProductsService {
    private model;
    constructor(model: Model<ProductDocument>);
    search(query: string, user_id: string): Promise<{
        name: string;
        score: number;
        semanticScore: number;
    }[]>;
    createMany(products: CreateProductDto[]): Promise<import("mongoose").MergeType<import("mongoose").Document<unknown, {}, ProductDocument, {}> & Product & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }, Omit<{
        embedding: number[];
        name: string;
        tags: string[];
    }, "_id">>[]>;
    create(product: CreateProductDto, user_id: string, assistant_id: string): Promise<import("mongoose").Document<unknown, {}, ProductDocument, {}> & Product & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    findAll(user_id: string, assistant_id: string): Promise<(import("mongoose").FlattenMaps<ProductDocument> & Required<{
        _id: import("mongoose").FlattenMaps<unknown>;
    }> & {
        __v: number;
    })[]>;
    findOne(id: string): Promise<(import("mongoose").FlattenMaps<ProductDocument> & Required<{
        _id: import("mongoose").FlattenMaps<unknown>;
    }> & {
        __v: number;
    }) | null>;
    update(id: string, user_id: string, update: Partial<CreateProductDto> & {
        embedding?: number[];
    }): Promise<(import("mongoose").FlattenMaps<ProductDocument> & Required<{
        _id: import("mongoose").FlattenMaps<unknown>;
    }> & {
        __v: number;
    }) | null>;
    remove(id: string): Promise<(import("mongoose").FlattenMaps<ProductDocument> & Required<{
        _id: import("mongoose").FlattenMaps<unknown>;
    }> & {
        __v: number;
    }) | null>;
}
