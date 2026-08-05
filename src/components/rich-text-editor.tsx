import { useRef, useEffect } from 'react'
import { storageService } from '@/services/storage'
import { Button } from '@/components/ui/button'
import { Bold, Italic, Image as ImageIcon, List } from 'lucide-react'
import { toast } from 'sonner'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = '180px',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value
      }
    }
  }, [value])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const insertImageAtCursor = (url: string) => {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    const sel = window.getSelection()
    const img = document.createElement('img')
    img.src = url
    img.alt = 'Anexo'
    img.className = 'rich-text-image'
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      if (editor.contains(range.commonAncestorContainer)) {
        range.deleteContents()
        range.insertNode(img)
        range.setStartAfter(img)
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
      } else {
        editor.appendChild(img)
      }
    } else {
      editor.appendChild(img)
    }
    handleInput()
  }

  const uploadAndInsert = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    toast.info('Enviando imagem...')
    const { url, error } = await storageService.uploadImage(file)
    if (error || !url) {
      toast.error('Erro ao enviar imagem', { description: error || undefined })
      return
    }
    insertImageAtCursor(url)
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault()
        const file = items[i].getAsFile()
        if (file) uploadAndInsert(file)
        return
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(uploadAndInsert)
    e.target.value = ''
  }

  const exec = (command: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false)
    handleInput()
  }

  return (
    <div className="rounded-md border border-input focus-within:ring-2 focus-within:ring-ring overflow-hidden">
      <div className="flex items-center gap-1 border-b bg-muted/50 px-2 py-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => exec('bold')}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => exec('italic')}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => exec('insertUnorderedList')}
        >
          <List className="h-4 w-4" />
        </Button>
        <div className="mx-1 h-5 w-px bg-border" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="h-4 w-4" />
          <span className="text-xs">Anexar Imagem</span>
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        data-placeholder={placeholder || 'Escreva...'}
        className="rich-text-editor-content px-3 py-2 text-sm outline-none overflow-auto"
        style={{ minHeight }}
      />
    </div>
  )
}
