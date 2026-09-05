import service from '@/axios';
import { getDiscoverCircles } from '@/api/circle';
import { searchFriends } from '@/api/chat';
import { searchVideo } from '@/api/video';
import { unwrap } from '@/utils/response';

// ============================================================
// 聚合搜索：统一各类型搜索端点，归一化为 SearchItem 列表，
// 供 SearchView（搜索中心）按类型/全部渲染。只接真实端点，不伪造结果。
// ============================================================

export interface SearchItem {
  type: 'article' | 'circle' | 'friend' | 'video';
  id: string;            // 跳转主键（markdown/circle/friend 的 guid）
  title: string;         // 展示标题
  subtitle: string;      // 副标题（描述/数量/备注）
  cover?: string;        // 封面/头像 URL（可选）
  meta?: string;         // 额外信息（时间/标签等）
  raw: unknown;          // 原始 DTO，供自定义渲染
}

// ---------- 文章（Markdown）：GET /api/markdown/search?keyword&skip&take -> List<MarkdownSummaryResponse> ----------
export async function searchArticles(keyword: string, take = 20): Promise<SearchItem[]> {
  if (!keyword.trim()) return [];
  try {
    const res = await service.get('/api/markdown/search', {
      params: { keyword: keyword.trim(), skip: 0, take }
    });
    const data = unwrap(res) as any[];
    const list = Array.isArray(data) ? data : [];
    return list.map((m: any) => ({
      type: 'article' as const,
      id: m.MarkDownGuid || m.markDownGuid || '',
      title: m.Name || m.name || '未命名文章',
      subtitle: (m.Tags || []).slice(0, 3).join(' · ') || 'Markdown 长文',
      cover: m.CoverUrl || m.coverUrl || '',
      meta: m.CreateAt ? new Date(m.CreateAt).toLocaleDateString('zh-CN') : '',
      raw: m
    }));
  } catch (e) {
    console.error('搜索文章失败:', e);
    return [];
  }
}

// ---------- 社区：GET /api/circles?keyword -> PagedResult<CircleDto> ----------
export async function searchCircles(keyword: string, pageSize = 20): Promise<SearchItem[]> {
  if (!keyword.trim()) return [];
  try {
    const res = await getDiscoverCircles({ keyword: keyword.trim(), page: 1, pageSize });
    const data: any = res && res.data ? res.data : res;
    const list = data.items || data.list || (Array.isArray(data) ? data : []);
    return list.map((c: any) => ({
      type: 'circle' as const,
      id: c.circleGuid || c.CircleGuid || '',
      title: c.name || c.Name || '未命名社区',
      subtitle: `${c.memberCount ?? 0} 成员`,
      cover: c.avatarUrl || c.coverUrl || '',
      meta: c.description || '',
      raw: c
    }));
  } catch (e) {
    console.error('搜索社区失败:', e);
    return [];
  }
}

// ---------- 好友：GET /api/friends/search?searchTerm -> IEnumerable<FriendDto>（在好友中搜索） ----------
export async function searchFriendsBy(keyword: string): Promise<SearchItem[]> {
  if (!keyword.trim()) return [];
  try {
    const res = await searchFriends({ searchTerm: keyword.trim() });
    const data: any = res && res.data ? res.data : res;
    const list = Array.isArray(data) ? data : (data.items || data.list || []);
    return list.map((f: any) => ({
      type: 'friend' as const,
      id: f.FriendId || f.friendId || '',
      title: f.Remark || f.remark || f.friendName || '好友',
      subtitle: '好友',
      cover: '',
      meta: (f.IsBlocked ? '已拉黑 · ' : '') + (f.FriendGroupName || ''),
      raw: f
    }));
  } catch (e) {
    console.error('搜索好友失败:', e);
    return [];
  }
}

// ---------- 视频：GET /api/video/blurred/{videoName} -> VideoResult<List<Videos>> ----------
export async function searchVideos(keyword: string): Promise<SearchItem[]> {
  if (!keyword.trim()) return [];
  try {
    const res = await searchVideo(keyword.trim());
    const data: any = res && res.data ? res.data : res;
    // 兼容 VideoResult 内层 List<Videos> 的多种包裹形态
    const list = Array.isArray(data) ? data
      : (data.items || data.list || (data.data && (data.data.items || data.data.list)) || []);
    return list.map((v: any) => ({
      type: 'video' as const,
      id: v.VideoGuid || v.videoGuid || '',
      title: v.VideoName || v.videoName || '未命名视频',
      subtitle: v.BriefIntroduction || v.briefIntroduction || '视频',
      cover: (v.VideoCover || v.videoCover || '').toString(),
      meta: (v.VideoTags || []).join(' · '),
      raw: v
    }));
  } catch (e) {
    console.error('搜索视频失败:', e);
    return [];
  }
}

// ---------- 全部：并行聚合各类型（每类取前 limit 条），按类型分组 ----------
export async function searchAll(keyword: string, limitPerType = 3): Promise<{ items: SearchItem[]; counts: Record<SearchItem['type'], number> }> {
  const [articles, circles, friends, videos] = await Promise.all([
    searchArticles(keyword, limitPerType),
    searchCircles(keyword, limitPerType),
    searchFriendsBy(keyword),
    searchVideos(keyword)
  ]);
  return {
    items: [...articles, ...circles, ...friends, ...videos],
    counts: { article: articles.length, circle: circles.length, friend: friends.length, video: videos.length }
  };
}
