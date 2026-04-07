import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dir = path.dirname(fileURLToPath(import.meta.url))

function copyWasmPlugin(): Plugin {
  return {
    name: 'copy-wasm',
    writeBundle(options) {
      const outDir = options.dir ?? path.resolve(__dir, 'dist')
      const assetsDir = path.join(outDir, 'assets')
      fs.mkdirSync(assetsDir, { recursive: true })
      const llamaWasm = path.resolve(__dir, 'node_modules/@runanywhere/web-llamacpp/wasm')
      for (const file of [
        'racommons-llamacpp.wasm', 'racommons-llamacpp.js',
        'racommons-llamacpp-webgpu.wasm', 'racommons-llamacpp-webgpu.js',
      ]) {
        const src = path.join(llamaWasm, file)
        if (fs.existsSync(src)) fs.copyFileSync(src, path.join(assetsDir, file))
      }
      const onnxWasm = path.resolve(__dir, 'node_modules/@runanywhere/web-onnx/wasm')
      const sherpaDir = path.join(onnxWasm, 'sherpa')
      const sherpaOut = path.join(assetsDir, 'sherpa')
      if (fs.existsSync(sherpaDir)) {
        fs.mkdirSync(sherpaOut, { recursive: true })
        for (const f of fs.readdirSync(sherpaDir)) {
          fs.copyFileSync(path.join(sherpaDir, f), path.join(sherpaOut, f))
        }
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), copyWasmPlugin()],
  server: {
    port: 5173,
    https: false, // keep http — localhost is allowed for Web Speech API
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  assetsInclude: ['**/*.wasm'],
  worker: { format: 'es' },
  optimizeDeps: {
    exclude: ['@runanywhere/web-llamacpp', '@runanywhere/web-onnx'],
  },
})
