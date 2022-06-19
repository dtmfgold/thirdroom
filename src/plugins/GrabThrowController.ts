import RAPIER from "@dimforge/rapier3d-compat";
import { defineComponent, Types, defineQuery, removeComponent, addComponent } from "bitecs";
import { vec3, mat4, quat } from "gl-matrix";

import { Transform } from "../engine/component/transform";
import { GameState } from "../engine/GameTypes";
import {
  enableActionMap,
  ActionMap,
  ActionType,
  BindingType,
  ButtonActionState,
} from "../engine/input/ActionMappingSystem";
import { InputModule } from "../engine/input/input.game";
import { defineModule, getModule } from "../engine/module/module.common";
import { PhysicsModule, RigidBody } from "../engine/physics/physics.game";

type GrabThrow = {};

export const GrabThrowModule = defineModule<GameState, GrabThrow>({
  name: "grab-throw",
  create() {
    return {};
  },
  init(ctx) {
    enableActionMap(ctx, GrabThrowActionMapp);
  },
});

export const GrabThrowActionMapp: ActionMap = {
  id: "grab-throw",
  actions: [
    {
      id: "grab",
      path: "Grab",
      type: ActionType.Button,
      bindings: [
        {
          type: BindingType.Button,
          path: "Mouse/Left",
        },
      ],
    },
    {
      id: "throw",
      path: "Throw",
      type: ActionType.Button,
      bindings: [
        {
          type: BindingType.Button,
          path: "Mouse/Right",
        },
      ],
    },
  ],
};

const GrabComponent = defineComponent({
  handle1: Types.ui32,
  handle2: Types.ui32,
  joint: [Types.f32, 3],
});
const grabQuery = defineQuery([GrabComponent]);

const GRAB_DISTANCE = 3;
const GRAB_MAX_DISTANCE = 1;
const GRAB_MOVE_SPEED = 10;
const CUBE_THROW_FORCE = 10;

const _direction = vec3.create();
const _target = vec3.create();

const _impulse = new RAPIER.Vector3(0, 0, 0);

const _cameraWorldQuat = quat.create();

export function GrabThrowSystem(ctx: GameState) {
  const physics = getModule(ctx, PhysicsModule);
  const input = getModule(ctx, InputModule);

  let heldEntity = grabQuery(ctx.world)[0];

  const grabBtn = input.actions.get("Grab") as ButtonActionState;
  const throwBtn = input.actions.get("Throw") as ButtonActionState;

  // if holding and entity and throw is pressed
  if (heldEntity && throwBtn.pressed) {
    removeComponent(ctx.world, GrabComponent, heldEntity);

    mat4.getRotation(_cameraWorldQuat, Transform.worldMatrix[ctx.activeCamera]);
    const direction = vec3.set(_direction, 0, 0, -1);
    vec3.transformQuat(direction, direction, _cameraWorldQuat);
    vec3.scale(direction, direction, CUBE_THROW_FORCE);

    // fire!
    _impulse.x = direction[0];
    _impulse.y = direction[1];
    _impulse.z = direction[2];
    RigidBody.store.get(heldEntity)?.applyImpulse(_impulse, true);

    // if holding an entity and grab is pressed again
  } else if (grabBtn.pressed && heldEntity) {
    // release
    removeComponent(ctx.world, GrabComponent, heldEntity);

    // if grab is pressed
  } else if (grabBtn.pressed) {
    // raycast outward from camera
    const cameraMatrix = Transform.worldMatrix[ctx.activeCamera];
    mat4.getRotation(_cameraWorldQuat, cameraMatrix);

    const target = vec3.set(_target, 0, 0, -1);
    vec3.transformQuat(target, target, _cameraWorldQuat);
    vec3.scale(target, target, GRAB_MAX_DISTANCE);

    const source = mat4.getTranslation(vec3.create(), cameraMatrix);

    const s: RAPIER.Vector3 = (([x, y, z]) => ({ x, y, z }))(source);
    const t: RAPIER.Vector3 = (([x, y, z]) => ({ x, y, z }))(target);

    const ray = new RAPIER.Ray(s, t);
    const maxToi = 4.0;
    const solid = true;
    const groups = 0xfffffffff;

    const hit = physics.physicsWorld.castRay(ray, maxToi, solid, groups);
    if (hit != null) {
      const hitPoint = ray.pointAt(hit.toi); // ray.origin + ray.dir * toi
      const eid = physics.handleMap.get(hit.colliderHandle);
      if (!eid) {
        console.warn(`Could not find entity for physics handle ${hit.colliderHandle}`);
      } else if (ctx.entityPrefabMap.get(eid) === "blue-cube") {
        addComponent(ctx.world, GrabComponent, eid);
        GrabComponent.joint[eid].set([hitPoint.x, hitPoint.y, hitPoint.z]);
      }
    }
  }

  // if still holding entity, move towards the grab point
  heldEntity = grabQuery(ctx.world)[0];
  if (heldEntity) {
    const heldPosition = Transform.position[heldEntity];

    const target = _target;
    mat4.getTranslation(target, Transform.worldMatrix[ctx.activeCamera]);

    mat4.getRotation(_cameraWorldQuat, Transform.worldMatrix[ctx.activeCamera]);
    const direction = vec3.set(_direction, 0, 0, 1);
    vec3.transformQuat(direction, direction, _cameraWorldQuat);
    vec3.scale(direction, direction, GRAB_DISTANCE);

    vec3.sub(target, target, direction);

    vec3.sub(target, target, heldPosition);

    vec3.scale(target, target, GRAB_MOVE_SPEED);

    const body = RigidBody.store.get(heldEntity);
    if (body) {
      _impulse.x = target[0];
      _impulse.y = target[1];
      _impulse.z = target[2];
      body.setLinvel(_impulse, true);
    }
  }
}
