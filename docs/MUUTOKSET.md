# Muutokset – käyttäjätilit, ulkoasu ja FI/EN

Päivitetty 18.9.2026. Käyttöönotto nykyiseen projektiin: [PAIVITYS.md](../PAIVITYS.md).

## Käyttöliittymä

- Uusi tumma ulkoasu, teatterisivun kuvitettu aloitusalue, pikahaku ja julistekortit.
- Erilliset sivut `/kirjaudu`, `/rekisteroidy` ja `/omat-tiedot`.
- Näkyvä käyttäjätunnus kirjautuneelle käyttäjälle; oma sivu vaatii kirjautumisen.
- Käyttäjänimen muokkaus, salasanan vaihto ja uloskirjautuminen.
- FI/EN-valinta ja kaikki käyttöliittymätekstit tiedostossa `src/i18n/messages.js`.
- Hakutulosten nimet, kuvaukset ja genret haetaan valitulla kielellä.
- Teatterilistauksen ylimääräinen lähdeseliteteksti poistettu. TMDB-maininta on Tietoa palvelusta -sivulla.
- Oikeat sivuosoitteet, selaimen takaisin/eteen-navigointi ja suorat sivulataukset Viten kautta.

## Palvelin ja tietokanta

- Uudet moduulit: `api/routes/authRouter.js`, `api/models/authRepository.js`, `api/models/migrate.js`, `api/services/passwords.js`, `api/middleware/authLimits.js`.
- Automaattinen, transaktiollinen tietokantapäivitys `api/migrations/001_accounts.sql`.
- PostgreSQL: käyttäjät ja peruttavat istunnot; scrypt-salasanatiivisteet ja satunnaiset istuntotunnukset.
- Omat tiedot palautetaan vain istunnon käyttäjälle. Salasanan vaihto mitätöi aikaisemmat istunnot.
- Rajatut alkuperät, HttpOnly-evästeet, pyyntöjen tarkistukset ja yritysrajoitus.
- TMDB-kieliparametri ja genrevälimuisti kielen sekä sisältötyypin mukaan. Suomen teatterialue säilyy.
- Hakutuloksiin lisätty taustakuva ja TMDB-arvosana.

## Riippuvuudet ja nykyiset asetukset

Frontendin ja backendin ajonaikaisia npm-riippuvuuksia ei lisätty. Backendin testejä varten lisättiin `@electric-sql/pglite` versiona 0.5.8 sekä päivitettiin sen lukitustiedosto. Frontendin käännöstesti toimii erikseen `npm run test:ui` -komennolla.

Nykyinen toimiva `.env` käy edelleen localhost-osoitteessa. TMDB-tunnusta ei tarvitse vaihtaa päivityksen vuoksi. Päivityspaketti ei sisällä varsinaista `.env`-tiedostoa.

Dockerin nimetty PostgreSQL-volyymi ja aiemmat taulut säilyvät, kun päivitys tehdään samaan nykyiseen projektikansioon. Vanhaa init.sql-tiedostoa ei käytetä käyttäjätaulujen lisäämiseen; backend suorittaa migraation myös jo olemassa olevaan tietokantaan.

Tämä versio sisältää vain tässä pyydetyt käyttäjätilit ja hakutoiminnot. Suosikit, ryhmät ja arvostelut voidaan liittää myöhemmin käyttäjän tunnisteeseen sekä TMDB:n `id`- ja `type`-arvoihin.
