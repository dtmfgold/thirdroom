import { useCallback } from "react";
import { TreeView, NodeDropPosition } from "@thirdroom/manifold-editor-components";

import "./HierarchyPanel.css";
import { EditorNode, ReparentEntityPosition } from "../../../../engine/editor/editor.common";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import {
  addSelectedEntity,
  focusEntity,
  renameEntity,
  reparentEntities,
  setSelectedEntity,
  toggleSelectedEntity,
} from "../../../../engine/editor/editor.main";
import { HierarchyNode, HierarchyNodeContent, HierarchyNodeDropTarget, HierarchyNodeLeafSpacer } from "./HierarchyNode";
import { IconButton } from "../../../atoms/button/IconButton";
import TriangleRightIC from "../../../../../res/ic/triangle-right.svg";
import TriangleBottomIC from "../../../../../res/ic/triangle-bottom.svg";
import CircleIC from "../../../../../res/ic/circle.svg";
import LanguageIC from "../../../../../res/ic/language.svg";
import { Text } from "../../../atoms/text/Text";
import { Icon } from "../../../atoms/icon/Icon";

enum DnDItemTypes {
  Node = "node",
}

const dragItemType = DnDItemTypes.Node;
const dropAccept = [DnDItemTypes.Node];

interface DnDItem {
  type: DnDItemTypes;
  nodeIds?: number[];
}

function getSelectionRoots(scene: EditorNode, selection: number[]): EditorNode[] {
  const roots: EditorNode[] = [];

  const traverse = (object: EditorNode) => {
    if (selection.includes(object.id)) {
      roots.push(object);
      return;
    }

    for (const child of object.children) {
      traverse(child);
    }
  };

  traverse(scene);

  return roots;
}

function findEntityById(node: EditorNode, eid: number): EditorNode | undefined {
  if (node.eid === eid) {
    return node;
  }

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];

    const found = findEntityById(child, eid);

    if (found) {
      return found;
    }
  }

  return undefined;
}

interface HierarchyPanelProps {
  activeEntity: number;
  selectedEntities: number[];
  scene: EditorNode;
}

export function HierarchyPanel({ activeEntity, selectedEntities, scene }: HierarchyPanelProps) {
  const mainThread = useMainThreadContext();

  const canDrop = useCallback(
    (item: DnDItem, target: number | undefined, position: NodeDropPosition) => {
      if (!item.nodeIds) {
        return false;
      }

      if (target === undefined) {
        return position === NodeDropPosition.Root;
      }

      if (target === scene.eid && (position === NodeDropPosition.Before || position === NodeDropPosition.After)) {
        return false;
      }

      const roots = getSelectionRoots(scene, item.nodeIds);

      for (const root of roots) {
        if (findEntityById(root, target) !== undefined) {
          return false;
        }
      }

      return true;
    },
    [scene]
  );

  const canDrag = useCallback(
    (nodeId: number) => {
      return !selectedEntities.includes(scene.id);
    },
    [scene, selectedEntities]
  );

  const getDragItem = useCallback(
    (nodeId: number) => {
      return { type: DnDItemTypes.Node, nodeIds: selectedEntities };
    },
    [selectedEntities]
  );

  const onToggleSelectedNode = useCallback(
    (nodeId) => {
      toggleSelectedEntity(mainThread, nodeId);
    },
    [mainThread]
  );

  const onAddSelectedNode = useCallback(
    (nodeId) => {
      addSelectedEntity(mainThread, nodeId);
    },
    [mainThread]
  );

  const onSetSelectedNode = useCallback(
    (nodeId) => {
      setSelectedEntity(mainThread, nodeId);
    },
    [mainThread]
  );

  const onDoubleClickNode = useCallback(
    (nodeId) => {
      focusEntity(mainThread, nodeId);
    },
    [mainThread]
  );

  const onRenameNode = useCallback(
    (nodeId, name) => {
      renameEntity(mainThread, nodeId, name);
    },
    [mainThread]
  );

  const onDrop = useCallback(
    (item: DnDItem, target: number | undefined, position: NodeDropPosition) => {
      if (item.type === DnDItemTypes.Node && item.nodeIds) {
        reparentEntities(mainThread, item.nodeIds, target, position as unknown as ReparentEntityPosition);
      }
    },
    [mainThread]
  );

  return (
    <div className="HierarchyPanel">
      <TreeView
        tree={scene}
        selected={selectedEntities}
        active={activeEntity}
        itemSize={32}
        onToggleSelectedNode={onToggleSelectedNode}
        onAddSelectedNode={onAddSelectedNode}
        onSetSelectedNode={onSetSelectedNode}
        onDoubleClickNode={onDoubleClickNode}
        onRenameNode={onRenameNode}
        dropAccept={dropAccept}
        onDrop={onDrop}
        canDrop={canDrop}
        dragItemType={dragItemType}
        canDrag={canDrag}
        getDragItem={getDragItem}
      >
        {({
          id,
          name,
          depth,
          isExpanded,
          isSelected,
          isActive,
          isLeaf,
          isRenaming,
          listItemProps,
          dragContainerProps,
          beforeDropTargetState,
          beforeDropTargetRef,
          afterDropTargetState,
          afterDropTargetRef,
          onDropTargetState,
          onDropTargetRef,
          toggleProps,
          nameInputProps,
        }) => {
          return (
            <li {...listItemProps}>
              <HierarchyNode
                depth={depth}
                selected={isSelected}
                active={isActive}
                nodeRef={dragContainerProps.ref}
                onMouseDown={dragContainerProps.onMouseDown}
                onKeyDown={dragContainerProps.onKeyDown}
                tabIndex={dragContainerProps.tabIndex}
              >
                <HierarchyNodeDropTarget
                  placement="before"
                  dropTargetRef={beforeDropTargetRef}
                  canDrop={beforeDropTargetState.canDrop}
                  isOver={beforeDropTargetState.isOver}
                />
                <HierarchyNodeContent
                  className="grow flex items-center"
                  dropTargetRef={onDropTargetRef}
                  isOver={onDropTargetState.isOver}
                  canDrop={onDropTargetState.canDrop}
                >
                  {isLeaf || depth === 0 ? (
                    <HierarchyNodeLeafSpacer />
                  ) : (
                    <IconButton
                      size="sm"
                      variant={isSelected ? "on-primary" : "surface"}
                      label={isExpanded ? "Collapse" : "Expand"}
                      iconSrc={isExpanded ? TriangleBottomIC : TriangleRightIC}
                      {...toggleProps}
                    />
                  )}
                  <div className="flex items-center gap-xs">
                    {isRenaming ? (
                      <div>
                        <input {...nameInputProps} />
                      </div>
                    ) : (
                      <>
                        <Icon
                          color={isSelected ? "on-primary" : "surface"}
                          size="sm"
                          src={depth > 0 ? CircleIC : LanguageIC}
                        />
                        <Text color={isSelected ? "on-primary" : "surface"} variant="b2" weight="medium">
                          {name}
                        </Text>
                      </>
                    )}
                  </div>
                </HierarchyNodeContent>
                <HierarchyNodeDropTarget
                  placement="after"
                  dropTargetRef={afterDropTargetRef}
                  canDrop={afterDropTargetState.canDrop}
                  isOver={afterDropTargetState.isOver}
                />
              </HierarchyNode>
            </li>
          );
        }}
      </TreeView>
    </div>
  );
}
