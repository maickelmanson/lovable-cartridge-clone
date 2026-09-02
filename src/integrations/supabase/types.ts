export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_label: string | null
          entity_type: string | null
          id: number
          ip_address: string | null
          session_id: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_label?: string | null
          entity_type?: string | null
          id?: number
          ip_address?: string | null
          session_id?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_label?: string | null
          entity_type?: string | null
          id?: number
          ip_address?: string | null
          session_id?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      cartuchos_cadastro: {
        Row: {
          created_at: string
          id: number
          modelo_01: string
          modelo_02: string
          owner_id: string | null
          price_final_customer: number | null
          price_reseller: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          modelo_01: string
          modelo_02: string
          owner_id?: string | null
          price_final_customer?: number | null
          price_reseller?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          modelo_01?: string
          modelo_02?: string
          owner_id?: string | null
          price_final_customer?: number | null
          price_reseller?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          cnpj: string | null
          commercial_profile: Database["public"]["Enums"]["commercial_profile"]
          cpf: string | null
          created_at: string
          endereco: string | null
          id: number
          inscricao_estadual: string | null
          nome: string
          observacoes: string | null
          owner_id: string | null
          telefone: string | null
          telefone2: string | null
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          commercial_profile?: Database["public"]["Enums"]["commercial_profile"]
          cpf?: string | null
          created_at?: string
          endereco?: string | null
          id?: number
          inscricao_estadual?: string | null
          nome: string
          observacoes?: string | null
          owner_id?: string | null
          telefone?: string | null
          telefone2?: string | null
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          commercial_profile?: Database["public"]["Enums"]["commercial_profile"]
          cpf?: string | null
          created_at?: string
          endereco?: string | null
          id?: number
          inscricao_estadual?: string | null
          nome?: string
          observacoes?: string | null
          owner_id?: string | null
          telefone?: string | null
          telefone2?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      empresa_dados: {
        Row: {
          bairro: string | null
          celular: string | null
          cep: string | null
          cidade: string | null
          cnpj_cpf: string | null
          created_at: string
          email: string | null
          empresa: string | null
          endereco: string | null
          estado: string | null
          id: number
          logo_url: string | null
          nome: string | null
          numero: string | null
          owner_id: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj_cpf?: string | null
          created_at?: string
          email?: string | null
          empresa?: string | null
          endereco?: string | null
          estado?: string | null
          id?: number
          logo_url?: string | null
          nome?: string | null
          numero?: string | null
          owner_id?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj_cpf?: string | null
          created_at?: string
          email?: string | null
          empresa?: string | null
          endereco?: string | null
          estado?: string | null
          id?: number
          logo_url?: string | null
          nome?: string | null
          numero?: string | null
          owner_id?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          context: Json | null
          created_at: string
          error_message: string
          error_stack: string | null
          error_type: string
          id: number
          notes: string | null
          owner_id: string | null
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          severity: Database["public"]["Enums"]["error_severity"]
          updated_at: string
        }
        Insert: {
          context?: Json | null
          created_at?: string
          error_message: string
          error_stack?: string | null
          error_type: string
          id?: number
          notes?: string | null
          owner_id?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["error_severity"]
          updated_at?: string
        }
        Update: {
          context?: Json | null
          created_at?: string
          error_message?: string
          error_stack?: string | null
          error_type?: string
          id?: number
          notes?: string | null
          owner_id?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["error_severity"]
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          channel: string
          cliente_id: number | null
          created_at: string
          destination: string
          error: string | null
          external_id: string | null
          id: number
          message: string
          owner_id: string | null
          pedido_id: number | null
          status: string
          updated_at: string
        }
        Insert: {
          channel: string
          cliente_id?: number | null
          created_at?: string
          destination: string
          error?: string | null
          external_id?: string | null
          id?: number
          message: string
          owner_id?: string | null
          pedido_id?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          channel?: string
          cliente_id?: number | null
          created_at?: string
          destination?: string
          error?: string | null
          external_id?: string | null
          id?: number
          message?: string
          owner_id?: string | null
          pedido_id?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      pedido_cartuchos: {
        Row: {
          cartucho_id: number | null
          codigo: string | null
          created_at: string
          id: number
          observacoes: string | null
          owner_id: string | null
          pedido_id: number
          peso_chegada: string | null
          peso_saida: string | null
          protegido: number
          status: Database["public"]["Enums"]["pedido_cartucho_status"]
          updated_at: string
          usuario_id: string | null
        }
        Insert: {
          cartucho_id?: number | null
          codigo?: string | null
          created_at?: string
          id?: number
          observacoes?: string | null
          owner_id?: string | null
          pedido_id: number
          peso_chegada?: string | null
          peso_saida?: string | null
          protegido?: number
          status?: Database["public"]["Enums"]["pedido_cartucho_status"]
          updated_at?: string
          usuario_id?: string | null
        }
        Update: {
          cartucho_id?: number | null
          codigo?: string | null
          created_at?: string
          id?: number
          observacoes?: string | null
          owner_id?: string | null
          pedido_id?: number
          peso_chegada?: string | null
          peso_saida?: string | null
          protegido?: number
          status?: Database["public"]["Enums"]["pedido_cartucho_status"]
          updated_at?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedido_cartuchos_cartucho_id_fkey"
            columns: ["cartucho_id"]
            isOneToOne: false
            referencedRelation: "cartuchos_cadastro"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_cartuchos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_cartuchos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          cliente_id: number
          created_at: string
          data_finalizacao: string | null
          id: number
          numero: string
          observacao_geral: string | null
          owner_id: string | null
          status: Database["public"]["Enums"]["pedido_status"]
          updated_at: string
        }
        Insert: {
          cliente_id: number
          created_at?: string
          data_finalizacao?: string | null
          id?: number
          numero: string
          observacao_geral?: string | null
          owner_id?: string | null
          status?: Database["public"]["Enums"]["pedido_status"]
          updated_at?: string
        }
        Update: {
          cliente_id?: number
          created_at?: string
          data_finalizacao?: string | null
          id?: number
          numero?: string
          observacao_geral?: string | null
          owner_id?: string | null
          status?: Database["public"]["Enums"]["pedido_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          email: string
          id: string
          last_login: string | null
          name: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          id: string
          last_login?: string | null
          name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          id?: string
          last_login?: string | null
          name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      reman_order_items: {
        Row: {
          cartucho_id: number
          created_at: string
          description_snapshot: string | null
          id: number
          line_total: number
          model_code_snapshot: string | null
          order_id: number
          owner_id: string | null
          price_source: Database["public"]["Enums"]["commercial_profile"]
          quantity: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          cartucho_id: number
          created_at?: string
          description_snapshot?: string | null
          id?: number
          line_total: number
          model_code_snapshot?: string | null
          order_id: number
          owner_id?: string | null
          price_source: Database["public"]["Enums"]["commercial_profile"]
          quantity: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          cartucho_id?: number
          created_at?: string
          description_snapshot?: string | null
          id?: number
          line_total?: number
          model_code_snapshot?: string | null
          order_id?: number
          owner_id?: string | null
          price_source?: Database["public"]["Enums"]["commercial_profile"]
          quantity?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reman_order_items_cartucho_id_fkey"
            columns: ["cartucho_id"]
            isOneToOne: false
            referencedRelation: "cartuchos_cadastro"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reman_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "reman_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      reman_order_units: {
        Row: {
          cartucho_id: number
          created_at: string
          defect_type: string | null
          id: number
          is_warranty: boolean
          notes: string | null
          order_item_id: number
          output_weight: number | null
          owner_id: string | null
          status: Database["public"]["Enums"]["reman_unit_status"]
          unit_code: string
          updated_at: string
        }
        Insert: {
          cartucho_id: number
          created_at?: string
          defect_type?: string | null
          id?: number
          is_warranty?: boolean
          notes?: string | null
          order_item_id: number
          output_weight?: number | null
          owner_id?: string | null
          status: Database["public"]["Enums"]["reman_unit_status"]
          unit_code: string
          updated_at?: string
        }
        Update: {
          cartucho_id?: number
          created_at?: string
          defect_type?: string | null
          id?: number
          is_warranty?: boolean
          notes?: string | null
          order_item_id?: number
          output_weight?: number | null
          owner_id?: string | null
          status?: Database["public"]["Enums"]["reman_unit_status"]
          unit_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reman_order_units_cartucho_id_fkey"
            columns: ["cartucho_id"]
            isOneToOne: false
            referencedRelation: "cartuchos_cadastro"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reman_order_units_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "reman_order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      reman_orders: {
        Row: {
          cliente_id: number
          commercial_profile_snapshot: string
          created_at: string
          discount: number
          id: number
          notes: string | null
          observacao_geral: string | null
          order_number: string
          owner_id: string | null
          pedido_id: number | null
          status: Database["public"]["Enums"]["reman_order_status"]
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          cliente_id: number
          commercial_profile_snapshot: string
          created_at?: string
          discount?: number
          id?: number
          notes?: string | null
          observacao_geral?: string | null
          order_number: string
          owner_id?: string | null
          pedido_id?: number | null
          status?: Database["public"]["Enums"]["reman_order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          cliente_id?: number
          commercial_profile_snapshot?: string
          created_at?: string
          discount?: number
          id?: number
          notes?: string | null
          observacao_geral?: string | null
          order_number?: string
          owner_id?: string | null
          pedido_id?: number | null
          status?: Database["public"]["Enums"]["reman_order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reman_orders_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reman_orders_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          active: boolean
          created_at: string
          email: string
          id: string
          last_login: string | null
          name: string
          password: string
          password_changed_at: string | null
          permissions: Json | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          id?: string
          last_login?: string | null
          name: string
          password: string
          password_changed_at?: string | null
          permissions?: Json | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          id?: string
          last_login?: string | null
          name?: string
          password?: string
          password_changed_at?: string | null
          permissions?: Json | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_templates: {
        Row: {
          chave: string
          corpo: string
          created_at: string
          id: number
          titulo: string
          updated_at: string
        }
        Insert: {
          chave: string
          corpo: string
          created_at?: string
          id?: number
          titulo: string
          updated_at?: string
        }
        Update: {
          chave?: string
          corpo?: string
          created_at?: string
          id?: number
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "user" | "gerente" | "vendedor" | "tecnico"
      commercial_profile: "CLIENTE_FINAL" | "REVENDA"
      error_severity: "baixa" | "media" | "alta" | "critica"
      pedido_cartucho_status:
        | "em_espera"
        | "em_andamento"
        | "processo"
        | "funcionando"
        | "circuito_queimado"
        | "defeito_cabeca"
        | "garantia"
      pedido_status: "aberto" | "finalizado"
      reman_order_status:
        | "aberto"
        | "em_processamento"
        | "finalizado"
        | "cancelado"
      reman_unit_status: "FUNCIONANDO" | "COM_PROBLEMA"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "gerente", "vendedor", "tecnico"],
      commercial_profile: ["CLIENTE_FINAL", "REVENDA"],
      error_severity: ["baixa", "media", "alta", "critica"],
      pedido_cartucho_status: [
        "em_espera",
        "em_andamento",
        "processo",
        "funcionando",
        "circuito_queimado",
        "defeito_cabeca",
        "garantia",
      ],
      pedido_status: ["aberto", "finalizado"],
      reman_order_status: [
        "aberto",
        "em_processamento",
        "finalizado",
        "cancelado",
      ],
      reman_unit_status: ["FUNCIONANDO", "COM_PROBLEMA"],
    },
  },
} as const
