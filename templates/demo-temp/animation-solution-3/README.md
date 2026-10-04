# Docking Lab — Solution plateformes et vérins

Ouvrir **sch_ma_cin_matique_3d_interactif.html** dans un navigateur avec WebGL.
L’animation fonctionne en `file://`, sans serveur ni connexion Internet.
Conserver `docking.css`, `docking-model.js`, `docking-scene.js` et `vendor/` à côté du HTML.

La reconstruction suit **specification_liaisons_docking_solution_plateformes_verins.md**.
Elle représente la nouvelle architecture du document :

- `PLATFORM_1`, le longeron cylindrique transversal sous sa partie gauche et ses supports fixes ;
- trois vérins télescopiques avec corps, tige et articulations aux deux extrémités ;
- un bâti rigide cadre porteur de `PLATFORM_2` + quatre montants + `PLATFORM_3` ;
- un passage annulaire dans `PLATFORM_2` et deux demi-colliers mobiles se refermant sur la bouée par deux vérins horizontaux supplémentaires ;
- une glissière `FINE_Z` et un pivot `FINE_RZ` sous `PLATFORM_3`, portant `BOX_1` ;
- une bouée libre avant fermeture de P2, puis centrée radialement ; `BOX_2` reste fixée à son sommet ;
- l’interface temporaire `BOX_DOCK`, dans les états `OPEN` et `LOCKED`.

## Utilisation

**Lancer le cycle** joue une séquence illustrative de 32 secondes : libre,
descente du bâti par extension des vérins, correction d’assiette, mise au niveau de la bouée, fermeture
et centrage de P2, approche verticale fine, alignement en rotation, contact,
verrouillage, déverrouillage, retrait de BOX_1, ouverture de P2, dégagement du bâti.
La fermeture de P2 au bon niveau assure le centrage commun de P2, P3 et de la
bouée avant le docking fin, conformément à la correction de conception. Le cycle
s’arrête à la fin. **La bouée conserve son altitude pendant tout le cycle** :
le bâti part 1,2 m au-dessus du niveau de fermeture et les trois vérins s’allongent
pour abaisser P2/P3 jusqu’à la bouée. Après ouverture de P2, ils se rétractent
pour remonter le bâti. Le décalage de 1,2 m et les courses sont illustratifs.

- Pause/reprise, vitesse ×0,5/×1/×2, curseur temporel et étapes cliquables.
- Trois curseurs de courses de vérins et deux commandes fines activent
  l’exploration manuelle. La bouée n’a pas de commande verticale.
- **Fermer P2 / centrer la bouée** ou le curseur de fermeture commandent les deux
  demi-colliers. La fermeture est possible lorsque P2 est au bon niveau et à plat.
  Les deux vérins ont une course illustrative de 160 mm chacun ; les axes P2/P3/bouée
  coïncident à la fermeture complète.
- Les commandes de hauteur du bâti sont immobilisées pendant
  la fermeture ; la descente fine exige un centrage complet. Pour libérer la
  bouée, remonter BOX_1, puis utiliser **Ouvrir P2 / libérer la bouée**.
- **Remettre à niveau** conserve l’altitude du bâti et annule ses deux inclinaisons,
  sous réserve des contrôles géométriques.
- **Verrouiller BOX_1 ↔ BOX_2** est disponible lorsque les faces sont alignées
  et en contact, avec P2 fermée et centrée. Les commandes de mouvement restent immobilisées tant que la
  liaison temporaire n’est pas libérée.
- **Vue XZ**, **Dessus**, **Perspective**, **Centrage P2** et **Boîtes** permettent de lire les
  trois branches, le passage central et l’interface.
- **Schéma 3D** rend les corps transparents et montre les branches articulées,
  les montants rigides et les deux mouvements fins.
- **Cotes** montre les ordres de grandeur du croquis ; **Repères** masque ou
  affiche les noms. **Comprendre le système** détaille le graphe et les hypothèses.
- Glisser pour tourner, molette pour zoomer, clic droit pour déplacer ; espace
  pour lire ou suspendre lorsque le focus est hors des commandes.

Une sélection temporelle choisit directement une pose du cycle, y compris son
état de verrouillage. En exploration manuelle, les déplacements sont
échantillonnés jusqu’à la première interférence détectée.

## Repère et géométrie

**1 unité de scène = 1 m** ; les courses sont affichées en mm. Le repère du
document a X horizontal, Z vertical et Y vers l’observateur de la vue XZ.
La correspondance est `(X, Y, Z) = (x, z, y)` avec les coordonnées Three.js.
Les inclinaisons internes décrivent `R = Rx(pitch) Rz(roll)` ; elles sont
présentées comme rotations autour de X et de Y du document. Les deux
mouvements fins suivent l’axe vertical **local** du bâti, qui s’incline avec P3.

Les cotes du croquis sont conservées comme ordres de grandeur : diamètre
supérieur de bouée 1 m, rayon extérieur P2 1,5 m (extension de 1 m depuis chaque
flanc de bouée), écart vertical nominal ancrages hauts/P2 de 3,5 m. Cette dernière
référence est choisie pour la démonstration : les deux références exactes de la
cote « 3–4 m » restent inconnues.

Les autres dimensions sont des **choix illustratifs**, pas des mesures certifiées :

| Paramètre | Choix de reconstruction |
| --- | --- |
| P1, longueur × largeur × épaisseur | 7,6 × 3,8 × 0,18 m |
| Longeron, diamètre × longueur | 1,12 × 3,7 m |
| P2, passage du cadre porteur × épaisseur | Ø 1,64 × 0,12 m |
| Demi-colliers, diamètre intérieur fermé | 1 m |
| Vérins horizontaux de centrage | 2 × 160 mm, fermeture synchronisée |
| Hauteur du bâti P2/P3 | 1,6 m |
| P3, longueur × largeur × épaisseur | 2,1 × 1,9 × 0,14 m |
| Courses des vérins | 0 à 1 500 mm ; 1 300 mm au niveau de fermeture |
| Altitude initiale de P2 au-dessus du niveau de fermeture | 1,2 m |
| Course de FINE_Z | 0 à 450 mm ; contact nominal à 290 mm |
| Rotation de FINE_RZ | −180° à +180° |
| BOX_1, largeur × hauteur × profondeur | 0,42 × 0,22 × 0,34 m |
| BOX_2, hauteur | 0,20 m |

Le vérin gauche est presque vertical, le vérin droit descend en direction de
la gauche et le troisième est placé à l’arrière suivant Y. Leur triangle est
asymétrique : une distribution à 120° n’est pas imposée. Les positions exactes,
les quatre montants et la forme annulaire de P2 sont des hypothèses de reconstruction.
La **fermeture de P2 sur la bouée par vérins est confirmée**. Sa représentation par
deux demi-colliers en glissières horizontales et deux vérins opposés est illustrative :
le nombre et la disposition réels des vérins de centrage restent inconnus.
Les rotules aux deux extrémités sont l’option 3D recommandée par le document,
sans prétendre identifier le type réel d’articulation.

## Cinématique et verrouillage

Trois branches SPS seules ne déterminent pas les six coordonnées du bâti.
Avant fermeture de P2, l’animation **prescrit X, Y et le lacet** et résout la hauteur et les
deux inclinaisons. Aucun guide matériel n’est ajouté ; le guidage réel reste
inconnu. Le dialogue montre cette prescription en pointillés.

Avec `Ai` les ancrages fixes, `Bi` les ancrages locaux et `si` les courses en mm :

```text
ℓi = ℓi,0 + si / 1000
‖(0, h, 0) + R Bi − Ai‖ = ℓi
```

Les trois équations sont résolues par Newton amorti. Chaque vérin possède sa
longueur de référence `ℓi,0`, calculée à partir de la géométrie asymétrique.
La branche proche de la pose suspendue est suivie ; aucune analyse globale
des singularités n’est revendiquée. Les géométries Three.js utilisent les mêmes
transformations que les calculs, y compris pour BOX_1 sur une cage inclinée.

Le **cadre porteur** de P2, les montants et P3 restent solidaires. Les deux
demi-colliers coulissent par rapport à ce cadre. La bouée reste à hauteur constante, légèrement
décalée horizontalement au départ ; lors de la fermeture, son décalage horizontal est progressivement
annulé, ce qui centre P3 avec P2 et la bouée. Ce recentrage est prescrit pour
l’animation, sans calcul des efforts sur le flotteur.

`PLATFORM2_CAPTURE` évolue de `OPEN` à `CLOSING`, puis `CENTERED`. Le contact
radial est maintenu pendant le docking et la remontée de BOX_1 ; les demi-colliers
s’ouvrent ensuite avant la remontée du bâti. La fermeture impose le centrage
horizontal, sans certifier un encastrement réel bloquant aussi le mouvement
axial et le lacet. Les déplacements du bâti sont immobilisés
par les commandes pendant le centrage pour préserver le contact de démonstration.
La bouée conserve sa hauteur avant, pendant et après ce centrage.
`BOX_1` suit le mécanisme fin et `BOX_2` suit uniquement la bouée.

La validation illustrative du contact exige simultanément :

```text
écart des axes ≤ 3 mm
|écart axial signé| ≤ 1 mm
inclinaison ≤ 1°
écart d’orientation ≤ 1°
aucune interférence modélisée
```

Ces seuils sont des choix de démonstration, pas des tolérances fournies par le
document. Le verrouillage est une liaison fixe détachable supposée : pendant
`LOCKED`, les deux boîtes restent en contact et toutes les commandes susceptibles
de les déplacer sont immobilisées. Le cycle libère la liaison des boîtes avant de retirer
BOX_1, puis ouvre P2 pour libérer la bouée. Aucun mécanisme électrique ou interne aux boîtes n’est inventé.

## Contrôles et portée

Le passage de la bouée dans la tranche annulaire de P2 utilise une enveloppe
conservatrice du cylindre vertical coupé par le plan incliné du bâti. Le contact
des boîtes vérifie le centrage, leurs axes et l’altitude du coin inférieur de
BOX_1. La fermeture de P2 vérifie le niveau et l’assiette, et échantillonne
les surfaces intérieures des demi-colliers pour éviter leur pénétration dans
la bouée. Les mouvements manuels sont arrêtés avant la première interférence
modélisée, avec un message de butée virtuelle.

Les contrôles ne couvrent pas toutes les collisions entre supports, plateformes,
vérins et mécanisme fin. L’animation ne simule ni efforts, ni flottabilité, ni
houle, ni stabilité, ni frottement, ni jeu du verrouillage. Le plan bleu sert de
repère visuel de surface ; il n’est pas une simulation de l’eau.

## Vérification

```sh
node tests/model.test.cjs
node tests/scene.test.cjs
```

Les tests numériques couvrent 125 combinaisons de courses autour du niveau de fermeture, la rigidité du bâti,
l’indépendance des mouvements fins, 6 401 poses du cycle, les critères de contact,
le passage de la bouée et le centrage par demi-colliers. Ils vérifient aussi
l’altitude constante de la bouée, la descente monotone du bâti et l’allongement
simultané des trois vérins jusqu’au niveau de fermeture. Les tests de scène exécutent le contrôleur réel avec
les géométries et matrices Three.js et un DOM minimal : concordance des positions
et orientations, réglages manuels, verrouillage, butées, pause/reprise, fin du
cycle, vues, dialogue, fermeture au bon niveau, interdiction de descente avant centrage
et réouverture après retrait. Le rendu WebGL et la mise en page ne sont pas simulés
par ces tests.

Le contrôle visuel et navigateur est prévu avec Playwright :

```sh
python tests/browser_smoke.py
# Ou avec un Chromium existant :
python tests/browser_smoke.py /chemin/vers/chromium
```

Il vérifie l’ouverture locale, les commandes, les matrices de scène, le
verrouillage et l’absence de débordement horizontal à 1024 et 390 px. Les
captures sont produites dans `/tmp/docking-platforms-*.png`. Ce test n’a pas pu
être exécuté dans l’environnement de reconstruction : Chromium est arrêté
au démarrage par les restrictions système (`Operation not permitted`).

## Fichiers

- `sch_ma_cin_matique_3d_interactif.html` : interface, graphe et hypothèses.
- `docking-scene.js` : géométrie 3D, commandes et lecture du cycle.
- `docking-model.js` : cinématique et diagnostics sans dépendance DOM.
- `docking.css` : styles et adaptation mobile.
- `tests/model.test.cjs`, `tests/scene.test.cjs`, `tests/browser_smoke.py` : vérifications.
- `vendor/` : Three.js r128 et OrbitControls correspondants, disponibles localement.
