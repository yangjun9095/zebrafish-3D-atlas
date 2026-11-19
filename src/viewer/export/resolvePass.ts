// Resolve pass of the export pipeline (AR-51, AR-53, AR-55): samples the 2x linear HalfFloat tile
// with one bilinear tap per output pixel (an exact 2 by 2 box filter), un-premultiplies in linear
// light, applies the renderer's tone mapping and the sRGB transfer, and writes straight-alpha
// bytes. The shader is the OutputShader of three/addons with the two extra steps.
import {
  ACESFilmicToneMapping, AgXToneMapping, CineonToneMapping, ColorManagement, CustomToneMapping, LinearToneMapping,
  NeutralToneMapping, RawShaderMaterial, ReinhardToneMapping, SRGBTransfer, Vector2,
} from 'three'
import type { Texture, WebGLRenderer, WebGLRenderTarget } from 'three'
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js'

// The two shaders below follow the OutputShader of three.js
// (node_modules/three/examples/jsm/shaders/OutputShader.js), with two extra steps. three.js
// ships under the MIT licence, and the notice travels with the copy:
//
//   The MIT License
//
//   Copyright © 2010-2026 three.js authors
//
//   Permission is hereby granted, free of charge, to any person obtaining a copy
//   of this software and associated documentation files (the "Software"), to deal
//   in the Software without restriction, including without limitation the rights
//   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//   copies of the Software, and to permit persons to whom the Software is
//   furnished to do so, subject to the following conditions:
//
//   The above copyright notice and this permission notice shall be included in
//   all copies or substantial portions of the Software.
//
//   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//   THE SOFTWARE.
//
// public/THIRD-PARTY-NOTICES.txt carries the same notice for every bundled package.
const VERTEX = /* glsl */ `
precision highp float;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
attribute vec3 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

const FRAGMENT = /* glsl */ `
precision highp float;
uniform sampler2D tDiffuse;
uniform vec2 uvScale;
#include <tonemapping_pars_fragment>
#include <colorspace_pars_fragment>
varying vec2 vUv;
void main() {
  vec4 c = texture2D(tDiffuse, vUv * uvScale);
  // Straight alpha in linear light (AR-55), before tone mapping and the transfer.
  if (c.a > 0.0) c.rgb /= c.a;
  #ifdef LINEAR_TONE_MAPPING
    c.rgb = LinearToneMapping(c.rgb);
  #elif defined( REINHARD_TONE_MAPPING )
    c.rgb = ReinhardToneMapping(c.rgb);
  #elif defined( CINEON_TONE_MAPPING )
    c.rgb = CineonToneMapping(c.rgb);
  #elif defined( ACES_FILMIC_TONE_MAPPING )
    c.rgb = ACESFilmicToneMapping(c.rgb);
  #elif defined( AGX_TONE_MAPPING )
    c.rgb = AgXToneMapping(c.rgb);
  #elif defined( NEUTRAL_TONE_MAPPING )
    c.rgb = NeutralToneMapping(c.rgb);
  #elif defined( CUSTOM_TONE_MAPPING )
    c.rgb = CustomToneMapping(c.rgb);
  #endif
  #ifdef SRGB_TRANSFER
    c = sRGBTransferOETF(c);
  #endif
  gl_FragColor = c;
}`

const DEFINES: [number, string][] = [
  [LinearToneMapping, 'LINEAR_TONE_MAPPING'],
  [ReinhardToneMapping, 'REINHARD_TONE_MAPPING'],
  [CineonToneMapping, 'CINEON_TONE_MAPPING'],
  [ACESFilmicToneMapping, 'ACES_FILMIC_TONE_MAPPING'],
  [AgXToneMapping, 'AGX_TONE_MAPPING'],
  [NeutralToneMapping, 'NEUTRAL_TONE_MAPPING'],
  [CustomToneMapping, 'CUSTOM_TONE_MAPPING'],
]

export class ResolvePass {
  private readonly material: RawShaderMaterial
  private readonly quad: FullScreenQuad

  constructor(renderer: WebGLRenderer) {
    const defines: Record<string, string> = {}
    if (ColorManagement.getTransfer(renderer.outputColorSpace) === SRGBTransfer) defines.SRGB_TRANSFER = ''
    for (const [mode, name] of DEFINES) if (renderer.toneMapping === mode) defines[name] = ''
    this.material = new RawShaderMaterial({
      name: 'AtlasExportResolve',
      defines,
      uniforms: {
        tDiffuse: { value: null as Texture | null },
        uvScale: { value: new Vector2(1, 1) },
        toneMappingExposure: { value: renderer.toneMappingExposure },
      },
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      depthTest: false,
      depthWrite: false,
      transparent: false,
    })
    this.quad = new FullScreenQuad(this.material)
  }

  /** Resolves the `[0, uvScale]` region of `source` into the current viewport of `target`. */
  render(renderer: WebGLRenderer, source: WebGLRenderTarget, target: WebGLRenderTarget, uvScale: { x: number; y: number }): void {
    this.material.uniforms.tDiffuse.value = source.texture
    ;(this.material.uniforms.uvScale.value as Vector2).set(uvScale.x, uvScale.y)
    this.material.uniforms.toneMappingExposure.value = renderer.toneMappingExposure
    renderer.setRenderTarget(target)
    renderer.setClearColor(0x000000, 0)
    renderer.clear(true, false, false)
    this.quad.render(renderer)
  }

  dispose(): void {
    this.material.dispose()
    this.quad.dispose()
  }
}
