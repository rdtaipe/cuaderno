import React from "react";
import {
  AppBar,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
} from "@mui/material";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import GridOnIcon from "@mui/icons-material/GridOn";
import GridOffIcon from "@mui/icons-material/GridOff";
import RulerIcon from "@mui/icons-material/Straighten";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

const zoomOptions = [0.25, 0.5, 1, 2];

export default function TopBar({
  projectName,
  onProjectNameChange,
  onUndo,
  onRedo,
  zoom,
  onZoomChange,
  onFit,
  onCenter,
  showGrid,
  onToggleGrid,
  showRulers,
  onToggleRulers,
  onExport,
  mode,
  onModeChange,
}) {
  const [anchorEl, setAnchorEl] = React.useState(null);

  return (
    <AppBar position="static" elevation={0} color="default" sx={{ borderRadius: 2 }}>
      <Toolbar sx={{ gap: 2, minHeight: 72 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 220 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: "primary.main" }} />
          <TextField
            variant="standard"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            InputProps={{ disableUnderline: true, sx: { fontWeight: 700, fontSize: 18 } }}
            sx={{ minWidth: 180 }}
          />
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Deshacer (Ctrl/Cmd + Z)">
            <span>
              <IconButton onClick={onUndo}>
                <UndoIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Rehacer (Shift + Ctrl/Cmd + Z)">
            <span>
              <IconButton onClick={onRedo}>
                <RedoIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            select
            SelectProps={{ native: true }}
            size="small"
            value={zoom}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            label="Zoom"
            sx={{ width: 110 }}
          >
            {zoomOptions.map((option) => (
              <option key={option} value={option}>
                {Math.round(option * 100)}%
              </option>
            ))}
          </TextField>
          <Button variant="outlined" startIcon={<ZoomOutMapIcon />} onClick={onFit}>
            A la pantalla
          </Button>
          <Tooltip title="Centrar lienzo">
            <IconButton onClick={onCenter}>
              <CenterFocusStrongIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={showGrid ? "Ocultar rejilla" : "Mostrar rejilla"}>
            <IconButton color={showGrid ? "primary" : "default"} onClick={onToggleGrid}>
              {showGrid ? <GridOnIcon /> : <GridOffIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title={showRulers ? "Ocultar reglas" : "Mostrar reglas"}>
            <IconButton color={showRulers ? "primary" : "default"} onClick={onToggleRulers}>
              <RulerIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant={mode === "view" ? "contained" : "outlined"}
            startIcon={<VisibilityIcon />}
            onClick={() => onModeChange("view")}
          >
            Vista
          </Button>
          <Button
            variant={mode === "edit" ? "contained" : "outlined"}
            startIcon={<EditIcon />}
            onClick={() => onModeChange("edit")}
          >
            Edición
          </Button>
        </Stack>

        <Box sx={{ flexGrow: 1 }} />

        <Button
          variant="contained"
          endIcon={<ArrowDropDownIcon />}
          onClick={(e) => setAnchorEl(e.currentTarget)}
          startIcon={<DownloadIcon />}
        >
          Exportar
        </Button>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
          <MenuItem onClick={() => onExport("png")}>PNG</MenuItem>
          <MenuItem onClick={() => onExport("jpg")}>JPG</MenuItem>
          <MenuItem onClick={() => onExport("pdf")}>PDF</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
