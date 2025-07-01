<template>
  <div class="food-manage-page">
    <h2 class="food-manage-title">菜品管理</h2>
    <!-- 权限提示：如果不是商家，显示引导 -->
    <div v-if="!isMerchant" class="not-merchant">
      <el-card class="join-card">
        <div class="join-tip">还未成为商家？</div>
        <el-link type="primary" @click="$router.push('/home/apply')">加入我们</el-link>
      </el-card>
    </div>
    <!-- 如果是商家，显示菜品管理内容 -->
    <div v-else class="merchant-content">
      <div class="food-manage-toolbar">
        <el-select v-model="selectedBusinessId" placeholder="选择商家" size="small" style="width: 200px" @change="onBusinessChange">
          <el-option 
            v-for="business in businessList" 
            :key="business.businessId" 
            :label="business.businessName" 
            :value="business.businessId" 
          />
        </el-select>
        <el-button type="primary" size="small" @click="fetchFoodList">刷新</el-button>
        <el-button type="success" size="small" @click="showAddDialog">新增菜品</el-button>
      </div>
      <el-table
        :data="foodList"
        style="width: 100%; margin-top: 16px;"
        size="small"
        empty-text="暂无菜品"
      >
        <el-table-column prop="foodId" label="菜品ID" width="80" />
        <el-table-column label="菜品图片" width="100">
          <template #default="scope">
            <el-image 
              :src="scope.row.foodImg || '/public/img/sp01.png'" 
              style="width: 60px; height: 60px; border-radius: 4px;"
              fit="cover"
              :preview-src-list="[scope.row.foodImg || '/public/img/sp01.png']"
            />
          </template>
        </el-table-column>
        <el-table-column prop="foodName" label="菜品名称" width="150" />
        <el-table-column prop="foodPrice" label="价格(元)" width="100">
          <template #default="scope">
            <span class="price-text">￥{{ scope.row.foodPrice }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="foodExplain" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag v-if="Number(scope.row.foodStatus) === 1" type="success" size="small">已上架</el-tag>
            <el-tag v-else-if="Number(scope.row.foodStatus) === 0" type="info" size="small">已下架</el-tag>
            <el-tag v-else type="danger" size="small">异常</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280">
          <template #default="scope">
            <el-button 
              :type="Number(scope.row.foodStatus) === 1 ? 'warning' : 'success'" 
              size="small" 
              @click="toggleFoodStatus(scope.row)"
            >
              {{ Number(scope.row.foodStatus) === 1 ? '下架' : '上架' }}
            </el-button>
            <el-button type="primary" size="small" @click="showEditDialog(scope.row)">编辑</el-button>
            <el-button type="danger" size="small" @click="showDeleteConfirm(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑菜品弹窗 -->
    <el-dialog 
      :title="isEdit ? '编辑菜品' : '新增菜品'" 
      v-model="dialogVisible" 
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form 
        ref="foodFormRef" 
        :model="foodForm" 
        :rules="foodRules" 
        label-width="80px"
        @submit.prevent
      >
        <el-form-item label="菜品名称" prop="foodName">
          <el-input v-model="foodForm.foodName" placeholder="请输入菜品名称" />
        </el-form-item>
        <el-form-item label="菜品价格" prop="foodPrice">
          <el-input-number 
            v-model="foodForm.foodPrice" 
            :precision="2" 
            :step="0.1" 
            :min="0"
            style="width: 100%"
            placeholder="请输入菜品价格"
          />
        </el-form-item>
        <el-form-item label="菜品图片" prop="foodImg">
          <el-input v-model="foodForm.foodImg" placeholder="请输入图片URL地址" />
          <div class="image-preview" v-if="foodForm.foodImg">
            <el-image 
              :src="foodForm.foodImg" 
              style="width: 100px; height: 100px; margin-top: 8px; border-radius: 4px;"
              fit="cover"
            />
          </div>
        </el-form-item>
        <el-form-item label="菜品描述" prop="foodExplain">
          <el-input 
            v-model="foodForm.foodExplain" 
            type="textarea" 
            :rows="3"
            placeholder="请输入菜品描述"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remarks">
          <el-input 
            v-model="foodForm.remarks" 
            type="textarea" 
            :rows="2"
            placeholder="请输入备注信息（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitFoodForm" :loading="submitLoading">
            {{ isEdit ? '更新' : '新增' }}
          </el-button>
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
const selectedBusinessId = ref<string>('');
const foodList = ref<any[]>([]);

// 弹窗相关
const dialogVisible = ref(false);
const isEdit = ref(false);
const submitLoading = ref(false);
const foodFormRef = ref<FormInstance>();

// 表单数据
const foodForm = reactive({
  foodId: '',
  foodName: '',
  foodPrice: 0,
  foodImg: '',
  foodExplain: '',
  businessId: '',
  remarks: ''
});

// 表单验证规则
const foodRules: FormRules = {
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

// 获取商家列表
function fetchBusinessList() {
  if (!id) return;
  get(`/api/business/list-by-user?userId=${id}`, (data: any[]) => {
    businessList.value = data || [];
    if (data.length > 0) {
      isMerchant.value = true;
      selectedBusinessId.value = data[0].businessId;
      fetchFoodList();
    } else {
      isMerchant.value = false;
    }
  });
}

function fetchFoodList() {
  if (!selectedBusinessId.value) return;
  get(`/api/food/list-all-food-by-BusinessId?businessId=${selectedBusinessId.value}`, (data: any[]) => {
    foodList.value = data || [];
  });
}

function onBusinessChange() {
  fetchFoodList();
}

// 显示新增弹窗
function showAddDialog() {
  isEdit.value = false;
  resetForm();
  foodForm.businessId = selectedBusinessId.value;
  dialogVisible.value = true;
}

// 显示编辑弹窗
function showEditDialog(row: any) {
  isEdit.value = true;
  resetForm();
  Object.assign(foodForm, {
    foodId: row.foodId,
    foodName: row.foodName,
    foodPrice: row.foodPrice,
    foodImg: row.foodImg,
    foodExplain: row.foodExplain,
    businessId: selectedBusinessId.value,
    remarks: row.remarks || ''
  });
  dialogVisible.value = true;
}

// 重置表单
function resetForm() {
  Object.assign(foodForm, {
    foodId: '',
    foodName: '',
    foodPrice: 0,
    foodImg: '',
    foodExplain: '',
    businessId: '',
    remarks: ''
  });
  foodFormRef.value?.clearValidate();
}

// 提交表单
function submitFoodForm() {
  foodFormRef.value?.validate((valid) => {
    if (valid) {
      submitLoading.value = true;
      const url = isEdit.value ? '/api/food/update' : '/api/food/add';
      
      post(url, foodForm, () => {
        ElMessage.success(isEdit.value ? '菜品更新成功' : '菜品新增成功');
        dialogVisible.value = false;
        fetchFoodList();
      }, (message: string) => {
        ElMessage.error(message || (isEdit.value ? '菜品更新失败' : '菜品新增失败'));
      });
      
      submitLoading.value = false;
    }
  });
}

// 删除确认
function showDeleteConfirm(row: any) {
  ElMessageBox.confirm(
    `确定要删除菜品"${row.foodName}"吗？删除后无法恢复。`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    deleteFood(row.foodId);
  });
}

// 删除菜品
function deleteFood(foodId: string) {
  post(`/api/food/delete?foodId=${foodId}`, {}, () => {
    ElMessage.success('菜品删除成功');
    fetchFoodList();
  }, (message: string) => {
    ElMessage.error(message || '菜品删除失败');
  });
}

// 切换菜品状态（上架/下架）
function toggleFoodStatus(row: any) {
  const currentStatus = Number(row.foodStatus);
  const newStatus = currentStatus === 1 ? 0 : 1;
  const actionText = newStatus === 1 ? '上架' : '下架';
  
  ElMessageBox.confirm(
    `确定要${actionText}菜品"${row.foodName}"吗？`,
    `确认${actionText}`,
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    post(`/api/food/status?foodId=${row.foodId}&foodStatus=${newStatus}`, {}, () => {
      ElMessage.success(`菜品${actionText}成功`);
      fetchFoodList();
    }, (message: string) => {
      ElMessage.error(message || `菜品${actionText}失败`);
    });
  });
}

onMounted(() => {
  fetchBusinessList();
});
</script>

<style scoped>
.food-manage-page {
  padding: 30px 20px;
}
.food-manage-title {
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
.food-manage-toolbar {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 8px;
}
.price-text {
  color: #e6a23c;
  font-weight: bold;
}
.image-preview {
  margin-top: 8px;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style> 