import React from "react";
import {
  Box,
  Button,
  Divider,
  Stack,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import ImageIcon from "@mui/icons-material/Image";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import UploadIcon from "@mui/icons-material/UploadFile";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditNoteIcon from "@mui/icons-material/EditNote";

const ToolbarRoot = styled(Box)(({ theme }) => ({
  width: 200,
  background: "linear-gradient(180deg, #121820, #1a2330)",
  borderRadius: 14,
  padding: theme.spacing(2),
  boxShadow: "0 10px 28px rgba(0,0,0,0.4)",
  color: "#e5ecf8",
}));

const Thumb = styled(Box)(({ theme }) => ({
  width: "100%",
  aspectRatio: "4 / 3",
  borderRadius: 10,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

export default function NotebookToolbar({
  mode,
  onModeChange,
  onAddImage,
  uploadedImages,
  onUploadImage,
  onAddPresetText,
}) {
  const [tab, setTab] = React.useState(0);

  return (
    <ToolbarRoot>
      <Stack spacing={2}>
        <Typography variant="subtitle1" fontWeight={700} color="#f5f9ff">
          Biblioteca
        </Typography>

        <ToggleButtonGroup
          value={mode}
          exclusive
          size="small"
          onChange={(_, value) => value && onModeChange(value)}
          fullWidth
        >
          <ToggleButton value="view" sx={{ gap: 0.5 }}>
            <VisibilityIcon fontSize="small" /> Vista
          </ToggleButton>
          <ToggleButton value="edit" sx={{ gap: 0.5 }}>
            <EditNoteIcon fontSize="small" /> Editar
          </ToggleButton>
        </ToggleButtonGroup>

        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          variant="fullWidth"
          textColor="inherit"
          indicatorColor="secondary"
        >
          <Tab label="Imágenes" icon={<ImageIcon />} iconPosition="start" />
          <Tab label="Texto" icon={<TextFieldsIcon />} iconPosition="start" />
        </Tabs>

        {tab === 0 && (
          <Stack spacing={1.5}>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<UploadIcon />}
              component="label"
              sx={{ borderRadius: 10 }}
            >
              Subir imagen
              <input
                hidden
                accept="image/*"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => onUploadImage(reader.result);
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </Button>
            <Divider light sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
            <Stack spacing={1} sx={{ maxHeight: 360, overflow: "auto" }}>
              {uploadedImages.map((img) => (
                <Thumb key={img.id} onClick={() => onAddImage(img.url)}>
                  <Box
                    component="img"
                    src={img.url}
                    alt="asset"
                    sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </Thumb>
              ))}
              {uploadedImages.length === 0 && (
                <Typography variant="body2" color="rgba(255,255,255,0.7)">
                  No hay imágenes. Sube algunas para arrastrarlas al lienzo.
                </Typography>
              )}
            </Stack>
          </Stack>
        )}

        {tab === 1 && (
          <Stack spacing={1.5}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => onAddPresetText("title")}
              sx={{ borderRadius: 10 }}
            >
              Agregar título
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => onAddPresetText("subtitle")}
              sx={{ borderRadius: 10 }}
            >
              Agregar subtítulo
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => onAddPresetText("body")}
              sx={{ borderRadius: 10 }}
            >
              Texto pequeño
            </Button>
            <Divider light sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
            <Stack spacing={1}>
              {[
                { label: "Encabezado minimal", size: 42, weight: 700, color: "#1d1d1d" },
                { label: "Texto destacado", size: 26, weight: 600, color: "#2f4cb8" },
                { label: "Nota manuscrita", size: 28, weight: 500, color: "#4a362f" },
              ].map((preset) => (
                <Box
                  key={preset.label}
                  onClick={() =>
                    onAddPresetText("custom", {
                      fontSize: preset.size,
                      fontWeight: preset.weight,
                      color: preset.color,
                    })
                  }
                  sx={{
                    p: 1.5,
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    cursor: "pointer",
                  }}
                >
                  <Typography fontWeight={preset.weight} fontSize={preset.size} color={preset.color}>
                    {preset.label}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Stack>
        )}
      </Stack>
    </ToolbarRoot>
  );
}