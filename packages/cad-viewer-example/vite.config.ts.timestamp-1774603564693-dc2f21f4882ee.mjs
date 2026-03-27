// vite.config.ts
import { resolve } from "path";
import { defineConfig } from "file:///D:/workspace/test/cad-viewer-copy/node_modules/.pnpm/vite@5.4.19_@types+node@20.19.9_sass@1.95.1_terser@5.43.1/node_modules/vite/dist/node/index.js";
import { viteStaticCopy } from "file:///D:/workspace/test/cad-viewer-copy/node_modules/.pnpm/vite-plugin-static-copy@3.1_3f54981606a2fe3443df22b1fdd99835/node_modules/vite-plugin-static-copy/dist/index.js";
import svgLoader from "file:///D:/workspace/test/cad-viewer-copy/node_modules/.pnpm/vite-svg-loader@5.1.0_vue@3.5.18_typescript@5.8.3_/node_modules/vite-svg-loader/index.js";
import { visualizer } from "file:///D:/workspace/test/cad-viewer-copy/node_modules/.pnpm/rollup-plugin-visualizer@5.14.0_rollup@4.45.1/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
import vue from "file:///D:/workspace/test/cad-viewer-copy/node_modules/.pnpm/@vitejs+plugin-vue@5.2.4_vi_e3f3fb22ab8a5875a2fe2dc836f77d4c/node_modules/@vitejs/plugin-vue/dist/index.mjs";
var __vite_injected_original_dirname = "D:\\workspace\\test\\cad-viewer-copy\\packages\\cad-viewer-example";
var vite_config_default = defineConfig(({ command, mode }) => {
  const aliases = [];
  if (command === "serve") {
    aliases.push({
      find: /^@mlightcad\/(svg-renderer|three-renderer|cad-simple-viewer|cad-viewer)$/,
      replacement: resolve(__vite_injected_original_dirname, "../$1/src")
    });
  }
  const plugins = [
    vue(),
    svgLoader(),
    viteStaticCopy({
      targets: [
        {
          src: "./node_modules/@mlightcad/data-model/dist/dxf-parser-worker.js",
          dest: "assets"
        },
        {
          src: "./node_modules/@mlightcad/cad-simple-viewer/dist/*-worker.js",
          dest: "assets"
        }
      ]
    })
  ];
  if (mode === "analyze") {
    plugins.push(visualizer());
  }
  return {
    base: "./",
    resolve: {
      alias: aliases
    },
    optimizeDeps: {
      force: command === "serve"
      // Force re-optimization in dev mode to fix stale cache issues
    },
    build: {
      outDir: "dist",
      modulePreload: false,
      rollupOptions: {
        // Main entry point for the app
        input: {
          main: resolve(__vite_injected_original_dirname, "index.html")
        }
      }
    },
    plugins
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFx3b3Jrc3BhY2VcXFxcdGVzdFxcXFxjYWQtdmlld2VyLWNvcHlcXFxccGFja2FnZXNcXFxcY2FkLXZpZXdlci1leGFtcGxlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFx3b3Jrc3BhY2VcXFxcdGVzdFxcXFxjYWQtdmlld2VyLWNvcHlcXFxccGFja2FnZXNcXFxcY2FkLXZpZXdlci1leGFtcGxlXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi93b3Jrc3BhY2UvdGVzdC9jYWQtdmlld2VyLWNvcHkvcGFja2FnZXMvY2FkLXZpZXdlci1leGFtcGxlL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnXHJcbmltcG9ydCB7IEFsaWFzLCBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xyXG5pbXBvcnQgeyB2aXRlU3RhdGljQ29weSB9IGZyb20gJ3ZpdGUtcGx1Z2luLXN0YXRpYy1jb3B5J1xyXG5pbXBvcnQgc3ZnTG9hZGVyIGZyb20gJ3ZpdGUtc3ZnLWxvYWRlcidcclxuaW1wb3J0IHsgdmlzdWFsaXplciB9IGZyb20gJ3JvbGx1cC1wbHVnaW4tdmlzdWFsaXplcidcclxuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgY29tbWFuZCwgbW9kZSB9KSA9PiB7XHJcbiAgY29uc3QgYWxpYXNlczogQWxpYXNbXSA9IFtdXHJcbiAgaWYgKGNvbW1hbmQgPT09ICdzZXJ2ZScpIHtcclxuICAgIGFsaWFzZXMucHVzaCh7XHJcbiAgICAgIGZpbmQ6IC9eQG1saWdodGNhZFxcLyhzdmctcmVuZGVyZXJ8dGhyZWUtcmVuZGVyZXJ8Y2FkLXNpbXBsZS12aWV3ZXJ8Y2FkLXZpZXdlcikkLyxcclxuICAgICAgcmVwbGFjZW1lbnQ6IHJlc29sdmUoX19kaXJuYW1lLCAnLi4vJDEvc3JjJylcclxuICAgIH0pXHJcbiAgfVxyXG5cclxuICBjb25zdCBwbHVnaW5zID0gW1xyXG4gICAgdnVlKCksXHJcbiAgICBzdmdMb2FkZXIoKSxcclxuICAgIHZpdGVTdGF0aWNDb3B5KHtcclxuICAgICAgdGFyZ2V0czogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIHNyYzogJy4vbm9kZV9tb2R1bGVzL0BtbGlnaHRjYWQvZGF0YS1tb2RlbC9kaXN0L2R4Zi1wYXJzZXItd29ya2VyLmpzJyxcclxuICAgICAgICAgIGRlc3Q6ICdhc3NldHMnXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBzcmM6ICcuL25vZGVfbW9kdWxlcy9AbWxpZ2h0Y2FkL2NhZC1zaW1wbGUtdmlld2VyL2Rpc3QvKi13b3JrZXIuanMnLFxyXG4gICAgICAgICAgZGVzdDogJ2Fzc2V0cydcclxuICAgICAgICB9XHJcbiAgICAgIF1cclxuICAgIH0pXHJcbiAgXVxyXG5cclxuICAvLyBBZGQgY29uZGl0aW9uYWwgcGx1Z2luc1xyXG4gIGlmIChtb2RlID09PSAnYW5hbHl6ZScpIHtcclxuICAgIHBsdWdpbnMucHVzaCh2aXN1YWxpemVyKCkpXHJcbiAgfVxyXG5cclxuICByZXR1cm4ge1xyXG4gICAgYmFzZTogJy4vJyxcclxuICAgIHJlc29sdmU6IHtcclxuICAgICAgYWxpYXM6IGFsaWFzZXNcclxuICAgIH0sXHJcbiAgICBvcHRpbWl6ZURlcHM6IHtcclxuICAgICAgZm9yY2U6IGNvbW1hbmQgPT09ICdzZXJ2ZScgLy8gRm9yY2UgcmUtb3B0aW1pemF0aW9uIGluIGRldiBtb2RlIHRvIGZpeCBzdGFsZSBjYWNoZSBpc3N1ZXNcclxuICAgIH0sXHJcbiAgICBidWlsZDoge1xyXG4gICAgICBvdXREaXI6ICdkaXN0JyxcclxuICAgICAgbW9kdWxlUHJlbG9hZDogZmFsc2UsXHJcbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgICAvLyBNYWluIGVudHJ5IHBvaW50IGZvciB0aGUgYXBwXHJcbiAgICAgICAgaW5wdXQ6IHtcclxuICAgICAgICAgIG1haW46IHJlc29sdmUoX19kaXJuYW1lLCAnaW5kZXguaHRtbCcpXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgcGx1Z2luczogcGx1Z2luc1xyXG4gIH1cclxufSlcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFxWCxTQUFTLGVBQWU7QUFDN1ksU0FBZ0Isb0JBQW9CO0FBQ3BDLFNBQVMsc0JBQXNCO0FBQy9CLE9BQU8sZUFBZTtBQUN0QixTQUFTLGtCQUFrQjtBQUMzQixPQUFPLFNBQVM7QUFMaEIsSUFBTSxtQ0FBbUM7QUFPekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxTQUFTLEtBQUssTUFBTTtBQUNqRCxRQUFNLFVBQW1CLENBQUM7QUFDMUIsTUFBSSxZQUFZLFNBQVM7QUFDdkIsWUFBUSxLQUFLO0FBQUEsTUFDWCxNQUFNO0FBQUEsTUFDTixhQUFhLFFBQVEsa0NBQVcsV0FBVztBQUFBLElBQzdDLENBQUM7QUFBQSxFQUNIO0FBRUEsUUFBTSxVQUFVO0FBQUEsSUFDZCxJQUFJO0FBQUEsSUFDSixVQUFVO0FBQUEsSUFDVixlQUFlO0FBQUEsTUFDYixTQUFTO0FBQUEsUUFDUDtBQUFBLFVBQ0UsS0FBSztBQUFBLFVBQ0wsTUFBTTtBQUFBLFFBQ1I7QUFBQSxRQUNBO0FBQUEsVUFDRSxLQUFLO0FBQUEsVUFDTCxNQUFNO0FBQUEsUUFDUjtBQUFBLE1BQ0Y7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBR0EsTUFBSSxTQUFTLFdBQVc7QUFDdEIsWUFBUSxLQUFLLFdBQVcsQ0FBQztBQUFBLEVBQzNCO0FBRUEsU0FBTztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLElBQ1Q7QUFBQSxJQUNBLGNBQWM7QUFBQSxNQUNaLE9BQU8sWUFBWTtBQUFBO0FBQUEsSUFDckI7QUFBQSxJQUNBLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxNQUNSLGVBQWU7QUFBQSxNQUNmLGVBQWU7QUFBQTtBQUFBLFFBRWIsT0FBTztBQUFBLFVBQ0wsTUFBTSxRQUFRLGtDQUFXLFlBQVk7QUFBQSxRQUN2QztBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQTtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
