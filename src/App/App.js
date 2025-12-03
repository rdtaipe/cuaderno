import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Paper, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import Moveable from "react-moveable";
import "@fontsource/sue-ellen-francisco";
import { v4 as uuid } from "uuid";
import { toJpeg, toPng } from "html-to-image";
import jsPDF from "jspdf";
import TopBar from "../Components/TopBar";
import NotebookToolbar from "../Components/NotebookToolbar";
import InspectorPanel from "../Components/NotebookInspector";
import Page from "../Components/NotebookPage";

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
    ? { top: 0, left: 0, right: 0, height: 24, borderBottom: "1px solid #d1d5db" }
    : { top: 0, bottom: 0, left: 0, width: 24, borderRight: "1px solid #d1d5db", writingMode: "vertical-rl" }),
}));

const PAGE_WIDTH = 560;
const PAGE_HEIGHT = 760;
const STORAGE_KEY = "cuaderno-interactivo";
const ASSET_KEY = "cuaderno-interactivo-assets";

const fontFamilies = [
  "'Sue Ellen Francisco', cursive",
  "'Open Sans', sans-serif",
  "'League Spartan', sans-serif",
  "'Times New Roman', serif",
];

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
  shadow: { enabled: false, offsetX: 2, offsetY: 2, blur: 6, color: "rgba(0,0,0,0.35)" },
  visible: true,
  locked: false,
  filters: { brightness: 100, contrast: 100, saturate: 100 },
  ...overrides,
});

const defaultPages = () =>
  Array.from({ length: 10 }, (_, index) => ({
    id: uuid(),
    title: index === 0 ? "Portada" : `Página ${index + 1}`,
    background: {
      url:
        index === 0
          ? null
          : index % 2 === 0
            ? "/hoja-izquierda.jpg"
            : "/hoja-derecha.jpg",
      color: index === 0 ? "#d4e5ff" : "#fdf9ef",
    },
    themeColor: index === 0 ? "#d9b8ff" : "#c7b8a5",
    elements:
      index === 0
        ? [
            defaultElement({
              name: "Título",
              content: "Mi cuaderno creativo",
              fontSize: 38,
              fontWeight: 600,
              x: 150,
              y: 180,
              width: 320,
              align: "center",
              color: "#2d2a32",
            }),
            defaultElement({
              name: "Subtítulo",
              content: "Tema o asignatura",
              fontSize: 22,
              x: 180,
              y: 360,
              width: 280,
              align: "center",
              color: "#3b3b3b",
            }),
          ]
        : [],
  }));

export default function App() {
  const [pages, setPages] = useState(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (err) {
        console.error("No se pudo leer el cache", err);
      }
    }
    return defaultPages();
  });
  const [activePageId, setActivePageId] = useState(() => pages[0]?.id);
  const [selection, setSelection] = useState(null);
  const [mode, setMode] = useState("edit");
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [showRulers, setShowRulers] = useState(false);
  const [projectName, setProjectName] = useState("Cuaderno creativo");
  const [uploadedImages, setUploadedImages] = useState(() => {
    const cached = localStorage.getItem(ASSET_KEY);
    return cached ? JSON.parse(cached) : [];
  });
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(null);
  const [spacePressed, setSpacePressed] = useState(false);

  const isEditMode = mode === "edit";
  const elementRefs = useRef({});
  const canvasRef = useRef();

  const currentPage = useMemo(
    () => pages.find((p) => p.id === activePageId) || pages[0],
    [activePageId, pages],
  );

  const selectedElement = useMemo(() => {
    if (!selection) return null;
    const page = pages.find((p) => p.id === selection.pageId);
    return page?.elements.find((el) => el.id === selection.elementId) || null;
  }, [selection, pages]);

  useEffect(() => {
    if (!activePageId && pages[0]) {
      setActivePageId(pages[0].id);
    }
  }, [activePageId, pages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
  }, [pages]);

  useEffect(() => {
    localStorage.setItem(ASSET_KEY, JSON.stringify(uploadedImages));
  }, [uploadedImages]);

  const updatePages = useCallback((updater) => {
    setPages((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      setHistory((h) => [...h.slice(-19), prev]);
      setFuture([]);
      return next;
    });
  }, []);

  const handleAddElementToPage = (element) => {
    if (!currentPage) return;
    updatePages((prev) =>
      prev.map((p) => (p.id === currentPage.id ? { ...p, elements: [...p.elements, element] } : p)),
    );
    setSelection({ pageId: currentPage.id, elementId: element.id });
  };

  const handleAddPresetText = (variant, overrides = {}) => {
    const presets = {
      title: { name: "Título", fontSize: 44, fontWeight: 700, width: 420, height: 120 },
      subtitle: { name: "Subtítulo", fontSize: 32, fontWeight: 600, width: 420, height: 100 },
      body: { name: "Cuerpo", fontSize: 20, fontWeight: 500, width: 420, height: 160 },
      custom: overrides,
    };
    const base = presets[variant] || presets.body;
    handleAddElementToPage(defaultElement(base));
  };

  const handleAddImage = (url) => {
    if (!url || !currentPage) return;
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
    const asset = { id: uuid(), url: dataUrl };
    setUploadedImages((prev) => [asset, ...prev].slice(0, 30));
  };

  const updateElement = (elementId, updates) => {
    const pageId = selection?.pageId || currentPage?.id;
    if (!pageId) return;
    updatePages((prev) =>
      prev.map((page) => {
        if (page.id !== pageId) return page;
        const updatedElements = page.elements.map((el) => (el.id === elementId ? { ...el, ...updates } : el));
        return { ...page, elements: updatedElements };
      }),
    );
  };

  const handleToggleVisibility = (elementId) => {
    updatePages((prev) =>
      prev.map((page) => {
        if (page.id !== currentPage.id) return page;
        return {
          ...page,
          elements: page.elements.map((el) =>
            el.id === elementId ? { ...el, visible: el.visible === false ? true : false } : el,
          ),
        };
      }),
    );
  };

  const handleToggleLock = (elementId) => {
    updatePages((prev) =>
      prev.map((page) => {
        if (page.id !== currentPage.id) return page;
        return {
          ...page,
          elements: page.elements.map((el) => (el.id === elementId ? { ...el, locked: !el.locked } : el)),
        };
      }),
    );
  };

  const handleRenameLayer = (elementId, name) => updateElement(elementId, { name });

  const handleBackgroundChange = (color) => {
    if (!currentPage) return;
    updatePages((prev) =>
      prev.map((p) => (p.id === currentPage.id ? { ...p, background: { ...p.background, color } } : p)),
    );
  };

  const handleBackgroundImage = (url) => {
    if (!currentPage) return;
    updatePages((prev) =>
      prev.map((p) => (p.id === currentPage.id ? { ...p, background: { ...p.background, url } } : p)),
    );
  };

  const handleDeleteSelected = () => {
    if (!selection) return;
    updatePages((prev) =>
      prev.map((page) =>
        page.id === selection.pageId
          ? { ...page, elements: page.elements.filter((el) => el.id !== selection.elementId) }
          : page,
      ),
    );
    setSelection(null);
  };

  const handleDuplicate = () => {
    if (!selectedElement) return;
    const clone = { ...selectedElement, id: uuid(), x: selectedElement.x + 24, y: selectedElement.y + 24 };
    handleAddElementToPage(clone);
  };

  const handleAlign = (direction) => {
    if (!selectedElement || !currentPage) return;
    const padding = 24;
    const updates = {};
    if (direction === "left") updates.x = padding;
    if (direction === "centerX") updates.x = (PAGE_WIDTH - selectedElement.width) / 2;
    if (direction === "right") updates.x = PAGE_WIDTH - selectedElement.width - padding;
    if (direction === "top") updates.y = padding;
    if (direction === "centerY") updates.y = (PAGE_HEIGHT - selectedElement.height) / 2;
    if (direction === "bottom") updates.y = PAGE_HEIGHT - selectedElement.height - padding;
    updateElement(selectedElement.id, updates);
  };

  const handleDistribute = (axis) => {
    if (!currentPage) return;
    const elems = currentPage.elements.filter((el) => el.visible !== false);
    if (elems.length < 2) return;
    const sorted = [...elems].sort((a, b) => (axis === "horizontal" ? a.x - b.x : a.y - b.y));
    const start = 24;
    const end = axis === "horizontal" ? PAGE_WIDTH - 24 : PAGE_HEIGHT - 24;
    const totalSize = sorted.reduce((acc, el) => acc + (axis === "horizontal" ? el.width : el.height), 0);
    const gap = (end - start - totalSize) / (sorted.length - 1);
    let cursor = start;
    const updates = sorted.map((el) => {
      const updated = { ...el, [axis === "horizontal" ? "x" : "y"]: cursor };
      cursor += (axis === "horizontal" ? el.width : el.height) + gap;
      return updated;
    });
    updatePages((prev) =>
      prev.map((p) =>
        p.id === currentPage.id
          ? { ...p, elements: p.elements.map((el) => updates.find((u) => u.id === el.id) || el) }
          : p,
      ),
    );
  };

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (!prev.length) return prev;
      setPages((current) => {
        const previous = prev[prev.length - 1];
        setFuture((futureStack) => [current, ...futureStack].slice(0, 20));
        return previous;
      });
      return prev.slice(0, -1);
    });
    setSelection(null);
  }, []);

  const handleRedo = useCallback(() => {
    setFuture((prev) => {
      if (!prev.length) return prev;
      setPages((current) => {
        const next = prev[0];
        setHistory((h) => [...h, current].slice(-20));
        return next;
      });
      return prev.slice(1);
    });
    setSelection(null);
  }, []);

  const handleZoomChange = (value) => setZoom(Math.min(3, Math.max(0.25, value)));

  const handleExport = async (format) => {
    if (!canvasRef.current) return;
    try {
      if (format === "pdf") {
        const dataUrl = await toPng(canvasRef.current, { pixelRatio: 2 });
        const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: [PAGE_WIDTH, PAGE_HEIGHT] });
        pdf.addImage(dataUrl, "PNG", 0, 0, PAGE_WIDTH, PAGE_HEIGHT);
        pdf.save(`${projectName}.pdf`);
        return;
      }
      const dataUrl =
        format === "png"
          ? await toPng(canvasRef.current, { pixelRatio: 2 })
          : await toJpeg(canvasRef.current, { pixelRatio: 2, quality: 0.95 });
      const link = document.createElement("a");
      link.download = `${projectName}.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("No se pudo exportar", error);
    }
  };

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
      if ((e.metaKey || e.ctrlKey) && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        handleZoomChange(zoom + 0.1);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "-") {
        e.preventDefault();
        handleZoomChange(zoom - 0.1);
      }
    },
    [handleRedo, handleUndo, handleDuplicate, spacePressed, zoom],
  );

  const handleKeyup = useCallback((e) => {
    if (e.key === " ") setSpacePressed(false);
  }, []);

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
        setZoom((prev) => Math.min(3, Math.max(0.25, prev + delta)));
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  const handleMouseDown = (e) => {
    if (!spacePressed) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isPanning || !panStart) return;
    setOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleFitToScreen = () => {
    const viewport = canvasRef.current?.parentElement;
    if (!viewport) return;
    const scale = Math.min(viewport.clientWidth / (PAGE_WIDTH + 40), viewport.clientHeight / (PAGE_HEIGHT + 40), 1.5);
    setZoom(scale);
  };

  const sortedLayers = useMemo(() => {
    const page = currentPage;
    return page ? [...page.elements].sort((a, b) => b.zIndex - a.zIndex) : [];
  }, [currentPage]);

  const targetEl = isEditMode && selectedElement && !selectedElement.locked ? elementRefs.current[selectedElement.id] || null : null;

  const elementGuidelines = useMemo(
    () => Object.values(elementRefs.current).filter(Boolean).filter((el) => el !== targetEl),
    [targetEl],
  );

  const handleLayerSelect = (elementId) => {
    if (!currentPage) return;
    setSelection({ pageId: currentPage.id, elementId });
  };

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
          onToggleGrid={() => setShowGrid((prev) => !prev)}
          showRulers={showRulers}
          onToggleRulers={() => setShowRulers((prev) => !prev)}
          onExport={handleExport}
          mode={mode}
          onModeChange={setMode}
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

          <CanvasViewport
            showGrid={showGrid}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {showRulers && (
              <>
                <Ruler orientation="horizontal">
                  <Box sx={{ display: "flex", gap: 2, px: 4 }}>
                    {Array.from({ length: 12 }).map((_, idx) => (
                      <span key={idx}>{idx * 50}</span>
                    ))}
                  </Box>
                </Ruler>
                <Ruler orientation="vertical">
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2, py: 4 }}>
                    {Array.from({ length: 16 }).map((_, idx) => (
                      <span key={idx}>{idx * 50}</span>
                    ))}
                  </Box>
                </Ruler>
              </>
            )}
            <CanvasInner offset={offset}>
              <Box ref={canvasRef} sx={{ width: PAGE_WIDTH, height: PAGE_HEIGHT, position: "relative" }}>
                {currentPage && (
                  <Page
                    page={currentPage}
                    onSelectElement={(elementId) => setSelection({ pageId: currentPage.id, elementId })}
                    selectedId={selection?.pageId === currentPage.id ? selection.elementId : null}
                    elementRefs={elementRefs}
                    onEditElement={updateElement}
                    isEditMode={isEditMode}
                    showGrid={showGrid}
                    zoom={zoom}
                  />
                )}
              </Box>
            </CanvasInner>
            {selectedElement && isEditMode && !selectedElement.locked && (
              <Moveable
                target={targetEl}
                origin={false}
                draggable
                resizable
                rotatable
                keepRatio={selectedElement.type === "image"}
                onDrag={({ left, top }) => updateElement(selectedElement.id, { x: left, y: top })}
                onResize={({ width, height, drag }) =>
                  updateElement(selectedElement.id, {
                    width,
                    height,
                    x: drag.beforeTranslate[0],
                    y: drag.beforeTranslate[1],
                  })
                }
                onRotate={({ beforeRotate }) => updateElement(selectedElement.id, { rotation: beforeRotate })}
                throttleDrag={0}
                renderDirections={["nw", "n", "ne", "w", "e", "sw", "s", "se"]}
                edge
                padding={{ left: 2, right: 2, top: 2, bottom: 2 }}
                snappable
                snapCenter
                elementGuidelines={elementGuidelines}
                zoom={zoom}
              />
            )}
          </CanvasViewport>

          <InspectorPanel
            selectedElement={selectedElement}
            currentBackgroundColor={currentPage?.background?.color}
            fontFamilies={fontFamilies}
            onUpdateElement={updateElement}
            onBackgroundChange={handleBackgroundChange}
            onBackgroundImage={handleBackgroundImage}
            sortedLayers={sortedLayers}
            onLayerSelect={handleLayerSelect}
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