import { RouterProvider } from 'react-router-dom'
import { AuthGate } from './auth/AuthGate'
import { router } from './router'

function App() {
  return (
    <AuthGate>
      <RouterProvider router={router} />
    </AuthGate>
  )
}

export default App
