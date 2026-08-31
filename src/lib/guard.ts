import { getCurrentUser } from "@/lib/authClient";
import { can, PERMISSION_LABEL, type Permission } from "@/lib/permissions";

/** Lança um erro amigável quando o usuário logado não tem a permissão exigida. */
export function requirePermission(permission: Permission) {
  const user = getCurrentUser();
  if (!can(user, permission)) {
    const label = PERMISSION_LABEL[permission] ?? permission;
    throw new Error(`Seu perfil não tem permissão para ${label}.`);
  }
}

export function hasPermission(permission: Permission) {
  return can(getCurrentUser(), permission);
}
