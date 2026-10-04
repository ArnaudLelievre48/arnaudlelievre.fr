# Docking Lab — Solution 2, porte-pince encastré au longeron

Ouvrir **sch_ma_cin_matique_3d_interactif.html** dans un navigateur avec WebGL.
L’application fonctionne directement en `file://`, sans serveur ni connexion Internet.
Conserver `docking.css`, `docking-model.js`, `docking-scene.js` et `vendor/` à côté du HTML.

La reconstruction suit [specification_liaisons_docking_solution_2.md](specification_liaisons_docking_solution_2.md)
et le croquis [Schéma Solution 2.pdf](Schéma%20Solution%202.pdf).

## Utilisation

- **Lancer le cycle**, **Pause / Reprendre**, vitesses ×0,5 / ×1 / ×2 : lire les neuf étapes sur 30 s.
- Curseur temporel et étapes cliquables : choisir une pose et l’état des deux interfaces.
- **Perspective**, **Face XZ**, **Dessus** : examiner le montage spatial.
- **Schéma 3D** : superposer segments et articulations aux volumes transparents.
- **Repères**, **Eau** : afficher ou masquer les annotations et l’eau visuelle.
- Glisser pour tourner, molette pour zoomer, clic droit pour déplacer ; espace pour lire ou suspendre.
- **Comprendre le système** : schémas, observations, hypothèses et liens vers les deux sources.

Le cycle s’arrête en état **Docking verrouillé**, pince engagée. **Réinitialiser** remet
la bouée libre et le bras dégagé. Reprendre la lecture depuis le mode manuel démarre un
nouveau cycle. Ouvrir les schémas suspend la lecture.

## Chaînes mécaniques

```text
PLATFORM — colonne fixe — A1(Y) — bras 1 — A2(Y) — bras 2
         — A3(Y) — bras 3 — A4(Y) — segment terminal — A5(local) — BOX_1

PLATFORM — supports inclinés — LONGERON
    ├── encastrement — bras porte-pince fixe — G4(Y) — pince + levier D2
    └── D1(rotule) — amortisseur à longueur variable — D2(rotule sur la pince)

WORLD — bouée indépendante [corps évasé + col + BOX_2, tous solidaires]

Pince / zone large de bouée : OPEN ↔ ENGAGED
BOX_1 / BOX_2              : OPEN ↔ LOCKED
```

Le longeron est un grand cylindre d’axe Y, rigidement attaché à la plateforme par des
supports inclinés. Selon la précision de conception de l’utilisateur, le bras porte-pince
est **encastré directement dans le longeron** : aucune rotation G1 n’est ajoutée à sa
fixation. **D1 est fixé au longeron**. Le pivot inférieur G4 est conservé ; D2 est rattaché
au levier solidaire de la pince mobile, pour que l’amortisseur travaille sur son inclinaison.
Ce choix de raccordement de D2 remplace son ancien placement sur le montant.
L’axe de l’amortisseur est toujours la droite D1–D2 et sa longueur est calculée à partir
de leurs positions. Son corps et sa tige sont représentés séparément.
Aucun ressort n’est ajouté, sa présence étant inconnue.

G4 permet une orientation relative de la pince. La pince entoure la zone évasée de la
bouée, avec du jeu radial. Le petit élément vertical local du croquis est conservé comme
pièce distincte avec sa tête et sa partie basse ; sa fonction reste inconnue.

La fermeture en deux demi-pinces pivotantes reprend la précision donnée précédemment
par l’utilisateur : les deux bras se referment comme un câlin. Cette architecture demeure
un choix explicite, puisque le croquis seul ne précise pas le mode de fermeture.
La charnière de fermeture est distincte de G4 et de la pièce verticale de fonction inconnue.
Elle appartient à la pince et suit son inclinaison ; ouverture maximale illustrative :
65° par demi-pince autour de leur axe vertical local commun.

## Cycle et mobilité après capture

Les neuf étapes sont : bouée libre, approche, capture grossière, verrouillage de la pince,
**stabilisation amortie**, approche du bras, alignement fin, contact des interfaces,
puis docking verrouillé.

La bouée est indépendante avant capture. Après capture, son point de préhension et
son inclinaison suivent la pince autour de G4. Elle peut donc encore se déplacer
par rapport à la plateforme ; sa rotation autour de son axe local reste libre. Durant la
stabilisation, seule la pince oscille autour de G4 ; le bras porte-pince reste immobile.
L’amortisseur change de longueur et d’orientation entre les deux rotules.

L’oscillation décroissante est **prescrite pour illustrer la fonction d’amortissement**.
La simulation ne résout pas de dynamique, ne déduit aucun coefficient d’amortissement
et ne calcule pas les forces, l’hydrodynamique ou la flottabilité. Les petites oscillations
initiales de la bouée et son approche sont également prescrites.

Après docking, les boîtes sont supposées liées par un encastrement démontable.
Les commandes de pose correspondantes, y compris G4, sont alors désactivées.
Le contact géométrique seul n’engage aucun verrouillage.

## Exploration manuelle

1. **Placer la bouée** définit une pose de démonstration dans la pince, selon G4.
2. Refermer les demi-pinces avec **Ouverture angulaire**, puis **Engager la pince**.
3. Explorer G4 : la bouée capturée suit la pince, et la longueur D1–D2 varie.
4. **Aligner le bras**, **Accoster**, puis **Verrouiller les boîtes**.
5. **Déverrouiller les boîtes**, **Reculer le bras**, puis **Libérer la bouée**.

Les cinq curseurs du bras supérieur commandent les vraies rotations A1–A5. Le curseur
G4 incline la pince sans ajouter de motorisation au dessin. Le porte-pince encastré ne
possède aucun curseur de bascule. La pose de la bouée est indépendante avant capture.
Après capture, sa rotation locale reste réglable tandis que
ses autres paramètres suivent la pince. Les changements manuels sont échantillonnés
jusqu’à la première interférence contrôlée. Les sélections temporelles choisissent
directement une pose. Une libération est refusée tant que le bras reste au contact.

## Cinématique et contact

Les coordonnées mécaniques sont `(X,Y,Z)` ; Three.js utilise `(x,y,z) = (X,Z,−Y)`.
Le montant et D1 sont fixes par rapport au longeron. Seuls la pince et son levier tournent :

```text
G4_position = fixation_porte_pince + (0, 0, −longueur_montant)  [constante]
D1_position = ancrage_sur_longeron                             [constante]
D2_position = G4_position + R(G4) · levier_local_pince
inclinaison_pince = G4
longueur_amortisseur = ‖D2_position − D1_position‖
```

La cinématique inverse du bras choisit A1 comme paramètre de posture, résout A2–A3,
puis calcule A4 pour opposer la normale de BOX_1 à celle de BOX_2. A5 ajuste l’azimut.
Elle fonctionne aussi sur une bouée inclinée. Aucune tourelle n’est ajoutée ; une cible
hors du plan XZ est refusée. Les axes réels de l’outil imposent son orientation.

Le contact exige simultanément :

```text
écart radial par rapport à la normale de BOX_2 ≤ 0,015 m
|écart axial signé sur cette normale| ≤ 0,005 m
écart entre les normales opposées ≤ 1°
écart d’azimut des boîtes ≤ 1°
aucune interférence contrôlée
```

Le verrouillage des boîtes exige également la capture de la bouée. La barre sous les
mesures représente l’approche géométrique sur les derniers 0,35 m, sans broches ni
simulation électrique. Les transitions utilisent `s(u) = 10u³ − 15u⁴ + 6u⁵`.

## Cotes et hypothèses

**Une unité de scène correspond à un mètre.** Les trois cotes manuscrites sont reprises
comme indications de reconstruction ; elles ne constituent pas un plan coté validé.

| Élément | Valeur / modèle retenu | Statut |
| --- | --- | --- |
| Plateforme | Longueur 5 m | Cote manuscrite ; périmètre exact à confirmer |
| Capture | Diamètre intérieur 4 m | Annotation de diamètre approximative |
| Séparation plateforme / BOX_2 | 3,5 m | Choix dans la plage 3–4 m ; références ambiguës |
| Bras | Segments 1,9 / 3,4 / 3,6 / 0,45 m | Dimensions complémentaires illustratives |
| Fixation du porte-pince | Encastrement direct au longeron ; aucun pivot G1 | Précision de conception de l’utilisateur |
| D1 | Rotule fixée au longeron | Précision de conception de l’utilisateur ; position illustrative sur sa surface |
| G4 | Pivot inférieur d’axe Y, seul débattement du support | Articulation conservée ; type 3D exact à confirmer |
| D2 | Rotule sur le levier solidaire de la pince mobile | Raccordement retenu pour amortir G4 ; géométrie du levier illustrative |
| Amortisseur | Rotules D1–D2, corps + tige, longueur 1,6–2,3 m | Course choisie ; coefficient et ressort inconnus |
| Pince | Deux demi-pinces à fermeture angulaire | Précision de conception antérieure conservée |
| Pièce verticale locale | Pièce distincte fixée à la pince | Fonction inconnue ; aucune action imposée |
| Capture | Point et inclinaison retenus dans la pince, rotation locale libre | Mobilités réelles résiduelles inconnues |
| Docking | Encastrement temporaire après contact | Hypothèse de première maquette |

Les matériaux affichés, autres dimensions, limites angulaires, durées, seuils de contact
et supports détaillés sont des choix de visualisation. Ils ne sont pas présentés comme
des propriétés déduites du croquis. Le profil évasé de la bouée est reconstruit sans
imposer une collerette distincte dont la présence exacte n’est pas démontrée.

## Portée des contrôles

Les contrôles comparent les segments du bras et l’enveloppe de BOX_1 à la plateforme,
les segments au profil de bouée, les demi-pinces au corps de bouée en tenant compte
de G4 et de la fermeture, et les contacts à leurs critères de pose. Les limites du
support et de longueur de l’amortisseur sont également vérifiées.

Les contrôles emploient des enveloppes et des échantillonnages. Ils ne vérifient pas
toutes les collisions, notamment entre les segments du bras, les supports fixes et
le longeron. La maquette ne dimensionne ni les efforts, la stabilité, les masses,
la compliance ou les singularités globales. Les schémas ne revendiquent pas de
conformité à une norme de représentation.

## Vérification

```sh
node tests/model.test.cjs
python3 tests/browser_smoke.py
# Ou préciser un Chromium existant :
python3 tests/browser_smoke.py /chemin/vers/chrome
```

Les huit tests numériques couvrent les cotes indicatives, la fermeture cinématique
G4/D1–D2, l’immobilité du montant, les fixations sur le longeron, le levier mobile,
la mobilité après capture, le docking
sur une bouée inclinée, **3 001 poses** du cycle, l’amplitude décroissante, les contacts,
les butées et le dégagement des demi-pinces.

Le test navigateur nécessite Playwright et Chromium. Il ouvre le HTML local hors
connexion et compare **121 poses** à la scène Three.js : bras, pivots, rotules,
axe de l’amortisseur, charnière et pointes des demi-pinces. Il vérifie le parcours manuel
avec porte-pince fixe, pince mobile et boîtes inclinées, le cycle automatique, la pause/reprise,
l’arrêt aux interférences, les schémas et l’affichage mobile. Captures : `/tmp/docking-*.png`.

## Fichiers

- `sch_ma_cin_matique_3d_interactif.html` : interface française et schémas.
- `docking-model.js` : cinématique, trajectoire et contacts, sans DOM ni Three.js.
- `docking-scene.js` : géométrie Three.js, commandes et annotations.
- `docking.css` : styles et adaptation mobile.
- `specification_liaisons_docking_solution_2.md` : descriptif corrigé ; `Schéma Solution 2.pdf` : croquis original.
- `tests/model.test.cjs`, `tests/browser_smoke.py` : contrôles numériques et navigateur.
- `vendor/` : Three.js r128, OrbitControls correspondant et licence MIT.
