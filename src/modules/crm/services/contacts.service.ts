import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Contact } from "../schemas/contact.schema";
import { CreateContactDto } from "../dto/create-contact.dto";
import { UpdateContactDto } from "../dto/update-contact.dto";
import { ContactStatus } from "../enums/contact-status.enum";

export interface ListContactsFilter {
  status?: ContactStatus;
  tags?: string[];
  assignedTo?: string;
  search?: string; // searches name, email, phone
}

@Injectable()
export class ContactsService {
  @InjectModel(Contact.name)
  private contactModel: Model<Contact>;

  /**
   * Create a new contact
   */
  async create(
    workspaceId: string,
    createContactDto: CreateContactDto,
  ): Promise<Contact> {
    if (!workspaceId) {
      throw new BadRequestException("workspaceId is required");
    }

    const contact = new this.contactModel({
      ...createContactDto,
      workspaceId,
    });

    try {
      return await contact.save();
    } catch (error) {
      throw new InternalServerErrorException("Failed to create contact");
    }
  }

  /**
   * List contacts with filters and pagination
   */
  async findAll(
    ownerId: string,
    filters: ListContactsFilter = {},
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ data: Contact[]; total: number }> {
    if (!ownerId) {
      throw new BadRequestException("ownerId is required");
    }

    const query: any = { ownerId, isDeleted: false };

    // Apply filters
    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }

    if (filters.assignedTo) {
      query.assignedTo = filters.assignedTo;
    }

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { email: { $regex: filters.search, $options: "i" } },
        { phone: { $regex: filters.search, $options: "i" } },
      ];
    }

    try {
      const [data, total] = await Promise.all([
        this.contactModel.find(query).limit(limit).skip(offset).exec(),
        this.contactModel.countDocuments(query),
      ]);

      return { data, total };
    } catch (error) {
      throw new InternalServerErrorException("Failed to fetch contacts");
    }
  }

  /**
   * Get a single contact by ID (workspace scoped)
   */
  async findById(ownerId: string, contactId: string): Promise<Contact> {
    if (!ownerId) {
      throw new BadRequestException("ownerId is required");
    }

    const contact = await this.contactModel.findOne({
      _id: contactId,
      ownerId: ownerId,
      isDeleted: false,
    });

    if (!contact) {
      throw new BadRequestException("Contact not found");
    }

    return contact;
  }

  /**
   * Update a contact
   */
  async update(
    workspaceId: string,
    contactId: string,
    updateContactDto: UpdateContactDto,
  ): Promise<Contact> {
    if (!workspaceId) {
      throw new BadRequestException("workspaceId is required");
    }

    const contact = await this.contactModel.findOneAndUpdate(
      { _id: contactId, workspaceId, isDeleted: false },
      { $set: updateContactDto },
      { new: true },
    );

    if (!contact) {
      throw new BadRequestException("Contact not found");
    }

    return contact;
  }

  /**
   * Soft delete a contact
   */
  async delete(
    workspaceId: string,
    contactId: string,
    softDelete: boolean = true,
  ): Promise<void> {
    if (!workspaceId) {
      throw new BadRequestException("workspaceId is required");
    }

    const result = softDelete
      ? await this.contactModel.updateOne(
          { _id: contactId, workspaceId },
          { $set: { isDeleted: true } },
        )
      : await this.contactModel.deleteOne({ _id: contactId, workspaceId });

    if ("matchedCount" in result && result.matchedCount === 0) {
      throw new BadRequestException("Contact not found");
    }

    if ("deletedCount" in result && result.deletedCount === 0) {
      throw new BadRequestException("Contact not found");
    }
  }

  async count(
    ownerId: string,
    filters: ListContactsFilter = {},
  ): Promise<number> {
    const query: any = {
      ownerId,
      deletedAt: null,
    };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.tags?.length) {
      query.tags = { $in: filters.tags };
    }

    if (filters.assignedTo) {
      query.assignedTo = filters.assignedTo;
    }

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { phone: { $regex: filters.search, $options: "i" } },
        { email: { $regex: filters.search, $options: "i" } },
      ];
    }

    return this.contactModel.countDocuments(query);
  }
}
