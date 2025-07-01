<script setup lang="ts">
import {ref, reactive} from 'vue';
import {ElMessage} from 'element-plus';
import router from '@/router';
import axios from 'axios';

const formRef = ref();
const form = reactive({
  userName: '',
  businessName: '',
  businessAddress: '',
  contactPhone: '',
  businessDesc: ''
});

const rules = {
  userName: [
    {required: true, message: '请输入用户名'}
  ],
  businessName: [
    {required: true, message: '请输入商家名称'}
  ],
  businessAddress: [
    {required: true, message: '请输入商家地址'}
  ],
  contactPhone: [
    {required: true, message: '请输入联系电话'},
    {pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号'}
  ],
  businessDesc: [
    {required: true, message: '请输入商家简介'}
  ]
};

const submitApply = async () => {
  formRef.value.validate(async (isValid:boolean) => {
    if (isValid) {
      try {
        const response = await axios.post('api/business/merchant/apply', form);
        if (response.data.code === 200) {
          ElMessage.success('申请已提交，请等待审核');
          router.push('/merchant/login');
        } else {
          ElMessage.error(response.data.message || '申请提交失败');
        }
      } catch (error) {
        console.error('申请提交错误:', error);
        ElMessage.error('网络错误，请稍后重试');
      }
    }
  });
};
</script>

<template>
  <div class="page-flex">
    <div class="left-blank"></div>
    <div class="right-apply">
      <el-card class="apply-card">
        <div class="apply-logo">
          <img src="@/assets/elm.svg" alt="logo" />
        </div>
        <div class="apply-title">商家入驻申请</div>
        <el-form :model="form" :rules="rules" ref="formRef" class="apply-form">
          <el-form-item prop="userName">
            <el-input v-model="form.userName" maxlength="20" placeholder="用户名" />
          </el-form-item>
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
          <el-form-item>
            <el-button @click="submitApply" type="primary" plain class="apply-btn">提交申请</el-button>
          </el-form-item>
        </el-form>
        <div class="apply-footer">
          <span class="footer-text">已有账号?</span>
          <el-link @click="router.push('/login')" type="primary" class="footer-link">立即登录</el-link>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.page-flex {
  display: flex;
  min-height: 100vh;
  background: #f5f7fa;
}
.left-blank {
  flex: 1;
}
.right-apply {
  flex: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 420px;
}
.apply-card {
  width: 400px;
  padding: 40px 32px 32px 32px;
  box-sizing: border-box;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.08);
  background: #fff;
}
.apply-logo {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 16px;
}
.apply-logo img {
  width: 80px;
  height: 80px;
}
.apply-title {
  font-size: 26px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 28px;
  color: #333;
}
.apply-form {
  margin-bottom: 0;
}
.apply-btn {
  width: 294px;
  display: block;
  margin: 0 auto 16px auto;
  font-size: 16px;
}
.apply-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 8px;
}
.footer-text {
  color: #888;
  font-size: 15px;
}
.footer-link {
  margin-left: 8px;
  font-size: 15px;
}
</style> 