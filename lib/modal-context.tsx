'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface ModalContextType {
  openModalId: string | null
  setOpenModalId: (id: string | null) => void
}

const ModalContext = createContext<ModalContextType>({
  openModalId: null,
  setOpenModalId: () => {},
})

export function ModalProvider({ children }: { children: ReactNode }) {
  const [openModalId, setOpenModalId] = useState<string | null>(null)

  return (
    <ModalContext.Provider value={{ openModalId, setOpenModalId }}>
      {children}
    </ModalContext.Provider>
  )
}

export const useModal = () => {
  const context = useContext(ModalContext)
  if (!context) {
    // Fallback se usato fuori dal provider
    return {
      openModalId: null,
      setOpenModalId: () => {},
    }
  }
  return context
}

