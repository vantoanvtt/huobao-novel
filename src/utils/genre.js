export const GENRE_LABEL_MAP = {
  '玄幻': 'Fantasy',
  '仙侠': 'Xianxia',
  '都市': 'Urban',
  '历史': 'Historical',
  '科幻': 'Sci-Fi',
  '游戏': 'Game',
  '悬疑': 'Mystery',
  '奇幻': 'Supernatural',
  '武侠': 'Martial Arts',
  '言情': 'Romance',
  '军事': 'Military',
  '体育': 'Sports',
  '灵异': 'Horror',
  '二次元': 'Anime',
  '其他': 'Other'
}

export function normalizeGenreValue(value) {
  return GENRE_LABEL_MAP[value] || value
}

export function normalizeGenreList(genre) {
  if (Array.isArray(genre)) return genre.map(normalizeGenreValue)
  if (typeof genre === 'string') return normalizeGenreValue(genre)
  return genre
}
