import { createContext, useContext } from 'react'
import type { Prompt, Category } from '@/types'

export interface PromptsContextType {
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

export const PromptsContext = createContext<PromptsContextType>(null!)

export const usePrompts = () => useContext(PromptsContext)
