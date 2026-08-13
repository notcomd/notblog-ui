<template>
  <!-- 根容器固定视口高度（同 ChatView）：页面不滚动，左侧列表固定，右侧内容内部滚动 -->
  <div class="max-w-[1400px] mx-auto flex gap-5 h-[calc(100vh-7.5rem)]">
    <!-- ===== 左：我的频道列表（可收缩/展开，状态持久化） ===== -->
    <div class="shrink-0 flex flex-col glass-card p-3 h-full min-h-0 transition-all duration-300" :class="listCollapsed ? 'w-16' : 'w-64'">
      <!-- 左上：标题 + 收缩按钮 -->
      <div class="pb-3 flex items-center" :class="listCollapsed ? 'justify-center px-1' : 'px-2 gap-2'">
        <svg v-if="!listCollapsed" class="w-4 h-4 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21v-4m0 0V5a2 2 0 0 1 2-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 0 0-2 2z" /></svg>
        <span v-if="!listCollapsed" class="flex-1 text-sm font-semibold text-zinc-700 dark:text-zinc-200">我的频道</span>
        <button
          class="w-7 h-7 rounded-[5%] flex items-center justify-center text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors shrink-0"
          :title="listCollapsed ? '展开频道列表' : '收缩频道列表'"
          @click="toggleListCollapsed"
        >
          <svg class="w-4 h-4 transition-transform duration-300" :class="listCollapsed ? 'rotate-180' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto space-y-1 min-h-0">
        <button
          v-for="c in circles"
          :key="c.circleGuid"
          class="w-full flex items-center transition-all text-left"
          :class="[current && current.circleGuid === c.circleGuid ? 'bg-gradient-to-r from-amber-400/15 to-orange-400/10 ' : 'hover:bg-white/60 dark:hover:bg-zinc-800/60', listCollapsed ? 'justify-center p-0 rounded-none' : 'gap-2.5 px-2.5 py-2 rounded-[5%]']"
          :title="listCollapsed ? c.name : undefined"
          @click="select(c)"
        >
          <img :src="c.avatarUrl || fallback" alt="" class="rounded-[5%] object-cover border border-white/60 dark:border-white/10 shrink-0" :class="listCollapsed ? 'w-9 h-9' : 'w-10 h-10'" @error="hideImg" />
          <span v-if="!listCollapsed" class="flex-1 min-w-0">
            <span class="block text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">
              {{ c.name }}
              <span v-if="c.isSample" class="text-[10px] leading-none px-1 py-0.5 rounded-[5%] bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 align-middle">示例</span>
            </span>
            <span class="block text-xs text-zinc-400">{{ c.memberCount }} 成员</span>
          </span>
          <span v-if="c.unread && !listCollapsed" class="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
        </button>
        <div v-if="!loading && circles.length === 0" class="py-10 flex flex-col items-center gap-2 text-zinc-400">
          <div class="text-4xl">🏕️</div>
          <p class="text-xs">还没有加入任何频道</p>
        </div>
      </div>
      <!-- 底部固定：创建频道 + 加入频道（展开=横向一行；收缩=竖向排列，只显示图标） -->
      <div class="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 flex gap-2" :class="listCollapsed ? 'flex-col' : ''">
        <button class="flex items-center justify-center rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white active:scale-[0.98] transition-all" :class="listCollapsed ? 'w-full py-2.5' : 'flex-1 gap-1.5 px-2 py-2.5'" :title="listCollapsed ? '创建频道' : undefined" @click="createMode = true">
          <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
          <span v-if="!listCollapsed">创建频道</span>
        </button>
        <button class="flex items-center justify-center rounded-[5%] text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 active:scale-[0.98] transition-all" :class="listCollapsed ? 'w-full py-2.5' : 'flex-1 gap-1.5 px-2 py-2.5'" :title="listCollapsed ? '加入频道' : undefined" @click="joinOpen = true">
          <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
          <span v-if="!listCollapsed">加入频道</span>
        </button>
      </div>
    </div>

    <!-- ===== 右：频道主视窗（创建频道面板复用主视窗；内容内部滚动） ===== -->
    <div class="flex-1 min-w-0 flex flex-col min-h-0">
      <CircleCreatePanel v-if="createMode" class="glass-card" @close="createMode = false" @created="onCreated" />

      <!-- 频道管理面板（复用主视窗；基本信息 + 加入方式 + 审核 + 邀请码） -->
      <div v-else-if="manageMode" class="flex-1 min-w-0 flex flex-col min-h-0 glass-card">
        <!-- 头部：返回 + 标题 -->
        <div class="flex items-center gap-3 px-5 py-3 border-b border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
          <button class="w-9 h-9 rounded-[5%] flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors" title="返回" @click="manageMode = false">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          </button>
          <span class="text-sm font-semibold text-zinc-800 dark:text-zinc-100">频道管理</span>
        </div>

        <div class="flex-1 overflow-y-auto px-6 py-5 min-h-0 space-y-6">
          <!-- 基本信息（仅创建者可修改） -->
          <div class="space-y-3" :class="!isOwner ? 'opacity-60 pointer-events-none' : ''">
            <div class="flex items-center justify-between">
              <p class="text-xs font-medium text-zinc-400">基本信息</p>
              <span v-if="!isOwner" class="text-[10px] text-zinc-400">仅创建者可修改</span>
            </div>
            <div class="flex items-center gap-4">
              <div class="flex flex-col items-center gap-1.5">
                <div class="w-14 h-14 rounded-[5%] overflow-hidden flex items-center justify-center bg-zinc-100 dark:bg-zinc-800/60">
                  <img v-if="manageAvatar" :src="manageAvatar" alt="" class="w-full h-full object-cover" @error="hideImg" />
                  <span v-else class="text-lg font-bold text-white" :style="{ backgroundColor: '#6366f1' }">{{ (manageName.trim() || '频').charAt(0) }}</span>
                </div>
                <label class="h-7 px-2.5 rounded-[5%] bg-amber-400/15 text-amber-600 dark:text-amber-300 text-[11px] font-medium inline-flex items-center cursor-pointer hover:bg-amber-400/25 transition-colors">
                  更换头像
                  <input type="file" accept="image/*" class="hidden" @change="onManageAvatar" />
                </label>
              </div>
              <div class="flex flex-col items-center gap-1.5">
                <div class="w-24 h-14 rounded-[5%] overflow-hidden flex items-center justify-center bg-zinc-100 dark:bg-zinc-800/60">
                  <img v-if="manageCover" :src="manageCover" alt="" class="w-full h-full object-cover" @error="hideImg" />
                  <span v-else class="text-[10px] text-zinc-400">封面</span>
                </div>
                <label class="h-7 px-2.5 rounded-[5%] bg-amber-400/15 text-amber-600 dark:text-amber-300 text-[11px] font-medium inline-flex items-center cursor-pointer hover:bg-amber-400/25 transition-colors">
                  更换封面
                  <input type="file" accept="image/*,video/*" class="hidden" @change="onManageCover" />
                </label>
              </div>
            </div>
            <input v-model="manageName" maxlength="30" :disabled="!isOwner" class="w-full rounded-[5%] bg-white/60 dark:bg-zinc-800/60 border border-white/50 dark:border-white/10 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all disabled:opacity-60" placeholder="频道名称（必填）" />
            <textarea v-model="manageDesc" maxlength="100" rows="3" :disabled="!isOwner" class="w-full rounded-[5%] bg-white/60 dark:bg-zinc-800/60 border border-white/50 dark:border-white/10 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all resize-none disabled:opacity-60" placeholder="频道简介（选填）"></textarea>
          </div>

          <!-- 加入方式（仅创建者可修改） -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <p class="text-xs font-medium text-zinc-400">加入方式</p>
              <span v-if="!isOwner" class="text-[10px] text-zinc-400">仅创建者可修改</span>
            </div>
            <div class="space-y-2" :class="!isOwner ? 'opacity-60' : ''">
              <label v-for="m in JOIN_MODES" :key="m.key" class="flex items-start gap-2.5 px-3 py-2.5 rounded-[5%] border cursor-pointer transition-colors" :class="[joinMode === m.key ? 'border-amber-400/60 bg-amber-400/10' : 'border-zinc-200/60 dark:border-zinc-700/60 hover:bg-white/60 dark:hover:bg-zinc-800/60', !isOwner ? 'pointer-events-none' : '']">
                <input type="radio" :value="m.key" v-model="joinMode" class="accent-amber-500 mt-0.5" :disabled="!isOwner" />
                <span class="flex-1">
                  <span class="block text-sm font-medium text-zinc-700 dark:text-zinc-200">{{ m.label }}</span>
                  <span class="block text-xs text-zinc-400 mt-0.5">{{ m.desc }}</span>
                </span>
              </label>
            </div>
          </div>

          <!-- 审核队列（审核制频道；创建者/管理者处理） -->
          <div v-if="joinMode === 'review'">
            <p class="text-xs font-medium text-zinc-400 mb-2">加入申请（{{ joinRequests.length }}）</p>
            <div v-if="joinRequests.length === 0" class="text-xs text-zinc-400 py-6 text-center bg-white/40 dark:bg-zinc-800/40 rounded-[5%]">暂无待审核申请</div>
            <div v-else class="space-y-1">
              <div v-for="r in joinRequests" :key="r.userGuid" class="flex items-center gap-3 px-2 py-2 rounded-[5%] hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors">
                <img :src="themeAvatar((r.userName || '友').charAt(0))" alt="" class="w-9 h-9 rounded-[5%] object-cover shrink-0" />
                <span class="flex-1 min-w-0">
                  <span class="block text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">{{ r.userName }}</span>
                  <span class="block text-xs text-zinc-400">{{ new Date(r.time).toLocaleString() }}</span>
                </span>
                <div v-if="canManageUsers" class="flex gap-1.5 shrink-0">
                  <button class="h-7 px-2.5 rounded-[5%] text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors" @click="onApproveRequest(r)">通过</button>
                  <button class="h-7 px-2.5 rounded-[5%] text-[11px] font-medium text-red-500 hover:bg-red-500/10 transition-colors" @click="onRejectRequest(r)">拒绝</button>
                </div>
                <span v-else class="text-[11px] text-zinc-400 shrink-0">等待审核</span>
              </div>
            </div>
          </div>

          <!-- 邀请码 -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <p class="text-xs font-medium text-zinc-400">邀请码</p>
              <button class="h-7 px-2.5 rounded-[5%] text-[11px] font-medium bg-amber-400/15 text-amber-600 dark:text-amber-300 hover:bg-amber-400/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" :disabled="inviteGenerating || (joinMode === 'private' && !isOwner)" @click="genInviteCode">{{ inviteGenerating ? '生成中...' : '＋ 生成邀请码' }}</button>
            </div>
            <p v-if="joinMode === 'private' && !isOwner" class="text-xs text-zinc-400 py-3 text-center bg-white/40 dark:bg-zinc-800/40 rounded-[5%]">该频道为私密频道，仅创建者可邀请加入</p>
            <div v-else-if="manageInviteCodes.length === 0" class="text-xs text-zinc-400 py-3 text-center bg-white/40 dark:bg-zinc-800/40 rounded-[5%]">暂无邀请码，点击右上角生成</div>
            <div v-for="it in manageInviteCodes" :key="it.inviteGuid" class="flex items-center gap-2 px-3 py-2 rounded-[5%] bg-white/60 dark:bg-zinc-800/60 mb-1.5">
              <code class="flex-1 text-sm font-mono tracking-wider text-zinc-700 dark:text-zinc-200">{{ it.code }}</code>
              <button class="h-7 px-2.5 rounded-[5%] text-[11px] text-zinc-500 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-700/60 transition-colors" @click="copyInvite(it.code)">复制</button>
              <button class="h-7 px-2.5 rounded-[5%] text-[11px] text-red-500 hover:bg-red-500/10 transition-colors" @click="revokeInvite(it)">作废</button>
            </div>
            <p class="text-[10px] text-zinc-400 mt-2">邀请：全员可用邀请码；审核：可公开申请，创建者/管理者审核；私密：仅创建者可邀请</p>
          </div>
        </div>

        <!-- 底部按钮 -->
        <div class="px-5 py-3.5 border-t border-zinc-200/60 dark:border-zinc-700/60 flex justify-end gap-2 shrink-0">
          <button class="h-10 px-4 rounded-[5%] text-sm text-zinc-500 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors" @click="manageMode = false">取消</button>
          <button class="h-10 px-4 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium hover: active:scale-95 transition-all disabled:opacity-50" :disabled="manageSaving || !manageName.trim()" @click="saveManage">{{ manageSaving ? '保存中...' : '保存修改' }}</button>
        </div>
      </div>

      <template v-else>
      <div ref="scrollBox" data-scroll-container class="flex-1 min-h-0 overflow-y-auto">
      <div v-if="current">
      <!-- 频道卡片（固定完整展示，无自动吸顶） -->
      <div class="glass-card overflow-hidden">
        <!-- Banner 头图 -->
        <div class="h-40 relative bg-gradient-to-r from-amber-200/70 via-orange-200/60 to-emerald-200/70 dark:from-amber-500/20 dark:via-orange-500/15 dark:to-emerald-500/20 overflow-hidden">
          <img v-if="current.coverUrl && !currentCoverIsVideo" :src="current.coverUrl" alt="" class="absolute inset-0 w-full h-full object-cover opacity-25" @error="hideImg" />
          <video v-else-if="current.coverUrl" :src="current.coverUrl" autoplay muted loop playsinline class="absolute inset-0 w-full h-full object-cover opacity-25"></video>
          <img v-else-if="current.avatarUrl" :src="current.avatarUrl" alt="" class="absolute inset-0 w-full h-full object-cover opacity-25" @error="hideImg" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
        </div>

        <!-- 信息行 -->
        <div class="flex items-center gap-3 px-4 py-3">
          <img :src="current.avatarUrl || fallback" alt="" class="w-12 h-12 rounded-[5%] object-cover border border-white/60 dark:border-white/10 shrink-0" @error="hideImg" />
          <div class="flex-1 min-w-0">
            <div class="text-lg font-bold text-zinc-800 dark:text-zinc-100 truncate">{{ current.name }}</div>
            <div class="text-xs text-zinc-500 dark:text-zinc-300 truncate mt-0.5">{{ current.description }}</div>
            <div class="text-[11px] text-zinc-400 mt-1 flex items-center gap-3">
              <span>👥 {{ current.memberCount }} 成员</span>
              <span>{{ roleText }}</span>
            </div>
          </div>
          <!-- 右上操作：创建者/管理者=频道管理（改信息仅创建者）；普通成员=邀请（邀请码）+ 退出；私密模式仅创建者可邀请 -->
          <button v-if="canManageUsers && !confirmingLeave" class="px-3 h-8 rounded-[5%] text-xs font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white hover: active:scale-95 transition-all shrink-0" @click="openManage">⚙ 频道管理</button>
          <button v-if="!canManageUsers && !confirmingLeave && circleJoinMode(current.circleGuid) !== 'private'" class="px-3 h-8 rounded-[5%] text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 active:scale-95 transition-all shrink-0" title="生成邀请码" @click="genMemberInvite">邀请</button>
          <button v-if="!canManageUsers && !confirmingLeave" class="px-3 h-8 rounded-[5%] text-xs font-medium text-zinc-500 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-all shrink-0" @click="confirmingLeave = true">退出频道</button>
          <div v-else-if="!canManageUsers && confirmingLeave" class="flex items-center gap-2 shrink-0">
            <span class="text-xs text-zinc-500 dark:text-zinc-400">确定退出？</span>
            <button class="px-3 h-8 rounded-[5%] text-xs font-medium bg-red-500 text-white hover:bg-red-600 active:scale-95 transition-all" @click="doLeave">确认</button>
            <button class="px-3 h-8 rounded-[5%] text-xs font-medium text-zinc-500 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-all" @click="confirmingLeave = false">取消</button>
          </div>
        </div>

        <!-- 频道分类 tab（公告·主页·资源·成员，卡片内底部） -->
        <div class="flex items-center border-t border-zinc-200/60 dark:border-zinc-700/60 px-2">
          <button
            v-for="t in CIRCLE_TABS" :key="t.key"
            class="relative px-3 py-2 text-sm transition-colors"
            :class="circleTab === t.key ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'"
            @click="switchCircleTab(t.key)"
          >
            {{ t.label }}
            <span v-if="circleTab === t.key" class="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-amber-500"></span>
          </button>
        </div>
      </div>

      <!-- 主页：频道动态流 -->
      <div v-if="circleTab === 'home'" class="mt-4">
        <div class="flex items-center gap-2 mb-4">
          <span class="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-400/15 text-amber-600 dark:text-amber-400">当前所在频道：{{ current.name }}</span>
        </div>
        <PostGrid :loader="circleLoader" :key="current.circleGuid + '-' + gridKey" empty-text="频道里还没有内容，快来发布第一条动态吧" />
      </div>

      <!-- 公告 -->
      <div v-else-if="circleTab === 'announce'" class="mt-4">
        <div class="glass-card p-6">
          <div class="flex items-center justify-between mb-4">
            <span class="text-sm font-semibold text-zinc-700 dark:text-zinc-200">📢 频道公告</span>
            <div v-if="canManageUsers && !announceEdit" class="flex items-center gap-2">
              <button class="h-8 px-3 rounded-[5%] text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors" @click="startAnnounceEdit">编辑公告</button>
            </div>
            <div v-else-if="canManageUsers && announceEdit" class="flex items-center gap-2">
              <button class="h-8 px-3 rounded-[5%] text-xs text-zinc-500 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors" @click="announceEdit = false">取消</button>
              <button class="h-8 px-3 rounded-[5%] text-xs font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white hover: active:scale-95 transition-all" @click="saveAnnounce">保存</button>
            </div>
          </div>
          <textarea v-if="announceEdit" v-model="announceDraft" rows="8" class="w-full rounded-[5%] bg-white/60 dark:bg-zinc-800/60 border border-white/50 dark:border-white/10 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all resize-none" placeholder="填写频道公告内容..."></textarea>
          <div v-else class="space-y-2 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            <p v-for="(line, i) in (currentAnnounce() || '').split('\n')" :key="i" :class="line.trim() === '' ? 'h-2' : ''">{{ line }}</p>
            <p v-if="!currentAnnounce()" class="text-zinc-400">暂无公告</p>
          </div>
          <p class="mt-4 text-[10px] text-zinc-400">公告保存于本机（后端暂不支持公告字段）</p>
        </div>
      </div>

      <!-- 资源（聚合频道动态中的媒体） -->
      <div v-else-if="circleTab === 'resources'" class="mt-4">
        <div class="glass-card p-5">
          <div class="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-4">🗂 频道资源（{{ resources.length }}）</div>
          <div v-if="resourcesLoading" class="py-12 text-center text-xs text-zinc-400">加载中...</div>
          <div v-else-if="resources.length === 0" class="py-12 text-center text-xs text-zinc-400">暂无资源，快去主页发布带图动态吧</div>
          <div v-else class="grid grid-cols-3 sm:grid-cols-4 gap-2">
            <div v-for="(r, i) in resources" :key="i" class="aspect-square rounded-[5%] overflow-hidden bg-zinc-100 dark:bg-zinc-800/60 group">
              <img :src="r.url" :alt="'资源 ' + (i + 1)" class="w-full h-full object-cover group-hover:scale-105 transition-transform" @error="hideImg" />
            </div>
          </div>
          <p class="mt-4 text-[10px] text-zinc-400">资源来自频道动态中的媒体</p>
        </div>
      </div>

      <!-- 成员（创建者/管理者/普通成员，按角色分组；搜索框在卡片右上方） -->
      <div v-else-if="circleTab === 'members'" class="mt-4">
        <div class="glass-card p-5">
          <div class="flex items-center gap-3 mb-4">
            <span class="flex-1 text-sm font-semibold text-zinc-700 dark:text-zinc-200">👥 频道成员（{{ members.length }}）</span>
            <!-- 成员搜索框（卡片右上方；搜索当前频道内用户，结果显示在下方） -->
            <div class="relative w-52 shrink-0">
              <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input
                v-model="memberSearch"
                class="w-full h-8 pl-7 pr-7 rounded-[5%] bg-white/60 dark:bg-zinc-800/60 border border-white/50 dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-amber-400/50 transition-all placeholder:text-zinc-400"
                placeholder="搜索成员"
                @focus="ensureMembersLoaded"
              />
              <button v-if="memberSearch" class="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors" title="清空搜索" @click="memberSearch = ''">
                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          </div>
          <div v-if="membersLoading && !memberSearch" class="py-12 text-center text-xs text-zinc-400">加载中...</div>
          <!-- 搜索结果（搜索时替换分组列表，显示在搜索框下方） -->
          <div v-else-if="memberSearch" class="space-y-1">
            <div v-if="filteredMembers.length === 0" class="py-8 flex flex-col items-center gap-2 text-zinc-400">
              <div class="text-3xl">🔍</div>
              <p class="text-xs">未找到相关成员</p>
            </div>
            <div v-for="m in filteredMembers" :key="m.userGuid" class="flex items-center gap-3 px-2 py-2 rounded-[5%] hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors">
              <img :src="themeAvatar((m.nickname || '友').charAt(0))" alt="" class="w-9 h-9 rounded-[5%] object-cover shrink-0" />
              <span class="flex-1 min-w-0">
                <span class="block text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">
                  {{ m.nickname || '成员' }}
                  <span v-if="m.isMe" class="text-[10px] px-1 py-0.5 rounded-[5%] bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300">我</span>
                </span>
                <span class="block text-xs text-zinc-400">{{ m.joinTime ? new Date(m.joinTime).toLocaleDateString() : '' }}</span>
              </span>
              <span class="shrink-0 text-xs px-2 py-0.5 rounded-[5%]" :class="m.role === 'Owner' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300' : m.role === 'Admin' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'">
                {{ m.role === 'Owner' ? '创建者' : m.role === 'Admin' ? '管理者' : '成员' }}
              </span>
            </div>
          </div>
          <!-- 分组列表（无搜索时） -->
          <div v-else class="space-y-5">
            <div v-for="(group, gk) in memberGroups" :key="gk">
              <div v-if="group.length" class="text-xs font-medium text-zinc-400 mb-2">{{ gk }}（{{ group.length }}）</div>
              <div v-for="m in group" :key="m.userGuid" class="flex items-center gap-3 px-2 py-2 rounded-[5%] hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors">
                <img :src="themeAvatar((m.nickname || '友').charAt(0))" alt="" class="w-9 h-9 rounded-[5%] object-cover shrink-0" />
                <span class="flex-1 min-w-0">
                  <span class="block text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">
                    {{ m.nickname || '成员' }}
                    <span v-if="m.isMe" class="text-[10px] px-1 py-0.5 rounded-[5%] bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300">我</span>
                  </span>
                  <span class="block text-xs text-zinc-400">{{ m.joinTime ? new Date(m.joinTime).toLocaleDateString() : '' }}</span>
                </span>
                <span class="shrink-0 text-xs px-2 py-0.5 rounded-[5%]" :class="m.role === 'Owner' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300' : m.role === 'Admin' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'">
                  {{ m.role === 'Owner' ? '创建者' : m.role === 'Admin' ? '管理者' : '成员' }}
                </span>
                <!-- 管理操作：创建者可任命/取消管理员 + 移除；管理者仅可移除普通成员 -->
                <div v-if="!m.isMe && canManageUsers" class="flex items-center gap-1.5 shrink-0">
                  <button v-if="isOwner && m.role !== 'Owner'" class="h-7 px-2 rounded-[5%] text-[11px] font-medium transition-colors" :class="m.role === 'Admin' ? 'text-zinc-500 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-zinc-800/60' : 'text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'" @click="onSetRole(m, m.role === 'Admin' ? 'Member' : 'Admin')">
                    {{ m.role === 'Admin' ? '取消管理员' : '设为管理员' }}
                  </button>
                  <button v-if="(isOwner && m.role !== 'Owner') || (isAdmin && m.role === 'Member')" class="h-7 px-2 rounded-[5%] text-[11px] font-medium transition-colors" :class="confirmRemove === m.userGuid ? 'bg-red-500 text-white hover:bg-red-600' : 'text-red-500 hover:bg-red-500/10'" @click="confirmRemove === m.userGuid ? onRemoveMember(m) : confirmRemove = m.userGuid">
                    {{ confirmRemove === m.userGuid ? '确认移除' : '移除' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      <div v-else class="py-24 flex flex-col items-center gap-4">
        <div class="text-6xl">🏕️</div>
        <p class="text-zinc-500 dark:text-zinc-400">从左侧选择一个频道开始浏览</p>
      </div>
      </div>
      </template>
    </div>

    <!-- ===== 加入频道对话框（邀请码/链接） ===== -->
    <div v-if="joinOpen" class="fixed inset-0 z-[70] flex items-center justify-center bg-black/30" @click.self="joinOpen = false">
      <div class="glass-card p-6 w-96">
        <h3 class="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-4">加入频道</h3>
        <p class="text-xs text-zinc-400 mb-3">输入频道邀请码即可加入</p>
        <input
          v-model="joinInput"
          class="w-full h-11 px-4 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
          placeholder="请输入频道邀请码"
          @keyup.enter="doJoin"
        />
        <div class="flex justify-end gap-2 mt-4">
          <button class="px-4 h-10 rounded-[5%] text-sm text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-all" @click="joinOpen = false">取消</button>
          <button class="px-4 h-10 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white hover: active:scale-95 transition-all disabled:opacity-50" :disabled="!joinInput.trim() || joining" @click="doJoin">
            {{ joining ? '加入中...' : '加入频道' }}
          </button>
        </div>
        <div class="mt-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-700/60">
          <p class="text-xs text-zinc-400 mb-2">审核制频道可直接申请加入</p>
          <div class="flex gap-2">
            <input
              v-model="applyInput"
              class="flex-1 min-w-0 h-11 px-4 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
              placeholder="输入频道名称申请加入"
              @keyup.enter="doApplyJoin"
            />
            <button class="px-4 h-11 rounded-[5%] text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 active:scale-95 transition-all shrink-0" :disabled="!applyInput.trim()" @click="doApplyJoin">申请</button>
          </div>
        </div>

        <!-- ===== 收到的直邀（真实端点：GET /invitations/my + accept/reject） ===== -->
        <div class="mt-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-700/60">
          <p class="text-xs text-zinc-400 mb-2">收到的频道邀请</p>
          <div v-if="myInvites.length === 0" class="text-xs text-zinc-400 py-3 text-center bg-white/40 dark:bg-zinc-800/40 rounded-[5%]">暂无待处理的邀请</div>
          <div v-else class="space-y-1.5 max-h-44 overflow-y-auto pr-0.5">
            <div v-for="inv in myInvites" :key="inv.inviteGuid" class="flex items-center gap-2 px-3 py-2 rounded-[5%] bg-white/60 dark:bg-zinc-800/60">
              <span class="flex-1 min-w-0">
                <span class="block text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">{{ inv.circleName || '频道邀请' }}</span>
                <span class="block text-[10px] text-zinc-400">{{ inviteStatusText(inv) }}</span>
              </span>
              <template v-if="inv.status === 'Pending'">
                <button class="h-7 px-2.5 rounded-[5%] text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors disabled:opacity-40" :disabled="inviteBusy === inv.inviteGuid" @click="onAcceptInvite(inv)">接受</button>
                <button class="h-7 px-2.5 rounded-[5%] text-[11px] font-medium text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-40" :disabled="inviteBusy === inv.inviteGuid" @click="onRejectInvite(inv)">拒绝</button>
              </template>
              <span v-else class="text-[11px] text-zinc-400 shrink-0">{{ inv.status === 'Accepted' ? '✓' : '·' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 邀请码弹窗（普通成员生成邀请码后展示） ===== -->
    <div v-if="inviteCodeOpen" class="fixed inset-0 z-[70] flex items-center justify-center bg-black/30" @click.self="inviteCodeOpen = false">
      <div class="glass-card p-6 w-[400px] max-w-[calc(100vw-2rem)]">
        <div class="flex items-start justify-between mb-1">
          <h3 class="text-lg font-bold text-zinc-800 dark:text-zinc-100">频道邀请码</h3>
          <button class="w-8 h-8 rounded-[5%] flex items-center justify-center text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-colors" title="关闭" @click="inviteCodeOpen = false">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <p class="text-xs text-zinc-400 mb-4">邀请好友加入「{{ current ? current.name : '' }}」，输入邀请码即可加入</p>
        <div class="bg-white/60 dark:bg-zinc-800/60 border border-dashed border-amber-400/50 rounded-[5%] py-6 px-4 mb-4 flex flex-col items-center gap-2">
          <code class="text-2xl font-mono font-bold tracking-[0.3em] text-amber-600 dark:text-amber-300">{{ latestInviteCode }}</code>
          <span class="text-[10px] text-zinc-400">有效期 7 天</span>
        </div>
        <div class="flex justify-end gap-2">
          <button class="px-4 h-10 rounded-[5%] text-sm text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 transition-all" @click="inviteCodeOpen = false">关闭</button>
          <button class="px-4 h-10 rounded-[5%] text-sm font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white hover: active:scale-95 transition-all" @click="copyInvite(latestInviteCode)">复制邀请码</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
export default { name: 'CirclesView' }
</script>

<script setup>
import { computed, onActivated, onMounted, ref, watch } from 'vue'
import PostGrid from '@/components/post/PostGrid.vue'
import CircleCreatePanel from '@/components/circle/CircleCreatePanel.vue'
import { getMyCircles, getCircle, getCirclePosts, joinCircle, leaveCircle, getCircleMembers, setCircleMemberRole, updateCircle, uploadCircleFile, generateCircleInvitation, getCircleInvitations, revokeCircleInvitation, getMyCircleInvitations, acceptCircleInvitation, rejectCircleInvitation } from '@/api/circle'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const auth = useAuthStore()
const toast = useToastStore()

const circles = ref([])
const current = ref(null)
const loading = ref(false)
const confirmingLeave = ref(false)
const createMode = ref(false)
const joinOpen = ref(false)
const joinInput = ref('')
// ===== 收到的直邀（GET /api/circles/invitations/my；接受/拒绝真实端点） =====
const myInvites = ref([])
const inviteBusy = ref('')
const INVITE_STATUS_TEXT = { Pending: '待处理', Accepted: '已加入', Revoked: '已失效', Expired: '已过期' }
function inviteStatusText(inv) { return INVITE_STATUS_TEXT[inv.status] || inv.status || '未知' }

async function loadMyInvites() {
  if (!auth.isLoggedIn()) return
  try {
    const res = await getMyCircleInvitations({ page: 1, pageSize: 50 })
    const data = res && res.data ? res.data : res
    myInvites.value = data.items || data.list || data || []
  } catch (e) {
    myInvites.value = []
  }
}

async function onAcceptInvite(inv) {
  if (inviteBusy.value) return
  inviteBusy.value = inv.inviteGuid
  try {
    await acceptCircleInvitation(inv.inviteGuid)
    toast.push(`已加入「${inv.circleName || '频道'}」`, 'success')
    myInvites.value = myInvites.value.filter(i => i.inviteGuid !== inv.inviteGuid)
    loadCircles()
  } catch (e) {
    toast.push('接受邀请失败，请稍后重试', 'error')
  } finally {
    inviteBusy.value = ''
  }
}

async function onRejectInvite(inv) {
  if (inviteBusy.value) return
  inviteBusy.value = inv.inviteGuid
  try {
    await rejectCircleInvitation(inv.inviteGuid)
    myInvites.value = myInvites.value.filter(i => i.inviteGuid !== inv.inviteGuid)
    toast.push('已拒绝邀请', 'info')
  } catch (e) {
    toast.push('操作失败，请稍后重试', 'error')
  } finally {
    inviteBusy.value = ''
  }
}

// 打开加入弹窗时拉取收到的邀请
watch(joinOpen, open => {
  if (open) loadMyInvites()
})
// PostGrid 重建计数（keep-alive 恢复时刷新动态流）
const gridKey = ref(0)
// keep-alive 首次挂载时 onActivated 也会触发一次，用标志跳过（数据由 onMounted 加载）
let firstActivate = true
const joining = ref(false)
const fallback = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="24" fill="#fbbf24"/><text x="50" y="64" font-size="36" text-anchor="middle" fill="white">🏕</text></svg>')

// ===== 示例数据（后端离线/未加入频道时展示；isSample 标记「示例」徽标，开发展示用） =====
function demoAvatar(char, bg) {
  return 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="${bg}"/><text x="50" y="62" font-size="40" text-anchor="middle" fill="#fff" font-family="sans-serif">${char}</text></svg>`)
}

// 示例封面（SVG 渐变风景块，避免外链图片）
function demoCover(seed) {
  const palettes = [
    ['#f59e0b', '#ef4444'], ['#10b981', '#0ea5e9'], ['#6366f1', '#a855f7'],
    ['#ec4899', '#f59e0b'], ['#14b8a6', '#22c55e'], ['#3b82f6', '#8b5cf6']
  ]
  const [c1, c2] = palettes[seed % palettes.length]
  return 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 700"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs><rect width="400" height="700" fill="url(#g)"/><circle cx="300" cy="120" r="46" fill="#ffffff" opacity="0.25"/><path d="M0 480 Q 100 420 200 470 T 400 440 V 700 H 0 Z" fill="#000000" opacity="0.15"/></svg>`)
}

const DEMO_CIRCLES = [
  { circleGuid: 'demo-circle-photo', name: '轻芒摄影部落', description: '用镜头记录生活，分享光影之美', avatarUrl: demoAvatar('摄', '#6366f1'), coverUrl: '', memberCount: 128, myRole: 'Owner', unread: 3, isSample: true },
  { circleGuid: 'demo-circle-outdoor', name: '周末户外俱乐部', description: '徒步 · 露营 · 骑行，周末一起出发', avatarUrl: demoAvatar('户', '#10b981'), coverUrl: '', memberCount: 86, myRole: 'Admin', unread: 0, isSample: true },
  { circleGuid: 'demo-circle-coffee', name: '咖啡研究所', description: '手冲、拉花、烘焙，重度咖啡爱好者聚集地', avatarUrl: demoAvatar('咖', '#f59e0b'), coverUrl: '', memberCount: 210, myRole: 'Member', unread: 1, isSample: true },
  { circleGuid: 'demo-circle-frontend', name: '前端开发圈', description: 'Vue / React / 工程化，一起卷技术', avatarUrl: demoAvatar('前', '#ec4899'), coverUrl: '', memberCount: 342, myRole: 'Member', unread: 0, isSample: true }
]

// 各频道示例动态（开发展示用；与 CommunityPostDto 同构，PostCard 消费）
const DEMO_POSTS = {
  'demo-circle-photo': [
    { content: '昨晚在城市天台蹲了两个小时，终于等到云层散开。分享一组城市星空，参数：ISO 3200，f/2.8，曝光 20s。', author: { userName: '山野间', avatar: demoAvatar('山', '#10b981') }, likeCount: 23, favoriteCount: 8 },
    { content: '今天扫街的收获：雨后的老巷子，青石板上的倒影比想象中好看。构图还在摸索，欢迎指教！', author: { userName: '光影猎人', avatar: demoAvatar('光', '#6366f1') }, likeCount: 15, favoriteCount: 4 },
    { content: '新手第一次尝试胶片机，用的柯达金 200。颜色真的好温柔，感觉打开新世界大门了。', author: { userName: '胶片收藏家', avatar: demoAvatar('胶', '#f59e0b') }, likeCount: 31, favoriteCount: 12 }
  ],
  'demo-circle-outdoor': [
    { content: '周末 20 公里徒步路线分享：从山脚到云顶，全程 6 小时，风景绝了！详细攻略已更新在动态里。', author: { userName: '山野间', avatar: demoAvatar('山', '#10b981') }, likeCount: 42, favoriteCount: 17 },
    { content: '露营装备又添新成员：轻量化帐篷到了，1.2kg 双人，今晚阳台先试搭一下😄', author: { userName: '风之谷主', avatar: demoAvatar('风', '#0ea5e9') }, likeCount: 12, favoriteCount: 3 },
    { content: '骑行环湖 60 公里打卡！秋天真的适合骑车，风都是甜的。', author: { userName: '追风少年', avatar: demoAvatar('追', '#22c55e') }, likeCount: 27, favoriteCount: 6 }
  ],
  'demo-circle-coffee': [
    { content: '新豆子开箱：埃塞俄比亚耶加雪菲，浅烘。今天手冲试了 92 度水温，花香和柑橘调很明显。', author: { userName: '豆子日记', avatar: demoAvatar('豆', '#f59e0b') }, likeCount: 19, favoriteCount: 7 },
    { content: '拉花练习第 30 天，终于能拉出像样的郁金香了！附过程图。', author: { userName: '奶泡艺术家', avatar: demoAvatar('奶', '#ec4899') }, likeCount: 35, favoriteCount: 11 },
    { content: '分享一个冷萃配方：粉水比 1:12，冷藏 18 小时，夏天喝太爽了。', author: { userName: '冰滴爱好者', avatar: demoAvatar('冰', '#3b82f6') }, likeCount: 28, favoriteCount: 9 }
  ],
  'demo-circle-frontend': [
    { content: '用 Vue 3 重构了项目里的状态管理，从 8 个 store 精简到 3 个，代码量少了 40%。分享重构思路。', author: { userName: '重构狂魔', avatar: demoAvatar('重', '#6366f1') }, likeCount: 56, favoriteCount: 23 },
    { content: 'CSS 里的 :has() 选择器真的太好用了，一行代码解决了我纠结很久的布局问题。', author: { userName: '样式小白', avatar: demoAvatar('样', '#a855f7') }, likeCount: 21, favoriteCount: 5 },
    { content: '整理了这份前端性能优化清单，从资源加载到渲染路径，每一条都有实测数据支撑。', author: { userName: '性能侦探', avatar: demoAvatar('性', '#8b5cf6') }, likeCount: 44, favoriteCount: 19 }
  ]
}

function demoPosts(circle) {
  const seeds = DEMO_POSTS[circle.circleGuid] || DEMO_POSTS['demo-circle-photo']
  return seeds.map((s, i) => ({
    tweetGuid: `demo-${circle.circleGuid}-p${i}`,
    content: s.content,
    mediaUrls: [demoCover(circle.circleGuid.length + i)],
    isVideo: false,
    author: s.author,
    publishTime: Date.now() - i * 3 * 3600 * 1000,
    likeCount: s.likeCount,
    favoriteCount: s.favoriteCount,
    commentCount: 0,
    shareCount: 0,
    viewCount: 0,
    isLiked: false,
    isFavorited: false,
    isSample: true
  }))
}

// ===== 频道管理 / 分类 tab（公告·主页·资源·成员） =====
const CIRCLE_TABS = [
  { key: 'announce', label: '公告' },
  { key: 'home', label: '主页' },
  { key: 'resources', label: '资源' },
  { key: 'members', label: '成员' }
]
const circleTab = ref('home')

// 频道列表收缩/展开（状态持久化）
const listCollapsed = ref(false)
try { listCollapsed.value = localStorage.getItem('notblog-circle-list-collapsed') === '1' } catch (e) { /* 忽略 */ }
function toggleListCollapsed() {
  listCollapsed.value = !listCollapsed.value
  try { localStorage.setItem('notblog-circle-list-collapsed', listCollapsed.value ? '1' : '0') } catch (e) { /* 忽略 */ }
}

// 成员搜索（搜索当前频道内用户，结果显示在搜索框下方）
const memberSearch = ref('')
const filteredMembers = computed(() => {
  const kw = memberSearch.value.trim().toLowerCase()
  if (!kw) return []
  return members.value.filter(m => (m.nickname || '').toLowerCase().includes(kw))
})
function ensureMembersLoaded() {
  if (current.value && members.value.length === 0 && !membersLoading.value) loadMembers()
}

// 输入时自动加载成员（不依赖 focus 时序，更稳健）
watch(memberSearch, (v) => {
  if (v && v.trim() && current.value && members.value.length === 0 && !membersLoading.value) loadMembers()
})

// 主题渐变头像（amber→orange，rx=5 与全局 rounded-[5%] 一致；成员/申请统一使用）
function themeAvatar(char) {
  return 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f59e0b"/><stop offset="1" stop-color="#f97316"/></linearGradient></defs><rect width="100" height="100" rx="5" fill="url(#g)"/><text x="50" y="62" font-size="40" text-anchor="middle" fill="#fff" font-family="sans-serif">${char}</text></svg>`)
}
const members = ref([])
const membersLoading = ref(false)
const resources = ref([])
const resourcesLoading = ref(false)
const manageMode = ref(false)
const manageName = ref('')
const manageDesc = ref('')
const manageAvatar = ref('')
const manageCover = ref('')
const manageSaving = ref(false)
const announceEdit = ref(false)
const announceDraft = ref('')
const confirmRemove = ref('') // 二次确认移除的成员 userGuid

// ===== 加入方式（仅创建者可修改；后端暂无字段 → localStorage 本地持久化） =====
const JOIN_MODES = [
  { key: 'invite', label: '邀请', desc: '所有成员可使用邀请码邀请其他用户加入' },
  { key: 'private', label: '私密', desc: '仅创建者可以邀请加入，其他成员不可邀请' },
  { key: 'review', label: '审核', desc: '可公开申请加入，需创建者或管理者审核' }
]
const joinMode = ref('invite')      // invite | private | review
const joinRequests = ref([])        // 审核申请 [{ userGuid, userName, time }]
const manageInviteCodes = ref([])   // [{ inviteGuid, code }]
const inviteGenerating = ref(false)
const applyInput = ref('')          // 加入弹窗：申请加入的频道名称

function circleJoinMode(guid) {
  try {
    const v = localStorage.getItem('notblog-circle-joinmode-' + guid)
    if (v === 'invite' || v === 'private' || v === 'review') return v
  } catch (e) { /* 忽略 */ }
  // 示例频道默认：户外=审核（演示审核流），其余=邀请
  return guid === 'demo-circle-outdoor' ? 'review' : 'invite'
}

function setCircleJoinMode(guid, mode) {
  try { localStorage.setItem('notblog-circle-joinmode-' + guid, mode) } catch (e) { /* 忽略 */ }
}

function joinRequestsKey(guid) { return 'notblog-circle-joinreq-' + guid }

function loadJoinRequests() {
  const guid = current.value ? current.value.circleGuid : ''
  try {
    const v = localStorage.getItem(joinRequestsKey(guid))
    if (v) { joinRequests.value = JSON.parse(v); return }
  } catch (e) { /* 忽略 */ }
  // 示例审核频道预置申请（演示审核流）
  if (guid === 'demo-circle-outdoor') {
    joinRequests.value = [
      { userGuid: 'demo-req-1', userName: '追风少年', time: Date.now() - 3600e3 },
      { userGuid: 'demo-req-2', userName: '豆子日记', time: Date.now() - 1800e3 }
    ]
  } else {
    joinRequests.value = []
  }
}

function saveJoinRequests() {
  try {
    localStorage.setItem(joinRequestsKey(current.value.circleGuid), JSON.stringify(joinRequests.value))
  } catch (e) { /* 忽略 */ }
}

function onApproveRequest(r) {
  joinRequests.value = joinRequests.value.filter(x => x.userGuid !== r.userGuid)
  saveJoinRequests()
  toast.push(`已通过 ${r.userName} 的加入申请`, 'success')
}

function onRejectRequest(r) {
  joinRequests.value = joinRequests.value.filter(x => x.userGuid !== r.userGuid)
  saveJoinRequests()
  toast.push(`已拒绝 ${r.userName} 的加入申请`, 'info')
}

// 邀请码：demo 本地生成；真实频道走后端
function invitesKey(guid) { return 'notblog-circle-invites-' + guid }

async function loadInviteCodes() {
  const guid = current.value ? current.value.circleGuid : ''
  try {
    if (current.value.isSample) {
      const v = localStorage.getItem(invitesKey(guid))
      manageInviteCodes.value = v ? JSON.parse(v) : []
      return
    }
    const res = await getCircleInvitations(guid, { page: 1, pageSize: 20 })
    const data = res && res.data ? res.data : res
    const items = data.items || data.list || data || []
    manageInviteCodes.value = items.map(i => ({ inviteGuid: i.inviteGuid, code: i.code })).filter(i => i.code)
  } catch (e) {
    manageInviteCodes.value = []
  }
}

function saveLocalInvites() {
  try {
    localStorage.setItem(invitesKey(current.value.circleGuid), JSON.stringify(manageInviteCodes.value))
  } catch (e) { /* 忽略 */ }
}

async function genInviteCode() {
  if (inviteGenerating.value) return
  inviteGenerating.value = true
  try {
    const guid = current.value.circleGuid
    if (current.value.isSample) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
      manageInviteCodes.value.unshift({ inviteGuid: 'local-' + Date.now(), code })
      saveLocalInvites()
      toast.push('邀请码已生成', 'success')
      return
    }
    const res = await generateCircleInvitation(guid, { ttlHours: 168 })
    const d = res && res.data ? res.data : res
    if (d && d.code) {
      manageInviteCodes.value.unshift({ inviteGuid: d.inviteGuid, code: d.code })
      toast.push('邀请码已生成', 'success')
    } else {
      toast.push('生成失败，请稍后重试', 'error')
    }
  } catch (e) {
    toast.push('生成失败，请稍后重试', 'error')
  } finally {
    inviteGenerating.value = false
  }
}

async function revokeInvite(it) {
  try {
    if (current.value.isSample) {
      manageInviteCodes.value = manageInviteCodes.value.filter(x => x.inviteGuid !== it.inviteGuid)
      saveLocalInvites()
      toast.push('邀请码已作废', 'info')
      return
    }
    await revokeCircleInvitation(current.value.circleGuid, it.inviteGuid)
    manageInviteCodes.value = manageInviteCodes.value.filter(x => x.inviteGuid !== it.inviteGuid)
    toast.push('邀请码已作废', 'info')
  } catch (e) {
    toast.push('作废失败，请稍后重试', 'error')
  }
}

async function copyInvite(code) {
  try {
    await navigator.clipboard.writeText(code)
    toast.push('邀请码已复制', 'success')
  } catch (e) {
    toast.push('复制失败，请手动复制', 'error')
  }
}

// 普通成员生成邀请码（邀请/审核模式全员可用；私密模式仅创建者可邀请）
const inviteCodeOpen = ref(false)
const latestInviteCode = ref('')
async function genMemberInvite() {
  try {
    if (current.value.isSample) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      latestInviteCode.value = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
      inviteCodeOpen.value = true
      return
    }
    const res = await generateCircleInvitation(current.value.circleGuid, { ttlHours: 168 })
    const d = res && res.data ? res.data : res
    if (d && d.code) {
      latestInviteCode.value = d.code
      inviteCodeOpen.value = true
    } else {
      toast.push('生成失败，请稍后重试', 'error')
    }
  } catch (e) {
    toast.push('生成失败，请稍后重试', 'error')
  }
}

// 审核制频道申请加入（本地队列；后端暂不支持公开频道列表与审核端点）
function doApplyJoin() {
  const name = applyInput.value.trim()
  if (!name) return
  const demo = DEMO_CIRCLES.find(c => c.name === name || c.circleGuid === name)
  if (demo) {
    const mode = circleJoinMode(demo.circleGuid)
    if (mode === 'review') {
      loadJoinRequests()
      if (joinRequests.value.some(r => r.userGuid === String(auth.user ? auth.user.id : 'me'))) {
        toast.push('您已提交过申请，请等待审核', 'info')
        return
      }
      joinRequests.value.push({
        userGuid: String(auth.user ? auth.user.id : 'me'),
        userName: auth.user ? auth.user.name : '我',
        time: Date.now()
      })
      saveJoinRequests()
      applyInput.value = ''
      toast.push('已提交加入申请，等待创建者/管理者审核', 'success')
      return
    }
    if (mode === 'private') {
      toast.push('该频道为私密频道，需创建者邀请加入', 'info')
      return
    }
    toast.push('该频道使用邀请码加入，请输入邀请码', 'info')
    return
  }
  toast.push('未找到该频道（后端暂不支持公开频道列表，申请功能为演示模式）', 'info')
}

// 示例成员（后端离线时展示，含三种角色）
const DEMO_MEMBERS = [
  { userGuid: 'demo-u1', role: 'Owner', nickname: '山野间' },
  { userGuid: 'demo-u2', role: 'Admin', nickname: '风之谷主' },
  { userGuid: 'demo-u3', role: 'Admin', nickname: '光影猎人' },
  { userGuid: 'demo-u4', role: 'Member', nickname: '追风少年' },
  { userGuid: 'demo-u5', role: 'Member', nickname: '豆子日记' },
  { userGuid: 'demo-u6', role: 'Member', nickname: '重构狂魔' }
]

// 示例公告（demo 频道；真实频道公告存 localStorage，后端暂不支持公告字段）
const DEMO_ANNOUNCES = {
  'demo-circle-photo': '欢迎来到轻芒摄影部落！📷\n\n本频道专注于摄影交流：\n· 每周六晚 8 点主题摄影挑战\n· 每月评选「月度最佳作品」\n· 新人发帖请先阅读置顶指南\n\n圈主：山野间',
  'demo-circle-outdoor': '户外活动安全第一！\n\n· 徒步/骑行活动统一在公告下方报名\n· 出行前查看天气预报与路线难度\n· 垃圾请随身带走，保护自然环境\n\n本周六云顶山徒步，欢迎加入！',
  'demo-circle-coffee': '咖啡研究所欢迎你 ☕\n\n· 新手问题可以直接提问\n· 每周三晚 8 点线上手冲分享会\n· 豆子团购信息见资源区\n\n豆子日记 敬上',
  'demo-circle-frontend': '前端开发圈公告\n\n· 每周五技术分享会（轮流主讲）\n· 优质文章投稿有积分奖励\n· 提问请带最小可复现 demo\n\n共建友好技术社区 🙌'
}

const roleText = computed(() => {
  if (!current.value) return ''
  const map = { Owner: '圈主', Admin: '管理员', Member: '成员' }
  return map[current.value.myRole] || '成员'
})

// 权限：创建者可改频道信息；创建者/管理者可管理用户（任命管理员仅创建者）
const myRole = computed(() => current.value ? (current.value.myRole || 'Member') : '')
const isOwner = computed(() => myRole.value === 'Owner')
const isAdmin = computed(() => myRole.value === 'Admin')
const canManageUsers = computed(() => isOwner.value || isAdmin.value)

// 成员按角色分组（创建者/管理者/普通成员）
const memberGroups = computed(() => {
  const groups = { 创建者: [], 管理者: [], 普通成员: [] }
  members.value.forEach(m => {
    if (m.role === 'Owner') groups['创建者'].push(m)
    else if (m.role === 'Admin') groups['管理者'].push(m)
    else groups['普通成员'].push(m)
  })
  return groups
})

// 当前公告：后端字段(未来) → localStorage → 示例兜底
function currentAnnounce() {
  if (!current.value) return ''
  if (current.value.announcement) return current.value.announcement
  try {
    const a = localStorage.getItem('notblog-circle-announce-' + current.value.circleGuid)
    if (a) return a
  } catch (e) { /* 忽略 */ }
  return DEMO_ANNOUNCES[current.value.circleGuid] || ''
}

function buildDemoMembers() {
  const me = {
    userGuid: String(auth.user ? auth.user.id : 'me'),
    role: current.value.myRole || 'Member',
    nickname: auth.user ? auth.user.name : '我',
    isMe: true
  }
  return [me, ...DEMO_MEMBERS.map(m => ({ ...m }))]
}

async function loadMembers() {
  if (!current.value || membersLoading.value) return
  membersLoading.value = true
  try {
    if (current.value.isSample) {
      members.value = buildDemoMembers()
      return
    }
    const res = await getCircleMembers(current.value.circleGuid, { page: 1, pageSize: 100 })
    const data = res && res.data ? res.data : res
    members.value = data.items || data.list || data || []
  } catch (e) {
    members.value = buildDemoMembers()
  } finally {
    membersLoading.value = false
  }
}

async function loadResources() {
  if (!current.value || resourcesLoading.value) return
  resourcesLoading.value = true
  try {
    const res = await circleLoader({ page: 1, pageSize: 30 })
    const data = res && res.data ? res.data : res
    const items = data.items || data.list || []
    const seen = new Set()
    resources.value = []
    items.forEach(p => {
      (p.mediaUrls || []).forEach(u => {
        if (u && !seen.has(u)) {
          seen.add(u)
          resources.value.push({ url: u, post: p })
        }
      })
    })
  } finally {
    resourcesLoading.value = false
  }
}

function switchCircleTab(t) {
  circleTab.value = t
  if (t === 'members') loadMembers()
  else if (t === 'resources') loadResources()
  // 搜索框仅在成员 tab 显示，切走时清空
  if (t !== 'members') memberSearch.value = ''
}

// ===== 成员管理（创建者任命管理员；创建者/管理者移出成员） =====
async function onSetRole(m, role) {
  if (current.value.isSample) {
    m.role = role
    toast.push(role === 'Admin' ? `已将 ${m.nickname} 设为管理员` : `已取消 ${m.nickname} 的管理员`, 'success')
    return
  }
  try {
    await setCircleMemberRole(current.value.circleGuid, m.userGuid, role)
    m.role = role
    toast.push(role === 'Admin' ? `已将 ${m.nickname} 设为管理员` : `已取消 ${m.nickname} 的管理员`, 'success')
  } catch (e) {
    toast.push('操作失败，请稍后重试', 'error')
  }
}

async function onRemoveMember(m) {
  if (current.value.isSample) {
    members.value = members.value.filter(x => x.userGuid !== m.userGuid)
    confirmRemove.value = ''
    toast.push(`已将 ${m.nickname} 移出频道`, 'success')
    return
  }
  try {
    await leaveCircle(current.value.circleGuid, m.userGuid)
    members.value = members.value.filter(x => x.userGuid !== m.userGuid)
    confirmRemove.value = ''
    toast.push(`已将 ${m.nickname} 移出频道`, 'success')
  } catch (e) {
    toast.push('移出失败，请稍后重试', 'error')
  }
}

// ===== 频道管理面板（仅创建者可改基本信息与加入方式；管理/审核/邀请码） =====
function openManage() {
  manageName.value = current.value.name || ''
  manageDesc.value = current.value.description || ''
  manageAvatar.value = current.value.avatarUrl || ''
  manageCover.value = current.value.coverUrl || ''
  joinMode.value = circleJoinMode(current.value.circleGuid)
  loadJoinRequests()
  loadInviteCodes()
  manageMode.value = true
}

async function saveManage() {
  const name = manageName.value.trim()
  if (!name || manageSaving.value) return
  manageSaving.value = true
  try {
    if (current.value.isSample) {
      current.value.name = name
      current.value.description = manageDesc.value.trim()
      current.value.avatarUrl = manageAvatar.value
      current.value.coverUrl = manageCover.value
      toast.push('频道信息已更新（示例）', 'success')
    } else {
      await updateCircle(current.value.circleGuid, {
        name,
        description: manageDesc.value.trim() || undefined,
        avatarUrl: manageAvatar.value || undefined,
        coverUrl: manageCover.value || undefined
      })
      current.value = { ...current.value, name, description: manageDesc.value.trim(), avatarUrl: manageAvatar.value, coverUrl: manageCover.value }
      toast.push('频道信息已更新', 'success')
      loadCircles()
    }
    // 加入方式（仅创建者可修改）
    if (isOwner.value && joinMode.value !== circleJoinMode(current.value.circleGuid)) {
      setCircleJoinMode(current.value.circleGuid, joinMode.value)
      toast.push('加入方式已更新', 'success')
    }
    manageMode.value = false
  } catch (e) {
    toast.push('保存失败，请稍后重试', 'error')
  } finally {
    manageSaving.value = false
  }
}

async function onManageAvatar(e) {
  const file = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!file) return
  try {
    const res = await uploadCircleFile(file, 'circle-avatar')
    const d = res && res.data ? res.data : res
    manageAvatar.value = (d && (d.fileUri || d.url)) || manageAvatar.value
  } catch (err) {
    toast.push('头像上传失败，请稍后重试', 'error')
  }
}

async function onManageCover(e) {
  const file = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!file) return
  try {
    const res = await uploadCircleFile(file, 'circle-cover')
    const d = res && res.data ? res.data : res
    manageCover.value = (d && (d.fileUri || d.url)) || manageCover.value
  } catch (err) {
    toast.push('封面上传失败，请稍后重试', 'error')
  }
}

// ===== 公告编辑（保存于本机，后端暂不支持公告字段） =====
function startAnnounceEdit() {
  announceDraft.value = currentAnnounce()
  announceEdit.value = true
}

function saveAnnounce() {
  const text = announceDraft.value.trim()
  try {
    if (text) localStorage.setItem('notblog-circle-announce-' + current.value.circleGuid, text)
    else localStorage.removeItem('notblog-circle-announce-' + current.value.circleGuid)
  } catch (e) { /* 忽略 */ }
  announceEdit.value = false
  toast.push(text ? '公告已保存（本机）' : '公告已清除', 'success')
}

// 封面是否为视频（动态封面）
const currentCoverIsVideo = computed(() => /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test((current.value && current.value.coverUrl) || ''))

function circleLoader(params) {
  return getCirclePosts(current.value.circleGuid, params).catch(() => {
    // ⚠️ 后端离线 → 示例动态兜底（仅开发展示用）
    const items = demoPosts(current.value)
    return { data: { items, page: params.page || 1, total: items.length } }
  })
}

async function loadCircles() {
  loading.value = true
  try {
    const res = await getMyCircles()
    const data = res && res.data ? res.data : res
    circles.value = data.items || data.list || data || []
  } catch (e) {
    console.error('加载频道失败:', e)
    circles.value = []
  } finally {
    loading.value = false
  }
  // ⚠️ 后端离线/未加入任何频道 → 示例频道兜底（isSample 徽标，开发展示用）
  if (!circles.value.length) circles.value = DEMO_CIRCLES
  // 默认选中第一个
  if (circles.value.length && !current.value) {
    select(circles.value[0])
  }
}

async function select(c) {
  current.value = c
  confirmingLeave.value = false
  circleTab.value = 'home'
  members.value = []
  resources.value = []
  manageMode.value = false
  // 刷新详情（成员数/角色可能变化）
  try {
    const res = await getCircle(c.circleGuid)
    const d = res && res.data ? res.data : res
    if (d && d.circleGuid) current.value = { ...c, ...d }
  } catch (e) { /* 使用列表数据兜底 */ }
}

// 创建成功：退出面板 → 刷新列表 → 选中新频道
async function onCreated(guid) {
  createMode.value = false
  await loadCircles()
  if (guid) {
    const found = circles.value.find(c => String(c.circleGuid) === String(guid))
    if (found) select(found)
  } else if (circles.value.length && !current.value) {
    select(circles.value[0])
  }
}

async function doLeave() {
  // 示例频道：仅本地移除（无真实后端关系）
  if (current.value.isSample) {
    circles.value = circles.value.filter(c => c.circleGuid !== current.value.circleGuid)
    toast.push(`已退出频道「${current.value.name}」`, 'success')
    current.value = circles.value.length ? circles.value[0] : null
    confirmingLeave.value = false
    return
  }
  try {
    await leaveCircle(current.value.circleGuid, auth.user ? auth.user.id : '')
    circles.value = circles.value.filter(c => c.circleGuid !== current.value.circleGuid)
    toast.push(`已退出频道「${current.value.name}」`, 'success')
    current.value = circles.value.length ? circles.value[0] : null
  } catch (e) {
    toast.push('退出失败，请稍后重试', 'error')
  } finally {
    confirmingLeave.value = false
  }
}

async function doJoin() {
  const input = joinInput.value.trim()
  if (!input || joining.value) return
  joining.value = true
  try {
    // 兼容：纯邀请码 -> { code }；含 ?token= 或 /invite/xxx 的链接 -> 提取 token
    const tokenMatch = input.match(/[?&]token=([0-9a-f-]+)/i) || input.match(/\/([0-9a-f-]{36})/i)
    const payload = tokenMatch
      ? { token: tokenMatch[1] }
      : { code: input }
    await joinCircle(payload)
    toast.push('已加入频道', 'success')
    joinOpen.value = false
    joinInput.value = ''
    loadCircles()
  } catch (e) {
    // 后端业务错误经拦截器 reject(new Error(message))；HTTP 错误 body 可能为字符串
    const m = e && e.message && e.message !== 'Error' ? e.message : ''
    const d = e && e.response && typeof e.response.data === 'string' ? e.response.data : ''
    toast.push(m || d || '加入失败：邀请码无效或已过期', 'error')
  } finally {
    joining.value = false
  }
}

// keep-alive 恢复：重新拉列表 + 刷新当前频道详情与动态流（首次挂载由 onMounted 加载）
onActivated(async () => {
  if (firstActivate) {
    firstActivate = false
    return
  }
  if (createMode.value) return // 创建面板打开时无需刷新
  await loadCircles()
  if (current.value) {
    select(current.value) // 刷新详情（成员数/角色可能变化）
    gridKey.value++ // 重建 PostGrid，重新拉取动态流
  }
})

function hideImg(e) {
  e.target.style.visibility = 'hidden'
}

onMounted(loadCircles)
</script>
