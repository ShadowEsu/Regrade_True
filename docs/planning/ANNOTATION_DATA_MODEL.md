# Annotation Data Model

Each annotation contains: ID, case/owner, zero-based page, kind (`highlight`, `draw`, `text`), semantic color, normalized x/y/width/height, flattened normalized draw path, bounded text, rotation (0/90/180/270), and timestamps. Paths are capped at 400 numbers and text at 500 characters. Undo deletes the latest saved item; redo restores the same ID. Deleting a case recursively removes annotations.
