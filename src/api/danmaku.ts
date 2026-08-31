import service from '@/axios';

// 弹幕列表：GET /api/videobarrage/{videoGuid} -> IVideoResult<List<BarrageResponse>>
// BarrageResponse 含 timeAt（播放时间点，毫秒）；前端映射为 timeOffset（秒）按播放进度调度
export function getBarrages(videoGuid: string) {
  return service.get(`/api/videobarrage/${videoGuid}`);
}

// 发送弹幕：POST /api/videobarrage/ （FormData；UserGuid 服务端从 JWT 解析，忽略客户端值）
// timeAt：当前播放进度（毫秒，自视频开头），服务端持久化供他人按时间轴显示
export function sendBarrage(videoGuid: string, text: string, timeAt?: number) {
  const form = new FormData();
  form.append('VideoGuid', videoGuid);
  form.append('VideoBarrageBody', text);
  if (timeAt != null) form.append('TimeAt', String(timeAt));
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
