import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useCallback, useEffect } from 'react'
import {
  socketAtom,
  connectionStatusAtom,
  messagesAtom,
  userAtom,
  serverUrlAtom,
  initSocketAtom,
  disconnectSocketAtom,
  sendMessageAtom,
  clearMessagesAtom,
  connectionStatusTextAtom,
  onlineUsersAtom,
  onlineUserCountAtom
} from '../lib/socket-atoms'

// Socket管理の統合カスタムフック
export const useSocket = () => {
  const [socket] = useAtom(socketAtom)
  const [connectionStatus] = useAtom(connectionStatusAtom)
  const connectionStatusText = useAtomValue(connectionStatusTextAtom)
  const initSocket = useSetAtom(initSocketAtom)
  const disconnectSocket = useSetAtom(disconnectSocketAtom)
  
  const connect = useCallback(async () => {
    await initSocket()
  }, [initSocket])
  
  const disconnect = useCallback(() => {
    disconnectSocket()
  }, [disconnectSocket])
  
  const isConnected = connectionStatus === 'connected'
  const isConnecting = connectionStatus === 'connecting'
  const hasError = connectionStatus === 'error'
  
  return {
    socket,
    connectionStatus,
    connectionStatusText,
    connect,
    disconnect,
    isConnected,
    isConnecting,
    hasError
  }
}

// メッセージ管理用カスタムフック
export const useMessages = () => {
  const [messages] = useAtom(messagesAtom)
  const sendMessage = useSetAtom(sendMessageAtom)
  const clearMessages = useSetAtom(clearMessagesAtom)
  
  const send = useCallback((message: string) => {
    return sendMessage(message)
  }, [sendMessage])
  
  const clear = useCallback(() => {
    clearMessages()
  }, [clearMessages])
  
  return {
    messages,
    send,
    clear
  }
}

// ユーザー管理用カスタムフック
export const useUser = () => {
  const [user, setUser] = useAtom(userAtom)
  
  const login = useCallback((userData: { id: string; name: string }) => {
    setUser(userData)
  }, [setUser])
  
  const logout = useCallback(() => {
    setUser(null)
  }, [setUser])
  
  const isLoggedIn = !!user
  
  return {
    user,
    login,
    logout,
    isLoggedIn
  }
}

// サーバー設定用カスタムフック
export const useServerConfig = () => {
  const [serverUrl, setServerUrl] = useAtom(serverUrlAtom)
  
  const updateServerUrl = useCallback((url: string) => {
    setServerUrl(url)
  }, [setServerUrl])
  
  return {
    serverUrl,
    updateServerUrl
  }
}

// オンラインユーザー管理用カスタムフック
export const useOnlineUsers = () => {
  const [onlineUsers, setOnlineUsers] = useAtom(onlineUsersAtom)
  const onlineUserCount = useAtomValue(onlineUserCountAtom)
  
  return {
    onlineUsers,
    onlineUserCount,
    setOnlineUsers
  }
}

// Socket接続の自動管理フック（コンポーネントマウント時に自動接続）
export const useAutoSocket = (autoConnect = true) => {
  const { connect, disconnect, isConnected } = useSocket()
  const { user } = useUser()
  
  useEffect(() => {
    if (autoConnect && user && !isConnected) {
      connect()
    }
    
    return () => {
      if (autoConnect) {
        disconnect()
      }
    }
  }, [autoConnect, user, isConnected, connect, disconnect])
  
  return { connect, disconnect, isConnected }
}

// リアルタイム通知管理フック
export const useSocketNotifications = () => {
  const { socket } = useSocket()
  const [, setOnlineUsers] = useAtom(onlineUsersAtom)
  
  useEffect(() => {
    if (!socket) return
    
    // オンラインユーザー更新の処理
    const handleUsersUpdate = (users: Array<{ id: string; name: string }>) => {
      setOnlineUsers(users)
    }
    
    // ユーザー参加通知
    const handleUserJoined = (user: { id: string; name: string }) => {
      console.log(`${user.name} が参加しました`)
      // ここでトースト通知などを表示できます
    }
    
    // ユーザー退出通知
    const handleUserLeft = (user: { id: string; name: string }) => {
      console.log(`${user.name} が退出しました`)
      // ここでトースト通知などを表示できます
    }
    
    socket.on('users-update', handleUsersUpdate)
    socket.on('user-joined', handleUserJoined)
    socket.on('user-left', handleUserLeft)
    
    return () => {
      socket.off('users-update', handleUsersUpdate)
      socket.off('user-joined', handleUserJoined)
      socket.off('user-left', handleUserLeft)
    }
  }, [socket, setOnlineUsers])
}
