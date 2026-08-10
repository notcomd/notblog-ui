// 轻量 Markdown 渲染器（工作台用）
// 安全策略：所有文本节点先 HTML 转义再包标签，杜绝 XSS；
// 仅支持写作常用语法：标题/粗体/斜体/删除线/行内代码/代码块/引用/列表/链接/图片/表格/分隔线。

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// 行内语法：**粗体** *斜体* ~~删除线~~ `代码` [链接](url) ![图片](url)
function renderInline(text) {
  let t = escapeHtml(text)
  // 图片
  t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, (m, alt, url, title) => {
    const ttl = title ? ` title="${title}"` : ''
    return `<img src="${url}" alt="${alt}"${ttl} class="rounded-[5%] my-1 max-w-full">`
  })
  // 链接（url 已转义，只允许 http/https/mailto 防伪协议）
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text, url) => {
    const safe = /^(https?:|mailto:|#)/.test(url) ? url : '#'
    return `<a href="${safe}" target="_blank" rel="noopener" class="text-blue-500 hover:underline">${text}</a>`
  })
  // 粗体
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  // 斜体
  t = t.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
  // 删除线
  t = t.replace(/~~([^~]+)~~/g, '<del>$1</del>')
  // 行内代码
  t = t.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded-[5%] bg-zinc-200/80 dark:bg-zinc-700/60 text-[0.85em] font-mono">$1</code>')
  // @提及
  t = t.replace(/@([一-龥\w-]{2,20})/g, '<span class="text-blue-500">@$1</span>')
  return t
}

// 渲染表格行
function renderTableRow(line, isHeader) {
  const cells = line.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())
  const tag = isHeader ? 'th' : 'td'
  return '<tr>' + cells.map(c => `<${tag} class="px-3 py-2 border border-zinc-200 dark:border-zinc-700 ${isHeader ? 'bg-zinc-100 dark:bg-zinc-800 font-medium' : ''}">${renderInline(c)}</${tag}>`).join('') + '</tr>'
}

// 主渲染：Markdown → 安全 HTML
export function renderMarkdown(md) {
  if (!md) return ''
  const lines = String(md).replace(/\r\n/g, '\n').split('\n')
  const out = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // 空行
    if (/^\s*$/.test(line)) { i++; continue }

    // 代码块
    if (/^```/.test(line.trim())) {
      const lang = line.trim().slice(3).trim()
      const buf = []
      i++
      while (i < lines.length && !/^```/.test(lines[i].trim())) { buf.push(lines[i]); i++ }
      i++ // 跳过结尾 ```
      out.push(`<pre class="my-2 px-4 py-3 rounded-[5%] bg-zinc-900 dark:bg-zinc-950 text-zinc-100 text-[13px] leading-relaxed overflow-x-auto font-mono"><code${lang ? ` class="language-${escapeHtml(lang)}"` : ''}>${escapeHtml(buf.join('\n'))}</code></pre>`)
      continue
    }

    // 标题
    const h = line.match(/^(#{1,6})\s+(.*)/)
    if (h) {
      const level = h[1].length
      const size = { 1: 'text-2xl', 2: 'text-xl', 3: 'text-lg', 4: 'text-base', 5: 'text-sm', 6: 'text-sm' }[level]
      out.push(`<h${level} class="${size} font-bold my-2.5 text-zinc-800 dark:text-zinc-100">${renderInline(h[2])}</h${level}>`)
      i++
      continue
    }

    // 分隔线
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      out.push('<hr class="my-4 border-zinc-200 dark:border-zinc-700">')
      i++
      continue
    }

    // 表格（检测下一行是否为分隔行）
    if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|?[\s:-]+\|/.test(lines[i + 1])) {
      const buf = [line]
      i++
      while (i < lines.length && /^\s*\|/.test(lines[i]) && !/^\s*\|?[\s:-]+\|\s*$/.test(lines[i])) { buf.push(lines[i]); i++ }
      const header = buf[0]
      const body = buf.slice(2)
      let html = '<div class="my-2 overflow-x-auto"><table class="w-full text-sm border-collapse">'
      html += '<thead>' + renderTableRow(header, true) + '</thead>'
      if (body.length) html += '<tbody>' + body.map(b => renderTableRow(b, false)).join('') + '</tbody>'
      html += '</table></div>'
      out.push(html)
      continue
    }

    // 引用块（连续 > 行）
    if (/^\s*>/.test(line)) {
      const buf = []
      while (i < lines.length && /^\s*>/.test(lines[i])) { buf.push(lines[i].replace(/^\s*>\s?/, '')); i++ }
      out.push(`<blockquote class="my-2 px-4 py-2.5 border-l-4 border-amber-400/70 bg-amber-400/10 rounded-r-[5%] text-zinc-600 dark:text-zinc-300">${renderInline(buf.join('<br>'))}</blockquote>`)
      continue
    }

    // 无序列表（连续项）
    if (/^\s*[-*+]\s+/.test(line)) {
      const buf = []
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) { buf.push(lines[i].replace(/^\s*[-*+]\s+/, '')); i++ }
      out.push(`<ul class="my-2 space-y-1 pl-5 list-disc">${buf.map(x => `<li class="text-zinc-700 dark:text-zinc-200">${renderInline(x)}</li>`).join('')}</ul>`)
      continue
    }

    // 有序列表
    if (/^\s*\d+\.\s+/.test(line)) {
      const buf = []
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { buf.push(lines[i].replace(/^\s*\d+\.\s+/, '')); i++ }
      out.push(`<ol class="my-2 space-y-1 pl-5 list-decimal">${buf.map(x => `<li class="text-zinc-700 dark:text-zinc-200">${renderInline(x)}</li>`).join('')}</ol>`)
      continue
    }

    // 普通段落（连续非空行）
    const buf = []
    while (i < lines.length && lines[i].trim() !== '' && !/^```/.test(lines[i].trim()) && !/^(#{1,6})\s/.test(lines[i]) && !/^\s*>/.test(lines[i]) && !/^\s*[-*+]\s+/.test(lines[i]) && !/^\s*\d+\.\s+/.test(lines[i])) {
      buf.push(lines[i]); i++
    }
    out.push(`<p class="my-2 leading-[1.8] text-zinc-700 dark:text-zinc-200">${renderInline(buf.join('<br>'))}</p>`)
  }
  return out.join('\n')
}

// 检测文本是否含 Markdown 标记（详情页据此选择渲染方式）
export function looksLikeMarkdown(text) {
  if (!text) return false
  return /(^|\n)\s{0,3}(#{1,6}\s|```|>\s|[-*+]\s|\d+\.\s)|\*\*|~~|`[^`]+`|\|\s*[-:]+\s*\|/.test(text)
}
