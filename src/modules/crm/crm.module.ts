import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Contact, ContactSchema } from "./schemas/contact.schema";
import { ContactsController } from "./controllers/contacts.controller";
import { ContactsService } from "./services/contacts.service";
import { ContactsImportService } from "./services/contacts-import.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Contact.name, schema: ContactSchema }]),
  ],
  controllers: [ContactsController],
  providers: [ContactsService, ContactsImportService],
  exports: [ContactsService, ContactsImportService],
})
export class CrmModule {}
