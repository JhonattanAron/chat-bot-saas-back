import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as bodyParser from "body-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: "http://localhost:3000",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  });

  // Body-parser global para todas las rutas (límite normal)
  app.use(bodyParser.json({ limit: "1mb" }));
  app.use(bodyParser.urlencoded({ limit: "1mb", extended: true }));

  // Middleware solo para /chat/voice con límite grande
  app.use("/chat/voice", bodyParser.json({ limit: "10mb" }));

  await app.listen(process.env.PORT ?? 8080);
}
bootstrap();
