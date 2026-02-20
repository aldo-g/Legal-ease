import { supabase } from './supabase'

/**
 * CaseService handles all Supabase CRUD for case data.
 */
export const CaseService = {
  /**
   * Fetch all cases for the current user, ordered by most recent first.
   */
  async fetchCases() {
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  /**
   * Create a new case with initial complaint text and research.
   * Returns the created case row.
   */
  async createCase({ caseRef, complaintText, research }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('cases')
      .insert({
        user_id: user.id,
        case_ref: caseRef,
        status: 'created',
        complaint_text: complaintText || '',
        research: research || {},
        form_data: {},
        case_data: {},
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update an existing case by its UUID.
   */
  async updateCase(id, updates) {
    const payload = {}

    if (updates.complaintText !== undefined) payload.complaint_text = updates.complaintText
    if (updates.research !== undefined) payload.research = updates.research
    if (updates.formData !== undefined) payload.form_data = updates.formData
    if (updates.caseData !== undefined) payload.case_data = updates.caseData
    if (updates.status !== undefined) payload.status = updates.status

    const { data, error } = await supabase
      .from('cases')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete a case by its UUID.
   */
  async deleteCase(id) {
    const { error } = await supabase
      .from('cases')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Add a status log entry for a case.
   */
  async addStatusLog(caseId, message) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('status_logs')
      .insert({
        case_id: caseId,
        user_id: user.id,
        message,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Fetch status logs for a case, newest first.
   */
  async fetchStatusLogs(caseId) {
    const { data, error } = await supabase
      .from('status_logs')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  /**
   * Send the formal claim email via the Supabase Edge Function (Resend).
   * payload: { to, subject, body, replyTo, caseRef }
   */
  async sendClaimEmail(payload) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const functionUrl = `${supabaseUrl}/functions/v1/send-claim`

    const res = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to send email')
    return data
  },

  /**
   * Generate a unique case reference.
   */
  generateCaseRef(userId) {
    return `LE-${userId.slice(-4).toUpperCase()}-${Date.now().toString().slice(-4)}`
  },
}
