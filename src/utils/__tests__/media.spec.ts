// 媒体类型判定单元测试
// 回归背景：后端 TweetDto 无 isVideo 字段，详情页曾只判断 tweet.isVideo，
// 导致视频作品被当成图文渲染（走图片轮播、无法播放）。
import { isVideoUrl, pickVideoUrl, pickCoverUrl, isVideoPost } from '../media'

describe('isVideoUrl', () => {
  it('识别常见视频后缀', () => {
    expect(isVideoUrl('https://cdn.example.com/a.mp4')).toBe(true)
    expect(isVideoUrl('https://cdn.example.com/a.webm')).toBe(true)
    expect(isVideoUrl('https://cdn.example.com/a.ogg')).toBe(true)
    expect(isVideoUrl('https://cdn.example.com/a.mov')).toBe(true)
    expect(isVideoUrl('https://cdn.example.com/a.m4v')).toBe(true)
    expect(isVideoUrl('https://cdn.example.com/hls/index.m3u8')).toBe(true)
  })

  it('兼容查询串、锚点与大写后缀', () => {
    expect(isVideoUrl('https://cdn.example.com/a.mp4?token=abc')).toBe(true)
    expect(isVideoUrl('https://cdn.example.com/a.mp4#t=10')).toBe(true)
    expect(isVideoUrl('https://cdn.example.com/a.MP4')).toBe(true)
  })

  it('图片地址与空值不判为视频', () => {
    expect(isVideoUrl('https://cdn.example.com/a.png')).toBe(false)
    expect(isVideoUrl('https://cdn.example.com/a.jpg?x=1')).toBe(false)
    expect(isVideoUrl('')).toBe(false)
    expect(isVideoUrl(null)).toBe(false)
    expect(isVideoUrl(undefined)).toBe(false)
  })

  it('不误伤文件名中带 mp4 字样的图片', () => {
    expect(isVideoUrl('https://cdn.example.com/mp4-cover.png')).toBe(false)
  })
})

describe('pickVideoUrl', () => {
  it('取列表中第一个视频地址', () => {
    expect(pickVideoUrl(['https://c/a.mp4', 'https://c/cover.png'])).toBe('https://c/a.mp4')
  })

  it('封面排在前面时仍能取到视频', () => {
    expect(pickVideoUrl(['https://c/cover.png', 'https://c/v.webm'])).toBe('https://c/v.webm')
  })

  it('无视频时返回空串', () => {
    expect(pickVideoUrl(['https://c/1.png', 'https://c/2.jpg'])).toBe('')
    expect(pickVideoUrl([])).toBe('')
    expect(pickVideoUrl(null)).toBe('')
    expect(pickVideoUrl(undefined)).toBe('')
  })
})

describe('pickCoverUrl', () => {
  it('视频作品取封面而非视频本身（本次修复点：mediaUrls = [视频, 封面]）', () => {
    expect(pickCoverUrl(['https://c/v.mp4', 'https://c/cover.png'])).toBe('https://c/cover.png')
  })

  it('图片作品取首张（与原行为一致）', () => {
    expect(pickCoverUrl(['https://c/1.png', 'https://c/2.jpg'])).toBe('https://c/1.png')
  })

  it('多张图片中跳过视频取首张图片', () => {
    expect(pickCoverUrl(['https://c/a.mp4', 'https://c/b.webm', 'https://c/c.png'])).toBe('https://c/c.png')
  })

  it('只有视频没有封面时返回空串（由调用方展示占位图，避免把视频塞进 img）', () => {
    expect(pickCoverUrl(['https://c/v.mp4'])).toBe('')
  })

  it('空值安全', () => {
    expect(pickCoverUrl([])).toBe('')
    expect(pickCoverUrl(null)).toBe('')
    expect(pickCoverUrl(undefined)).toBe('')
  })
})

describe('isVideoPost', () => {
  it('后端显式返回 isVideo 时判为视频', () => {
    expect(isVideoPost({ isVideo: true, mediaUrls: [] })).toBe(true)
  })

  it('后端无 isVideo 字段时按媒体地址兜底识别（本次修复点）', () => {
    expect(isVideoPost({ mediaUrls: ['https://c/a.mp4'] })).toBe(true)
    expect(isVideoPost({ mediaUrls: ['https://c/cover.png', 'https://c/a.mp4'] })).toBe(true)
  })

  it('纯图文作品不判为视频', () => {
    expect(isVideoPost({ mediaUrls: ['https://c/1.png', 'https://c/2.jpg'] })).toBe(false)
    expect(isVideoPost({})).toBe(false)
  })

  it('空值安全', () => {
    expect(isVideoPost(null)).toBe(false)
    expect(isVideoPost(undefined)).toBe(false)
  })
})
