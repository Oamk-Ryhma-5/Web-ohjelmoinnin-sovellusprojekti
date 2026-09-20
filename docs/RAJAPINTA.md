# Rajapinta

Frontend käyttää saman alkuperän `/api`-osoitteita Viten välityksen kautta.

## Elokuvat ja sarjat

| GET-osoite | Parametrit |
| --- | --- |
| `/api/movies/now-playing` | `page`, `language` |
| `/api/genres` | `type`, `language` |
| `/api/search` | `type`, `query`, `year`, `genre`, `page`, `language` |

`type` on `movie` (oletus) tai `tv`. `language` on `fi-FI` (oletus) tai `en-US`. Muita arvoja ei hyväksytä. Teatterilistauksen `region` on aina `FI`.

Haku tarvitsee vähintään yhden ehdoista `query`, `year` tai `genre`. Niitä voi yhdistää. Elokuvan vuosi tarkoittaa alkuperäistä julkaisuvuotta, sarjan vuosi ensimmäistä esitysvuotta. Genre tarkistetaan sisältötyypin listaa vasten.

Tuloksen kentät: `id`, `type`, `title`, `originalTitle`, `year`, `releaseDate`, `overview`, `posterUrl`, `backdropUrl`, `rating`, `genreIds`, `tmdbUrl`. Puuttuva kuva on `null`. Arvosana on `null`, jos äänestystietoja ei ole.

Vastaus sisältää `results`, `nextPage` ja `limitReached`. Seuraava pyyntö käyttää vastauksen `nextPage`-arvoa; `null` päättää sivutuksen.

TMDB:n nimihaku ei tue suoraa genrerajausta. Nimen ja genren yhdistelmässä palvelin suodattaa tulokset ja käy enintään viisi TMDB-sivua kerrallaan. Myös tyhjän erän jälkeen voi olla jatkosivu. Tulosten kokonaismäärää ei esitetä harhaanjohtavasti TMDB:n suodattamattomana kokonaislukuna.

## Käyttäjätilit

| Menetelmä ja osoite | Sisältö / vastaus |
| --- | --- |
| `POST /api/auth/register` | JSON: `username`, `email`, `password`. Palauttaa 201 ja käyttäjän; asettaa istuntoevästeen. |
| `POST /api/auth/login` | JSON: `email`, `password`. Palauttaa 200 ja käyttäjän; vaihtaa nykyisen istuntotunnuksen. |
| `GET /api/auth/me` | Palauttaa kirjautuneen käyttäjän tai 401. |
| `POST /api/auth/logout` | JSON: `{}`. Mitätöi nykyisen istunnon ja tyhjentää evästeen; 204. |
| `PATCH /api/auth/profile` | JSON: `username`. Muuttaa vain kirjautuneen käyttäjän nimeä. |
| `POST /api/auth/password` | JSON: `currentPassword`, `password`. Vaihtaa salasanan, mitätöi vanhat istunnot ja asettaa uuden evästeen. |

Käyttäjävastaus on `{ "user": { "id": 1, "username": "Esimerkki", "email": "example@example.com", "createdAt": "…" } }`. Salasana- tai istuntotiivisteitä ei palauteta.

Muuttavat pyynnöt käyttävät otsakkeita `Content-Type: application/json` ja `X-Leffahaku-Request: 1`. Selain lähettää evästeen (`credentials: 'include'`). Palvelin hyväksyy vain asetetut alkuperät, oletuksena paikallisen frontendin localhost- ja 127.0.0.1-osoitteet. Omissa osoitteissa käytetään `APP_ORIGIN`-asetusta.

Istuntotunnus on vain HttpOnly-evästeessä. Käyttäjärajapinnan vastauksissa on `Cache-Control: no-store`. Kirjautumisen, rekisteröinnin ja salasanan vaihdon yhteinen raja on 30 yritystä / 15 minuuttia palvelimen näkemää IP-osoitetta kohden. Rajoitettu vastaus sisältää `Retry-After`-otsakkeen.

## Virheet

Muoto on `{ "error": { "message": "…", "status": 400, "code": "INVALID_EMAIL" } }`. Käyttöliittymä kääntää `code`-arvon valitulle kielelle.

Tavallisia koodeja: `INVALID_CREDENTIALS` (401), `UNAUTHENTICATED` (401), `ACCOUNT_EXISTS` (409), `REQUEST_REJECTED` (403), `AUTH_RATE_LIMIT` (429), `INVALID_USERNAME`, `INVALID_EMAIL`, `INVALID_PASSWORD`, `WRONG_PASSWORD`, `EMPTY_SEARCH` ja `TMDB_UNAVAILABLE`. Sisäisiä virheitä ei palauteta käyttäjälle.

`GET /api/health` tarkistaa PostgreSQL-yhteyden ja palauttaa 200 tai 503. Pohjan alkuperäinen tietokantaesimerkki säilyy osoitteessa `/` backendin portissa.
