// Lectura y escritura segura de localStorage / sessionStorage: en modo privado
// o con el almacenamiento lleno, el navegador lanza errores en lugar de guardar.

const pick = (session) => (session ? sessionStorage : localStorage);

export function readJson(key, fallback, { session = false } = {}) {
  try {
    const raw = pick(session).getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/** Devuelve false si el navegador no permitió guardar. */
export function writeJson(key, value, { session = false } = {}) {
  try {
    pick(session).setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function writeText(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
