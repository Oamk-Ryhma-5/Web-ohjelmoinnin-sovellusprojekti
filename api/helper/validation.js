import { ApiError } from './ApiError.js'

export function readUsername(value) {
  if (typeof value !== 'string' || !/^[\p{L}\p{N}_.-]{3,30}$/u.test(value.trim())) {
    throw new ApiError('Tarkista käyttäjänimi.', 400, 'INVALID_USERNAME')
  }
  return value.trim()
}

export function readEmail(value) {
  if (
    typeof value !== 'string' ||
    value.trim().length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  ) {
    throw new ApiError('Tarkista sähköpostiosoite.', 400, 'INVALID_EMAIL')
  }
  return value.trim().toLowerCase()
}

export function readPassword(value, isNew = false) {
  if (typeof value !== 'string' || value.length < 1 || value.length > 128) {
    throw new ApiError('Tarkista salasana.', 400, 'INVALID_PASSWORD')
  }
  // Työohje: vähintään 8 merkkiä, yksi iso kirjain ja yksi numero.
  // Vanhoilla tunnuksilla saa kirjautua myös ennen tätä sääntöä luodulla salasanalla.
  if (isNew && (value.length < 8 || !/\p{Lu}/u.test(value) || !/[0-9]/.test(value))) {
    throw new ApiError(
      'Salasanassa pitää olla 8 merkkiä, iso kirjain ja numero.',
      400,
      'INVALID_PASSWORD',
    )
  }
  return value
}
