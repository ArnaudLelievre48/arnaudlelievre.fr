# Docking Lab — Plateforme et bouée

Ouvrir **sch_ma_cin_matique_3d_interactif.html** dans un navigateur avec WebGL.
L’application fonctionne directement en `file://`, sans serveur et sans connexion Internet.
Conserver `docking.css`, `docking-model.js`, `docking-scene.js` et `vendor/` à côté du HTML.

La reconstruction suit [specification_liaisons_docking_3D.md](specification_liaisons_docking_3D.md).
Elle remplace la précédente solution à plateforme annulaire suspendue et bras 3R.

## Utilisation

- **Lancer le cycle**, **Pause / Reprendre** et les vitesses ×0,5 / ×1 / ×2 : lire les neuf étapes sur 26 s.
- Curseur temporel et étapes cliquables : choisir une pose, y compris les états des deux interfaces.
- **Perspective**, **Face XZ**, **Dessus** : observer la structure spatiale et les occultations.
- **Schéma 3D** : afficher les segments et articulations avec les volumes transparents.
- **Repères** et **Eau** : afficher ou masquer les annotations et la surface visuelle de l’eau.
- Glisser pour tourner, molette pour zoomer, clic droit pour déplacer ; espace pour lire ou suspendre.
- **Comprendre le système** : schémas fonctionnel et des liaisons, hypothèses et lien vers la spécification.

Le cycle s’arrête en état **Docking verrouillé**, pince engagée. **Réinitialiser** remet
la bouée libre et le bras dégagé. Reprendre la lecture depuis le mode manuel lance un nouveau cycle.
L’ouverture des schémas suspend la lecture.

## Architecture reconstruite

Deux chaînes partagent une plateforme rigide de largeur non nulle :

```text
PLATFORM — colonne fixe — A1(Y) — bras 1 — A2(Y) — bras 2
         — A3(Y) — bras 3 — A4(Y) — segment terminal — A5(local) — BOX_1

PLATFORM — 3 × [T_UP_i(rotule) — bielle rigide — T_LOW_i(rotule)]
         — support inférieur + mât central distinct — pivot Z commun — 2 demi-pinces

WORLD — bouée indépendante [corps + collerette + col + BOX_2, tous solidaires]

Pince / collerette : OPEN ↔ ENGAGED
BOX_1 / BOX_2      : OPEN ↔ LOCKED
```

Le longeron est un **cylindre d’axe Y**, relié à la plateforme par des entretoises
triangulées rigides. Le bras est attaché à la plateforme, indépendamment de la pince.
Les trois branches du tripode sont distribuées dans l’espace, avec les six articulations
hautes et basses, y compris la troisième branche occultée dans la projection.
La pince est constituée de deux demi-pinces courbes qui entourent le corps, sous la collerette.
Elles sont articulées sur un **pivot commun d’axe Z**, côté plateforme. Leurs rotations
opposées les referment autour de la bouée comme deux bras faisant un câlin. L’ouverture
maximale choisie est de 65° par demi-pince ; le pivot reste fixe et chaque demi-pince rigide.
Ce fonctionnement reprend la précision de conception donnée après la spécification initiale.
La ligne d’eau est un repère visuel et ne crée aucune liaison.

## Séquence et interfaces temporaires

Le cycle illustre les neuf étapes recommandées : bouée libre, approche, capture grossière,
verrouillage de la pince, stabilisation, approche du bras, alignement fin, contact,
puis verrouillage de l’interface.

Les faibles oscillations initiales et le mouvement d’entrée de la bouée sont prescrits.
Ils disparaissent avant la capture. Il ne s’agit pas d’un calcul hydrodynamique.
Après capture, les translations sont retenues ; la rotation Z reste disponible.
Après verrouillage des boîtes, leur pose relative est retenue et les commandes
correspondantes sont désactivées.

La proximité seule ne verrouille pas une interface. Le contact des boîtes exige :

```text
écart radial ≤ 0,015 u
|écart axial signé| ≤ 0,005 u
écart entre les normales opposées ≤ 1°
écart d’azimut des boîtes ≤ 1°
aucune interférence contrôlée
```

Le verrouillage de BOX_1 / BOX_2 exige en plus la capture de la bouée.
Aucune broche, connexion électrique ou force magnétique n’est supposée.
La barre sous les mesures indique uniquement l’approche géométrique sur les derniers 0,35 u.

Pour explorer un accouplement manuel depuis la pose initiale :

1. **Placer la bouée** définit sa pose dans la zone de capture.
2. Refermer les demi-pinces avec le curseur **Ouverture angulaire**, puis **Engager la pince**.
3. **Aligner le bras**, puis **Accoster** et **Verrouiller les boîtes**.
4. **Déverrouiller les boîtes**, **Reculer le bras**, puis **Libérer la bouée**.

Les cinq curseurs du bras et les quatre paramètres de pose de la bouée permettent
d’explorer les mobilités et les désalignements. A4 incline réellement le segment terminal
et BOX_1 ; A5 tourne réellement BOX_1 autour de son axe local. Les changements sont
échantillonnés jusqu’à la première interférence contrôlée. Une libération est refusée
si le bras reste au contact. Les sélections temporelles choisissent directement une pose.

## Choix de reconstruction et incertitudes

**u désigne une unité arbitraire de scène.** La spécification ne fournit pas de cotes
absolues : aucune conversion en millimètres n’est revendiquée. Toutes les longueurs,
butées, durées et tolérances sont des choix illustratifs, modifiables dans `DockingModel.C`.

| Élément | Choix de la maquette | Statut / précision de conception |
| --- | --- | --- |
| A1–A4 | Pivots parallèles d’axe Y, bras dans XZ | Liaisons observées, axes privilégiés |
| A5 | Pivot longitudinal local portant BOX_1 | Rotation observée |
| Tripode | 3 bielles rigides, 6 rotules, espacement 120° | Branches observées ; rotules et régularité supposées |
| Mât central | Structure fixe distincte de la branche arrière, variante T3-B | Fonction réelle inconnue ; aucune glissière certaine |
| Pince | Deux demi-pinces, rotations opposées sur un pivot Z commun | Fermeture angulaire précisée par l’utilisateur ; géométrie et amplitude de 65° illustratives |
| Capture | Translations retenues, rotation Z libre ; bouée verticale | Mobilités résiduelles réelles inconnues |
| Docking | Encastrement démontable après contact | Hypothèse recommandée de première maquette |
| Actionneurs | Non représentés | Existence et implantation inconnues |

Le mât central fixe maintient le support inférieur ; les bielles conservent leurs longueurs.
Cette variante illustre une capture à hauteur constante. Elle ne prétend pas reconstruire
un mécanisme de réglage vertical dont les liaisons sont inconnues. Aucune tourelle,
glissière centrale ou branche télescopique n’est introduite.

Les longueurs de bras choisies sont 1,9 / 3 / 2 / 0,45 u, avec BOX_1 de hauteur 0,34 u.
La cinématique inverse utilise A1 comme paramètre de posture, résout analytiquement
A2–A3, puis calcule A4 pour obtenir l’axe terminal souhaité. A5 ajuste l’azimut.
La chaîne réelle impose toute l’orientation : aucun poignet idéal ne la corrige.
Le bras ne peut pas atteindre une cible hors du plan XZ ; une bouée décalée suivant Y
doit être recentrée avant l’accouplement.

Les transitions utilisent `s(u) = 10u³ − 15u⁴ + 6u⁵` avec vitesse et accélération nulles
aux extrémités. Le repère mécanique est `(X, Y, Z)` ; Three.js utilise
`(x, y, z) = (X, Z, −Y)`.

## Portée des contrôles

Les contrôles comparent les segments du bras et l’enveloppe de BOX_1 à la plateforme,
les segments au profil axisymétrique de la bouée, et les deux interfaces à leurs critères
de position et d’orientation. Les demi-pinces sont comparées au profil de bouée et à la
collerette sur leur tranche verticale, en tenant compte de leur rotation autour du pivot ;
le contact avec le dessous de la collerette est permis.
Certaines enveloppes sont conservatrices et certains contrôles sont échantillonnés.

La maquette ne vérifie pas toutes les collisions, notamment celles entre les segments
du bras, le tripode, le longeron et leurs supports. Elle ne calcule ni efforts, frottement,
raideur, flottabilité, compliance, stabilité ou singularités globales. « LOCKED » décrit
un état de contrainte géométrique illustratif. Les schémas ne revendiquent pas de
conformité à une norme de représentation.

## Vérification

```sh
node tests/model.test.cjs
python3 tests/browser_smoke.py
# Ou préciser un Chromium existant :
python3 tests/browser_smoke.py /chemin/vers/chrome
```

Les huit tests numériques couvrent la géométrie spatiale du tripode, la fermeture angulaire
des demi-pinces autour d’un pivot fixe, la conservation de leur géométrie, la cinématique
directe/inverse des cinq rotations, **5 201 poses** du cycle, la continuité, l’ordre
des verrouillages, les mobilités résiduelles, les refus de contact et les interférences.

Le test navigateur nécessite Playwright et Chromium. Il compare **105 poses** de la
scène Three.js aux calculs, vérifie le cycle automatique, pause/reprise, le cycle manuel
complet, les commandes désactivées par les contraintes, l’arrêt aux interférences,
les schémas et les vues mobile/desktop. Il ouvre le HTML local en mode hors connexion.
Les captures sont écrites dans `/tmp/docking-*.png`.

## Fichiers

- `sch_ma_cin_matique_3d_interactif.html` : interface française et schémas.
- `docking-model.js` : cinématique, trajectoire, contacts et contraintes, sans DOM ni Three.js.
- `docking-scene.js` : géométrie Three.js, commandes et annotations.
- `docking.css` : styles existants adaptés aux nouvelles commandes, mise en page mobile.
- `specification_liaisons_docking_3D.md` : spécification source conservée.
- `tests/model.test.cjs`, `tests/browser_smoke.py` : vérifications numériques et navigateur.
- `vendor/` : Three.js r128, OrbitControls correspondant et licence MIT.
