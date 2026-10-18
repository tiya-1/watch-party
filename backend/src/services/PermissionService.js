export class PermissionService {
  static canControlPlayback(role) {
    return role === 'host' || role === 'moderator';
  }

  static canManageRoles(role) {
    return role === 'host';
  }
}