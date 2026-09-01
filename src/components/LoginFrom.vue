<template>
  <div class="w-full max-w-md">
    <!-- 登录卡片 -->
    <div class="transition-all duration-300">
      <!-- 标题 -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-zinc-800 dark:text-zinc-100 mb-2 font-display">登入 NotBlog</h1>
        <p class="text-sm text-zinc-500 dark:text-zinc-300">欢迎回来</p>
      </div>

      <!-- ==================== 通道切换（密码登入 / 验证码登入） ==================== -->
      <div class="flex bg-zinc-100 dark:bg-zinc-800/60 p-1 mb-6 rounded-[5%]">
        <button
          type="button"
          class="flex-1 py-2 text-sm font-medium rounded-[5%] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          :class="mode === 'password'
            ? 'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-300 shadow-sm'
            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'"
          @click="switchMode('password')"
        >
          密码登入
        </button>
        <button
          type="button"
          class="flex-1 py-2 text-sm font-medium rounded-[5%] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          :class="mode === 'code'
            ? 'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-300 shadow-sm'
            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'"
          @click="switchMode('code')"
        >
          验证码登入
        </button>
      </div>

      <!-- ==================== 密码登入表单 ==================== -->
      <form v-if="mode === 'password'" @submit.prevent="handlePasswordLogin" novalidate>
        <!-- 邮箱输入框 -->
        <div class="mb-4">
          <label for="email" class="block text-xs font-semibold text-zinc-600 dark:text-zinc-200 tracking-wide mb-1.5">
            邮箱
          </label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400 dark:text-zinc-400">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            <input
              type="email"
              id="email"
              v-model="email"
              name="email"
              class="w-full pl-10 pr-4 py-2.5 bg-amber-50/50 border rounded-[5%] text-sm text-zinc-700 placeholder-amber-300 transition-all duration-200 focus:outline-none focus:ring-1 dark:bg-zinc-800/60 dark:border-zinc-600/60 dark:text-zinc-100 dark:placeholder-zinc-500"
              :class="errors.email ? 'border-red-300 focus:border-red-400 focus:ring-red-300 dark:border-red-400/70 dark:focus:ring-red-400/50' : 'border-amber-200 focus:border-amber-400 focus:ring-amber-300 dark:border-zinc-600/60 dark:focus:ring-amber-400/50'"
              :disabled="loading"
              placeholder="请输入您的邮箱"
              autocomplete="email"
            >
          </div>
          <p v-if="errors.email" class="mt-1.5 text-xs text-red-500 flex items-center gap-1">
            <svg class="h-3 w-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ errors.email }}
          </p>
        </div>

        <!-- 密码输入框 -->
        <div class="mb-4">
          <div class="flex justify-between items-center mb-1.5">
            <label for="password" class="block text-xs font-semibold text-zinc-600 dark:text-zinc-200 tracking-wide">
              密码
            </label>
            <button
              type="button"
              class="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors duration-200 underline underline-offset-2 decoration-amber-300 dark:decoration-amber-500 hover:decoration-amber-500"
              @click="handleForgotPassword"
            >
              忘记密码？
            </button>
          </div>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400 dark:text-zinc-400">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            <input
              :type="showPassword ? 'text' : 'password'"
              id="password"
              v-model="password"
              class="w-full pl-10 pr-12 py-2.5 bg-amber-50/50 border rounded-[5%] text-sm text-zinc-700 placeholder-amber-300 transition-all duration-200 focus:outline-none focus:ring-1 dark:bg-zinc-800/60 dark:border-zinc-600/60 dark:text-zinc-100 dark:placeholder-zinc-500"
              :class="errors.password ? 'border-red-300 focus:border-red-400 focus:ring-red-300 dark:border-red-400/70 dark:focus:ring-red-400/50' : 'border-amber-200 focus:border-amber-400 focus:ring-amber-300 dark:border-zinc-600/60 dark:focus:ring-amber-400/50'"
              :disabled="loading"
              placeholder="请输入您的密码"
              autocomplete="current-password"
            >
            <button
              type="button"
              class="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-100 transition-colors duration-200"
              @click="togglePasswordVisibility"
              :disabled="loading"
              tabindex="-1"
              :aria-label="showPassword ? '隐藏密码' : '显示密码'"
            >
              <svg v-if="!showPassword" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" />
              </svg>
            </button>
          </div>
          <p v-if="errors.password" class="mt-1.5 text-xs text-red-500 flex items-center gap-1">
            <svg class="h-3 w-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ errors.password }}
          </p>
        </div>

        <!-- 记住我 -->
        <div class="flex items-center mb-5">
          <label for="remember-me" class="flex items-center cursor-pointer group">
            <input
              type="checkbox"
              id="remember-me"
              v-model="rememberMe"
              class="w-4 h-4 rounded border-amber-300 bg-amber-50 text-amber-600 focus:ring-amber-400 focus:ring-2 focus:ring-offset-0 transition-all duration-200 cursor-pointer dark:border-amber-400/60 dark:bg-zinc-800 dark:text-amber-300"
            >
            <span class="ml-2 text-sm text-zinc-600 dark:text-zinc-200 group-hover:text-zinc-700 dark:group-hover:text-zinc-100 transition-colors duration-200">
              记住我
            </span>
          </label>
        </div>

        <!-- 密码登入按钮 -->
        <button
          type="submit"
          class="btn-sheen w-full py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium rounded-[5%] transition-all duration-200 flex justify-center items-center focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1"
          :class="loading ? 'opacity-70 cursor-not-allowed' : 'hover:brightness-110 active:scale-[0.98]'"
          :disabled="loading"
        >
          <span v-if="loading" class="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true"></span>
          登入 NotBlog
        </button>
      </form>

      <!-- ==================== 验证码登入表单（未注册邮箱自动注册） ==================== -->
      <form v-else @submit.prevent="handleCodeLogin" novalidate>
        <!-- 邮箱输入框 -->
        <div class="mb-4">
          <label for="code-email" class="block text-xs font-semibold text-zinc-600 dark:text-zinc-200 tracking-wide mb-1.5">
            邮箱
          </label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400 dark:text-zinc-400">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            <input
              type="email"
              id="code-email"
              v-model="email"
              class="w-full pl-10 pr-4 py-2.5 bg-amber-50/50 border rounded-[5%] text-sm text-zinc-700 placeholder-amber-300 transition-all duration-200 focus:outline-none focus:ring-1 dark:bg-zinc-800/60 dark:border-zinc-600/60 dark:text-zinc-100 dark:placeholder-zinc-500"
              :class="errors.email ? 'border-red-300 focus:border-red-400 focus:ring-red-300 dark:border-red-400/70 dark:focus:ring-red-400/50' : 'border-amber-200 focus:border-amber-400 focus:ring-amber-300 dark:border-zinc-600/60 dark:focus:ring-amber-400/50'"
              :disabled="loading"
              placeholder="请输入您的邮箱"
              autocomplete="email"
            >
          </div>
          <p v-if="errors.email" class="mt-1.5 text-xs text-red-500 flex items-center gap-1">
            <svg class="h-3 w-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ errors.email }}
          </p>
        </div>

        <!-- 邮箱验证码 -->
        <div class="mb-5">
          <label for="code" class="block text-xs font-semibold text-zinc-600 dark:text-zinc-200 tracking-wide mb-1.5">
            邮箱验证码（9 位数字+英文混合）
          </label>
          <div class="flex gap-2">
            <input
              type="text"
              id="code"
              v-model="code"
              maxlength="9"
              class="flex-1 py-2.5 px-4 bg-amber-50/50 border rounded-[5%] text-sm text-zinc-700 placeholder-amber-300 transition-all duration-200 focus:outline-none focus:ring-1 dark:bg-zinc-800/60 dark:border-zinc-600/60 dark:text-zinc-100 dark:placeholder-zinc-500"
              :class="errors.code ? 'border-red-300 focus:border-red-400 focus:ring-red-300 dark:border-red-400/70 dark:focus:ring-red-400/50' : 'border-amber-200 focus:border-amber-400 focus:ring-amber-300 dark:border-zinc-600/60 dark:focus:ring-amber-400/50'"
              :disabled="loading"
              placeholder="9 位数字和字母混合"
              @input="code = code.replace(/[^A-Za-z0-9]/g, '').slice(0, 9)"
            >
            <button
              type="button"
              class="px-4 py-2.5 text-xs font-medium rounded-[5%] whitespace-nowrap transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1"
              :class="codeCountdown > 0 ? 'bg-amber-100 text-amber-500 cursor-not-allowed dark:bg-zinc-800 dark:text-amber-300' : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:brightness-110 focus:ring-amber-400 active:scale-[0.97]'"
              :disabled="codeCountdown > 0 || loading"
              @click="handleSendCode"
            >
              {{ codeCountdown > 0 ? `${codeCountdown}s 后重发` : '获取验证码' }}
            </button>
          </div>
          <p v-if="errors.code" class="mt-1.5 text-xs text-red-500 flex items-center gap-1">
            <svg class="h-3 w-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ errors.code }}
          </p>
        </div>

        <p class="text-xs text-zinc-500 dark:text-zinc-300 mb-5">
          未注册邮箱将自动注册，初始密码会发送到您的邮箱。
        </p>

        <!-- 验证码登入按钮 -->
        <button
          type="submit"
          class="btn-sheen w-full py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium rounded-[5%] transition-all duration-200 flex justify-center items-center focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1"
          :class="loading ? 'opacity-70 cursor-not-allowed' : 'hover:brightness-110 active:scale-[0.98]'"
          :disabled="loading"
        >
          <span v-if="loading" class="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true"></span>
          登入 / 注册
        </button>
      </form>

      <!-- ==================== 分隔线 ==================== -->
      <div class="my-6 flex items-center gap-3">
        <div class="flex-1 h-px bg-amber-200 dark:bg-zinc-600"></div>
        <span class="text-xs text-zinc-400 dark:text-zinc-500 whitespace-nowrap">或使用第三方账号登录</span>
        <div class="flex-1 h-px bg-amber-200 dark:bg-zinc-600"></div>
      </div>

      <!-- ==================== 第三方登录按钮 ==================== -->
      <div class="flex items-center justify-center gap-3">
        <!-- Microsoft 登录 -->
        <button
          class="w-12 h-12 shrink-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-[5%] flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-300 hover:brightness-110 active:scale-95"
          type="button"
          aria-label="使用 Microsoft 登录"
          title="Microsoft 登录"
          @click="handleMicrosoftLogin"
        >
          <svg class="h-5 w-5 flex-shrink-0" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="1" y="1" width="9" height="9" fill="#F25022" />
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
            <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
          </svg>
        </button>

        <!-- GitHub 登录 -->
        <button
          class="w-12 h-12 shrink-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-[5%] flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-300 hover:brightness-110 active:scale-95"
          type="button"
          aria-label="使用 GitHub 登录"
          title="GitHub 登录"
          @click="handleGitHubLogin"
        >
          <svg class="h-5 w-5 flex-shrink-0 text-white" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </button>

        <!-- WeChat 登录 -->
        <button
          class="w-12 h-12 shrink-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-[5%] flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-300 hover:brightness-110 active:scale-95"
          type="button"
          aria-label="使用微信登录"
          title="微信登录"
          @click="handleWeChatLogin"
        >
          <svg class="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="#07C160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.952-7.062-6.122zm-2.18 2.769c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982z" />
          </svg>
        </button>

        <!-- Google 登录 -->
        <button
          class="w-12 h-12 shrink-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-[5%] flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-300 hover:brightness-110 active:scale-95"
          type="button"
          aria-label="使用 Google 登录"
          title="Google 登录"
          @click="handleGoogleLogin"
        >
          <svg class="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 错误提示 -->
    <div
      v-if="errorMessage"
      class="mt-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/30 rounded-[5%] flex items-start gap-2 animate-fade-in"
    >
      <svg class="h-4 w-4 text-red-400 dark:text-red-300 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
      </svg>
      <p class="text-xs text-red-700 dark:text-red-300">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login, saveLoginResult, sendEmailCode, oauthLoginInit } from '@/api/auth'

type LoginMode = 'password' | 'code'

// ==================== 通道模式 ====================
const mode = ref<LoginMode>('password')

const switchMode = (m: LoginMode): void => {
  mode.value = m
  errorMessage.value = ''
  errors.value = {}
  code.value = ''
  codeCountdown.value = 0
  if (codeTimer) {
    clearInterval(codeTimer)
    codeTimer = null
  }
}

// ==================== 密码登入状态 ====================
const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const showPassword = ref(false)

// ==================== 验证码登入状态 ====================
const code = ref('')
const codeCountdown = ref(0)
let codeTimer: ReturnType<typeof setInterval> | null = null

// ==================== 通用状态 ====================
const loading = ref(false)
const errorMessage = ref('')
const errors = ref<Record<string, string>>({})

const router = useRouter()

// ==================== 密码可见性切换 ====================
const togglePasswordVisibility = (): void => {
  showPassword.value = !showPassword.value
}

// ==================== 忘记密码 ====================
const handleForgotPassword = (): void => {
  errorMessage.value = '忘记密码请联系管理员重置'
}

// ==================== 表单校验 ====================
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const validateEmail = (): boolean => {
  if (!email.value.trim()) {
    errors.value.email = '请输入邮箱'
    return false
  }
  if (!EMAIL_REGEX.test(email.value)) {
    errors.value.email = '请输入有效的邮箱地址'
    return false
  }
  return true
}

// ==================== 邮箱验证码发送 ====================
const handleSendCode = async (): Promise<void> => {
  errors.value.email = ''
  errorMessage.value = ''

  if (!validateEmail()) return

  loading.value = true
  try {
    // 后端发送邮件验证码（Identity：POST /api/identity/ready/email-verifications）
    await sendEmailCode(email.value)
    startCodeCountdown()
  } catch (err: any) {
    const data = err && err.response && err.response.data
    errorMessage.value = (typeof data === 'string' && data)
      || (data && (data.error || data.message))
      || '验证码发送失败，请稍后重试'
    console.error('发送邮箱验证码错误:', err)
  } finally {
    loading.value = false
  }
}

const startCodeCountdown = (): void => {
  codeCountdown.value = 60
  if (codeTimer) clearInterval(codeTimer)
  codeTimer = setInterval(() => {
    codeCountdown.value--
    if (codeCountdown.value <= 0) {
      clearInterval(codeTimer!)
      codeTimer = null
    }
  }, 1000)
}

// ==================== 登录成功后处理 ====================
// 后端统一登录/注册：POST /api/identity/ready/identity/Login { email, code?, password? }
// 成功返回 { accessToken, refreshToken, tokenType, expiresAt, isNewUser }
// （axios 拦截器未解包，业务数据在 res.data）
const handleLoginSuccess = (res: any): void => {
  const data = res && res.data ? res.data : res
  saveLoginResult(data)
  router.replace('/home')
}

// ==================== 密码登入提交 ====================
const handlePasswordLogin = async (): Promise<void> => {
  errorMessage.value = ''
  errors.value = {}

  let valid = true
  if (!validateEmail()) valid = false
  if (!password.value) {
    errors.value.password = '请输入密码'
    valid = false
  }
  if (!valid) return

  loading.value = true
  try {
    const res = await login({ email: email.value, password: password.value })
    handleLoginSuccess(res)
  } catch (err: any) {
    const data = err && err.response && err.response.data
    errorMessage.value = (typeof data === 'string' && data)
      || (data && (data.error || data.message))
      || '登入失败，请检查邮箱和密码'
    console.error('密码登入错误:', err)
  } finally {
    loading.value = false
  }
}

// ==================== 验证码登入提交 ====================
const handleCodeLogin = async (): Promise<void> => {
  errorMessage.value = ''
  errors.value = {}

  let valid = true
  if (!validateEmail()) valid = false
  if (!/^[A-Za-z0-9]{9}$/.test(code.value)) {
    errors.value.code = '请输入 9 位验证码（数字和字母混合）'
    valid = false
  }
  if (!valid) return

  loading.value = true
  try {
    const res = await login({ email: email.value, code: code.value })
    // 未注册邮箱自动注册：初始密码已下发至邮箱，登录成功仅提示
    const payload = res && res.data ? res.data : res
    if (payload && payload.isNewUser) {
      console.warn('账号已自动注册，初始密码已发送到您的邮箱')
    }
    handleLoginSuccess(res)
  } catch (err: any) {
    const data = err && err.response && err.response.data
    errorMessage.value = (typeof data === 'string' && data)
      || (data && (data.error || data.message))
      || '登入失败，请检查邮箱和验证码'
    console.error('验证码登入错误:', err)
  } finally {
    loading.value = false
  }
}

// ==================== 第三方登录（后端 OAuth） ====================
// 回调地址：后端 OAuth 白名单校验（AllowedRedirectUris 配置）需包含该地址；
// 提供方完成授权后带 code/state 回到 /login，由 LoginPage 换取 Token
const oauthRedirectUri = (): string => window.location.origin + '/login'

const handleOAuthLogin = async (provider: string): Promise<void> => {
  try {
    // 记录当前提供商，供回调页（/login?code=&state=）换取 Token 时使用
    sessionStorage.setItem('oauth_provider', provider)
    // 后端返回拼接好的授权地址（含 state，存入 Redis 防 CSRF）
    const res = (await oauthLoginInit(provider, oauthRedirectUri())) as any
    const oauthUrl = res && res.authorizationUrl
    if (oauthUrl) {
      window.location.href = oauthUrl
    } else {
      errorMessage.value = '登录服务暂不可用，请稍后重试'
    }
  } catch (err) {
    sessionStorage.removeItem('oauth_provider')
    console.error(`获取 ${provider} OAuth 授权地址失败:`, err)
    errorMessage.value = `${provider} 登录服务暂不可用，请稍后重试`
  }
}

const handleMicrosoftLogin = (): void => { void handleOAuthLogin('microsoft') }
const handleGitHubLogin = (): void => { void handleOAuthLogin('github') }
const handleWeChatLogin = (): void => { void handleOAuthLogin('wechat') }
const handleGoogleLogin = (): void => { void handleOAuthLogin('google') }
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
</style>