import { createRouter, createWebHashHistory } from 'vue-router'
import {unauthorized} from "@/net";

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
    { name: 'register', path: '/register', component: () => import('@/views/RegisterPage.vue') },
    { name: 'reset', path: '/reset', component: () => import('@/views/ResetPage.vue') },
    { name: 'login', path: '/login', component: () => import('@/views/MerchantLoginPage.vue') },
    { name: 'apply', path: '/apply', component: () => import('@/views/MerchantApplyPage.vue') },
    {
      path: '/home',
      component: () => import('@/layout/Index.vue'),
      children: [
        { path: '', name: 'home', component: () => import('@/views/HomePage.vue') },
        { path: 'businessinfo', name: 'home-businessinfo', component: () => import('@/views/BusinessInfoPage.vue') },
        { path: 'food', name: 'home-food', component: () => import('@/views/FoodManagePage.vue') },
        { path: 'order', name: 'home-order', component: () => import('@/views/OrderManagePage.vue') },
        { path: 'apply', name: 'home-apply', component: () => import('@/views/ApplyPage.vue') }
      ]
    }
  ],
})

// 路由守卫
const whiteList = ['login', 'register', 'reset', 'apply'];
router.beforeEach((to, from, next) => {
  const isUnauthorized = unauthorized();
  // 如果目标页面是登录页，且用户已登录，重定向到首页
  if (to.name === 'login' && !isUnauthorized) {
    next('/home');
    return;
  }
  // 如果用户未登录且访问非白名单页面，则重定向到登录页
  if (isUnauthorized && typeof to.name === 'string' && !whiteList.includes(to.name)) {
    next('/login');
    return;
  }
  // 允许其他路由跳转
  next();
});

export default router
