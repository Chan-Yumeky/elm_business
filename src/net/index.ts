import axios, { AxiosError } from "axios";
import { ElMessage } from "element-plus";

// 定义变量类型
const authItemName = "access_token";

// 默认错误处理函数，添加参数类型
const defaultError = (error: AxiosError): void => {
    console.error(error);
    ElMessage.error('发生了一些错误，请联系管理员');
}

// 默认失败处理函数，添加参数类型
const defaultFailure = (message: string, status: number, url: string): void => {
    console.warn(`请求地址: ${url}, 状态码: ${status}, 错误信息: ${message}`);
    ElMessage.warning(message);
}

// 获取访问令牌
function takeAccessToken(): string | null {
    const str = localStorage.getItem(authItemName) || sessionStorage.getItem(authItemName);
    if (!str) return null;
    const authObj = JSON.parse(str);
    if (authObj.expire <= new Date()) {
        deleteAccessToken();
        ElMessage.warning("登录状态已过期，请重新登录！");
        return null;
    }
    return authObj.token;
}

// 存储访问令牌
function storeAccessToken(remember: boolean, token: string, expire: string, username: string, id: string): void {
    const authObj = {
        token: token,
        expire: expire,
        username: username,
        id: id,
    };
    const str = JSON.stringify(authObj);
    if (remember) {
        localStorage.setItem(authItemName, str);
    } else {
        sessionStorage.setItem(authItemName, str);
    }
}

// 删除访问令牌
function deleteAccessToken(): void {
    localStorage.removeItem(authItemName);
    sessionStorage.removeItem(authItemName);
}

// 设置请求头
function accessHeader(): Record<string, string> {
    const token = takeAccessToken();
    return token ? {
        'Authorization': `Bearer ${takeAccessToken()}`
    } : {};
}

// 内部 POST 请求
function internalPost(url: string, data: any, headers: Record<string, string>, success: Function, failure: Function, error: Function = defaultError): void {
    axios.post(url, data, { headers: headers }).then(({ data }) => {
        if (data.code === 200)
            success(data.data);
        else
            failure(data.message, data.code, url);
    }).catch((err: AxiosError) => error(err));
}

// 内部 GET 请求
function internalGet(url: string, headers: Record<string, string>, success: Function, failure: Function, error: Function = defaultError): void {
    axios.get(url, { headers: headers }).then(({ data }) => {
        if (data.code === 200)
            success(data.data);
        else
            failure(data.message, data.code, url);
    }).catch((err: AxiosError) => error(err));
}

// GET 请求
function get(url: string, success: Function, failure: Function = defaultFailure): void {
    internalGet(url, accessHeader(), success, failure);
}

// POST 请求
function post(url: string, data: any, success: Function, failure: Function = defaultFailure): void {
    internalPost(url, data, accessHeader(), success, failure);
}

// 登录功能
function login(username: string, password: string, remember: boolean, success: Function, failure: Function = defaultFailure): void {
    internalPost('/auth/login', {
        username: username,
        password: password
    }, {
        // security只支持表单提交，而默认是JSON
        'Content-Type': 'application/x-www-form-urlencoded'
    }, (data: any) => {
        storeAccessToken(remember, data.token, data.expire, data.username, data.id);
        ElMessage.success(`欢迎 ${data.username} ~`);
        success(data);
    }, failure);
}

// 登出功能
function logout(success: Function, failure: Function = defaultFailure): void {
    get('/auth/logout', () => {
        deleteAccessToken();
        ElMessage.success('欢迎您再次使用');
        success();
    }, failure);
}

// 判断是否未授权
function unauthorized(): boolean {
    return !takeAccessToken();
}

export { login, logout, get, post, unauthorized };
