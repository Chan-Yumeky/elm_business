<template>
  <div class="business-info-page">
    <h2 class="business-info-title">商家信息管理</h2>
    <!-- 权限提示：如果不是商家，显示引导 -->
    <div v-if="!isMerchant" class="not-merchant">
      <el-card class="join-card">
        <div class="join-tip">还未成为商家？</div>
        <el-link type="primary" @click="$router.push('/home/apply')">加入我们</el-link>
      </el-card>
    </div>
    <!-- 如果是商家，显示商家列表 -->
    <div v-else class="merchant-content">
      <div class="business-info-toolbar">
        <el-button type="primary" size="small" @click="fetchBusinessList">刷新</el-button>
        <!-- <el-button type="success" size="small" @click="addBusiness">新增商家</el-button> -->
      </div>
      <el-table
        :data="businessList"
        style="width: 100%; margin-top: 16px;"
        size="small"
        empty-text="暂无商家信息"
      >
        <el-table-column prop="businessId" label="商家ID" width="100" />
        <el-table-column prop="businessName" label="商家名称" width="150" />
        <el-table-column prop="businessAddress" label="地址" width="200" />
        <el-table-column prop="businessExplain" label="简介" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
              {{ scope.row.status === 1 ? '营业中' : '停业中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button type="primary" size="small" @click="editBusiness(scope.row)">编辑</el-button>
            <el-button type="danger" size="small" @click="deleteBusiness(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <!-- 编辑商家弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑商家信息" width="500px" :close-on-click-modal="false">
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="90px">
        <el-form-item label="商家名称" prop="businessName">
          <el-input v-model="editForm.businessName" maxlength="40" placeholder="请输入商家名称" />
        </el-form-item>
        <el-form-item label="商家地址" prop="businessAddress">
          <el-input v-model="editForm.businessAddress" maxlength="50" placeholder="请输入商家地址" />
        </el-form-item>
        <el-form-item label="简介" prop="businessExplain">
          <el-input v-model="editForm.businessExplain" maxlength="200" type="textarea" placeholder="请输入简介" />
        </el-form-item>
        <el-form-item label="Logo图片URL" prop="businessImg">
          <el-input v-model="editForm.businessImg" placeholder="请输入Logo图片URL" />
          <div v-if="editForm.businessImg" style="margin-top:8px;">
            <el-image :src="editForm.businessImg" style="width:80px;height:80px;border-radius:6px;" fit="cover" />
          </div>
        </el-form-item>
        <el-form-item label="起送价" prop="startPrice">
          <el-input-number v-model="editForm.startPrice" :min="0" :step="1" placeholder="请输入起送价" style="width: 100%" />
        </el-form-item>
        <el-form-item label="配送费" prop="deliveryPrice">
          <el-input-number v-model="editForm.deliveryPrice" :min="0" :step="1" placeholder="请输入配送费" style="width: 100%" />
        </el-form-item>
        <el-form-item label="商家类型ID" prop="orderTypeId">
          <el-input-number v-model="editForm.orderTypeId" :min="1" :step="1" placeholder="类型ID" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注" prop="remarks">
          <el-input v-model="editForm.remarks" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEditForm" :loading="editLoading">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { get, post } from '@/net';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';

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
const businessList = ref<any[]>([]);

// 编辑弹窗相关
const editDialogVisible = ref(false);
const editLoading = ref(false);
const editFormRef = ref<FormInstance>();
const editForm = reactive({
  businessId: '',
  businessName: '',
  businessAddress: '',
  businessExplain: '',
  businessImg: '',
  startPrice: 0,
  deliveryPrice: 0,
  orderTypeId: 1, // 默认类型
  remarks: ''
});
const editRules: FormRules = {
  businessName: [
    { required: true, message: '请输入商家名称', trigger: 'blur' },
    { min: 1, max: 40, message: '长度1-40字符', trigger: 'blur' }
  ],
  businessAddress: [
    { required: true, message: '请输入商家地址', trigger: 'blur' },
    { min: 1, max: 50, message: '长度1-50字符', trigger: 'blur' }
  ],
  businessExplain: [
    { max: 200, message: '简介不能超过200字符', trigger: 'blur' }
  ],
  businessImg: [
    { type: 'string', required: false, message: '请输入图片URL', trigger: 'blur' }
  ]
};

// 获取商家列表
function fetchBusinessList() {
  if (!id) return;
  get(`/api/business/list-by-user?userId=${id}`, (data: any[]) => {
    businessList.value = data || [];
    if (data.length > 0) {
      isMerchant.value = true;
    } else {
      isMerchant.value = false;
    }
  });
}

function editBusiness(row: any) {
  Object.assign(editForm, {
    businessId: row.businessId,
    businessName: row.businessName,
    businessAddress: row.businessAddress,
    businessExplain: row.businessExplain,
    businessImg: row.businessImg,
    startPrice: row.startPrice ?? 0,
    deliveryPrice: row.deliveryPrice ?? 0,
    orderTypeId: row.orderTypeId ?? 1,
    remarks: row.remarks ?? ''
  });
  editDialogVisible.value = true;
}

function submitEditForm() {
  editFormRef.value?.validate((valid) => {
    if (valid) {
      editLoading.value = true;
      post(`/api/business/update-info-by-user?userId=${id}`, editForm, () => {
        ElMessage.success('商家信息更新成功');
        editDialogVisible.value = false;
        fetchBusinessList();
      }, (msg: string) => {
        ElMessage.error(msg || '商家信息更新失败');
      });
      editLoading.value = false;
    }
  });
}

function deleteBusiness(row: any) {
  ElMessageBox.confirm(
    `确定要删除商家"${row.businessName}"吗？删除后无法恢复。`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    post(`/api/business/delete?businessId=${row.businessId}`, {}, () => {
      ElMessage.success('商家删除成功');
      fetchBusinessList();
    }, (msg: string) => {
      ElMessage.error(msg || '商家删除失败');
    });
  });
}

onMounted(() => {
  fetchBusinessList();
});
</script>

<style scoped>
.business-info-page {
  padding: 30px 20px;
}
.business-info-title {
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 18px;
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
.merchant-content {
  margin-top: 20px;
}
.business-info-toolbar {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 8px;
}
</style> 