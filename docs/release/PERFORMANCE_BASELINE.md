# Performance baseline

- Production web output: 5,879,029 bytes.
- Largest asset: PDF.js worker, 1,375,838 bytes.
- Firebase chunk: 519,623 bytes.
- Secondary PDF worker: 364,111 bytes.
- Chat markdown chunk: 299,192 bytes.
- Main CSS: 201,521 bytes.
- iOS simulator `.app`: 27,734,639 bytes.
- macOS arm64 unpacked `.app`: approximately 253 MB.

Vite warns about the >500 kB PDF worker. Future safe work: load PDF/markdown only on relevant screens, remove duplicate worker formats if supported, self-host/subset fonts, and measure cold start/LCP/interaction on real devices. No feature was removed merely to reduce size.
