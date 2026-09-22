# sdk/src/resources/firearms

The `/v1/firearms` surface, split by shape so `firearms.ts` stays a table of contents. Each module is free functions taking the `HttpClient` first; the class delegates one line per method.

Governed by: [`../README.md`](../README.md).

| File | Covers |
|---|---|
| `collection.ts` | Lists, search, compare, discovery (`by-*`, `top`, `timeline`, `random`) |
| `single.ts` | One record and its sub-resources: variants, images, game stats, dimensions, users, family tree, similar, silhouette, calculate, load |
| `extras.ts` | Name resolution (`resolve`, `resolveMany`), media catalog and assets, 3D model, image data URIs, seller offers, mount interfaces, attachment fits |
| `types.ts` | Shared type re-exports for the modules above |
