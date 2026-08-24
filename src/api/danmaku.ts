import service from '@/axios';

// 弹幕列表：GET /api/videobarrage/{videoGuid} -> IVideoResult<List<BarrageResponse>>
// ⚠️ 后端无播放时间点字段，前端按 timeOffset（本地模拟）流式调度
export function getBarrages(videoGuid: string) {
  return service.get(`/api/videobarrage/${videoGuid}`);
}

// 发送弹幕：POST /api/videobarrage/ （FormData；UserGuid 服务端从 JWT 解析，忽略客户端值）
export function sendBarrage(videoGuid: string, text: string) {
  const form = new FormData();
  form.append('VideoGuid', videoGuid);
  form.append('VideoBarrageBody', text);
  return service.post('/api/videobarrage/', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

// 内置敏感词库（前端拦截；后端另有 HTML 净化兜底）
export const SENSITIVE_WORDS = [
  '傻逼',
  '傻b',
  'sb',
  '妈的',
  '操你',
  'fuck',
  '垃圾滚',
  '去死',
  '贱人',
  '脑残',
  '狗东西',
  '婊子'
];

export function containsSensitive(text: string) {
  const lower = text.toLowerCase();
  return SENSITIVE_WORDS.some((w) => lower.includes(w.toLowerCase()));
}
