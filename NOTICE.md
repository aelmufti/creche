# Licences — ce qui est couvert, et par quoi

Ce dépôt réunit plusieurs types de contenus, sous des licences différentes.

| Contenu | Licence |
|---|---|
| **Code source** : moteur de calcul (`src/engine/`), composants, gabarits, scripts, configuration | [MIT](LICENSE) — réutilisation libre, y compris commerciale, en conservant la mention de copyright |
| **Données Urssaf dérivées** : `src/data/tarifs-departements.json`, fichier CSV de l'Observatoire | [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/) — base dérivée de « Salariés des particuliers employeurs en 2024 » (Urssaf Caisse nationale, open.urssaf.fr) ; mention de la source et partage à l'identique obligatoires |
| **Données géographiques** : `src/data/departements.json`, `src/data/codes-postaux.json` | [Licence Ouverte 2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/) — Insee (COG) et La Poste (Base officielle des codes postaux), via geo.api.gouv.fr |
| **Police** : `public/fonts/` (JetBrains Mono) | [SIL Open Font License 1.1](public/fonts/OFL.txt) |
| **Contenu éditorial** : textes rédactionnels des guides et des pages, nom « Crèche ou nounou ? », logo, images Open Graph | © Ali El Mufti, tous droits réservés — **non couverts par la licence MIT**. Les courtes citations avec lien vers la source sont bienvenues. |

Les barèmes officiels reproduits dans `bareme-2026.json` (CNAF, Urssaf, administration fiscale) sont
des informations publiques ; leurs sources sont listées dans le fichier (`_sources`).
