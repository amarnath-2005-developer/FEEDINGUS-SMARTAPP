import { useAuth } from '../context/AuthContext'
import RestaurantDashboard from './RestaurantDashboard'
import UserDashboard from './UserDashboard'

export default function Dashboard() {
  const { user } = useAuth()

  // If the user registered with a restaurant name, they are a restaurant
  if (user?.restaurantName) {
    return <RestaurantDashboard />
  }

  // Otherwise they are a user / charity
  return <UserDashboard />
}
