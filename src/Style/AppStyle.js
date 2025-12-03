// AppStyles.js
import { styled } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import App from '../App/App';

// Crear tema personalizado
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff4081',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 14,
    button: {
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
    '0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)',
    // ... más sombras si las necesitas
  ],
});

// Estilos usando styled components
const AppContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  width: '100vw',
  overflow: 'hidden',
  backgroundColor: theme.palette.background.default,
  fontFamily: theme.typography.fontFamily,
});

const StyledToolbar = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.primary.dark,
  color: '#ffffff',
  boxShadow: theme.shadows[2],
  zIndex: theme.zIndex.appBar,
  flexWrap: 'wrap',
  minHeight: '72px',
}));

const ToolbarButton = styled('button')(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: '#ffffff',
  border: 'none',
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(0.75, 1.5),
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.primary.light,
  },
  '&:disabled': {
    backgroundColor: theme.palette.action.disabledBackground,
    color: theme.palette.action.disabled,
    cursor: 'not-allowed',
  },
}));

const ToolbarInput = styled('input')(({ theme }) => ({
  backgroundColor: '#ffffff',
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(0.75, 1.5),
  minWidth: '80px',
  '&:focus': {
    outline: 'none',
    borderColor: theme.palette.primary.main,
  },
}));

const ToolbarSelect = styled('select')(({ theme }) => ({
  backgroundColor: '#ffffff',
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(0.75, 3, 0.75, 1.5),
  cursor: 'pointer',
  '&:focus': {
    outline: 'none',
    borderColor: theme.palette.primary.main,
  },
}));

const ColorPickerContainer = styled('div')({
  position: 'relative',
  display: 'inline-block',
});

const ColorButton = styled('button')(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: '#ffffff',
  border: 'none',
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(0.75, 1.5),
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.primary.light,
  },
}));

const ColorPickerPopup = styled('div')(({ theme }) => ({
  position: 'absolute',
  top: '100%',
  left: 0,
  zIndex: theme.zIndex.modal,
  marginTop: theme.spacing(1),
  backgroundColor: '#ffffff',
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[4],
  border: `1px solid ${theme.palette.divider}`,
}));

const NotebookGrid = styled('div')(({ theme }) => ({
  flex: 1,
  position: 'relative',
  backgroundColor: '#f9f9f9',
  overflow: 'auto',
  cursor: 'crosshair',
  backgroundSize: '20px 20px',
  backgroundImage: `
    linear-gradient(to right, ${theme.palette.divider} 1px, transparent 1px),
    linear-gradient(to bottom, ${theme.palette.divider} 1px, transparent 1px)
  `,
}));

const TextElement = styled('div')(({ theme, selected }) => ({
  position: 'absolute',
  cursor: 'move',
  overflow: 'hidden',
  backgroundColor: '#ffffff',
  padding: theme.spacing(1),
  boxShadow: theme.shadows[1],
  transition: 'box-shadow 0.2s ease',
  border: selected ? `2px dashed ${theme.palette.primary.main}` : '1px solid #999',
  '&:hover': {
    boxShadow: theme.shadows[3],
  },
}));

const TextElementContent = styled('div')({
  wordWrap: 'break-word',
  whiteSpace: 'pre-wrap',
  width: '100%',
  height: '100%',
  outline: 'none',
  border: 'none',
  resize: 'none',
  backgroundColor: 'transparent',
  fontFamily: 'inherit',
  fontSize: 'inherit',
  color: 'inherit',
});

const LayersSidebar = styled('div')(({ theme }) => ({
  width: '300px',
  backgroundColor: theme.palette.background.paper,
  borderLeft: `1px solid ${theme.palette.divider}`,
  overflowY: 'auto',
  padding: theme.spacing(2),
  boxShadow: theme.shadows[1],
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

const LayersTitle = styled('h3')(({ theme }) => ({
  marginBottom: theme.spacing(2),
  color: theme.palette.text.primary,
  fontWeight: 600,
  fontSize: '1.1rem',
  paddingBottom: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const LayerItem = styled('div')(({ theme, selected }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(1.5),
  backgroundColor: selected ? theme.palette.primary.light + '20' : theme.palette.background.paper,
  border: `1px solid ${selected ? theme.palette.primary.main : theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  color: selected ? theme.palette.primary.dark : 'inherit',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    transform: 'translateY(-1px)',
  },
}));

const LayerContent = styled('div')({
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  marginRight: theme.spacing(1),
});

const LayerControls = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(0.5),
}));

const LayerButton = styled('button')(({ theme }) => ({
  minWidth: '32px',
  padding: theme.spacing(0.5),
  backgroundColor: theme.palette.grey[200],
  border: 'none',
  borderRadius: theme.shape.borderRadius,
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.grey[300],
  },
}));

const StatusBar = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`,
  fontSize: '0.875rem',
  color: theme.palette.text.secondary,
}));

// Media queries
export const mediaQueries = {
  '@media (max-width: 768px)': {
    StyledToolbar: {
      padding: theme.spacing(1),
      gap: theme.spacing(1),
    },
    LayersSidebar: {
      width: '250px',
    },
    NotebookGrid: {
      backgroundSize: '15px 15px',
    },
  },
  '@media (max-width: 480px)': {
    StyledToolbar: {
      minHeight: 'auto',
      padding: theme.spacing(0.75),
    },
    LayersSidebar: {
      width: '200px',
      padding: theme.spacing(1),
    },
    LayerItem: {
      padding: theme.spacing(1),
    },
  },
};

export default {
    AppContainer,
    StyledToolbar,
    NotebookGrid,
    TextElement,
    TextElementContent,
    LayersSidebar,
    LayersTitle,
    LayerItem,
    LayerContent,
    LayerControls,
    LayerButton,
    StatusBar,
    mediaQueries,
    ToolbarButton,
    ToolbarInput,
    ToolbarSelect,
    ColorPickerContainer,
    ColorButton,
    ColorPickerPopup,
  };


