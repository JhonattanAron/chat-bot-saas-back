import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as express from "express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      "http://localhost:3000",
      "https://www.aurentric.com",
      "https://aurentric.com",
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  });
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  await app.listen(process.env.PORT ?? 8080);
}
bootstrap();
