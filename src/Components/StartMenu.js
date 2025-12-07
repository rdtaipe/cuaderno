import React from "react";
import { Box, Button, Card, CardActions, CardContent, Stack, Typography } from "@mui/material";
import BookIcon from "@mui/icons-material/MenuBook";
import AddIcon from "@mui/icons-material/Add";

export default function StartMenu({ books = [], onOpenBook, onCreateBook }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: 2,
      }}
    >
      {books.map((book) => (
        <Card key={book.id} variant="outlined" sx={{ borderRadius: 2, boxShadow: "0 8px 20px rgba(0,0,0,0.08)" }}>
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <BookIcon color="primary" />
              <Typography variant="h6" noWrap title={book.value}>
                {book.value}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Autor: {book.attributes?.author || "Desconocido"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Páginas: {book.pages?.length || 0}
            </Typography>
          </CardContent>
          <CardActions>
            <Button
              fullWidth
              variant="contained"
              onClick={() => onOpenBook && onOpenBook(book.id)}
              disabled={!onOpenBook}
            >
              Abrir
            </Button>
          </CardActions>
        </Card>
      ))}

      <Card
        variant="outlined"
        sx={{
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 180,
          borderStyle: "dashed",
        }}
      >
        <Button
          startIcon={<AddIcon />}
          variant="outlined"
          onClick={() => onCreateBook && onCreateBook()}
          disabled={!onCreateBook}
        >
          Nuevo cuaderno
        </Button>
      </Card>
    </Box>
  );
}
