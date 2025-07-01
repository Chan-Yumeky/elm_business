<template>
  <div class="dashboard">
    <h2 class="welcome">欢迎回来，{{ username }}！</h2>
    <div v-if="!isMerchant" class="not-merchant">
      <el-card class="join-card">
        <div class="join-tip">还未成为商家？</div>
        <el-link type="primary" @click="$router.push('/home/apply')">加入我们</el-link>
      </el-card>
    </div>
    <div v-else class="merchant-dashboard">
      <!-- 商家信息区：电梯式自动滚动（高度固定，消除跳变） -->
      <el-card
        class="mb-4 merchant-card-fixed"
        @mouseenter="() => { stopBusinessAutoScroll(); isPaused = true; }"
        @mouseleave="() => { startBusinessAutoScroll(); isPaused = false; }"
        :class="{ paused: isPaused }"
      >
        <transition-group name="slide-up" tag="div">
          <div class="merchant-info" v-if="businessList.length && businessList[currentBusinessIdx]" :key="businessList[currentBusinessIdx].businessId">
            <el-avatar :src="businessList[currentBusinessIdx].businessImg" size="large" class="merchant-avatar" />
            <div class="merchant-detail">
              <div>
                <span class="info-label">商家名称：</span>{{ businessList[currentBusinessIdx].businessName || '-' }}
                <el-tag :type="businessList[currentBusinessIdx].status === 1 ? 'success' : 'info'" class="ml-2">
                  {{ businessList[currentBusinessIdx].status === 1 ? '营业中' : '停业中' }}
                </el-tag>
              </div>
              <div>
                <span class="info-label">商家地址：</span>{{ businessList[currentBusinessIdx].businessAddress || '-' }}
              </div>
              <div v-if="businessList[currentBusinessIdx].businessExplain" class="merchant-explain">
                <span class="info-label">简介：</span>{{ businessList[currentBusinessIdx].businessExplain }}
              </div>
            </div>
          </div>
        </transition-group>
      </el-card>
      <!-- 经营数据总览区块：根据当前商家动态展示 -->
      <el-row :gutter="20" class="mb-4">
        <el-col :span="8">
          <el-card class="stat-card">
            <div class="stat-title">我的商家数</div>
            <div class="stat-value">{{ businessList.length }}</div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stat-card">
            <div class="stat-title">菜品总数</div>
            <div class="stat-value">{{ foodCount }}</div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stat-card">
            <div class="stat-title">订单总数</div>
            <div class="stat-value">{{ orderCount }}</div>
          </el-card>
        </el-col>
      </el-row>
      <!-- 订单动态区块与右侧预留区块并排 -->
      <el-row :gutter="20" class="mb-4">
        <el-col :span="12">
          <el-card class="order-dynamic-card">
            <div class="order-dynamic-title">订单动态</div>
            <el-table
              :data="orderDynamicList"
              style="width: 100%"
              size="small"
              :row-class-name="orderRowClassName"
              empty-text="暂无订单"
            >
              <el-table-column prop="orderId" label="订单号" width="120" />
              <el-table-column prop="orderDate" label="下单时间" width="160">
                <template #default="scope">
                  {{ formatOrderDate(scope.row.orderDate) }}
                </template>
              </el-table-column>
              <el-table-column prop="orderTotal" label="金额(元)" width="100" />
              <el-table-column prop="orderState" label="状态" width="100">
                <template #default="scope">
                  <el-tag :type="orderStateTagType(scope.row.orderState)">
                    {{ orderStateText(scope.row.orderState) }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
        <el-col :span="12">
          <!-- 菜品管理快捷区 -->
          <el-card class="dashboard-side-card" @mouseenter="() => { stopBusinessAutoScroll(); isPaused = true; }" @mouseleave="() => { startBusinessAutoScroll(); isPaused = false; }">
            <div class="food-quick-title">热销菜品</div>
            <div v-if="foodList.length > 0" class="food-quick-list">
              <div v-for="food in foodList.slice(0, 3)" :key="food.foodId" class="food-quick-item">
                <el-avatar :src="food.foodImg" size="large" class="food-quick-avatar" />
                <div class="food-quick-info">
                  <div class="food-quick-name">{{ food.foodName }}</div>
                  <div class="food-quick-price">￥{{ food.foodPrice }}</div>
                </div>
              </div>
            </div>
            <div v-else class="food-quick-empty">暂无菜品</div>
          </el-card>
          <!-- 审核状态变更记录区块，独立el-card并加margin-top -->
          <el-card class="audit-status-card">
            <div class="audit-status-title">审核状态变更记录</div>
            <el-timeline>
              <el-timeline-item
                v-for="item in auditStatusList"
                :key="item.applyId"
                :timestamp="formatAuditTime(item.reviewTime || item.applyTime)"
                placement="top"
              >
                <el-tag :type="auditStatusTagType(item.applyStatus)" size="small">
                  {{ auditStatusText(item.applyStatus) }}
                </el-tag>
                <span class="audit-status-desc">{{ item.reviewReason || '无审核说明' }}</span>
              </el-timeline-item>
              <el-timeline-item v-if="auditStatusList.length === 0" timestamp="-" placement="top">
                暂无审核记录
              </el-timeline-item>
            </el-timeline>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, watch } from 'vue';
import { get, post } from '@/net';
import { Plus } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';

// 获取本地token中的用户信息
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

const { username, id } = getUserInfoFromToken();
const isMerchant = ref(false);
const businessCount = ref(0);
const foodCount = ref(0);
const orderCount = ref(0);
const businessList = ref<any[]>([]);
const currentBusinessIdx = ref(0);
let timer: any = null;
const isPaused = ref(false);

// 新增菜品弹窗相关数据
const addFoodDialogVisible = ref(false);
const addFoodFormRef = ref();
const addFoodForm = reactive({
  foodName: '',
  foodPrice: 0,
  foodImg: '',
  foodExplain: '',
  businessId: '',
  remarks: ''
});
const addFoodRules = {
  foodName: [
    { required: true, message: '请输入菜品名称', trigger: 'blur' },
    { min: 1, max: 50, message: '菜品名称长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  foodPrice: [
    { required: true, message: '请输入菜品价格', trigger: 'blur' },
    { type: 'number', min: 0, message: '价格必须大于等于0', trigger: 'blur' }
  ],
  foodExplain: [
    { max: 200, message: '菜品描述长度不能超过200个字符', trigger: 'blur' }
  ]
};

// 启动自动轮播（电梯式滚动）
function startBusinessAutoScroll() {
  // 避免重复启动
  if (timer) return;
  timer = setInterval(() => {
    if (businessList.value.length > 1) {
      currentBusinessIdx.value = (currentBusinessIdx.value + 1) % businessList.value.length;
      updateBusinessStats();
    }
  }, 3000);
}

// 停止自动轮播（鼠标悬停时调用）
function stopBusinessAutoScroll() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

// 订单动态区数据
const orderDynamicList = ref<any[]>([]);

// 菜品管理快捷区数据
const foodList = ref<any[]>([]);

// 审核状态变更记录数据
const auditStatusList = ref<any[]>([]);

// 引入useRouter
const router = useRouter();

// 订单状态文本映射
function orderStateText(state: number) {
  switch (state) {
    case 0: return '未支付';
    case 1: return '已支付/待接单';
    case 2: return '已接单';
    case 3: return '已完成';
    case 4: return '已取消';
    default: return '未知';
  }
}
// 订单状态标签类型映射
function orderStateTagType(state: number) {
  switch (state) {
    case 0: return 'default';
    case 1: return 'warning';
    case 2: return 'info';
    case 3: return 'success';
    case 4: return 'danger';
    default: return 'default';
  }
}
// 订单表格高亮行（待接单高亮）
function orderRowClassName({ row }: { row: any }) {
  return row.orderState === 1 ? 'order-row-pending' : '';
}

// 查询订单动态
function fetchOrderDynamic() {
  const business = businessList.value[currentBusinessIdx.value];
  if (!business) {
    orderDynamicList.value = [];
    return;
  }
  get(`/api/orders/list-by-business?userId=${id}&businessId=${business.businessId}`, (data: any[]) => {
    console.log('订单动态接口返回', data);
    // 只取最新5条，按下单时间倒序
    orderDynamicList.value = (data || [])
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
      .slice(0, 5);
  });
}

// 查询当前商家所有菜品
function fetchFoodList() {
  const business = businessList.value[currentBusinessIdx.value];
  if (!business) {
    foodList.value = [];
    return;
  }
  get(`/api/food/list-all-food-by-BusinessId?businessId=${business.businessId}`,(data: any[]) => {
    foodList.value = data || [];
  });
}

// 查询当前商家的审核状态变更记录
function fetchAuditStatusList() {
  const business = businessList.value[currentBusinessIdx.value];
  if (!business) {
    auditStatusList.value = [];
    return;
  }
  get(`/api/business/merchant/status?userId=${id}`,(data: any[]) => {
    // 只取当前商家的审核记录，按时间倒序
    auditStatusList.value = (data || [])
      .filter(item => item.businessName === business.businessName)
      .sort((a, b) => new Date(b.reviewTime || b.applyTime).getTime() - new Date(a.reviewTime || a.applyTime).getTime());
  });
}

// 审核状态文本映射
function auditStatusText(status: number) {
  switch (status) {
    case 0: return '待审核';
    case 1: return '已通过';
    case 2: return '已拒绝';
    default: return '未知';
  }
}
// 审核状态标签类型映射
function auditStatusTagType(status: number) {
  switch (status) {
    case 0: return 'warning';
    case 1: return 'success';
    case 2: return 'danger';
    default: return 'info';
  }
}
// 格式化审核时间
function formatAuditTime(time: string) {
  if (!time) return '-';
  const d = new Date(time.replace(/\..*$/, ''));
  if (isNaN(d.getTime())) return time;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function goToFoodManage() {
  const businessId = businessList.value[currentBusinessIdx.value]?.businessId;
  if (businessId) {
    router.push({ path: '/home/food', query: { businessId } });
  } else {
    router.push('/home/food');
  }
}

function onAddFoodDialogOpen() {
  stopBusinessAutoScroll();
  isPaused.value = true;
}

onMounted(() => {
  if (!id) return;
  // 查询商家列表
  get(`/api/business/list-by-user?userId=${id}`, (data: any[]) => {
    businessList.value = data;
    businessCount.value = data.length;
    if (data.length > 0) {
      isMerchant.value = true;
      // 默认选中第一个商家
      currentBusinessIdx.value = 0;
      updateBusinessStats();
      startBusinessAutoScroll(); // 页面加载后自动启动轮播
    } else {
      isMerchant.value = false;
    }
  });
  watch(currentBusinessIdx, () => {
    updateBusinessStats();
    fetchOrderDynamic();
    fetchFoodList();
    fetchAuditStatusList();
  });
  // 首次加载时拉取订单动态和菜品
  fetchOrderDynamic();
  fetchFoodList();
  fetchAuditStatusList();
});

onUnmounted(() => {
  stopBusinessAutoScroll();
});

function updateBusinessStats() {
  const business = businessList.value[currentBusinessIdx.value];
  if (!business) return;
  // 查询菜品总数
  get(`/api/food/list-all-food-by-BusinessId?businessId=${business.businessId}`,(foodArr: any[]) => {
    foodCount.value = foodArr.length;
  });
  // 查询订单总数
  get(`/api/orders/list-by-business?userId=${id}&businessId=${business.businessId}`,(orderArr: any[]) => {
    orderCount.value = orderArr.length;
  });
}

function formatOrderDate(dateStr: string) {
  if (!dateStr) return '-';
  // 兼容带小数点的ISO字符串（去掉小数点及其后内容）
  const d = new Date(dateStr.replace(/\..*$/, ''));
  if (isNaN(d.getTime())) return dateStr;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
</script>

<style scoped>
.dashboard {
  padding: 30px 20px;
}
.welcome {
  font-size: 22px;
  margin-bottom: 24px;
}
.not-merchant {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}
.join-card {
  width: 350px;
  text-align: center;
  padding: 40px 0;
}
.join-tip {
  font-size: 18px;
  margin-bottom: 18px;
}
.merchant-dashboard {
  margin-top: 20px;
}
.mb-4 {
  margin-bottom: 24px;
}
.merchant-card-fixed {
  height: 110px; /* 固定高度，防止动画期间高度变化导致页面滚动 */
  overflow: hidden;
  display: flex;
  align-items: center;
}
.merchant-info {
  display: flex;
  align-items: center;
  gap: 32px;
  font-size: 16px;
  width: 100%;
  height: 100%;
}
.merchant-avatar {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
  background: #f5f5f5;
}
.merchant-detail {
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
  height: 100%;
}
.info-label {
  color: #888;
  margin-right: 8px;
}
.stat-card {
  text-align: center;
  padding: 30px 0;
}
.stat-title {
  font-size: 16px;
  color: #888;
  margin-bottom: 10px;
}
.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #409EFF;
}
.ml-2 {
  margin-left: 12px;
}
.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.5s cubic-bezier(.55,0,.1,1);
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(40px);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-40px);
}
.merchant-explain {
  max-width: 350px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.merchant-card-fixed.paused {
  background: #f0f9ff !important; /* 浅蓝色 */
  box-shadow: 0 4px 16px 0 rgba(64,158,255,0.15);
  border-color: #409EFF !important;
  transition: background 0.3s, box-shadow 0.3s, border-color 0.3s;
}
.order-dynamic-card {
  padding: 18px 20px 10px 20px;
  min-height: 523px;
}
.order-dynamic-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 12px;
}
.order-row-pending {
  background: #fffbe6 !important;
}
.dashboard-side-card {
  min-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #bbb;
  font-size: 16px;
  background: #fafbfc;
  min-height: 340px;
}
.food-quick-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 12px;
  text-align: left;
}
.food-quick-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
  align-items: flex-start;
}
.food-quick-item {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #f7fafd;
  border-radius: 8px;
  padding: 8px 12px;
  justify-content: flex-start;
}
.food-quick-avatar {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  background: #f5f5f5;
}
.food-quick-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.food-quick-name {
  font-size: 15px;
  font-weight: 500;
}
.food-quick-price {
  color: #409EFF;
  font-size: 14px;
}
.food-quick-empty {
  color: #bbb;
  text-align: center;
  margin-bottom: 16px;
}
.audit-status-card {
  margin-top: 18px;
  padding: 14px 18px 10px 18px;
  background: #f8fafd;
}
.audit-status-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
  text-align: left;
}
.audit-status-desc {
  margin-left: 10px;
  color: #888;
  font-size: 13px;
}
</style>