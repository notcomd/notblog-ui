import './input.css';
// 特色字体（fontsource 离线打包，避免 Google Fonts 在境内不可用）：
// Fraunces 可变衬线 —— 品牌/标题展示字（软衬线、烘焙暖感、横画有性格）；Outfit 可变几何 —— 数字/英文数据字
import '@fontsource-variable/fraunces';
import '@fontsource-variable/outfit';
import App from './App.vue';
import router from './router';
import { createApp } from 'vue';
import { createPinia } from 'pinia';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');
