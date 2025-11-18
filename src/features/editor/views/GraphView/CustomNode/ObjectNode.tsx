import React, { useState } from "react";
import type { CustomNodeProps } from ".";
import { NODE_DIMENSIONS } from "../../../../../constants/graph";
import type { NodeData } from "../../../../../types/graph";
import { TextRenderer } from "./TextRenderer";
import * as Styled from "./styles";
import useJson from "../../../../../store/useJson";
import useFile from "../../../../../store/useFile";

type RowProps = {
  row: NodeData["text"][number];
  x: number;
  y: number;
  index: number;
  node: NodeData;
};

const Row = ({ row, x, y, index, node }: RowProps) => {
  const rowPosition = index * NODE_DIMENSIONS.ROW_HEIGHT;

  const getRowText = () => {
    if (row.type === "object") return `{${row.childrenCount ?? 0} keys}`;
    if (row.type === "array") return `[${row.childrenCount ?? 0} items]`;
    return row.value;
  };

  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(String(row.value ?? ""));

  const setAtPath = (obj: any, p: Array<string | number>, val: any) => {
    let target = obj;
    for (let i = 0; i < p.length - 1; i++) {
      const key = p[i];
      if (typeof target[key] === "undefined") {
        const nextKey = p[i + 1];
        target[key] = typeof nextKey === "number" ? [] : {};
      }
      target = target[key];
    }
    const lastKey = p[p.length - 1];
    target[lastKey] = val;
  };

  const handleSave = () => {
    try {
      const jsonStr = useJson.getState().json;
      const jsonObj = jsonStr ? JSON.parse(jsonStr) : {};

      // Determine new value type: preserve string if original was string, otherwise try JSON.parse
      let newVal: any;
      if (typeof row.value === "string") {
        newVal = tempValue;
      } else {
        try {
          newVal = JSON.parse(tempValue);
        } catch {
          newVal = tempValue;
        }
      }

      // Build path: node.path + [row.key]
      const basePath = node.path ?? [];
      const propKey = row.key as string;
      const fullPath = [...basePath, propKey];

      setAtPath(jsonObj, fullPath, newVal);
      const updated = JSON.stringify(jsonObj, null, 2);
      useJson.getState().setJson(updated);
      useFile.getState().setContents({ contents: updated, hasChanges: true, skipUpdate: true });
    } catch (err) {
      // keep simple
      // console.warn("Failed to save row value", err);
    } finally {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setTempValue(String(row.value ?? ""));
    setIsEditing(false);
  };

  const isEditable = row.type !== "object" && row.type !== "array" && row.key != null;

  return (
    <Styled.StyledRow
      $value={row.value}
      data-key={`${row.key}: ${row.value}`}
      data-x={x}
      data-y={y + rowPosition}
      style={{ pointerEvents: "all" }}
    >
      <Styled.StyledKey $type="object">{row.key}: </Styled.StyledKey>
      {isEditable ? (
        !isEditing ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <TextRenderer>{getRowText()}</TextRenderer>
            <button
              onClick={e => {
                e.stopPropagation();
                setTempValue(String(row.value ?? ""));
                setIsEditing(true);
              }}
              style={{ fontSize: 11, padding: "2px 6px", borderRadius: 3, cursor: "pointer" }}
            >
              Edit
            </button>
          </span>
        ) : (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <input
              value={tempValue}
              onClick={e => e.stopPropagation()}
              onChange={e => setTempValue(e.target.value)}
              style={{ fontSize: 12, padding: "2px 6px", minWidth: 80 }}
            />
            <button
              onClick={e => {
                e.stopPropagation();
                handleSave();
              }}
              style={{ fontSize: 11, padding: "2px 6px", borderRadius: 3, cursor: "pointer" }}
            >
              Save
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                handleCancel();
              }}
              style={{ fontSize: 11, padding: "2px 6px", borderRadius: 3, cursor: "pointer" }}
            >
              Cancel
            </button>
          </span>
        )
      ) : (
        <TextRenderer>{getRowText()}</TextRenderer>
      )}
    </Styled.StyledRow>
  );
};

const Node = ({ node, x, y }: CustomNodeProps) => (
  <Styled.StyledForeignObject
    data-id={`node-${node.id}`}
    width={node.width}
    height={node.height}
    x={0}
    y={0}
    $isObject
  >
    {node.text.map((row, index) => (
      <Row key={`${node.id}-${index}`} row={row} x={x} y={y} index={index} node={node as NodeData} />
    ))}
  </Styled.StyledForeignObject>
);

function propsAreEqual(prev: CustomNodeProps, next: CustomNodeProps) {
  return (
    JSON.stringify(prev.node.text) === JSON.stringify(next.node.text) &&
    prev.node.width === next.node.width
  );
}

export const ObjectNode = React.memo(Node, propsAreEqual);
