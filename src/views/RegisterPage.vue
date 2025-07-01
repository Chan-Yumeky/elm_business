<script setup lang="ts">
import {ref, reactive, computed} from "vue";
import {EditPen, Lock, Message, User} from "@element-plus/icons-vue";
import router from "@/router";
import {get, post} from "@/net/index.ts";
import {ElMessage} from "element-plus";

// 冷却时间
const coldTime = ref(0)

const formRef = ref()

const form = reactive({
  username: '',
  password: '',
  password_repeat: '',
  email: '',
  code: ''
})

const validateUsername = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入用户名'))
  } else if (!/^[a-zA-Z0-9\u4e00-\u9fa5]+$/.test(value)) {
    callback(new Error('用户名不能包含特殊字符，只能是中文/英文'))
  } else {
    callback()
  }
}

const validatePassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== form.password) {
    callback(new Error("两次输入的密码不一致"))
  } else {
    callback()
  }
}

const rule = {
  username: [
    {validator: validateUsername, trigger: ['blur', 'change']},
    {min: 1, max: 30, message: '用户名的长度必须在1-30个字符之间', trigger: ['blur', 'change']},
  ],
  password: [
    {required: true, message: '请输入密码', trigger: 'blur'},
    {min: 6, max: 20, message: '密码的长度必须在6-20个字符之间', trigger: ['blur', 'change']}
  ],
  password_repeat: [
    {validator: validatePassword, trigger: ['blur', 'change']},
  ],
  email: [
    {required: true, message: '请输入邮件地址', trigger: 'blur'},
    {type: 'email', message: '请输入合法的电子邮件地址', trigger: ['blur', 'change']}
  ],
  code: [
    {required: true, message: '请输入获取的验证码', trigger: 'blur'},
  ]
}

const askCode = () => {
  if (isEmailValid.value) {
    coldTime.value = 60
    get(`/auth/ask-code?email=${form.email}&type=register`, () => {
      ElMessage.success(`验证码已发送到邮箱: ${form.email}，请注意查收`)
      const handle = setInterval(() => {
        coldTime.value--
        if (coldTime.value === 0) {
          clearInterval(handle)
        }
      }, 1000)
    }, (message) => {
      ElMessage.warning(message)
      coldTime.value = 0
    })
  } else {
    ElMessage.warning("请输入正确的电子邮件！")
  }
}

const isEmailValid = computed(() => /^[\w.-]+@[\w.-]+\.\w+$/.test(form.email))

const register = () => {
  formRef.value.validate((isValid) => {
    if (isValid) {
      post('/auth/register', {...form}, () => {
        ElMessage('注册成功~')
        router.push('/login')
      })
    } else {
      ElMessage.warning('请完整填写注册表单内容')
    }
  })
}
</script>

<template>
  <div class="page-flex">
    <div class="left-blank"></div>
    <div class="right-register">
      <el-card class="register-card">
        <div class="register-logo">
          <img src="@/assets/elm.svg" alt="logo" />
        </div>
        <div class="register-title">注册</div>
        <el-form :model="form" :rules="rule" ref="formRef" class="register-form">
          <el-form-item prop="username">
            <el-input v-model="form.username" maxlength="30" type="text" placeholder="用户名/邮箱">
              <template #prefix>
                <el-icon>
                  <User/>
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="form.password" maxlength="20" type="password" placeholder="密码">
              <template #prefix>
                <el-icon>
                  <Lock/>
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="password_repeat">
            <el-input v-model="form.password_repeat" maxlength="20" type="password" placeholder="重复密码">
              <template #prefix>
                <el-icon>
                  <Lock/>
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="email">
            <el-input v-model="form.email" type="email" placeholder="电子邮件地址">
              <template #prefix>
                <el-icon>
                  <Message/>
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="code">
            <el-row :gutter="10" class="w-full">
              <el-col :span="16">
                <el-input v-model="form.code" :maxlength="6" type="text" placeholder="请输入验证码">
                  <template #prefix>
                    <el-icon>
                      <EditPen/>
                    </el-icon>
                  </template>
                </el-input>
              </el-col>
              <el-col :span="8">
                <el-button @click="askCode" :disabled="!isEmailValid || coldTime" type="success" class="code-btn">
                  {{ coldTime > 0 ? `请稍后 ${coldTime} 秒` : '获取验证码' }}
                </el-button>
              </el-col>
            </el-row>
          </el-form-item>
          <el-form-item>
            <el-button @click="register" type="warning" plain class="register-btn">立即注册</el-button>
          </el-form-item>
        </el-form>
        <div class="register-footer">
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
.right-register {
  flex: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 420px;
}
.register-card {
  width: 400px;
  padding: 40px 32px 32px 32px;
  box-sizing: border-box;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.08);
  background: #fff;
}
.register-logo {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 16px;
}
.register-logo img {
  width: 80px;
  height: 80px;
}
.register-title {
  font-size: 26px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 28px;
  color: #333;
}
.register-form {
  margin-bottom: 0;
}
.register-btn {
  width: 294px;
  display: block;
  margin: 0 auto 16px auto;
  font-size: 16px;
}
.code-btn {
  width: 100%;
  min-width: 90px;
}
.register-footer {
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