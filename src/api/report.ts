import service from '@/axios';

/** 提交举报请求体 */
interface SubmitReportData {
  targetType: 'Tweet' | 'User';
  targetGuid: string;
  category: string;
  reason?: string;
  evidenceUrls?: string[];
}

/** 分页查询参数 */
interface PageParams {
  page?: number;
  pageSize?: number;
}

// ==================== 举报（Message：/api/reports） ====================
// POST /api/reports 提交举报（targetType: Tweet/User, targetGuid, category, reason?, evidenceUrls?）
export function submitReport(payload: SubmitReportData) {
  return service.post('/api/reports', payload);
}

// GET /api/reports/my 我的举报记录
export function getMyReports(params: PageParams = {}) {
  return service.get('/api/reports/my', { params });
}
