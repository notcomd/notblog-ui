// 背景图上传压缩管线（设计规范：最大宽度 1920px、质量 0.8、WebP 转码、5MB 配额）
const MAX_WIDTH = 1920
const MAX_QUALITY = 0.8
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export function validateImageFile(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
    return { ok: false, error: '仅支持 JPG / PNG / WebP 图片' }
  }
  if (file.size > MAX_SIZE) {
    return { ok: false, error: '图片大小不能超过 5MB' }
  }
  return { ok: true }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image decode failed'))
    img.src = src
  })
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(fr.result)
    fr.onerror = () => reject(new Error('file read failed'))
    fr.readAsDataURL(file)
  })
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), 'image/webp', quality)
  })
}

// 压缩 + WebP 转码；压缩后仍超 5MB 则逐档降质量
export async function compressImage(file) {
  const dataUrl = await readAsDataURL(file)
  const img = await loadImage(dataUrl)
  const scale = Math.min(1, MAX_WIDTH / img.naturalWidth)
  const w = Math.max(1, Math.round(img.naturalWidth * scale))
  const h = Math.max(1, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, w, h)
  for (const q of [MAX_QUALITY, 0.6, 0.4]) {
    const blob = await canvasToBlob(canvas, q)
    if (blob.size <= MAX_SIZE) return { blob, width: w, height: h, quality: q }
  }
  const blob = await canvasToBlob(canvas, 0.3)
  return { blob, width: w, height: h, quality: 0.3 }
}

export function blobToDataUri(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(fr.result)
    fr.onerror = () => reject(new Error('blob read failed'))
    fr.readAsDataURL(blob)
  })
}
