import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  ContractAsset,
  ContractAssetDocument,
  ContractStatus,
  ContractType,
} from "./contract-assets.schema";
import {
  InvoiceDocument,
  InvoiceStatus,
} from "../invoices/schemas/invoice.schema";

@Injectable()
export class ContractedAssetsService {
  constructor(
    @InjectModel(ContractAsset.name)
    private readonly contractAssetModel: Model<ContractAssetDocument>,
  ) {}

  // ========================================
  // 🚀 ENTRY POINT
  // ========================================

  async processInvoice(invoice: InvoiceDocument): Promise<void> {
    if (!invoice) throw new Error("Invoice is null");

    if (invoice.status !== InvoiceStatus.PAID) {
      throw new Error("Invoice must be paid");
    }

    const invoiceId = invoice._id.toString();

    const alreadyProcessed = await this.existsByInvoice(invoiceId);
    if (alreadyProcessed) {
      console.log("⚠️ Invoice ya procesada:", invoiceId);
      return;
    }

    console.log("🔥 Procesando invoice:", invoiceId);

    await Promise.all(
      invoice.items.map((item) => this.processInvoiceItem(invoice, item)),
    );
  }

  // ========================================
  // 🧠 PROCESS ITEM
  // ========================================

  private async processInvoiceItem(invoice: InvoiceDocument, item: any) {
    const startDate = new Date();
    const invoiceId = invoice._id.toString();

    console.log("➡️ Creando contrato:", {
      type: item.type,
      item: item.itemId,
    });

    // 🔥 ONE TIME
    if (item.billingInterval === "one-paid") {
      return this.assignOneTimeAsset({
        userId: invoice.userId.toString(), // ✅ FIX
        resourceId: item.itemId,
        quantity: item.quantity,
        invoiceId, // ✅ FIX
      });
    }

    // 🔥 PLAN
    if (item.type === "plan") {
      return this.createSubscriptionFromItem(
        invoice,
        item,
        startDate,
        invoiceId,
      );
    }

    // 🔥 ADDON RECURRENTE
    if (item.type === "addon") {
      return this.createRecurringFromItem(invoice, item, startDate, invoiceId);
    }
  }

  // ========================================
  // 🧠 PLANES
  // ========================================

  private async createSubscriptionFromItem(
    invoice: InvoiceDocument,
    item: any,
    startDate: Date,
    invoiceId: string,
  ) {
    const endDate = this.calculateEndDate(startDate, item.billingInterval);

    // 🔹 Eliminar cualquier plan activo previo del usuario
    await this.contractAssetModel.deleteMany({
      userId: invoice.userId,
      type: "plan",
      status: "active",
    });

    // 🔹 Crear el nuevo plan
    return this.contractAssetModel.create({
      userId: invoice.userId,
      resourceId: item.itemId,
      type: "plan",
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      billingInterval: item.billingInterval,
      startDate,
      endDate,
      status: "active",
      invoiceId,
      metadata: {
        invoiceId,
      },
    });
  }
  // ========================================
  // 🔁 ADDONS RECURRENTES
  // ========================================

  private async createRecurringFromItem(
    invoice: InvoiceDocument,
    item: any,
    startDate: Date,
    invoiceId: string,
  ) {
    const endDate = this.calculateEndDate(startDate, item.billingInterval);

    return this.contractAssetModel.create({
      userId: invoice.userId,
      resourceId: item.itemId,
      type: "addon",
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      billingInterval: item.billingInterval,
      startDate,
      endDate,
      status: "active",

      invoiceId, // 🔥 FIX CLAVE

      metadata: {
        invoiceId,
      },
    });
  }

  // ========================================
  // ⚡ ONE TIME (CRÉDITOS)
  // ========================================

  async assignOneTimeAsset(data: {
    userId: string;
    resourceId: string;
    quantity: number;
    invoiceId: string;
  }) {
    return this.contractAssetModel.create({
      userId: data.userId,
      resourceId: data.resourceId,
      type: "one-time",
      quantity: data.quantity,
      status: "consumed",

      invoiceId: data.invoiceId, // 🔥 FIX CLAVE

      metadata: {
        invoiceId: data.invoiceId,
      },
    });
  }

  // ========================================
  // 🛡️ DUPLICADOS
  // ========================================

  async existsByInvoice(invoiceId: string): Promise<boolean> {
    const exists = await this.contractAssetModel.exists({
      invoiceId, // 🔥 FIX (antes estaba mal)
    });

    return !!exists;
  }

  // ========================================
  // 📅 FECHAS
  // ========================================

  private calculateEndDate(start: Date, interval: string): Date {
    const end = new Date(start);

    switch (interval) {
      case "month":
        end.setMonth(end.getMonth() + 1);
        break;
      case "year":
        end.setFullYear(end.getFullYear() + 1);
        break;
      case "week":
        end.setDate(end.getDate() + 7);
        break;
      default:
        end.setDate(end.getDate() + 30);
    }

    return end;
  }

  async createFreeContractForUser(userId: string) {
    // 2️⃣ Verificar si el usuario ya tiene contrato Free
    const existing = await this.contractAssetModel.findOne({
      userId,
      resourceId: "699f30cfc5ac262e85e4145d",
      type: "plan",
    });

    if (existing) {
      console.log("⚠️ Usuario ya tiene contrato Free");
      return existing;
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1); // 1 año de duración

    // 3️⃣ Crear contrato Free
    const contract = await this.contractAssetModel.create({
      invoiceId: "1",
      userId,
      resourceId: "699f30cfc5ac262e85e4145d",
      type: "plan",
      quantity: 1,
      unitPrice: 0,
      billingInterval: "year", // Plan Free anual
      startDate,
      endDate,
      status: "active",
      metadata: {
        note: "Contrato Free asignado automáticamente al crear usuario",
      },
    });

    return contract;
  }
}
