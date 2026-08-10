import axios from 'axios'
import router from '@/router'
import { getToken } from '@/utils/auth'

// 创建 axios 实例
const service = axios.create({
  // 开发环境通过 vue.config.js proxy 转发，无需跨域；生产环境通过环境变量配置
  baseURL: process.env.VUE_APP_API_BASE_URL || '',
  timeout: 5000 // 请求超时时间
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    const token = getToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    // 设置默认 Content-Type
    if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json;charset=UTF-8'
    }
    return config
  },
  error => {
    // 对请求错误做些什么
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data

    // 仅当响应是带 code 字段的对象时才进行业务校验，否则直接放行
    // （例如 OAuth URL 纯文本、文件流、第三方接口等非标准格式响应）
    if (res && typeof res === 'object' && res.code !== undefined) {
      if (res.code !== 200) {
        switch (res.code) {
          case 401:
            console.log('未授权，请登录')
            router.push('/login')
            break
          case 403:
            console.log('拒绝访问')
            break
          case 404:
            console.log('请求资源不存在')
            break
          default:
            console.log('请求错误:', res.message)
        }
        return Promise.reject(new Error(res.message || 'Error'))
      }
    }

    return res
  },
  error => {
    // 对响应错误做点什么
    if (error.response) {
      const { status } = error.response
      switch (status) {
        case 401:
          console.log('登录状态已过期，请重新登录')
          router.push('/login')
          break
        case 403:
          console.log('拒绝访问')
          break
        case 404:
          console.log('请求资源不存在')
          break
        case 500:
          console.log('服务器内部错误')
          break
        case 502:
          console.log('网关错误')
          break
        case 503:
          console.log('服务不可用')
          break
        case 504:
          console.log('网关超时')
          break
        default:
          console.log('请求出错:', error.message)
      }
    } else {
      console.log('请求出错:', error.message)
    }
    return Promise.reject(error)
  }
)

export default service