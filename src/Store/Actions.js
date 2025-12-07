import { v4 as uuid } from "uuid";

const snapshot = (value) => JSON.parse(JSON.stringify(value ?? null));
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const updateBooks = (State, updater, options = {}) => {
  const currentBooks = State.get("canvas.data.books") || [];
  const nextBooks =
    typeof updater === "function" ? updater(snapshot(currentBooks)) : updater;

  if (!Array.isArray(nextBooks)) return currentBooks;

  if (!options.skipHistory) {
    const past = State.get("canvas.history.past") || [];
    State.set("canvas.history.past", [...past.slice(-19), snapshot(currentBooks)]);
    State.set("canvas.history.future", []);
  }

  State.set("canvas.data.books", nextBooks, { noMerge: true });

  const activeBookId = State.get("canvas.data.activeBookId");
  const activePageId = State.get("canvas.data.activePageId");
  const nextActiveBook =
    nextBooks.find((book) => book.id === activeBookId) || nextBooks[0];

  if (!nextActiveBook) {
    State.set("canvas.data.activeBookId", null);
    State.set("canvas.data.activePageId", null);
    State.set("canvas.interaction.selection", null);
    return nextBooks;
  }

  if (nextActiveBook.id !== activeBookId) {
    State.set("canvas.data.activeBookId", nextActiveBook.id);
  }

  const pageExists =
    nextActiveBook.pages?.some((page) => page.id === activePageId) || false;

  if (!pageExists) {
    State.set(
      "canvas.data.activePageId",
      nextActiveBook.pages?.[0]?.id || null,
    );
    State.set("canvas.interaction.selection", null);
  }

  return nextBooks;
};

const updateBookPages = (State, bookId, updater) => {
  const books = State.get("canvas.data.books", []);
  if (!books.some((book) => book.id === bookId)) return books;

  return updateBooks(State, (booksDraft) =>
    booksDraft.map((book) => {
      if (book.id !== bookId) return book;
      const currentPages = snapshot(book.pages || []);
      const nextPages =
        typeof updater === "function" ? updater(currentPages) : updater;
      if (!Array.isArray(nextPages)) return book;
      return { ...book, pages: nextPages };
    }),
  );
};

const updateElementsInPage = (State, bookId, pageId, updater) => {
  const books = State.get("canvas.data.books", []);
  const targetBook =
    books.find((book) => book.id === bookId) ||
    books.find((book) => book.id === State.get("canvas.data.activeBookId"));
  if (!targetBook) return books;
  if (!targetBook.pages?.some((page) => page.id === pageId)) return books;

  return updateBookPages(State, bookId, (pages) =>
    pages.map((page) => {
      if (page.id !== pageId) return page;
      const currentElements = snapshot(page.elements || []);
      const nextElements =
        typeof updater === "function" ? updater(currentElements) : updater;
      if (!Array.isArray(nextElements)) return page;
      return { ...page, elements: nextElements };
    }),
  );
};

export default function initialActions({ State }) {
  return {
    canvas: {
      get: () => State.get("canvas"),

      // UI / meta
      setProjectName: (name) => State.set("canvas.data.projectName", name || ""),
      setMode: (mode) => {
        const allowed = ["view", "edit", "library"];
        State.set(
          "canvas.ui.mode",
          allowed.includes(mode) ? mode : "edit",
        );
      },
      setActiveBook: (bookId) => {
        const books = State.get("canvas.data.books", []);
        const target =
          books.find((book) => book.id === bookId) || books[0] || null;
        State.set("canvas.data.activeBookId", target?.id || null);
        State.set(
          "canvas.data.activePageId",
          target?.pages?.[0]?.id || null,
        );
        State.set("canvas.interaction.selection", null);
      },
      setActivePage: (bookId, pageId) => {
        const books = State.get("canvas.data.books", []);
        const targetBook =
          books.find((book) => book.id === bookId) ||
          books.find((book) => book.id === State.get("canvas.data.activeBookId")) ||
          books[0];
        if (!targetBook) return null;
        const targetPage =
          targetBook.pages?.find((page) => page.id === pageId) ||
          targetBook.pages?.[0];
        State.set("canvas.data.activeBookId", targetBook.id);
        State.set("canvas.data.activePageId", targetPage?.id || null);
        State.set("canvas.interaction.selection", null);
        return targetPage;
      },
      setSelection: (selection) =>
        State.set("canvas.interaction.selection", selection || null, {
          noMerge: true,
        }),
      clearSelection: () => State.set("canvas.interaction.selection", null),
      setZoom: (value) => State.set("canvas.ui.zoom", clamp(value, 0.25, 3)),
      setOffset: (offset) =>
        State.set(
          "canvas.ui.offset",
          { x: offset?.x || 0, y: offset?.y || 0 },
          { noMerge: true },
        ),
      toggleGrid: () =>
        State.set("canvas.ui.showGrid", !State.get("canvas.ui.showGrid", true)),
      toggleRulers: () =>
        State.set(
          "canvas.ui.showRulers",
          !State.get("canvas.ui.showRulers", false),
        ),
      setPanning: (isPanning, panStart) => {
        State.set("canvas.interaction.isPanning", !!isPanning);
        State.set("canvas.interaction.panStart", panStart || null, {
          noMerge: true,
        });
      },
      setSpacePressed: (flag) =>
        State.set("canvas.interaction.spacePressed", !!flag),

      // Assets
      addUploadedImage: (url) => {
        if (!url) return null;
        const asset = { id: uuid(), url };
        State.push("canvas.data.uploadedImages[]", asset);
        return asset;
      },
      removeUploadedImage: (id) => {
        if (!id) return null;
        const current = State.get("canvas.data.uploadedImages", []);
        const filtered = current.filter((item) => item.id !== id);
        State.set("canvas.data.uploadedImages", filtered, { noMerge: true });
        return filtered;
      },

      // Books
      addBook: (book) => {
        const newBook =
          book && book.id
            ? book
            : { ...(book || {}), id: uuid(), pages: book?.pages || [] };
        const nextBooks = updateBooks(State, (booksDraft) => [
          ...booksDraft,
          newBook,
        ]);
        if (!State.get("canvas.data.activeBookId")) {
          State.set("canvas.data.activeBookId", newBook.id);
          State.set(
            "canvas.data.activePageId",
            newBook.pages?.[0]?.id || null,
          );
        }
        return nextBooks;
      },
      updateBook: (bookId, updates) =>
        updateBooks(State, (booksDraft) =>
          booksDraft.map((book) =>
            book.id === bookId ? { ...book, ...updates } : book,
          ),
        ),
      removeBook: (bookId) =>
        updateBooks(State, (booksDraft) =>
          booksDraft.filter((book) => book.id !== bookId),
        ),

      // Pages
      addPage: (bookId, page) => {
        const newPage =
          page && page.id ? page : { ...(page || {}), id: uuid() };
        const nextPages = updateBookPages(State, bookId, (pages) => [
          ...pages,
          newPage,
        ]);
        const activeBookId = State.get("canvas.data.activeBookId");
        if (!State.get("canvas.data.activePageId") && bookId === activeBookId) {
          State.set("canvas.data.activePageId", newPage.id);
        }
        return nextPages;
      },
      updatePage: (bookId, pageId, updates) =>
        updateBookPages(State, bookId, (pages) =>
          pages.map((page) =>
            page.id === pageId ? { ...page, ...updates } : page,
          ),
        ),
      removePage: (bookId, pageId) =>
        updateBookPages(State, bookId, (pages) =>
          pages.filter((page) => page.id !== pageId),
        ),

      // Elements
      addElement: (bookId, pageId, element) => {
        const newElement =
          element && element.id
            ? element
            : { ...(element || {}), id: uuid() };
        return updateElementsInPage(State, bookId, pageId, (elements) => [
          ...elements,
          newElement,
        ]);
      },
      updateElement: (bookId, pageId, elementId, updates) =>
        updateElementsInPage(State, bookId, pageId, (elements) =>
          elements.map((el) => {
            if (el.id !== elementId) return el;
            const nextUpdates =
              typeof updates === "function" ? updates(el) : updates;
            return { ...el, ...nextUpdates };
          }),
        ),
      removeElement: (bookId, pageId, elementId) =>
        updateElementsInPage(State, bookId, pageId, (elements) =>
          elements.filter((el) => el.id !== elementId),
        ),
      duplicateElement: (bookId, pageId, elementId, offset = { x: 24, y: 24 }) =>
        updateElementsInPage(State, bookId, pageId, (elements) => {
          const source = elements.find((el) => el.id === elementId);
          if (!source) return elements;
          const clone = {
            ...source,
            id: uuid(),
            x: (source.x || 0) + (offset.x || 0),
            y: (source.y || 0) + (offset.y || 0),
          };
          return [...elements, clone];
        }),
      toggleElementVisibility: (bookId, pageId, elementId) =>
        updateElementsInPage(State, bookId, pageId, (elements) =>
          elements.map((el) =>
            el.id === elementId
              ? { ...el, visible: el.visible === false ? true : false }
              : el,
          ),
        ),
      toggleElementLock: (bookId, pageId, elementId) =>
        updateElementsInPage(State, bookId, pageId, (elements) =>
          elements.map((el) =>
            el.id === elementId ? { ...el, locked: !el.locked } : el,
          ),
        ),
      renameElement: (bookId, pageId, elementId, name) =>
        updateElementsInPage(State, bookId, pageId, (elements) =>
          elements.map((el) =>
            el.id === elementId ? { ...el, name } : el,
          ),
        ),
      setBackgroundColor: (bookId, pageId, color) =>
        updateBookPages(State, bookId, (pages) =>
          pages.map((page) =>
            page.id === pageId
              ? { ...page, background: { ...(page.background || {}), color } }
              : page,
          ),
        ),
      setBackgroundImage: (bookId, pageId, url) =>
        updateBookPages(State, bookId, (pages) =>
          pages.map((page) =>
            page.id === pageId
              ? { ...page, background: { ...(page.background || {}), url } }
              : page,
          ),
        ),

      // History
      undo: () => {
        const past = State.get("canvas.history.past", []);
        if (!past.length) return false;

        const books = State.get("canvas.data.books", []);
        const previous = past[past.length - 1];

        State.set("canvas.history.past", past.slice(0, -1), { noMerge: true });

        const future = State.get("canvas.history.future", []);
        State.set(
          "canvas.history.future",
          [snapshot(books), ...future].slice(0, 20),
          { noMerge: true },
        );

        State.set("canvas.data.books", previous, { noMerge: true });
        State.set("canvas.interaction.selection", null);

        const activeBookId = State.get("canvas.data.activeBookId");
        const activePageId = State.get("canvas.data.activePageId");
        const bookMatch =
          previous.find((book) => book.id === activeBookId) || previous[0];
        if (!bookMatch) {
          State.set("canvas.data.activeBookId", null);
          State.set("canvas.data.activePageId", null);
        } else {
          State.set("canvas.data.activeBookId", bookMatch.id);
          const pageMatch =
            bookMatch.pages?.find((p) => p.id === activePageId) ||
            bookMatch.pages?.[0] ||
            null;
          State.set("canvas.data.activePageId", pageMatch?.id || null);
        }

        return true;
      },
      redo: () => {
        const future = State.get("canvas.history.future", []);
        if (!future.length) return false;

        const books = State.get("canvas.data.books", []);
        const next = future[0];

        State.set("canvas.history.future", future.slice(1), { noMerge: true });

        const past = State.get("canvas.history.past", []);
        State.set("canvas.history.past", [...past, snapshot(books)].slice(-20), {
          noMerge: true,
        });

        State.set("canvas.data.books", next, { noMerge: true });
        State.set("canvas.interaction.selection", null);

        const activeBookId = State.get("canvas.data.activeBookId");
        const activePageId = State.get("canvas.data.activePageId");
        const bookMatch =
          next.find((book) => book.id === activeBookId) || next[0];
        if (!bookMatch) {
          State.set("canvas.data.activeBookId", null);
          State.set("canvas.data.activePageId", null);
        } else {
          State.set("canvas.data.activeBookId", bookMatch.id);
          const pageMatch =
            bookMatch.pages?.find((p) => p.id === activePageId) ||
            bookMatch.pages?.[0] ||
            null;
          State.set("canvas.data.activePageId", pageMatch?.id || null);
        }

        return true;
      },
    },
  };
}
