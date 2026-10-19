# ALABQRI image localization report

## Static repository image audit

- 18 recovery images from the earlier migration remain stored under `assets/images/`.
- The CSS hero background was localized to `/assets/images/external-ff892fcea76f1c00.jpg` in `assets/css/alabqri.css`.
- Both remaining homepage image-proxy references were downloaded, validated, and replaced with local `/assets/images/` paths in `index.html`.
- The preview workflow reported 2 proxy URLs localized, 1 source file rewritten, and 0 download/validation failures.
- The static image references inspected in this pass no longer depend on the two external image-proxy URLs.

## Scope note

This audit covers image references in tracked static source files. Image URLs stored dynamically in D1 article records or entered by administrators are outside this static scan and require a separate data-level audit before claiming every dynamically supplied image is local.
