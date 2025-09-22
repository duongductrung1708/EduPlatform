import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // debug: required roles
    
    if (!requiredRoles) {
      // debug: no roles required
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    // debug: user from request
    
    // Check if user exists and has role
    if (!user || !user.role) {
      // debug: deny access - user/role missing
      return false;
    }
    
    const hasRole = requiredRoles.some((role) => user.role === role);
    // debug: user role check
    
    return hasRole;
  }
}
