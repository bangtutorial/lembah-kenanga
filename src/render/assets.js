// Loads assets/manifest.json and every image it references.
export const assets = { manifest: null, images: new Map() };

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`gagal memuat ${src}`));
    img.src = src;
  });
}

export async function loadAssets(base = 'assets/', onProgress = () => {}) {
  const res = await fetch(base + 'manifest.json');
  assets.manifest = await res.json();
  const entries = Object.entries(assets.manifest.sprites);
  let done = 0;
  await Promise.all(entries.map(async ([name, def]) => {
    assets.images.set(name, await loadImage(base + def.file));
    onProgress(++done / entries.length);
  }));
  return assets;
}

export function sprite(name) {
  const def = assets.manifest.sprites[name];
  const img = assets.images.get(name);
  if (!def || !img) throw new Error(`sprite tidak ada: ${name}`);
  return { def, img };
}
