import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { Box, Paper, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Layer, Rect, Stage, Transformer } from "react-konva";
import "@fontsource/sue-ellen-francisco";
import { v4 as uuid } from "uuid";
import { toJpeg, toPng } from "html-to-image";
import jsPDF from "jspdf";

import TopBar from "../Components/TopBar";
import NotebookToolbar from "../Components/NotebookToolbar";
import InspectorPanel from "../Components/NotebookInspector";
import Page from "../Components/NotebookPage";
import StartMenu from "../Components/StartMenu";

/* ─────────────────────────
 *  STYLED COMPONENTS & CONSTANTS
 * ───────────────────────── */

const NotebookStage = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  padding: theme.spacing(3),
  background:
    "radial-gradient(circle at 10% 20%, rgba(94,73,37,0.2), transparent 25%)," +
    "radial-gradient(circle at 70% 10%, rgba(66,47,25,0.25), transparent 25%)," +
    "linear-gradient(135deg, #e7d9c8 0%, #c9b79f 40%, #b99f78 100%)",
  display: "flex",
  alignItems: "stretch",
  justifyContent: "center",
}));

const CanvasFrame = styled(Paper)(({ theme }) => ({
  flex: 1,
  display: "flex",
  gap: theme.spacing(2),
  padding: theme.spacing(2.5),
  maxWidth: 1600,
  background: "rgba(255,255,255,0.92)",
  boxShadow: "0 18px 48px rgba(73, 56, 30, 0.4)",
  borderRadius: 18,
  border: "1px solid rgba(0,0,0,0.05)",
}));

const CanvasViewport = styled(Box)(({ showGrid }) => ({
  flex: 1,
  background: showGrid
    ? "repeating-linear-gradient(0deg, rgba(0,0,0,0.04), rgba(0,0,0,0.04) 1px, transparent 1px, transparent 24px), repeating-linear-gradient(90deg, rgba(0,0,0,0.04), rgba(0,0,0,0.04) 1px, transparent 1px, transparent 24px), #f5f6f8"
    : "#f5f6f8",
  borderRadius: 12,
  position: "relative",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const CanvasInner = styled(Box)(({ offset }) => ({
  position: "relative",
  transform: `translate(${offset.x}px, ${offset.y}px)`,
  transition: "transform 0.15s ease-out",
}));

const Ruler = styled(Box)(({ orientation }) => ({
  position: "absolute",
  background: "#e5e7ec",
  color: "#6b7280",
  fontSize: 10,
  display: "flex",
  alignItems: "center",
  zIndex: 2,
  ...(orientation === "horizontal"
    ? {
      top: 0,
      left: 0,
      right: 0,
      height: 24,
      borderBottom: "1px solid #d1d5db",
    }
    : {
      top: 0,
      bottom: 0,
      left: 0,
      width: 24,
      borderRight: "1px solid #d1d5db",
      writingMode: "vertical-rl",
    }),
}));

const PAGE_WIDTH = 560;
const PAGE_HEIGHT = 760;

const fontFamilies = [
  "'Sue Ellen Francisco', cursive",
  "'Open Sans', sans-serif",
  "'League Spartan', sans-serif",
  "'Times New Roman', serif",
];

/* ─────────────────────────
 *  HELPERS
 * ───────────────────────── */

const defaultElement = (overrides = {}) => ({
  id: uuid(),
  type: "text",
  name: "Texto",
  content: "Escribe algo creativo aquí",
  color: "#1f1f1f",
  background: "transparent",
  fontSize: 26,
  fontWeight: 500,
  fontFamily: fontFamilies[0],
  align: "left",
  x: 120,
  y: 140,
  width: 260,
  height: 140,
  rotation: 0,
  zIndex: 1,
  borderWidth: 0,
  borderColor: "transparent",
  borderRadius: 8,
  opacity: 1,
  letterSpacing: 0,
  lineHeight: 1.4,
  shadow: {
    enabled: false,
    offsetX: 2,
    offsetY: 2,
    blur: 6,
    color: "rgba(0,0,0,0.35)",
  },
  visible: true,
  locked: false,
  filters: { brightness: 100, contrast: 100, saturate: 100 },
  ...overrides,
});

/* ─────────────────────────
 *  SUBCOMPONENTES
 * ───────────────────────── */

/**
 * Rulers overlay (top + left)
 */
function NotebookRulers({ showRulers }) {
  if (!showRulers) return null;

  return (
    <>
      <Ruler orientation="horizontal">
        <Box sx={{ display: "flex", gap: 2, px: 4 }}>
          {Array.from({ length: 12 }).map((_, idx) => (
            <span key={idx}>{idx * 50}</span>
          ))}
        </Box>
      </Ruler>

      <Ruler orientation="vertical">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            py: 4,
          }}
        >
          {Array.from({ length: 16 }).map((_, idx) => (
            <span key={idx}>{idx * 50}</span>
          ))}
        </Box>
      </Ruler>
    </>
  );
}

/**
 * Konva overlay for selection, dragging and transforming
 */
function NotebookTransformLayer({
  currentPage,
  selection,
  canTransform,
  zoom,
  konvaShapeRefs,
  transformerRef,
  selectedElement,
  snapToBounds,
  updateElement,
  handleTransformEnd,
  onClearSelection,
}) {
  if (!currentPage) return null;

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        pointerEvents: canTransform ? "auto" : "none",
        width: PAGE_WIDTH * zoom,
        height: PAGE_HEIGHT * zoom,
      }}
    >
      <Stage
        width={PAGE_WIDTH}
        height={PAGE_HEIGHT}
        scaleX={zoom}
        scaleY={zoom}
        style={{
          width: PAGE_WIDTH * zoom,
          height: PAGE_HEIGHT * zoom,
        }}
        listening={canTransform}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) {
            onClearSelection();
          }
        }}
      >
        <Layer>
          {currentPage.elements
            .filter((el) => el.visible !== false)
            .map((element) => (
              <Rect
                key={element.id}
                ref={(node) => {
                  if (node) {
                    konvaShapeRefs.current[element.id] = node;
                  } else {
                    delete konvaShapeRefs.current[element.id];
                  }
                }}
                x={element.x}
                y={element.y}
                width={element.width}
                height={element.height}
                rotation={element.rotation || 0}
                draggable={canTransform && selection?.elementId === element.id}
                listening={canTransform && selection?.elementId === element.id}
                onClick={(evt) => {
                  evt.cancelBubble = true;
                  onClearSelection(element.id, currentPage.id, false);
                }}
                onTap={(evt) => {
                  evt.cancelBubble = true;
                  onClearSelection(element.id, currentPage.id, false);
                }}
                onDragMove={(evt) => {
                  const node = evt.target;
                  const newX = snapToBounds(
                    node.x(),
                    PAGE_WIDTH,
                    node.width(),
                    8,
                  );
                  const newY = snapToBounds(
                    node.y(),
                    PAGE_HEIGHT,
                    node.height(),
                    8,
                  );
                  node.x(newX);
                  node.y(newY);
                }}
                onDragEnd={(evt) => {
                  const node = evt.target;
                  updateElement(element.id, {
                    x: node.x(),
                    y: node.y(),
                  });
                }}
                onTransformEnd={(evt) =>
                  handleTransformEnd(element.id, evt.target)
                }
                fillEnabled={false}
                strokeEnabled={false}
              />
            ))}

          {canTransform && selection && (
            <Transformer
              ref={transformerRef}
              keepRatio={selectedElement?.type === "image"}
              boundBoxFunc={(oldBox, newBox) => {
                if (
                  Math.abs(newBox.width) < 12 ||
                  Math.abs(newBox.height) < 12
                ) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          )}
        </Layer>
      </Stage>
    </Box>
  );
}

/**
 * Canvas wrapper: rulers, page, konva transform layer, pan & zoom
 */
function NotebookCanvas({
  currentPage,
  selection,
  setSelection,
  isEditMode,
  showGrid,
  showRulers,
  zoom,
  offset,
  canvasRef,
  konvaShapeRefs,
  transformerRef,
  selectedElement,
  snapToBounds,
  updateElement,
  handleTransformEnd,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
}) {
  const canTransform = isEditMode && selectedElement && !selectedElement.locked;

  const handleSelectElement = (elementId, pageId, clear = false) => {
    if (clear) {
      setSelection(null);
    } else {
      setSelection({ pageId, elementId });
    }
  };

  return (
    <CanvasViewport
      showGrid={showGrid}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <NotebookRulers showRulers={showRulers} />

      <CanvasInner offset={offset}>
        <Box
          ref={canvasRef}
          sx={{
            width: PAGE_WIDTH,
            height: PAGE_HEIGHT,
            position: "relative",
          }}
        >
          {currentPage && (
            <Page
              page={currentPage}
              onSelectElement={(elementId) =>
                handleSelectElement(elementId, currentPage.id)
              }
              selectedId={
                selection?.pageId === currentPage.id
                  ? selection.elementId
                  : null
              }
              onEditElement={updateElement}
              isEditMode={isEditMode}
              showGrid={showGrid}
              zoom={zoom}
            />
          )}

          <NotebookTransformLayer
            currentPage={currentPage}
            selection={selection}
            canTransform={canTransform}
            zoom={zoom}
            konvaShapeRefs={konvaShapeRefs}
            transformerRef={transformerRef}
            selectedElement={selectedElement}
            snapToBounds={snapToBounds}
            updateElement={updateElement}
            handleTransformEnd={handleTransformEnd}
            onClearSelection={(elementId, pageId, clearAll = true) => {
              if (clearAll) {
                setSelection(null);
              } else {
                setSelection({ pageId, elementId });
              }
            }}
          />
        </Box>
      </CanvasInner>
    </CanvasViewport>
  );
}

/* ─────────────────────────
 *  COMPONENTE PRINCIPAL
 * ───────────────────────── */

export default function NotebookApp({ State, Action }) {
  /* ── STATE ───────────────────── */

  const [books] = State.use("canvas.data.books");
  const [activeBookId] = State.use("canvas.data.activeBookId");
  const [activePageId] = State.use("canvas.data.activePageId");
  const [selection] = State.use("canvas.interaction.selection");
  const [mode] = State.use("canvas.ui.mode");
  const [zoom] = State.use("canvas.ui.zoom");
  const [showGrid] = State.use("canvas.ui.showGrid");
  const [showRulers] = State.use("canvas.ui.showRulers");
  const [projectName] = State.use("canvas.data.projectName");
  const [uploadedImages] = State.use("canvas.data.uploadedImages");
  const [offset] = State.use("canvas.ui.offset");
  const [isPanning] = State.use("canvas.interaction.isPanning");
  const [panStart] = State.use("canvas.interaction.panStart");
  const [spacePressed] = State.use("canvas.interaction.spacePressed");

  const setSelection = (payload) => {
    if (!payload) {
      Action.canvas.clearSelection();
    } else {
      Action.canvas.setSelection(payload);
    }
  };

  const setMode = Action.canvas.setMode;
  const setZoom = Action.canvas.setZoom;
  const setOffset = Action.canvas.setOffset;
  const toggleGrid = Action.canvas.toggleGrid;
  const toggleRulers = Action.canvas.toggleRulers;
  const setPanning = Action.canvas.setPanning;
  const setSpacePressed = Action.canvas.setSpacePressed;
  const setProjectName = Action.canvas.setProjectName;

  const isEditMode = mode === "edit";

  const canvasRef = useRef();
  const konvaShapeRefs = useRef({});
  const transformerRef = useRef();

  /* ── MEMOS ───────────────────── */

  const activeBook = useMemo(
    () => books.find((book) => book.id === activeBookId) || books[0],
    [books, activeBookId],
  );
  const pages = activeBook?.pages || [];

  const currentPage = useMemo(
    () => pages.find((p) => p.id === activePageId) || pages[0],
    [activePageId, pages],
  );

  const selectedElement = useMemo(() => {
    if (!selection) return null;
    const page = pages.find((p) => p.id === selection.pageId);
    return page?.elements.find((el) => el.id === selection.elementId) || null;
  }, [selection, pages]);

  const sortedLayers = useMemo(() => {
    const page = currentPage;
    return page ? [...page.elements].sort((a, b) => b.zIndex - a.zIndex) : [];
  }, [currentPage]);

  /* ── SIDE EFFECTS ───────────────────── */

  useEffect(() => {
    if (!activeBook || activePageId) return;
    if (activeBook.pages?.[0]) {
      Action.canvas.setActivePage(activeBook.id, activeBook.pages[0].id);
    }
  }, [Action, activeBook, activePageId]);

  /* ── STATE UPDATERS ───────────────────── */

  const updateElement = (elementId, updates) => {
    const pageId = selection?.pageId || currentPage?.id;
    if (!activeBook || !pageId) return;
    Action.canvas.updateElement(activeBook.id, pageId, elementId, updates);
  };

  /* ── ELEMENT / PAGE ACTIONS ───────────────────── */

  const handleAddElementToPage = (element) => {
    if (!activeBook || !currentPage) return;
    Action.canvas.addElement(activeBook.id, currentPage.id, element);
    Action.canvas.setSelection({ pageId: currentPage.id, elementId: element.id });
  };

  const handleAddPresetText = (variant, overrides = {}) => {
    const presets = {
      title: {
        name: "Título",
        fontSize: 44,
        fontWeight: 700,
        width: 420,
        height: 120,
      },
      subtitle: {
        name: "Subtítulo",
        fontSize: 32,
        fontWeight: 600,
        width: 420,
        height: 100,
      },
      body: {
        name: "Cuerpo",
        fontSize: 20,
        fontWeight: 500,
        width: 420,
        height: 160,
      },
      custom: overrides,
    };
    const base = presets[variant] || presets.body;
    handleAddElementToPage(defaultElement(base));
  };

  const handleAddImage = (url) => {
    if (!url || !currentPage || !activeBook) return;
    const imgElement = defaultElement({
      type: "image",
      name: "Imagen",
      content: url,
      width: 320,
      height: 240,
      fontSize: undefined,
      fontFamily: fontFamilies[0],
    });
    handleAddElementToPage(imgElement);
  };

  const handleUploadImage = (dataUrl) => {
    if (!dataUrl) return;
    Action.canvas.addUploadedImage(dataUrl);
  };

  const handleToggleVisibility = (elementId) => {
    if (!activeBook || !currentPage) return;
    Action.canvas.toggleElementVisibility(activeBook.id, currentPage.id, elementId);
  };

  const handleToggleLock = (elementId) => {
    if (!activeBook || !currentPage) return;
    Action.canvas.toggleElementLock(activeBook.id, currentPage.id, elementId);
  };

  const handleRenameLayer = (elementId, name) => updateElement(elementId, { name });

  const handleBackgroundChange = (color) => {
    if (!activeBook || !currentPage) return;
    Action.canvas.setBackgroundColor(activeBook.id, currentPage.id, color);
  };

  const handleBackgroundImage = (url) => {
    if (!activeBook || !currentPage) return;
    Action.canvas.setBackgroundImage(activeBook.id, currentPage.id, url);
  };

  const handleDeleteSelected = () => {
    if (!selection || !activeBook) return;
    Action.canvas.removeElement(
      activeBook.id,
      selection.pageId,
      selection.elementId,
    );
    Action.canvas.clearSelection();
  };

  const handleDuplicate = () => {
    if (!selectedElement || !activeBook || !currentPage) return;
    Action.canvas.duplicateElement(activeBook.id, currentPage.id, selectedElement.id, {
      x: 24,
      y: 24,
    });
  };

  const handleAlign = (direction) => {
    if (!selectedElement || !currentPage) return;
    const padding = 24;
    const updates = {};

    if (direction === "left") updates.x = padding;
    if (direction === "centerX")
      updates.x = (PAGE_WIDTH - selectedElement.width) / 2;
    if (direction === "right")
      updates.x = PAGE_WIDTH - selectedElement.width - padding;

    if (direction === "top") updates.y = padding;
    if (direction === "centerY")
      updates.y = (PAGE_HEIGHT - selectedElement.height) / 2;
    if (direction === "bottom")
      updates.y = PAGE_HEIGHT - selectedElement.height - padding;

    updateElement(selectedElement.id, updates);
  };

  const handleDistribute = (axis) => {
    if (!currentPage || !activeBook) return;
    const elems = currentPage.elements.filter((el) => el.visible !== false);
    if (elems.length < 2) return;

    const sorted = [...elems].sort((a, b) =>
      axis === "horizontal" ? a.x - b.x : a.y - b.y,
    );
    const start = 24;
    const end = axis === "horizontal" ? PAGE_WIDTH - 24 : PAGE_HEIGHT - 24;
    const totalSize = sorted.reduce(
      (acc, el) => acc + (axis === "horizontal" ? el.width : el.height),
      0,
    );
    const gap = (end - start - totalSize) / (sorted.length - 1);
    let cursor = start;

    const updates = sorted.map((el) => {
      const updated = {
        ...el,
        [axis === "horizontal" ? "x" : "y"]: cursor,
      };
      cursor += (axis === "horizontal" ? el.width : el.height) + gap;
      return updated;
    });

    updates.forEach((el) => {
      Action.canvas.updateElement(activeBook.id, currentPage.id, el.id, el);
    });
  };

  /* ── UNDO / REDO ───────────────────── */

  const handleUndo = useCallback(() => {
    Action.canvas.undo();
  }, [Action]);

  const handleRedo = useCallback(() => {
    Action.canvas.redo();
  }, [Action]);

  /* ── ZOOM & EXPORT ───────────────────── */

  const handleZoomChange = (value) =>
    Action.canvas.setZoom(Math.min(3, Math.max(0.25, value)));

  const handleFitToScreen = () => {
    const viewport = canvasRef.current?.parentElement;
    if (!viewport) return;
    const scale = Math.min(
      viewport.clientWidth / (PAGE_WIDTH + 40),
      viewport.clientHeight / (PAGE_HEIGHT + 40),
      1.5,
    );
    Action.canvas.setZoom(scale);
  };

  const handleExport = async (format) => {
    if (!canvasRef.current) return;
    try {
      if (format === "pdf") {
        const dataUrl = await toPng(canvasRef.current, {
          pixelRatio: 2,
        });
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "pt",
          format: [PAGE_WIDTH, PAGE_HEIGHT],
        });
        pdf.addImage(
          dataUrl,
          "PNG",
          0,
          0,
          PAGE_WIDTH,
          PAGE_HEIGHT,
        );
        pdf.save(`${projectName}.pdf`);
        return;
      }
      const dataUrl =
        format === "png"
          ? await toPng(canvasRef.current, { pixelRatio: 2 })
          : await toJpeg(canvasRef.current, {
            pixelRatio: 2,
            quality: 0.95,
          });
      const link = document.createElement("a");
      link.download = `${projectName}.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("No se pudo exportar", error);
    }
  };

  /* ── KEYBOARD & MOUSE HANDLERS ───────────────────── */

  const handleKeydown = useCallback(
    (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        handleDuplicate();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        handleDeleteSelected();
      }
      if (e.key === " " && !spacePressed) {
        setSpacePressed(true);
      }
      if (
        (e.metaKey || e.ctrlKey) &&
        (e.key === "+" || e.key === "=")
      ) {
        e.preventDefault();
        handleZoomChange(zoom + 0.1);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "-") {
        e.preventDefault();
        handleZoomChange(zoom - 0.1);
      }
    },
    [
      handleRedo,
      handleUndo,
      handleDuplicate,
      handleDeleteSelected,
      handleZoomChange,
      setSpacePressed,
      spacePressed,
      zoom,
    ],
  );

  const handleKeyup = useCallback(
    (e) => {
      if (e.key === " ") setSpacePressed(false);
    },
    [setSpacePressed],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("keyup", handleKeyup);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("keyup", handleKeyup);
    };
  }, [handleKeydown, handleKeyup]);

  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const nextZoom = Math.min(3, Math.max(0.25, zoom + delta));
        setZoom(nextZoom);
      }
    };
    window.addEventListener("wheel", handleWheel, {
      passive: false,
    });
    return () =>
      window.removeEventListener("wheel", handleWheel);
  }, [setZoom, zoom]);

  const handleMouseDown = (e) => {
    if (!spacePressed) return;
    setPanning(true, {
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!isPanning || !panStart) return;
    setOffset({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    });
  };

  const handleMouseUp = () => setPanning(false, null);

  /* ── KONVA HELPERS ───────────────────── */

  const snapToBounds = (value, max, size, gap = 6) => {
    const edges = [0, (max - size) / 2, max - size];
    for (const edge of edges) {
      if (Math.abs(value - edge) <= gap) return edge;
    }
    return value;
  };

  const handleTransformEnd = (elementId, node) => {
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const nextWidth = Math.max(12, node.width() * scaleX);
    const nextHeight = Math.max(12, node.height() * scaleY);
    node.scaleX(1);
    node.scaleY(1);
    updateElement(elementId, {
      x: node.x(),
      y: node.y(),
      width: nextWidth,
      height: nextHeight,
      rotation: node.rotation(),
    });
  };

  useEffect(() => {
    const tr = transformerRef.current;
    if (!tr) return;
    const node =
      isEditMode &&
        selectedElement &&
        !selectedElement.locked &&
        selection
        ? konvaShapeRefs.current[selection.elementId]
        : null;
    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [isEditMode, selectedElement, selection, currentPage]);

  if (mode === "library" || !activeBook) {
    return (
      <NotebookStage>
        <Stack spacing={3} sx={{ width: "100%", maxWidth: 1100 }}>
          <TopBar
            projectName={projectName}
            onProjectNameChange={setProjectName}
            onUndo={() => {}}
            onRedo={() => {}}
            zoom={zoom}
            onZoomChange={() => {}}
            onFit={() => {}}
            onCenter={() => {}}
            showGrid={showGrid}
            onToggleGrid={() => {}}
            showRulers={showRulers}
            onToggleRulers={() => {}}
            onExport={() => {}}
            mode="library"
            onModeChange={() => {}}
          />
          <StartMenu
            books={books}
            onOpenBook={(bookId) => {
              Action.canvas.setActiveBook(bookId);
              Action.canvas.setMode("edit");
            }}
            onCreateBook={() => {
              const newBookId = uuid();
              const firstPageId = uuid();
              Action.canvas.addBook({
                id: newBookId,
                type: "book",
                value: "Nuevo cuaderno",
                style: {
                  width: 800,
                  height: 600,
                  backgroundColor: "#f5f5f5",
                  fontFamily: "Arial, sans-serif",
                  fontSize: "16px",
                  color: "#000000",
                },
                attributes: {
                  author: "Autor",
                  paperType: "plain",
                  defaultStyles: {
                    title: { fontSize: "24px", fontWeight: "bold", color: "#0000aa" },
                    paragraph: { fontSize: "16px", lineHeight: "1.5", marginBottom: "20px" },
                  },
                },
                elements: [],
                pages: [
                  {
                    id: firstPageId,
                    type: "page",
                    value: "Página 1",
                    style: {
                      width: 800,
                      height: 600,
                      backgroundColor: "#ffffff",
                      fontFamily: "Georgia, serif",
                    },
                    attributes: {
                      pageNumber: 1,
                      template: "blank",
                    },
                    elements: [],
                  },
                ],
                history: [],
                relationships: {
                  groups: [],
                  sequences: [{ type: "pageOrder", order: [firstPageId] }],
                },
              });
              Action.canvas.setActiveBook(newBookId);
              Action.canvas.setMode("edit");
            }}
          />
        </Stack>
      </NotebookStage>
    );
  }

  /* ── RENDER ───────────────────── */

  return (
    <NotebookStage>
      <Stack spacing={2} sx={{ width: "100%", maxWidth: 1700 }}>
        <TopBar
          projectName={projectName}
          onProjectNameChange={setProjectName}
          onUndo={handleUndo}
          onRedo={handleRedo}
          zoom={zoom}
          onZoomChange={handleZoomChange}
          onFit={handleFitToScreen}
          onCenter={() => setOffset({ x: 0, y: 0 })}
          showGrid={showGrid}
          onToggleGrid={toggleGrid}
          showRulers={showRulers}
          onToggleRulers={toggleRulers}
          onExport={handleExport}
          mode={mode}
          onModeChange={setMode}
          onOpenLibrary={() => Action.canvas.setMode("library")}
        />

        <CanvasFrame>
          <NotebookToolbar
            mode={mode}
            onModeChange={setMode}
            onAddImage={handleAddImage}
            uploadedImages={uploadedImages}
            onUploadImage={handleUploadImage}
            onAddPresetText={handleAddPresetText}
          />

          <NotebookCanvas
            currentPage={currentPage}
            selection={selection}
            setSelection={setSelection}
            isEditMode={isEditMode}
            showGrid={showGrid}
            showRulers={showRulers}
            zoom={zoom}
            offset={offset}
            canvasRef={canvasRef}
            konvaShapeRefs={konvaShapeRefs}
            transformerRef={transformerRef}
            selectedElement={selectedElement}
            snapToBounds={snapToBounds}
            updateElement={updateElement}
            handleTransformEnd={handleTransformEnd}
            handleMouseDown={handleMouseDown}
            handleMouseMove={handleMouseMove}
            handleMouseUp={handleMouseUp}
          />

          <InspectorPanel
            selectedElement={selectedElement}
            currentBackgroundColor={currentPage?.background?.color}
            fontFamilies={fontFamilies}
            onUpdateElement={updateElement}
            onBackgroundChange={handleBackgroundChange}
            onBackgroundImage={handleBackgroundImage}
            sortedLayers={sortedLayers}
            onLayerSelect={(elementId) =>
              setSelection({
                pageId: currentPage.id,
                elementId,
              })
            }
            onToggleVisibility={handleToggleVisibility}
            onToggleLock={handleToggleLock}
            onRenameLayer={handleRenameLayer}
            onDelete={handleDeleteSelected}
            onDuplicate={handleDuplicate}
            onAlign={handleAlign}
            onDistribute={handleDistribute}
            page={currentPage}
          />
        </CanvasFrame>
      </Stack>
    </NotebookStage>
  );
}
