# Animation — solution à trois vérins et bras articulé

Ouvrir **`sch_ma_cin_matique_3d_interactif.html`** dans un navigateur compatible WebGL, puis cliquer sur **Lancer le cycle**. Tous les fichiers et la bibliothèque Three.js sont locaux : aucune connexion Internet ni compilation n’est nécessaire.

L’animation est construite à partir de `specification_liaisons_docking_solution_3verins_bras_articule.md`. Elle remplace l’ancienne cinématique de ce dossier.

## Mécanisme représenté

- `PLATFORM_1` : plateforme rigide de 5 m, longeron cylindrique orienté suivant Y et supports fixes.
- Trois vérins télescopiques, corps et tiges distincts, montés sur des rotules. Les ancrages sont répartis en triangle non équilatéral ; le troisième vérin est placé à l’arrière.
- `PLATFORM_2` : cadre rigide de 3 × 2,2 m, ouverture centrale de 1,4 × 1,4 m. Les extensions mesurent 1 m entre le col de la bouée et les extrémités suivant X.
- Bouée indépendante avant capture, avec col Ø 1 m et `BOX_2` fixée au sommet.
- Colonne du bras fixée au côté droit du cadre ; A1, A2 et A3 sont trois pivots parallèles à Y ; A4 est une rotation autour de l’axe local du poignet portant `BOX_1`.
- Deux interfaces temporaires distinctes : capture latérale de la bouée et docking de `BOX_1` sur `BOX_2`.

Le modèle utilise **1 unité 3D = 1 m**. Le repère mécanique est X vers la droite, Y hors du plan du dessin, Z vertical. Three.js utilise `[X, Z, -Y]`, un changement de repère qui préserve son orientation.

## Cycle animé

Le cycle dure 34 secondes ; les durées sont choisies pour la démonstration.

| Temps | Étape | Mouvement |
|---|---|---|
| 0–3 s | Approche | Bouée libre, bras dégagé |
| 3–7 s | Descente du cadre | Allongement des trois vérins |
| 7–10 s | Mise à niveau | Commande différentielle des courses |
| 10–13 s | Capture grossière | Recentrage de la bouée et fermeture latérale |
| 13–17 s | Approche du bras | Positionnement par A1–A3 |
| 17–19 s | Orientation A4 | Rotation axiale du boîtier |
| 19–21 s | Contact | Descente finale vers BOX_2 |
| 21–24 s | Docking verrouillé | Capture et accouplement engagés |
| 24–27 s | Retrait du bras | Déverrouillage puis dégagement |
| 27–30 s | Libération | Ouverture de la capture |
| 30–34 s | Remontée | Retour du cadre en position haute |

La capture reste engagée pendant le docking fin et le retrait du bras. Le cadre remonte après libération. Des interpolations à vitesse et accélération nulles aux extrémités rendent les étapes continues.

## Commandes

- Lecture/pause, réinitialisation, vitesse ×0,5 / ×1 / ×2.
- Curseur temporel et onze boutons d’étapes : accès direct à toute la séquence.
- Courses indépendantes des trois vérins et bouton de mise à niveau.
- Réglages indépendants d’A1–A4 ; aucune tourelle ni compensation spatiale fictive.
- Réglage de la capture latérale et bouton de libération.
- Vues perspective, face et dessus ; schéma 3D et repères masquables.
- Fenêtre « Comprendre le système » : graphe des liaisons, cotes et hypothèses.
- Glisser pour orbiter, molette pour zoomer, clic droit pour déplacer, espace pour lecture/pause.

Un réglage active le mode manuel et déverrouille le docking fin. Les mouvements manuels sont parcourus par petits incréments et arrêtés avant les interférences détectées. La capture doit être libérée avant de modifier la pose du cadre. Le serrage manuel exige une bouée déjà centrée par le cycle. Relancer en mode manuel réinitialise la séquence.

## Hypothèses explicites

Le croquis ne définit pas toutes les dimensions et contraintes. Les choix suivants sont signalés dans l’interface :

- Guidage idéal limitant `PLATFORM_2` à la hauteur et deux inclinaisons. Les translations X/Y et le lacet sont négligés. Les trois branches à rotules seules ne suffisent pas à imposer une pose spatiale complète ; aucune pièce de guidage réelle n’est inventée.
- Rotules aux extrémités des vérins et disposition triangulaire illustrative.
- Largeur de la plateforme, diamètre/longueur du longeron, profondeur et forme du cadre, corps inférieur de la bouée : géométries de maquette.
- Courses illustratives de 0 à 1 100 mm, calculées à partir de trois longueurs minimales distinctes. Ce ne sont pas des caractéristiques de vérins sélectionnés.
- Mâchoires coulissantes suivant X : interprétation plausible des flèches de capture, non prouvée par le dessin. Le recentrage de la bouée est prescrit et n’est pas issu d’un calcul de contacts.
- Bras : longueurs 1,30 m et 0,95 m ; déport terminal total de 0,50 m. Les limites articulaires sont illustratives.
- Seuils de contact choisis pour la démonstration : 8 mm transversal, ± 2 mm axial et 1° en inclinaison et azimut. La jauge indique les 20 derniers millimètres d’approche, sans supposer de broches ou de mécanisme interne.
- Verrouillage symbolique temporaire, autorisé après capture et contact aligné. Les degrés de liberté réellement bloqués restent à préciser.

Le bras est réellement plan : sur un cadre incliné, il ne peut pas annuler arbitrairement une erreur spatiale. Le cycle remet donc le cadre à niveau et centre la bouée avant d’utiliser A1–A4 pour le docking.

## Vérification et limites

`docking-model.js` est indépendant du rendu : fermeture numérique des trois longueurs, cinématique directe/inverse du bras et états de capture/contact/verrouillage. `docking-scene.js` applique ces transformations aux groupes de pièces.

Les contrôles d’interférence utilisent des enveloppes et un échantillonnage géométriques : cadre/col, bras/cadre, bras/bouée, bras/vérins, bras/plateforme, bras/longeron, boîtier/cadre, boîtier/bouée et contact désaligné. Ils ne constituent pas une détection exhaustive de toutes les collisions. La simulation ne calcule ni efforts, ni frottements, ni stabilité, ni dynamique de houle ; elle ne valide pas un dimensionnement industriel.

Tests du modèle, avec Node.js :

```sh
node --test --test-isolation=none tests/model.test.cjs
```

L’option d’isolation convient à l’environnement de travail restreint. Selon la version de Node.js, on peut également lancer `node tests/model.test.cjs`.

Vérification dans Chromium, avec Python et Playwright déjà installés :

```sh
python3 tests/browser_smoke.py
```

Le test compare les positions et orientations réelles de la scène aux calculs du modèle, parcourt les étapes, vérifie les commandes, le verrouillage de capture, la lecture/pause, les vues et l’absence de débordement sur mobile. Les captures de vérification sont enregistrées dans `/tmp/docking-3verins-*.png`.

Fichiers à conserver ensemble :

```text
sch_ma_cin_matique_3d_interactif.html
docking-model.js
docking-scene.js
docking.css
vendor/three.min.js
vendor/OrbitControls.js
```
