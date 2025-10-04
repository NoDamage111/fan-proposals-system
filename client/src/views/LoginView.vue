<template>
  <div class="login-container">
    <div class="login-box">
      <h1 class="title">Вход в систему</h1>
      
      <!-- Форма входа -->
      <form @submit.prevent="handleSubmit" class="login-form">
        <div class="field">
          <label class="label">Email</label>
          <input 
            v-model="email"
            type="email" 
            class="input" 
            placeholder="Ваш email"
            required
          />
        </div>
        
        <div class="field">
          <label class="label">Пароль</label>
          <input 
            v-model="password"
            type="password" 
            class="input" 
            placeholder="Ваш пароль"
            required
          />
        </div>
        
        <!-- Кнопка входа -->
        <button 
          type="submit" 
          class="button"
          :disabled="authStore.isLoading"
        >
          {{ authStore.isLoading ? 'Вход...' : 'Войти' }}
        </button>
        
        <!-- Отображение ошибок -->
        <div v-if="authStore.error" class="error">
          {{ authStore.error }}
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const authStore = useAuthStore();
const router = useRouter();

// Обработчик отправки формы
const handleSubmit = async () => {
  try {
    await authStore.signIn(email.value, password.value);
    router.push('/proposals'); // Перенаправление после успешного входа
  } catch (error) {
    console.error('Ошибка входа:', error);
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #f5f5f5;
}

.login-box {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.title {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.button {
  padding: 0.75rem;
  background: #2c3e50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.button:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.error {
  color: #e74c3c;
  margin-top: 1rem;
  text-align: center;
}
</style>