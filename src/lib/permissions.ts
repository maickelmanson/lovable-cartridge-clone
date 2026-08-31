export type AppRole = "admin" | "gerente" | "vendedor" | "tecnico";

export type Permission =
  | "pedido.criar"
  | "pedido.editar"
  | "pedido.finalizar"
  | "pedido.reabrir"
  | "pedido.deletar"
  | "cartucho.status"
  | "cartucho.editar"
  | "cliente.criar"
  | "cliente.editar"
  | "cliente.deletar"
  | "modelo.gerenciar"
  | "empresa.editar"
  | "reman.finalizar"
  | "usuarios.gerenciar"
  | "mensagens.editar"
  | "mensagens.ver"
  | "auditoria.ver";

const MATRIX: Record<AppRole, Permission[] | "*"> = {
  admin: "*",
  gerente: [
    "pedido.criar",
    "pedido.editar",
    "pedido.finalizar",
    "pedido.reabrir",
    "cartucho.status",
    "cartucho.editar",
    "cliente.criar",
    "cliente.editar",
    "modelo.gerenciar",
    "empresa.editar",
    "reman.finalizar",
    "auditoria.ver",
    "mensagens.editar",
    "mensagens.ver",
  ],
  vendedor: [
    "pedido.criar",
    "pedido.editar",
    "cartucho.status",
    "cartucho.editar",
    "cliente.criar",
    "modelo.gerenciar",
    "mensagens.ver",
  ],
  tecnico: ["cartucho.status"],
};

export const PERMISSION_LABEL: Partial<Record<Permission, string>> = {
  "pedido.criar": "criar pedidos",
  "pedido.editar": "editar pedidos",
  "pedido.finalizar": "finalizar pedidos",
  "pedido.reabrir": "reabrir pedidos",
  "pedido.deletar": "excluir pedidos",
  "cartucho.status": "alterar o status dos cartuchos",
  "cartucho.editar": "editar cartuchos do pedido",
  "cliente.criar": "cadastrar clientes",
  "cliente.editar": "editar clientes",
  "cliente.deletar": "excluir clientes",
  "modelo.gerenciar": "gerenciar modelos de cartucho",
  "empresa.editar": "alterar os dados da empresa",
  "reman.finalizar": "finalizar remanufatura",
  "usuarios.gerenciar": "gerenciar usuários",
  "auditoria.ver": "ver a auditoria",
  "mensagens.editar": "editar as mensagens padrão do WhatsApp",
  "mensagens.ver": "ver o histórico de mensagens enviadas",
};

/** Agrupamento usado nas caixas de marcação da tela de usuários. */
export const PERMISSION_GROUPS: { grupo: string; permissions: Permission[] }[] = [
  {
    grupo: "Pedidos",
    permissions: [
      "pedido.criar",
      "pedido.editar",
      "pedido.finalizar",
      "pedido.reabrir",
      "pedido.deletar",
    ],
  },
  { grupo: "Cartuchos", permissions: ["cartucho.status", "cartucho.editar", "modelo.gerenciar"] },
  { grupo: "Clientes", permissions: ["cliente.criar", "cliente.editar", "cliente.deletar"] },
  { grupo: "Remanufatura", permissions: ["reman.finalizar"] },
  {
    grupo: "Administração",
    permissions: [
      "empresa.editar",
      "usuarios.gerenciar",
      "auditoria.ver",
      "mensagens.editar",
      "mensagens.ver",
    ],
  },
];

export const ALL_PERMISSIONS: Permission[] = PERMISSION_GROUPS.flatMap((g) => g.permissions);

/** Conjunto padrão de permissões de um papel. */
export function permissionsForRole(role: AppRole | null | undefined): Permission[] {
  if (!role) return [];
  const allowed = MATRIX[role];
  if (!allowed) return [];
  return allowed === "*" ? [...ALL_PERMISSIONS] : [...allowed];
}

/** Permissões efetivas: usa a personalização quando houver, senão o padrão do papel. */
export function resolvePermissions(
  role: AppRole | null | undefined,
  overrides?: Permission[] | string[] | null,
): Permission[] {
  if (Array.isArray(overrides)) {
    const validas: Permission[] = (overrides as string[]).filter((p): p is Permission =>
      ALL_PERMISSIONS.includes(p as Permission),
    );
    // Admin nunca perde o acesso à gestão de usuários (evita travar o sistema).
    if (role === "admin" && !validas.includes("usuarios.gerenciar")) {
      validas.push("usuarios.gerenciar");
    }
    return validas;
  }
  return permissionsForRole(role);
}

export type PermissionSource =
  | AppRole
  | null
  | undefined
  | { role?: AppRole | null; permissions?: Permission[] | string[] | null };

export function can(source: PermissionSource, permission: Permission): boolean {
  if (!source) return false;
  if (typeof source === "string") {
    return permissionsForRole(source).includes(permission);
  }
  return resolvePermissions(source.role ?? null, source.permissions ?? null).includes(permission);
}
