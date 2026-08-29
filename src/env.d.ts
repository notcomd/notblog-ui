/// <reference types="node" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}

interface ImportMetaEnv {
  readonly VUE_APP_API_BASE_URL?: string;
  readonly VUE_APP_TURN_URL?: string;
  readonly VUE_APP_TURN_USERNAME?: string;
  readonly VUE_APP_TURN_CREDENTIAL?: string;
  readonly VUE_APP_TURN_REST_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// vue-cli 注入的构建期环境变量
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: string;
    VUE_APP_API_BASE_URL?: string;
    VUE_APP_TURN_URL?: string;
    VUE_APP_TURN_USERNAME?: string;
    VUE_APP_TURN_CREDENTIAL?: string;
    VUE_APP_TURN_REST_URL?: string;
  }
}

// 静态资源导入
declare module '*.png'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.gif'
declare module '*.svg'
declare module '*.webp'

// 缺少类型声明的第三方模块（@microsoft/signalr 已自带完整类型声明，无需 shim）
declare module 'cropperjs';
