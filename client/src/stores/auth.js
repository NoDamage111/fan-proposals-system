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
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },
    
    async checkAuth() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('Auth check error:', error)
          this.user = null
          return null
        }
        
        this.user = user
        return user
      } catch (error) {
        console.error('Auth check failed:', error)
        this.user = null
        return null
      }
    }
  }
})