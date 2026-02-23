import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { SessionService } from '../session.service';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private sessionService: SessionService) {}

  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();
    const sessionId = request.cookies.sessionId;

    if (!sessionId) {
      throw new UnauthorizedException('No session found. Please connect first.');
    }

    const session = this.sessionService.getSession(sessionId);

    if (!session) {
      throw new UnauthorizedException('Session expired or invalid. Please reconnect.');
    }

    // Inject API key and session ID into request
    (request as any).apiKey = session.apiKey;
    (request as any).sessionId = sessionId;

    return true;
  }
}
