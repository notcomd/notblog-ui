<template>
  <div class="max-w-[1200px] mx-auto">
    <!-- ===== 内容区（工具栏由全局 SideNav 提供：作品/收藏/我的仓库/安全） ===== -->
    <div class="space-y-5">
      <!-- ===== 主页：基本信息卡片 + 分类概览（仅本 tab 显示卡片） ===== -->
      <div v-if="activeTab === 'home'" class="space-y-5">
        <!-- 基本信息卡片（封面/头像/用户名/等级/签名/统计，仅主页 tab 显示） -->
        <UserCard
          :user="user"
          :is-self="isSelf"
          :user-info="userInfo"
          :following="following"
          @avatar-changed="onAvatarChanged"
          @cover-changed="onCoverChanged"
          @bio-changed="onBioChanged"
          @chat="onChat"
          @toggle-follow="toggleFollow"
        />

        <!-- 等级与硬币（仅自己：Message /api/user-info/me；他人无该端点） -->
        <div v-if="isSelf && userInfo" class="glass-card p-5">
          <div class="flex items-center gap-3">
            <span class="px-2 py-1 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold">Lv.{{ userInfo.level }}</span>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                <span>经验</span>
                <span v-if="isMaxLevel">已满级 · 累计 {{ userInfo.experience }} 经验</span>
                <span v-else>{{ userInfo.experience }} / {{ levelThreshold }}</span>
              </div>
              <div class="h-1.5 rounded-full bg-zinc-200/70 dark:bg-zinc-700/60 overflow-hidden">
                <div class="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300" :style="{ width: expPercent + '%' }"></div>
              </div>
            </div>
            <div class="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-200 shrink-0">
              <svg class="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.5c.5-.7 1.4-1 2.5-1s2 .3 2.5 1c.6.8.2 1.8-1.2 2.3-1.8.6-2.4 1.5-1.8 2.4.5.8 1.5 1.1 2.5 1s2-.4 2.5-1.2" /></svg>
              <span class="font-medium">{{ userInfo.coins }}</span>
              <span class="text-xs text-zinc-400">硬币</span>
            </div>
          </div>
        </div>

        <!-- ===== 作品：最近 4 个（他人主页同样显示公开作品） ===== -->
        <section class="glass-card overflow-hidden">
          <header class="flex items-center justify-between px-4 pt-3 pb-2">
            <h3 class="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
              <svg class="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" /></svg>
              作品
              <span class="text-[10px] font-normal text-zinc-400">{{ overview.posts }}</span>
            </h3>
            <button class="text-xs text-amber-500 hover:text-amber-600 transition-colors" @click="goTab('works')">全部 →</button>
          </header>
          <div class="px-4 pb-4">
            <div v-if="recentPosts.length" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div v-for="p in recentPosts" :key="p.tweetGuid" class="group cursor-pointer" @click="router.push('/posts/' + p.tweetGuid)">
                <div class="relative aspect-video rounded-[5%] overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                  <img v-if="postThumb(p)" :src="postThumb(p)" alt="" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" @error="hideImg" />
                  <div v-else class="w-full h-full flex items-center justify-center"><svg class="w-7 h-7 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
                  <span v-if="postIsVideo(p)" class="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-black/55 text-white flex items-center justify-center">
                    <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  </span>
                </div>
                <div class="text-xs text-zinc-500 dark:text-zinc-300 truncate mt-1.5">{{ postTitle(p) }}</div>
              </div>
            </div>
            <div v-else class="py-10 text-center text-sm text-zinc-400">还没有发布过作品</div>
          </div>
        </section>

        <!-- ===== 收藏：最近 4 个（仅自己，收藏为私有内容；他人隐藏） ===== -->
        <section v-if="isSelf" class="glass-card overflow-hidden">
          <header class="flex items-center justify-between px-4 pt-3 pb-2">
            <h3 class="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
              <svg class="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
              收藏
              <span class="text-[10px] font-normal text-zinc-400">{{ recentFavorites.length }}</span>
            </h3>
            <button class="text-xs text-amber-500 hover:text-amber-600 transition-colors" @click="goTab('favorites')">全部 →</button>
          </header>
          <div class="px-4 pb-4">
            <div v-if="recentFavorites.length" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div v-for="p in recentFavorites" :key="p.tweetGuid" class="group cursor-pointer" @click="router.push('/posts/' + p.tweetGuid)">
                <div class="relative aspect-video rounded-[5%] overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                  <img v-if="postThumb(p)" :src="postThumb(p)" alt="" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" @error="hideImg" />
                  <div v-else class="w-full h-full flex items-center justify-center"><svg class="w-7 h-7 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
                  <span v-if="postIsVideo(p)" class="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-black/55 text-white flex items-center justify-center">
                    <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  </span>
                </div>
                <div class="text-xs text-zinc-500 dark:text-zinc-300 truncate mt-1.5">{{ postTitle(p) }}</div>
              </div>
            </div>
            <div v-else class="py-10 text-center text-sm text-zinc-400">还没有收藏任何内容</div>
          </div>
        </section>

        <!-- ===== 仓库：最近 4 个（自己：我的仓库；他人：公开仓库） ===== -->
        <section class="glass-card overflow-hidden">
          <header class="flex items-center justify-between px-4 pt-3 pb-2">
            <h3 class="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
              <svg class="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
              {{ isSelf ? '我的仓库' : '公开仓库' }}
              <span class="text-[10px] font-normal text-zinc-400">{{ recentFiles.length }}</span>
            </h3>
            <button class="text-xs text-amber-500 hover:text-amber-600 transition-colors" @click="goTab('files')">全部 →</button>
          </header>
          <div class="px-4 pb-4">
            <div v-if="recentFiles.length" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div v-for="f in recentFiles" :key="f.fileId" class="group cursor-pointer" @click="previewFile(f)">
                <div class="relative aspect-video rounded-[5%] overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                  <img v-if="f.type === 'image'" :src="f.url" alt="" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" @error="hideImg" />
                  <video v-else-if="f.type === 'video'" :src="f.url" class="w-full h-full object-cover" muted></video>
                  <div v-else class="text-2xl"><svg class="w-7 h-7 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
                </div>
                <div class="text-xs text-zinc-500 dark:text-zinc-300 truncate mt-1.5">{{ f.name }}</div>
              </div>
            </div>
            <div v-else class="py-10 text-center text-sm text-zinc-400">{{ isSelf ? '仓库为空，去上传一些文件吧' : '暂无公开仓库' }}</div>
          </div>
        </section>
      </div>

      <!-- Tab 内容 -->
      <!-- 作品：3列网格 -->
      <div v-if="activeTab === 'works'">
        <PostGrid :loader="worksLoader" :key="userId" empty-text="还没有发布过内容" />
      </div>

      <!-- 收藏（仅自己，私密内容） -->
      <div v-else-if="activeTab === 'favorites' && isSelf">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm text-zinc-400">收藏的内容</span>
        </div>
        <PostGrid :loader="favoritesLoader" :key="'fav'" empty-text="还没有收藏任何内容" />
      </div>

      <!-- 文件库 -->
      <div v-else-if="activeTab === 'files'">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div class="flex flex-wrap gap-2">
            <button v-for="t in fileTypes" :key="t.key" class="px-3 py-1.5 rounded-[5%] text-xs font-medium transition-all" :class="fileType === t.key ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow' : 'bg-white/60 dark:bg-zinc-800/60 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 dark:text-zinc-200'" @click="fileType = t.key">{{ t.label }}</button>
          </div>
          <span class="text-xs text-zinc-400">{{ isSelf ? '暂无文件' : '暂无公开文件' }}</span>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div v-for="f in filteredFiles" :key="f.fileId" class="glass-card overflow-hidden card-lift group">
            <div class="aspect-video bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
              <img v-if="f.type === 'image'" :src="f.url" alt="" class="w-full h-full object-cover" @error="hideImg" />
              <video v-else-if="f.type === 'video'" :src="f.url" class="w-full h-full object-cover" muted></video>
              <div v-else class="text-4xl"><svg class="w-10 h-10 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button class="px-3 py-1.5 rounded-[5%] bg-white/90 text-xs font-medium text-zinc-700 shadow dark:text-zinc-200" @click="previewFile(f)">预览</button>
              </div>
            </div>
            <div class="p-3">
              <div class="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">{{ f.name }}</div>
              <div class="text-xs text-zinc-400 mt-0.5">{{ formatSize(f.size) }} · {{ relativeTime(f.createdAt) }}</div>
            </div>
          </div>
          <div v-if="filteredFiles.length === 0" class="col-span-full py-16 flex flex-col items-center gap-3 text-zinc-400">
            <div class="text-5xl"><svg class="w-12 h-12 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></div>
            <p class="text-sm">该分类下暂无文件</p>
          </div>
        </div>
      </div>

      <!-- 账号与安全（仅自己，私密功能） -->
      <div v-else-if="activeTab === 'security' && isSelf" class="grid lg:grid-cols-2 gap-5">
        <!-- 修改密码 -->
        <div class="glass-card p-5">
          <h3 class="text-base font-bold text-zinc-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <svg class="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            修改密码
          </h3>
          <form @submit.prevent="submitPassword" class="space-y-3">
            <input v-model="pwd.oldPassword" name="oldPassword" aria-label="旧密码" type="password" placeholder="旧密码" autocomplete="current-password" class="w-full h-11 px-4 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" />
            <input v-model="pwd.newPassword" name="newPassword" aria-label="新密码" type="password" placeholder="新密码（至少 8 位）" autocomplete="new-password" class="w-full h-11 px-4 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" />
            <input v-model="pwd.confirmPassword" name="confirmPassword" aria-label="确认新密码" type="password" placeholder="确认新密码" autocomplete="new-password" class="w-full h-11 px-4 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" />
            <p v-if="pwdError" class="text-xs text-red-500">{{ pwdError }}</p>
            <button class="w-full h-11 rounded-[5%] bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50" type="submit" :disabled="pwdSaving">
              {{ pwdSaving ? '提交中…' : '修改密码' }}
            </button>
          </form>
        </div>

        <!-- 二次验证 -->
        <div class="glass-card p-5">
          <div class="flex items-start justify-between mb-1">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              <h3 class="text-base font-bold text-zinc-800 dark:text-zinc-100">二次验证</h3>
            </div>
            <!-- 开关 -->
            <button
              type="button"
              role="switch"
              :aria-checked="twoFactorEnabled"
              :aria-label="twoFactorEnabled ? '点击关闭二次验证' : '点击开启二次验证'"
              :class="twoFactorEnabled ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-zinc-300 dark:bg-zinc-600'"
              class="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 disabled:opacity-60"
              :disabled="toggleBusy"
              @click="handleToggleTwoFactor"
            >
              <span
                :class="twoFactorEnabled ? 'translate-x-5' : 'translate-x-0.5'"
                class="absolute top-0.5 left-0 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
              ></span>
            </button>
          </div>
          <p class="text-xs text-zinc-500 dark:text-zinc-300 mb-4">
            开启后使用密码登入需额外输入邮箱验证码；关闭二次验证需进行身份二次确认
          </p>

          <!-- 关闭二次验证的二次确认面板 -->
          <div v-if="confirmOpen" class="space-y-3 p-3 rounded-[5%] bg-amber-50/70 dark:bg-zinc-800/50 border border-amber-200/70 dark:border-white/10">
            <div class="flex gap-2">
              <button
                type="button"
                class="flex-1 h-9 rounded-[5%] text-xs font-medium transition-colors"
                :class="secConfirmMethod === 'password' ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white' : 'bg-white/70 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-200 border border-white/60 dark:border-white/10'"
                :aria-pressed="secConfirmMethod === 'password'"
                @click="secConfirmMethod = 'password'"
              >
                使用密码确认
              </button>
              <button
                type="button"
                class="flex-1 h-9 rounded-[5%] text-xs font-medium transition-colors"
                :class="secConfirmMethod === 'code' ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white' : 'bg-white/70 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-200 border border-white/60 dark:border-white/10'"
                :aria-pressed="secConfirmMethod === 'code'"
                @click="secConfirmMethod = 'code'"
              >
                使用验证码确认
              </button>
            </div>

            <!-- 密码确认 -->
            <div v-if="secConfirmMethod === 'password'">
              <input v-model="confirmPassword" name="confirmPassword" aria-label="请输入密码确认" type="password" placeholder="请输入密码确认" autocomplete="current-password" class="w-full h-11 px-4 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" />
            </div>

            <!-- 验证码确认 -->
            <div v-else class="flex gap-2">
              <input v-model="confirmCode" name="confirmCode" aria-label="邮箱验证码" type="text" maxlength="9" placeholder="9 位验证码" class="flex-1 h-11 px-4 rounded-[5%] bg-white/70 dark:bg-zinc-800/70 border border-white/60 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 transition-all" @input="confirmCode = confirmCode.replace(/[^A-Za-z0-9]/g, '').slice(0, 9)" />
              <button
                type="button"
                class="px-3 h-11 rounded-[5%] text-xs font-medium whitespace-nowrap transition-colors"
                :class="codeCountdown > 0 ? 'bg-amber-100 text-amber-500 cursor-not-allowed dark:bg-zinc-800 dark:text-amber-300' : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:brightness-110'"
                :disabled="codeCountdown > 0 || toggleBusy"
                @click="handleSendSecurityCode"
              >
                {{ codeCountdown > 0 ? `${codeCountdown}s 后重发` : '获取验证码' }}
              </button>
            </div>

            <p v-if="securityMsg" class="text-xs" :class="securityError ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'">{{ securityMsg }}</p>

            <button
              type="button"
              class="w-full h-11 rounded-[5%] bg-red-500/90 text-white text-sm font-medium hover:bg-red-500 transition-colors disabled:opacity-50"
              :disabled="toggleBusy"
              @click="handleConfirmDisable"
            >
              {{ toggleBusy ? '提交中…' : '确认关闭二次验证' }}
            </button>
          </div>
        </div>

        <!-- OAuth 绑定 -->
        <div class="glass-card p-5">
          <h3 class="text-base font-bold text-zinc-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <svg class="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></svg>
            第三方账号绑定
          </h3>
          <div class="space-y-2.5">
            <div v-for="a in linkedAccounts" :key="a.provider" class="flex items-center justify-between px-3.5 py-2.5 rounded-[5%] bg-white/60 dark:bg-zinc-800/60">
              <div class="flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-[5%] bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center" v-html="providerIcon(a.provider)"></span>
                <div>
                  <div class="text-sm font-medium text-zinc-700 dark:text-zinc-200">{{ a.displayName }}</div>
                  <div class="text-[10px] text-zinc-400">{{ relativeTime(a.linkedAt) }} 绑定</div>
                </div>
              </div>
              <button class="px-2.5 h-8 rounded-[5%] text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" type="button" @click="unlinkTarget = a">解绑</button>
            </div>
            <div v-if="linkedAccounts.length === 0" class="py-8 text-center text-sm text-zinc-400">还没有绑定第三方账号</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 解绑第三方账号确认 -->
    <ConfirmDialog
      v-if="unlinkTarget"
      danger
      title="解绑第三方账号"
      :message="'确定解绑 ' + (unlinkTarget ? unlinkTarget.displayName : '') + ' 吗？解绑后将无法使用该账号登录。'"
      confirm-text="解绑"
      @close="unlinkTarget = null"
      @confirm="unlink(unlinkTarget)"
    />
  </div>
</template>

<script lang="ts">
export default { name: 'UserSpaceView' }
</script>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import PostGrid from '@/components/post/PostGrid.vue'
import UserCard from '@/components/user/UserCard.vue'
import { getUserPosts } from '@/api/tweet'
import { getUserFavorites, getUserFiles, getLinkedAccounts, unlinkAccount, changePassword, getUserSafety, updateUserSafety } from '@/api/space'
import { sendEmailCode } from '@/api/auth'
import { getFollowing, follow, unfollow } from '@/api/follow'
import { getMyUserInfo } from '@/api/userinfo'
import { createSession } from '@/api/chat'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { relativeTime } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()

const userId = computed(() => route.params.id)
// auth store 已把 JWT claims 归一化为 user.id（NameIdentifier→id），必须用 id 比较
const isSelf = computed(() => !!auth.user && String(auth.user.id) === String(userId.value))

// 他人主页：关注状态（拉取「我关注的人」比对，后端暂无 is-following 端点，与详情页同法）
const following = ref(false)

// 工具栏由全局 SideNav 提供（?tab=home|works|favorites|files|security），此处只消费 query
const activeTab = ref((route.query.tab as string) || 'home')
watch(() => route.query.tab, (v) => { if (v) activeTab.value = v as string })
const fileType = ref('all')
const fileTypes = [
  { key: 'all', label: '全部' },
  { key: 'image', label: '图片' },
  { key: 'video', label: '视频' },
  { key: 'doc', label: '文档' }
]

const user = ref<Record<string, any>>({})
const files = ref<any[]>([])
const linkedAccounts = ref<any[]>([])
const unlinkTarget = ref<any>(null) // 待解绑的第三方账号（确认弹窗）

// ===== 主页概览 =====
const overview = ref<{ posts: number }>({ posts: 0 }) // 作品总数（真实 total）
const recentPosts = ref<any[]>([]) // 最近 4 个作品
const recentFavorites = ref<any[]>([]) // 最近 4 个收藏（后端缺口，当前空态）
const recentFiles = computed(() => files.value.slice(0, 4)) // 最近 4 个文件
const userInfo = ref<any>(null) // Message /api/user-info/me（等级/经验/硬币，仅自己）
const MAX_LEVEL = 9 // 与后端 UserInfo.MaxLevel 一致
const levelThreshold = computed(() => (userInfo.value ? 2500 * userInfo.value.level : 2500))
const isMaxLevel = computed(() => !!userInfo.value && userInfo.value.level >= MAX_LEVEL)
const expPercent = computed(() => {
  if (!userInfo.value) return 0
  if (isMaxLevel.value) return 100
  const t = 2500 * userInfo.value.level
  return t > 0 ? Math.min(100, Math.round((userInfo.value.experience / t) * 100)) : 0
})
function goTab(key: string): void {
  router.push({ path: `/users/${userId.value}`, query: { tab: key } })
}
// 概览缩略辅助（与 PostCard 同字段约定：mediaUrls[0] 封面 / isVideo 或 URL 后缀）
function postThumb(p: any): string {
  const urls = p.mediaUrls || []
  return urls[0] || ''
}
function postIsVideo(p: any): boolean {
  if (p.isVideo) return true
  return /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(postThumb(p))
}
function postTitle(p: any): string {
  const t: string = (p.content || '').replace(/[#*`>~-]/g, '').trim()
  return t ? t.split('\n')[0].slice(0, 30) : '未命名作品'
}
// 作品取最近 4 个 + 总数；收藏接真实端点（当前后端缺口返回空态）
async function loadOverview(): Promise<void> {
  try {
    const res = await getUserPosts(userId.value, { page: 1, pageSize: 4 })
    const d: any = res && res.data ? res.data : res
    let list: any[] = d.items || d.list || []
    // 他人主页只显示公开作品（私密作品仅作者可见）
    if (!isSelf.value) list = list.filter(p => p.visibility !== 'Private')
    recentPosts.value = list.slice(0, 4)
    overview.value.posts = d.total != null ? d.total : recentPosts.value.length
  } catch (e) {
    recentPosts.value = []
    overview.value.posts = 0
  }
  // 收藏为私有内容，仅自己拉取
  if (!isSelf.value) {
    recentFavorites.value = []
    return
  }
  try {
    const res = await getUserFavorites()
    const d: any = res && res.data ? res.data : res
    recentFavorites.value = (d.items || d.list || []).slice(0, 4)
  } catch (e) {
    recentFavorites.value = []
  }
}

// 修改密码
const pwd = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })
const pwdError = ref('')
const pwdSaving = ref(false)

const filteredFiles = computed(() => fileType.value === 'all' ? files.value : files.value.filter(f => f.type === fileType.value))

function worksLoader(params: any): Promise<any> {
  return getUserPosts(userId.value, params)
}

function favoritesLoader(params: any) {
  return getUserFavorites(params)
}

async function loadUser(): Promise<void> {
  // 真实用户信息：自己的从 JWT + /api/user-info/me；他人信息后端缺 /api/users/{guid} 端点（缺口清单），读取真实端点，JWT 兜底
  following.value = false
  userInfo.value = null
  if (isSelf.value) {
    // 真实用户信息：昵称来自 JWT；签名/背景封面来自 Message /api/user-info/me
    user.value = {
      nickname: auth.user.name,
      bio: '',
      avatar: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="#fbbf24"/><text x="50" y="62" font-size="40" text-anchor="middle" fill="white">芒</text></svg>'),
      followingCount: 6,
      followerCount: 12,
      likeTotal: 128
    }
    // 背景封面 + 等级/经验/硬币 + 签名（Message：/api/user-info/me，失败保持默认渐变与默认等级）
    try {
      const info = await getMyUserInfo()
      const d = info && info.data ? info.data : info
      if (d) {
        userInfo.value = d
        if (d.backgroundCoverUrl) user.value.coverUrl = d.backgroundCoverUrl
        if (d.bio) user.value.bio = d.bio
      }
    } catch (e) { /* 忽略 */ }
    // 关注数接真实值（/api/follows/following 的 total）
    try {
      const f = await getFollowing({ page: 1, pageSize: 1 })
      const d = f && f.data ? f.data : f
      if (d && d.total != null) user.value.followingCount = d.total
    } catch (e) { /* 忽略 */ }
  } else {
    user.value = {
      nickname: '用户 ' + String(userId.value).slice(0, 8),
      bio: '这个人很懒，什么都没有写',
      avatar: 'https://api.dicebear.com/9.x/thumbs/svg?seed=' + userId.value,
      followingCount: 42,
      followerCount: 128,
      likeTotal: 356
    }
    await checkFollowing()
  }
}

// 关注状态：拉取「我关注的人」列表比对（后端暂无 is-following 端点，与详情页同法）
async function checkFollowing(): Promise<void> {
  if (isSelf.value || !auth.isLoggedIn()) return
  try {
    const res = await getFollowing({ page: 1, pageSize: 200 })
    const data: any = res && res.data ? res.data : res
    const list: any[] = data.items || data.list || []
    following.value = list.some(u => String(u.userGuid || u.userId) === String(userId.value))
  } catch (e) {
    following.value = false
  }
}

// 关注 / 取关（Message：POST|DELETE /api/follows/{userGuid}）
async function toggleFollow(): Promise<void> {
  if (!auth.isLoggedIn()) {
    toast.push('请先登录后关注', 'info')
    router.push('/login')
    return
  }
  const target = !following.value
  try {
    if (target) await follow(userId.value)
    else await unfollow(userId.value)
    following.value = target
    user.value.followerCount = Math.max(0, (user.value.followerCount || 0) + (target ? 1 : -1))
    toast.push(target ? '关注成功' : '已取消关注', 'success')
  } catch (e) {
    toast.push('操作失败，请稍后重试', 'error')
  }
}

// 发起聊天：POST /api/sessions（私聊幂等，已存在返回现有会话）→ 跳 /chat/:sessionId
async function onChat(): Promise<void> {
  if (!auth.isLoggedIn()) {
    toast.push('请先登录后聊天', 'info')
    router.push('/login')
    return
  }
  try {
    const res = await createSession(userId.value)
    const d: any = res && res.data ? res.data : res
    const sessionId = (d && (d.sessionId || d.id)) || (typeof d === 'string' ? d : '')
    if (!sessionId) throw new Error('no sessionId')
    router.push('/chat/' + sessionId)
  } catch (e) {
    toast.push('无法发起会话，请稍后重试', 'error')
  }
}

// 签名持久化到后端（Message：PUT /api/user-info/me/bio，空白表示清除）
async function onBioChanged(bio: string): Promise<void> {
  if (!user.value) return
  user.value.bio = bio
  try {
    await updateBio(bio)
  } catch (e) {
    // 持久化失败：保持当前展示，不回落本地存储
  }
}

// 用户卡片事件：头像/封面更新（上传逻辑在 UserCard 组件内）
function onAvatarChanged(url: string): void {
  if (url && user.value) user.value.avatar = url
}

function onCoverChanged(url: string): void {
  if (url && user.value) user.value.coverUrl = url
}

async function loadFiles(): Promise<void> {
  try {
    const res = await getUserFiles({ type: fileType.value })
    const data: any = res && res.data ? res.data : res
    files.value = data.items || data.list || []
  } catch (e) {
    files.value = []
  }
}

async function loadLinked(): Promise<void> {
  try {
    const res = await getLinkedAccounts()
    const data: any = res && res.data ? res.data : res
    linkedAccounts.value = Array.isArray(data) ? data : (data.items || data.list || [])
  } catch (e) {
    linkedAccounts.value = []
  }
}

async function submitPassword(): Promise<void> {
  pwdError.value = ''
  if (!pwd.value.oldPassword || !pwd.value.newPassword) {
    pwdError.value = '请填写旧密码和新密码'
    return
  }
  if (pwd.value.newPassword.length < 8) {
    pwdError.value = '新密码至少 8 位'
    return
  }
  if (pwd.value.newPassword !== pwd.value.confirmPassword) {
    pwdError.value = '两次输入的新密码不一致'
    return
  }
  pwdSaving.value = true
  try {
    await changePassword({ email: auth.user ? auth.user.email : '', oldPassword: pwd.value.oldPassword, newPassword: pwd.value.newPassword })
    toast.push('密码修改成功', 'success')
    pwd.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  } catch (e) {
    const data = e.response && e.response.data
    pwdError.value = (typeof data === 'string' && data) || (data && (data.error || data.message)) || '修改失败，请检查旧密码'
  } finally {
    pwdSaving.value = false
  }
}

// ===== 二次验证开关（GET/POST /api/identity/ready/identity/UserSafety，需认证） =====
const twoFactorEnabled = ref(false) // 是否已开启二次验证
const confirmOpen = ref(false) // 关闭二次验证的二次确认面板是否展开
const secConfirmMethod = ref<'password' | 'code'>('password') // 二次确认方式
const confirmPassword = ref('') // 密码二次确认输入
const confirmCode = ref('') // 验证码二次确认输入
const codeCountdown = ref(0) // 验证码重发倒计时
const securityMsg = ref('') // 二次验证操作反馈信息
const securityError = ref(false) // securityMsg 是否为错误（红色）样式
const toggleBusy = ref(false) // 二次验证操作进行中（禁用开关及各提交按钮）
let securityCodeTimer: ReturnType<typeof setInterval> | null = null

// 读取二次验证开关状态
async function loadSafety(): Promise<void> {
  if (!isSelf.value) return
  try {
    const res = await getUserSafety()
    const d: any = res && res.data ? res.data : res
    twoFactorEnabled.value = !!d && !!d.IsTwoFactorEnabled
  } catch (e) {
    twoFactorEnabled.value = false
  }
}

// 统一提交二次验证开关变更；关闭（降级）时携带密码或验证码二次确认
async function setTwoFactor(target: boolean, password?: string, code?: string): Promise<boolean> {
  toggleBusy.value = true
  securityError.value = false
  securityMsg.value = ''
  try {
    await updateUserSafety(target, password, code)
    twoFactorEnabled.value = target
    confirmOpen.value = false
    confirmPassword.value = ''
    confirmCode.value = ''
    toast.push(target ? '已开启二次验证' : '已关闭二次验证', 'success')
    return true
  } catch (e) {
    const data = e.response && e.response.data
    securityError.value = true
    securityMsg.value = (data && (data.error || data.message)) || '操作失败，请稍后重试'
    return false
  } finally {
    toggleBusy.value = false
  }
}

// 开关切换：开启直接提交；关闭需先展开二次确认面板
function handleToggleTwoFactor(): void {
  if (toggleBusy.value) return
  securityMsg.value = ''
  if (twoFactorEnabled.value) {
    // 关闭 → 展开（或收起）二次确认面板，并清空已输入内容
    confirmOpen.value = !confirmOpen.value
    if (!confirmOpen.value) {
      confirmPassword.value = ''
      confirmCode.value = ''
    }
    return
  }
  void setTwoFactor(true)
}

// 发送邮箱二次确认验证码（复用登录验证码通道）
async function handleSendSecurityCode(): Promise<void> {
  if (codeCountdown.value > 0 || toggleBusy.value) return
  if (!auth.user || !auth.user.email) {
    securityError.value = true
    securityMsg.value = '无法获取当前账号邮箱'
    return
  }
  securityError.value = false
  securityMsg.value = ''
  try {
    await sendEmailCode(auth.user.email)
    codeCountdown.value = 60
    if (securityCodeTimer) clearInterval(securityCodeTimer)
    securityCodeTimer = setInterval(() => {
      codeCountdown.value--
      if (codeCountdown.value <= 0) {
        if (securityCodeTimer) clearInterval(securityCodeTimer)
        securityCodeTimer = null
      }
    }, 1000)
    securityMsg.value = '验证码已发送至你的邮箱'
  } catch (e) {
    const data = e.response && e.response.data
    securityError.value = true
    securityMsg.value = (data && (data.error || data.message)) || '验证码发送失败，请稍后重试'
  }
}

// 确认关闭二次验证
async function handleConfirmDisable(): Promise<void> {
  if (toggleBusy.value) return
  if (secConfirmMethod.value === 'password') {
    if (!confirmPassword.value.trim()) {
      securityError.value = true
      securityMsg.value = '请输入当前密码'
      return
    }
    await setTwoFactor(false, confirmPassword.value)
  } else {
    if (confirmCode.value.length !== 9) {
      securityError.value = true
      securityMsg.value = '请输入 9 位验证码'
      return
    }
    await setTwoFactor(false, undefined, confirmCode.value)
  }
}

async function unlink(a: any): Promise<void> {
  unlinkTarget.value = null
  try {
    await unlinkAccount(a.provider, a.providerUserId)
    linkedAccounts.value = linkedAccounts.value.filter(x => x.provider !== a.provider || x.providerUserId !== a.providerUserId)
    toast.push(`已解绑 ${a.displayName}`, 'success')
  } catch (e) {
    toast.push('解绑失败，请稍后重试', 'error')
  }
}

function providerIcon(p: string): string {
  const map: Record<string, string> = {
    github: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="#24292f"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>',
    google: '<svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>',
    microsoft: '<svg class="w-5 h-5" viewBox="0 0 24 24"><rect x="2" y="2" width="10" height="10" fill="#F25022"/><rect x="13" y="2" width="9" height="10" fill="#7FBA00"/><rect x="2" y="13" width="10" height="9" fill="#00A4EF"/><rect x="13" y="13" width="9" height="9" fill="#FFB900"/></svg>',
    wechat: '<svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="#07C160" d="M9.5 4C5.36 4 2 6.91 2 10.5c0 2.1 1.17 3.97 3 5.2l-.75 2.3 2.53-1.32c.85.24 1.77.37 2.72.37.18 0 .35-.01.53-.02A5.5 5.5 0 0 1 9.5 13c0-3.31 2.9-6 6.5-6h.26C15.13 5.03 12.5 4 9.5 4z"/><path fill="#07C160" d="M17.5 8C14.46 8 12 10.24 12 13s2.46 5 5.5 5c.7 0 1.37-.11 2-.3L21.5 19l-.62-1.9c1.33-.96 2.12-2.36 2.12-4.1C23 10.24 20.54 8 17.5 8z"/><circle cx="8.5" cy="10.8" r="1" fill="#fff"/><circle cx="12.5" cy="10.8" r="1" fill="#fff"/><circle cx="15.5" cy="13.2" r="1" fill="#fff"/><circle cx="19.5" cy="13.2" r="1" fill="#fff"/></svg>',
    qq: '<svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="#12B7F5" d="M12 3c-3.6 0-6.5 2.9-6.5 6.5 0 1.3.4 2.5 1 3.5l-.9 3 3.1-1.5c.7.2 1.5.4 2.3.4s1.6-.1 2.3-.4l3.1 1.5-.9-3c.7-1 1-2.2 1-3.5C18.5 5.9 15.6 3 12 3z"/><circle cx="9.5" cy="9.5" r="1.2" fill="#fff"/><circle cx="14.5" cy="9.5" r="1.2" fill="#fff"/><path fill="#fff" d="M9.5 13.5c.8.8 1.6 1.2 2.5 1.2s1.7-.4 2.5-1.2c-.4 1.5-1.3 2.3-2.5 2.3s-2.1-.8-2.5-2.3z"/></svg>'
  }
  return map[p] || '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>'
}

function previewFile(f: any): void {
  toast.push(`预览 ${f.name} 功能开发中`, 'info')
}

function formatSize(bytes: number): string {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

function hideImg(e: Event) {
  (e.target as HTMLElement).style.visibility = 'hidden'
}

watch(() => route.params.id, (id) => {
  // keep-alive 缓存下组件未激活时路由也会变化（如切到 /chat 时本路由的 params.id 消失为 undefined）——
  // 无 id 时跳过，避免误请求 /api/tweets/user/undefined
  if (!id) return
  loadUser()
  loadOverview()
  loadSafety()
})

// 进入「安全」tab 时加载二次验证开关状态（每页一次性加载即可，切换用户时经上面 watch 刷新）
watch(activeTab, (v) => {
  if (v === 'security') loadSafety()
})

onMounted(() => {
  loadUser()
  loadOverview()
  loadFiles()
  loadLinked()
  loadSafety()
  window.addEventListener('beforeunload', clearSecurityTimer)
})

// 页面卸载时清理验证码倒计时定时器
function clearSecurityTimer(): void {
  if (securityCodeTimer) {
    clearInterval(securityCodeTimer)
    securityCodeTimer = null
  }
}
</script>
