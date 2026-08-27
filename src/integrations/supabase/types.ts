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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      banners: {
        Row: {
          badge: string | null
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          link_url: string | null
          sort_order: number
          subtitle: string | null
          title: string
        }
        Insert: {
          badge?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          subtitle?: string | null
          title: string
        }
        Update: {
          badge?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          subtitle?: string | null
          title?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          created_at: string
          description: string | null
          discount_percent: number
          ends_at: string | null
          id: string
          is_active: boolean
          sort_order: number
          starts_at: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_percent?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          starts_at?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_percent?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          starts_at?: string | null
          title?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          min_order: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          min_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          min_order?: number
        }
        Relationships: []
      }
      device_tokens: {
        Row: {
          created_at: string
          id: string
          token: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          token: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          token?: string
          user_id?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price: number
          variant_label: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          unit_price?: number
          variant_label?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
          variant_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_messages: {
        Row: {
          created_at: string
          customer_name: string
          id: string
          image_url: string | null
          message: string | null
          phone: string
          status: string
        }
        Insert: {
          created_at?: string
          customer_name: string
          id?: string
          image_url?: string | null
          message?: string | null
          phone: string
          status?: string
        }
        Update: {
          created_at?: string
          customer_name?: string
          id?: string
          image_url?: string | null
          message?: string | null
          phone?: string
          status?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          address: string
          coupon_code: string | null
          created_at: string
          customer_name: string
          delivery_fee: number
          discount: number
          id: string
          notes: string | null
          order_number: number
          payment_method: string
          phone: string
          status: string
          subtotal: number
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          address: string
          coupon_code?: string | null
          created_at?: string
          customer_name: string
          delivery_fee?: number
          discount?: number
          id?: string
          notes?: string | null
          order_number?: number
          payment_method?: string
          phone: string
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          address?: string
          coupon_code?: string | null
          created_at?: string
          customer_name?: string
          delivery_fee?: number
          discount?: number
          id?: string
          notes?: string | null
          order_number?: number
          payment_method?: string
          phone?: string
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      page_visits: {
        Row: {
          created_at: string
          id: string
          path: string
          referrer: string | null
          session_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          path: string
          referrer?: string | null
          session_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          path?: string
          referrer?: string | null
          session_id?: string | null
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          compare_at_price: number | null
          created_at: string
          id: string
          label: string
          price: number
          product_id: string
          sku: string | null
          sort_order: number
          stock: number
        }
        Insert: {
          compare_at_price?: number | null
          created_at?: string
          id?: string
          label: string
          price?: number
          product_id: string
          sku?: string | null
          sort_order?: number
          stock?: number
        }
        Update: {
          compare_at_price?: number | null
          created_at?: string
          id?: string
          label?: string
          price?: number
          product_id?: string
          sku?: string | null
          sort_order?: number
          stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          images: Json
          is_active: boolean
          is_featured: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: Json
          is_active?: boolean
          is_featured?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: Json
          is_active?: boolean
          is_featured?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          key: string
          label: string | null
          updated_at: string
          value: string | null
        }
        Insert: {
          key: string
          label?: string | null
          updated_at?: string
          value?: string | null
        }
        Update: {
          key?: string
          label?: string | null
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          contact: string
          created_at: string
          id: string
          message: string
          name: string
          status: string
        }
        Insert: {
          contact: string
          created_at?: string
          id?: string
          message: string
          name: string
          status?: string
        }
        Update: {
          contact?: string
          created_at?: string
          id?: string
          message?: string
          name?: string
          status?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
