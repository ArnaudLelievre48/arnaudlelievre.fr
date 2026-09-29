# Docking Lab

Ouvrir **sch_ma_cin_matique_3d_interactif.html** dans un navigateur avec WebGL.
L’application fonctionne directement en `file://`, sans serveur ni connexion Internet.
Conserver `docking.css`, `docking-model.js` et `vendor/` à côté du HTML.

Le bouton **Comprendre le système** ouvre les schémas fonctionnel et cinématique,
avec les hypothèses introduites. **Schéma 3D** superpose les segments articulés
à une représentation transparente du mécanisme.

## Utilisation

- **Lancer le cycle** : centrage, approche, insertion, maintien, retrait ; durée de référence 18 s.
- **Pause / Reprendre**, curseur temporel et étapes cliquables : explorer la trajectoire.
- Les six curseurs activent le mode manuel ; une nouvelle lecture réinitialise la pose de référence.
- **Remettre à niveau** égalise les courses à leur moyenne, sous contrôle des interférences.
- Désactiver **Maintenir l’orientation** pour observer un outil solidaire du dernier segment.
- Glisser pour tourner, molette pour zoomer, clic droit pour déplacer ; espace pour lire ou suspendre.

Le cycle s’arrête après le retrait. Les changements manuels sont échantillonnés
jusqu’à la première interférence détectée. Les vues temporelles sélectionnent
directement une pose de la trajectoire : ce sont des commandes d’exploration.

## Analyse du HTML initial

La chaîne identifiée est un bâti S0, trois vérins articulés, un anneau mobile S4,
un bras à trois pivots S5–S7, une fiche S8 et une prise fixe S9.
Chaque vérin comprend deux solides distincts, corps et tige, reliés par une
glissière, et deux rotules d’extrémité : une branche SPS.

Le code initial imposait une hauteur et une inclinaison approximatives à partir
des courses, puis affichait les vérins sans résoudre leur fermeture. Il animait
les articulations par sinusoïdes et interpolations, sans cinématique inverse.
Il orientait aussi la fiche indépendamment du bras sans nommer cette mobilité.
Enfin, l’écart axial était tronqué à zéro et l’orientation n’intervenait pas dans
le diagnostic de connexion.

## Hypothèses et modifications géométriques

Les trois distances AᵢBᵢ ne suffisent pas à imposer les six coordonnées de S4.
Le modèle ajoute donc une contrainte de guidage idéale qui bloque les deux
translations horizontales et le lacet. Ce guidage reste à concevoir ; le schéma
le représente en pointillés et la scène ne lui invente pas une géométrie matérielle.

Le bras 3R commande la position de son extrémité. L’orientation indépendante de
S8 est une fonction supplémentaire, matérialisée par trois anneaux au poignet
et traitée comme un poignet idéal à trois rotations. Aucun asservissement,
parallélogramme ou système passif réel n’est dimensionné ici.

Une échelle cohérente est retenue : **1 unité de scène = 100 mm**. Le HTML
initial mélangeait ses unités et ses conversions ; cette échelle et les
dimensions suivantes sont des choix de démonstration, pas des cotes certifiées.

| Paramètre | Valeur retenue |
| --- | --- |
| Rayon extérieur / intérieur de l’anneau | 245 / 95 mm |
| Rayon des ancrages hauts | 290 mm |
| Altitude des ancrages hauts | 375 mm |
| Courses des vérins | 0 à 200 mm |
| Longueur rotule à rotule à course nulle | ≈ 233,054 mm |
| Position neutre | courses 100 mm ; altitude S4 45 mm |
| Segments du bras | 160 et 215 mm ; géométrie initiale 1,35 et 1,25 unités |
| Déport de la face de fiche sous le poignet | 75 mm |
| Altitude du plan de connexion | −131 mm |
| Engagement utile des broches | 5 mm |

L’allongement des segments et le montage de la fiche sous le poignet permettent
d’atteindre S9 tout en faisant passer le bras par l’ouverture de l’anneau.
La trajectoire garde S4 à niveau. L’influence de ses courses différentielles
peut être explorée séparément en mode manuel.

## Modèle géométrique

Le repère mécanique utilise Z vertical. Three.js utilise y vertical ; la
correspondance est `(X, Y, Z) = (x, −z, y)`. Les angles internes `pitch` et `roll`
décrivent `R = Rx(pitch) Rz(roll)` dans le repère Three.js. Les angles affichés
sont θX = pitch et θY = −roll.

Pour chaque vérin, avec les longueurs exprimées en unités de scène :

```text
ℓᵢ = ℓ₀ + courseᵢ / 100
‖(0, h, 0) + R Bᵢ − Aᵢ‖ = ℓᵢ
```

Les trois équations sont résolues par Newton amorti en `(h, pitch, roll)`,
avec une tolérance interne de 10⁻⁸ unité. La branche proche de la configuration
suspendue est suivie ; ce calcul ne constitue pas une analyse globale des
singularités ou de toutes les branches d’assemblage.

La cible du poignet est la cible de la face de connexion décalée de 75 mm vers
le haut. Elle est ramenée dans le repère de S4. J1 oriente le plan du bras vers
cette cible ; J2 et J3 proviennent de la résolution analytique du bras plan 2R
sur une branche de coude choisie pour dégager l’anneau. Les trajectoires utilisent
`s(u) = 10u³ − 15u⁴ + 6u⁵`, à vitesse et accélération nulles aux extrémités.

La connexion exige simultanément :

```text
écart radial ≤ 1,5 mm
|écart axial signé| ≤ 0,5 mm
inclinaison de la fiche ≤ 1°
écart de l’axe de détrompage ≤ 1°
aucune interférence détectée
```

L’orientation est mesurée sur les axes réels de l’outil. Le pourcentage
d’insertion représente uniquement les 5 mm utiles des broches et reste nul
si les interfaces sont désalignées.

## Portée des contrôles

Les segments du bras sont comparés à la tranche annulaire avec une épaisseur
de sécurité. Le boîtier utilise une enveloppe conservatrice de rayon égal à
sa demi-diagonale ; elle peut arrêter un mouvement avant le contact exact.
Le passage sur S9 vérifie le centrage, l’orientation et la butée axiale.

Ce modèle ne calcule ni efforts, ni frottement, ni souplesse, ni stabilité de
la suspension. Il ne vérifie pas toutes les collisions possibles avec le bâti,
le sol, les vérins, les câbles ou entre les différentes pièces du bras. Le
poignet idéal n’a pas de butées. « Connecté » indique seulement que les critères
géométriques de démonstration sont satisfaits, sans simulation électrique.
Les schémas ne revendiquent pas de conformité à une norme de représentation.

## Vérification

```sh
node tests/model.test.cjs
```

Les tests couvrent les 125 combinaisons de courses 0/50/100/150/200 mm,
la concordance directe/inverse sur plateforme inclinée, 3 601 poses du cycle,
les refus d’accostage désaligné ou trop profond, la collision avec l’anneau
et le calcul d’insertion.

Une vérification navigateur a également contrôlé l’ouverture locale, la
concordance entre la géométrie Three.js et les calculs, les commandes, les
schémas, la pause/reprise et la mise en page mobile. Elle est reproductible
avec Python et Playwright déjà installés :

```sh
python tests/browser_smoke.py
# Ou avec un exécutable Chromium existant :
python tests/browser_smoke.py /chemin/vers/chromium
```

Les captures de vérification sont produites dans `/tmp/docking-*.png`.

## Fichiers

- `sch_ma_cin_matique_3d_interactif.html` : interface, géométrie 3D, interactions.
- `docking-model.js` : cinématique, trajectoire et critères géométriques, sans dépendance DOM.
- `docking.css` : styles et adaptation mobile.
- `tests/model.test.cjs` : tests numériques exécutables avec Node.js.
- `tests/browser_smoke.py` : vérification de l’interface avec Playwright.
- `vendor/` : Three.js r128, OrbitControls correspondant et licence MIT.
