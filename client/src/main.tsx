import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ThemeProvider } from '@/components/ThemeProvider'
import { SocketProvider } from '@/components/SocketProvider'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="trailwatch-theme">
      <SocketProvider>
        <App />
      </SocketProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
