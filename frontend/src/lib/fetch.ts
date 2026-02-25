const apiUrlRaw = process.env.NEXT_PUBLIC_API_URL;

if (!apiUrlRaw) {
  throw new Error("Missing NEXT_PUBLIC_API_URL environment variable");
}

// ensure trailing slash
const apiUrl = apiUrlRaw.endsWith("/") ? apiUrlRaw : `${apiUrlRaw}/`;

type ApiResponse = Promise<Response>;

export const getSongsByQuery = async (query: string): ApiResponse => {
  return fetch(`${apiUrl}search/songs?query=${encodeURIComponent(query)}`);
};

export const getSongsById = async (id: string): ApiResponse => {
  return fetch(`${apiUrl}songs/${encodeURIComponent(id)}`);
};

export const getSongsSuggestions = async (id: string): ApiResponse => {
  return fetch(`${apiUrl}songs/${encodeURIComponent(id)}/suggestions`);
};

export const searchAlbumByQuery = async (query: string): ApiResponse => {
  return fetch(`${apiUrl}search/albums?query=${encodeURIComponent(query)}`);
};

export const getAlbumById = async (id: string): ApiResponse => {
  return fetch(`${apiUrl}albums?id=${encodeURIComponent(id)}`);
};