import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

@Injectable()
export class ProxyAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    // headers siempre vienen en lowercase en Node
    const userId = req.headers["x-user-id"];

    if (!userId) {
      throw new UnauthorizedException("Missing x-user-id header");
    }

    // Inyectamos el user para el resto del backend
    req.user = {
      id: String(userId),
    };

    return true;
  }
}
