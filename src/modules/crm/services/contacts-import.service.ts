import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Contact } from "../schemas/contact.schema";
import { ImportContactsDto } from "../dto/import-contacts.dto";
import { ContactStatus } from "../enums/contact-status.enum";

export interface ImportSummary {
  imported: number;
  skipped: number;
  duplicates: number;
  errors: Array<{ index: number; reason: string }>;
}

@Injectable()
export class ContactsImportService {
  @InjectModel(Contact.name)
  private contactModel: Model<Contact>;

  /**
   * Import multiple contacts with duplicate prevention
   */
  async importContacts(importDto: ImportContactsDto): Promise<ImportSummary> {
    console.log("===== IMPORT CONTACTS CALLED =====");

    console.log("[STEP 1] RAW DTO:", JSON.stringify(importDto, null, 2));

    const { ownerId, source, contacts } = importDto;

    console.log("[STEP 2] ownerId:", ownerId);
    console.log("[STEP 2] source:", source);
    console.log("[STEP 2] contacts length:", contacts?.length);

    if (!ownerId) {
      console.error("[FATAL] ownerId is missing");
      throw new BadRequestException("ownerId is required");
    }

    if (!contacts || contacts.length === 0) {
      console.error("[FATAL] contacts array empty");
      throw new BadRequestException("contacts array cannot be empty");
    }

    console.log("[STEP 3] Model info");
    console.log("DB NAME:", this.contactModel.db.name);
    console.log("COLLECTION:", this.contactModel.collection.name);

    const summary: ImportSummary = {
      imported: 0,
      skipped: 0,
      duplicates: 0,
      errors: [],
    };

    const contactsToInsert: any[] = [];

    console.log("[STEP 4] Building insert payload...");

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];

      console.log(`[LOOP ${i}] RAW CONTACT:`, contact);

      const email =
        typeof contact.email === "string" && contact.email.trim()
          ? contact.email.trim().toLowerCase()
          : undefined;

      const phone =
        typeof contact.phone === "string" && contact.phone.trim()
          ? contact.phone.trim()
          : undefined;

      const prepared = {
        ownerId,
        name: contact.name?.trim() || "Unnamed Contact",
        email,
        phone,
        status: ContactStatus.NEW,
        source,
        tags: Array.isArray(contact.tags) ? contact.tags : [],
        customFields:
          contact.customFields && typeof contact.customFields === "object"
            ? contact.customFields
            : {},
        isDeleted: false,
      };

      console.log(`[LOOP ${i}] PREPARED CONTACT:`, prepared);

      contactsToInsert.push(prepared);
    }

    console.log("[STEP 5] contactsToInsert length:", contactsToInsert.length);

    console.log("[STEP 5] SAMPLE INSERT OBJECT:", contactsToInsert[0]);

    if (contactsToInsert.length === 0) {
      console.warn("[STOP] Nothing to insert");
      return summary;
    }

    console.log("[STEP 6] Executing insertMany...");

    try {
      const result = await this.contactModel.insertMany(contactsToInsert, {
        ordered: false,
      });

      console.log("[STEP 7] insertMany RESULT:", result.length);

      summary.imported = result.length;

      const count = await this.contactModel.countDocuments({ ownerId });
      console.log("[STEP 8] Contacts in DB for ownerId:", count);

      console.log("===== IMPORT CONTACTS END =====");

      return summary;
    } catch (error) {
      console.error("🔥 INSERT FAILED 🔥");
      console.error(error);
      throw error;
    }
  }
}
