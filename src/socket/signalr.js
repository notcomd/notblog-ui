import * as signalR from '@microsoft/signalr'
import { getToken } from '@/utils/auth'

let connection = null

// 建立/获取 SignalR 连接（/MessageHub，JWT 走 query access_token）
export function getSignalRConnection() {
  if (connection) return connection
  connection = new signalR.HubConnectionBuilder()
    .withUrl('/MessageHub', {
      accessTokenFactory: () => getToken(),
      transport: signalR.HttpTransportType.WebSockets
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Warning)
    .build()
  return connection
}

export async function connectSignalR() {
  const conn = getSignalRConnection()
  if (conn.state === signalR.HubConnectionState.Connected) return conn
  if (conn.state === signalR.HubConnectionState.Connecting) return conn
  try {
    await conn.start()
    return conn
  } catch (e) {
    console.error('SignalR 连接失败:', e)
    throw e
  }
}

export async function disconnectSignalR() {
  if (connection && connection.state !== signalR.HubConnectionState.Disconnected) {
    await connection.stop()
  }
}

export function isConnected() {
  return !!connection && connection.state === signalR.HubConnectionState.Connected
}
