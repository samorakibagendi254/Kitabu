import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AppRole, AuthenticatedUser } from './types.js';

export function hasAnyRole(user: AuthenticatedUser, roles: AppRole[]): boolean {
  return roles.some(role => user.roles.includes(role));
}

export async function requireRoles(
  request: FastifyRequest,
  reply: FastifyReply,
  roles: AppRole[],
  options?: { requireStepUp?: boolean }
) {
  if (!request.user) {
    return reply.unauthorized('Authentication required');
  }

  if (!hasAnyRole(request.user, roles)) {
    return reply.forbidden('Insufficient role');
  }

  if (options?.requireStepUp && !request.user.stepUp) {
    return reply.status(428).send({
      message: 'Step-up authentication required'
    });
  }
}

export async function requireAuthenticated(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) {
    return reply.unauthorized('Authentication required');
  }
}

export async function requireSchoolContext(
  request: FastifyRequest,
  reply: FastifyReply,
  options?: { allowPlatformAdmin?: boolean }
) {
  const authError = await requireAuthenticated(request, reply);
  if (authError) {
    return authError;
  }

  if ((options?.allowPlatformAdmin ?? true) && request.user!.roles.includes('platform_admin')) {
    return;
  }

  if (!request.user!.schoolId) {
    return reply.forbidden('School-scoped access required');
  }
}

export async function requireResourceOwner(
  request: FastifyRequest,
  reply: FastifyReply,
  ownerUserId: string,
  options?: { allowRoles?: AppRole[] }
) {
  const authError = await requireAuthenticated(request, reply);
  if (authError) {
    return authError;
  }

  if (request.user!.id === ownerUserId) {
    return;
  }

  if (options?.allowRoles && hasAnyRole(request.user!, options.allowRoles)) {
    return;
  }

  return reply.forbidden('You do not have access to this resource');
}
