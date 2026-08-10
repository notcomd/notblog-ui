<template>
  <div class="w-full max-w-md">
    <!-- 注册卡片 -->
    <div class="transition-all duration-300">
      <!-- 标题 -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">注册 NotBlog</h1>
        <p class="text-sm text-zinc-500 dark:text-zinc-300">创建您的账户，开始记录与分享</p>
      </div>

      <!-- 注册方式Tab切换 -->
      <div class="flex mb-6 bg-amber-50 dark:bg-zinc-800/70 rounded-[5%] p-1 gap-1">
        <button
          class="flex-1 py-2 text-sm font-medium rounded-[5%] transition-all duration-200"
          :class="registerMode === 'email' ? 'bg-white text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'"
          @click="switchRegisterMode('email')"
        >
          <span class="flex items-center justify-center gap-1.5">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            邮箱注册
          </span>
        </button>
        <button
          class="flex-1 py-2 text-sm font-medium rounded-[5%] transition-all duration-200"
          :class="registerMode === 'phone' ? 'bg-white text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'"
          @click="switchRegisterMode('phone')"
        >
          <span class="flex items-center justify-center gap-1.5">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            手机注册
          </span>
        </button>
      </div>

      <!-- ==================== 邮箱注册表单 ==================== -->
      <form v-show="registerMode === 'email'" @submit.prevent="handleEmailRegister" novalidate>
        <!-- 邮箱输入框 -->
        <div class="mb-4">
          <label for="reg-email" class="block text-xs font-semibold text-zinc-600 dark:text-zinc-200 tracking-wide mb-1.5">
            邮箱
          </label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400 dark:text-zinc-400">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            <input
              type="email"
              id="reg-email"
              v-model="email"
              class="w-full pl-10 pr-4 py-2.5 bg-amber-50/50 border rounded-[5%] text-sm text-zinc-700 placeholder-amber-300 transition-all duration-200 focus:outline-none focus:ring-1 dark:bg-zinc-800/60 dark:border-zinc-600/60 dark:text-zinc-100 dark:placeholder-zinc-500"
              :class="errors.email ? 'border-red-300 focus:border-red-400 focus:ring-red-300 dark:border-red-400/70 dark:focus:ring-red-400/50' : 'border-amber-200 focus:border-amber-400 focus:ring-amber-300 dark:border-zinc-600/60 dark:focus:ring-amber-400/50'"
              :disabled="emailLoading"
              placeholder="请输入您的邮箱"
              autocomplete="email"
            >
          </div>
          <p v-if="errors.email" class="mt-1.5 text-xs text-red-500 flex items-center gap-1">
            <svg class="h-3 w-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ errors.email }}
          </p>
        </div>

        <!-- 密码输入框 -->
        <div class="mb-4">
          <label for="reg-password" class="block text-xs font-semibold text-zinc-600 dark:text-zinc-200 tracking-wide mb-1.5">
            密码
          </label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400 dark:text-zinc-400">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            <input
              :type="showPassword ? 'text' : 'password'"
              id="reg-password"
              v-model="password"
              class="w-full pl-10 pr-12 py-2.5 bg-amber-50/50 border rounded-[5%] text-sm text-zinc-700 placeholder-amber-300 transition-all duration-200 focus:outline-none focus:ring-1 dark:bg-zinc-800/60 dark:border-zinc-600/60 dark:text-zinc-100 dark:placeholder-zinc-500"
              :class="getPasswordBorderClass()"
              :disabled="emailLoading"
              placeholder="请输入您的密码（至少8位）"
              autocomplete="new-password"
              @input="handlePasswordInput"
            >
            <button
              type="button"
              class="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-100 transition-colors duration-200"
              @click="togglePasswordVisibility"
              :disabled="emailLoading"
              tabindex="-1"
              :aria-label="showPassword ? '隐藏密码' : '显示密码'"
            >
              <svg v-if="!showPassword" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" />
              </svg>
            </button>
          </div>
          <!-- 密码强度指示器 -->
          <div v-if="password" class="mt-2">
            <div class="flex gap-1 mb-1">
              <div class="flex-1 h-1 rounded-full transition-all duration-300" :class="strengthBarClass(1)"></div>
              <div class="flex-1 h-1 rounded-full transition-all duration-300" :class="strengthBarClass(2)"></div>
              <div class="flex-1 h-1 rounded-full transition-all duration-300" :class="strengthBarClass(3)"></div>
            </div>
            <span class="text-[10px] tracking-wide" :class="strengthLabelClass">{{ strengthLabel }}</span>
          </div>
          <p v-if="errors.password" class="mt-1.5 text-xs text-red-500 flex items-center gap-1">
            <svg class="h-3 w-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ errors.password }}
          </p>
        </div>

        <!-- 邮箱验证码 -->
        <div class="mb-5">
          <label for="reg-code" class="block text-xs font-semibold text-zinc-600 dark:text-zinc-200 tracking-wide mb-1.5">
            邮箱验证码（9 位数字+英文混合）
          </label>
          <div class="flex gap-2">
            <input
              type="text"
              id="reg-code"
              v-model="generatecode"
              maxlength="9"
              class="flex-1 py-2.5 px-4 bg-amber-50/50 border rounded-[5%] text-sm text-zinc-700 placeholder-amber-300 transition-all duration-200 focus:outline-none focus:ring-1 dark:bg-zinc-800/60 dark:border-zinc-600/60 dark:text-zinc-100 dark:placeholder-zinc-500"
              :class="errors.generatecode ? 'border-red-300 focus:border-red-400 focus:ring-red-300 dark:border-red-400/70 dark:focus:ring-red-400/50' : 'border-amber-200 focus:border-amber-400 focus:ring-amber-300 dark:border-zinc-600/60 dark:focus:ring-amber-400/50'"
              :disabled="emailLoading"
              placeholder="9 位数字和字母混合"
              @input="generatecode = generatecode.replace(/[^A-Za-z0-9]/g, '').slice(0, 9)"
            >
            <button
              type="button"
              class="px-4 py-2.5 text-xs font-medium rounded-[5%] whitespace-nowrap transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1"
              :class="emailCodeCountdown > 0 ? 'bg-amber-100 text-amber-500 cursor-not-allowed dark:bg-zinc-800 dark:text-amber-300' : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:brightness-110 focus:ring-amber-400 active:scale-[0.97]'"
              :disabled="emailCodeCountdown > 0 || emailLoading"
              @click="handleSendEmailCode"
            >
              {{ emailCodeCountdown > 0 ? `${emailCodeCountdown}s 后重发` : '获取验证码' }}
            </button>
          </div>
          <p v-if="errors.generatecode" class="mt-1.5 text-xs text-red-500 flex items-center gap-1">
            <svg class="h-3 w-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ errors.generatecode }}
          </p>
        </div>

        <!-- 邮箱注册按钮 -->
        <button
          type="submit"
          class="w-full py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium rounded-[5%] transition-all duration-200 flex justify-center items-center focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1"
          :class="emailLoading ? 'opacity-70 cursor-not-allowed' : 'hover:brightness-110 active:scale-[0.98]'"
          :disabled="emailLoading"
        >
          <span v-if="emailLoading" class="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          获取 NotBlog
        </button>
      </form>

      <!-- ==================== 手机注册表单 ==================== -->
      <form v-show="registerMode === 'phone'" @submit.prevent="handlePhoneRegister" novalidate>
        <!-- 手机号输入框 -->
        <div class="mb-4">
          <label for="reg-phone" class="block text-xs font-semibold text-zinc-600 dark:text-zinc-200 tracking-wide mb-1.5">
            手机号码
          </label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400 dark:text-zinc-400">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </span>
            <input
              type="tel"
              id="reg-phone"
              v-model="regPhoneNumber"
              class="w-full pl-10 pr-4 py-2.5 bg-amber-50/50 border rounded-[5%] text-sm text-zinc-700 placeholder-amber-300 transition-all duration-200 focus:outline-none focus:ring-1 dark:bg-zinc-800/60 dark:border-zinc-600/60 dark:text-zinc-100 dark:placeholder-zinc-500"
              :class="errors.regPhoneNumber ? 'border-red-300 focus:border-red-400 focus:ring-red-300 dark:border-red-400/70 dark:focus:ring-red-400/50' : 'border-amber-200 focus:border-amber-400 focus:ring-amber-300 dark:border-zinc-600/60 dark:focus:ring-amber-400/50'"
              :disabled="phoneLoading"
              placeholder="请输入您的手机号码"
              maxlength="11"
              autocomplete="tel"
            >
          </div>
          <p v-if="errors.regPhoneNumber" class="mt-1.5 text-xs text-red-500 flex items-center gap-1">
            <svg class="h-3 w-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ errors.regPhoneNumber }}
          </p>
        </div>

        <!-- 短信验证码 -->
        <div class="mb-4">
          <label for="reg-phone-code" class="block text-xs font-semibold text-zinc-600 dark:text-zinc-200 tracking-wide mb-1.5">
            短信验证码
          </label>
          <div class="flex gap-2">
            <input
              type="text"
              id="reg-phone-code"
              v-model="regPhoneCode"
              class="flex-1 py-2.5 px-4 bg-amber-50/50 border rounded-[5%] text-sm text-zinc-700 placeholder-amber-300 transition-all duration-200 focus:outline-none focus:ring-1 dark:bg-zinc-800/60 dark:border-zinc-600/60 dark:text-zinc-100 dark:placeholder-zinc-500"
              :class="errors.regPhoneCode ? 'border-red-300 focus:border-red-400 focus:ring-red-300 dark:border-red-400/70 dark:focus:ring-red-400/50' : 'border-amber-200 focus:border-amber-400 focus:ring-amber-300 dark:border-zinc-600/60 dark:focus:ring-amber-400/50'"
              :disabled="phoneLoading"
              placeholder="请输入验证码"
              maxlength="6"
            >
            <button
              type="button"
              class="px-4 py-2.5 text-xs font-medium rounded-[5%] whitespace-nowrap transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1"
              :class="phoneCodeCountdown > 0 ? 'bg-amber-100 text-amber-500 cursor-not-allowed dark:bg-zinc-800 dark:text-amber-300' : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:brightness-110 focus:ring-amber-400 active:scale-[0.97]'"
              :disabled="phoneCodeCountdown > 0 || phoneLoading"
              @click="sendPhoneCode"
            >
              {{ phoneCodeCountdown > 0 ? `${phoneCodeCountdown}s 后重发` : '获取验证码' }}
            </button>
          </div>
          <p v-if="errors.regPhoneCode" class="mt-1.5 text-xs text-red-500 flex items-center gap-1">
            <svg class="h-3 w-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ errors.regPhoneCode }}
          </p>
        </div>

        <!-- 设置密码 -->
        <div class="mb-5">
          <label for="reg-phone-password" class="block text-xs font-semibold text-zinc-600 dark:text-zinc-200 tracking-wide mb-1.5">
            设置密码
          </label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400 dark:text-zinc-400">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            <input
              :type="showRegPhonePassword ? 'text' : 'password'"
              id="reg-phone-password"
              v-model="regPhonePassword"
              class="w-full pl-10 pr-12 py-2.5 bg-amber-50/50 border rounded-[5%] text-sm text-zinc-700 placeholder-amber-300 transition-all duration-200 focus:outline-none focus:ring-1 dark:bg-zinc-800/60 dark:border-zinc-600/60 dark:text-zinc-100 dark:placeholder-zinc-500"
              :class="errors.regPhonePassword ? 'border-red-300 focus:border-red-400 focus:ring-red-300 dark:border-red-400/70 dark:focus:ring-red-400/50' : 'border-amber-200 focus:border-amber-400 focus:ring-amber-300 dark:border-zinc-600/60 dark:focus:ring-amber-400/50'"
              :disabled="phoneLoading"
              placeholder="请设置密码（至少8位）"
              autocomplete="new-password"
            >
            <button
              type="button"
              class="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-100 transition-colors duration-200"
              @click="showRegPhonePassword = !showRegPhonePassword"
              :disabled="phoneLoading"
              tabindex="-1"
              :aria-label="showRegPhonePassword ? '隐藏密码' : '显示密码'"
            >
              <svg v-if="!showRegPhonePassword" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" />
              </svg>
            </button>
          </div>
          <p v-if="errors.regPhonePassword" class="mt-1.5 text-xs text-red-500 flex items-center gap-1">
            <svg class="h-3 w-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ errors.regPhonePassword }}
          </p>
        </div>

        <!-- 手机注册按钮 -->
        <button
          type="submit"
          class="w-full py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-medium rounded-[5%] transition-all duration-200 flex justify-center items-center focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1"
          :class="phoneLoading ? 'opacity-70 cursor-not-allowed' : 'hover:brightness-110 active:scale-[0.98]'"
          :disabled="phoneLoading"
        >
          <span v-if="phoneLoading" class="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          手机注册
        </button>
      </form>

      <!-- ==================== 分隔线 ==================== -->
      <div class="my-6 flex items-center gap-3">
        <div class="flex-1 h-px bg-amber-200 dark:bg-zinc-600"></div>
        <span class="text-xs text-zinc-400 dark:text-zinc-500 whitespace-nowrap">或使用第三方账号注册</span>
        <div class="flex-1 h-px bg-amber-200 dark:bg-zinc-600"></div>
      </div>

      <!-- ==================== 第三方注册按钮 ==================== -->
      <div class="flex items-center justify-center gap-3">
        <!-- Microsoft -->
        <button
          class="w-12 h-12 shrink-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-[5%] flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-300 hover:brightness-110 active:scale-95"
          title="Microsoft 注册"
          @click="handleThirdPartyRegister('microsoft')"
        >
          <svg class="h-5 w-5 flex-shrink-0" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="9" height="9" fill="#F25022" />
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
            <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
          </svg>
        </button>

        <!-- GitHub -->
        <button
          class="w-12 h-12 shrink-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-[5%] flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-300 hover:brightness-110 active:scale-95"
          title="GitHub 注册"
          @click="handleThirdPartyRegister('github')"
        >
          <svg class="h-5 w-5 flex-shrink-0 text-white" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </button>

        <!-- WeChat -->
        <button
          class="w-12 h-12 shrink-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-[5%] flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-300 hover:brightness-110 active:scale-95"
          title="微信注册"
          @click="handleThirdPartyRegister('wechat')"
        >
          <svg class="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="#07C160" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.952-7.062-6.122zm-2.18 2.769c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982z" />
          </svg>
        </button>

        <!-- Google -->
        <button
          class="w-12 h-12 shrink-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-[5%] flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-300 hover:brightness-110 active:scale-95"
          title="Google 注册"
          @click="handleThirdPartyRegister('google')"
        >
          <svg class="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        </button>
      </div>

      <!-- 登录链接 -->
      <div class="mt-5 text-center">
        <p class="text-xs text-zinc-500 dark:text-zinc-300">
          持有通行证？
          <a
            href="#"
            class="text-amber-600 dark:text-amber-400 font-semibold hover:text-amber-700 dark:hover:text-amber-300 transition-colors duration-200 underline underline-offset-2 decoration-amber-300 dark:decoration-amber-500"
            @click.prevent="handleLoginClick"
          >
            立即登入
          </a>
        </p>
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
</template>s

<script setup>
import { ref, computed } from 'vue'
import { register, sendEmailCode } from '@/api/auth'
import { defineEmits, defineProps } from 'vue'
import router from '@/router'

// ==================== Props & Emits ====================
defineProps({
  showLoginForm: { type: Boolean, default: false },
  showRegisterForm: { type: Boolean, default: true }
})

const emit = defineEmits(['showLoginForm'])

// ==================== 注册模式切换 ====================
const registerMode = ref('email') // 'email' | 'phone'

const switchRegisterMode = (mode) => {
  registerMode.value = mode
  clearErrors()
}

// ==================== 邮箱注册状态 ====================
const email = ref('')
const password = ref('')
const generatecode = ref('')
const showPassword = ref(false)
const emailLoading = ref(false)
const emailCodeCountdown = ref(0)
let emailCodeTimer = null

// ==================== 手机注册状态 ====================
const regPhoneNumber = ref('')
const regPhoneCode = ref('')
const regPhonePassword = ref('')
const showRegPhonePassword = ref(false)
const phoneLoading = ref(false)
const phoneCodeCountdown = ref(0)
let phoneCodeTimer = null

// ==================== 通用状态 ====================
const errorMessage = ref('')
const errors = ref({})

// ==================== 错误清除 ====================
const clearErrors = () => {
  errors.value = {}
  errorMessage.value = ''
}

// ==================== 切换到登录 ====================
const handleLoginClick = () => {
  emit('showLoginForm', true)
}

// ==================== 密码可见性切换 ====================
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

// ==================== 密码强度计算 ====================
const passwordStrengthLevel = computed(() => {
  if (!password.value || password.value.length < 8) return 0
  const hasLetter = /[a-zA-Z]/.test(password.value)
  const hasNumber = /\d/.test(password.value)
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password.value)
  const score = (hasLetter ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSymbol ? 1 : 0)
  return Math.min(score, 3)
})

const strengthLabel = computed(() => {
  const labels = ['', '弱', '中等', '强']
  return labels[passwordStrengthLevel.value] || ''
})

const strengthLabelClass = computed(() => {
  const colors = ['', 'text-red-400 dark:text-red-300', 'text-yellow-500 dark:text-yellow-400', 'text-green-500 dark:text-green-400']
  return colors[passwordStrengthLevel.value] || ''
})

const strengthBarClass = (index) => {
  const level = passwordStrengthLevel.value
  if (level === 0) return 'bg-gray-200 dark:bg-zinc-700'
  const colors = ['', 'bg-red-400', 'bg-yellow-400', 'bg-green-400']
  return index <= level ? colors[level] : 'bg-gray-200'
}

const getPasswordBorderClass = () => {
  if (errors.value.password) return 'border-red-300 focus:border-red-400 focus:ring-red-300 dark:border-red-400/70 dark:focus:ring-red-400/50'
  if (!password.value) return 'border-amber-200 focus:border-amber-400 focus:ring-amber-300 dark:border-zinc-600/60 dark:focus:ring-amber-400/50'
  const map = {
    0: 'border-amber-200 focus:border-amber-400 focus:ring-amber-300 dark:border-zinc-600/60 dark:focus:ring-amber-400/50',
    1: 'border-red-300 focus:border-red-400 focus:ring-red-300 dark:border-red-400/70 dark:focus:ring-red-400/50',
    2: 'border-yellow-300 focus:border-yellow-400 focus:ring-yellow-300 dark:border-yellow-500/70 dark:focus:ring-yellow-400/50',
    3: 'border-green-300 focus:border-green-400 focus:ring-green-300 dark:border-green-500/70 dark:focus:ring-green-400/50',
  }
  return map[passwordStrengthLevel.value] || 'border-amber-200 focus:border-amber-400 focus:ring-amber-300 dark:border-zinc-600/60 dark:focus:ring-amber-400/50'
}

const handlePasswordInput = () => {
  if (errors.value.password) {
    errors.value.password = ''
  }
}

// ==================== 邮箱验证码发送 ====================
const handleSendEmailCode = async () => {
  errors.value.email = ''

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    errors.value.email = '请输入有效的邮箱地址'
    return
  }

  emailLoading.value = true
  try {
    // 后端发送邮件验证码（Identity：POST /api/identity/ready/email-verifications）
    await sendEmailCode(email.value)
    startEmailCodeCountdown()
  } catch (error) {
    errorMessage.value = error.response && error.response.data && error.response.data.error
      ? error.response.data.error
      : '验证码发送失败，请稍后重试'
    console.error('发送邮箱验证码错误:', error)
  } finally {
    emailLoading.value = false
  }
}

const startEmailCodeCountdown = () => {
  emailCodeCountdown.value = 60
  if (emailCodeTimer) clearInterval(emailCodeTimer)
  emailCodeTimer = setInterval(() => {
    emailCodeCountdown.value--
    if (emailCodeCountdown.value <= 0) {
      clearInterval(emailCodeTimer)
      emailCodeTimer = null
    }
  }, 1000)
}

// ==================== 邮箱注册提交 ====================
const handleEmailRegister = async () => {
  errors.value = {}
  errorMessage.value = ''

  let isValid = true
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(email.value)) {
    errors.value.email = '请输入有效的邮箱地址'
    isValid = false
  }

  if (!password.value || password.value.length < 8) {
    errors.value.password = '密码长度至少为8位'
    isValid = false
  }

  if (!/^[A-Za-z0-9]{9}$/.test(generatecode.value)) {
    errors.value.generatecode = '请输入 9 位验证码（数字和字母混合）'
    isValid = false
  }

  if (!isValid) return

  emailLoading.value = true

  try {
    // 后端注册：POST /api/identity/ready/Register { userEmail, userPassword, verificationCode }
    await register({
      email: email.value,
      password: password.value,
      code: generatecode.value
    })
    // HTTP 200 即注册成功（响应 { message: '注册成功' }）
    router.push('/login')
  } catch (error) {
    const data = error.response && error.response.data
    // 后端业务失败返回 400 + 字符串/对象（如 '用户已存在'）
    errorMessage.value = (typeof data === 'string' && data)
      || (data && (data.error || data.message))
      || '注册失败，请稍后重试'
  } finally {
    emailLoading.value = false
  }
}

// ==================== 手机验证码倒计时 ====================
const startPhoneCodeCountdown = () => {
  phoneCodeCountdown.value = 60
  if (phoneCodeTimer) clearInterval(phoneCodeTimer)
  phoneCodeTimer = setInterval(() => {
    phoneCodeCountdown.value--
    if (phoneCodeCountdown.value <= 0) {
      clearInterval(phoneCodeTimer)
      phoneCodeTimer = null
    }
  }, 1000)
}

// ==================== 发送手机验证码 ====================
const sendPhoneCode = () => {
  errors.value.regPhoneNumber = ''

  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(regPhoneNumber.value)) {
    errors.value.regPhoneNumber = '请输入有效的手机号码'
    return
  }

  phoneLoading.value = true

  try {
    console.log('发送手机验证码到:', regPhoneNumber.value)
    startPhoneCodeCountdown()
  } catch (error) {
    errorMessage.value = '验证码发送失败，请稍后重试'
    console.error('发送手机验证码错误:', error)
  } finally {
    phoneLoading.value = false
  }
}

// ==================== 手机注册提交 ====================
const handlePhoneRegister = async () => {
  errors.value = {}
  errorMessage.value = ''

  let isValid = true
  const phoneRegex = /^1[3-9]\d{9}$/

  if (!phoneRegex.test(regPhoneNumber.value)) {
    errors.value.regPhoneNumber = '请输入有效的手机号码'
    isValid = false
  }

  if (!regPhoneCode.value || regPhoneCode.value.length < 4) {
    errors.value.regPhoneCode = '请输入正确的验证码'
    isValid = false
  }

  if (!regPhonePassword.value || regPhonePassword.value.length < 8) {
    errors.value.regPhonePassword = '密码长度至少为8位'
    isValid = false
  }

  if (!isValid) return

  phoneLoading.value = true

  try {
    console.log('手机注册', {
      phone: regPhoneNumber.value,
      code: regPhoneCode.value,
      password: regPhonePassword.value
    })

    // TODO: 对接手机注册API
    // const response = await phoneRegister({
    //   phone: regPhoneNumber.value,
    //   code: regPhoneCode.value,
    //   password: regPhonePassword.value,
    // })
    // if (response.data && response.data.code === 200) router.push('/login')
  } catch (error) {
    errorMessage.value = '手机注册失败，请稍后重试'
    console.error('手机注册错误:', error)
  } finally {
    phoneLoading.value = false
  }
}

// ==================== 第三方注册回调 ====================
const handleThirdPartyRegister = (provider) => {
  console.log(`第三方注册: ${provider}`)
  // TODO: 对接各平台 OAuth 注册
  // { provider, userInfo: { ... } }
}
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
