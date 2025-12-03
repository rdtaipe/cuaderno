import React from "react";
import {
  Box,
  Button,
  Divider,
  IconButton,
  Slider,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import LayersIcon from "@mui/icons-material/Layers";
import PaletteIcon from "@mui/icons-material/Palette";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import LockIcon from "@mui/icons-material/Lock";
import AlignHorizontalCenterIcon from "@mui/icons-material/AlignHorizontalCenter";
import AlignHorizontalLeftIcon from "@mui/icons-material/AlignHorizontalLeft";
import AlignHorizontalRightIcon from "@mui/icons-material/AlignHorizontalRight";
import AlignVerticalCenterIcon from "@mui/icons-material/AlignVerticalCenter";
import AlignVerticalTopIcon from "@mui/icons-material/AlignVerticalTop";
import AlignVerticalBottomIcon from "@mui/icons-material/AlignVerticalBottom";
import FlipCameraAndroidIcon from "@mui/icons-material/FlipCameraAndroid";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { HexColorPicker } from "react-colorful";

const InspectorRoot = styled(Stack)(({ theme }) => ({
  width: 320,
  background: "linear-gradient(180deg, #f7f7fb, #eef1f6)",
  borderRadius: 14,
  padding: theme.spacing(2),
  boxShadow: "0 10px 28px rgba(0,0,0,0.16)",
  gap: theme.spacing(1.5),
}));

const LayerItem = styled(Box)(({ theme, active }) => ({
  padding: theme.spacing(1),
  borderRadius: 10,
  cursor: "pointer",
  background: active ? "rgba(99,132,255,0.15)" : "transparent",
  border: active ? "1px solid #6a8dff" : "1px solid transparent",
  transition: "all 0.2s ease",
  display: "flex",
  alignItems: "center",
  gap: 0.75,
}));

const SectionTitle = ({ children }) => (
  <Typography variant="subtitle2" fontWeight={700} color="text.primary">
    {children}
  </Typography>
);

export default function InspectorPanel({
  selectedElement,
  currentBackgroundColor,
  fontFamilies,
  onUpdateElement,
  onBackgroundChange,
  onBackgroundImage,
  sortedLayers,
  onLayerSelect,
  onToggleVisibility,
  onToggleLock,
  onRenameLayer,
  onDelete,
  onDuplicate,
  onAlign,
  onDistribute,
  page,
}) {
  return (
    <InspectorRoot>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle1" fontWeight={700}>
          Inspector
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <Tooltip title="Duplicar elemento">
            <span>
              <IconButton size="small" onClick={onDuplicate} disabled={!selectedElement}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Eliminar elemento">
            <span>
              <IconButton size="small" onClick={onDelete} disabled={!selectedElement}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <LayerBadge layers={sortedLayers.length} />
        </Box>
      </Stack>
      <Divider />

      <Stack spacing={1}>
        <Typography variant="caption" color="text.secondary">
          Color activo
        </Typography>
        <HexColorPicker
          color={selectedElement?.color || currentBackgroundColor || "#fdf9ef"}
          onChange={(color) => {
            if (selectedElement) {
              onUpdateElement(selectedElement.id, { color });
            } else {
              onBackgroundChange(color);
            }
          }}
          style={{ width: "100%" }}
        />
      </Stack>

      {selectedElement?.type === "text" && (
        <TextControls
          element={selectedElement}
          fontFamilies={fontFamilies}
          onUpdateElement={onUpdateElement}
        />
      )}

      {selectedElement?.type === "image" && (
        <ImageControls element={selectedElement} onUpdateElement={onUpdateElement} />
      )}

      {selectedElement && (
        <AlignmentControls onAlign={onAlign} onDistribute={onDistribute} />
      )}

      <Divider />

      <BackgroundControls
        page={page}
        onBackgroundChange={onBackgroundChange}
        onBackgroundImage={onBackgroundImage}
      />

      <Divider />

      <LayerList
        layers={sortedLayers}
        selectedId={selectedElement?.id}
        onLayerSelect={onLayerSelect}
        onToggleVisibility={onToggleVisibility}
        onToggleLock={onToggleLock}
        onRenameLayer={onRenameLayer}
      />
    </InspectorRoot>
  );
}

function LayerBadge({ layers }) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 1,
        py: 0.5,
        borderRadius: 10,
        bgcolor: "primary.light",
        color: "primary.contrastText",
        fontWeight: 700,
      }}
    >
      <LayersIcon fontSize="small" /> {layers}
    </Box>
  );
}

function TextControls({ element, fontFamilies, onUpdateElement }) {
  return (
    <Stack spacing={1.5}>
      <SectionTitle>Tipografía</SectionTitle>
      <TextField
        select
        SelectProps={{ native: true }}
        value={element.fontFamily}
        onChange={(e) => onUpdateElement(element.id, { fontFamily: e.target.value })}
      >
        {fontFamilies.map((family) => (
          <option key={family} value={family}>
            {family.replace(/'/g, "")}
          </option>
        ))}
      </TextField>
      <Stack spacing={1}>
        <Typography variant="caption">Tamaño</Typography>
        <Slider
          value={element.fontSize || 24}
          min={12}
          max={96}
          onChange={(_, value) => onUpdateElement(element.id, { fontSize: value })}
        />
      </Stack>
      <Stack spacing={1}>
        <Typography variant="caption">Grosor</Typography>
        <Slider
          value={element.fontWeight || 400}
          min={200}
          max={900}
          step={100}
          onChange={(_, value) => onUpdateElement(element.id, { fontWeight: value })}
        />
      </Stack>
      <Stack spacing={1}>
        <Typography variant="caption">Interlineado</Typography>
        <Slider
          value={element.lineHeight || 1.4}
          min={1}
          max={3}
          step={0.1}
          onChange={(_, value) => onUpdateElement(element.id, { lineHeight: value })}
        />
      </Stack>
      <Stack spacing={1}>
        <Typography variant="caption">Espaciado de letras</Typography>
        <Slider
          value={element.letterSpacing || 0}
          min={-2}
          max={10}
          step={0.2}
          onChange={(_, value) => onUpdateElement(element.id, { letterSpacing: value })}
        />
      </Stack>
      <Stack spacing={1}>
        <Typography variant="caption">Opacidad</Typography>
        <Slider
          value={element.opacity ?? 1}
          min={0.1}
          max={1}
          step={0.05}
          onChange={(_, value) => onUpdateElement(element.id, { opacity: value })}
        />
      </Stack>
      <Stack spacing={1}>
        <Typography variant="caption">Borde</Typography>
        <Slider
          value={element.borderWidth || 0}
          min={0}
          max={12}
          step={1}
          onChange={(_, value) => onUpdateElement(element.id, { borderWidth: value })}
        />
        <TextField
          size="small"
          type="color"
          value={element.borderColor || "#000000"}
          onChange={(e) => onUpdateElement(element.id, { borderColor: e.target.value })}
          inputProps={{ style: { padding: 0, height: 36, cursor: "pointer" } }}
        />
      </Stack>
      <Stack spacing={1}>
        <Typography variant="caption">Fondo</Typography>
        <TextField
          size="small"
          type="color"
          value={element.background || "transparent"}
          onChange={(e) => onUpdateElement(element.id, { background: e.target.value })}
          inputProps={{ style: { padding: 0, height: 36, cursor: "pointer" } }}
        />
      </Stack>
      <Stack spacing={1}>
        <Typography variant="caption">Sombra</Typography>
        <Switch
          checked={element.shadow?.enabled || false}
          onChange={(_, checked) =>
            onUpdateElement(element.id, {
              shadow: { ...element.shadow, enabled: checked },
            })
          }
        />
        <Stack direction="row" spacing={1}>
          <TextField
            label="Desplazamiento X"
            size="small"
            type="number"
            value={element.shadow?.offsetX ?? 2}
            onChange={(e) =>
              onUpdateElement(element.id, {
                shadow: { ...element.shadow, offsetX: Number(e.target.value), enabled: true },
              })
            }
          />
          <TextField
            label="Desplazamiento Y"
            size="small"
            type="number"
            value={element.shadow?.offsetY ?? 2}
            onChange={(e) =>
              onUpdateElement(element.id, {
                shadow: { ...element.shadow, offsetY: Number(e.target.value), enabled: true },
              })
            }
          />
        </Stack>
        <Stack spacing={1}>
          <Typography variant="caption">Blur</Typography>
          <Slider
            value={element.shadow?.blur ?? 6}
            min={0}
            max={20}
            onChange={(_, value) =>
              onUpdateElement(element.id, {
                shadow: { ...element.shadow, blur: value, enabled: true },
              })
            }
          />
        </Stack>
        <TextField
          size="small"
          type="color"
          value={element.shadow?.color || "#000000"}
          onChange={(e) =>
            onUpdateElement(element.id, {
              shadow: { ...element.shadow, color: e.target.value, enabled: true },
            })
          }
          inputProps={{ style: { padding: 0, height: 36, cursor: "pointer" } }}
        />
      </Stack>
      <ToggleButtonGroup
        value={element.align || "left"}
        exclusive
        fullWidth
        onChange={(_, value) => value && onUpdateElement(element.id, { align: value })}
      >
        <ToggleButton value="left">Izquierda</ToggleButton>
        <ToggleButton value="center">Centro</ToggleButton>
        <ToggleButton value="right">Derecha</ToggleButton>
      </ToggleButtonGroup>
    </Stack>
  );
}

function ImageControls({ element, onUpdateElement }) {
  const filters = element.filters || { brightness: 100, contrast: 100, saturate: 100 };
  return (
    <Stack spacing={1.5}>
      <SectionTitle>Imagen</SectionTitle>
      <Stack spacing={1}>
        <Typography variant="caption">Opacidad</Typography>
        <Slider
          value={element.opacity ?? 1}
          min={0.1}
          max={1}
          step={0.05}
          onChange={(_, value) => onUpdateElement(element.id, { opacity: value })}
        />
      </Stack>
      <Stack spacing={1}>
        <Typography variant="caption">Brillo</Typography>
        <Slider
          value={filters.brightness}
          min={50}
          max={200}
          onChange={(_, value) => onUpdateElement(element.id, { filters: { ...filters, brightness: value } })}
        />
      </Stack>
      <Stack spacing={1}>
        <Typography variant="caption">Contraste</Typography>
        <Slider
          value={filters.contrast}
          min={50}
          max={200}
          onChange={(_, value) => onUpdateElement(element.id, { filters: { ...filters, contrast: value } })}
        />
      </Stack>
      <Stack spacing={1}>
        <Typography variant="caption">Saturación</Typography>
        <Slider
          value={filters.saturate}
          min={50}
          max={200}
          onChange={(_, value) => onUpdateElement(element.id, { filters: { ...filters, saturate: value } })}
        />
      </Stack>
    </Stack>
  );
}

function AlignmentControls({ onAlign, onDistribute }) {
  return (
    <Stack spacing={1}>
      <SectionTitle>Alineación y distribución</SectionTitle>
      <Stack direction="row" spacing={1}>
        <IconButton onClick={() => onAlign("left")}>
          <AlignHorizontalLeftIcon />
        </IconButton>
        <IconButton onClick={() => onAlign("centerX")}>
          <AlignHorizontalCenterIcon />
        </IconButton>
        <IconButton onClick={() => onAlign("right")}>
          <AlignHorizontalRightIcon />
        </IconButton>
        <IconButton onClick={() => onAlign("top")}>
          <AlignVerticalTopIcon />
        </IconButton>
        <IconButton onClick={() => onAlign("centerY")}>
          <AlignVerticalCenterIcon />
        </IconButton>
        <IconButton onClick={() => onAlign("bottom")}>
          <AlignVerticalBottomIcon />
        </IconButton>
      </Stack>
      <Stack direction="row" spacing={1}>
        <Button variant="outlined" size="small" onClick={() => onDistribute("horizontal")}>
          Distribuir H
        </Button>
        <Button variant="outlined" size="small" onClick={() => onDistribute("vertical")}>
          Distribuir V
        </Button>
      </Stack>
    </Stack>
  );
}

function BackgroundControls({ page, onBackgroundChange, onBackgroundImage }) {
  return (
    <Stack spacing={1}>
      <SectionTitle>Fondo de página</SectionTitle>
      <Stack direction="row" spacing={1} alignItems="center">
        <Box
          sx={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: page?.background?.color,
            border: "1px solid #d0d0d0",
          }}
        />
        <Button
          startIcon={<PaletteIcon />}
          variant="outlined"
          onClick={() => onBackgroundChange(page?.background?.color || "#fdf9ef")}
        >
          Aplicar color
        </Button>
        <IconButton color="primary" onClick={() => onBackgroundImage(page?.background?.url || "/hoja-izquierda.jpg")}>
          <FlipCameraAndroidIcon />
        </IconButton>
      </Stack>
    </Stack>
  );
}

function LayerList({
  layers,
  selectedId,
  onLayerSelect,
  onToggleVisibility,
  onToggleLock,
  onRenameLayer,
}) {
  return (
    <Stack spacing={1}>
      <SectionTitle>Capas actuales</SectionTitle>
      <Stack spacing={1} sx={{ maxHeight: 220, overflow: "auto" }}>
        {layers.map((el) => (
          <LayerItem key={el.id} active={selectedId === el.id} onClick={() => onLayerSelect(el.id)}>
            <Stack spacing={0.25} sx={{ flex: 1 }}>
              <TextField
                variant="standard"
                value={el.name || (el.type === "text" ? "Texto" : "Imagen")}
                onChange={(e) => onRenameLayer(el.id, e.target.value)}
                InputProps={{ disableUnderline: true, sx: { fontWeight: 700 } }}
              />
              <Typography variant="caption" color="text.secondary">
                x:{Math.round(el.x)} y:{Math.round(el.y)} • z:{el.zIndex || 1}
              </Typography>
            </Stack>
            <IconButton size="small" onClick={(e) => (e.stopPropagation(), onToggleVisibility(el.id))}>
              {el.visible === false ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </IconButton>
            <IconButton size="small" onClick={(e) => (e.stopPropagation(), onToggleLock(el.id))}>
              {el.locked ? <LockIcon /> : <LockOpenIcon />}
            </IconButton>
          </LayerItem>
        ))}
      </Stack>
    </Stack>
  );
}