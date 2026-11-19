// PNG encoding, download and clipboard (AR-57, UX-EX-05).
import type { Canvas2D } from './overlay.ts'

/** Encodes a canvas as PNG through convertToBlob (OffscreenCanvas) or toBlob. */
export function canvasToPng(canvas: Canvas2D): Promise<Blob> {
  if ('convertToBlob' in canvas) return canvas.convertToBlob({ type: 'image/png' })
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG encoding failed'))), 'image/png')
  })
}

/** Starts a browser download of `blob` under `fileName`. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** True when the Clipboard API accepts image/png; otherwise the dialog hides "Copy image". */
export function canCopyImage(): boolean {
  if (typeof navigator === 'undefined' || typeof ClipboardItem === 'undefined') return false
  if (!navigator.clipboard || typeof navigator.clipboard.write !== 'function') return false
  const supports = (ClipboardItem as unknown as { supports?: (type: string) => boolean }).supports
  return typeof supports === 'function' ? supports('image/png') : true
}

export async function copyImage(blob: Blob): Promise<void> {
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}
