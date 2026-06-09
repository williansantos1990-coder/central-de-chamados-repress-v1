// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action_type: string
          created_at: string
          id: string
          new_value: string | null
          old_value: string | null
          ticket_id: number
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          ticket_id: number
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          ticket_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'activity_log_ticket_id_fkey'
            columns: ['ticket_id']
            isOneToOne: false
            referencedRelation: 'tickets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'activity_log_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_internal: boolean
          ticket_id: number
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id: number
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'comments_ticket_id_fkey'
            columns: ['ticket_id']
            isOneToOne: false
            referencedRelation: 'tickets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database['public']['Enums']['user_role']
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          role?: Database['public']['Enums']['user_role']
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: Database['public']['Enums']['user_role']
          updated_at?: string
        }
        Relationships: []
      }
      sla_policies: {
        Row: {
          category_id: string
          created_at: string
          duration_hours: number
          id: string
          priority: Database['public']['Enums']['ticket_priority']
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          duration_hours: number
          id?: string
          priority: Database['public']['Enums']['ticket_priority']
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          duration_hours?: number
          id?: string
          priority?: Database['public']['Enums']['ticket_priority']
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'sla_policies_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      tickets: {
        Row: {
          assignee_id: string | null
          category_id: string
          created_at: string
          deadline: string | null
          description: string
          id: number
          priority: Database['public']['Enums']['ticket_priority']
          requester_id: string
          status: Database['public']['Enums']['ticket_status']
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          category_id: string
          created_at?: string
          deadline?: string | null
          description: string
          id?: never
          priority?: Database['public']['Enums']['ticket_priority']
          requester_id: string
          status?: Database['public']['Enums']['ticket_status']
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          category_id?: string
          created_at?: string
          deadline?: string | null
          description?: string
          id?: never
          priority?: Database['public']['Enums']['ticket_priority']
          requester_id?: string
          status?: Database['public']['Enums']['ticket_status']
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tickets_assignee_id_fkey'
            columns: ['assignee_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tickets_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tickets_requester_id_fkey'
            columns: ['requester_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      ticket_priority: 'low' | 'medium' | 'high' | 'critical'
      ticket_status:
        | 'open'
        | 'analyzing'
        | 'waiting_requester'
        | 'in_service'
        | 'resolved'
        | 'closed'
        | 'canceled'
      user_role: 'requester' | 'agent' | 'admin'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ticket_priority: ['low', 'medium', 'high', 'critical'],
      ticket_status: [
        'open',
        'analyzing',
        'waiting_requester',
        'in_service',
        'resolved',
        'closed',
        'canceled',
      ],
      user_role: ['requester', 'agent', 'admin'],
    },
  },
} as const

// ====== DATABASE EXTENDED CONTEXT (auto-generated) ======
// This section contains actual PostgreSQL column types, constraints, RLS policies,
// functions, triggers, indexes and materialized views not present in the type definitions above.
// IMPORTANT: The TypeScript types above map UUID, TEXT, VARCHAR all to "string".
// Use the COLUMN TYPES section below to know the real PostgreSQL type for each column.
// Always use the correct PostgreSQL type when writing SQL migrations.

// --- COLUMN TYPES (actual PostgreSQL types) ---
// Use this to know the real database type when writing migrations.
// "string" in TypeScript types above may be uuid, text, varchar, timestamptz, etc.
// Table: activity_log
//   id: uuid (not null, default: gen_random_uuid())
//   ticket_id: bigint (not null)
//   user_id: uuid (not null)
//   action_type: text (not null)
//   old_value: text (nullable)
//   new_value: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
// Table: categories
//   id: uuid (not null, default: gen_random_uuid())
//   name: text (not null)
//   created_at: timestamp with time zone (not null, default: now())
// Table: comments
//   id: uuid (not null, default: gen_random_uuid())
//   ticket_id: bigint (not null)
//   user_id: uuid (not null)
//   content: text (not null)
//   is_internal: boolean (not null, default: false)
//   created_at: timestamp with time zone (not null, default: now())
// Table: profiles
//   id: uuid (not null)
//   full_name: text (not null)
//   email: text (not null)
//   role: user_role (not null, default: 'requester'::user_role)
//   avatar_url: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: sla_policies
//   id: uuid (not null, default: gen_random_uuid())
//   category_id: uuid (not null)
//   priority: ticket_priority (not null)
//   duration_hours: integer (not null)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: tickets
//   id: bigint (not null)
//   title: text (not null)
//   description: text (not null)
//   requester_id: uuid (not null)
//   assignee_id: uuid (nullable)
//   category_id: uuid (not null)
//   priority: ticket_priority (not null, default: 'low'::ticket_priority)
//   status: ticket_status (not null, default: 'open'::ticket_status)
//   deadline: timestamp with time zone (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())

// --- CONSTRAINTS ---
// Table: activity_log
//   PRIMARY KEY activity_log_pkey: PRIMARY KEY (id)
//   FOREIGN KEY activity_log_ticket_id_fkey: FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
//   FOREIGN KEY activity_log_user_id_fkey: FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
// Table: categories
//   PRIMARY KEY categories_pkey: PRIMARY KEY (id)
// Table: comments
//   PRIMARY KEY comments_pkey: PRIMARY KEY (id)
//   FOREIGN KEY comments_ticket_id_fkey: FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
//   FOREIGN KEY comments_user_id_fkey: FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
// Table: profiles
//   FOREIGN KEY profiles_id_fkey: FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
//   PRIMARY KEY profiles_pkey: PRIMARY KEY (id)
// Table: sla_policies
//   FOREIGN KEY sla_policies_category_id_fkey: FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
//   UNIQUE sla_policies_category_id_priority_key: UNIQUE (category_id, priority)
//   PRIMARY KEY sla_policies_pkey: PRIMARY KEY (id)
// Table: tickets
//   FOREIGN KEY tickets_assignee_id_fkey: FOREIGN KEY (assignee_id) REFERENCES profiles(id) ON DELETE SET NULL
//   FOREIGN KEY tickets_category_id_fkey: FOREIGN KEY (category_id) REFERENCES categories(id)
//   PRIMARY KEY tickets_pkey: PRIMARY KEY (id)
//   FOREIGN KEY tickets_requester_id_fkey: FOREIGN KEY (requester_id) REFERENCES profiles(id) ON DELETE CASCADE

// --- ROW LEVEL SECURITY POLICIES ---
// Table: activity_log
//   Policy "Activity logs insertable by everyone" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "Activity logs viewable by agents and admins" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['agent'::user_role, 'admin'::user_role])))))
// Table: categories
//   Policy "Admins can manage categories" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role))))
//   Policy "Categories are viewable by everyone" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
// Table: comments
//   Policy "Comments insertable by ticket viewers" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM tickets   WHERE ((tickets.id = comments.ticket_id) AND ((tickets.requester_id = auth.uid()) OR (EXISTS ( SELECT 1            FROM profiles           WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['agent'::user_role, 'admin'::user_role])))))))))
//   Policy "Comments viewable depending on internal flag" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (((NOT is_internal) AND (EXISTS ( SELECT 1    FROM tickets   WHERE ((tickets.id = comments.ticket_id) AND (tickets.requester_id = auth.uid()))))) OR (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['agent'::user_role, 'admin'::user_role]))))))
// Table: profiles
//   Policy "Admins can update any profile" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM profiles profiles_1   WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'admin'::user_role))))
//   Policy "Profiles are viewable by everyone" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Users can update own profile" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = id)
//     WITH CHECK: (auth.uid() = id)
// Table: sla_policies
//   Policy "Admins can delete SLA policies" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role))))
//   Policy "Admins can insert SLA policies" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role))))
//   Policy "Admins can update SLA policies" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role))))
//   Policy "SLA policies viewable by everyone" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
// Table: tickets
//   Policy "Tickets insertable by everyone" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (requester_id = auth.uid())
//   Policy "Tickets updatable by assignee, agents and admins" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((requester_id = auth.uid()) OR (assignee_id = auth.uid()) OR (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['agent'::user_role, 'admin'::user_role]))))))
//   Policy "Tickets viewable by requester, agents and admins" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((requester_id = auth.uid()) OR (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['agent'::user_role, 'admin'::user_role]))))))

// --- DATABASE FUNCTIONS ---
// FUNCTION calculate_ticket_deadline()
//   CREATE OR REPLACE FUNCTION public.calculate_ticket_deadline()
//    RETURNS trigger
//    LANGUAGE plpgsql
//   AS $function$
//   DECLARE
//     sla_hours INTEGER;
//   BEGIN
//     IF TG_OP = 'INSERT' THEN
//       SELECT duration_hours INTO sla_hours FROM public.sla_policies
//       WHERE category_id = NEW.category_id AND priority = NEW.priority;
//     ELSIF OLD.category_id IS DISTINCT FROM NEW.category_id OR OLD.priority IS DISTINCT FROM NEW.priority THEN
//       SELECT duration_hours INTO sla_hours FROM public.sla_policies
//       WHERE category_id = NEW.category_id AND priority = NEW.priority;
//     END IF;
//
//     IF sla_hours IS NOT NULL THEN
//       NEW.deadline := NEW.created_at + (sla_hours || ' hours')::interval;
//     END IF;
//
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION handle_new_user()
//   CREATE OR REPLACE FUNCTION public.handle_new_user()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     INSERT INTO public.profiles (id, full_name, email, role)
//     VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email, 'requester')
//     ON CONFLICT (id) DO NOTHING;
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION handle_updated_at()
//   CREATE OR REPLACE FUNCTION public.handle_updated_at()
//    RETURNS trigger
//    LANGUAGE plpgsql
//   AS $function$
//   BEGIN
//     NEW.updated_at = NOW();
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION log_priority_change()
//   CREATE OR REPLACE FUNCTION public.log_priority_change()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     IF OLD.priority IS DISTINCT FROM NEW.priority THEN
//       IF auth.uid() IS NOT NULL THEN
//         INSERT INTO public.activity_log (ticket_id, user_id, action_type, old_value, new_value)
//         VALUES (NEW.id, auth.uid(), 'priority_change', OLD.priority::text, NEW.priority::text);
//       END IF;
//     END IF;
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION restrict_priority_update()
//   CREATE OR REPLACE FUNCTION public.restrict_priority_update()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     user_role public.user_role;
//   BEGIN
//     IF OLD.priority IS DISTINCT FROM NEW.priority THEN
//       IF auth.uid() IS NOT NULL THEN
//         SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
//         IF user_role = 'requester' THEN
//           RAISE EXCEPTION 'Apenas agentes ou administradores podem alterar a prioridade do chamado.';
//         END IF;
//       END IF;
//     END IF;
//     RETURN NEW;
//   END;
//   $function$
//

// --- TRIGGERS ---
// Table: profiles
//   set_updated_at: CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at()
// Table: sla_policies
//   set_sla_updated_at: CREATE TRIGGER set_sla_updated_at BEFORE UPDATE ON public.sla_policies FOR EACH ROW EXECUTE FUNCTION handle_updated_at()
// Table: tickets
//   on_ticket_priority_change: CREATE TRIGGER on_ticket_priority_change AFTER UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION log_priority_change()
//   on_ticket_priority_update_restrict: CREATE TRIGGER on_ticket_priority_update_restrict BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION restrict_priority_update()
//   on_ticket_sla_calculate: CREATE TRIGGER on_ticket_sla_calculate BEFORE INSERT OR UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION calculate_ticket_deadline()
//   set_updated_at: CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION handle_updated_at()

// --- INDEXES ---
// Table: sla_policies
//   CREATE UNIQUE INDEX sla_policies_category_id_priority_key ON public.sla_policies USING btree (category_id, priority)
