import * as signalR from '@microsoft/signalr';
import { getToken } from '@/utils/auth';

/**
 * 兴趣社区实时通信 Hub（/CommunityHub）连接管理。
 *
 * 能力：
 * - 建立/复用 `/CommunityHub` 长连接（JWT 走 query access_token）；
 * - 订阅/退订圈子频道：JoinCircle / LeaveCircle（服务端校验圈子成员身份）；
 * - 全局事件回调注册：收到圈子实时事件（PostPublished/CommentAdded/PostLiked/
 *   PostFavorited/MemberJoined/MemberLeft/MemberRemoved/InvitedToCircle）时通知订阅者。
 */
let connection: signalR.HubConnection | null = null;

/**
 * 订阅社区实时事件的回调（全局唯一注册，事件名见后端 ICommunityClient）。
 * 回调签名：function(eventName, ...args)
 */
type CommunityEventHandler = (eventName: string, ...args: unknown[]) => void;
const handlers: CommunityEventHandler[] = [];

export function getCommunityConnection(): signalR.HubConnection {
  if (connection) return connection;
  connection = new signalR.HubConnectionBuilder()
    .withUrl('/CommunityHub', {
      accessTokenFactory: () => getToken(),
      transport: signalR.HttpTransportType.WebSockets
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  // 后端 ICommunityClient 的全部客户端事件，统一转发给订阅者
  const hubEvents = [
    'PostPublished',
    'CommentAdded',
    'PostLiked',
    'PostFavorited',
    'MemberJoined',
    'MemberLeft',
    'MemberRemoved',
    'InvitedToCircle'
  ];
  for (const evt of hubEvents) {
    connection.on(evt, (...args: unknown[]) => {
      handlers.forEach((cb) => cb(evt, ...args));
    });
  }
  return connection;
}

export async function connectCommunity(): Promise<signalR.HubConnection> {
  const conn = getCommunityConnection();
  if (conn.state === signalR.HubConnectionState.Connected) return conn;
  if (conn.state === signalR.HubConnectionState.Connecting) return conn;
  try {
    await conn.start();
    return conn;
  } catch (e) {
    console.error('CommunityHub 连接失败:', e);
    throw e;
  }
}

/** 注册社区实时事件监听（建议全局注册一次） */
export function onCommunityEvent(cb: CommunityEventHandler): void {
  if (!handlers.includes(cb)) handlers.push(cb);
}

/** 移除社区实时事件监听 */
export function offCommunityEvent(cb: CommunityEventHandler): void {
  const i = handlers.indexOf(cb);
  if (i >= 0) handlers.splice(i, 1);
}

/** 订阅圈子频道（仅圈子成员可订阅，服务端强校验） */
export async function joinCircle(circleGuid: string): Promise<void> {
  try {
    const conn = await connectCommunity();
    await conn.invoke('JoinCircle', circleGuid);
  } catch (e) {
    console.warn(`订阅圈子频道失败: ${circleGuid}`, e);
  }
}

/** 退订圈子频道 */
export async function leaveCircle(circleGuid: string): Promise<void> {
  if (!connection || connection.state !== signalR.HubConnectionState.Connected) return;
  try {
    await connection.invoke('LeaveCircle', circleGuid);
  } catch (e) {
    console.warn(`退订圈子频道失败: ${circleGuid}`, e);
  }
}

export function isCommunityConnected(): boolean {
  return !!connection && connection.state === signalR.HubConnectionState.Connected;
}