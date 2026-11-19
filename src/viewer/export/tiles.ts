// Tile renderer of the export pipeline (AR-51, AR-53, AR-55, AR-58): one linear HalfFloat target
// at twice the tile edge, one byte target at the tile edge, `camera.setViewOffset` per tile,
// `readRenderTargetPixelsAsync`, rows flipped into one top-down RGBA buffer. Never more than one
// tile pair is allocated; both targets are disposed after the last tile.
import {
  Color, HalfFloatType, LinearFilter, LinearSRGBColorSpace, NearestFilter, NoColorSpace, RGBAFormat, UnsignedByteType, WebGLRenderTarget,
} from 'three'
import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import { SUPERSAMPLE, blitTile, planTiles } from './plan.ts'
import type { Tile } from './plan.ts'
import { ResolvePass } from './resolvePass.ts'

export interface TileContext {
  gl: WebGLRenderer
  scene: Scene
  /** The export camera: a clone of the live camera; its view offset is rewritten per tile. */
  camera: PerspectiveCamera
  width: number
  height: number
  /** Offset of the whole frustum in output px: the live reserved-rectangle offset of AR-42, scaled. */
  frustumOffset: { x: number; y: number }
  tileEdge: number
  transparent: boolean
  onProgress?(done: number, total: number): void
}

/** Sets the sub-frustum of one tile, or the whole frame when `tile` is null (AR-53). */
export function applyViewOffset(ctx: Pick<TileContext, 'camera' | 'width' | 'height' | 'frustumOffset'>, tile: Tile | null): void {
  const { camera, width, height, frustumOffset: o } = ctx
  if (tile) camera.setViewOffset(width, height, o.x + tile.x, o.y + tile.y, tile.width, tile.height)
  else if (o.x !== 0 || o.y !== 0) camera.setViewOffset(width, height, o.x, o.y, width, height)
  else camera.clearViewOffset()
  camera.updateProjectionMatrix()
}

function setRegion(target: WebGLRenderTarget, w: number, h: number): void {
  target.viewport.set(0, 0, w, h)
  target.scissor.set(0, 0, w, h)
  target.scissorTest = true
}

const savedClear = new Color()

/** Renders the scene tile by tile and returns W by H straight-alpha sRGB bytes, top row first. */
export async function renderColourTiles(ctx: TileContext): Promise<Uint8ClampedArray<ArrayBuffer>> {
  const { gl, scene, camera, width, height, tileEdge } = ctx
  const E = tileEdge
  const linear = new WebGLRenderTarget(E * SUPERSAMPLE, E * SUPERSAMPLE, {
    type: HalfFloatType, format: RGBAFormat, colorSpace: LinearSRGBColorSpace, depthBuffer: true, stencilBuffer: false,
    generateMipmaps: false, minFilter: LinearFilter, magFilter: LinearFilter, samples: 0,
  })
  const bytes = new WebGLRenderTarget(E, E, {
    type: UnsignedByteType, format: RGBAFormat, colorSpace: NoColorSpace, depthBuffer: false, stencilBuffer: false,
    generateMipmaps: false, minFilter: NearestFilter, magFilter: NearestFilter, samples: 0,
  })
  const resolve = new ResolvePass(gl)
  const image = new Uint8ClampedArray(width * height * 4)
  const tiles = planTiles(width, height, E)
  const previousBackground = scene.background
  gl.getClearColor(savedClear)
  const savedAlpha = gl.getClearAlpha()
  const buffer = new Uint8Array(E * E * 4)
  try {
    // No scene background in any export: the tile carries straight alpha and composeImage paints the
    // theme colour in sRGB, so an opaque export matches the screen instead of a tone-mapped clear (AR-55).
    scene.background = null
    for (const [i, tile] of tiles.entries()) {
      applyViewOffset(ctx, tile)
      setRegion(linear, tile.width * SUPERSAMPLE, tile.height * SUPERSAMPLE)
      gl.setRenderTarget(linear)
      gl.setClearColor(0x000000, 0)
      gl.clear(true, true, true)
      gl.render(scene, camera)
      setRegion(bytes, tile.width, tile.height)
      resolve.render(gl, linear, bytes, { x: tile.width / E, y: tile.height / E })
      gl.setRenderTarget(null)
      const rows = buffer.subarray(0, tile.width * tile.height * 4)
      await gl.readRenderTargetPixelsAsync(bytes, 0, 0, tile.width, tile.height, rows)
      blitTile(image, width, tile, rows)
      ctx.onProgress?.(i + 1, tiles.length)
    }
  } finally {
    gl.setRenderTarget(null)
    gl.setClearColor(savedClear, savedAlpha)
    scene.background = previousBackground
    applyViewOffset(ctx, null)
    resolve.dispose()
    linear.dispose()
    bytes.dispose()
  }
  return image
}

/** Renders `maskScene` (white silhouettes on transparent black) and returns W by H coverage bytes. */
export async function renderMaskTiles(ctx: TileContext, maskScene: Scene): Promise<Uint8Array> {
  const { gl, camera, width, height, tileEdge } = ctx
  const E = tileEdge
  const target = new WebGLRenderTarget(E, E, {
    type: UnsignedByteType, format: RGBAFormat, colorSpace: NoColorSpace, depthBuffer: true, stencilBuffer: false,
    generateMipmaps: false, minFilter: NearestFilter, magFilter: NearestFilter, samples: 0,
  })
  const mask = new Uint8Array(width * height)
  const tiles = planTiles(width, height, E)
  gl.getClearColor(savedClear)
  const savedAlpha = gl.getClearAlpha()
  const buffer = new Uint8Array(E * E * 4)
  try {
    for (const tile of tiles) {
      applyViewOffset(ctx, tile)
      setRegion(target, tile.width, tile.height)
      gl.setRenderTarget(target)
      gl.setClearColor(0x000000, 0)
      gl.clear(true, true, true)
      gl.render(maskScene, camera)
      gl.setRenderTarget(null)
      const rows = buffer.subarray(0, tile.width * tile.height * 4)
      await gl.readRenderTargetPixelsAsync(target, 0, 0, tile.width, tile.height, rows)
      for (let j = 0; j < tile.height; j++) {
        const srcRow = tile.height - 1 - j
        const dst = (tile.y + j) * width + tile.x
        for (let x = 0; x < tile.width; x++) mask[dst + x] = rows[(srcRow * tile.width + x) * 4 + 3] > 127 ? 1 : 0
      }
    }
  } finally {
    gl.setRenderTarget(null)
    gl.setClearColor(savedClear, savedAlpha)
    applyViewOffset(ctx, null)
    target.dispose()
  }
  return mask
}
