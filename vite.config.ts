import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

/*
   تقسيم الحزم متروك لـ Rollup عمداً.

   تجميعها يدوياً (react وradix وquery في مجموعات) كسر التطبيق فعلياً —
   شاشة بيضاء و«Cannot access before initialization» — لأن بين المكتبات
   استيرادات متبادلة يرتّبها Rollup وحده ترتيباً صحيحاً. وحتى تعيين
   leaflet لحزمة باسمها كان يرفعها إلى الحزمة الأولى بدل أن يؤجّلها.

   ما يفصل المكتبة فعلاً هو ألّا يستوردها شيء استيراداً ثابتاً: الخرائط
   وماسح الرموز يُستوردان عبر `lazy` وحده، فيبنيهما Rollup حزماً مؤجّلة
   لا تُحمَّل إلا في صفحاتها.
*/

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      /*
         التحديث تلقائي بلا سؤال المستخدم.

         هذا هو الفرق بين تطبيق يعلق على نسخة قديمة وآخر لا يعلق: عامل
         الخدمة الجديد يحلّ محلّ القديم فور تحميله بدل أن ينتظر إغلاق كل
         تبويبات الموقع، فيرى الزائر الإصدار الجديد من الزيارة التالية.
      */
      registerType: "autoUpdate",

      includeAssets: ["brand/favicon.png"],

      manifest: {
        name: "صك — جوازك السياحي",
        short_name: "صك",
        description:
          "الرفيق الرقمي لجوازك السياحي — استكشف، امسح، اجمع الطوابع.",
        lang: "ar",
        dir: "rtl",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#fbf7f0",
        theme_color: "#0f2a24",
        icons: [
          { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            /* أندرويد يقصّ الأيقونة بأشكال مختلفة — هذه نسخة محشوّة تنجو من القصّ. */
            src: "/brand/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      workbox: {
        /*
           يُحفَظ ناتج البناء وحده: ملفات JS وCSS أسماؤها تحمل بصمة محتواها،
           فأي إصدار جديد يحمل أسماء جديدة ولا يمكن أن يُقدَّم ملف قديم مكان
           جديد. ولا قاعدة هنا لنداءات الـ API إطلاقاً — البيانات تأتي من
           الشبكة دائماً، فلا يظهر للمستخدم تقدّمٌ قديم أو محتوى محذوف.
        */
        globPatterns: ["**/*.{js,css,html,woff2,png,svg}"],

        /* يمسح مخزون الإصدارات السابقة فلا تتراكم في جهاز الزائر. */
        cleanupOutdatedCaches: true,

        /* الإصدار الجديد يبدأ خدمة التبويبات المفتوحة فوراً. */
        clientsClaim: true,
        skipWaiting: true,

        /* مسارات التطبيق تُخدَم من index.html — عدا الـ API والملفات المرفوعة. */
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//],
      },

      devOptions: {
        /* مطفأ في التطوير: عامل خدمة أثناء العمل يربك إعادة التحميل السريع. */
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      // يسمح بعرض صور ومقاطع الباك اند مباشرة أثناء التطوير
      "/uploads": {
        target: process.env.VITE_PROXY_TARGET || "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
