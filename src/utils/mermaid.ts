// 轻量 mermaid 流程图渲染器（纯前端、零第三方依赖）
//
// 背景：Markdown 预览需要把 ```mermaid 代码块画成流程图，但引入 mermaid 库体积过大，
// 这里实现常用语法子集的解析 + SVG 绘制，足够覆盖「流程图工具」插入的图形。
//
// 支持语法：
//   graph TD | graph LR | flowchart TD | flowchart LR（TB 视作 TD，RL 视作 LR）
//   节点：A / A[矩形] / A(圆角) / A{菱形}
//   连线：--> --- -.->  以及边标签 -->|文本|
//   支持链式写法 A --> B --> C、注释 %% 开头、行尾分号
//
// 渲染策略：按最长路径分层（TD 从上到下、LR 从左到右），节点在层内均匀排布，
// 连线走正交折线并带箭头；配色统一用 currentColor + 透明度，自动适配明暗主题。

/** 流程图节点 */
export interface FlowNode {
  id: string
  label: string
  shape: 'rect' | 'round' | 'diamond'
  /** 层级（最长路径深度） */
  layer: number
  /** 同层顺序（按出现先后） */
  order: number
  w: number
  h: number
  x: number
  y: number
}

/** 流程图连线 */
export interface FlowEdge {
  from: string
  to: string
  label: string
  dashed: boolean
}

/** 解析结果 */
export interface FlowGraph {
  nodes: FlowNode[]
  edges: FlowEdge[]
  direction: 'TD' | 'LR'
}

/** 同层节点水平间距（TD） */
const GAP_X = 40
/** 同层节点垂直间距（LR） */
const GAP_Y = 26
/** 层间距（TD，自上而下） */
const LAYER_GAP_TD = 78
/** 层间距（LR，自左向右） */
const LAYER_GAP_LR = 96
/** 画布内边距 */
const PAD = 26
/** 节点最小宽度 */
const MIN_W = 92
/** 节点高度（菱形略高，容纳斜边） */
const H_RECT = 46
const H_DIAMOND = 58

/** SVG 箭头 marker 的 id 需全局唯一（同页多张流程图不能重名） */
let uid = 0

/** HTML 转义（SVG 文本节点安全） */
function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 估算文本像素宽度：中文按 14px、其余按 8px 近似，用于节点自适应宽度 */
function textWidth(label: string): number {
  let w = 0
  for (const ch of label) w += /[\u4e00-\u9fa5]/.test(ch) ? 14 : 8
  return w
}

/** 解析单个节点引用（id + 可选形状/文本） */
function parseNodeRef(seg: string): { id: string; label?: string; shape?: FlowNode['shape'] } | null {
  const m = seg.match(/^([A-Za-z_][\w-]*)\s*(?:\[([^\]]*)\]|\(([^)]*)\)|\{([^}]*)\})?$/)
  if (!m) return null
  const id = m[1]
  if (m[2] !== undefined) return { id, label: m[2], shape: 'rect' }
  if (m[3] !== undefined) return { id, label: m[3], shape: 'round' }
  if (m[4] !== undefined) return { id, label: m[4], shape: 'diamond' }
  return { id }
}

/** 解析 mermaid 文本 → 图层结构；无法解析时返回 null */
export function parseFlowchart(text: string): FlowGraph | null {
  const lines = String(text || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('%%'))

  if (!lines.length) return null

  let direction: FlowGraph['direction'] = 'TD'
  const body: string[] = []
  for (const line of lines) {
    const head = line.match(/^(?:graph|flowchart)\s+(TD|TB|LR|RL)?/i)
    if (head) {
      const d = (head[1] || 'TD').toUpperCase()
      direction = d === 'LR' || d === 'RL' ? 'LR' : 'TD'
      continue
    }
    body.push(line)
  }
  // 只有方向声明、没有节点时视为解析失败（调用方回退为代码块）
  if (!body.length) return null

  const nodes = new Map<string, FlowNode>()
  const edges: FlowEdge[] = []
  let order = 0

  /** 登记节点（已存在时仅补全文本/形状） */
  const ensureNode = (id: string, label?: string, shape?: FlowNode['shape']): FlowNode => {
    let n = nodes.get(id)
    if (!n) {
      n = { id, label: label || id, shape: shape || 'rect', layer: 0, order: order++, w: 0, h: 0, x: 0, y: 0 }
      nodes.set(id, n)
    } else {
      if (label) n.label = label
      if (shape) n.shape = shape
    }
    return n
  }

  for (const raw of body) {
    const line = raw.replace(/;\s*$/, '')
    // 按箭头切分，捕获组会一并保留在结果数组中（偶数位=节点段，奇数位=箭头）
    const parts = line.split(/(-\.->|==>|-->|---|--)/)
    let prevId = ''
    let arrow = ''
    for (let k = 0; k < parts.length; k++) {
      const seg = parts[k]
      if (k % 2 === 1) {
        arrow = seg
        continue
      }
      let segText = seg.trim()
      if (!segText) continue
      // 边标签写法：|文本| 与其后的节点同段
      let label = ''
      const lm = segText.match(/^\|([^|]*)\|\s*(.*)$/)
      if (lm) {
        label = lm[1].trim()
        segText = lm[2].trim()
      }
      const ref = parseNodeRef(segText)
      if (!ref) continue
      ensureNode(ref.id, ref.label, ref.shape)
      if (prevId) {
        edges.push({ from: prevId, to: ref.id, label, dashed: arrow.includes('.') })
      }
      prevId = ref.id
      arrow = ''
    }
  }

  if (!nodes.size) return null

  // ===== 分层：最长路径松弛（限制轮次，天然容忍环） =====
  const list = [...nodes.values()]
  const byId = new Map(list.map((n) => [n.id, n]))
  for (let round = 0; round < list.length; round++) {
    let changed = false
    for (const e of edges) {
      const f = byId.get(e.from)
      const t = byId.get(e.to)
      if (!f || !t) continue
      if (t.layer < f.layer + 1) {
        t.layer = f.layer + 1
        changed = true
      }
    }
    if (!changed) break
  }

  // ===== 尺寸：宽度按文本长度自适应 =====
  for (const n of list) {
    n.w = Math.max(MIN_W, textWidth(n.label) + 32)
    n.h = n.shape === 'diamond' ? H_DIAMOND : H_RECT
  }

  return { nodes: list, edges, direction }
}

/** 依据方向计算各节点矩形坐标（左上角为锚点） */
function layout(graph: FlowGraph): void {
  const layers = new Map<number, FlowNode[]>()
  for (const n of graph.nodes) {
    const arr = layers.get(n.layer)
    if (arr) arr.push(n)
    else layers.set(n.layer, [n])
  }
  const keys = [...layers.keys()].sort((a, b) => a - b)
  for (const k of keys) layers.get(k)!.sort((a, b) => a.order - b.order)

  if (graph.direction === 'TD') {
    // 逐层向下排布，层内水平铺开
    let y = 0
    const rowWidths: number[] = []
    const rows = keys.map((k) => layers.get(k)!)
    for (const row of rows) {
      rowWidths.push(row.reduce((s, n) => s + n.w, 0) + GAP_X * (row.length - 1))
    }
    const maxRowW = Math.max(...rowWidths)
    rows.forEach((row, ri) => {
      // 每行整体居中，保证图形左右对称
      let x = (maxRowW - rowWidths[ri]) / 2
      for (const n of row) {
        n.x = x
        n.y = y
        x += n.w + GAP_X
      }
      y += Math.max(...row.map((n) => n.h)) + LAYER_GAP_TD
    })
  } else {
    // 逐列向右排布，列内垂直铺开
    const cols = keys.map((k) => layers.get(k)!)
    const colHeights = cols.map((col) => col.reduce((s, n) => s + n.h, 0) + GAP_Y * (col.length - 1))
    const maxColH = Math.max(...colHeights)
    let x = 0
    cols.forEach((col, ci) => {
      const colW = Math.max(...col.map((n) => n.w))
      let yy = (maxColH - colHeights[ci]) / 2
      for (const n of col) {
        n.x = x + (colW - n.w) / 2
        n.y = yy
        yy += n.h + GAP_Y
      }
      x += colW + LAYER_GAP_LR
    })
  }

  // 归一化到正坐标（左上角留 PAD）
  const minX = Math.min(...graph.nodes.map((n) => n.x))
  const minY = Math.min(...graph.nodes.map((n) => n.y))
  for (const n of graph.nodes) {
    n.x += PAD - minX
    n.y += PAD - minY
  }
}

/** 节点形状对应的 SVG */
function nodeShape(n: FlowNode): string {
  const cx = n.x + n.w / 2
  const cy = n.y + n.h / 2
  const common = 'fill="currentColor" fill-opacity="0.08" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.6"'
  if (n.shape === 'diamond') {
    const pts = `${cx},${n.y} ${n.x + n.w},${cy} ${cx},${n.y + n.h} ${n.x},${cy}`
    return `<polygon points="${pts}" ${common} />`
  }
  const r = n.shape === 'round' ? n.h / 2 : 10
  return `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="${r}" ry="${r}" ${common} />`
}

/** 连线路径：TD 走上下折线，LR 走左右折线 */
function edgePath(from: FlowNode, to: FlowNode, direction: FlowGraph['direction']): { d: string; lx: number; ly: number } {
  if (direction === 'TD') {
    const sx = from.x + from.w / 2
    const sy = from.y + from.h
    const tx = to.x + to.w / 2
    const ty = to.y
    const mid = sy + (ty - sy) / 2
    return { d: `M ${sx} ${sy} V ${mid} H ${tx} V ${ty}`, lx: tx, ly: mid }
  }
  const sx = from.x + from.w
  const sy = from.y + from.h / 2
  const tx = to.x
  const ty = to.y + to.h / 2
  const mid = sx + (tx - sx) / 2
  return { d: `M ${sx} ${sy} H ${mid} V ${ty} H ${tx}`, lx: mid, ly: ty }
}

/** 渲染为 SVG 字符串；解析失败返回 ''（调用方回退为普通代码块） */
export function renderMermaidSvg(text: string): string {
  const graph = parseFlowchart(text)
  if (!graph || !graph.nodes.length) return ''

  layout(graph)
  const byId = new Map(graph.nodes.map((n) => [n.id, n]))
  const width = Math.max(...graph.nodes.map((n) => n.x + n.w)) + PAD
  const height = Math.max(...graph.nodes.map((n) => n.y + n.h)) + PAD
  const markerId = `qm-flow-arrow-${++uid}`

  const edgeSvg: string[] = []
  for (const e of graph.edges) {
    const from = byId.get(e.from)
    const to = byId.get(e.to)
    if (!from || !to) continue
    const { d, lx, ly } = edgePath(from, to, graph.direction)
    edgeSvg.push(
      `<path d="${d}" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.6"` +
        `${e.dashed ? ' stroke-dasharray="5 4"' : ''} marker-end="url(#${markerId})" />`
    )
    if (e.label) {
      // 标签白底衬垫，避免压在连线上难以辨认
      const w = textWidth(e.label) + 12
      edgeSvg.push(
        `<rect x="${lx - w / 2}" y="${ly - 10}" width="${w}" height="20" rx="6" fill="currentColor" fill-opacity="0.08" />`,
        `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="central" font-size="11" fill="currentColor" fill-opacity="0.85">${esc(e.label)}</text>`
      )
    }
  }

  const nodeSvg = graph.nodes.map((n) => {
    const cx = n.x + n.w / 2
    const cy = n.y + n.h / 2
    return (
      nodeShape(n) +
      `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="13" font-weight="500" fill="currentColor">${esc(n.label)}</text>`
    )
  })

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="流程图">` +
    `<defs><marker id="${markerId}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">` +
    `<path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" fill-opacity="0.6" /></marker></defs>` +
    edgeSvg.join('') +
    nodeSvg.join('') +
    `</svg>`
  )
}
