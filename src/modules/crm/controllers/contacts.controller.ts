import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ContactsService,
  ListContactsFilter,
} from "../services/contacts.service";
import { ContactsImportService } from "../services/contacts-import.service";
import { CreateContactDto } from "../dto/create-contact.dto";
import { UpdateContactDto } from "../dto/update-contact.dto";
import { ImportContactsDto } from "../dto/import-contacts.dto";
import { ContactStatus } from "../enums/contact-status.enum";
import { ProxyAuthGuard } from "src/modules/auth/proxy-auth.guard";

@Controller("crm")
export class ContactsController {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly contactsImportService: ContactsImportService,
  ) {}

  /**
   * POST /crm/contacts
   */
  @Post()
  create(@Body() createContactDto: CreateContactDto, @Req() req: any) {
    const workspaceId = req.workspaceId;
    return this.contactsService.create(workspaceId, createContactDto);
  }

  @UseGuards(ProxyAuthGuard)
  @Get("contacts/count")
  countContacts(
    @Query("status") status?: string,
    @Query("tags") tags?: string,
    @Query("assignedTo") assignedTo?: string,
    @Query("search") search?: string,
    @Req() req?: any,
  ) {
    const ownerId = req.user?.id;

    const filters: ListContactsFilter = {};

    if (
      status &&
      Object.values(ContactStatus).includes(status as ContactStatus)
    ) {
      filters.status = status as ContactStatus;
    }

    if (tags) {
      filters.tags = tags.split(",").map((t) => t.trim());
    }

    if (assignedTo) {
      filters.assignedTo = assignedTo;
    }

    if (search) {
      filters.search = search;
    }

    return this.contactsService.count(ownerId, filters).then((count) => ({
      count,
    }));
  }

  /**
   * GET /crm/contacts
   */
  @UseGuards(ProxyAuthGuard)
  @Get("contacts")
  findAll(
    @Query("status") status?: string,
    @Query("tags") tags?: string,
    @Query("assignedTo") assignedTo?: string,
    @Query("search") search?: string,
    @Query("limit") limit = "50",
    @Query("offset") offset = "0",
    @Req() req?: any,
  ) {
    const ownerId = req.user?.id;

    const filters: ListContactsFilter = {};

    if (
      status &&
      Object.values(ContactStatus).includes(status as ContactStatus)
    ) {
      filters.status = status as ContactStatus;
    }

    if (tags) {
      filters.tags = tags.split(",").map((t) => t.trim());
    }

    if (assignedTo) {
      filters.assignedTo = assignedTo;
    }

    if (search) {
      filters.search = search;
    }

    return this.contactsService.findAll(
      ownerId,
      filters,
      Number(limit),
      Number(offset),
    );
  }

  /**
   * GET /crm/contacts/:id
   */
  @UseGuards(ProxyAuthGuard)
  @Get("contacts/:contact_id")
  findById(@Param("contact_id") id: string, @Req() req: any) {
    const ownerId = req.user.id;
    return this.contactsService.findById(ownerId, id);
  }

  /**
   * PATCH /crm/contacts/:id
   */
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateContactDto: UpdateContactDto,
    @Req() req: any,
  ) {
    const workspaceId = req.workspaceId;
    return this.contactsService.update(workspaceId, id, updateContactDto);
  }

  /**
   * DELETE /crm/contacts/:id
   */
  @Delete(":id")
  async delete(
    @Param("id") id: string,
    @Query("hardDelete") hardDelete?: string,
    @Req() req?: any,
  ) {
    const workspaceId = req.workspaceId;
    const softDelete = hardDelete !== "true";

    await this.contactsService.delete(workspaceId, id, softDelete);

    return { message: "Contact deleted successfully" };
  }

  /**
   * POST /crm/contacts/import
   */
  @UseGuards(ProxyAuthGuard)
  @Post("import")
  import(@Body() importContactsDto: ImportContactsDto, @Req() req: any) {
    // 🔐 usuario autenticado (desde NextAuth vía proxy)
    const userId = req.user.id;

    importContactsDto.ownerId = userId;

    return this.contactsImportService.importContacts(importContactsDto);
  }
}
