import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: "http://localhost:3000", // frontend permitido
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true, // si vas a enviar cookies o auth headers
  });
  await app.listen(process.env.PORT ?? 8080);
}
bootstrap();
