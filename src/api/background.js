// 自定义背景图上传：POST /api/files/upload-image（Message FilesApi 真实端点，走 FileDev gRPC）
// 返回 FileRef { fileId, fileUri, fileName, fileSize, fileMd5, mimeType, width, height }
// ⚠️ 管理端「用户壁纸」审核列表/删除端点仍为后端缺口（admin.js 占位）
import service from '@/axios'

export function uploadBackground(file) {
  const form = new FormData()
  form.append('file', file)
  form.append('description', 'user-wallpaper')
  return service.post('/api/files/upload-image', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
