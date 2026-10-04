# Spécification cinématique et géométrique du mécanisme de docking — Solution 2
## Extraction détaillée à partir du croquis fourni dans « Schéma Solution 2.pdf »

> **But du document** : fournir à un modèle de génération/reconstruction 3D une description aussi non ambiguë que possible des corps rigides, articulations, degrés de liberté, contacts, occultations et incertitudes visibles sur le croquis de la **Solution 2**.
>
> **Important** : le dessin est une **projection 2D d'un mécanisme destiné à être tridimensionnel**. Un croisement de traits dans le dessin ne crée pas automatiquement une liaison. Les pièces qui se superposent graphiquement peuvent être décalées suivant la profondeur. Les interprétations qui ne sont pas directement démontrées par le croquis sont explicitement marquées comme hypothèses.

> **Précisions de conception de l’utilisateur, intégrées à cette version** : le bras porte-pince est **encastré dans le longeron** ; la rotule **D1 est fixée au longeron**. L’ancien pivot supposé `G1` est supprimé. Le pivot inférieur `G4` est conservé ; dans la reconstruction, `D2` est rattaché au levier solidaire de la pince mobile afin que l’amortisseur travaille sur ce mouvement. Ce raccordement de D2 est un choix de reconstruction, sa géométrie exacte restant à préciser. La pince comporte deux demi-pinces se refermant angulairement comme un câlin, conformément à la précision antérieure de l’utilisateur. Ces précisions remplacent les anciennes interprétations du croquis sur ces points.

---

# 1. Convention de repère

Utiliser le repère global suivant :

- `X` : horizontal dans le plan du dessin, positif vers la droite ;
- `Z` : vertical dans le plan du dessin, positif vers le haut ;
- `Y` : perpendiculaire au dessin, positif vers l'observateur.

Le croquis doit être compris comme une vue latérale/projetée dans le plan `XZ`.

Conséquences :

1. les dimensions suivant `Y` ne sont pas directement fournies ;
2. la pince entourant la bouée doit avoir une géométrie spatiale, et non être reconstruite comme une simple barre plane ;
3. les cercles dessinés au niveau des articulations sont interprétés comme des représentations de pivots/rotules vus en projection ;
4. les doubles traits des bras représentent généralement l'épaisseur d'une seule pièce ;
5. le grand cercle annoté `longeron` est très probablement une section d'un volume cylindrique ou tubulaire et non une sphère ;
6. les superpositions entre la pince, la bouée et les supports ne doivent pas être transformées automatiquement en pénétrations de matière.

---

# 2. Inventaire des sous-ensembles

Le système visible contient au minimum cinq sous-ensembles fonctionnels :

1. `PLATFORM_ASSEMBLY`
   - plateforme principale ;
   - longeron/flotteur de grande section sous la plateforme ;
   - jambes ou supports reliant le longeron à la plateforme ;
   - support fixe du mécanisme inférieur.

2. `ARTICULATED_ARM`
   - embase verticale fixée sur la plateforme ;
   - chaîne série de bras articulés ;
   - poignet terminal rotatif ;
   - `BOX_1` portée par l'effecteur.

3. `DAMPED_GRIPPER_SUPPORT`
   - rotule D1 fixée au longeron ;
   - bras porte-pince encastré au longeron ;
   - pivot inférieur G4 et levier mobile de pince portant D2 ;
   - amortisseur incliné ;
   - rotules/pivots aux extrémités de l'amortisseur ;
   - bras vertical descendant vers la pince.

4. `GRIPPER_ASSEMBLY`
   - pince ou anneau de capture de grand diamètre ;
   - articulation G4 de raccordement au bras porte-pince fixe ;
   - au moins un élément vertical local pouvant être un verrou, pion, vis ou actionneur ;
   - géométrie de retenue autour de la partie large de la bouée.

5. `BUOY_ASSEMBLY`
   - corps principal de la bouée ;
   - partie inférieure immergée ;
   - élargissement conique/évasé au voisinage de la pince ;
   - col supérieur vertical ;
   - `BOX_2` fixée au sommet.

La bouée est un corps flottant indépendant de la plateforme tant qu'aucune capture mécanique n'est engagée.

---

# 3. Sous-ensemble plateforme

## 3.1 `PLATFORM`

La plateforme est le bâti principal horizontal du système.

Géométrie visible :

- forme générale : poutre/plaque rectangulaire longue et mince ;
- axe principal approximativement parallèle à `X` ;
- faible épaisseur suivant `Z` par rapport à sa longueur ;
- largeur réelle suivant `Y` non représentée ;
- elle porte le bras articulé supérieur ;
- elle supporte également le longeron et le mécanisme de pince inférieur.

Une annotation `5 m` apparaît le long de la plateforme.

Interprétation la plus naturelle :

```text
PLATFORM_LENGTH ≈ 5 m
```

mais le dessin ne permet pas de confirmer si cette cote correspond exactement à la longueur totale de la plateforme ou à une portion fonctionnelle de celle-ci.

Aucune articulation interne n'est dessinée dans la plateforme :

```text
PLATFORM = single rigid body
```

---

## 3.2 `LONGERON`

Sous la plateforme se trouve un très grand contour quasi circulaire annoté **« longeron »**.

Interprétation 3D privilégiée :

- le cercle représente une **section transversale** ;
- le solide réel possède donc probablement une extension importante suivant `Y` ;
- l'axe principal du longeron est vraisemblablement approximativement parallèle à `Y` ;
- il peut être modélisé initialement comme un cylindre ou un flotteur tubulaire à section circulaire/arrondie ;
- ne pas le reconstruire comme une sphère.

Le longeron est situé immédiatement sous la plateforme et occupe la majeure partie de sa hauteur sous la zone centrale/gauche.

Relation mécanique recommandée :

```text
PLATFORM --FIXED--> LONGERON_SUPPORTS --FIXED--> LONGERON
```

Le croquis ne montre pas de liaison mobile entre le longeron et la plateforme.

---

## 3.3 Supports du longeron

Des jambes inclinées relient la plateforme à la périphérie du longeron.

On distingue des traits inclinés à gauche et à droite du grand cercle.

Interprétation :

- ce sont des supports, jambes, consoles ou cadres rigides ;
- ils maintiennent le longeron sous la plateforme ;
- les doubles lignes peuvent représenter les deux bords d'une même pièce épaisse plutôt que deux bielles indépendantes ;
- aucune articulation circulaire n'est explicitement dessinée au contact plateforme/support ou support/longeron ;
- ne pas ajouter de pivots sans information supplémentaire.

Pour une première reconstruction :

```text
PLATFORM + LONGERON_SUPPORTS + LONGERON = rigid composite assembly
```

---

# 4. Bras articulé supérieur

Le bras est un manipulateur série situé au-dessus de la plateforme et s'étendant vers la droite afin d'amener `BOX_1` au-dessus de `BOX_2`.

La géométrie générale est très proche d'un bras plan à plusieurs segments, auquel s'ajoute une rotation axiale du poignet.

---

## 4.1 `ARM_BASE_COLUMN`

Une colonne verticale est fixée sur la face supérieure de la plateforme.

Caractéristiques :

- orientation approximative `+Z` ;
- partie inférieure solidaire de la plateforme ;
- partie supérieure terminée par un cercle de grande taille représentant une articulation.

Relation :

```text
PLATFORM --FIXED--> ARM_BASE_COLUMN
```

Aucune rotation de tourelle autour de `Z` n'est explicitement représentée à la base de la colonne.

Donc :

```text
BASE_YAW = UNKNOWN / NOT OBSERVED
```

Ne pas l'ajouter comme degré de liberté certain.

---

## 4.2 Articulation `A1`

Au sommet de la colonne se trouve un cercle reliant l'embase au premier bras incliné.

Interprétation cinématique privilégiée :

```text
A1.type = REVOLUTE
A1.axis ≈ Y
```

Ainsi, le premier bras pivote principalement dans le plan `XZ` du croquis.

---

## 4.3 `ARM_LINK_1`

Premier segment mobile :

- part de `A1` ;
- monte vers la droite ;
- aboutit à l'articulation supérieure `A2` ;
- est dessiné par deux contours parallèles correspondant à l'épaisseur d'une seule pièce.

Dans la configuration dessinée :

```text
ΔX > 0
ΔZ > 0
```

---

## 4.4 Articulation `A2`

`A2` est le cercle situé au point le plus haut du bras.

```text
ARM_LINK_1 --A2--> ARM_LINK_2
A2.type = REVOLUTE
A2.axis ≈ Y
```

Cette articulation modifie l'angle entre les deux grands segments supérieurs.

---

## 4.5 `ARM_LINK_2`

Deuxième grand segment :

- part de `A2` ;
- descend vers la droite ;
- aboutit à `A3` ;
- possède une longueur importante ;
- doit être traité comme un seul corps rigide malgré ses doubles contours.

Configuration dessinée :

```text
ΔX > 0
ΔZ < 0
```

---

## 4.6 Articulation `A3`

Cercle situé à l'extrémité droite de `ARM_LINK_2`.

```text
ARM_LINK_2 --A3--> ARM_LINK_3
A3.type = REVOLUTE
A3.axis ≈ Y
```

---

## 4.7 `ARM_LINK_3`

Troisième segment articulé :

- part de `A3` ;
- descend vers la gauche ;
- arrive sur une articulation basse `A4` ;
- constitue le segment d'approche finale du poignet.

Configuration dessinée :

```text
ΔX < 0
ΔZ < 0
```

---

## 4.8 Articulation `A4`

Cercle entre `ARM_LINK_3` et le segment terminal vertical.

```text
ARM_LINK_3 --A4--> ARM_TERMINAL_LINK
A4.type = REVOLUTE
A4.axis ≈ Y
```

Cette liaison ajuste l'orientation du poignet dans le plan principal du bras.

---

## 4.9 `ARM_TERMINAL_LINK`

Segment terminal court et approximativement vertical.

Dans la configuration dessinée :

```text
axis ≈ -Z
```

Il relie `A4` au rotateur terminal `A5`.

---

## 4.10 Rotation terminale `A5`

Au bas du segment terminal, deux flèches courbes opposées sont dessinées autour d'une collerette/axe.

Ce symbole indique clairement une rotation axiale supplémentaire.

```text
A5.type = REVOLUTE
A5.axis = local longitudinal axis of ARM_TERMINAL_LINK
A5.axis ≈ Z in the drawn configuration
```

Cette rotation permet d'ajuster l'orientation azimutale de l'interface portée par le bras.

Le bras comporte donc au moins :

- quatre pivots de flexion `A1`, `A2`, `A3`, `A4` ;
- une rotation terminale axiale `A5`.

---

# 5. `BOX_1`

`BOX_1` est le petit volume rectangulaire immédiatement sous le rotateur terminal.

Relation mécanique :

```text
A5_OUTPUT --FIXED--> BOX_1
```

Le croquis ne montre pas de degré de liberté propre à `BOX_1`.

Fonction probable, mais non explicitement détaillée :

- demi-interface supérieure d'accouplement ;
- interface mécanique ;
- connecteur électrique ;
- ou combinaison des deux.

Le détail interne n'est pas visible.

---

# 6. `BOX_2`

`BOX_2` est un second volume rectangulaire placé au sommet du corps supérieur de la bouée.

Relation :

```text
BUOY_UPPER_NECK --FIXED--> BOX_2
```

Dans la configuration dessinée :

- `BOX_1` est juste au-dessus de `BOX_2` ;
- les deux sont approximativement coaxiales ;
- leurs faces d'accouplement semblent horizontales et parallèles ;
- un petit jeu vertical est dessiné entre les deux.

---

# 7. Liaison temporaire `BOX_1 <-> BOX_2`

Le croquis suggère une interface de docking entre les deux boîtes, mais ne montre pas le mécanisme interne de verrouillage.

Créer deux états :

```text
BOX_DOCK.state = OPEN | LOCKED
```

## État `OPEN`

```text
BOX_1 and BOX_2 are kinematically independent
```

Le bras peut positionner `BOX_1` par rapport à la bouée.

## État `LOCKED`

Une contrainte temporaire est créée entre `BOX_1` et `BOX_2`.

Modèle initial possible :

```text
BOX_1 <-> BOX_2 = DETACHABLE_FIXED_JOINT
```

mais le dessin ne permet pas d'affirmer qu'il s'agit réellement d'un encastrement parfait.

Autres possibilités compatibles avec le dessin :

- connecteur avec jeu ;
- verrouillage mécanique ;
- couplage magnétique ;
- connecteur électrique auto-alignant ;
- verrouillage autorisant une petite compliance.

---

# 8. Bouée

## 8.1 `BUOY_MAIN_BODY`

La bouée se trouve à droite de la plateforme.

Son axe principal est vertical.

```text
BUOY_AXIS ≈ Z
```

La forme visible est approximativement axisymétrique, mais le croquis étant une vue latérale, cette symétrie reste une interprétation 3D.

Géométrie visible de haut en bas :

1. un col supérieur vertical relativement étroit ;
2. un élargissement progressif vers une zone de grand diamètre ;
3. une zone périphérique large au niveau de la pince ;
4. une partie inférieure qui se resserre progressivement ;
5. une tige/corps inférieur vertical de plus petit diamètre, immergé.

Aucune articulation interne n'est dessinée dans la bouée.

Pour la maquette :

```text
BUOY_UPPER_NECK
BUOY_UPPER_FLARE
BUOY_CAPTURE_REGION
BUOY_LOWER_FLARE
BUOY_LOWER_STEM
```

peuvent être fusionnés dans un unique corps rigide `BUOY_MAIN_BODY` si l'on ne cherche pas à modéliser la structure interne.

---

## 8.2 `BUOY_UPPER_NECK`

La partie supérieure est un montant vertical qui porte `BOX_2`.

Elle doit offrir suffisamment de dégagement autour d'elle pour que le bras puisse approcher `BOX_1` sans collision avec :

- la plateforme ;
- le support de pince ;
- la pince ;
- l'épaulement large de la bouée.

---

## 8.3 Zone large de capture de la bouée

Au niveau de la pince, la bouée possède une zone de diamètre important.

Le dessin suggère un profil évasé de part et d'autre de cette zone.

Cette région constitue la cible mécanique naturelle de la pince.

Interprétation 3D recommandée :

```text
BUOY_CAPTURE_REGION = circumferential / annular capture zone
axis = Z
```

La géométrie exacte d'une gorge, d'une collerette ou d'un épaulement n'est cependant pas assez définie pour être affirmée.

---

# 9. Annotation de hauteur `3-4 m`

Une cote verticale `3-4 m` est dessinée entre le niveau de la plateforme et la zone supérieure de la bouée.

La lecture exacte des lignes d'attache n'est pas suffisamment précise pour déterminer si cette cote correspond :

- à la distance plateforme / sommet de la bouée ;
- à la distance plateforme / interface `BOX_2` ;
- ou à une plage de hauteur de travail du bras.

Pour le modèle, stocker cette information comme :

```text
VERTICAL_WORKING_SEPARATION ≈ 3 to 4 m
confidence = medium
```

Ne pas forcer une valeur unique sans plan coté supplémentaire.

---

# 10. Mécanisme inférieur de support de pince

La Solution 2 remplace le tripode par un montage directement rattaché au longeron.

Le sous-ensemble comprend :

- un bras porte-pince fixe, encastré dans le longeron ;
- une articulation basse `G4` reliant ce bras à la pince ;
- un levier solidaire de la pince mobile, portant `D2` dans la reconstruction ;
- un amortisseur incliné entre les rotules `D1` et `D2` ;
- une rotule `D1` fixée directement au longeron.

L’encastrement du bras et le rattachement de D1 au longeron sont des précisions de conception de l’utilisateur. Aucun support descendant séparément de la plateforme n’est nécessaire pour ces fixations.

---

# 11. Ancrages sur le longeron

Le longeron porte deux raccordements distincts :

```text
LONGERON --FIXED--> GRIPPER_CARRIER
LONGERON --D1(SPHERICAL)--> DAMPER
```

Le premier est une fixation rigide du bras porte-pince, sans degré de liberté relatif. Le second est la rotule fixe de l’amortisseur : son centre reste immobile par rapport au longeron, mais l’amortisseur est libre de changer d’orientation autour de ce centre.

Les anciennes variantes S-A (support dédié depuis la plateforme) et S-B (support commun) sont remplacées par cette définition. Dans l’animation, les deux ancrages sont placés sur la surface du longeron ; les positions et les détails de fixation sont illustratifs.

---

# 12. Encastrement du porte-pince — ancien repère `G1`

Le repère `G1` avait été attribué à un pivot supposé lors de la lecture du croquis. La précision de l’utilisateur établit un **encastrement** du bras porte-pince dans le longeron.

```text
LONGERON --FIXED--> GRIPPER_CARRIER
relative_dof = 0
G1_revolute_joint = ABSENT
```

Le bras ne bascule donc pas à cet endroit. Ne pas représenter une broche de pivot, une animation de rotation ou un curseur de commande G1.

---

# 13. `GRIPPER_CARRIER` et levier de pince

Le bras porte-pince descend depuis sa fixation rigide au longeron jusqu’au pivot inférieur `G4`. Il reste immobile par rapport au longeron dans toutes les étapes du cycle.

```text
GRIPPER_CARRIER = rigid body FIXED to LONGERON
GRIPPER_CARRIER --G4--> GRIPPER
```

Pour conserver le travail de l’amortisseur sur le mouvement de la pince, le petit levier portant `D2` appartient au solide `GRIPPER`, du côté mobile de G4, et non au bras fixe.

```text
D2_attachment FIXED relative to GRIPPER
```

Le levier tourne avec la pince autour de G4. Ce raccordement de D2 est retenu pour la reconstruction ; sa forme et sa position exactes ne sont pas cotées. Si D1 et D2 étaient tous deux portés par le bâti fixe, leur distance serait constante et l’amortisseur ne pourrait pas amortir cette inclinaison.

---

# 14. Amortisseur

Un élément incliné est explicitement dessiné et annoté **« rotules amortisseur »**.

Le composant présente :

- un corps plus large ;
- une tige plus fine ;
- une fixation à chaque extrémité ;
- une orientation oblique entre l'ancrage fixe supérieur et le levier mobile.

Interprétation :

```text
DAMPER.type = linear damper / spring-damper candidate
```

Le dessin confirme la présence d'un amortisseur, mais ne permet pas de savoir s'il contient également un ressort.

Donc :

```text
spring_component = UNKNOWN
hydraulic_damping = PLAUSIBLE
```

---

# 15. Rotules de l'amortisseur

L'annotation indique explicitement des **rotules**.

Définir :

```text
D1 = upper damper joint
D2 = lower damper joint
```

avec :

```text
D1.type = SPHERICAL preferred
D2.type = SPHERICAL preferred
```

Dans une simplification strictement 2D :

```text
D1.type = REVOLUTE(axis≈Y)
D2.type = REVOLUTE(axis≈Y)
```

mais une reconstruction 3D doit préférer des rotules, conformément à l'annotation du dessin.

Le rôle de ces rotules est de permettre à l’amortisseur de changer d’orientation lorsque la pince pivote autour de G4 ; le bras porte-pince reste fixe.

---

# 16. Géométrie cinématique de l’amortisseur

Le montage retenu est :

```text
LONGERON
    ├── FIXED --> GRIPPER_CARRIER --> G4(Y) --> GRIPPER + levier D2
    └── D1 : fixed-side spherical joint --> DAMPER --> D2 on GRIPPER
```

L’amortisseur relie D1, fixé au longeron, à D2, porté par la pince mobile.

Lorsque la pince tourne autour de G4 :

- le bras porte-pince, le centre de G4 et D1 restent fixes par rapport au longeron ;
- D2 suit la rotation de la pince ;
- la distance D1–D2 varie ;
- l’amortisseur s’allonge ou se comprime et change d’orientation ;
- les rotules permettent ce changement d’orientation.

Pour la reconstruction dans le plan XZ :

```text
G4_position = carrier_mount + (0, 0, -carrier_length)   [constant]
D1_position = fixed_longeron_anchor                   [constant]
D2_position = G4_position + R_Y(theta_G4) * gripper_lever
length_DAMPER = norm(D2_position - D1_position)
```

L’animation prescrit une oscillation décroissante de G4. Elle ne calcule pas de forces, de coefficient d’amortissement ou de dynamique de la bouée.

---

# 17. Articulation basse `G4`

À l'extrémité inférieure du porte-pince apparaît un cercle de grande taille reliant la pièce verticale à la pince.

Interprétation privilégiée :

```text
GRIPPER_CARRIER --G4--> GRIPPER
G4.type = REVOLUTE
G4.axis ≈ Y
```

Ce pivot peut permettre à la pince de s'orienter indépendamment du porte-pince pour suivre les mouvements relatifs de la bouée.

Une liaison plus libre de type cardan/rotule serait également possible en 3D, mais elle n'est pas explicitement démontrée par le croquis.

Donc :

```text
G4_2D = REVOLUTE
G4_3D_exact_type = UNKNOWN
```

---

# 18. Pince

La pièce annotée **« pince »** est un élément de grande dimension qui s'étend horizontalement autour de la zone large de la bouée.

Le croquis montre :

- une origine à gauche au niveau de `G4` ;
- un contour inférieur long et arrondi ;
- une extension jusqu'au côté droit de la bouée ;
- une géométrie qui semble encercler la bouée plutôt que la traverser ;
- une partie supérieure locale visible de part et d'autre de la bouée ;
- un élément vertical de verrouillage/commande près de la partie gauche de la pince.

La pince ne doit **pas** être reconstruite comme une simple barre traversant le corps de la bouée.

---

# 19. Nature 3D de la pince

La pince entoure la bouée en trois dimensions. Selon la précision antérieure de l’utilisateur, elle est constituée de **deux demi-pinces pivotantes** qui se referment angulairement comme un câlin.

```text
GRIPPER = two rigid circumferential half-jaws
closure = opposite rotations about a shared local vertical hinge
```

Cette charnière de fermeture est distincte de G4 : G4 incline l’ensemble de la pince dans le plan XZ ; la charnière ouvre et referme les deux demi-pinces autour de la bouée. Elle suit donc l’inclinaison de l’ensemble.

L’angle maximal illustratif de l’animation est de 65° par demi-pince. Le dessin seul ne définit ni cet angle, ni la motorisation, ni les détails du verrouillage. La pièce verticale locale de fonction inconnue reste distincte.

---

# 20. Diamètre de la pince

Une annotation placée à droite de la pince ressemble à :

```text
Ø ≈ 4 m
```

ou à une notation de diamètre équivalente.

La lecture manuscrite n'est pas totalement non ambiguë, mais la cote est clairement associée à la grande dimension transversale de la pince / zone de capture.

Stocker provisoirement :

```text
GRIPPER_CAPTURE_DIAMETER ≈ 4 m
confidence = medium
```

La valeur doit être validée avant toute fabrication ou modélisation dimensionnelle précise.

---

# 21. Élément vertical local sur la pince

Près de la partie gauche/centrale de la pince apparaît un petit élément vertical traversant ou chevauchant son contour.

Il comporte :

- une tête supérieure ;
- un corps vertical ;
- un prolongement inférieur en pointillé ou caché.

La fonction n'est pas explicitement annotée.

Interprétations possibles :

- pion de verrouillage ;
- axe de charnière ;
- vis ou vérin de serrage ;
- verrou mécanique escamotable ;
- capteur ou butée.

Donc :

```text
GRIPPER_LOCAL_VERTICAL_ELEMENT.function = UNKNOWN
```

Il doit être conservé dans la reconstruction comme composant distinct, sans lui attribuer arbitrairement une fonction précise.

---

# 22. Contact temporaire `GRIPPER <-> BUOY`

La pince agit sur la zone de grand diamètre de la bouée.

Il s'agit d'une liaison commutable.

## État libre

```text
GRIPPER_CAPTURE.state = OPEN
BUOY independent from PLATFORM
```

La bouée peut se déplacer sous l'effet :

- de la houle ;
- du vent ;
- de ses propres mouvements de corps flottant.

## État capturé

```text
GRIPPER_CAPTURE.state = ENGAGED
```

La pince entoure ou retient mécaniquement la zone large de la bouée.

Effets fonctionnels minimaux attendus :

- forte limitation de la translation latérale relative ;
- limitation de l'éloignement de la bouée par rapport au support ;
- maintien de la bouée dans la zone de travail du bras supérieur ;
- reprise d'une partie des efforts mécaniques avant le docking fin des boîtes.

Le croquis ne permet pas de déterminer exactement les degrés de liberté résiduels après capture.

Pour une première simulation :

```text
GRIPPER <-> BUOY_CAPTURE_REGION = DETACHABLE_CAPTURE_CONSTRAINT
```

et non nécessairement un encastrement parfait.

---

# 23. Rôle fonctionnel de l’amortisseur après capture

Le bras porte-pince est encastré au longeron. Cette fixation ne supprime pas la mobilité de la pince au pivot inférieur G4, conservé dans la reconstruction.

Après capture :

- la bouée est retenue par la pince ;
- la pince et son levier D2 peuvent s’incliner autour de G4 ;
- D1 reste fixé au longeron et l’amortisseur travaille entre D1 et D2 ;
- le bras porte-pince ne bouge pas par rapport au longeron.

Dans l’animation, le point de capture et l’inclinaison de la bouée suivent la pince ; sa rotation autour de son axe local reste libre. Les mobilités résiduelles exactes de la capture restent à préciser.

Le rôle dissipatif de l’amortisseur est représenté par un mouvement décroissant prescrit, sans simulation physique des efforts. Le choix de placer D2 sur la pince mobile est explicité au §13.

---

# 24. Ligne d'eau

Une ligne ondulée horizontale traverse la partie basse du dessin.

Elle représente la surface de l'eau.

Elle ne correspond à :

- aucune barre ;
- aucune liaison ;
- aucun câble ;
- aucun rail ;
- aucun composant mécanique.

Elle indique seulement que :

- le corps inférieur de la bouée est immergé ;
- la pince se trouve approximativement au voisinage de la ligne d'eau ;
- la plateforme et la majorité du mécanisme supérieur sont situées au-dessus de l'eau.

---

# 25. Relation fonctionnelle entre capture mécanique et `BOX_1/BOX_2`

Le croquis suggère deux niveaux de docking complémentaires.

## 25.1 Capture grossière

La pince de grand diamètre agit autour de la bouée.

Objectifs probables :

- capturer la bouée ;
- réduire son mouvement relatif ;
- l'empêcher de sortir de la zone de docking ;
- transmettre les efforts mécaniques principaux à la plateforme via le support amorti.

## 25.2 Accouplement fin

Le bras supérieur amène `BOX_1` sur `BOX_2`.

Objectifs probables :

- correction de position ;
- correction d'orientation ;
- mise en contact précise ;
- connexion mécanique et/ou électrique.

Condition géométrique avant verrouillage :

```text
centerline(BOX_1) ≈ centerline(BOX_2)
normal(face_BOX_1) ≈ -normal(face_BOX_2)
```

Le support amorti de pince doit donc conserver suffisamment de compliance ou de mobilité pour ne pas empêcher l'alignement fin réalisé par le bras.

---

# 26. Graphe cinématique synthétique

```text
WORLD
│
├── PLATFORM_ASSEMBLY
│   │
│   ├── PLATFORM
│   │
│   ├── LONGERON_SUPPORTS
│   │   └── FIXED relative to PLATFORM
│   │
│   ├── LONGERON
│   │   └── FIXED relative to PLATFORM_ASSEMBLY
│   │
│   ├── ARM_BASE_COLUMN
│   │   └── FIXED relative to PLATFORM
│   │       └── A1 : REVOLUTE(axis≈Y)
│   │           └── ARM_LINK_1
│   │               └── A2 : REVOLUTE(axis≈Y)
│   │                   └── ARM_LINK_2
│   │                       └── A3 : REVOLUTE(axis≈Y)
│   │                           └── ARM_LINK_3
│   │                               └── A4 : REVOLUTE(axis≈Y)
│   │                                   └── ARM_TERMINAL_LINK
│   │                                       └── A5 : REVOLUTE(local longitudinal axis)
│   │                                           └── BOX_1
│   │
│   └── LONGERON_ATTACHMENTS [FIXED relative to LONGERON]
│       ├── D1 : SPHERICAL, fixed-side damper joint on LONGERON
│       │   └── DAMPER
│       │       └── D2 : SPHERICAL, moving-side joint on GRIPPER
│       └── FIXED : carrier encastré in LONGERON, no G1 pivot
│           └── GRIPPER_CARRIER [fixed]
│               └── G4 : REVOLUTE(axis≈Y) [2D interpretation]
│                   └── GRIPPER + rigid lever carrying D2
│                       └── detachable capture with BUOY_CAPTURE_REGION
│
└── BUOY_ASSEMBLY
    │
    ├── BUOY_MAIN_BODY
    ├── BUOY_UPPER_NECK
    ├── BUOY_CAPTURE_REGION
    └── BOX_2
        └── all FIXED relative to BUOY_MAIN_BODY
```

Interfaces temporaires :

```text
GRIPPER <---- detachable capture ----> BUOY_CAPTURE_REGION
BOX_1  <---- detachable docking ----> BOX_2
```

---

# 27. Liste des articulations et symboles de mobilité visibles

Cette liste sert de contrôle pour ne pas oublier un cercle, une rotation ou une rotule.

## Bras supérieur

1. `A1` : cercle au sommet de l'embase du bras ;
2. `A2` : cercle au sommet de la chaîne ;
3. `A3` : cercle à droite de la chaîne ;
4. `A4` : cercle avant le segment terminal vertical ;
5. `A5` : rotation axiale indiquée par deux flèches courbes autour du poignet.

## Mécanisme de pince

6. `D1` : rotule/ancrage de l’amortisseur fixé au longeron ;
7. `D2` : rotule mobile rattachée au levier de la pince dans la reconstruction ;
8. fixation du porte-pince au longeron : encastrement, ancien repère G1 supprimé comme pivot ;
9. `G4` : articulation basse entre le porte-pince et la pince.

## Élément supplémentaire

10. petit élément vertical local sur la pince : présence visible mais fonction/articulation exacte inconnue.

Les deux interfaces temporaires sont :

```text
GRIPPER <-> BUOY_CAPTURE_REGION
BOX_1   <-> BOX_2
```

---

# 28. Éléments qui ne sont PAS automatiquement des articulations

Ne pas interpréter comme joints sans symbole explicite :

- les doubles contours des bras ;
- les doubles contours des supports du longeron ;
- le bord supérieur et inférieur de la plateforme ;
- le contour circulaire du longeron ;
- les points où un support touche graphiquement le contour du longeron ;
- les changements de pente du profil de la bouée ;
- les intersections entre la pince et le profil de la bouée dues à la projection ;
- la ligne d'eau ;
- les lignes de cote `5 m`, `3-4 m` et `Ø≈4 m` ;
- le contact apparent `BOX_1/BOX_2` tant que l'état `LOCKED` n'est pas activé.

---

# 29. Contraintes importantes pour une reconstruction 3D

## 29.1 Ne pas rendre l'ensemble entièrement plan

Doivent avoir une extension réelle suivant `Y` :

- plateforme ;
- longeron ;
- supports du longeron ;
- articulations du bras ;
- pince ;
- zone de capture de la bouée ;
- rotules de l'amortisseur.

---

## 29.2 Longeron

Le contour circulaire est une section.

```text
LONGERON.axis ≈ Y
```

ou, à défaut de certitude, doit au minimum être extrudé suivant `Y`.

---

## 29.3 Pince

La pince doit contourner la bouée.

Aucune géométrie rigide ne doit traverser le volume solide de `BUOY_MAIN_BODY`.

Prévoir un jeu radial pour :

- l'approche ;
- la fermeture ;
- le mouvement relatif ;
- l'absorption des tolérances.

---

## 29.4 Amortisseur

Les deux extrémités de l'amortisseur doivent rester libres en orientation via leurs rotules.

L'axe instantané de l'amortisseur est la droite reliant `D1` à `D2`.

Son modèle ne doit pas imposer une orientation fixe dans le bâti.

---

## 29.5 Bras supérieur

La chaîne `A1-A4` doit avoir suffisamment de débattement pour amener `BOX_1` :

- au-dessus de `BOX_2` ;
- coaxiale avec `BOX_2` ;
- jusqu'au contact ;
- sans collision avec la plateforme, la pince ou la bouée.

`A5` permet l'ajustement de rotation autour de l'axe terminal.

---

## 29.6 Mobilité de la bouée après capture

Le dessin ne montre pas un encastrement rigide direct entre la plateforme et la bouée.

Au contraire, la présence du mécanisme articulé amorti suggère qu'un mouvement relatif résiduel est possible.

Ne pas imposer automatiquement :

```text
PLATFORM rigidly fixed to BUOY
```

après capture par la pince.

---

# 30. Séquence fonctionnelle de docking recommandée

Cette séquence est une interprétation cohérente du système dessiné.

```text
STATE_0_FREE
    platform and buoy independent
    gripper open / disengaged
    BOX_1 away from BOX_2

STATE_1_APPROACH
    buoy enters capture region near the gripper
    articulated arm remains clear

STATE_2_COARSE_CAPTURE
    GRIPPER surrounds / engages BUOY_CAPTURE_REGION

STATE_3_CAPTURE_LOCK
    GRIPPER_CAPTURE constraint engaged

STATE_4_DAMPED_STABILIZATION
    GRIPPER_CARRIER stays FIXED to LONGERON
    relative motions drive GRIPPER around G4
    damper dissipates motion through D1-D2
    buoy remains retained but not necessarily rigidly fixed

STATE_5_ARM_APPROACH
    A1-A4 move BOX_1 toward BOX_2

STATE_6_FINE_ALIGNMENT
    A1-A4 correct position
    A5 corrects axial orientation

STATE_7_INTERFACE_CONTACT
    BOX_1 contacts BOX_2

STATE_8_DOCKED
    BOX_DOCK lock engaged
    gripper remains engaged if required
```

L'ordre exact des verrouillages n'est pas explicitement fourni par le croquis.

---

# 31. Matrice des liaisons

| Parent | Enfant | Type de liaison | Axe / DOF | Statut |
|---|---|---|---|---|
| PLATFORM | LONGERON_SUPPORTS | Encastrement | 0 DOF | visible/probable |
| LONGERON_SUPPORTS | LONGERON | Encastrement | 0 DOF | probable |
| PLATFORM | ARM_BASE_COLUMN | Encastrement | 0 DOF | visible |
| ARM_BASE_COLUMN | ARM_LINK_1 | Pivot `A1` | axe ≈ Y | visible |
| ARM_LINK_1 | ARM_LINK_2 | Pivot `A2` | axe ≈ Y | visible |
| ARM_LINK_2 | ARM_LINK_3 | Pivot `A3` | axe ≈ Y | visible |
| ARM_LINK_3 | ARM_TERMINAL_LINK | Pivot `A4` | axe ≈ Y | visible |
| ARM_TERMINAL_LINK | TOOL_ROTATOR | Pivot `A5` | axe longitudinal local | visible par flèches |
| TOOL_ROTATOR | BOX_1 | Encastrement | 0 DOF | probable |
| BUOY_MAIN_BODY | BOX_2 | Encastrement | 0 DOF | visible |
| LONGERON | GRIPPER_CARRIER | Encastrement | 0 DOF | précision utilisateur ; remplace G1 |
| LONGERON | DAMPER | Rotule `D1` | angulaire 3D | rotule annotée ; parent précisé par l’utilisateur |
| GRIPPER | DAMPER | Rotule `D2` | angulaire 3D | rotule annotée ; parent mobile retenu pour amortir G4 |
| GRIPPER_CARRIER | GRIPPER | Pivot `G4` | axe ≈ Y en 2D | visible, type 3D exact inconnu |
| GRIPPER | BUOY_CAPTURE_REGION | Capture désaccouplable | DOF résiduels inconnus | fonctionnellement suggéré |
| BOX_1 | BOX_2 | Liaison désaccouplable | DOF verrouillés inconnus | fonctionnellement suggéré |

---

# 32. Niveaux de certitude

## `CERTAIN_FROM_DRAWING`

- existence de la plateforme ;
- annotation `5 m` sur la plateforme ;
- existence du grand longeron sous la plateforme ;
- présence de supports entre plateforme et longeron ;
- existence du bras articulé supérieur ;
- quatre articulations circulaires `A1-A4` ;
- rotation terminale `A5` indiquée par des flèches ;
- présence de `BOX_1` ;
- présence de `BOX_2` ;
- existence de la bouée ;
- existence de la pince ;
- présence d'un mécanisme articulé de support de pince ;
- présence d'un amortisseur incliné ;
- annotation « rotules amortisseur » ;
- présence d'une articulation basse entre support et pince ;
- présence d'un petit élément vertical local sur la pince ;
- cote verticale manuscrite `3-4 m` ;
- annotation de diamètre proche de `4 m` au niveau de la pince ;
- présence de la ligne d'eau.

## `USER_CONFIRMED_DESIGN`

- bras porte-pince encastré directement dans le longeron, sans pivot G1 ;
- D1 fixé au longeron ;
- fermeture angulaire de deux demi-pinces comme un câlin.

Le placement de D2 sur la pince mobile est un **choix de reconstruction** pour conserver l’action de l’amortisseur sur G4 ; sa géométrie exacte reste à confirmer.

## `HIGH_CONFIDENCE_3D_INTERPRETATION`

- axes `A1-A4` approximativement perpendiculaires au plan du dessin ;
- longeron extrudé suivant `Y` ;
- pince entourant la bouée en 3D ;
- `BOX_1` et `BOX_2` constituant une interface d'accouplement ;
- rotules aux deux extrémités de l'amortisseur ;
- articulation inférieure G4 reliant le bras porte-pince fixe à la pince ;
- amortisseur reliant le longeron à la pince mobile dans la reconstruction.

## `PLAUSIBLE_BUT_NOT_PROVEN`

- `G4` est un pivot simple en 3D ;
- l'amortisseur est hydraulique ;
- l'amortisseur contient également un ressort ;
- la pince est un anneau ouvrant ;
- le petit élément vertical de la pince est un verrou ;
- le diamètre utile exact de la pince est de `4 m` ;
- la cote `3-4 m` correspond précisément à la distance plateforme / sommet de bouée ;
- la capture laisse un débattement permettant à la bouée de suivre la houle ;
- la pince reprend l'essentiel des efforts mécaniques pendant que les boîtes assurent l'accouplement fin.

---

# 33. Informations explicitement inconnues

Ne pas halluciner les paramètres suivants :

- largeur réelle suivant `Y` de la plateforme ;
- longueur suivant `Y` du longeron ;
- diamètre exact du longeron ;
- section exacte des bras ;
- matériaux ;
- masses ;
- centres de gravité ;
- limites angulaires `A1-A5` ;
- motorisation des articulations ;
- présence ou non d'une rotation de base autour de `Z` ;
- couple des actionneurs ;
- raideur de l'amortisseur ;
- coefficient d'amortissement ;
- course de l'amortisseur ;
- présence et raideur d'un ressort associé ;
- type exact de `G4` en 3D ;
- amplitude de débattement de la pince autour de G4 ;
- détails de la charnière et de la motorisation des deux demi-pinces ;
- géométrie exacte du levier D2 côté pince ;
- fonction du petit élément vertical sur la pince ;
- profil exact de la zone de capture de la bouée ;
- valeur exacte de la cote de diamètre manuscrite ;
- degré de liberté résiduel après capture ;
- nature exacte du verrouillage `BOX_1/BOX_2` ;
- rôle électrique exact des boîtes ;
- ordre réel des opérations de docking.

---

# 34. Modèle machine-oriented proposé

```yaml
system:
  name: "DOCKING_SOLUTION_2"

  frame:
    X: "drawing_right"
    Y: "out_of_drawing_plane"
    Z: "drawing_up"

  observed_dimensions:
    platform_length_m:
      value: 5
      confidence: medium_high
      note: "handwritten dimension on platform"

    vertical_working_separation_m:
      range: [3, 4]
      confidence: medium
      note: "exact attachment points of the dimension are ambiguous"

    gripper_capture_diameter_m:
      value: 4
      confidence: medium
      note: "handwritten diameter notation is not perfectly legible"

  rigid_bodies:
    - PLATFORM
    - LONGERON_SUPPORTS
    - LONGERON
    - ARM_BASE_COLUMN
    - ARM_LINK_1
    - ARM_LINK_2
    - ARM_LINK_3
    - ARM_TERMINAL_LINK
    - TOOL_ROTATOR
    - BOX_1
    - GRIPPER_CARRIER
    - GRIPPER
    - BUOY_MAIN_BODY
    - BOX_2

  compliant_or_variable_length_elements:
    - DAMPER

  permanent_joints:
    - parent: PLATFORM
      child: LONGERON_SUPPORTS
      type: FIXED
      confidence: high

    - parent: LONGERON_SUPPORTS
      child: LONGERON
      type: FIXED
      confidence: high

    - parent: PLATFORM
      child: ARM_BASE_COLUMN
      type: FIXED
      confidence: high

    - parent: ARM_BASE_COLUMN
      child: ARM_LINK_1
      id: A1
      type: REVOLUTE
      axis: Y
      confidence: high

    - parent: ARM_LINK_1
      child: ARM_LINK_2
      id: A2
      type: REVOLUTE
      axis: Y
      confidence: high

    - parent: ARM_LINK_2
      child: ARM_LINK_3
      id: A3
      type: REVOLUTE
      axis: Y
      confidence: high

    - parent: ARM_LINK_3
      child: ARM_TERMINAL_LINK
      id: A4
      type: REVOLUTE
      axis: Y
      confidence: high

    - parent: ARM_TERMINAL_LINK
      child: TOOL_ROTATOR
      id: A5
      type: REVOLUTE
      axis: LOCAL_LONGITUDINAL
      confidence: high

    - parent: TOOL_ROTATOR
      child: BOX_1
      type: FIXED
      confidence: medium_high

    - parent: BUOY_MAIN_BODY
      child: BOX_2
      type: FIXED
      confidence: high

    - parent: LONGERON
      child: GRIPPER_CARRIER
      type: FIXED
      confidence: user_confirmed
      note: "carrier encastré in longeron; former inferred G1 pivot removed"

    - parent: GRIPPER_CARRIER
      child: GRIPPER
      id: G4
      type: REVOLUTE
      axis: Y
      confidence: medium
      note: "2D interpretation; exact 3D joint could be more permissive"

  damper:
    body: DAMPER
    variable_length_axis: "line(D1,D2)"

    fixed_side_joint:
      id: D1
      parent: LONGERON
      type: SPHERICAL
      confidence: user_confirmed
      evidence: "drawing annotation: rotules amortisseur"

    moving_side_joint:
      id: D2
      parent: GRIPPER
      type: SPHERICAL
      confidence: reconstruction_choice
      note: "D2 on the moving gripper lever to damp G4; exact geometry unknown"
      evidence: "drawing annotation: rotules amortisseur"

    spring_present:
      value: UNKNOWN

    damping_present:
      value: true
      confidence: high

  gripper:
    geometry:
      preferred: CIRCUMFERENTIAL_OR_ANNULAR
      exact_architecture: TWO_ANGULAR_HALF_JAWS
      evidence: "user clarification: closing like a hug"

    local_vertical_component:
      present: true
      function: UNKNOWN

  temporary_constraints:
    - id: BUOY_CAPTURE
      body_a: GRIPPER
      body_b: BUOY_MAIN_BODY
      target_region: BUOY_CAPTURE_REGION
      states: [OPEN, ENGAGED]
      exact_locked_dof: UNKNOWN

    - id: BOX_DOCK
      body_a: BOX_1
      body_b: BOX_2
      states: [OPEN, LOCKED]
      preferred_initial_model_when_locked: FIXED
      exact_locked_dof: UNKNOWN

  geometric_constraints:
    - "LONGERON must be modeled as a 3D elongated body, not a sphere"
    - "GRIPPER must surround or engage BUOY_CAPTURE_REGION without penetrating BUOY_MAIN_BODY"
    - "DAMPER endpoints must allow angular misalignment through spherical joints"
    - "GRIPPER_CARRIER stays fixed to LONGERON; no G1 rotation"
    - "D1 stays fixed to LONGERON; D2 follows GRIPPER around G4"
    - "GRIPPER motion around G4 must be compatible with DAMPER stroke"
    - "BOX_1 must be reachable and alignable with BOX_2"
    - "BOX_1 and BOX_2 docking normals must oppose each other at contact"
    - "BUOY remains an independent rigid body before capture"
    - "Water line is environmental geometry only"
```

---

# 35. Contrôle final : éléments à ne pas omettre lors d'une reconstruction

Après inspection du croquis de la Solution 2, les points suivants sont essentiels :

1. **La plateforme est annotée à environ 5 m** et constitue le bâti principal.
2. **Le grand cercle sous la plateforme est explicitement annoté « longeron »** ; il doit être compris comme un volume 3D allongé, pas comme une boule.
3. **Le longeron est maintenu par des supports inclinés** qui font partie de la structure fixe.
4. **Le bras supérieur possède quatre articulations circulaires distinctes `A1-A4`**.
5. **La rotation `A5` est un degré de liberté différent**, clairement indiqué par les flèches autour du poignet.
6. **`BOX_1` est portée par le bras et `BOX_2` par la bouée** ; elles restent deux pièces séparées avant docking.
7. **La Solution 2 ne montre pas de tripode** : le mécanisme inférieur est un support de pince articulé et amorti situé sur le côté du longeron.
8. **Un amortisseur incliné est clairement dessiné**.
9. **Le texte « rotules amortisseur » impose de conserver des liaisons angulaires aux deux extrémités de l'amortisseur**.
10. **Le bras porte-pince est encastré dans le longeron** : aucun pivot G1 n’est retenu après la précision de l’utilisateur.
11. **D1 est fixé au longeron ; D2 est rattaché au levier de la pince mobile dans la reconstruction**, afin d’amortir son inclinaison en G4.
12. **Une articulation basse relie le porte-pince à la pince**.
13. **La pince est une structure distincte de la bouée**.
14. **La pince doit entourer la bouée en 3D** et ne doit pas traverser sa matière malgré la superposition 2D.
15. **Un petit élément vertical est dessiné sur la pince** et doit être conservé, même si sa fonction exacte reste inconnue.
16. **La bouée possède une large zone de capture près de la ligne d'eau**.
17. **Une cote de diamètre proche de 4 m est associée à cette grande zone/pince**, mais doit être validée.
18. **Une cote verticale de 3-4 m est dessinée entre la plateforme et la zone supérieure de la bouée**, sans définition assez précise des points de référence.
19. **La ligne ondulée est la ligne d'eau**, pas une pièce mécanique.
20. **La capture par la pince et l'accouplement `BOX_1/BOX_2` sont deux interfaces temporaires distinctes**.
21. **La présence de l'amortisseur suggère une liaison non parfaitement rigide entre la bouée capturée et la plateforme** ; ne pas supprimer cette mobilité sans justification.
22. **Aucun symbole ne justifie une rotation de tourelle de l'embase du bras autour de `Z`**.
23. **Deux demi-pinces se referment angulairement comme un câlin**, selon la précision de l’utilisateur ; motorisation et verrouillage exacts restent inconnus.
24. **Aucun détail ne permet de déterminer la fonction précise du petit pion/actionneur vertical dessiné sur la pince**.
25. **La largeur suivant `Y` de toutes les pièces doit être définie comme paramètre de conception**, car elle n'est pas fournie par la projection.

---

# 36. Résumé minimal à transmettre à un générateur 3D

Créer une plateforme rigide horizontale d'environ 5 m portant sous elle un grand longeron cylindrique/tubulaire vu en section et maintenu par des supports inclinés. Sur la plateforme est fixé un bras série à quatre pivots coplanaires `A1-A4`, terminé par une rotation axiale `A5` portant `BOX_1`. À droite et sous le longeron, un bras porte-pince est encastré directement dans le longeron. La rotule D1 est fixée au longeron. Le pivot inférieur G4 permet à la pince de s’incliner ; son levier porte D2 dans la reconstruction. L’amortisseur muni de rotules relie D1 à D2 et travaille sur cette inclinaison. Aucun pivot G1 n’est ajouté à la fixation du bras. Le porte-pince descend jusqu'à une articulation basse portant une grande pince annulaire ou circumférentielle. Cette pince à deux demi-pinces se refermant angulairement comme un câlin doit entourer et retenir la zone large d’une bouée indépendante, approximativement au voisinage de la ligne d'eau. La bouée possède un col supérieur portant `BOX_2`. Après capture grossière de la bouée par la pince, le bras doit pouvoir amener `BOX_1` en position et orientation d'accouplement avec `BOX_2`. Les contacts `GRIPPER/BUOY` et `BOX_1/BOX_2` sont temporaires et désaccouplables. Ne pas transformer les superpositions 2D en pénétrations de matière, conserver la mobilité du support amorti, et ne pas inventer les degrés de liberté ou actionneurs non explicitement dessinés.
