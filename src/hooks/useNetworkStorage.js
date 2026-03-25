import { useState, useEffect, useRef } from 'react'

export function useNetworkStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(initialValue)
  const isInitialized = useRef(false)

  // Carga inicial desde el servidor Node.js
  useEffect(() => {
    const backendUrl = `http://${window.location.hostname}:3001`
    
    fetch(`${backendUrl}/api/data?key=${key}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.value !== undefined) {
          setStoredValue(data.value)
        }
        isInitialized.current = true
      })
      .catch(err => {
        console.warn('Network Storage no disponible, usando valor por defecto:', err)
        isInitialized.current = true
      })
  }, [key])

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      
      const backendUrl = `http://${window.location.hostname}:3001`
      fetch(`${backendUrl}/api/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: valueToStore })
      }).catch(err => console.warn('Error al guardar en red:', err))
    } catch (error) {
      console.warn('Fallo interno al preparar guardado en red:', error)
    }
  }

  return [storedValue, setValue]
}
