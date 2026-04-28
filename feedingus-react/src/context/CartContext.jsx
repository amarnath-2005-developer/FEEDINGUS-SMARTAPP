import { createContext, useContext, useState, useCallback } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cart, setCart] = useState([])           // [{ item, quantity }]
  const [restaurantId, setRestaurantId] = useState(null)
  const [restaurantName, setRestaurantName] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const addToCart = useCallback((item) => {
    const rid = item.restaurantId?._id || item.restaurantId
    const rname = item.restaurantId?.restaurantName || ''

    // Enforce single-restaurant cart
    setCart(prev => {
      if (prev.length > 0 && restaurantId && rid !== restaurantId) {
        // Different restaurant — replace cart
        setRestaurantId(rid)
        setRestaurantName(rname)
        return [{ item, quantity: 1 }]
      }
      setRestaurantId(rid)
      setRestaurantName(rname)
      const existing = prev.find(e => e.item._id === item._id)
      if (existing) {
        return prev.map(e => e.item._id === item._id ? { ...e, quantity: e.quantity + 1 } : e)
      }
      return [...prev, { item, quantity: 1 }]
    })
    setIsOpen(true)
  }, [restaurantId])

  const removeFromCart = useCallback((itemId) => {
    setCart(prev => {
      const next = prev.map(e => e.item._id === itemId ? { ...e, quantity: e.quantity - 1 } : e)
                       .filter(e => e.quantity > 0)
      if (next.length === 0) { setRestaurantId(null); setRestaurantName('') }
      return next
    })
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    setRestaurantId(null)
    setRestaurantName('')
  }, [])

  const totalItems = cart.reduce((s, e) => s + e.quantity, 0)
  const subtotal   = +cart.reduce((s, e) => s + e.item.price * e.quantity, 0).toFixed(2)

  return (
    <CartContext.Provider value={{
      cart, restaurantId, restaurantName,
      isOpen, setIsOpen,
      addToCart, removeFromCart, clearCart,
      totalItems, subtotal,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be inside CartProvider')
  return ctx
}
