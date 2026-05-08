import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { Prompt, Category } from '@/types'
import { api } from '@/api'

interface PromptsContextType {
  prompts: Prompt[]
  categories: Category[]
  loading: boolean
  addPrompt: (title: string, text: string, category: string) => Promise<Prompt | undefined>
  deletePrompt: (id: string) => void
  editPrompt: (id: string, title: string, text: string, category: string) => void
  addCategory: (name: string) => Promise<Category | undefined>
  deleteCategory: (id: string) => void
  renameCategory: (id: string, name: string) => void
  setPromptImage: (id: string, file: File) => Promise<void>
  removePromptImage: (id: string) => Promise<void>
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
        const localPrompts = JSON.parse(localStorage.getItem('prompty-prompts') || '[]')
        const localCategories = JSON.parse(localStorage.getItem('prompty-categories') || '[]')
        if (localPrompts.length > 0 || localCategories.length > 0) {
          await api.importData({ prompts: localPrompts, categories: localCategories })
          localStorage.removeItem('prompty-prompts')
          localStorage.removeItem('prompty-categories')
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

  const addPrompt = useCallback(async (title: string, text: string, category: string): Promise<Prompt | undefined> => {
    try {
      const newPrompt = await api.createPrompt({ title, text, category })
      setPrompts(prev => [newPrompt, ...prev])
      return newPrompt
    } catch (err) {
      console.error('Failed to add prompt:', err)
      return undefined
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

  const addCategory = useCallback(async (name: string): Promise<Category | undefined> => {
    try {
      const newCat = await api.createCategory(name)
      setCategories(prev => [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name)))
      return newCat
    } catch (err) {
      console.error('Failed to add category:', err)
      return undefined
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

  const setPromptImage = useCallback(async (id: string, file: File) => {
    try {
      const buffer = await file.arrayBuffer()
      await api.uploadImage(id, buffer)
      setPrompts(prev => prev.map(p => p.id === id ? { ...p, imagePath: `/images/${id}.png` } : p))
    } catch (err) {
      console.error('Failed to upload image:', err)
    }
  }, [])

  const removePromptImage = useCallback(async (id: string) => {
    try {
      await api.deleteImage(id)
      setPrompts(prev => prev.map(p => p.id === id ? { ...p, imagePath: undefined } : p))
    } catch (err) {
      console.error('Failed to remove image:', err)
    }
  }, [])

  return (
    <PromptsContext.Provider value={{ prompts, categories, loading, addPrompt, deletePrompt, editPrompt, addCategory, deleteCategory, renameCategory, setPromptImage, removePromptImage, refresh: fetchAll }}>
      {children}
    </PromptsContext.Provider>
  )
}

export const usePrompts = () => useContext(PromptsContext)
