// vite.config.ts
import {
  defineConfig
} from "file:///D:/workspace/cad/cad-viewer/node_modules/.pnpm/vite@5.4.19_@types+node@20.19.9_sass@1.89.2_terser@5.43.1/node_modules/vite/dist/node/index.js";
import svgLoader from "file:///D:/workspace/cad/cad-viewer/node_modules/.pnpm/vite-svg-loader@5.1.0_vue@3.5.18_typescript@5.8.3_/node_modules/vite-svg-loader/index.js";
import { visualizer } from "file:///D:/workspace/cad/cad-viewer/node_modules/.pnpm/rollup-plugin-visualizer@5.14.0_rollup@4.45.1/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
import peerDepsExternal from "file:///D:/workspace/cad/cad-viewer/node_modules/.pnpm/rollup-plugin-peer-deps-external@2.2.4_rollup@4.45.1/node_modules/rollup-plugin-peer-deps-external/dist/rollup-plugin-peer-deps-external.js";
import vue from "file:///D:/workspace/cad/cad-viewer/node_modules/.pnpm/@vitejs+plugin-vue@5.2.4_vi_a55c4d2df086157536678438408b28a4/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import dts from "file:///D:/workspace/cad/cad-viewer/node_modules/.pnpm/vite-plugin-dts@4.5.4_@type_3c4449cd6122659e0db832f03b237a7a/node_modules/vite-plugin-dts/dist/index.mjs";
import { libInjectCss } from "file:///D:/workspace/cad/cad-viewer/node_modules/.pnpm/vite-plugin-lib-inject-css@_2f131a25dbf25dd5fb593c078beae39c/node_modules/vite-plugin-lib-inject-css/dist/index.mjs";
var vite_config_default = defineConfig(({ mode }) => {
  const plugins = [
    vue(),
    svgLoader(),
    libInjectCss(),
    peerDepsExternal(),
    dts({
      include: ["src/**/*.ts", "src/**/*.vue"],
      exclude: ["src/**/*.spec.ts", "src/**/*.test.ts"]
    })
  ];
  if (mode === "analyze") {
    plugins.push(visualizer());
  }
  return {
    outDir: "dist",
    build: {
      lib: {
        entry: "src/index.ts",
        name: "cad-viewer",
        fileName: "index",
        formats: ["es"]
      }
    },
    plugins
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFx3b3Jrc3BhY2VcXFxcY2FkXFxcXGNhZC12aWV3ZXJcXFxccGFja2FnZXNcXFxcY2FkLXZpZXdlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcd29ya3NwYWNlXFxcXGNhZFxcXFxjYWQtdmlld2VyXFxcXHBhY2thZ2VzXFxcXGNhZC12aWV3ZXJcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L3dvcmtzcGFjZS9jYWQvY2FkLXZpZXdlci9wYWNrYWdlcy9jYWQtdmlld2VyL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHtcclxuICBkZWZpbmVDb25maWcsXHJcbiAgdHlwZSBDb25maWdFbnYsXHJcbiAgdHlwZSBMaWJyYXJ5Rm9ybWF0cyxcclxuICBQbHVnaW5PcHRpb25cclxufSBmcm9tICd2aXRlJ1xyXG5pbXBvcnQgc3ZnTG9hZGVyIGZyb20gJ3ZpdGUtc3ZnLWxvYWRlcidcclxuaW1wb3J0IHsgdmlzdWFsaXplciB9IGZyb20gJ3JvbGx1cC1wbHVnaW4tdmlzdWFsaXplcidcclxuaW1wb3J0IHBlZXJEZXBzRXh0ZXJuYWwgZnJvbSAncm9sbHVwLXBsdWdpbi1wZWVyLWRlcHMtZXh0ZXJuYWwnXHJcbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJ1xyXG5pbXBvcnQgZHRzIGZyb20gJ3ZpdGUtcGx1Z2luLWR0cydcclxuaW1wb3J0IHsgbGliSW5qZWN0Q3NzIH0gZnJvbSAndml0ZS1wbHVnaW4tbGliLWluamVjdC1jc3MnXHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9OiBDb25maWdFbnYpID0+IHtcclxuICBjb25zdCBwbHVnaW5zOiBQbHVnaW5PcHRpb25bXSA9IFtcclxuICAgIHZ1ZSgpIGFzIFBsdWdpbk9wdGlvbixcclxuICAgIHN2Z0xvYWRlcigpLFxyXG4gICAgbGliSW5qZWN0Q3NzKCkgYXMgUGx1Z2luT3B0aW9uLFxyXG4gICAgcGVlckRlcHNFeHRlcm5hbCgpIGFzIFBsdWdpbk9wdGlvbixcclxuICAgIGR0cyh7XHJcbiAgICAgIGluY2x1ZGU6IFsnc3JjLyoqLyoudHMnLCAnc3JjLyoqLyoudnVlJ10sXHJcbiAgICAgIGV4Y2x1ZGU6IFsnc3JjLyoqLyouc3BlYy50cycsICdzcmMvKiovKi50ZXN0LnRzJ11cclxuICAgIH0pIGFzIFBsdWdpbk9wdGlvblxyXG4gIF1cclxuXHJcbiAgaWYgKG1vZGUgPT09ICdhbmFseXplJykge1xyXG4gICAgcGx1Z2lucy5wdXNoKHZpc3VhbGl6ZXIoKSlcclxuICB9XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBvdXREaXI6ICdkaXN0JyxcclxuICAgIGJ1aWxkOiB7XHJcbiAgICAgIGxpYjoge1xyXG4gICAgICAgIGVudHJ5OiAnc3JjL2luZGV4LnRzJyxcclxuICAgICAgICBuYW1lOiAnY2FkLXZpZXdlcicsXHJcbiAgICAgICAgZmlsZU5hbWU6ICdpbmRleCcsXHJcbiAgICAgICAgZm9ybWF0czogWydlcyddIGFzIExpYnJhcnlGb3JtYXRzW11cclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHBsdWdpbnNcclxuICB9XHJcbn0pXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBMlU7QUFBQSxFQUN6VTtBQUFBLE9BSUs7QUFDUCxPQUFPLGVBQWU7QUFDdEIsU0FBUyxrQkFBa0I7QUFDM0IsT0FBTyxzQkFBc0I7QUFDN0IsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sU0FBUztBQUNoQixTQUFTLG9CQUFvQjtBQUU3QixJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBaUI7QUFDbkQsUUFBTSxVQUEwQjtBQUFBLElBQzlCLElBQUk7QUFBQSxJQUNKLFVBQVU7QUFBQSxJQUNWLGFBQWE7QUFBQSxJQUNiLGlCQUFpQjtBQUFBLElBQ2pCLElBQUk7QUFBQSxNQUNGLFNBQVMsQ0FBQyxlQUFlLGNBQWM7QUFBQSxNQUN2QyxTQUFTLENBQUMsb0JBQW9CLGtCQUFrQjtBQUFBLElBQ2xELENBQUM7QUFBQSxFQUNIO0FBRUEsTUFBSSxTQUFTLFdBQVc7QUFDdEIsWUFBUSxLQUFLLFdBQVcsQ0FBQztBQUFBLEVBQzNCO0FBRUEsU0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsT0FBTztBQUFBLE1BQ0wsS0FBSztBQUFBLFFBQ0gsT0FBTztBQUFBLFFBQ1AsTUFBTTtBQUFBLFFBQ04sVUFBVTtBQUFBLFFBQ1YsU0FBUyxDQUFDLElBQUk7QUFBQSxNQUNoQjtBQUFBLElBQ0Y7QUFBQSxJQUNBO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
