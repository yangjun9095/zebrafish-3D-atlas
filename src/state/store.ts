// The one atlas store (AR-17): createAtlasStore wires the core modules into the slices; atlasStore is
// the app singleton; useAtlas and useAtlasShallow are the React selectors; readAtlas is the
// getState read for the frame loop (AR-15); subscribeAtlas is the transient subscription of AR-74.
import { useStoreWithEqualityFn } from 'zustand/traditional'
import { shallow } from 'zustand/vanilla/shallow'
import { presentIds } from '../core/presence.ts'
import { stageIndexAt } from '../core/timeAxis.ts'
import { composeAtlasStore } from './slices/compose.ts'
import type { AtlasStoreApi } from './slices/compose.ts'
import type { AtlasState, AtlasStore, StoreDeps } from './slices/types.ts'
import { attachPersistence, initialSettings, readKit } from './persist.ts'

export type {
  AtlasActions, AtlasState, AtlasStore, Bookmark, CameraPose, ProjectorScale, Quality, RailPreset, SectionAxis,
  SectionState, Sex, SlideKit, Speed, StepDir, StoreDeps, StripPosition, SystemId, Tessellation, Theme, ThemeSource,
  ToUrlOptions, Units, ViewPreset, WebglStatus, ZfaId,
} from './slices/types.ts'
export type { AtlasStoreApi } from './slices/compose.ts'
export {
  DEFAULT_TEMPERATURE_C, DEFAULT_TIME_HPF, DEFAULT_XRAY, MAX_SELECTION, SECTION_OFF, SPEEDS, TIME_MAX_HPF,
} from './slices/types.ts'

export const defaultDeps: StoreDeps = { stageIndexAt, presentIds, readKit }

/** A store with the real core modules. Tests pass init fields or replace single deps. */
export function createAtlasStore(init: Partial<AtlasState> = {}, deps: Partial<StoreDeps> = {}): AtlasStoreApi {
  return composeAtlasStore({ ...defaultDeps, ...deps }, init)
}

export const atlasStore: AtlasStoreApi = createAtlasStore(initialSettings())
attachPersistence(atlasStore)

/** Selects one field or a primitive. Components never select the whole state (AR-17). */
export function useAtlas<T>(selector: (s: AtlasStore) => T): T {
  return useStoreWithEqualityFn(atlasStore, selector)
}

/** Selects an object or array; re-renders only when a member changes. */
export function useAtlasShallow<T>(selector: (s: AtlasStore) => T): T {
  return useStoreWithEqualityFn(atlasStore, selector, shallow)
}

/** Snapshot read for useFrame callbacks and other non-React code (AR-15). */
export function readAtlas(): AtlasStore {
  return atlasStore.getState()
}

/** Transient subscription with a selector; the listener writes DOM properties directly (AR-74). */
export const subscribeAtlas: AtlasStoreApi['subscribe'] = atlasStore.subscribe
