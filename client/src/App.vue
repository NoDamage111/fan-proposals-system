<template>
  <v-app>
    <v-app-bar v-if="$route.name !== 'login'">
      <v-app-bar-title>Система подбора вентиляторов</v-app-bar-title>
      
      <template v-slot:prepend>
        <v-icon icon="mdi-fan"></v-icon>
      </template>
      
      <v-btn to="/proposals" variant="text">Мои предложения</v-btn>
      <v-btn to="/proposals/new" variant="text">Новое предложение</v-btn>
      
      <template v-slot:append>
        <v-btn
          @click="handleSignOut"
          variant="text"
          prepend-icon="mdi-logout"
        >
          Выйти
        </v-btn>
      </template>
    </v-app-bar>
    
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const handleSignOut = async () => {
  try {
    await authStore.signOut()
    router.push('/login')
  } catch (error) {
    console.error('Ошибка выхода:', error)
  }
}
</script>