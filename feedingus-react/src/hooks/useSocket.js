import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = 'http://localhost:5000'

/**
 * Custom hook that creates and maintains a Socket.io connection.
 * Authenticates using the JWT token from localStorage.
 * Returns the socket instance so callers can subscribe to events.
 *
 * Usage:
 *   const socket = useSocket()
 *   useEffect(() => {
 *     if (!socket) return
 *     socket.on('order:updated', handler)
 *     return () => socket.off('order:updated', handler)
 *   }, [socket])
 */
export default function useSocket() {
  const socketRef = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem('feedingus_token')
    if (!token) return

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    socket.on('connect', () => {
      console.log('⚡ Socket.io connected:', socket.id)
    })

    socket.on('connect_error', (err) => {
      console.warn('Socket.io connection error:', err.message)
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  return socketRef.current
}
