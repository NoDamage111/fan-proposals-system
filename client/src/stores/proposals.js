import { defineStore } from 'pinia'
import { supabase } from '@/supabase'

export const useProposalsStore = defineStore('proposals', {
  state: () => ({
    proposals: [],
    currentProposal: null,
    isLoading: false,
    error: null
  }),

  getters: {
    statusOptions: () => [
      { value: 'draft', label: 'Черновик', color: 'grey' },
      { value: 'in_progress', label: 'В работе', color: 'orange' },
      { value: 'completed', label: 'Завершено', color: 'green' }
    ]
  },

  actions: {
    async fetchProposals() {
      this.isLoading = true
      this.error = null
      
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) throw authError

        const { data, error } = await supabase
          .from('proposals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        this.proposals = data
        return data
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async createProposal(proposalData) {
      this.isLoading = true
      this.error = null
      
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) throw authError

        const { data, error } = await supabase
          .from('proposals')
          .insert({
            title: proposalData.title,
            description: proposalData.description,
            user_id: user.id,
            status: proposalData.status || 'draft',
          })
          .select()
          .single()

        if (error) throw error
        
        if (proposalData.fans?.length > 0) {
          await this.addFansToProposal(data.id, proposalData.fans)
        }

        this.proposals.unshift(data)
        return data
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async updateProposalStatus(id, status) {
      try {
        const { data, error } = await supabase
          .from('proposals')
          .update({ 
            status: status,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        const index = this.proposals.findIndex(p => p.id === id)
        if (index !== -1) {
          this.proposals[index] = { ...this.proposals[index], ...data }
        }

        if (this.currentProposal?.id === id) {
          this.currentProposal = { ...this.currentProposal, ...data }
        }

        return data
      } catch (error) {
        console.error('Ошибка обновления статуса:', error)
        throw error
      }
    },

    async addFansToProposal(proposalId, fans) {
      try {
        const fanRecords = fans.map(fan => ({
          proposal_id: proposalId,
          fan_data: fan,
          quantity: fan.quantity || 1
        }))

        const { error } = await supabase
          .from('proposal_fans')
          .insert(fanRecords)

        if (error) throw error

        if (this.currentProposal?.id === proposalId) {
          await this.fetchProposalById(proposalId)
        }
      } catch (error) {
        console.error('Ошибка добавления вентиляторов:', error)
        throw error
      }
    },

    async fetchProposalById(id) {
      this.isLoading = true
      this.error = null
      
      try {
        const { data, error } = await supabase
          .from('proposals')
          .select('*, proposal_fans(*)')
          .eq('id', id)
          .single()

        if (error) throw error
        this.currentProposal = data
        return data
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async deleteProposal(id) {
      this.isLoading = true
      this.error = null
      
      try {
        await supabase
          .from('proposal_fans')
          .delete()
          .eq('proposal_id', id)

        const { error } = await supabase
          .from('proposals')
          .delete()
          .eq('id', id)

        if (error) throw error

        this.proposals = this.proposals.filter(p => p.id !== id)
        if (this.currentProposal?.id === id) {
          this.currentProposal = null
        }
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    }
  }
})