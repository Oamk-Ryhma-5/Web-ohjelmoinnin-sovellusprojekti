# Toteutuksen tarkistus

Päiväys: 18.9.2026. Versio: käyttäjätilit, uusi ulkoasu ja FI/EN.

## Automaattiset tarkistukset

- `npm test`: **54 testiä läpi** (53 backend-testiä ja yksi käyttöliittymän käännöskattavuuden testi).
- `npm run lint`: läpi.
- `npm run build`: läpi, 45 moduulia. JavaScript noin 227 kB ja CSS noin 23 kB ennen gzip-pakkausta.

Käyttäjätesteissä suoritettiin varsinaiset migraatiot ja parametrisoidut SQL-kyselyt PostgreSQL:n WASM-versiossa PGliten avulla. Käyttöliittymätestin rekisteröinti ja kirjautuminen kulkivat Viten, Expressin ja testitietokannan läpi; niitä ei korvattu selaimen onnistumisvastauksilla.

Tarkistetut käyttäjätoiminnot: rekisteröinti, yksilölliset tunnukset, palvelimen validointi, salasanatiiviste, istunnon evästeasetukset, kirjautuminen, uloskirjautumisen mitätöinti, vanhentunut tai väärennetty istunto, istunnon säilyminen palvelinsovelluksen uudelleenkäynnistyksessä, vain oman profiilin muokkaus, salasanan vaihto, vanhojen istuntojen mitätöinti, alkuperän tarkistus, yritysraja ja parametrisoidut SQL-syötteet. Migraation toistaminen säilytti vanhan testitaulun ja käyttäjän.

TMDB-testeissä tarkistettiin Suomen alue, nimihaku, vuosi, genre, yhdistelmät, elokuvien ja sarjojen erilliset vuosiparametrit, sivutus, virhetilanteet ja FI/EN-kieli. Genrevälimuisti erottaa sekä kielet että sisältötyypit.

## Selaintarkistus

Chromium 153.0.8010.0, leveydet 1440, 768, 390 ja 320 pikseliä.

- Rekisteröinti omalta sivulta avautuvan kirjautumisohjauksen kautta.
- Salasanojen vahvistuksen virheilmoitus, rekisteröinnin automaattinen sisäänkirjautuminen ja käyttäjän tallentuminen tietokantaan.
- Kirjautumisen säilyminen sivun päivityksessä. Istuntoeväste ei ollut luettavissa `document.cookie`-arvosta.
- Käyttäjänimen muutos, salasanan vaihto, uloskirjautuminen, vanhan salasanan hylkäys ja uuden hyväksyminen.
- FI/EN-valinta, valinnan säilyminen päivityksessä sekä hakutulosten kuvausten vaihtuminen englanniksi ja takaisin.
- Suomen teatterialue myös englanniksi, nimihaku, vuosi ja genre yhdistettynä, sarjat, hakuehtojen tyhjennys ja lisätulokset.
- Tyhjät tulokset, virheestä palautuminen ja vanhan hitaamman hakupyynnön ohittaminen.
- Puhelin- ja tablettiasettelu ilman vaakasuuntaista ylivuotoa. Oma sivu tarkistettiin myös 320 pikselin leveydellä.
- Ei JavaScriptin ajonaikaisia sivuvirheitä. TMDB-maininta ja logo löytyvät Tietoa palvelusta -sivulta.

Etusivun, kirjautumisen ja oman sivun kuvakaappaukset tarkistettiin visuaalisesti. Selaintesti käytti simuloitua elokuvalistausta ja testikuvia; se ei esitä tämän päivän oikeaa teatteriohjelmistoa.

## Rajaukset

Dockeria ei ole tässä tarkistusympäristössä, joten varsinaisia Docker-kontteja ei käynnistetty. SQL- ja istuntotoiminta tarkistettiin edellä kuvatulla PostgreSQL-pohjaisella testitietokannalla ja selaimella. Käyttäjän TMDB-tunnusta ei käytetty, eikä käyttäjän omalla koneella olevia tiedostoja muutettu.

Kokeile päivityksen jälkeen oman Docker-asennuksen rekisteröinti ja kirjautuminen [PAIVITYS.md](../PAIVITYS.md)-ohjeen mukaan.
