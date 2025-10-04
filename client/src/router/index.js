import { createRouter, createWebHistory } from 'vue-router';
import { supabase } from '@/supabase' // Добавляем импорт supabase

// Импорт компонентов страниц
import LoginView from '@/views/LoginView.vue';
import ProposalsView from '@/views/ProposalsView.vue';
import NewProposalView from '@/views/NewProposalView.vue';
import ProposalDetailView from '@/views/ProposalDetailView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false } // Не требует авторизации
    },
    {
      path: '/proposals',
      name: 'proposals',
      component: ProposalsView,
      meta: { requiresAuth: true } // Требует авторизации
    },
    {
      path: '/proposals/new',
      name: 'new-proposal',
      component: NewProposalView,
      meta: { requiresAuth: true }
    },
    {
      path: '/proposals/:id',
      name: 'proposal-detail',
      component: ProposalDetailView, // Теперь указывает на index.vue в папке
      meta: { requiresAuth: true }
    },
    {
      path: '/',
      redirect: '/proposals' // Перенаправление с корня
    }
  ]
});

// Глобальный навигационный гард
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  
  if (!requiresAuth) {
    return next()
  }
  
  try {
    const token = localStorage.getItem('supabase.auth.token')
    
    if (!token) {
      return next('/login')
    }
    
    // Проверяем токен через Supabase напрямую
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error) throw error
    
    if (user) {
      return next()
    } else {
      return next('/login')
    }
  } catch (error) {
    console.error('Auth check error:', error)
    return next('/login')
  }
})

export default router;