import service from '@/axios'

// ==================== 举报（Message：/api/reports） ====================
// POST /api/reports 提交举报（targetType: Tweet/User, targetGuid, category, reason?, evidenceUrls?）
export function submitReport(payload) {
  return service.post('/api/reports', payload)
}

// GET /api/reports/my 我的举报记录
export function getMyReports(params = {}) {
  return service.get('/api/reports/my', { params })
}
