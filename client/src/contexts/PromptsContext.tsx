import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { Prompt, Category } from '../types'
import { api } from '../api'

interface PromptsContextType {
  prompts: Prompt[]
  categories: Category[]
  loading: boolean
  addPrompt: (title: string, text: string, category: string) => void
  deletePrompt: (id: string) => void
  editPrompt: (id: string, title: string, text: string, category: string) => void
  addCategory: (name: string) => void
  deleteCategory: (id: string) => void
  renameCategory: (id: string, name: string) => void
  refresh: () => Promise<void>
}

const PromptsContext = createContext<PromptsContextType>(null!)

export function PromptsProvider({ children }: { children: ReactNode }) {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([api.getPrompts(), api.getCategories()])
      setPrompts(p)
      setCategories(c)

      // One-time migration: if server is empty but localStorage has data, push it
      if (p.length === 0 && c.length <= 1) {
        const localPrompts = JSON.parse(localStorage.getItem('promptly-prompts') || '[]')
        const localCategories = JSON.parse(localStorage.getItem('promptly-categories') || '[]')
        if (localPrompts.length > 0 || localCategories.length > 0) {
          await api.importData({ prompts: localPrompts, categories: localCategories })
          localStorage.removeItem('promptly-prompts')
          localStorage.removeItem('promptly-categories')
          const [p2, c2] = await Promise.all([api.getPrompts(), api.getCategories()])
          setPrompts(p2)
          setCategories(c2)
        }
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const addPrompt = useCallback(async (title: string, text: string, category: string) => {
    try {
      const newPrompt = await api.createPrompt({ title, text, category })
      setPrompts(prev => [newPrompt, ...prev])
    } catch (err) {
      console.error('Failed to add prompt:', err)
    }
  }, [])

  const deletePrompt = useCallback(async (id: string) => {
    try {
      await api.deletePrompt(id)
      setPrompts(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      console.error('Failed to delete prompt:', err)
    }
  }, [])

  const editPrompt = useCallback(async (id: string, title: string, text: string, category: string) => {
    try {
      await api.updatePrompt(id, { title, text, category })
      setPrompts(prev => prev.map(p => p.id === id ? { ...p, title, text, category } : p))
    } catch (err) {
      console.error('Failed to edit prompt:', err)
    }
  }, [])

  const addCategory = useCallback(async (name: string) => {
    try {
      const newCat = await api.createCategory(name)
      setCategories(prev => [...prev, newCat])
    } catch (err) {
      console.error('Failed to add category:', err)
    }
  }, [])

  const deleteCategory = useCallback(async (id: string) => {
    try {
      await api.deleteCategory(id)
      setCategories(prev => prev.filter(c => c.id !== id))
      // Refresh prompts since they may have been reassigned
      const p = await api.getPrompts()
      setPrompts(p)
    } catch (err) {
      console.error('Failed to delete category:', err)
    }
  }, [])

  const renameCategory = useCallback(async (id: string, name: string) => {
    try {
      await api.updateCategory(id, name)
      setCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c))
    } catch (err) {
      console.error('Failed to rename category:', err)
    }
  }, [])

  return (
    <PromptsContext.Provider value={{ prompts, categories, loading, addPrompt, deletePrompt, editPrompt, addCategory, deleteCategory, renameCategory, refresh: fetchAll }}>
      {children}
    </PromptsContext.Provider>
  )
}

export const usePrompts = () => useContext(PromptsContext)
