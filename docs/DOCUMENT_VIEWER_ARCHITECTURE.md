# Document Viewer Architecture

PDFs are text-extracted and rendered to bounded page images client-side. Real page images upload to owner-scoped Storage; preview pages remain local. `PaperView` reopens pages and `DocumentAnnotator` places an SVG/HTML annotation layer in the same transformed stage as the image. Zoom changes the stage width; rotation transforms image and overlay together; normalized geometry remains stable. Mr Whale receives the current analysis/question context, not raw unrelated account data.
