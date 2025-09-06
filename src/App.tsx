import React, { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Plus, Pencil, X, Search, Sparkles, Copy, Tag, Filter, Check } from '@phosphor-icons/react'
import { toast, Toaster } from 'sonner'

interface Prompt {
  id: string
  title: string
  content: string
  usage: number
  createdAt: number
  category: string
  tags: string[]
}

const CATEGORIES = [
  'Writing & Content',
  'Code & Development', 
  'Business & Marketing',
  'Education & Learning',
  'Creative & Art',
  'Research & Analysis',
  'Personal & Productivity',
  'Other'
] as const

const COMMON_TAGS = [
  'brainstorming', 'debugging', 'copywriting', 'tutorial', 'summary', 
  'analysis', 'creative', 'technical', 'planning', 'review',
  'email', 'social-media', 'documentation', 'presentation', 'strategy'
] as const

function App() {
  const [prompts, setPrompts] = useKV<Prompt[]>('prompts', [])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [newPrompt, setNewPrompt] = useState({ 
    title: '', 
    content: '', 
    category: 'Other' as string,
    tags: [] as string[]
  })
  const [newTag, setNewTag] = useState('')
  const [editingTags, setEditingTags] = useState<string[]>([])
  const [editingNewTag, setEditingNewTag] = useState('')
  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false)
  const [isEditTagPopoverOpen, setIsEditTagPopoverOpen] = useState(false)

  // Migrate existing prompts to include category and tags
  React.useEffect(() => {
    const migratedPrompts = prompts.map(prompt => ({
      ...prompt,
      category: prompt.category || 'Other',
      tags: prompt.tags || []
    }))
    
    if (JSON.stringify(prompts) !== JSON.stringify(migratedPrompts)) {
      setPrompts(migratedPrompts)
    }
  }, [prompts, setPrompts])

  // Get all unique tags from existing prompts
  const allTags = Array.from(new Set([
    ...COMMON_TAGS,
    ...prompts.flatMap(p => p.tags || [])
  ])).sort()

  const filteredPrompts = prompts
    .filter(prompt => {
      const matchesSearch = prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           prompt.content.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory
      const matchesTags = selectedTags.length === 0 || 
                         selectedTags.every(tag => (prompt.tags || []).includes(tag))
      return matchesSearch && matchesCategory && matchesTags
    })
    .sort((a, b) => b.usage - a.usage)

  const addPrompt = () => {
    if (!newPrompt.title.trim() || !newPrompt.content.trim()) {
      toast.error('Please fill in both title and content')
      return
    }

    const prompt: Prompt = {
      id: Date.now().toString(),
      title: newPrompt.title.trim(),
      content: newPrompt.content.trim(),
      category: newPrompt.category,
      tags: newPrompt.tags,
      usage: 0,
      createdAt: Date.now()
    }

    setPrompts(current => [...current, prompt])
    setNewPrompt({ title: '', content: '', category: 'Other', tags: [] })
    setIsAddModalOpen(false)
    toast.success('Prompt added successfully')
  }

  const updatePrompt = () => {
    if (!editingPrompt || !editingPrompt.title.trim() || !editingPrompt.content.trim()) {
      toast.error('Please fill in both title and content')
      return
    }

    setPrompts(current => 
      current.map(p => p.id === editingPrompt.id ? {
        ...editingPrompt,
        tags: editingTags
      } : p)
    )
    setEditingPrompt(null)
    setEditingTags([])
    toast.success('Prompt updated successfully')
  }

  const deletePrompt = (id: string) => {
    setPrompts(current => current.filter(p => p.id !== id))
    setEditingPrompt(null)
    setEditingTags([])
    toast.success('Prompt deleted')
  }

  const incrementUsage = (id: string) => {
    setPrompts(current => 
      current.map(p => p.id === id ? { ...p, usage: p.usage + 1 } : p)
    )
  }

  const copyPrompt = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('Prompt copied to clipboard')
  }

  const addTag = (tag: string, isEditing: boolean = false) => {
    if (isEditing) {
      if (!editingTags.includes(tag)) {
        setEditingTags(prev => [...prev, tag])
      }
    } else {
      if (!newPrompt.tags.includes(tag)) {
        setNewPrompt(prev => ({ ...prev, tags: [...prev.tags, tag] }))
      }
    }
  }

  const removeTag = (tag: string, isEditing: boolean = false) => {
    if (isEditing) {
      setEditingTags(prev => prev.filter(t => t !== tag))
    } else {
      setNewPrompt(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))
    }
  }

  const createNewTag = (isEditing: boolean = false) => {
    const tagValue = isEditing ? editingNewTag : newTag
    if (tagValue.trim()) {
      addTag(tagValue.trim(), isEditing)
      if (isEditing) {
        setEditingNewTag('')
        setIsEditTagPopoverOpen(false)
      } else {
        setNewTag('')
        setIsTagPopoverOpen(false)
      }
    }
  }

  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const clearFilters = () => {
    setSelectedCategory('all')
    setSelectedTags([])
    setSearchQuery('')
  }

  const UsageDroplets = ({ usage }: { usage: number }) => {
    const dropletCount = Math.min(Math.max(Math.ceil(usage / 2), 1), 5)
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: dropletCount }).map((_, i) => (
          <div key={i} className="usage-droplet" />
        ))}
      </div>
    )
  }

  const enhancePrompts = () => {
    toast.info('Navigating to prompt enhancement tool...')
  }

  const TagInput = ({ tags, onAddTag, onRemoveTag, availableTags, isEditing = false }: {
    tags: string[]
    onAddTag: (tag: string) => void
    onRemoveTag: (tag: string) => void
    availableTags: string[]
    isEditing?: boolean
  }) => {
    const [open, setOpen] = useState(false)
    const tagInputValue = isEditing ? editingNewTag : newTag
    const setTagInputValue = isEditing ? setEditingNewTag : setNewTag

    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 min-h-[2rem] p-2 border border-seafoam rounded-lg bg-card">
          {tags.map(tag => (
            <Badge key={tag} variant="secondary" className="bg-seafoam/50 text-deep-sea hover:bg-seafoam">
              {tag}
              <button
                onClick={() => onRemoveTag(tag)}
                className="ml-1 hover:text-destructive"
                type="button"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-muted-foreground">
                <Plus className="w-3 h-3 mr-1" />
                Add tag
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0 bg-card border-seafoam" align="start">
              <Command>
                <div className="flex items-center border-b border-seafoam">
                  <CommandInput 
                    placeholder="Search or create tag..." 
                    value={tagInputValue}
                    onValueChange={setTagInputValue}
                    className="border-0"
                  />
                  {tagInputValue && (
                    <Button
                      size="sm" 
                      onClick={() => createNewTag(isEditing)}
                      className="mr-2 h-7 bg-deep-sea hover:bg-deep-sea/90"
                    >
                      Create
                    </Button>
                  )}
                </div>
                <CommandList>
                  <CommandEmpty>
                    {tagInputValue ? 'Press "Create" to add this tag' : 'No tags found'}
                  </CommandEmpty>
                  <CommandGroup>
                    {availableTags
                      .filter(tag => !tags.includes(tag))
                      .filter(tag => tag.toLowerCase().includes(tagInputValue.toLowerCase()))
                      .map(tag => (
                        <CommandItem
                          key={tag}
                          onSelect={() => {
                            onAddTag(tag)
                            setOpen(false)
                          }}
                          className="cursor-pointer"
                        >
                          <Tag className="w-4 h-4 mr-2 text-aqua-current" />
                          {tag}
                        </CommandItem>
                      ))
                    }
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster 
        theme="light"
        toastOptions={{
          style: {
            background: 'var(--card)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
          },
        }}
      />
      {/* Wave-inspired header */}
      <header className="wave-header p-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-semibold text-pearl-white">Prompt Library</h1>
          <Button 
            onClick={enhancePrompts}
            variant="outline" 
            className="bg-pearl-white/90 text-deep-sea border-silver hover:bg-pearl-white hover:scale-105 transition-all duration-300"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Enhance Prompts
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Search and Filter Section */}
        <div className="space-y-4 mb-8">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-aqua-current w-5 h-5 wave-icon" />
            <Input
              placeholder="Search your prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-3 text-lg bg-card border-seafoam focus:border-aqua-current focus:ring-aqua-current rounded-xl transition-all duration-300"
            />
          </div>

          {/* Category and Tag Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-aqua-current" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48 border-seafoam focus:border-aqua-current">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-card border-seafoam">
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tag Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-4 h-4 text-aqua-current" />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="border-seafoam hover:border-aqua-current">
                    Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-card border-seafoam" align="start">
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Filter by Tags</h4>
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                      {allTags.map(tag => (
                        <Badge
                          key={tag}
                          variant={selectedTags.includes(tag) ? "default" : "outline"}
                          className={`cursor-pointer transition-colors ${
                            selectedTags.includes(tag) 
                              ? 'bg-deep-sea text-pearl-white hover:bg-deep-sea/90' 
                              : 'border-seafoam hover:border-aqua-current'
                          }`}
                          onClick={() => toggleTagFilter(tag)}
                        >
                          {selectedTags.includes(tag) && <Check className="w-3 h-3 mr-1" />}
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {(selectedCategory !== 'all' || selectedTags.length > 0) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedCategory !== 'all' || selectedTags.length > 0) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Active filters:</span>
              {selectedCategory !== 'all' && (
                <Badge variant="secondary" className="bg-aqua-current/20 text-deep-sea">
                  {selectedCategory}
                </Badge>
              )}
              {selectedTags.map(tag => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="bg-seafoam/50 text-deep-sea cursor-pointer hover:bg-destructive/20"
                  onClick={() => toggleTagFilter(tag)}
                >
                  {tag}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Prompts grid */}
        {filteredPrompts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🐋</div>
            <h3 className="text-xl font-medium text-foreground mb-2">
              {searchQuery || selectedCategory !== 'all' || selectedTags.length > 0 
                ? 'No prompts found' 
                : 'Start your prompt collection'
              }
            </h3>
            <p className="text-muted-foreground">
              {searchQuery || selectedCategory !== 'all' || selectedTags.length > 0
                ? 'Try adjusting your search terms or filters' 
                : 'Add your first prompt to get started'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrompts.map((prompt) => (
              <Card 
                key={prompt.id} 
                className={`prompt-card bg-gradient-to-br from-card to-ocean-mist/30 border-seafoam/50 cursor-pointer group ${prompt.usage > 10 ? 'shimmer' : ''}`}
                onClick={() => {
                  copyPrompt(prompt.content)
                  incrementUsage(prompt.id)
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-medium text-foreground group-hover:text-deep-sea transition-colors mb-1">
                        {prompt.title}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs border-aqua-current/50 text-aqua-current">
                        {prompt.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <UsageDroplets usage={prompt.usage} />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingPrompt(prompt)
                          setEditingTags(prompt.tags || [])
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto text-aqua-current hover:text-deep-sea"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-3 mb-4">
                    {prompt.content}
                  </p>
                  
                  {/* Tags */}
                  {prompt.tags && prompt.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {prompt.tags.slice(0, 3).map(tag => (
                        <Badge 
                          key={tag} 
                          variant="secondary" 
                          className="text-xs bg-seafoam/30 text-deep-sea"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {prompt.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs bg-seafoam/30 text-deep-sea">
                          +{prompt.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <Badge variant="secondary" className="text-xs">
                      Used {prompt.usage} times
                    </Badge>
                    <Copy className="w-4 h-4 text-silver opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Floating Action Button */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button 
              size="lg"
              className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-deep-sea hover:bg-deep-sea/90 text-pearl-white shadow-lg hover:shadow-xl ripple-effect transition-all duration-300 hover:scale-110"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-gradient-to-br from-card to-ocean-mist/30 border-seafoam">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add New Prompt</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-foreground">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter prompt title..."
                  value={newPrompt.title}
                  onChange={(e) => setNewPrompt(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1 border-seafoam focus:border-aqua-current focus:ring-aqua-current"
                />
              </div>
              
              <div>
                <Label htmlFor="category" className="text-foreground">Category</Label>
                <Select value={newPrompt.category} onValueChange={(value) => setNewPrompt(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="mt-1 border-seafoam focus:border-aqua-current">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-seafoam">
                    {CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="content" className="text-foreground">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Enter your prompt content..."
                  value={newPrompt.content}
                  onChange={(e) => setNewPrompt(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  className="mt-1 border-seafoam focus:border-aqua-current focus:ring-aqua-current resize-none"
                />
              </div>

              <div>
                <Label className="text-foreground">Tags</Label>
                <TagInput
                  tags={newPrompt.tags}
                  onAddTag={(tag) => addTag(tag)}
                  onRemoveTag={(tag) => removeTag(tag)}
                  availableTags={allTags}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={addPrompt} className="flex-1 bg-deep-sea hover:bg-deep-sea/90">
                  Add Prompt
                </Button>
                <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={!!editingPrompt} onOpenChange={() => {
          setEditingPrompt(null)
          setEditingTags([])
        }}>
          <DialogContent className="sm:max-w-md bg-gradient-to-br from-card to-ocean-mist/30 border-seafoam">
            <DialogHeader>
              <DialogTitle className="text-foreground">Edit Prompt</DialogTitle>
            </DialogHeader>
            {editingPrompt && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-title" className="text-foreground">Title</Label>
                  <Input
                    id="edit-title"
                    value={editingPrompt.title}
                    onChange={(e) => setEditingPrompt(prev => prev ? { ...prev, title: e.target.value } : null)}
                    className="mt-1 border-seafoam focus:border-aqua-current focus:ring-aqua-current"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-category" className="text-foreground">Category</Label>
                  <Select 
                    value={editingPrompt.category || 'Other'} 
                    onValueChange={(value) => setEditingPrompt(prev => prev ? { ...prev, category: value } : null)}
                  >
                    <SelectTrigger className="mt-1 border-seafoam focus:border-aqua-current">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-seafoam">
                      {CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-content" className="text-foreground">Content</Label>
                  <Textarea
                    id="edit-content"
                    value={editingPrompt.content}
                    onChange={(e) => setEditingPrompt(prev => prev ? { ...prev, content: e.target.value } : null)}
                    rows={4}
                    className="mt-1 border-seafoam focus:border-aqua-current focus:ring-aqua-current resize-none"
                  />
                </div>

                <div>
                  <Label className="text-foreground">Tags</Label>
                  <TagInput
                    tags={editingTags}
                    onAddTag={(tag) => addTag(tag, true)}
                    onRemoveTag={(tag) => removeTag(tag, true)}
                    availableTags={allTags}
                    isEditing={true}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={updatePrompt} className="flex-1 bg-deep-sea hover:bg-deep-sea/90">
                    Update
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => deletePrompt(editingPrompt.id)}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setEditingPrompt(null)
                    setEditingTags([])
                  }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}

export default App