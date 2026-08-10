// 用户资料（等级/经验/硬币/背景封面）：Message 服务 UserInfoApi，需 JWT
// GET /api/user-info/me -> ApiResponse<UserInfoDto>
// UserInfoDto { userId, level, coins, experience, signedInToday, backgroundCoverUrl, updateTime }
// - level: 用户等级（默认 1，最高 9）；experience: 当前等级累计经验（升级清零）
// - coins: 硬币余额；升级阈值公式（后端 LevelUpThreshold）：下一级需 2500 × level 经验
// - 未创建过资料时后端返回默认值（等级 1 / 硬币 0），不报错
import service from '@/axios'

export function getMyUserInfo() {
  return service.get('/api/user-info/me')
}

// 更新背景封面：PUT /api/user-info/me/background { backgroundCoverUrl }（空串 = 清除）
export function updateBackgroundCover(url) {
  return service.put('/api/user-info/me/background', { backgroundCoverUrl: url })
}

// ===== 背景封面上传（图片/动态图/视频 ≤20MB） =====
// 通道选择：≤10MB 直传 /api/files/upload-image（图片）或 /api/files/upload（小文件，均限 10MB）；
//          >10MB 自动走分片通道 /api/files/chunk/*（init → 逐片 upload → merge，FileMd5 后端可空不计算）
// 返回 ApiResponse<FileRef>（直传）或 ApiResponse<MergeChunksResult>（分片），均有 fileId/fileUri
const SMALL_FILE_LIMIT = 10 * 1024 * 1024 // 与后端 SmallFileSizeLimit 一致
const UPLOAD_TIMEOUT = 60000 // 上传不走默认 5s 超时

export async function uploadUserCover(file, onProgress) {
  const isImage = file.type.startsWith('image/')
  if (file.size <= SMALL_FILE_LIMIT) {
    const form = new FormData()
    form.append('file', file)
    form.append('description', 'user-cover')
    if (!isImage) form.append('isPublic', 'true')
    return service.post(isImage ? '/api/files/upload-image' : '/api/files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: UPLOAD_TIMEOUT
    })
  }
  return uploadCoverByChunks(file, onProgress)
}

async function uploadCoverByChunks(file, onProgress) {
  const buf = await file.arrayBuffer()
  const init = await service.post('/api/files/chunk/init', {
    fileName: file.name,
    totalSize: file.size,
    fileMd5: null,
    description: 'user-cover',
    isPublic: true
  }, { timeout: UPLOAD_TIMEOUT })
  const meta = init && init.data ? init.data : init
  const { fileKey, totalChunks, chunkSize, uploadedChunks = [] } = meta || {}
  if (!fileKey || !totalChunks) throw new Error('分片初始化失败')
  const uploaded = new Set(uploadedChunks)
  for (let i = 0; i < totalChunks; i++) {
    if (uploaded.has(i)) continue
    const start = i * chunkSize
    const chunk = new Blob([buf.slice(start, Math.min(start + chunkSize, file.size))])
    const form = new FormData()
    form.append('fileKey', fileKey)
    form.append('chunkIndex', String(i))
    form.append('file', chunk, `chunk-${i}`)
    await service.post('/api/files/chunk/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: UPLOAD_TIMEOUT
    })
    if (onProgress) onProgress(Math.round(((i + 1) / totalChunks) * 90))
  }
  const merge = await service.post('/api/files/chunk/merge', {
    fileKey,
    fileName: file.name,
    description: 'user-cover'
  }, { timeout: UPLOAD_TIMEOUT })
  if (onProgress) onProgress(100)
  return merge
}
