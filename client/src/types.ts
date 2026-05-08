export interface Prompt {
  id: string
  title: string
  text: string
  category: string
  createdAt: number
  imagePath?: string
}

export interface Category {
  id: string
  name: string
}
