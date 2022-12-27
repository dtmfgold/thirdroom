import { mat4, quat, vec2, vec3, vec4 } from "gl-matrix";

import { TripleBuffer } from "../allocator/TripleBuffer";
import { TypedArray32, TypedArrayConstructor32 } from "../utils/typedarray";
import { BaseThreadContext } from "../module/module.common";

export interface ResourceDefinition {
  name: string;
  resourceType: number;
  schema: {
    [key: string]: ResourcePropDef<string, unknown, boolean, boolean, unknown, unknown> & { byteOffset: number };
  };
  byteLength: number;
}

type Schema = {
  [key: string]: ResourcePropDef<string, unknown, boolean, boolean, unknown, unknown>;
};

type ProcessedSchema<S extends Schema> = {
  [K in keyof S]: S[K] & { byteOffset: number };
};

export interface ResourcePropDef<
  Key extends string,
  DefaultValue,
  Mut extends boolean,
  Req extends boolean,
  Enum = undefined,
  Def = undefined
> {
  type: Key;
  size: number;
  arrayType: TypedArrayConstructor32;
  required: Req;
  mutable: Mut;
  mutableScript: boolean;
  script: boolean;
  default: DefaultValue;
  enumType?: Enum;
  resourceDef: Def;
  min?: number;
  max?: number;
  minExclusive?: number;
  maxExclusive?: number;
  backRef: boolean;
}

function createBoolPropDef<Mut extends boolean, Req extends boolean>(options?: {
  default?: boolean;
  mutable?: Mut;
  mutableScript?: boolean;
  required?: Req;
  script?: boolean;
}): ResourcePropDef<"bool", boolean, Mut extends true ? true : false, Req extends false ? false : true> {
  return {
    type: "bool",
    size: 1,
    // TODO: look into byte alignment to make this smaller like using a Uin8tArray
    arrayType: Uint32Array,
    mutable: true as any,
    mutableScript: options?.mutable !== undefined ? options.mutable : true,
    required: false as any,
    script: false,
    default: false,
    resourceDef: undefined,
    backRef: false,
    ...options,
  };
}

function createU32PropDef<Mut extends boolean, Req extends boolean>(options?: {
  default?: number;
  mutable?: Mut;
  mutableScript?: boolean;
  required?: Req;
  script?: boolean;
  min?: number;
  max?: number;
  minExclusive?: number;
  maxExclusive?: number;
}): ResourcePropDef<"u32", number, Mut extends true ? true : false, Req extends false ? false : true> {
  return {
    type: "u32",
    size: 1,
    arrayType: Uint32Array,
    mutable: true as any,
    mutableScript: options?.mutable !== undefined ? options.mutable : true,
    required: false as any,
    script: false,
    default: 0,
    resourceDef: undefined,
    backRef: false,
    ...options,
  };
}

function createF32PropDef<Mut extends boolean, Req extends boolean>(options?: {
  default?: number;
  mutable?: Mut;
  mutableScript?: boolean;
  required?: Req;
  script?: boolean;
  min?: number;
  max?: number;
  minExclusive?: number;
  maxExclusive?: number;
}): ResourcePropDef<"f32", number, Mut extends true ? true : false, Req extends false ? false : true> {
  return {
    type: "f32",
    size: 1,
    arrayType: Float32Array,
    mutable: true as any,
    mutableScript: options?.mutable !== undefined ? options.mutable : true,
    required: false as any,
    script: false,
    default: 0,
    resourceDef: undefined,
    backRef: false,
    ...options,
  };
}

function createVec2PropDef<Mut extends boolean, Req extends boolean>(options?: {
  default?: ArrayLike<number>;
  mutable?: Mut;
  mutableScript?: boolean;
  required?: Req;
  script?: boolean;
}): ResourcePropDef<"vec2", ArrayLike<number>, Mut extends true ? true : false, Req extends false ? false : true> {
  return {
    type: "vec2",
    size: 2,
    arrayType: Float32Array,
    mutable: true as any,
    mutableScript: options?.mutable !== undefined ? options.mutable : true,
    required: false as any,
    script: false,
    default: vec2.create(),
    resourceDef: undefined,
    backRef: false,
    ...options,
  };
}

function createVec3PropDef<Mut extends boolean, Req extends boolean>(options?: {
  default?: ArrayLike<number>;
  mutable?: Mut;
  mutableScript?: boolean;
  required?: Req;
  script?: boolean;
}): ResourcePropDef<"vec3", ArrayLike<number>, Mut extends true ? true : false, Req extends false ? false : true> {
  return {
    type: "vec3",
    size: 3,
    arrayType: Float32Array,
    mutable: true as any,
    mutableScript: true,
    required: false as any,
    script: false,
    default: vec3.create(),
    resourceDef: undefined,
    backRef: false,
    ...options,
  };
}

function createRGBPropDef<Mut extends boolean, Req extends boolean>(options?: {
  default?: ArrayLike<number>;
  mutable?: Mut;
  mutableScript?: boolean;
  required?: Req;
  script?: boolean;
}): ResourcePropDef<"rgb", ArrayLike<number>, Mut extends true ? true : false, Req extends false ? false : true> {
  return {
    type: "rgb",
    size: 3,
    arrayType: Float32Array,
    mutable: true as any,
    mutableScript: options?.mutable !== undefined ? options.mutable : true,
    required: false as any,
    script: false,
    default: vec3.create(),
    resourceDef: undefined,
    backRef: false,
    ...options,
  };
}

function createRGBAPropDef<Mut extends boolean, Req extends boolean>(options?: {
  default?: ArrayLike<number>;
  mutable?: Mut;
  mutableScript?: boolean;
  required?: Req;
  script?: boolean;
}): ResourcePropDef<"rgba", ArrayLike<number>, Mut extends true ? true : false, Req extends false ? false : true> {
  return {
    type: "rgba",
    size: 4,
    arrayType: Float32Array,
    mutable: true as any,
    mutableScript: options?.mutable !== undefined ? options.mutable : true,
    required: false as any,
    script: false,
    default: vec4.create(),
    resourceDef: undefined,
    backRef: false,
    ...options,
  };
}

function createQuatPropDef<Mut extends boolean, Req extends boolean>(options?: {
  default?: ArrayLike<number>;
  mutable?: Mut;
  mutableScript?: boolean;
  required?: Req;
  script?: boolean;
}): ResourcePropDef<"quat", ArrayLike<number>, Mut extends true ? true : false, Req extends false ? false : true> {
  return {
    type: "quat",
    size: 4,
    arrayType: Float32Array,
    mutable: true as any,
    mutableScript: options?.mutable !== undefined ? options.mutable : true,
    required: false as any,
    script: false,
    default: quat.create(),
    resourceDef: undefined,
    backRef: false,
    ...options,
  };
}

function createMat4PropDef<Mut extends boolean, Req extends boolean>(options?: {
  default?: ArrayLike<number>;
  mutable?: Mut;
  mutableScript?: boolean;
  required?: Req;
  script?: boolean;
}): ResourcePropDef<"mat4", ArrayLike<number>, Mut extends true ? true : false, Req extends false ? false : true> {
  return {
    type: "mat4",
    size: 16,
    arrayType: Float32Array,
    mutable: true as any,
    mutableScript: options?.mutable !== undefined ? options.mutable : true,
    required: false as any,
    script: false,
    default: mat4.create(),
    resourceDef: undefined,
    backRef: false,
    ...options,
  };
}

function createBitmaskPropDef<Mut extends boolean, Req extends boolean>(options?: {
  default?: number;
  mutable?: Mut;
  mutableScript?: boolean;
  required?: Req;
  script?: boolean;
}): ResourcePropDef<"bitmask", number, Mut extends true ? true : false, Req extends false ? false : true> {
  return {
    type: "bitmask",
    size: 1,
    arrayType: Uint32Array,
    mutable: true as any,
    mutableScript: options?.mutable !== undefined ? options.mutable : true,
    required: false as any,
    script: false,
    default: 0,
    resourceDef: undefined,
    backRef: false,
    ...options,
  };
}

function createEnumPropDef<T, Mut extends boolean, Req extends boolean>(
  enumType: T,
  options: {
    default?: T[keyof T];
    mutable?: Mut;
    mutableScript?: boolean;
    required?: Req;
    script?: boolean;
  }
): ResourcePropDef<
  "enum",
  T[keyof T] | undefined,
  Mut extends true ? true : false,
  Req extends false ? false : true,
  T
> {
  return {
    type: "enum",
    enumType,
    size: 1,
    arrayType: Uint32Array,
    mutable: true as any,
    mutableScript: options?.mutable !== undefined ? options.mutable : true,
    required: false as any,
    script: false,
    default: undefined,
    resourceDef: undefined,
    backRef: false,
    ...options,
  };
}

function createStringPropDef<Mut extends boolean, Req extends boolean>(options?: {
  default?: string;
  mutable?: Mut;
  mutableScript?: boolean;
  required?: Req;
  script?: boolean;
  backRef?: boolean;
}): ResourcePropDef<"string", string, Mut extends true ? true : false, Req extends false ? false : true> {
  return {
    type: "string",
    size: 1,
    arrayType: Uint32Array,
    mutable: true as any,
    mutableScript: options?.mutable !== undefined ? options.mutable : true,
    required: false as any,
    script: false,
    default: "",
    resourceDef: undefined,
    backRef: false,
    ...options,
  };
}

function createArrayBufferPropDef(options?: {
  script?: boolean;
}): ResourcePropDef<"arrayBuffer", undefined, false, true> {
  return {
    type: "arrayBuffer",
    size: 2,
    arrayType: Uint32Array,
    mutable: false,
    mutableScript: false,
    required: true,
    script: false,
    default: undefined,
    resourceDef: undefined,
    backRef: false,
    ...options,
  };
}

function createRefPropDef<Def extends ResourceDefinition | string, Mut extends boolean, Req extends boolean>(
  resourceDef: Def,
  options?: {
    mutable?: Mut;
    mutableScript?: boolean;
    required?: Req;
    script?: boolean;
    backRef?: boolean;
  }
): ResourcePropDef<"ref", number, Mut extends true ? true : false, Req extends false ? false : true, undefined, Def> {
  return {
    type: "ref",
    size: 1,
    arrayType: Uint32Array,
    resourceDef,
    mutable: true as any,
    mutableScript: options?.mutable !== undefined ? options.mutable : true,
    required: false as any,
    script: false,
    default: 0,
    backRef: false,
    ...options,
  };
}

function createRefArrayPropDef<Def extends ResourceDefinition | string, Mut extends boolean, Req extends boolean>(
  resourceDef: Def,
  options: {
    size: number;
    mutable?: Mut;
    mutableScript?: boolean;
    required?: Req;
    script?: boolean;
    backRef?: boolean;
  }
): ResourcePropDef<
  "refArray",
  ArrayLike<number>,
  Mut extends true ? true : false,
  Req extends false ? false : true,
  undefined,
  Def
> {
  const { size, ...rest } = options;
  return {
    type: "refArray",
    size,
    arrayType: Uint32Array,
    resourceDef,
    mutable: true as any,
    mutableScript: options?.mutable !== undefined ? options.mutable : true,
    required: false as any,
    script: false,
    default: new Uint32Array(size),
    backRef: false,
    ...rest,
  };
}

function createRefMapPropDef<Def extends ResourceDefinition | string, Mut extends boolean, Req extends boolean>(
  resourceDef: Def,
  options: {
    size: number;
    mutable?: Mut;
    mutableScript?: boolean;
    required?: Req;
    script?: boolean;
    backRef?: boolean;
  }
): ResourcePropDef<
  "refMap",
  ArrayLike<number>,
  Mut extends true ? true : false,
  Req extends false ? false : true,
  undefined,
  Def
> {
  const { size, ...rest } = options;
  return {
    type: "refMap",
    size,
    arrayType: Uint32Array,
    resourceDef,
    mutable: true as any,
    mutableScript: options?.mutable !== undefined ? options.mutable : true,
    required: false as any,
    script: false,
    default: new Uint32Array(size),
    backRef: false,
    ...rest,
  };
}

function createSelfRefPropDef<Def extends ResourceDefinition, Mut extends boolean, Req extends boolean>(options?: {
  mutable?: Mut;
  mutableScript?: boolean;
  required?: Req;
  script?: boolean;
  backRef?: boolean;
}): ResourcePropDef<
  "selfRef",
  number,
  Mut extends true ? true : false,
  Req extends false ? false : true,
  undefined,
  Def
> {
  return {
    type: "selfRef",
    size: 1,
    arrayType: Uint32Array,
    mutable: true as any,
    mutableScript: options?.mutable !== undefined ? options.mutable : true,
    required: false as any,
    script: false,
    default: 0,
    resourceDef: undefined as unknown as Def, // To be assigned in defineResource
    backRef: false,
    ...options,
  };
}

export const PropType = {
  bool: createBoolPropDef,
  u32: createU32PropDef,
  f32: createF32PropDef,
  vec2: createVec2PropDef,
  vec3: createVec3PropDef,
  rgb: createRGBPropDef,
  rgba: createRGBAPropDef,
  quat: createQuatPropDef,
  mat4: createMat4PropDef,
  bitmask: createBitmaskPropDef,
  enum: createEnumPropDef,
  string: createStringPropDef,
  arrayBuffer: createArrayBufferPropDef,
  ref: createRefPropDef,
  refArray: createRefArrayPropDef,
  refMap: createRefMapPropDef,
  selfRef: createSelfRefPropDef,
};

export interface DefinedResource<S extends Schema> extends ResourceDefinition {
  schema: ProcessedSchema<S>;
}

export const defineResource = <S extends Schema>(name: string, resourceType: number, schema: S): DefinedResource<S> => {
  const resourceDef: DefinedResource<S> = {
    name,
    resourceType,
    schema: schema as unknown as ProcessedSchema<S>,
    byteLength: 0,
  };

  let cursor = 0;

  for (const propName in resourceDef.schema) {
    const prop = resourceDef.schema[propName];

    if (prop.type === "selfRef") {
      schema[propName] = PropType.ref(resourceDef, {
        mutable: prop.mutable,
        required: prop.required,
        script: prop.script,
        backRef: prop.backRef,
      }) as unknown as any;
      (schema[propName] as any).byteOffset = cursor;
    } else {
      prop.byteOffset = cursor;
    }

    cursor += prop.arrayType.BYTES_PER_ELEMENT * prop.size;
  }

  resourceDef.byteLength = cursor;

  return resourceDef;
};

type RemoteResourcePropValue<
  Def extends ResourceDefinition,
  Prop extends keyof Def["schema"]
> = Def["schema"][Prop]["type"] extends "string"
  ? string
  : Def["schema"][Prop]["type"] extends "u32"
  ? number
  : Def["schema"][Prop]["type"] extends "arrayBuffer"
  ? SharedArrayBuffer
  : Def["schema"][Prop]["type"] extends "bool"
  ? boolean
  : Def["schema"][Prop]["type"] extends "mat4"
  ? Float32Array
  : Def["schema"][Prop]["type"] extends "f32"
  ? number
  : Def["schema"][Prop]["type"] extends "rgba"
  ? Float32Array
  : Def["schema"][Prop]["type"] extends "rgb"
  ? Float32Array
  : Def["schema"][Prop]["type"] extends "vec2"
  ? Float32Array
  : Def["schema"][Prop]["type"] extends "vec3"
  ? Float32Array
  : Def["schema"][Prop]["type"] extends "quat"
  ? Float32Array
  : Def["schema"][Prop]["type"] extends "bitmask"
  ? number
  : Def["schema"][Prop]["type"] extends "enum"
  ? // TODO: actually return the enum type instead of number
    // ex: Def["schema"][Prop]["enumType"][keyof Def["schema"][Prop]["enumType"]]
    number
  : Def["schema"][Prop]["type"] extends "ref"
  ? Def["schema"][Prop]["resourceDef"] extends ResourceDefinition
    ? Def["schema"][Prop] extends { required: true; mutable: false }
      ? RemoteResourceInstance<Def["schema"][Prop]["resourceDef"]>
      : RemoteResourceInstance<Def["schema"][Prop]["resourceDef"]> | undefined
    : unknown
  : Def["schema"][Prop]["type"] extends "refArray"
  ? Def["schema"][Prop]["resourceDef"] extends ResourceDefinition
    ? RemoteResourceInstance<Def["schema"][Prop]["resourceDef"]>[]
    : unknown[]
  : Def["schema"][Prop]["type"] extends "refMap"
  ? Def["schema"][Prop]["resourceDef"] extends ResourceDefinition
    ? RemoteResourceInstance<Def["schema"][Prop]["resourceDef"]>[]
    : unknown[]
  : Def["schema"][Prop]["type"] extends "selfRef"
  ? Def["schema"][Prop]["resourceDef"] extends ResourceDefinition
    ? Def["schema"][Prop] extends { required: true; mutable: false }
      ? RemoteResourceInstance<Def>
      : RemoteResourceInstance<Def> | undefined
    : unknown
  : never;

type RemoteResourcePropValueMut<
  Def extends ResourceDefinition,
  Prop extends keyof Def["schema"]
> = Def["schema"][Prop]["mutable"] extends false
  ? Readonly<RemoteResourcePropValue<Def, Prop>>
  : RemoteResourcePropValue<Def, Prop>;

type LocalResourcePropValue<
  ThreadContext extends BaseThreadContext,
  Def extends ResourceDefinition,
  Prop extends keyof Def["schema"]
> = Def["schema"][Prop]["type"] extends "string"
  ? string
  : Def["schema"][Prop]["type"] extends "u32"
  ? number
  : Def["schema"][Prop]["type"] extends "arrayBuffer"
  ? SharedArrayBuffer
  : Def["schema"][Prop]["type"] extends "bool"
  ? boolean
  : Def["schema"][Prop]["type"] extends "mat4"
  ? Float32Array
  : Def["schema"][Prop]["type"] extends "f32"
  ? number
  : Def["schema"][Prop]["type"] extends "rgba"
  ? Float32Array
  : Def["schema"][Prop]["type"] extends "rgb"
  ? Float32Array
  : Def["schema"][Prop]["type"] extends "vec2"
  ? Float32Array
  : Def["schema"][Prop]["type"] extends "vec3"
  ? Float32Array
  : Def["schema"][Prop]["type"] extends "quat"
  ? Float32Array
  : Def["schema"][Prop]["type"] extends "bitmask"
  ? number
  : Def["schema"][Prop]["type"] extends "enum"
  ? // TODO: actually return the enum type instead of number
    // ex: Def["schema"][Prop]["enumType"][keyof Def["schema"][Prop]["enumType"]]
    number
  : Def["schema"][Prop]["type"] extends "ref"
  ? Def["schema"][Prop]["resourceDef"] extends ResourceDefinition
    ? Def["schema"][Prop] extends { required: true; mutable: false }
      ? LocalResourceInstance<Def["schema"][Prop]["resourceDef"], ThreadContext>
      : LocalResourceInstance<Def["schema"][Prop]["resourceDef"], ThreadContext> | undefined
    : unknown
  : Def["schema"][Prop]["type"] extends "refArray"
  ? Def["schema"][Prop]["resourceDef"] extends ResourceDefinition
    ? LocalResourceInstance<Def["schema"][Prop]["resourceDef"], ThreadContext>[]
    : unknown[]
  : Def["schema"][Prop]["type"] extends "refMap"
  ? Def["schema"][Prop]["resourceDef"] extends ResourceDefinition
    ? LocalResourceInstance<Def["schema"][Prop]["resourceDef"], ThreadContext>[]
    : unknown[]
  : Def["schema"][Prop]["type"] extends "selfRef"
  ? Def["schema"][Prop]["resourceDef"] extends ResourceDefinition
    ? Def["schema"][Prop] extends { required: true; mutable: false }
      ? LocalResourceInstance<Def, ThreadContext>
      : LocalResourceInstance<Def, ThreadContext> | undefined
    : unknown
  : never;

export interface Resource {
  resourceId: number;
  tripleBuffer: TripleBuffer;
}

export interface RemoteResource extends Resource {
  constructor: { name: string; resourceDef: ResourceDefinition };
  resourceDef: ResourceDefinition;
  resourceType: number;
  manager: IRemoteResourceManager;
  __props: { [key: string]: TypedArray32 };
  initialized: boolean;
  byteView: Uint8Array;
  refView: Uint32Array;
  prevRefs: number[];
  translationIndices: Uint32Array;
  translationValues: Uint32Array;
  ptr: number;
  addRef(): void;
  removeRef(): void;
  dispose(): void;
}

export type RemoteResourceInstance<Def extends ResourceDefinition> = RemoteResource & {
  [Prop in keyof Def["schema"]]: RemoteResourcePropValueMut<Def, Prop>;
};

export interface IRemoteResourceClass<Def extends ResourceDefinition = ResourceDefinition> {
  new (manager: IRemoteResourceManager, props?: InitialRemoteResourceProps<Def>): RemoteResourceInstance<Def>;
  resourceDef: Def;
}

export interface LocalResource<ThreadContext extends BaseThreadContext = BaseThreadContext> extends Resource {
  resourceType: number;
  manager: ILocalResourceManager;
  __props: { [key: string]: TypedArray32[] };
  load(ctx: ThreadContext): Promise<void>;
  dispose(ctx: ThreadContext): void;
}

export type LocalResourceInstance<
  Def extends ResourceDefinition,
  ThreadContext extends BaseThreadContext
> = LocalResource<ThreadContext> & {
  readonly [Prop in keyof Def["schema"]]: LocalResourcePropValue<ThreadContext, Def, Prop>;
};

export interface ILocalResourceClass<
  Def extends ResourceDefinition = ResourceDefinition,
  ThreadContext extends BaseThreadContext = BaseThreadContext
> {
  new (manager: ILocalResourceManager, resourceId: number, tripleBuffer: TripleBuffer): LocalResourceInstance<
    Def,
    ThreadContext
  >;
  resourceDef: Def;
}

export interface ILocalResourceConstructor<ThreadContext extends BaseThreadContext> {
  new (manager: ILocalResourceManager, resourceId: number, tripleBuffer: TripleBuffer): LocalResource<ThreadContext>;
  resourceDef: ResourceDefinition;
}

export type IResourceClass<ThreadContext extends BaseThreadContext> =
  | IRemoteResourceClass<ResourceDefinition>
  | ILocalResourceClass<ResourceDefinition, ThreadContext>;

type RequiredProps<Def extends ResourceDefinition> = {
  [Prop in keyof Def["schema"]]: Def["schema"][Prop]["required"] extends true ? Prop : never;
}[keyof Def["schema"]];

type InitialRemoteResourcePropValue<
  Def extends ResourceDefinition,
  Prop extends keyof Def["schema"]
> = Def["schema"][Prop]["type"] extends "string"
  ? string
  : Def["schema"][Prop]["type"] extends "u32"
  ? number
  : Def["schema"][Prop]["type"] extends "arrayBuffer"
  ? SharedArrayBuffer
  : Def["schema"][Prop]["type"] extends "bool"
  ? boolean
  : Def["schema"][Prop]["type"] extends "mat4"
  ? ArrayLike<number>
  : Def["schema"][Prop]["type"] extends "f32"
  ? number
  : Def["schema"][Prop]["type"] extends "rgba"
  ? ArrayLike<number>
  : Def["schema"][Prop]["type"] extends "rgb"
  ? ArrayLike<number>
  : Def["schema"][Prop]["type"] extends "vec2"
  ? ArrayLike<number>
  : Def["schema"][Prop]["type"] extends "vec3"
  ? ArrayLike<number>
  : Def["schema"][Prop]["type"] extends "quat"
  ? ArrayLike<number>
  : Def["schema"][Prop]["type"] extends "bitmask"
  ? number
  : Def["schema"][Prop]["type"] extends "enum"
  ? // TODO: actually return the enum type instead of number
    // ex: Def["schema"][Prop]["enumType"][keyof Def["schema"][Prop]["enumType"]]
    number
  : Def["schema"][Prop]["type"] extends "ref"
  ? Def["schema"][Prop]["resourceDef"] extends ResourceDefinition
    ? Def["schema"][Prop] extends { required: true; mutable: false }
      ? RemoteResourceInstance<Def["schema"][Prop]["resourceDef"]>
      : RemoteResourceInstance<Def["schema"][Prop]["resourceDef"]> | undefined
    : unknown
  : Def["schema"][Prop]["type"] extends "refArray"
  ? Def["schema"][Prop]["resourceDef"] extends ResourceDefinition
    ? RemoteResourceInstance<Def["schema"][Prop]["resourceDef"]>[]
    : unknown[]
  : Def["schema"][Prop]["type"] extends "refMap"
  ? {
      [key: number]: Def["schema"][Prop]["resourceDef"] extends ResourceDefinition
        ? RemoteResourceInstance<Def["schema"][Prop]["resourceDef"]>
        : never;
    }
  : Def["schema"][Prop]["type"] extends "selfRef"
  ? Def["schema"][Prop]["resourceDef"] extends ResourceDefinition
    ? Def["schema"][Prop] extends { required: true; mutable: false }
      ? RemoteResourceInstance<Def>
      : RemoteResourceInstance<Def> | undefined
    : unknown
  : never;

export type InitialRemoteResourceProps<Def extends ResourceDefinition> = {
  [Prop in RequiredProps<Def>]: InitialRemoteResourcePropValue<Def, Prop>;
} & {
  [Prop in keyof Def["schema"]]?: InitialRemoteResourcePropValue<Def, Prop>;
};

export interface ResourceData {
  ptr: number;
  buffer: ArrayBuffer;
  tripleBuffer: TripleBuffer;
}

export interface IRemoteResourceManager {
  getString(store: Uint32Array): string;
  setString(value: string | undefined, store: Uint32Array): void;
  getArrayBuffer(store: Uint32Array): SharedArrayBuffer;
  setArrayBuffer(value: SharedArrayBuffer | undefined, store: Uint32Array): void;
  allocateResource(resourceDef: ResourceDefinition): ResourceData;
  createResource(resource: RemoteResource): number;
  disposeResource(resourceId: number): boolean;
  getRef<T extends RemoteResource>(store: Uint32Array): T | undefined;
  setRef(value: RemoteResource | undefined, store: Uint32Array, backRef: boolean): void;
  setRefArrayItem(index: number, value: RemoteResource | undefined, store: Uint32Array): void;
  getRefArrayItem<T extends RemoteResource>(index: number, store: Uint32Array): T | undefined;
  addRef(resourceId: number): void;
  removeRef(resourceId: number): void;
}

export type LocalResourceTypes = string | SharedArrayBuffer | LocalResource;

export interface ILocalResourceManager {
  getResource<T extends LocalResourceTypes>(resourceId: number): T | undefined;
}
