import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";
export declare class ProductsController {
    private readonly service;
    constructor(service: ProductsService);
    search(query: string, userId: string): Promise<{
        name: string;
        score: number;
        semanticScore: number;
    }[]>;
    createMany(products: CreateProductDto[]): Promise<import("mongoose").MergeType<import("mongoose").Document<unknown, {}, import("./schemas/product.schema").ProductDocument, {}> & import("./schemas/product.schema").Product & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }, Omit<{
        embedding: number[];
        name: string;
        tags: string[];
    }, "_id">>[]>;
    create(body: {
        name: string;
        price: string;
        description: string;
        user_id: string;
        tags?: string[];
        available?: boolean;
        stock?: number;
        assistant_id: string;
    }): Promise<import("mongoose").Document<unknown, {}, import("./schemas/product.schema").ProductDocument, {}> & import("./schemas/product.schema").Product & import("mongoose").Document<unknown, any, any, Record<string, any>> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    findAll(user_id: string, assistant_id: string): Promise<(import("mongoose").FlattenMaps<import("./schemas/product.schema").ProductDocument> & Required<{
        _id: import("mongoose").FlattenMaps<unknown>;
    }> & {
        __v: number;
    })[]>;
    findOne(id: string): Promise<(import("mongoose").FlattenMaps<import("./schemas/product.schema").ProductDocument> & Required<{
        _id: import("mongoose").FlattenMaps<unknown>;
    }> & {
        __v: number;
    }) | null>;
    update(id: string, user_id: string, body: {
        name: string;
        price: string;
        description: string;
        tags?: string[];
        stock?: number;
    }): Promise<(import("mongoose").FlattenMaps<import("./schemas/product.schema").ProductDocument> & Required<{
        _id: import("mongoose").FlattenMaps<unknown>;
    }> & {
        __v: number;
    }) | null>;
    remove(id: string): Promise<(import("mongoose").FlattenMaps<import("./schemas/product.schema").ProductDocument> & Required<{
        _id: import("mongoose").FlattenMaps<unknown>;
    }> & {
        __v: number;
    }) | null>;
}
