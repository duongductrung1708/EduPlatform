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
    console.log('RolesGuard - Required roles:', requiredRoles);
    
    if (!requiredRoles) {
      console.log('RolesGuard - No roles required, allowing access');
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    console.log('RolesGuard - User from request:', user);
    
    // Check if user exists and has role
    if (!user || !user.role) {
      console.log('RolesGuard - User or role missing, denying access');
      return false;
    }
    
    const hasRole = requiredRoles.some((role) => user.role === role);
    console.log('RolesGuard - User role:', user.role, 'Has required role:', hasRole);
    
    return hasRole;
  }
}
