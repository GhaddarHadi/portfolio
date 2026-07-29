/**
 * Supabase database types.
 *
 * Hand-written to match supabase/schema.sql so the app is typed end to end
 * before a live project exists. Once your project is up you can regenerate this
 * file to keep it perfectly in sync:
 *
 *   npx supabase gen types typescript --project-id <ref> > lib/database.types.ts
 *
 * The shape below matches the generator's output, so that command is a clean
 * overwrite, not a rewrite.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profile: {
        Row: {
          id: string
          owner_id: string
          full_name: string
          headline: string | null
          summary: string | null
          location: string | null
          email_public: string | null
          socials: Json
          theme: Json
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          full_name: string
          headline?: string | null
          summary?: string | null
          location?: string | null
          email_public?: string | null
          socials?: Json
          theme?: Json
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profile']['Insert']>
        Relationships: []
      }
      sections: {
        Row: {
          id: string
          owner_id: string
          slug: string
          title: string
          subtitle: string | null
          layout: string
          field_schema: Json
          sort_order: number
          visible: boolean
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          slug: string
          title: string
          subtitle?: string | null
          layout?: string
          field_schema?: Json
          sort_order?: number
          visible?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['sections']['Insert']>
        Relationships: []
      }
      entries: {
        Row: {
          id: string
          owner_id: string
          section_id: string
          slug: string | null
          data: Json
          start_date: string | null
          end_date: string | null
          featured: boolean
          sort_order: number
          visible: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          section_id: string
          slug?: string | null
          data?: Json
          start_date?: string | null
          end_date?: string | null
          featured?: boolean
          sort_order?: number
          visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['entries']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'entries_section_id_fkey'
            columns: ['section_id']
            referencedRelation: 'sections'
            referencedColumns: ['id']
          },
        ]
      }
      tags: {
        Row: {
          id: string
          owner_id: string
          name: string
          kind: string | null
          color: string | null
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          kind?: string | null
          color?: string | null
        }
        Update: Partial<Database['public']['Tables']['tags']['Insert']>
        Relationships: []
      }
      entry_tags: {
        Row: {
          entry_id: string
          tag_id: string
        }
        Insert: {
          entry_id: string
          tag_id: string
        }
        Update: Partial<Database['public']['Tables']['entry_tags']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'entry_tags_entry_id_fkey'
            columns: ['entry_id']
            referencedRelation: 'entries'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'entry_tags_tag_id_fkey'
            columns: ['tag_id']
            referencedRelation: 'tags'
            referencedColumns: ['id']
          },
        ]
      }
      media: {
        Row: {
          id: string
          owner_id: string
          entry_id: string | null
          storage_path: string
          alt: string | null
          kind: string | null
          width: number | null
          height: number | null
          sort_order: number
        }
        Insert: {
          id?: string
          owner_id: string
          entry_id?: string | null
          storage_path: string
          alt?: string | null
          kind?: string | null
          width?: number | null
          height?: number | null
          sort_order?: number
        }
        Update: Partial<Database['public']['Tables']['media']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'media_entry_id_fkey'
            columns: ['entry_id']
            referencedRelation: 'entries'
            referencedColumns: ['id']
          },
        ]
      }
      variants: {
        Row: {
          id: string
          owner_id: string
          slug: string
          label: string
          headline: string | null
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          slug: string
          label: string
          headline?: string | null
          note?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['variants']['Insert']>
        Relationships: []
      }
      variant_entries: {
        Row: {
          variant_id: string
          entry_id: string
          sort_order: number
        }
        Insert: {
          variant_id: string
          entry_id: string
          sort_order?: number
        }
        Update: Partial<Database['public']['Tables']['variant_entries']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'variant_entries_variant_id_fkey'
            columns: ['variant_id']
            referencedRelation: 'variants'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'variant_entries_entry_id_fkey'
            columns: ['entry_id']
            referencedRelation: 'entries'
            referencedColumns: ['id']
          },
        ]
      }
      heartbeat: {
        Row: { id: number; pinged: string }
        Insert: { id?: number; pinged?: string }
        Update: Partial<Database['public']['Tables']['heartbeat']['Insert']>
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}

// Convenience row aliases used across the app.
type Tables = Database['public']['Tables']
export type ProfileRow = Tables['profile']['Row']
export type SectionRow = Tables['sections']['Row']
export type EntryRow = Tables['entries']['Row']
export type TagRow = Tables['tags']['Row']
export type MediaRow = Tables['media']['Row']
export type VariantRow = Tables['variants']['Row']
