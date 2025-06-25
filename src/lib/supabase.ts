import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// טיפוסים עבור הטבלאות
export interface User {
  id: string
  email: string
  password_hash: string
  full_name: string
  user_type: 'admin' | 'manager'
  organization_name?: string
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface Questionnaire {
  id: string
  title: string
  description?: string
  category: string
  year: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  questionnaire_id: string
  question_text: string
  question_number: number
  section_title?: string
  question_type: string
  is_required: boolean
  created_at: string
}

export interface Invitation {
  id: string
  token: string
  questionnaire_id: string
  manager_email: string
  manager_name: string
  organization_name: string
  deadline: string
  created_by: string
  status: 'pending' | 'registered' | 'completed' | 'expired'
  registered_at?: string
  completed_at?: string
  created_at: string
}

export interface Response {
  id: string
  user_id: string
  questionnaire_id: string
  question_id: string
  radio_answer?: string
  text_answer?: string
  is_completed: boolean
  created_at: string
  updated_at: string
}

export interface QuestionnaireCompletion {
  id: string
  user_id: string
  questionnaire_id: string
  year: number
  progress_percentage: number
  is_completed: boolean
  completed_at?: string
  created_at: string
  updated_at: string
} 