import React, { useEffect, useState } from "react";
import styled from "styled-components";
import type { CustomNodeProps } from ".";
import useConfig from "../../../../../store/useConfig";
import { isContentImage } from "../lib/utils/calculateNodeSize";
import { TextRenderer } from "./TextRenderer";
import * as Styled from "./styles";
import useJson from "../../../../../store/useJson";
import useFile from "../../../../../store/useFile";

const StyledTextNodeWrapper = styled.span<{ $isParent: boolean }>`
  display: flex;
  justify-content: ${({ $isParent }) => ($isParent ? "center" : "flex-start")};
  align-items: center;
  height: 100%;
  width: 100%;
  overflow: hidden;
  padding: 0 10px;
`;

const StyledImageWrapper = styled.div`
  padding: 5px;
`;

const StyledImage = styled.img`
  border-radius: 2px;
  object-fit: contain;
  background: ${({ theme }) => theme.BACKGROUND_MODIFIER_ACCENT};
`;

const Node = ({ node, x, y }: CustomNodeProps) => {
  const { text, width, height } = node;
  const imagePreviewEnabled = useConfig(state => state.imagePreviewEnabled);
  const isImage = imagePreviewEnabled && isContentImage(JSON.stringify(text[0].value));

  const value = text[0].value;
  const path = node.path;

  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(String(value ?? ""));

  // Keep tempValue in sync if the underlying value changes from outside
  useEffect(() => {
    setTempValue(String(value ?? ""));
  }, [value]);

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
      if (typeof value === "string") {
        newVal = tempValue;
      } else {
        try {
          newVal = JSON.parse(tempValue);
        } catch {
          newVal = tempValue;
        }
      }

      if (!path || path.length === 0) {
        // Replace root
        const updated = JSON.stringify(newVal, null, 2);
        useJson.getState().setJson(updated);
        useFile.getState().setContents({ contents: updated, hasChanges: true, skipUpdate: true });
      } else {
        setAtPath(jsonObj, path, newVal);
        const updated = JSON.stringify(jsonObj, null, 2);
        useJson.getState().setJson(updated);
        useFile.getState().setContents({ contents: updated, hasChanges: true, skipUpdate: true });
      }
    } catch (err) {
      // keep logic simple; log for debugging
    } finally {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setTempValue(String(value ?? ""));
    setIsEditing(false);
  };

  return (
    <Styled.StyledForeignObject
      data-id={`node-${node.id}`}
      width={width}
      height={height}
      x={0}
      y={0}
    >
      {isImage ? (
        <StyledImageWrapper>
          <StyledImage src={JSON.stringify(text[0].value)} width="70" height="70" loading="lazy" />
        </StyledImageWrapper>
      ) : (
        <StyledTextNodeWrapper
          data-x={x}
          data-y={y}
          data-key={JSON.stringify(text)}
          $isParent={false}
          style={{ pointerEvents: "all" }}
        >
          <Styled.StyledKey $value={value} $type={typeof text[0].value}>
            {!isEditing ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <TextRenderer>{value}</TextRenderer>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setTempValue(String(value ?? ""));
                    setIsEditing(true);
                  }}
                  title="Edit"
                  style={{
                    fontSize: 11,
                    padding: "2px 6px",
                    borderRadius: 3,
                    border: "1px solid rgba(0,0,0,0.1)",
                    background: "transparent",
                    cursor: "pointer",
                  }}
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
                  title="Save"
                  style={{ fontSize: 11, padding: "2px 6px", borderRadius: 3, cursor: "pointer" }}
                >
                  Save
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleCancel();
                  }}
                  title="Cancel"
                  style={{ fontSize: 11, padding: "2px 6px", borderRadius: 3, cursor: "pointer" }}
                >
                  Cancel
                </button>
              </span>
            )}
          </Styled.StyledKey>
        </StyledTextNodeWrapper>
      )}
    </Styled.StyledForeignObject>
  );
};

function propsAreEqual(prev: CustomNodeProps, next: CustomNodeProps) {
  // Compare node.text by value (deep-ish) so edits cause re-render even if
  // the array/object identity changes in different ways.
  try {
    const prevText = JSON.stringify(prev.node.text);
    const nextText = JSON.stringify(next.node.text);
    return prevText === nextText && prev.node.width === next.node.width;
  } catch (e) {
    // Fallback to reference equality if stringify fails for any reason
    return prev.node.text === next.node.text && prev.node.width === next.node.width;
  }
}

export const TextNode = React.memo(Node, propsAreEqual);

