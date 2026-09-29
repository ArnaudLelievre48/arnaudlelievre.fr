# Spécification cinématique et géométrique du mécanisme de docking
## Extraction détaillée à partir du croquis fourni

> **But du document** : fournir à un modèle de génération/reconstruction 3D une description aussi non ambiguë que possible des corps rigides, articulations, degrés de liberté, contacts, occultations et incertitudes visibles sur le croquis.
>
> **Important** : le dessin est une **projection 2D d'un mécanisme destiné à être tridimensionnel**. Un croisement de traits dans le dessin ne crée pas automatiquement une liaison. Les éléments dessinés derrière d'autres éléments, en pointillé ou superposés doivent être interprétés comme des éléments 3D occultés/projetés.

---

# 1. Convention de repère

Utiliser le repère global suivant :

- `X` : horizontal dans le plan du dessin, positif vers la droite.
- `Z` : vertical dans le plan du dessin, positif vers le haut.
- `Y` : perpendiculaire au dessin, positif vers l'observateur.

Le croquis doit être compris comme une vue latérale/projetée dans le plan `XZ`.

Conséquences :

1. les distances et positions suivant `Y` ne sont pas directement données ;
2. plusieurs pièces qui semblent se superposer peuvent être décalées suivant `Y` ;
3. les éléments du « tripode » ne doivent pas être reconstruits tous dans le même plan ;
4. la collerette de la bouée et les éléments de pince doivent avoir une extension réelle suivant `Y` ;
5. les doubles traits entourant une bielle/bras représentent en général l'épaisseur d'**une seule pièce**, pas deux pièces distinctes.

---

# 2. Inventaire des sous-ensembles

Le système visible contient au minimum quatre sous-ensembles fonctionnels :

1. `PLATFORM_ASSEMBLY`
   - plateforme principale ;
   - longeron cylindrique situé sous la partie gauche ;
   - entretoises/supports entre plateforme et longeron.

2. `ARTICULATED_ARM`
   - embase verticale ;
   - chaîne série de bras articulés ;
   - poignet terminal rotatif ;
   - `BOX_1`, portée par le bras.

3. `TRIPOD_GRIPPER_ASSEMBLY`
   - mécanisme suspendu sous la plateforme ;
   - trois directions/branches correspondant au « tripode », dont certaines sont vues en projection ou occultées ;
   - élément central vertical ;
   - pince inférieure venant saisir la bouée.

4. `BUOY_ASSEMBLY`
   - corps principal de la bouée ;
   - épaulement/collerette de préhension ;
   - col/partie supérieure ;
   - `BOX_2`, fixée sur le sommet de la bouée.

La bouée est **un corps flottant indépendant** de la plateforme tant qu'aucun verrouillage n'est engagé.

---

# 3. Sous-ensemble plateforme

## 3.1 `PLATFORM`

La plateforme est un corps rigide principal, horizontal sur le dessin.

Géométrie visible :

- forme générale : poutre/plaque rectangulaire longue et mince ;
- axe principal approximativement parallèle à `X` ;
- faible épaisseur suivant `Z` ;
- largeur réelle suivant `Y` non représentée ;
- elle sert de bâti commun au bras supérieur et au mécanisme inférieur.

Aucune articulation interne n'est dessinée dans la plateforme : elle doit être modélisée comme un seul corps rigide.

---

## 3.2 `LONGERON`

Sous la partie gauche de la plateforme apparaît un grand cercle annoté **« longeron »**.

Interprétation 3D la plus cohérente :

- le cercle représente la **section transversale d'un élément cylindrique** ;
- son axe est donc probablement approximativement parallèle à `Y`, donc sortant du plan du dessin ;
- il peut représenter un flotteur cylindrique, un longeron tubulaire ou un élément structurel longitudinal vu en bout ;
- il ne doit pas être reconstruit comme une sphère.

Liaison avec la plateforme :

- `LONGERON` est considéré comme **rigidement solidaire** de `PLATFORM` ;
- aucune articulation relative n'est indiquée.

---

## 3.3 Supports entre `PLATFORM` et `LONGERON`

Le dessin montre plusieurs traits verticaux/inclinés entre le dessous de la plateforme et la périphérie supérieure du longeron.

Ils ne doivent pas être ignorés.

Interprétation :

- ce sont des **entretoises, jambes ou consoles structurelles** ;
- elles maintiennent une distance verticale entre la plateforme et le longeron ;
- elles semblent former au moins une géométrie triangulée ;
- elles sont rigidement attachées à la plateforme et au longeron ;
- aucune articulation circulaire n'est dessinée à leurs extrémités, donc ne pas ajouter de pivots.

Dans une maquette fonctionnelle :

```text
PLATFORM --FIXED--> SUPPORT_STRUTS --FIXED--> LONGERON
```

ou, de manière équivalente, considérer l'ensemble comme un seul corps rigide composite.

---

# 4. Bras articulé supérieur

Le bras est un manipulateur série situé au-dessus de la plateforme et à droite de sa zone centrale.

## 4.1 `ARM_BASE_COLUMN`

Une colonne verticale courte part de la face supérieure de la plateforme.

Caractéristiques :

- orientation approximative `+Z` ;
- partie inférieure fixée rigidement à la plateforme ;
- partie supérieure terminée par un cercle représentant une articulation.

Liaison :

```text
PLATFORM --FIXED--> ARM_BASE_COLUMN
```

Aucune rotation d'embase autour de `Z` n'est explicitement dessinée.

**Ne pas inventer automatiquement une tourelle de rotation à la base.**

Une rotation d'embase suivant `Z` peut être ajoutée ultérieurement si le système réel l'exige, mais elle appartient à la catégorie `UNKNOWN/OPTIONAL`, pas `OBSERVED`.

---

## 4.2 Articulation `A1`

Au sommet de `ARM_BASE_COLUMN` se trouve un cercle.

Interprétation certaine :

- articulation entre l'embase et le premier segment mobile.

Interprétation cinématique privilégiée :

```text
A1.type = REVOLUTE
A1.axis ≈ +Y
```

Donc `ARM_LINK_1` pivote principalement dans le plan `XZ`.

---

## 4.3 `ARM_LINK_1`

Segment rigide allant de `A1` vers le haut et vers la droite.

Le segment est dessiné avec deux lignes parallèles :

- ces deux lignes sont les deux bords d'une seule pièce ;
- ne pas créer deux bielles parallèles indépendantes.

Orientation au repos sur le croquis :

```text
ΔX > 0
ΔZ > 0
```

Son extrémité supérieure arrive sur `A2`.

---

## 4.4 Articulation `A2`

Cercle situé au point le plus haut de la chaîne articulée.

```text
ARM_LINK_1 --A2--> ARM_LINK_2
A2.type = REVOLUTE
A2.axis ≈ +Y
```

La rotation permet de modifier l'angle entre `ARM_LINK_1` et `ARM_LINK_2`.

---

## 4.5 `ARM_LINK_2`

Segment rigide allant de `A2` vers la droite et vers le bas.

```text
ΔX > 0
ΔZ < 0
```

Il est également dessiné par deux contours parallèles et doit être traité comme un seul solide.

---

## 4.6 Articulation `A3`

Cercle situé à l'extrémité droite de `ARM_LINK_2`.

```text
ARM_LINK_2 --A3--> ARM_LINK_3
A3.type = REVOLUTE
A3.axis ≈ +Y
```

---

## 4.7 `ARM_LINK_3`

Segment rigide descendant depuis `A3` vers la gauche.

```text
ΔX < 0
ΔZ < 0
```

Il arrive sur l'articulation `A4`, située approximativement à la hauteur de la plateforme mais à droite de celle-ci.

---

## 4.8 Articulation `A4`

Cercle clairement visible entre `ARM_LINK_3` et le segment terminal vertical.

```text
ARM_LINK_3 --A4--> ARM_TERMINAL_LINK
A4.type = REVOLUTE
A4.axis ≈ +Y
```

Cette articulation commande l'orientation du segment terminal dans le plan principal du bras.

---

## 4.9 `ARM_TERMINAL_LINK`

Segment court approximativement vertical descendant depuis `A4`.

Il constitue le dernier segment structurel avant le poignet rotatif.

Orientation dans la configuration dessinée :

```text
axis ≈ -Z
```

---

## 4.10 Rotation terminale `A5`

Au bas du segment terminal apparaissent deux flèches courbes opposées entourant la tige.

Ce symbole ne doit pas être confondu avec `A4`.

Il indique une **rotation axiale supplémentaire du poignet terminal**.

Interprétation :

```text
A5.type = REVOLUTE
A5.axis = longitudinal axis of ARM_TERMINAL_LINK
A5.axis ≈ Z in the drawn configuration
```

Cette liaison permet à l'organe terminal et à `BOX_1` de tourner autour de l'axe vertical/local de l'outil.

Le bras comporte donc au moins :

- 4 pivots de flexion clairement matérialisés par des cercles : `A1`, `A2`, `A3`, `A4`;
- 1 rotation terminale matérialisée par les flèches : `A5`.

---

# 5. `BOX_1`

`BOX_1` est un petit volume rectangulaire situé immédiatement sous le poignet `A5`.

Relation mécanique :

```text
A5_OUTPUT --FIXED--> BOX_1
```

Autrement dit :

- `BOX_1` est portée par l'effecteur ;
- elle tourne avec la sortie de `A5`;
- elle n'est pas articulée indépendamment dans le dessin.

Fonction probable :

- demi-interface supérieure d'accouplement ;
- interface mécanique et/ou électrique ;
- connecteur amené par le bras jusqu'à `BOX_2`.

Le détail interne de `BOX_1` n'est pas visible.

---

# 6. `BOX_2`

`BOX_2` est un volume rectangulaire situé au sommet de la bouée.

Relation mécanique :

```text
BUOY_UPPER_NECK --FIXED--> BOX_2
```

`BOX_2` ne doit pas être rendue mobile indépendamment de la bouée.

Dans la configuration dessinée :

- `BOX_1` est juste au-dessus de `BOX_2`;
- les deux sont approximativement coaxiales ;
- leurs faces d'accouplement sont parallèles ;
- un petit intervalle peut être présent sur le dessin.

---

# 7. Liaison temporaire `BOX_1 <-> BOX_2`

Il ne s'agit pas d'une liaison permanente.

Créer deux états :

```text
DOCK_INTERFACE.state = OPEN | LOCKED
```

## État `OPEN`

```text
BOX_1` et `BOX_2` sont cinématiquement indépendantes.
```

Le bras peut déplacer `BOX_1` librement.

## État `LOCKED`

Une contrainte temporaire est créée entre les deux boîtes.

Le dessin ne permet pas de déterminer exactement le nombre de degrés de liberté supprimés.

Pour une première maquette fonctionnelle, l'approximation la plus simple est :

```text
BOX_1 <-> BOX_2 = DETACHABLE_FIXED_JOINT
```

mais ceci doit être marqué comme une **hypothèse de modélisation**, pas comme une information certaine du croquis.

Possibilités réelles non discriminées par le dessin :

- verrouillage mécanique rigide ;
- liaison magnétique ;
- connecteur électrique auto-alignant ;
- verrouillage avec faible jeu ;
- couplage autorisant une petite rotation ;
- combinaison de plusieurs mécanismes.

---

# 8. Bouée

## 8.1 `BUOY_MAIN_BODY`

La bouée est un corps flottant séparé de la plateforme.

Forme visible en coupe/projection :

1. partie inférieure verticale et étroite ;
2. élargissement progressif en remontant ;
3. zone centrale/haute très large ;
4. partie supérieure se resserrant vers un col vertical ;
5. `BOX_2` posée sur le sommet du col.

Le corps semble approximativement de révolution autour d'un axe vertical.

Pour une reconstruction initiale, utiliser :

```text
BUOY_AXIS ≈ Z
```

Le dessin ne montre aucune articulation interne à la bouée :

```text
BUOY_MAIN_BODY
BUOY_SHOULDER
BUOY_COLLAR
BUOY_UPPER_NECK
BOX_2
```

peuvent être traités comme un seul assemblage rigide.

---

# 9. Collerette / épaulement de préhension de la bouée

Une zone large et quasi horizontale traverse la partie supérieure de la bouée, au niveau où vient la pince.

Il faut la comprendre comme une **géométrie 3D périphérique** et non comme une barre qui traverse le corps.

Interprétation recommandée :

```text
BUOY_COLLAR = annular / circumferential flange
axis = Z
```

Elle offre :

- une surface inférieure potentiellement saisissable ;
- un bord externe pouvant être encerclé ou retenu ;
- un épaulement empêchant l'extraction verticale lorsque la pince est engagée.

La pince dessinée vient au voisinage immédiat de cette collerette.

---

# 10. Ligne d'eau

Une ligne ondulée horizontale traverse le dessin.

Elle représente la surface de l'eau.

Elle ne correspond à :

- aucune barre ;
- aucune liaison ;
- aucun câble ;
- aucun composant mécanique.

Elle sert uniquement à indiquer que :

- une partie de la bouée est immergée ;
- une partie de la pince se situe approximativement au voisinage de la surface ;
- la plateforme est au-dessus de cette ligne.

---

# 11. Mécanisme « tripode » sous la plateforme

Cette zone doit être reconstruite avec particulièrement de prudence car la projection 2D superpose plusieurs pièces.

Le mot **« tripode »** apparaît explicitement.

Le dessin contient :

- deux articulations supérieures pleines clairement visibles, gauche et droite ;
- une articulation supérieure centrale en pointillé/partiellement occultée ;
- deux articulations inférieures pleines clairement visibles, gauche et droite ;
- une articulation inférieure centrale en pointillé/partiellement occultée ;
- deux grandes branches diagonales visibles ;
- un élément central vertical ;
- un prolongement inférieur vers la pince.

Cette présence de points centraux en pointillé est importante : **ils ne doivent pas être supprimés de l'interprétation**.

---

# 12. Articulations supérieures du tripode

Définir :

```text
T_UP_1
T_UP_2
T_UP_3
```

avec trois zones d'ancrage autour de l'axe du mécanisme.

Dans la projection :

- `T_UP_1` = articulation supérieure gauche, cercle plein ;
- `T_UP_2` = articulation supérieure droite, cercle plein ;
- `T_UP_3` = articulation supérieure centrale/arrière, cercle pointillé ou occulté.

Les trois ne sont probablement pas réellement colinéaires en 3D.

Interprétation spatiale probable :

- trois points distribués autour d'un axe vertical ;
- azimuts approximativement séparés de `120°` si le terme « tripode » est littéral ;
- la projection 2D ramène la branche arrière/avant vers l'axe central.

### Type de liaison

Le symbole 2D ressemble à un pivot, mais un véritable tripode spatial nécessite généralement plus de liberté angulaire.

Hiérarchie d'interprétation :

```text
OBSERVED_2D:
    circular joint symbols

3D_PREFERRED:
    SPHERICAL or UNIVERSAL joint at each branch end

2D_SIMPLIFICATION:
    REVOLUTE(axis≈Y)
```

Pour une maquette 3D fonctionnelle, utiliser de préférence rotules ou cardans, faute d'information supplémentaire.

---

# 13. Branches du tripode

## Branche gauche `TRIPOD_LINK_1`

Bielle inclinée :

```text
T_UP_1 -> T_LOW_1
ΔX > 0
ΔZ < 0
```

Elle est rigide.

## Branche droite `TRIPOD_LINK_2`

Bielle inclinée :

```text
T_UP_2 -> T_LOW_2
ΔX < 0
ΔZ < 0
```

Elle est rigide.

## Branche centrale / arrière `TRIPOD_LINK_3`

Le dessin indique une troisième direction par :

- un cercle supérieur central en pointillé ;
- un cercle inférieur central en pointillé ;
- un élément vertical central superposé à la projection.

Deux interprétations restent possibles :

### Hypothèse T3-A — troisième branche du tripode

Le composant central est la troisième branche, vue presque alignée avec l'axe de projection :

```text
T_UP_3 -> TRIPOD_LINK_3 -> T_LOW_3
```

Cette interprétation est très cohérente avec le mot « tripode ».

### Hypothèse T3-B — guide central + deux branches visibles + troisième branche occultée

L'élément vertical central est un guide/coulisseau indépendant et la troisième bielle du tripode est entièrement ou presque entièrement occultée.

Le croquis seul ne permet pas de trancher définitivement.

**Pour la reconstruction, ne fusionner ces deux concepts qu'après validation du mécanisme réel.**

---

# 14. Articulations inférieures du tripode

Définir :

```text
T_LOW_1
T_LOW_2
T_LOW_3
```

- `T_LOW_1` : cercle plein inférieur gauche ;
- `T_LOW_2` : cercle plein inférieur droit ;
- `T_LOW_3` : cercle central pointillé/occulté.

Ces articulations connectent les branches à l'ensemble central mobile / support de pince.

Type recommandé pour reconstruction 3D :

```text
SPHERICAL or UNIVERSAL
```

Type minimal compatible avec la projection 2D :

```text
REVOLUTE(axis≈Y)
```

---

# 15. Élément central vertical sous le tripode

Un élément étroit vertical apparaît au centre du tripode.

Il commence sous la plateforme et descend jusqu'à la zone des articulations inférieures, puis la structure se prolonge encore vers la pince.

La géométrie suggère fortement un des cas suivants :

1. **coulisseau vertical / tige guidée** ;
2. **mât porteur de pince** ;
3. **troisième branche du tripode vue de face** ;
4. combinaison d'un guide central et d'une branche arrière occultée.

Le dessin ne fournit pas de symbole explicite de glissière.

Donc :

```text
CENTRAL_VERTICAL_PRISMATIC_JOINT = POSSIBLE, NOT CERTAIN
```

Ne pas présenter la translation verticale comme une liaison certaine.

Cependant, pour une maquette fonctionnelle de capture, un guide vertical de la pince est mécaniquement plausible.

---

# 16. Ensemble de pince

La pince est attachée à la partie inférieure du mécanisme central.

Géométrie visible :

- descente verticale depuis le mécanisme tripode ;
- coude progressif vers la droite ;
- longue branche presque horizontale passant au niveau de la collerette de la bouée ;
- extrémité droite arrondie ;
- doubles traits indiquant une pièce de section non nulle.

Le trait horizontal qui semble « traverser » la bouée **ne signifie pas que la pièce traverse physiquement la matière de la bouée**.

C'est une conséquence de la projection.

En 3D, la pince doit :

- contourner la bouée ;
- passer sous ou autour de sa collerette ;
- avoir un dégagement radial compatible avec le diamètre de la bouée.

---

# 17. Nature de la pince en 3D

Le dessin ne montre pas explicitement tous les mors.

Trois possibilités compatibles avec la projection :

1. un unique crochet annulaire/partiellement annulaire ;
2. deux mors opposés dont un seul est clairement visible en projection ;
3. plusieurs bras de préhension répartis autour de la bouée.

Ne pas convertir automatiquement la barre horizontale en une tige traversant le centre.

Pour obtenir une capture stable en 3D, la solution la plus cohérente est :

```text
GRIPPER = circumferential or multi-jaw capture mechanism
target = BUOY_COLLAR
```

---

# 18. Liaison temporaire `GRIPPER <-> BUOY_COLLAR`

Il s'agit d'une liaison d'état, pas d'une liaison permanente.

## État libre

```text
GRIPPER_CONTACT = OPEN
BUOY independent from PLATFORM
```

La bouée peut se déplacer indépendamment sous l'effet des vagues, du vent et de son propre mouvement.

## État capturé

```text
GRIPPER_CONTACT = ENGAGED
```

La pince vient mécaniquement retenir la collerette.

Effets minimaux attendus :

- limitation forte de la translation latérale relative ;
- impossibilité ou forte limitation de l'extraction verticale dans la direction verrouillée ;
- recentrage de la bouée par rapport à la plateforme.

Le croquis ne permet pas de déterminer si la capture :

- bloque les six degrés de liberté ;
- autorise la rotation autour de `Z` ;
- autorise un débattement angulaire ;
- conserve du jeu radial ;
- comporte une compliance élastique.

Pour une première maquette :

```text
GRIPPER <-> BUOY_COLLAR = DETACHABLE_CAPTURE_CONSTRAINT
```

et non nécessairement `FIXED`.

---

# 19. Relation fonctionnelle entre pince et interface `BOX_1/BOX_2`

Le dessin suggère deux niveaux de docking complémentaires :

### Capture grossière

La pince agit sur la grande collerette de la bouée.

Objectifs probables :

- attraper la bouée ;
- limiter son déplacement relatif ;
- recentrer ou stabiliser sa position ;
- reprendre une partie importante des efforts mécaniques.

### Accouplement fin

Le bras amène `BOX_1` sur `BOX_2`.

Objectifs probables :

- alignement local précis ;
- verrouillage secondaire ;
- connexion mécanique et/ou électrique.

La géométrie doit donc permettre, une fois la bouée capturée, que :

```text
centerline(BOX_1) ≈ centerline(BOX_2)
normal(face_BOX_1) ≈ -normal(face_BOX_2)
```

avant verrouillage.

---

# 20. Graphe cinématique synthétique

```text
WORLD
│
├── PLATFORM_ASSEMBLY
│   │
│   ├── PLATFORM
│   │
│   ├── SUPPORT_STRUTS_TO_LONGERON
│   │   └── FIXED
│   │
│   ├── LONGERON
│   │   └── FIXED relative to PLATFORM
│   │
│   ├── ARM_BASE_COLUMN
│   │   └── FIXED relative to PLATFORM
│   │
│   │   └── A1 : REVOLUTE(axis≈Y)
│   │       └── ARM_LINK_1
│   │           └── A2 : REVOLUTE(axis≈Y)
│   │               └── ARM_LINK_2
│   │                   └── A3 : REVOLUTE(axis≈Y)
│   │                       └── ARM_LINK_3
│   │                           └── A4 : REVOLUTE(axis≈Y)
│   │                               └── ARM_TERMINAL_LINK
│   │                                   └── A5 : REVOLUTE(axis≈local longitudinal axis)
│   │                                       └── BOX_1
│   │
│   └── TRIPOD_GRIPPER_ASSEMBLY
│       │
│       ├── T_UP_1
│       │   └── TRIPOD_LINK_1
│       │       └── T_LOW_1
│       │
│       ├── T_UP_2
│       │   └── TRIPOD_LINK_2
│       │       └── T_LOW_2
│       │
│       ├── T_UP_3 [partially hidden / dashed]
│       │   └── TRIPOD_LINK_3 or hidden branch
│       │       └── T_LOW_3 [partially hidden / dashed]
│       │
│       ├── CENTRAL_VERTICAL_MEMBER
│       │   └── possible vertical guide / structural mast
│       │
│       └── GRIPPER
│           └── detachable capture with BUOY_COLLAR
│
└── BUOY_ASSEMBLY
    │
    ├── BUOY_MAIN_BODY
    ├── BUOY_COLLAR
    ├── BUOY_UPPER_NECK
    └── BOX_2
        └── all FIXED relative to BUOY_MAIN_BODY
```

Interfaces temporaires :

```text
GRIPPER  <---- detachable capture ----> BUOY_COLLAR
BOX_1    <---- detachable docking ----> BOX_2
```

---

# 21. Liste exhaustive des symboles d'articulation visibles

Cette liste sert de contrôle pour éviter d'oublier un cercle ou symbole du dessin.

## Bras supérieur

1. `A1` : cercle au sommet de l'embase du bras.
2. `A2` : cercle au sommet du bras.
3. `A3` : cercle sur l'articulation droite haute/médiane.
4. `A4` : cercle sur l'articulation droite basse, au début du segment terminal.
5. `A5` : pas un cercle de pivot classique ; rotation indiquée par deux flèches courbes autour de l'axe terminal.

## Tripode

6. `T_UP_1` : cercle supérieur gauche.
7. `T_UP_2` : cercle supérieur droit.
8. `T_UP_3` : cercle supérieur central en pointillé/occulté.
9. `T_LOW_1` : cercle inférieur gauche.
10. `T_LOW_2` : cercle inférieur droit.
11. `T_LOW_3` : cercle inférieur central en pointillé/occulté.

Total de symboles de liaison/interfaçage explicitement perceptibles :

```text
4 pivots circulaires du bras
+ 1 rotation axiale terminale
+ 6 articulations du tripode, dont 2 occultées/pointillées
= 11 indications d'articulation ou de rotation
```

À cela s'ajoutent les **deux interfaces temporaires** :

```text
BOX_1 <-> BOX_2
GRIPPER <-> BUOY_COLLAR
```

---

# 22. Éléments qui ne sont PAS des articulations

Ne pas interpréter comme joints :

- les doubles contours des bras ;
- le bord supérieur/inférieur de la plateforme ;
- les supports du longeron ;
- la ligne d'eau ;
- les intersections de traits dues à la projection ;
- le contour de la bouée ;
- la ligne horizontale de la pince superposée graphiquement à la bouée ;
- les changements de largeur de la bouée ;
- les limites entre épaulement, col et corps de bouée si aucun joint n'est dessiné.

---

# 23. Contraintes de reconstruction 3D importantes

## 23.1 Ne pas rendre le mécanisme entièrement plan

Les éléments suivants doivent avoir une structure spatiale :

- tripode ;
- pince ;
- collerette de bouée ;
- longeron et ses supports ;
- largeur de la plateforme.

## 23.2 Tripode

Si le terme est pris littéralement :

```text
number_of_branches = 3
azimuth_spacing ≈ 120°
```

La projection peut donner :

- une branche à gauche ;
- une branche à droite ;
- une branche située devant/derrière qui se projette près de l'axe central.

## 23.3 Pince

La pince doit passer **autour** de la bouée.

Aucune géométrie rigide ne doit pénétrer le volume solide de la bouée.

## 23.4 Boîtes

`BOX_1` et `BOX_2` doivent être alignables sans interférence géométrique avec :

- le col de la bouée ;
- la pince ;
- le bras ;
- la plateforme.

## 23.5 Mobilité du bras

La chaîne `A1-A4` doit posséder suffisamment de débattement pour amener `BOX_1` :

- au-dessus de `BOX_2` ;
- coaxiale avec `BOX_2` ;
- en contact avec `BOX_2`.

`A5` sert à ajuster l'orientation azimutale de `BOX_1`.

---

# 24. Séquence fonctionnelle de docking recommandée

Cette séquence est une interprétation fonctionnelle cohérente du croquis.

```text
STATE_0_FREE
    platform and buoy independent

STATE_1_APPROACH
    buoy enters capture region below/right of platform
    arm remains clear

STATE_2_COARSE_CAPTURE
    gripper reaches/encircles BUOY_COLLAR

STATE_3_GRIPPER_LOCK
    GRIPPER <-> BUOY_COLLAR constraint engaged

STATE_4_ALIGNMENT
    tripod/central mechanism stabilizes or centers buoy
    relative motion reduced

STATE_5_ARM_APPROACH
    articulated arm moves BOX_1 toward BOX_2

STATE_6_FINE_ALIGNMENT
    A1-A4 position BOX_1
    A5 matches rotational orientation

STATE_7_INTERFACE_CONTACT
    BOX_1 contacts BOX_2

STATE_8_DOCKED
    BOX_1 <-> BOX_2 lock engaged
    gripper remains mechanically engaged if required
```

L'ordre exact peut être différent dans le système réel, mais cette séquence respecte la logique géométrique du dessin.

---

# 25. Matrice des liaisons

| Parent | Enfant | Type de liaison | Axe / DOF | Statut |
|---|---|---|---|---|
| PLATFORM | LONGERON | Encastrement | 0 DOF | très probable |
| PLATFORM | SUPPORT_STRUTS | Encastrement | 0 DOF | visible |
| SUPPORT_STRUTS | LONGERON | Encastrement | 0 DOF | visible/probable |
| PLATFORM | ARM_BASE_COLUMN | Encastrement | 0 DOF | visible |
| ARM_BASE_COLUMN | ARM_LINK_1 | Pivot `A1` | axe ≈ Y | visible |
| ARM_LINK_1 | ARM_LINK_2 | Pivot `A2` | axe ≈ Y | visible |
| ARM_LINK_2 | ARM_LINK_3 | Pivot `A3` | axe ≈ Y | visible |
| ARM_LINK_3 | ARM_TERMINAL_LINK | Pivot `A4` | axe ≈ Y | visible |
| ARM_TERMINAL_LINK | TOOL_ROTATOR | Pivot `A5` | axe longitudinal local | visible via flèches |
| TOOL_ROTATOR | BOX_1 | Encastrement | 0 DOF | probable |
| BOX_1 | BOX_2 | liaison désaccouplable | inconnu | fonctionnellement suggéré |
| BUOY_MAIN_BODY | BOX_2 | Encastrement | 0 DOF | visible |
| PLATFORM | T_UP_1 | articulation | rotule/cardan conseillé | visible |
| PLATFORM | T_UP_2 | articulation | rotule/cardan conseillé | visible |
| PLATFORM | T_UP_3 | articulation | rotule/cardan conseillé | visible en pointillé |
| T_UP_1 | TRIPOD_LINK_1 | même articulation | — | visible |
| T_UP_2 | TRIPOD_LINK_2 | même articulation | — | visible |
| T_UP_3 | TRIPOD_LINK_3 | même articulation | — | partiellement occulté |
| TRIPOD_LINK_1 | CENTRAL/GRIPPER ASSEMBLY | `T_LOW_1` | rotule/cardan conseillé | visible |
| TRIPOD_LINK_2 | CENTRAL/GRIPPER ASSEMBLY | `T_LOW_2` | rotule/cardan conseillé | visible |
| TRIPOD_LINK_3 | CENTRAL/GRIPPER ASSEMBLY | `T_LOW_3` | rotule/cardan conseillé | pointillé |
| CENTRAL_VERTICAL_MEMBER | PLATFORM/FRAME | glissière verticale possible | axe Z | incertain |
| GRIPPER | BUOY_COLLAR | capture désaccouplable | DOF résiduels inconnus | fonctionnellement suggéré |

---

# 26. Niveaux de certitude

## `CERTAIN_FROM_DRAWING`

- existence de la plateforme ;
- existence du longeron circulaire/tubulaire sous la plateforme ;
- présence de supports entre longeron et plateforme ;
- existence du bras supérieur ;
- quatre articulations circulaires `A1-A4` ;
- rotation axiale terminale `A5` indiquée par les flèches ;
- `BOX_1` portée par le bras ;
- `BOX_2` portée par la bouée ;
- existence du tripode ;
- deux articulations hautes latérales ;
- deux articulations basses latérales ;
- deux articulations centrales pointillées/occultées ;
- existence d'un élément central vertical ;
- existence de la pince ;
- existence de la bouée ;
- présence d'une grande zone de préhension/collerette ;
- ligne d'eau.

## `HIGH_CONFIDENCE_3D_INTERPRETATION`

- axes `A1-A4` approximativement perpendiculaires au plan du dessin ;
- longeron cylindrique suivant `Y` ;
- tripode réparti spatialement autour de l'axe central ;
- collerette de bouée axisymétrique ;
- pince contournant la bouée au lieu de la traverser ;
- `BOX_1` et `BOX_2` formant une interface d'accouplement.

## `PLAUSIBLE_BUT_NOT_PROVEN`

- articulations du tripode = rotules ou cardans ;
- trois branches à exactement `120°` ;
- élément central = glissière verticale ;
- pince à plusieurs mors ;
- verrouillage rigide `BOX_1/BOX_2`;
- rotation libre ou bloquée de la bouée après préhension.

---

# 27. Informations explicitement inconnues

Ne pas halluciner les paramètres suivants :

- dimensions absolues ;
- longueur réelle suivant `Y` de la plateforme ;
- longueur du longeron ;
- diamètre exact du longeron ;
- nombre exact d'entretoises identiques sur toute la longueur ;
- section des bras ;
- limites angulaires des pivots ;
- présence de moteurs ou vérins ;
- emplacement des actionneurs ;
- rapports de réduction ;
- nature exacte du verrouillage des boîtes ;
- nature électrique des boîtes ;
- raideur ou amortissement des articulations ;
- masse de chaque pièce ;
- centre de gravité ;
- diamètre réel de la bouée ;
- diamètre de la collerette ;
- nombre exact de mors de la pince ;
- loi de fermeture de la pince ;
- liaison exacte entre élément central et plateforme ;
- degré de liberté résiduel après capture ;
- degré de liberté résiduel après docking complet.

---

# 28. Modèle machine-oriented proposé

```yaml
system:
  frame:
    X: "drawing_right"
    Y: "out_of_drawing_plane"
    Z: "drawing_up"

  rigid_bodies:
    - PLATFORM
    - LONGERON
    - ARM_BASE_COLUMN
    - ARM_LINK_1
    - ARM_LINK_2
    - ARM_LINK_3
    - ARM_TERMINAL_LINK
    - TOOL_ROTATOR
    - BOX_1
    - TRIPOD_LINK_1
    - TRIPOD_LINK_2
    - TRIPOD_LINK_3
    - CENTRAL_VERTICAL_MEMBER
    - GRIPPER
    - BUOY_MAIN_BODY
    - BUOY_COLLAR
    - BUOY_UPPER_NECK
    - BOX_2

  permanent_joints:
    - parent: PLATFORM
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
      child: BUOY_COLLAR
      type: FIXED
      confidence: high

    - parent: BUOY_MAIN_BODY
      child: BUOY_UPPER_NECK
      type: FIXED
      confidence: high

    - parent: BUOY_UPPER_NECK
      child: BOX_2
      type: FIXED
      confidence: high

  tripod:
    branch_count: 3
    branch_count_confidence: high
    approximate_azimuth_spacing_deg: 120
    spacing_confidence: medium

    upper_joints:
      - T_UP_1
      - T_UP_2
      - T_UP_3_hidden

    lower_joints:
      - T_LOW_1
      - T_LOW_2
      - T_LOW_3_hidden

    preferred_3d_joint_type: SPHERICAL_OR_UNIVERSAL
    exact_joint_type_confidence: low

    central_member:
      orientation: Z
      possible_joint: PRISMATIC_Z
      confidence: low

  temporary_constraints:
    - id: BUOY_CAPTURE
      body_a: GRIPPER
      body_b: BUOY_COLLAR
      states: [OPEN, ENGAGED]
      exact_locked_dof: UNKNOWN

    - id: BOX_DOCK
      body_a: BOX_1
      body_b: BOX_2
      states: [OPEN, LOCKED]
      preferred_initial_model_when_locked: FIXED
      exact_locked_dof: UNKNOWN

  geometric_constraints:
    - "GRIPPER must not penetrate BUOY_MAIN_BODY"
    - "GRIPPER should wrap around or engage BUOY_COLLAR"
    - "TRIPOD branches must not all be coplanar in final 3D model"
    - "BOX_1 must be reachable and alignable with BOX_2"
    - "BOX_1 and BOX_2 docking normals must oppose each other at contact"
    - "LONGERON circular drawing should be interpreted as cylinder cross-section, not sphere"
```

---

# 29. Contrôle final : éléments vérifiés une seconde fois sur l'image

Après nouvelle inspection du croquis, les éléments suivants avaient un risque d'être omis dans une description trop rapide et sont donc explicitement conservés ici :

1. **Les supports/entretoises entre la plateforme et le longeron** : ils sont présents et font partie de la structure.
2. **Le longeron n'est pas simplement un « flotteur rond »** : l'annotation lisible est « longeron » et sa forme circulaire est très probablement une coupe d'un élément cylindrique.
3. **L'articulation supérieure centrale du tripode est dessinée en pointillé/occultée**.
4. **L'articulation inférieure centrale du tripode est également dessinée en pointillé/occultée**.
5. **Le tripode contient donc plus d'information que les deux seules bielles diagonales visibles au premier regard**.
6. **L'élément central vertical du mécanisme inférieur est distinct visuellement et sa fonction exacte n'est pas certaine** : il ne faut pas le supprimer ni lui attribuer arbitrairement une glissière certaine.
7. **Les quatre cercles du bras supérieur `A1-A4` sont distincts**.
8. **La rotation terminale `A5` est explicitement indiquée par des flèches courbes et constitue un DOF différent de `A4`**.
9. **`BOX_1` et `BOX_2` sont deux pièces séparées**, pas un seul bloc.
10. **La pince est une structure distincte du corps de la bouée**.
11. **La longue branche horizontale de pince se superpose graphiquement à la bouée mais ne doit pas la traverser physiquement en 3D**.
12. **La ligne ondulée est la ligne d'eau**, pas un élément mécanique.
13. **La bouée possède un épaulement/collerette large servant naturellement de zone de capture**.
14. **Le bras supérieur et le mécanisme tripode/pince sont deux chaînes mécaniques différentes partageant seulement le bâti `PLATFORM`**.
15. **Aucun symbole ne justifie une rotation de tourelle de l'embase du bras autour de Z** ; cette liberté ne doit pas être ajoutée comme certitude.
16. **Aucun symbole ne justifie une glissière certaine du mécanisme central** ; elle reste une hypothèse.
17. **Les doubles traits des bras et de la pince représentent des volumes/épaisseurs, pas des paires de bielles sauf indication contraire**.
18. **La largeur suivant Y n'est fournie pour aucun composant** et doit être reconstruite comme paramètre de conception.
19. **La bouée doit rester un corps indépendant avant capture**, même si elle semble géométriquement « reliée » à la pince dans la projection.
20. **Les contacts pince/bouée et boîte1/boîte2 sont des liaisons temporaires commutables, pas des joints permanents.**

---

# 30. Résumé minimal à transmettre à un générateur 3D

Créer une plateforme flottante rigide munie d'un longeron cylindrique structurel sous sa partie gauche. Sur la plateforme est fixé un bras série à quatre pivots coplanaires `A1-A4`, terminé par un axe rotatif `A5` portant `BOX_1`. Sous la plateforme se trouve un mécanisme tripode spatial à trois branches, dont la troisième est partiellement occultée dans la vue 2D, relié à un ensemble central portant une pince. La pince doit entourer et saisir une collerette annulaire située sur une bouée indépendante. La bouée porte `BOX_2` au sommet. Après capture grossière de la collerette par la pince, le bras doit pouvoir positionner et orienter `BOX_1` pour l'accoupler à `BOX_2`. Les deux contacts `GRIPPER/BUOY_COLLAR` et `BOX_1/BOX_2` sont désaccouplables. Ne pas forcer tous les composants à rester dans le plan du dessin et ne pas interpréter les superpositions de traits comme des pénétrations ou des liaisons.
