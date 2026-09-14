// 媒体类型判定（与 PostCard / 详情页 / 个人空间共用的字段约定）
//
// 背景：后端 TweetDto 暂无 isVideo 字段，媒体地址统一放在 mediaUrls[] 中，
// 因此「是否视频」需要按文件后缀兜底识别；发布视频时 fileIds = [视频, 封面]，
// 故 mediaUrls[0] 通常是视频，但仍按后缀取第一个视频地址更稳妥。

/** 视频文件后缀（含查询串/锚点场景） */
const VIDEO_URL_RE = /\.(mp4|webm|ogg|mov|m4v|m3u8)(\?|#|$)/i

/** 判断单个媒体地址是否为视频 */
export function isVideoUrl(url: string | null | undefined): boolean {
  return !!url && VIDEO_URL_RE.test(url)
}

/**
 * 从媒体列表中挑出视频地址。
 * @param urls 媒体地址列表（后端 mediaUrls）
 * @returns 第一个视频地址；没有视频时返回空串
 */
export function pickVideoUrl(urls: Array<string | undefined> | null | undefined): string {
  if (!Array.isArray(urls)) return ''
  const found = urls.find((u): u is string => isVideoUrl(u))
  return found || ''
}

/**
 * 从媒体列表中挑出封面图地址（第一张非视频媒体）。
 *
 * 背景：发布视频时 fileIds = [视频, 封面]，后端按序生成 mediaUrls，
 * 因此 mediaUrls[0] 是视频文件本身——直接当封面塞进 <img> 必然加载失败，
 * 视频卡片就会没有封面。图片类作品媒体全是图片，取首张即原行为。
 *
 * @param urls 媒体地址列表（后端 mediaUrls）
 * @returns 封面地址；没有可用图片时返回空串，由调用方展示占位图
 */
export function pickCoverUrl(urls: Array<string | undefined> | null | undefined): string {
  if (!Array.isArray(urls)) return ''
  const found = urls.find((u): u is string => !!u && !isVideoUrl(u))
  return found || ''
}

/**
 * 判断一条动态是否为视频作品。
 * @param post 动态数据（含后端可能返回的 isVideo 与 mediaUrls）
 */
export function isVideoPost(post: { isVideo?: boolean; mediaUrls?: string[] } | null | undefined): boolean {
  if (!post) return false
  if (post.isVideo) return true
  return !!pickVideoUrl(post.mediaUrls)
}
