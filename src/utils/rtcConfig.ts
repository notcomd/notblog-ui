import service from '@/axios';

// ============================================================
// WebRTC ICE 服务器配置（TURN / STUN）
//
// 优先级：
//  1. 静态 TURN（VUE_APP_TURN_URL + 用户名/密码）——开发或自建证书场景；
//  2. coturn REST API（VUE_APP_TURN_REST_URL）限时凭证——生产推荐，
//     服务端动态签发 username+credential，避免把长期密钥打包进前端；
//  3. 以上均未配置时降级为纯 STUN（仅能打通公共网络可能，适用于内网/局域网）。
//
// ⚠️ 安全：请勿在浏览器前端硬编码 TURN 长期凭证；生产环境优先用 REST 凭证接口。
// ============================================================

/** 内置公共 STUN，作为基础打洞/连通性收集 */
const STUN_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' }
];

/** 从环境变量读取静态 TURN 服务器（含可选用户名/密码） */
function staticTurnServer(): RTCIceServer | null {
  const urls = process.env.VUE_APP_TURN_URL;
  if (!urls) return null;

  const server: RTCIceServer = { urls };
  const username = process.env.VUE_APP_TURN_USERNAME;
  const credential = process.env.VUE_APP_TURN_CREDENTIAL;
  if (username && credential) {
    server.username = username;
    server.credential = credential;
  }
  return server;
}

/**
 * 通过 coturn REST API（Use 方式）换取限时 TURN 凭证。
 * 期望响应形如：{ urls: "turn:host:3478?transport=udp", username, credential }
 */
async function fetchTurnCredentials(): Promise<RTCIceServer[]> {
  const restUrl = process.env.VUE_APP_TURN_REST_URL;
  if (!restUrl) return [];

  try {
    const res = await service.get(restUrl);
    const d = res && res.data ? res.data : res;
    const iceServer: RTCIceServer = { urls: d.urls as string | string[] };
    if (d.username) iceServer.username = d.username;
    if (d.credential) iceServer.credential = d.credential;
    return d.urls ? [iceServer] : [];
  } catch (e) {
    console.error('获取 TURN 限时凭证失败，已降级为仅使用 STUN:', e);
    return [];
  }
}

/**
 * 返回 WebRTC 对等连接所需的 ICE 服务器列表（STUN + 可用的 TURN）。
 */
export async function getIceServers(): Promise<RTCIceServer[]> {
  const staticTurn = staticTurnServer();
  if (staticTurn) return [...STUN_SERVERS, staticTurn];

  const dynamicTurn = await fetchTurnCredentials();
  return [...STUN_SERVERS, ...dynamicTurn];
}