<template>
  <div class="common-layout">
    <el-container>
      <el-aside :width="isCollapse ? '64px' : '200px'" class="aside">
        <div class="logo-area" @click="refreshPage" style="cursor:pointer;">
          <img src="@/assets/饿了么.svg" class="logo-img" alt="logo" />
          <span v-if="!isCollapse" class="logo-title">饿了么商家端</span>
        </div>
        <el-menu
          router
          :default-active="$route.path"
          class="el-menu-vertical"
          :collapse="isCollapse"
          :collapse-transition="false"
        >
          <el-menu-item index="/home">
            <el-icon><HomeFilled /></el-icon>
            <span v-if="!isCollapse">首页</span>
          </el-menu-item>
          <el-menu-item index="/home/businessinfo">
            <el-icon><Shop /></el-icon>
            <span v-if="!isCollapse">商家管理</span>
          </el-menu-item>
          <el-menu-item index="/home/food">
            <el-icon><Dish /></el-icon>
            <span v-if="!isCollapse">菜品管理</span>
          </el-menu-item>
          <el-menu-item index="/home/order">
            <el-icon><Tickets /></el-icon>
            <span v-if="!isCollapse">订单管理</span>
          </el-menu-item>
          <el-menu-item index="/home/apply">
            <el-icon><Promotion /></el-icon>
            <span v-if="!isCollapse">入驻申请</span>
          </el-menu-item>
        </el-menu>
        <div class="collapse-btn" @click="isCollapse = !isCollapse">
          <el-icon>
            <component :is="isCollapse ? ArrowRight : ArrowLeft" />
          </el-icon>
        </div>
      </el-aside>
      <el-container>
        <el-header class="header">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item v-for="(item, idx) in breadcrumbList" :key="idx">
              {{ item }}
            </el-breadcrumb-item>
          </el-breadcrumb>
          <div class="user-info">
            <span>{{ username }}</span>
            <el-dropdown>
              <el-avatar src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        <el-main class="main">
          <router-view/>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { logout } from '@/net';
import {
  HomeFilled,
  Shop,
  Dish,
  Tickets,
  Promotion,
  ArrowLeft,
  ArrowRight
} from '@element-plus/icons-vue'

const isCollapse = ref(false);
const route = useRoute();
const router = useRouter();

function refreshPage() {
  window.location.reload();
}

function handleLogout() {
  logout(() => {
    router.replace('/login');
  });
}

const breadcrumbList = computed(() => {
  // 只取 /home/xxx 之后的路径，首页只显示"首页"
  const pathArr = route.path.split('/').filter(Boolean);
  if (pathArr.length === 1 && pathArr[0] === 'home') return ['首页'];
  const map = {
    home: '首页',
    businessinfo: '商家管理',
    food: '菜品管理',
    order: '订单管理',
    apply: '入驻申请'
  };
  return pathArr.map(seg => map[seg] || seg);
});

// 获取本地token中的用户信息（与HomePage.vue保持一致）
function getUserInfoFromToken() {
  const str = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  if (!str) return { username: '', id: null };
  try {
    const obj = JSON.parse(str);
    return { username: obj.username, id: obj.id };
  } catch {
    return { username: '', id: null };
  }
}
const { username } = getUserInfoFromToken();
</script>

<style scoped>
.common-layout, .el-container {
  height: 100vh;
}
.aside {
  background-color: #545c64;
  color: #fff;
  position: relative;
  transition: width 0.2s;
}
.logo-area {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0 10px 0;
  transition: all 0.2s;
}
.logo-img {
  width: 32px;
  height: 32px;
  margin-right: 0;
  transition: margin 0.2s;
}
.logo-title {
  font-size: 18px;
  margin-left: 10px;
  font-weight: bold;
  color: #fff;
  transition: opacity 0.2s;
}
.el-menu-vertical {
  border-right: none;
  background-color: #545c64;
}
.el-menu-item {
  color: #fff;
}
.el-menu-item:hover {
  background-color: #434a50;
}
.el-menu-item.is-active {
  color: #ffd04b;
  background-color: #434a50;
}
.collapse-btn {
  position: absolute;
  top: 50%;
  right: -12px;
  transform: translateY(-50%);
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  border: 1px solid #eee;
  transition: right 0.2s;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  border-bottom: 1px solid #eee;
}
.user-info {
  display: flex;
  align-items: center;
}
.user-info span {
  margin-right: 10px;
}
.main {
  background-color: #f4f4f5;
  padding: 20px;
}
</style> 