import { useCallback, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import { PromptsContext } from '@/contexts/PromptsContext'
import { queryKeys } from '@/queryKeys'
import type { Category, Prompt } from '@/types'

interface PromptData {
  prompts: Prompt[]
  categories: Category[]
}

async function fetchPromptData(): Promise<PromptData> {
  const [prompts, categories] = await Promise.all([api.getPrompts(), api.getCategories()])

  if (prompts.length === 0 && categories.length <= 1) {
    const localPrompts = JSON.parse(localStorage.getItem('prompty-prompts') || '[]') as Prompt[]
    const localCategories = JSON.parse(localStorage.getItem('prompty-categories') || '[]') as Category[]
    if (localPrompts.length > 0 || localCategories.length > 0) {
      await api.importData({ prompts: localPrompts, categories: localCategories })
      localStorage.removeItem('prompty-prompts')
      localStorage.removeItem('prompty-categories')
      const [migratedPrompts, migratedCategories] = await Promise.all([api.getPrompts(), api.getCategories()])
      return { prompts: migratedPrompts, categories: migratedCategories }
    }
  }

  return { prompts, categories }
}

export function PromptsProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const { data = { prompts: [], categories: [] }, isLoading } = useQuery({
    queryKey: queryKeys.promptData,
    queryFn: fetchPromptData,
  })

  const setPromptData = useCallback((updater: (current: PromptData) => PromptData) => {
    queryClient.setQueryData<PromptData>(queryKeys.promptData, current =>
      updater(current ?? { prompts: [], categories: [] })
    )
  }, [queryClient])

  const addPromptMutation = useMutation({
    mutationFn: ({ title, text, category }: { title: string; text: string; category: string }) =>
      api.createPrompt({ title, text, category }),
    onSuccess: prompt => {
      setPromptData(current => ({ ...current, prompts: [prompt, ...current.prompts] }))
    },
  })

  const deletePromptMutation = useMutation({
    mutationFn: api.deletePrompt,
    onSuccess: (_, id) => {
      setPromptData(current => ({ ...current, prompts: current.prompts.filter(prompt => prompt.id !== id) }))
    },
  })

  const editPromptMutation = useMutation({
    mutationFn: ({ id, title, text, category }: { id: string; title: string; text: string; category: string }) =>
      api.updatePrompt(id, { title, text, category }),
    onSuccess: prompt => {
      setPromptData(current => ({
        ...current,
        prompts: current.prompts.map(item => item.id === prompt.id ? prompt : item),
      }))
    },
  })

  const addCategoryMutation = useMutation({
    mutationFn: api.createCategory,
    onSuccess: category => {
      setPromptData(current => ({
        ...current,
        categories: [...current.categories, category].sort((a, b) => a.name.localeCompare(b.name)),
      }))
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: api.deleteCategory,
    onSuccess: async (_, id) => {
      const prompts = await api.getPrompts()
      setPromptData(current => ({
        prompts,
        categories: current.categories.filter(category => category.id !== id),
      }))
    },
  })

  const renameCategoryMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.updateCategory(id, name),
    onSuccess: (category, { id, name }) => {
      const oldName = data.categories.find(item => item.id === id)?.name
      setPromptData(current => ({
        categories: current.categories.map(item => item.id === id ? category : item),
        prompts: oldName && oldName !== name
          ? current.prompts.map(prompt => prompt.category === oldName ? { ...prompt, category: name } : prompt)
          : current.prompts,
      }))
    },
  })

  const setImageMutation = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const buffer = await file.arrayBuffer()
      await api.uploadImage(id, buffer)
      return id
    },
    onSuccess: id => {
      setPromptData(current => ({
        ...current,
        prompts: current.prompts.map(prompt =>
          prompt.id === id ? { ...prompt, imagePath: `/images/${id}.png?t=${Date.now()}` } : prompt
        ),
      }))
    },
  })

  const removeImageMutation = useMutation({
    mutationFn: api.deleteImage,
    onSuccess: (_, id) => {
      setPromptData(current => ({
        ...current,
        prompts: current.prompts.map(prompt =>
          prompt.id === id ? { ...prompt, imagePath: undefined } : prompt
        ),
      }))
    },
  })

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.promptData })
  }, [queryClient])

  return (
    <PromptsContext.Provider value={{
      prompts: data.prompts,
      categories: data.categories,
      loading: isLoading,
      addPrompt: (title, text, category) => addPromptMutation.mutateAsync({ title, text, category }),
      deletePrompt: id => deletePromptMutation.mutateAsync(id),
      editPrompt: (id, title, text, category) => { void editPromptMutation.mutateAsync({ id, title, text, category }) },
      addCategory: name => addCategoryMutation.mutateAsync(name),
      deleteCategory: id => deleteCategoryMutation.mutateAsync(id),
      renameCategory: (id, name) => renameCategoryMutation.mutateAsync({ id, name }).then(() => undefined),
      setPromptImage: (id, file) => setImageMutation.mutateAsync({ id, file }).then(() => undefined),
      removePromptImage: id => removeImageMutation.mutateAsync(id).then(() => undefined),
      refresh,
    }}>
      {children}
    </PromptsContext.Provider>
  )
}
