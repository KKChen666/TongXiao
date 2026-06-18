import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ThemeProvider } from './hooks/useTheme'
import App from './App.jsx'
import './index.css'

gsap.registerPlugin(useGSAP)
gsap.defaults({ duration: 0.5, ease: 'power2.out' })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
