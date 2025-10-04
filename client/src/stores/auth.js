import { defineStore } from 'pinia'
import { supabase } from '@/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isLoading: false,
    error: null
  }),
  
  actions: {
    async signIn(email, password) {
      this.isLoading = true
      this.error = null
      
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (error) throw error
        
        this.user = data.user
        localStorage.setItem('supabase.auth.token', data.session.access_token)
        return data.user
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    async signOut() {
      this.isLoading = true
      this.error = null
      
      try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        
        this.user = null
        localStorage.removeItem('supabase.auth.token')
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    async checkAuth() {
      const token = localStorage.getItem('supabase.auth.token')
      
      if (!token) {
        this.user = null
        return null
      }
      
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token)
        if (error) throw error
        
        this.user = user
        return user
      } catch (error) {
        this.user = null
        localStorage.removeItem('supabase.auth.token')
        return null
      }
    }
  }
})