import { renderMarkdown, looksLikeMarkdown } from '@/utils/markdown'

describe('markdown renderer', () => {
  test('renders headings, bold, italic and strikethrough', () => {
    const html = renderMarkdown('# 标题\n\n**加粗** *斜体* ~~删除~~')
    expect(html).toContain('<h1')
    expect(html).toContain('<strong>加粗</strong>')
    expect(html).toContain('<em>斜体</em>')
    expect(html).toContain('<del>删除</del>')
  })

  test('renders blockquote, code block and table', () => {
    const html = renderMarkdown('> 引用\n\n```js\nconst a = 1\n```\n\n| A | B |\n| --- | --- |\n| 1 | 2 |')
    expect(html).toContain('<blockquote')
    expect(html).toContain('<pre')
    expect(html).toContain('<table')
    expect(html).toContain('<tbody>')
  })

  test('escapes HTML to prevent XSS', () => {
    const html = renderMarkdown('<script>alert(1)</script> **x**')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  test('only allows safe link protocols', () => {
    const html = renderMarkdown('[bad](javascript:alert(1)) [ok](https://example.com)')
    expect(html).not.toContain('javascript:')
    expect(html).toContain('href="https://example.com"')
  })

  test('looksLikeMarkdown detects md markers', () => {
    expect(looksLikeMarkdown('# 标题')).toBe(true)
    expect(looksLikeMarkdown('**粗**')).toBe(true)
    expect(looksLikeMarkdown('普通文本')).toBe(false)
  })
})
