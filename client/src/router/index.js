import { createRouter, createWebHistory } from 'vue-router';
import { supabase } from '@/supabase'

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
      meta: { requiresAuth: false }
    },
    {
      path: '/proposals',
      name: 'proposals',
      component: ProposalsView,
      meta: { requiresAuth: true }
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
      component: ProposalDetailView,
      meta: { requiresAuth: true }
    },
    {
      path: '/',
      redirect: '/proposals'
    }
  ]
});

// Упрощенный навигационный гард
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  
  if (!requiresAuth) {
    return next()
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Auth check error:', error)
      return next('/login')
    }
    
    if (user) {
      return next()
    } else {
      return next('/login')
    }
  } catch (error) {
    console.error('Auth check failed:', error)
    return next('/login')
  }
})

export default router;