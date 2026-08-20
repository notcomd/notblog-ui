import * as signalR from '@microsoft/signalr'
import { getToken } from '@/utils/auth'

// CallHub（语音/视频通话信令）独立连接 —— 与 MessageHub 分离，互不影响
let connection = null

export function getCallConnection() {
  if (connection) return connection
  connection = new signalR.HubConnectionBuilder()
    .withUrl('/CallHub', {
      accessTokenFactory: () => getToken(),
      transport: signalR.HttpTransportType.WebSockets
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Warning)
    .build()
  return connection
}

export async function connectCallSignalR() {
  const conn = getCallConnection()
  if (conn.state === signalR.HubConnectionState.Connected) return conn
  if (conn.state === signalR.HubConnectionState.Connecting) return conn
  try {
    await conn.start()
    return conn
  } catch (e) {
    console.error('CallHub 连接失败:', e)
    throw e
  }
}

export function isCallConnected() {
  return !!connection && connection.state === signalR.HubConnectionState.Connected
}
