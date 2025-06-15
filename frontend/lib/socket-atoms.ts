import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { io, Socket } from 'socket.io-client'

// Socket接続の状態を管理するatom
export const socketAtom = atom<Socket | null>(null)

// 接続状態を管理するatom
export const connectionStatusAtom = atom<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')

// 受信メッセージを管理するatom
export const messagesAtom = atom<Array<{ id: string; content: string; timestamp: Date; userId?: string }>>([])

// ユーザー情報を管理するatom（ローカルストレージに保存）
export const userAtom = atomWithStorage<{ id: string; name: string } | null>('socket-user', null)

// サーバーURLを管理するatom
export const serverUrlAtom = atomWithStorage('socket-server-url', 'http://localhost:3001')

// Socket接続を初期化するatom（write-only）
export const initSocketAtom = atom(
  null,
  async (get, set) => {
    const currentSocket = get(socketAtom)
    const serverUrl = get(serverUrlAtom)
    const user = get(userAtom)
    
    // 既存の接続があれば切断
    if (currentSocket) {
      currentSocket.disconnect()
    }
    
    set(connectionStatusAtom, 'connecting')
    
    try {
      const newSocket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
      })
      
      // 接続イベントのハンドリング
      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id)
        set(connectionStatusAtom, 'connected')
        
        // ユーザーがログインしている場合、サーバーに通知
        if (user) {
          newSocket.emit('user-login', user)
        }
      })
      
      newSocket.on('disconnect', () => {
        console.log('Socket disconnected')
        set(connectionStatusAtom, 'disconnected')
      })
      
      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        set(connectionStatusAtom, 'error')
      })
      
      // メッセージ受信の処理
      newSocket.on('message', (data: { id: string; content: string; timestamp: string; userId?: string }) => {
        set(messagesAtom, (prev) => [
          ...prev,
          {
            ...data,
            timestamp: new Date(data.timestamp)
          }
        ])
      })
      
      set(socketAtom, newSocket)
      
    } catch (error) {
      console.error('Failed to initialize socket:', error)
      set(connectionStatusAtom, 'error')
    }
  }
)

// Socket切断用のatom（write-only）
export const disconnectSocketAtom = atom(
  null,
  (get, set) => {
    const socket = get(socketAtom)
    if (socket) {
      socket.disconnect()
      set(socketAtom, null)
      set(connectionStatusAtom, 'disconnected')
    }
  }
)

// メッセージ送信用のatom（write-only）
export const sendMessageAtom = atom(
  null,
  (get, set, message: string) => {
    const socket = get(socketAtom)
    const user = get(userAtom)
    const status = get(connectionStatusAtom)
    
    if (!socket || status !== 'connected') {
      console.warn('Socket not connected, cannot send message')
      return false
    }
    
    const messageData = {
      id: Date.now().toString(),
      content: message,
      timestamp: new Date().toISOString(),
      userId: user?.id
    }
    
    socket.emit('message', messageData)
    return true
  }
)

// メッセージクリア用のatom（write-only）
export const clearMessagesAtom = atom(
  null,
  (get, set) => {
    set(messagesAtom, [])
  }
)

// 接続状態に応じたステータステキストを返すatom（read-only）
export const connectionStatusTextAtom = atom((get) => {
  const status = get(connectionStatusAtom)
  switch (status) {
    case 'disconnected':
      return '未接続'
    case 'connecting':
      return '接続中...'
    case 'connected':
      return '接続済み'
    case 'error':
      return '接続エラー'
    default:
      return '不明'
  }
})

// オンラインユーザー管理用atom
export const onlineUsersAtom = atom<Array<{ id: string; name: string }>>([])

// オンラインユーザー数を返すatom（read-only）
export const onlineUserCountAtom = atom((get) => get(onlineUsersAtom).length)
