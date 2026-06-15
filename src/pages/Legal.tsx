export function MentionsLegales() {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-4">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Mentions légales</h1>
      <section className="card-brutal p-4 text-sm leading-relaxed">
        <h2 className="font-extrabold uppercase tracking-brutal">Éditeur</h2>
        <p className="mt-1">
          Site édité par Ali El Mufti —{" "}
          <a className="underline" href="https://aelm.dev">
            aelm.dev
          </a>
          . Contact : via aelm.dev.
        </p>
      </section>
      <section className="card-brutal p-4 text-sm leading-relaxed">
        <h2 className="font-extrabold uppercase tracking-brutal">Hébergement</h2>
        <p className="mt-1">
          Site statique hébergé chez un fournisseur d'hébergement web (à compléter avant mise en
          production).
        </p>
      </section>
      <section className="card-brutal p-4 text-sm leading-relaxed">
        <h2 className="font-extrabold uppercase tracking-brutal">Responsabilité</h2>
        <p className="mt-1">
          Les résultats sont des estimations indicatives fondées sur des barèmes publics. Ils ne
          constituent ni un avis officiel, ni un engagement de la CAF, de l'Urssaf/Pajemploi ou de
          l'administration fiscale. Vérifiez votre situation sur les sites officiels.
        </p>
      </section>
    </article>
  );
}

export function Confidentialite() {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-4">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Confidentialité</h1>
      <section className="card-brutal p-4 text-sm leading-relaxed">
        <h2 className="font-extrabold uppercase tracking-brutal">Aucune collecte</h2>
        <p className="mt-1">
          Cet outil fonctionne entièrement dans votre navigateur. Aucune inscription, aucun compte,
          aucune donnée envoyée à un serveur. Les chiffres que vous saisissez restent sur votre
          appareil.
        </p>
      </section>
      <section className="card-brutal p-4 text-sm leading-relaxed">
        <h2 className="font-extrabold uppercase tracking-brutal">Sauvegarde par URL</h2>
        <p className="mt-1">
          Votre scénario est encodé dans l'adresse de la page (les paramètres après le « ? »).
          Copier ce lien suffit à sauvegarder ou partager votre simulation — sans aucun compte.
        </p>
      </section>
      <section className="card-brutal p-4 text-sm leading-relaxed">
        <h2 className="font-extrabold uppercase tracking-brutal">Cookies & mesure d'audience</h2>
        <p className="mt-1">
          Aucun cookie publicitaire. Toute mesure d'audience éventuelle sera respectueuse de la vie
          privée (sans cookie, données anonymisées).
        </p>
      </section>
    </article>
  );
}
