import { memo } from 'react'
import Markdown, { type Components } from 'react-markdown'
import { IconSquare, IconSquareCheck } from '@tabler/icons-react'
import remarkGfm from 'remark-gfm'

// The page already has h1 (page) and h2 (panel), so the report's own headings start one level below.
const components: Components = {
  h1: ({ children }) => <h3>{children}</h3>,
  h2: ({ children }) => <h3>{children}</h3>,
  h3: ({ children }) => <h4>{children}</h4>,
  h4: ({ children }) => <h5>{children}</h5>,
  h5: ({ children }) => <h5>{children}</h5>,
  h6: ({ children }) => <h5>{children}</h5>,
  table: ({ children }) => (
    // Focusable so keyboard users can scroll wide tables sideways.
    <div tabIndex={0} role="region" aria-label="Tabela" className="overflow-x-auto rounded-xl border">
      <table>{children}</table>
    </div>
  ),
  pre: ({ children }) => (
    <pre tabIndex={0} role="region" aria-label="Schemat" className="overflow-x-auto rounded-xl bg-muted p-3 text-sm leading-5">
      {children}
    </pre>
  ),
  // GFM checklists come out as disabled checkboxes with no label; a read-only report needs a glyph, not a control.
  input: ({ checked }) => (
    <>
      {checked ? <IconSquareCheck aria-hidden="true" className="mr-1.5 inline size-[1.125rem] align-[-3px]" /> : <IconSquare aria-hidden="true" className="mr-1.5 inline size-[1.125rem] align-[-3px]" />}
      <span className="sr-only">{checked ? 'Zrobione: ' : 'Do zrobienia: '}</span>
    </>
  ),
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
}

/**
 * The AI writes GitHub-flavoured Markdown with a few habits that don't render as intended here:
 * `<br>` inside table cells (raw HTML stays off), `> [!NOTE]` callout markers, and box-drawing
 * "diagrams" in code blocks.
 */
export function cleanReport(markdown: string) {
  return markdown
    .replace(/```[a-z]*\s*\n([\s\S]*?[┌┐└┘├┤┬┴┼│][\s\S]*?)```/g, '')
    .replace(/^[ \t]*[┌├└│].*$/gm, '')
    .replace(/[┌┐└┘├┤┬┴┼│▼▲]/g, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/^>\s*\[!\w+\]\s*$/gm, '>')
}

/**
 * Splits on blank lines outside code fences. While streaming only the last block changes,
 * so the finished ones stay memoized instead of re-parsing ~20 KB of Markdown every frame.
 */
function toBlocks(markdown: string) {
  const blocks: string[] = []
  let open = false
  for (const part of markdown.split(/\n{2,}/)) {
    if (open) blocks[blocks.length - 1] += `\n\n${part}`
    else blocks.push(part)
    if ((part.match(/```/g)?.length ?? 0) % 2 === 1) open = !open
  }
  return blocks
}

/** Hides half-written syntax at the cut: a dangling table row and an unclosed `**`. */
function closePartial(block: string) {
  const lines = block.split('\n')
  const last = lines.at(-1) ?? ''
  if (lines.length > 1 && last.startsWith('|') && !/\|\s*$/.test(last)) lines.pop()
  const text = lines.join('\n')
  return (text.match(/\*\*/g)?.length ?? 0) % 2 === 1 ? `${text}**` : text
}

const Block = memo(function Block({ text }: { text: string }) {
  return (
    <Markdown remarkPlugins={[remarkGfm]} components={components}>
      {text}
    </Markdown>
  )
})

export function AdvisorReport({ markdown, streaming = false }: { markdown: string; streaming?: boolean }) {
  const blocks = toBlocks(cleanReport(markdown))
  return (
    <div className="flex flex-col gap-3.5 text-base leading-[1.625rem] break-words text-[#26303D] [&_blockquote]:rounded-[0.875rem] [&_blockquote]:bg-primary-soft [&_blockquote]:px-4 [&_blockquote]:py-3 [&_h3]:mt-2 [&_h3]:text-lg [&_h3]:leading-6 [&_h3]:font-[650] [&_h3]:text-foreground [&_h4]:mt-1 [&_h4]:font-[650] [&_h4]:text-foreground [&_h5]:font-semibold [&_h5]:text-foreground [&_hr]:border-border [&_li]:mt-1 [&_.task-list-item]:list-none [&_.contains-task-list]:pl-0 [&_ol]:list-decimal [&_ol]:pl-[1.375rem] [&_strong]:font-semibold [&_strong]:text-foreground [&_table]:w-full [&_table]:min-w-[36rem] [&_table]:text-sm [&_table]:leading-5 [&_td]:border-t [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_th]:bg-muted [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_ul]:list-disc [&_ul]:pl-[1.375rem] [&_a]:text-primary [&_a]:underline">
      {blocks.map((block, i) => (
        <Block key={i} text={streaming && i === blocks.length - 1 ? closePartial(block) : block} />
      ))}
    </div>
  )
}
