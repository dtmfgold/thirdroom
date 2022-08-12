import { addComponent, defineQuery, exitQuery } from "bitecs";

import { GameState, World } from "../GameTypes";
import { createPhysicsCube } from "../mesh/mesh.game";
import { defineModule, getModule } from "../module/module.common";

interface PrefabModuleState {
  prefabTemplateMap: Map<string, PrefabTemplate>;
}

export const PrefabModule = defineModule<GameState, PrefabModuleState>({
  name: "prefab",
  create() {
    return {
      prefabTemplateMap: new Map(),
    };
  },
  init() {},
});

/* Prefab Functions */

export interface PrefabTemplate {
  name: string;
  create: Function;
  delete?: Function;
  serialize?: Function;
  deserialize?: Function;
}

export const Prefab: Map<number, string> = new Map();

export function registerPrefab(state: GameState, template: PrefabTemplate) {
  const prefabModule = getModule(state, PrefabModule);
  if (prefabModule.prefabTemplateMap.has(template.name)) {
    console.warn("warning: overwriting existing prefab", template.name);
  }
  prefabModule.prefabTemplateMap.set(template.name, template);
  const create = template.create;

  template.create = () => {
    const eid = create();
    addPrefabComponent(state.world, eid, template.name);
    return eid;
  };
}

const prefabQuery = defineQuery([Prefab]);
const removedPrefabQuery = exitQuery(prefabQuery);

export function PrefabDisposalSystem(state: GameState) {
  const removed = removedPrefabQuery(state.world);

  for (let i = 0; i < removed.length; i++) {
    const eid = removed[i];
    Prefab.delete(eid);
  }
}

export function getPrefabTemplate(state: GameState, name: string) {
  const prefabModule = getModule(state, PrefabModule);
  return prefabModule.prefabTemplateMap.get(name);
}

// TODO: make a loading entity prefab to display if prefab template hasn't been loaded before deserializing
// add component+system for loading and swapping the prefab
export const createLoadingEntity = createPhysicsCube;

export const createPrefabEntity = (state: GameState, prefab: string) => {
  const prefabModule = getModule(state, PrefabModule);
  const create = prefabModule.prefabTemplateMap.get(prefab)?.create;
  if (create) {
    return create(state);
  } else {
    return createLoadingEntity(state, 1);
  }
};

export const addPrefabComponent = (world: World, eid: number, prefab: string) => {
  addComponent(world, Prefab, eid);
  Prefab.set(eid, prefab);
};

export const removePrefabComponent = (world: World, eid: number) => {
  addComponent(world, Prefab, eid);
  Prefab.delete(eid);
};
