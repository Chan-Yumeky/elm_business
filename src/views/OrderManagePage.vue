<template>
  <div class="order-manage-page">
    <h2 class="order-manage-title">订单管理</h2>
    <div class="order-manage-toolbar">
      <el-select v-model="selectedBusinessId" placeholder="选择商家" size="small" style="width: 200px" @change="onBusinessChange">
        <el-option 
          v-for="business in businessList" 
          :key="business.businessId" 
          :label="business.businessName" 
          :value="business.businessId" 
        />
      </el-select>
      <el-select v-model="selectedStatus" placeholder="订单状态" size="small" style="width: 140px">
        <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-button type="primary" size="small" @click="fetchOrderList">刷新</el-button>
    </div>
    <el-table
      :data="filteredOrderList"
      style="width: 100%; margin-top: 16px;"
      size="small"
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
      <el-table-column label="操作" width="180">
        <template #default="scope">
          <el-button v-if="scope.row.orderState === 1" type="primary" size="small" @click="acceptOrder(scope.row)">接单</el-button>
          <el-button v-if="scope.row.orderState === 2" type="success" size="small" @click="finishOrder(scope.row)">完成</el-button>
          <el-button v-if="scope.row.orderState === 1" type="danger" size="small" @click="rejectOrder(scope.row)">拒单</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { get, post } from '@/net';
import { ElMessage, ElMessageBox } from 'element-plus';

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
const businessList = ref<any[]>([]);
const selectedBusinessId = ref<string>('');
const orderList = ref<any[]>([]);
const selectedStatus = ref('all');
const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 0, label: '未支付' },
  { value: 1, label: '已支付' },
  { value: 2, label: '已接单' },
  { value: 3, label: '已完成' },
  { value: 4, label: '已取消' },
];

const filteredOrderList = computed(() => {
  if (selectedStatus.value === 'all') return orderList.value;
  return orderList.value.filter(o => o.orderState === selectedStatus.value);
});

// 获取商家列表
function fetchBusinessList() {
  if (!id) return;
  get(`/api/business/list-by-user?userId=${id}`, (data: any[]) => {
    businessList.value = data || [];
    if (data.length > 0) {
      selectedBusinessId.value = data[0].businessId;
      fetchOrderList();
    }
  });
}

function fetchOrderList() {
  if (!selectedBusinessId.value) return;
  get(`/api/orders/list-by-business?userId=${id}&businessId=${selectedBusinessId.value}`, (data: any[]) => {
    orderList.value = (data || []).sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  });
}

function onBusinessChange() {
  fetchOrderList();
}

function orderStateText(state: number) {
  switch (state) {
    case 0: return '未支付';
    case 1: return '已支付';
    case 2: return '已接单';
    case 3: return '已完成';
    case 4: return '已取消';
    default: return '未知';
  }
}
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
function formatOrderDate(dateStr: string) {
  if (!dateStr) return '-';
  const d = new Date(dateStr.replace(/\..*$/, ''));
  if (isNaN(d.getTime())) return dateStr;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function acceptOrder(row: any) {
  ElMessageBox.confirm('确定要接单吗？', '提示', { type: 'warning' }).then(() => {
    post(`/api/orders/accept?userId=${id}&orderId=${row.orderId}`, {}, () => {
      ElMessage.success('接单成功');
      fetchOrderList();
    });
  });
}
function finishOrder(row: any) {
  ElMessageBox.confirm('确定要完成订单吗？', '提示', { type: 'success' }).then(() => {
    post(`/api/orders/finish?userId=${id}&orderId=${row.orderId}`, {}, () => {
      ElMessage.success('订单已完成');
      fetchOrderList();
    });
  });
}
function rejectOrder(row: any) {
  ElMessageBox.confirm('确定要拒绝订单吗？', '警告', { type: 'error' }).then(() => {
    post(`/api/orders/reject?userId=${id}&orderId=${row.orderId}`, {}, () => {
      ElMessage.success('订单已拒绝');
      fetchOrderList();
    });
  });
}

onMounted(() => {
  fetchBusinessList();
});
</script>

<style scoped>
.order-manage-page {
  padding: 30px 20px;
}
.order-manage-title {
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 18px;
}
.order-manage-toolbar {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 8px;
}
</style> 