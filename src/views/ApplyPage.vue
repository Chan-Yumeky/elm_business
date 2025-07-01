<template>
  <div>
    <h1>入驻申请</h1>
    <div class="status-section">
      <h2>您的申请状态</h2>
      <div v-if="loading" class="loading-text">状态加载中...</div>
      <div v-else-if="applyList.length > 0">
        <el-table :data="applyList" stripe>
          <el-table-column prop="businessName" label="商家名称" />
          <el-table-column prop="applyTime" label="申请时间">
            <template #default="{ row }">
              {{ formatDateTime(row.applyTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="applyStatus" label="状态">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.applyStatus)">{{ getStatusText(row.applyStatus) }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-else class="no-apply">
        <span>还没有申请？</span>
        <el-link type="primary" @click="openApplyDialog">立即申请入驻</el-link>
      </div>
    </div>

    <el-button type="success" @click="openApplyDialog" class="apply-button">
      发起新的入驻申请
    </el-button>

    <el-dialog v-model="dialogVisible" title="商家入驻申请" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef">
        <el-form-item prop="businessName">
          <el-input v-model="form.businessName" maxlength="40" placeholder="商家名称" />
        </el-form-item>
        <el-form-item prop="businessAddress">
          <el-input v-model="form.businessAddress" maxlength="50" placeholder="商家地址" />
        </el-form-item>
        <el-form-item prop="contactPhone">
          <el-input v-model="form.contactPhone" maxlength="11" placeholder="联系电话" />
        </el-form-item>
        <el-form-item prop="businessDesc">
          <el-input v-model="form.businessDesc" maxlength="255" type="textarea" placeholder="商家简介" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitApply">提交申请</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { get, post } from '@/net';

const loading = ref(true);
const applyList = ref([]); // 存放申请列表
const dialogVisible = ref(false);
const formRef = ref();

const form = reactive({
  businessName: '',
  businessAddress: '',
  contactPhone: '',
  businessDesc: ''
});

const rules = {
  // 表单验证规则，可复用之前的
};

const getStatusText = (status) => {
  switch (status) {
    case 0: return '审核中';
    case 1: return '已通过';
    case 2: return '被拒绝';
    default: return '未知状态';
  }
};

const getStatusType = (status) => {
  switch (status) {
    case 0: return 'warning';
    case 1: return 'success';
    case 2: return 'danger';
    default: return 'info';
  }
};

function getApplicantIdFromToken() {
  // 兼容localStorage/sessionStorage
  const str = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  if (!str) return null;
  try {
    const obj = JSON.parse(str);
    return obj.id;
  } catch {
    return null;
  }
}

const fetchApplyStatus = () => {
  loading.value = true;
  const applicantId = getApplicantIdFromToken();
  if (!applicantId) {
    ElMessage.error('未获取到用户信息，请重新登录');
    loading.value = false;
    return;
  }
  get(`/api/business/merchant/status?userId=${applicantId}`, (data) => {
    applyList.value = data;
    loading.value = false;
  }, (error) => {
    ElMessage.error('获取申请状态失败');
    loading.value = false;
  });
};

const openApplyDialog = () => {
  dialogVisible.value = true;
};

const submitApply = () => {
  formRef.value.validate((isValid) => {
    if (isValid) {
      const applicantId = getApplicantIdFromToken();
      if (!applicantId) {
        ElMessage.error('未获取到用户信息，请重新登录');
        return;
      }
      const requestData = { ...form, applicantId };
      post('/api/business/merchant/apply-by-id', requestData, () => {
        ElMessage.success('申请已提交');
        dialogVisible.value = false;
        fetchApplyStatus(); // 刷新状态
      }, (error) => {
        ElMessage.error('申请失败: ' + error);
      });
    }
  });
};

function formatDateTime(str) {
  if (!str) return '';
  // 兼容ISO格式：2025-06-30T17:51:34
  return str.replace('T', ' ');
}

onMounted(() => {
  fetchApplyStatus();
});
</script>

<style scoped>
.status-section {
  margin-bottom: 20px;
}
.apply-button {
  margin-top: 20px;
}
.no-apply {
  padding: 20px;
  text-align: center;
  color: #888;
}
</style> 