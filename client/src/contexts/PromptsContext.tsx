import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { Prompt, Category } from '@/types'
import { api } from '@/api'

interface PromptsContextType {
  prompts: Prompt[]
  categories: Category[]
  loading: boolean
  addPrompt: (title: string, text: string, category: string) => Promise<Prompt>
  deletePrompt: (id: string) => Promise<void>
  editPrompt: (id: string, title: string, text: string, category: string) => void
  addCategory: (name: string) => Promise<Category>
  deleteCategory: (id: string) => Promise<void>
  renameCategory: (id: string, name: string) => Promise<void>
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

  const addPrompt = useCallback(async (title: string, text: string, category: string): Promise<Prompt> => {
    const newPrompt = await api.createPrompt({ title, text, category })
    setPrompts(prev => [newPrompt, ...prev])
    return newPrompt
  }, [])

  const deletePrompt = useCallback(async (id: string) => {
    await api.deletePrompt(id)
    setPrompts(prev => prev.filter(p => p.id !== id))
  }, [])

  const editPrompt = useCallback(async (id: string, title: string, text: string, category: string) => {
    await api.updatePrompt(id, { title, text, category })
    setPrompts(prev => prev.map(p => p.id === id ? { ...p, title, text, category } : p))
  }, [])

  const addCategory = useCallback(async (name: string): Promise<Category> => {
    const newCat = await api.createCategory(name)
    setCategories(prev => [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name)))
    return newCat
  }, [])

  const deleteCategory = useCallback(async (id: string) => {
    await api.deleteCategory(id)
    setCategories(prev => prev.filter(c => c.id !== id))
    // Refresh prompts since they may have been reassigned
    const p = await api.getPrompts()
    setPrompts(p)
  }, [])

  const renameCategory = useCallback(async (id: string, name: string) => {
    const oldName = categories.find(c => c.id === id)?.name
    await api.updateCategory(id, name)
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c))
    // Server cascades the rename to prompts.category — mirror that locally
    // so the UI doesn't show stale category labels until the next refresh.
    if (oldName && oldName !== name) {
      setPrompts(prev => prev.map(p => p.category === oldName ? { ...p, category: name } : p))
    }
  }, [categories])

  const setPromptImage = useCallback(async (id: string, file: File) => {
    const buffer = await file.arrayBuffer()
    await api.uploadImage(id, buffer)
    setPrompts(prev => prev.map(p => p.id === id ? { ...p, imagePath: `/images/${id}.png?t=${Date.now()}` } : p))
  }, [])

  const removePromptImage = useCallback(async (id: string) => {
    await api.deleteImage(id)
    setPrompts(prev => prev.map(p => p.id === id ? { ...p, imagePath: undefined } : p))
  }, [])

  return (
    <PromptsContext.Provider value={{ prompts, categories, loading, addPrompt, deletePrompt, editPrompt, addCategory, deleteCategory, renameCategory, setPromptImage, removePromptImage, refresh: fetchAll }}>
      {children}
    </PromptsContext.Provider>
  )
}

export const usePrompts = () => useContext(PromptsContext)
