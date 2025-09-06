import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, X, Search, Sparkles, Copy } from '@phosphor-icons/react'
import { toast, Toaster } from 'sonner'

interface Prompt {
  id: string
  title: string
  content: string
  usage: number
  createdAt: number
}

function App() {
  const [prompts, setPrompts] = useKV<Prompt[]>('prompts', [])
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [newPrompt, setNewPrompt] = useState({ title: '', content: '' })

  const filteredPrompts = prompts
    .filter(prompt => 
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
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
      usage: 0,
      createdAt: Date.now()
    }

    setPrompts(current => [...current, prompt])
    setNewPrompt({ title: '', content: '' })
    setIsAddModalOpen(false)
    toast.success('Prompt added successfully')
  }

  const updatePrompt = () => {
    if (!editingPrompt || !editingPrompt.title.trim() || !editingPrompt.content.trim()) {
      toast.error('Please fill in both title and content')
      return
    }

    setPrompts(current => 
      current.map(p => p.id === editingPrompt.id ? editingPrompt : p)
    )
    setEditingPrompt(null)
    toast.success('Prompt updated successfully')
  }

  const deletePrompt = (id: string) => {
    setPrompts(current => current.filter(p => p.id !== id))
    setEditingPrompt(null)
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
        {/* Search bar */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-aqua-current w-5 h-5 wave-icon" />
          <Input
            placeholder="Search your prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-3 text-lg bg-card border-seafoam focus:border-aqua-current focus:ring-aqua-current rounded-xl transition-all duration-300"
          />
        </div>

        {/* Prompts grid */}
        {filteredPrompts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🐋</div>
            <h3 className="text-xl font-medium text-foreground mb-2">
              {searchQuery ? 'No prompts found' : 'Start your prompt collection'}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try adjusting your search terms' : 'Add your first prompt to get started'}
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
                    <CardTitle className="text-lg font-medium text-foreground group-hover:text-deep-sea transition-colors">
                      {prompt.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <UsageDroplets usage={prompt.usage} />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingPrompt(prompt)
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
        <Dialog open={!!editingPrompt} onOpenChange={() => setEditingPrompt(null)}>
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
                  <Label htmlFor="edit-content" className="text-foreground">Content</Label>
                  <Textarea
                    id="edit-content"
                    value={editingPrompt.content}
                    onChange={(e) => setEditingPrompt(prev => prev ? { ...prev, content: e.target.value } : null)}
                    rows={4}
                    className="mt-1 border-seafoam focus:border-aqua-current focus:ring-aqua-current resize-none"
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
                  <Button variant="outline" onClick={() => setEditingPrompt(null)}>
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