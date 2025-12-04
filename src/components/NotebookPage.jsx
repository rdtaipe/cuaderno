import React from "react";
import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

const PageSheet = styled(Box)(({ background, showGrid }) => ({
  width: "100%",
  height: "100%",
  position: "relative",
  backgroundImage: background?.url
    ? `url(${background.url})`
    : "linear-gradient(180deg, #fdf9ef, #f3e7d8)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  boxShadow: "inset 0 0 40px rgba(0,0,0,0.12)",
  borderRadius: 12,
  overflow: "hidden",
  ...(showGrid
    ? {
        backgroundImage: `${background?.url ? `url(${background.url}),` : ""} repeating-linear-gradient(0deg, rgba(0,0,0,0.05), rgba(0,0,0,0.05) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, rgba(0,0,0,0.05), rgba(0,0,0,0.05) 1px, transparent 1px, transparent 20px)`,
      }
    : {}),
}));

const PageWrapper = styled(Box)(({ theme, zoom }) => ({
  width: 560,
  height: 760,
  padding: theme.spacing(2),
  transform: `scale(${zoom})`,
  transformOrigin: "top left",
}));

const ElementBox = styled(Box)(({ selected, isEditMode, locked }) => ({
  position: "absolute",
  cursor: isEditMode && !locked ? "move" : "pointer",
  outline: selected ? "2px dashed #6f9bff" : "none",
  userSelect: isEditMode && !locked ? "text" : "none",
}));

export const Page = React.forwardRef(
  (
    { page, onSelectElement, selectedId, onEditElement, isEditMode, showGrid, zoom },
    ref,
  ) => {
    return (
      <PageWrapper ref={ref} data-density={page.index === 0 ? "hard" : undefined} zoom={zoom}>
        <PageSheet
          background={page.background}
          showGrid={showGrid}
          onMouseDown={(e) => isEditMode && e.stopPropagation()}
          onClick={(e) => isEditMode && e.stopPropagation()}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              p: 3,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              color: "#2c2c2c",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                px: 1.5,
                py: 0.5,
                alignSelf: "flex-start",
                background: "rgba(255,255,255,0.7)",
                borderRadius: 10,
                backdropFilter: "blur(4px)",
                boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
              }}
            >
              {page.title}
            </Typography>
            <Box sx={{ position: "relative", flex: 1 }}>
              {page.elements
                .slice()
                .sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1))
                .map((element) => (
                  <Element
                    key={element.id}
                    element={element}
                    onSelect={() => onSelectElement(element.id)}
                    selected={selectedId === element.id}
                    onEditElement={onEditElement}
                    isEditMode={isEditMode}
                  />
                ))}
            </Box>
          </Box>
        </PageSheet>
      </PageWrapper>
    );
  },
);

const Element = ({ element, onSelect, selected, onEditElement, isEditMode }) => {
  if (element.visible === false) return null;

  const commonStyle = {
    top: element.y,
    left: element.x,
    width: element.width,
    height: element.height,
    transform: `rotate(${element.rotation || 0}deg)`,
    color: element.color,
    zIndex: element.zIndex || 1,
    background: element.background,
    border: `${element.borderWidth || 0}px solid ${element.borderColor || "transparent"}`,
    borderRadius: element.borderRadius ?? 8,
    opacity: element.opacity ?? 1,
    pointerEvents: element.locked ? "none" : "auto",
  };

  if (element.type === "image") {
    const filters = element.filters || { brightness: 100, contrast: 100, saturate: 100 };
    return (
      <ElementBox
        selected={selected}
        isEditMode={isEditMode}
        locked={element.locked}
        sx={{ ...commonStyle, display: "flex" }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Box
          component="img"
          src={element.content}
          alt={element.name || "nota"}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: 6,
            boxShadow: selected ? "0 10px 24px rgba(0,0,0,0.28)" : "none",
            filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%)`,
          }}
        />
      </ElementBox>
    );
  }

  const textShadow = element.shadow?.enabled
    ? `${element.shadow?.offsetX || 2}px ${element.shadow?.offsetY || 2}px ${element.shadow?.blur || 6}px ${element.shadow?.color || "rgba(0,0,0,0.35)"}`
    : "none";

  return (
    <ElementBox
      selected={selected}
      isEditMode={isEditMode}
      locked={element.locked}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onMouseDown={(e) => e.stopPropagation()}
      contentEditable={isEditMode && !element.locked}
      suppressContentEditableWarning
      onInput={(e) =>
        isEditMode && !element.locked && onEditElement(element.id, { content: e.currentTarget.innerText })
      }
      sx={{
        ...commonStyle,
        fontSize: element.fontSize,
        fontWeight: element.fontWeight,
        fontFamily: element.fontFamily,
        textAlign: element.align,
        padding: 1.2,
        boxShadow: selected ? "0 10px 24px rgba(0,0,0,0.28)" : "none",
        background: selected ? "rgba(255,255,255,0.72)" : element.background,
        letterSpacing: `${element.letterSpacing || 0}px`,
        lineHeight: element.lineHeight || 1.4,
        textShadow,
      }}
    >
      {element.content}
    </ElementBox>
  );
};

export default Page;
