import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info) {
    // If token is invalid → ignore error and continue as guest
    if (err || !user) {
      return null;
    }
    return user;
  }
}
