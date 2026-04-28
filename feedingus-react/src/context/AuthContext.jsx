import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('feedingus_token'))
  const [loading, setLoading] = useState(true)

  // On mount, restore user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('feedingus_user')
    if (savedUser && token) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [token])

  function loginUser(userData, jwtToken) {
    setUser(userData)
    setToken(jwtToken)
    localStorage.setItem('feedingus_token', jwtToken)
    localStorage.setItem('feedingus_user', JSON.stringify(userData))
  }

  function logoutUser() {
    setUser(null)
    setToken(null)
    localStorage.removeItem('feedingus_token')
    localStorage.removeItem('feedingus_user')
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, loginUser, logoutUser, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
