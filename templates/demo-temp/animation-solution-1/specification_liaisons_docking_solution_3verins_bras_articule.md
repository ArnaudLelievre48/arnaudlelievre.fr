# Spécification cinématique et géométrique du mécanisme de docking
## Solution technique — plateforme de capture suspendue par trois vérins + bras articulé

> **But du document** : fournir à un modèle de génération/reconstruction 3D une description aussi non ambiguë que possible des corps rigides, articulations, degrés de liberté, contacts, occultations et incertitudes visibles sur le croquis fourni.
>
> **Important** : le dessin est une **projection 2D d'un mécanisme destiné à être tridimensionnel**. Un croisement, un contact apparent ou une superposition de traits dans le dessin ne crée pas automatiquement une liaison mécanique. Les éléments occultés doivent être reconstruits spatialement lorsque cela est nécessaire pour rendre le système fonctionnel.
>
> Cette solution combine deux niveaux de docking :
> 1. une **capture/stabilisation grossière** de la bouée par une structure inférieure suspendue à trois vérins ;
> 2. un **accouplement fin** de `BOX_1` avec `BOX_2` grâce à un bras articulé monté sur cette structure inférieure.

---

# 1. Convention de repère

Utiliser le repère global suivant :

- `X` : horizontal dans le plan du dessin, positif vers la droite ;
- `Z` : vertical dans le plan du dessin, positif vers le haut ;
- `Y` : perpendiculaire au dessin, positif vers l'observateur.

Le croquis doit être interprété comme une vue latérale/projetée dans le plan `XZ`.

Conséquences :

1. la géométrie suivant `Y` n'est pas directement fournie ;
2. les trois vérins ne doivent pas être reconstruits tous dans le même plan ;
3. la structure appelée `PLATFORM_2` doit posséder une largeur réelle suivant `Y` ;
4. les deux tronçons horizontaux visibles de part et d'autre de la bouée peuvent appartenir à une même structure spatiale entourant la bouée ;
5. les traits en pointillé traversant visuellement la partie supérieure de la bouée doivent être interprétés comme des éléments occultés/projetés, pas comme des pièces traversant nécessairement la matière ;
6. les doubles contours des bras et des vérins représentent l'épaisseur d'une pièce ou le corps/tige d'un vérin, pas plusieurs bielles indépendantes.

---

# 2. Inventaire des sous-ensembles

Le système visible contient au minimum cinq sous-ensembles fonctionnels :

1. `MAIN_PLATFORM_ASSEMBLY`
   - `PLATFORM_1` ;
   - longeron cylindrique sous la partie gauche ;
   - supports entre `PLATFORM_1` et le longeron.

2. `THREE_CYLINDER_SUSPENSION`
   - trois vérins reliant `PLATFORM_1` à la structure de capture inférieure ;
   - deux vérins visibles en projection ;
   - troisième vérin annoncé explicitement par l'annotation « 3 vérins », mais occulté ou hors du plan de coupe.

3. `LOWER_CAPTURE_FRAME`
   - ensemble appelé `PLATFORM_2` ;
   - deux extensions latérales visibles d'environ `1 m` de part et d'autre de la bouée ;
   - ouverture ou passage central permettant de placer la structure autour de la partie supérieure de la bouée ;
   - interface de capture latérale indiquée par deux flèches opposées vers la bouée.

4. `ARTICULATED_ARM`
   - colonne d'embase fixée sur le côté droit de `PLATFORM_2` ;
   - chaîne de bras articulés ;
   - poignet terminal rotatif ;
   - `BOX_1` portée par le poignet.

5. `BUOY_ASSEMBLY`
   - corps principal de la bouée ;
   - partie supérieure cylindrique ou quasi cylindrique de diamètre annoté `Ø 1 m` ;
   - `BOX_2` fixée sur le sommet ;
   - corps indépendant de la plateforme tant qu'aucune liaison de capture ou de docking n'est engagée.

---

# 3. `PLATFORM_1`

`PLATFORM_1` est le grand corps horizontal occupant la partie supérieure du dessin.

Géométrie visible :

- longueur annotée : environ `5 m` ;
- forme générale : poutre/plaque rectangulaire longue et mince ;
- axe principal approximativement parallèle à `X` ;
- faible épaisseur suivant `Z` ;
- largeur suivant `Y` non représentée ;
- supporte les ancrages supérieurs des vérins ;
- supporte le longeron et ses supports.

Aucune articulation interne n'est dessinée dans `PLATFORM_1`.

Pour la reconstruction :

```text
PLATFORM_1 = rigid body
```

---

# 4. Longeron

Sous la partie gauche de `PLATFORM_1` apparaît un grand cercle annoté **« longeron »**.

Interprétation 3D recommandée :

- le cercle représente très probablement la section transversale d'un élément cylindrique ;
- son axe est approximativement parallèle à `Y` ;
- il peut correspondre à un flotteur tubulaire ou à un longeron structurel vu en bout ;
- il ne doit pas être reconstruit comme une sphère.

Liaison avec la plateforme :

```text
PLATFORM_1 --FIXED--> LONGERON
```

Aucun symbole de pivot ou de glissière n'apparaît entre ces éléments.

---

# 5. Supports du longeron

Plusieurs traits verticaux/inclinés relient la face inférieure de `PLATFORM_1` à la périphérie supérieure du longeron.

Interprétation :

- entretoises ou consoles structurelles ;
- géométrie possiblement triangulée ;
- probablement répétées ou distribuées suivant `Y` ;
- solidaires de la plateforme et du longeron ;
- aucune articulation explicite à leurs extrémités.

Modèle recommandé :

```text
PLATFORM_1 --FIXED--> LONGERON_SUPPORTS --FIXED--> LONGERON
```

ou assemblage rigide composite unique.

---

# 6. Suspension principale par trois vérins

Le croquis comporte explicitement l'annotation :

```text
3 vérins
```

Deux vérins sont clairement visibles :

- `CYLINDER_1` à gauche ;
- `CYLINDER_2` à droite.

Le troisième :

- n'est pas distinguable comme branche indépendante dans cette projection ;
- doit néanmoins être conservé dans le modèle 3D ;
- est vraisemblablement situé avec un décalage suivant `Y` par rapport aux deux vérins visibles.

Définir :

```text
CYLINDER_1
CYLINDER_2
CYLINDER_3
```

Chaque vérin doit être modélisé au minimum par :

```text
CYLINDER_BODY_i
CYLINDER_ROD_i
PRISMATIC_i
```

avec :

```text
PRISMATIC_i.axis = local cylinder axis
```

---

# 7. Paramètre d'inclinaison `alpha`

Une annotation `α` apparaît près des deux vérins visibles.

Interprétation géométrique la plus naturelle :

```text
alpha_i = projected inclination of CYLINDER_i relative to vertical Z
```

ou angle équivalent défini dans le plan `XZ`.

Le croquis ne permet pas d'affirmer que :

- les deux valeurs de `α` sont identiques ;
- `α` est constant pendant le mouvement ;
- les trois vérins possèdent exactement la même inclinaison dans l'espace.

Dans une simulation, `alpha_i` doit donc résulter de la géométrie des points d'ancrage et de la longueur instantanée du vérin plutôt que d'être imposé arbitrairement comme constante.

---

# 8. Vérin gauche `CYLINDER_1`

Le vérin gauche relie `PLATFORM_1` à la partie gauche de `PLATFORM_2`.

Configuration dessinée :

- ancrage supérieur sur la face inférieure de `PLATFORM_1` ;
- ancrage inférieur sur l'extrémité gauche/intermédiaire de `PLATFORM_2` ;
- axe incliné vers la droite en descendant ;
- corps large en partie supérieure ;
- tige plus fine sortant du corps et rejoignant l'articulation inférieure.

En allant du point supérieur au point inférieur :

```text
ΔX > 0
ΔZ < 0
```

---

# 9. Articulation supérieure gauche `C1_UP`

Un cercle est dessiné au point d'ancrage supérieur du vérin gauche.

Interprétation 2D minimale :

```text
C1_UP.type = REVOLUTE
C1_UP.axis ≈ Y
```

Pour une reconstruction 3D capable d'accepter un mouvement spatial de la plateforme inférieure :

```text
C1_UP.preferred_3D = SPHERICAL or UNIVERSAL
```

Le type exact n'est pas déterminable à partir du croquis seul.

---

# 10. Glissière interne du vérin gauche `C1_PRISMATIC`

Le corps épais et la tige mince indiquent clairement une variation de longueur télescopique.

```text
C1_PRISMATIC.type = PRISMATIC
C1_PRISMATIC.axis = CYLINDER_1_LOCAL_AXIS
```

Cette liaison constitue le degré de liberté actif principal du vérin.

---

# 11. Articulation inférieure gauche `C1_LOW`

Un cercle est dessiné au point où la tige rejoint `PLATFORM_2`.

Interprétation 2D :

```text
C1_LOW.type = REVOLUTE
C1_LOW.axis ≈ Y
```

Interprétation 3D privilégiée :

```text
C1_LOW.preferred_3D = SPHERICAL or UNIVERSAL
```

---

# 12. Vérin droit `CYLINDER_2`

Le vérin droit relie la partie supérieure droite de `PLATFORM_1` à l'extrémité droite de `PLATFORM_2`.

Configuration dessinée :

- vérin incliné dans le sens opposé au vérin gauche ;
- ancrage supérieur très haut et très à droite ;
- tige descendant vers la gauche jusqu'à l'articulation inférieure ;
- corps large proche de l'ancrage supérieur.

En allant du point supérieur au point inférieur :

```text
ΔX < 0
ΔZ < 0
```

Le vérin comporte :

```text
C2_UP
C2_PRISMATIC
C2_LOW
```

avec une structure cinématique identique à celle de `CYLINDER_1`.

---

# 13. Articulations du vérin droit

### `C2_UP`

```text
OBSERVED_2D:
    REVOLUTE(axis≈Y)

PREFERRED_3D:
    SPHERICAL or UNIVERSAL
```

### `C2_PRISMATIC`

```text
type = PRISMATIC
axis = CYLINDER_2_LOCAL_AXIS
```

### `C2_LOW`

```text
OBSERVED_2D:
    REVOLUTE(axis≈Y)

PREFERRED_3D:
    SPHERICAL or UNIVERSAL
```

---

# 14. Troisième vérin `CYLINDER_3`

Le troisième vérin est **explicitement imposé par l'annotation du dessin**, mais son emplacement exact est invisible.

Il ne doit donc pas être supprimé.

Reconstruction 3D recommandée :

- créer un troisième point d'ancrage sur `PLATFORM_1` ;
- créer un troisième point correspondant sur `LOWER_CAPTURE_FRAME` ;
- décaler cette branche suivant `Y` afin d'obtenir une suspension réellement tridimensionnelle ;
- ne pas placer automatiquement les trois axes dans le plan `XZ`.

Architecture plausible :

```text
upper_anchors = 3 non-collinear points
lower_anchors = 3 non-collinear points
```

Une répartition triangulaire autour de la zone de docking est mécaniquement plausible, mais **l'espacement exact à 120° n'est pas donné**.

---

# 15. Fonction de la suspension à trois vérins

La suspension semble avoir pour rôle de positionner la structure inférieure sous `PLATFORM_1` et de permettre un réglage de sa position/orientation relative.

Fonctions probables :

- ajustement vertical de la hauteur de `PLATFORM_2` ;
- compensation des écarts de niveau entre la plateforme principale et la bouée ;
- possibilité de produire une inclinaison de la plateforme de capture par commande différentielle des vérins ;
- maintien mécanique de la structure inférieure à une distance de l'ordre de `3–4 m` sous `PLATFORM_1` ;
- éventuellement suivi partiel des mouvements relatifs dus à la houle.

Cependant, avec uniquement trois bielles télescopiques à rotules dans l'espace, le croquis ne définit pas nécessairement six contraintes indépendantes.

Il peut donc manquer dans le dessin :

- un guidage passif ;
- une géométrie d'articulation imposant certaines orientations ;
- une quatrième contrainte cinématique ;
- ou une rigidité structurelle non représentée.

Ne pas inventer cette liaison manquante comme certaine.

---

# 16. Distance verticale principale

Une cote verticale annotée :

```text
3–4 m
```

est dessinée entre `PLATFORM_1` et le niveau de la zone de docking autour de la bouée.

Interprétation recommandée :

- distance verticale caractéristique entre la plateforme supérieure et la zone de capture/connexion ;
- probablement plage de conception plutôt qu'une dimension absolue unique ;
- peut correspondre à la hauteur nominale disponible pour le mécanisme suspendu et le bras.

Ne pas interpréter cette cote comme :

- la course exacte d'un vérin ;
- la longueur exacte du bras ;
- la hauteur totale de la bouée.

---

# 17. `LOWER_CAPTURE_FRAME` / `PLATFORM_2`

La structure horizontale située au niveau de la partie supérieure de la bouée est annotée **« plateforme 2 »** sur le côté gauche.

Dans la projection, elle apparaît sous forme de deux tronçons :

- un tronçon gauche ;
- un tronçon droit.

Ils sont séparés visuellement par le corps supérieur de la bouée.

Il ne faut pas conclure immédiatement qu'il s'agit de deux corps indépendants.

Interprétation 3D privilégiée :

```text
PLATFORM_2 = frame surrounding BUOY_UPPER_BODY
```

c'est-à-dire une structure en cadre, en U ou annulaire qui passe autour de la bouée et dont les parties avant/arrière sont occultées dans la vue latérale.

---

# 18. Dimensions latérales visibles de `PLATFORM_2`

Deux cotes `1 m` sont indiquées :

- environ `1 m` entre le côté gauche de la bouée et l'extrémité extérieure gauche de la plateforme ;
- environ `1 m` entre le côté droit de la bouée et l'extrémité extérieure droite de la plateforme.

Dans le modèle :

```text
visible_left_extension  ≈ 1 m
visible_right_extension ≈ 1 m
```

Ces dimensions décrivent les extensions latérales visibles ; elles ne suffisent pas à définir la profondeur suivant `Y`.

---

# 19. Passage central autour de la bouée

La partie supérieure de la bouée occupe l'espace central entre les deux portions visibles de `PLATFORM_2`.

Le dessin comporte en plus des traits interrompus horizontaux dans cette zone.

Interprétation recommandée :

- `PLATFORM_2` possède une ouverture centrale ;
- la bouée pénètre dans cette ouverture lors de la capture ;
- les parties occultées du cadre peuvent passer devant/derrière la bouée suivant `Y` ;
- aucune pièce rigide ne doit traverser le volume solide de la bouée.

Contrainte géométrique :

```text
PLATFORM_2_FRAME ∩ BUOY_SOLID = ∅
```

hors surfaces/interfaces de contact prévues.

---

# 20. Flèches latérales dirigées vers la bouée

Deux petites flèches opposées sont visibles près des faces latérales de la partie supérieure de la bouée :

```text
left side  -> toward +X
right side -> toward -X
```

Elles suggèrent fortement une action de centrage ou de serrage latéral.

Cependant, le dessin ne montre pas explicitement :

- le détail des mâchoires ;
- les vérins de serrage ;
- les glissières ;
- le mécanisme de synchronisation ;
- la course du serrage.

Il faut donc distinguer l'observation de l'interprétation.

### Observation certaine

```text
opposed inward arrows exist at the buoy/platform interface
```

### Interprétation mécanique probable

```text
PLATFORM_2 includes opposed radial capture elements
```

---

# 21. Modèle recommandé pour la capture latérale

Pour obtenir une maquette fonctionnelle cohérente, définir éventuellement :

```text
CLAMP_LEFT
CLAMP_RIGHT
```

avec :

```text
CLAMP_LEFT  --PRISMATIC_X--> toward buoy
CLAMP_RIGHT --PRISMATIC_X--> toward buoy
```

Axes :

```text
CLAMP_LEFT.axis  ≈ +X / -X
CLAMP_RIGHT.axis ≈ -X / +X
```

selon la convention parent/enfant utilisée.

État :

```text
CAPTURE_INTERFACE.state = OPEN | CONTACT | CLAMPED
```

Ce modèle doit être marqué :

```text
PLAUSIBLE_BUT_NOT_PROVEN
```

car les glissières elles-mêmes ne sont pas dessinées.

---

# 22. Alternative : cadre fixe sans mâchoires mobiles

Une autre lecture compatible avec le dessin est possible :

- `PLATFORM_2` est un cadre rigide dimensionné pour venir au contact de la bouée ;
- les flèches représentent seulement les efforts de contact ou de recentrage ;
- aucun mouvement relatif interne n'existe entre les deux côtés du cadre.

Dans ce cas :

```text
CLAMP_LEFT / CLAMP_RIGHT = contact surfaces only
```

et non des corps mobiles.

Le croquis seul ne permet pas de trancher définitivement entre ces deux architectures.

---

# 23. Partie supérieure de la bouée

La zone centrale capturée par `PLATFORM_2` est dessinée comme un volume approximativement cylindrique ou prismatique vertical.

Une cote indique :

```text
Ø 1 m
```

Interprétation :

- diamètre caractéristique de la partie supérieure de la bouée autour de laquelle vient la structure de capture ;
- axe principal approximativement vertical `Z` ;
- section réellement circulaire probable en 3D malgré sa représentation rectangulaire dans la projection latérale.

Modèle recommandé :

```text
BUOY_CAPTURE_NECK.axis = Z
BUOY_CAPTURE_NECK.diameter ≈ 1 m
```

---

# 24. Corps principal de la bouée

Sous la zone cylindrique supérieure, le contour s'évase vers l'extérieur.

La forme complète n'est pas fournie.

Le croquis indique seulement que :

- la partie haute possède une zone étroite adaptée à la capture ;
- la partie inférieure devient plus large ;
- l'ensemble reste un corps flottant indépendant.

Ne pas déduire une géométrie hydrodynamique précise à partir de ce seul schéma.

---

# 25. `BOX_2`

`BOX_2` est représentée directement au-dessus de la bouée.

Relation mécanique :

```text
BUOY_UPPER_BODY --FIXED--> BOX_2
```

`BOX_2` est donc solidaire de la bouée.

Elle constitue la moitié fixe, côté bouée, de l'interface de docking fin.

---

# 26. Bras articulé : vue générale

Le bras articulé est monté sur la partie droite de `PLATFORM_2`.

La chaîne visible comprend :

1. une colonne verticale d'embase ;
2. un premier pivot au sommet de cette colonne ;
3. un premier bras diagonal allant vers le haut et la gauche ;
4. un second pivot au point haut ;
5. un second bras allant vers la gauche et légèrement vers le bas ;
6. un troisième pivot situé au-dessus de `BOX_1` ;
7. un segment terminal vertical ;
8. une rotation axiale terminale matérialisée par des flèches courbes ;
9. `BOX_1`.

Le bras est donc distinct de la suspension à trois vérins.

---

# 27. `ARM_BASE_COLUMN`

La colonne verticale portant l'annotation **« bras articulé »** part de la partie droite de `PLATFORM_2`.

Caractéristiques :

- orientation approximative `+Z` ;
- liaison inférieure sans symbole de joint ;
- sommet terminé par une articulation circulaire.

Relation recommandée :

```text
PLATFORM_2 --FIXED--> ARM_BASE_COLUMN
```

Aucune rotation de tourelle autour de `Z` n'est explicitement dessinée à la base.

Ne pas l'ajouter comme degré de liberté certain.

---

# 28. Articulation `A1`

Le cercle au sommet de `ARM_BASE_COLUMN` relie la colonne au premier bras mobile.

Interprétation :

```text
A1.type = REVOLUTE
A1.axis ≈ Y
```

Cette articulation permet au premier bras de pivoter dans le plan principal `XZ`.

---

# 29. `ARM_LINK_1`

Le premier segment mobile part de `A1` et va vers le haut et vers la gauche.

Dans la configuration dessinée :

```text
ΔX < 0
ΔZ > 0
```

Il est dessiné avec deux contours parallèles représentant une seule pièce rigide de section non nulle.

Il se termine sur `A2`.

---

# 30. Articulation `A2`

`A2` est le cercle situé au point le plus haut du bras.

```text
ARM_LINK_1 --A2--> ARM_LINK_2
A2.type = REVOLUTE
A2.axis ≈ Y
```

Cette articulation modifie l'angle entre les deux grands segments du bras.

---

# 31. `ARM_LINK_2`

Le second segment va de `A2` vers la gauche et légèrement vers le bas jusqu'à `A3`.

Dans le repère choisi :

```text
ΔX < 0
ΔZ < 0
```

La pente est faible comparativement à `ARM_LINK_1`.

---

# 32. Articulation `A3`

`A3` est le cercle situé au-dessus du poignet terminal, côté gauche du bras.

```text
ARM_LINK_2 --A3--> ARM_TERMINAL_LINK
A3.type = REVOLUTE
A3.axis ≈ Y
```

Elle permet d'orienter le segment terminal dans le plan `XZ`.

---

# 33. `ARM_TERMINAL_LINK`

Un segment court, presque vertical, descend depuis `A3` vers le poignet.

Dans la configuration dessinée :

```text
axis ≈ -Z
```

Il est rigide et constitue le dernier segment structurel avant la rotation axiale.

---

# 34. Rotation terminale `A4`

Deux flèches courbes sont dessinées autour de la partie inférieure du segment terminal.

Elles indiquent une rotation autour de l'axe longitudinal local du poignet.

```text
A4.type = REVOLUTE
A4.axis = local longitudinal axis of ARM_TERMINAL_LINK
A4.axis ≈ Z in the drawn configuration
```

Cette rotation est distincte de `A3`.

Elle permet d'ajuster l'orientation azimutale de `BOX_1` avant accouplement.

---

# 35. Nombre minimal de degrés de liberté du bras

Le croquis indique au minimum :

```text
A1 : planar revolute
A2 : planar revolute
A3 : planar revolute
A4 : axial wrist rotation
```

soit :

```text
4 visible arm DOF
```

Aucune glissière terminale indépendante n'est dessinée.

Aucune rotation d'embase autour de `Z` n'est dessinée.

---

# 36. `BOX_1`

`BOX_1` est le volume rectangulaire situé immédiatement sous le poignet terminal.

Relation mécanique :

```text
A4_OUTPUT --FIXED--> BOX_1
```

Elle se déplace donc avec l'effecteur du bras et tourne avec la sortie de `A4`.

Fonction probable :

- interface mécanique de verrouillage ;
- connecteur électrique ;
- interface hybride mécanique/électrique ;
- élément amené précisément sur `BOX_2` par le bras.

Le détail interne n'est pas visible.

---

# 37. Relation géométrique `BOX_1 / BOX_2`

Dans la configuration dessinée :

- `BOX_1` est directement au-dessus de `BOX_2` ;
- les deux volumes sont approximativement coaxiaux ;
- leurs faces de connexion sont horizontales ;
- le bras semble positionné dans une configuration proche de l'accouplement.

Condition géométrique souhaitée au docking :

```text
centerline(BOX_1) ≈ centerline(BOX_2)
normal(face_BOX_1) ≈ -normal(face_BOX_2)
```

`A1-A3` servent principalement au positionnement ; `A4` sert à l'orientation autour de l'axe terminal.

---

# 38. Interface temporaire `BOX_1 <-> BOX_2`

Il s'agit d'une liaison temporaire.

Définir :

```text
BOX_DOCK.state = OPEN | CONTACT | LOCKED
```

## État `OPEN`

```text
BOX_1 independent from BOX_2
```

Le bras peut déplacer `BOX_1` librement.

## État `CONTACT`

Les faces d'accouplement se touchent mais le verrouillage n'est pas nécessairement engagé.

## État `LOCKED`

Une contrainte temporaire est créée.

Pour une première maquette :

```text
BOX_1 <-> BOX_2 = DETACHABLE_FIXED_JOINT
```

mais le croquis ne permet pas d'affirmer que les six degrés de liberté sont réellement bloqués par l'interface physique.

---

# 39. Interface temporaire `PLATFORM_2 <-> BUOY`

Le niveau de capture grossière doit être traité indépendamment du verrouillage `BOX_1/BOX_2`.

Définir :

```text
BUOY_CAPTURE.state = FREE | CENTERING | ENGAGED
```

### `FREE`

La bouée et `PLATFORM_2` sont cinématiquement indépendantes.

### `CENTERING`

La bouée pénètre dans l'ouverture centrale et les contacts latéraux commencent à réduire l'écart transversal.

### `ENGAGED`

Les faces/mâchoires latérales maintiennent la partie supérieure de la bouée.

Le nombre exact de degrés de liberté résiduels n'est pas indiqué.

---

# 40. Effets attendus de la capture grossière

Une fois la bouée prise par `PLATFORM_2`, les effets fonctionnels attendus sont vraisemblablement :

- diminution des translations relatives horizontales ;
- recentrage de la bouée dans l'ouverture ;
- limitation des mouvements qui empêcheraient le bras d'aligner `BOX_1` et `BOX_2` ;
- reprise d'une partie des efforts mécaniques ;
- réduction de la charge transmise au connecteur fin.

Le dessin ne permet pas de savoir si la capture :

- bloque la rotation autour de `Z` ;
- autorise du roulis/tangage ;
- comporte du jeu radial ;
- utilise un revêtement compliant ;
- autorise un déplacement vertical relatif résiduel.

---

# 41. Répartition spatiale des trois vérins

Pour une reconstruction 3D, les trois vérins doivent former une structure spatiale.

Éviter :

```text
all 3 cylinders coplanar in XZ
```

Préférer :

```text
3 upper anchor points distributed in X-Y
3 lower anchor points distributed in X-Y
```

avec une géométrie compatible avec le passage de la bouée et du bras.

Une disposition triangulaire autour de la zone centrale est cohérente, mais les positions exactes ne sont pas fournies.

Le troisième vérin peut se projeter derrière ou devant la bouée/structure dans la vue actuelle.

---

# 42. Cinématique parallèle de `PLATFORM_2`

Les trois vérins constituent trois branches parallèles reliant le même bâti supérieur au même bâti inférieur.

Le graphe n'est donc pas une simple chaîne série.

Schématiquement :

```text
                 /-- CYLINDER_1 --\
PLATFORM_1  ----<--- CYLINDER_2 --->---- LOWER_CAPTURE_FRAME
                 \-- CYLINDER_3 --/
```

Les longueurs :

```text
L1, L2, L3
```

peuvent être commandées indépendamment.

En fonction de la géométrie réelle, ces trois actionneurs peuvent contrôler par exemple :

- hauteur moyenne ;
- roulis ;
- tangage ;

mais ceci suppose que les autres mouvements de corps rigide soient empêchés par la géométrie des joints, des guidages ou d'autres contraintes non représentées.

---

# 43. Mobilité globale de la structure inférieure

Le croquis ne permet pas d'établir un modèle exact à six degrés de liberté.

Pour une première simulation fonctionnelle simplifiée, on peut utiliser :

```text
controlled_DOF:
    Z
    roll
    pitch

constrained_or_neglected_DOF:
    X
    Y
    yaw
```

Cette réduction est une **hypothèse de simulation**, pas une information certaine du dessin.

Une autre option est de modéliser complètement les trois vérins et d'ajouter explicitement les guidages réels lorsqu'ils seront connus.

---

# 44. Interaction entre suspension et bras

Le bras est fixé sur `PLATFORM_2`.

Par conséquent :

```text
pose(ARM_BASE_COLUMN) = pose(PLATFORM_2) * fixed_transform
```

Toute variation de position/orientation de `PLATFORM_2` déplace simultanément :

- l'embase du bras ;
- les articulations `A1-A4` ;
- `BOX_1`.

Cela est fonctionnellement utile : la suspension grossière peut rapprocher tout le bras de la bouée avant que le bras n'effectue l'alignement précis.

---

# 45. Relation fonctionnelle entre capture grossière et docking fin

La solution combine deux échelles de mouvement.

### Niveau 1 — positionnement/capture grossière

Réalisé par :

```text
THREE_CYLINDER_SUSPENSION
+
LOWER_CAPTURE_FRAME
+
possible lateral clamps
```

Objectifs :

- amener la structure autour de la bouée ;
- régler hauteur/inclinaison ;
- centrer et stabiliser la bouée.

### Niveau 2 — positionnement fin

Réalisé par :

```text
ARTICULATED_ARM
+
A4 wrist rotation
```

Objectifs :

- aligner précisément `BOX_1` avec `BOX_2` ;
- ajuster l'orientation terminale ;
- engager l'interface mécanique/électrique.

---

# 46. Graphe cinématique synthétique

```text
WORLD
│
├── MAIN_PLATFORM_ASSEMBLY
│   │
│   ├── PLATFORM_1
│   │
│   ├── LONGERON_SUPPORTS
│   │   └── FIXED
│   │
│   └── LONGERON
│       └── FIXED relative to PLATFORM_1
│
├── PARALLEL_SUSPENSION_LOOP
│   │
│   ├── BRANCH_1
│   │   ├── C1_UP : REVOLUTE_2D / SPHERICAL_OR_UNIVERSAL_3D
│   │   ├── CYLINDER_1_BODY
│   │   ├── C1_PRISMATIC
│   │   ├── CYLINDER_1_ROD
│   │   └── C1_LOW : REVOLUTE_2D / SPHERICAL_OR_UNIVERSAL_3D
│   │
│   ├── BRANCH_2
│   │   ├── C2_UP : REVOLUTE_2D / SPHERICAL_OR_UNIVERSAL_3D
│   │   ├── CYLINDER_2_BODY
│   │   ├── C2_PRISMATIC
│   │   ├── CYLINDER_2_ROD
│   │   └── C2_LOW : REVOLUTE_2D / SPHERICAL_OR_UNIVERSAL_3D
│   │
│   └── BRANCH_3 [not visible in projection]
│       ├── C3_UP
│       ├── CYLINDER_3_BODY
│       ├── C3_PRISMATIC
│       ├── CYLINDER_3_ROD
│       └── C3_LOW
│
├── LOWER_CAPTURE_FRAME = PLATFORM_2
│   │
│   ├── LEFT_VISIBLE_EXTENSION ≈ 1 m
│   ├── RIGHT_VISIBLE_EXTENSION ≈ 1 m
│   ├── CENTRAL_OPENING around BUOY_CAPTURE_NECK
│   │
│   ├── optional CLAMP_LEFT
│   │   └── possible PRISMATIC_X
│   │
│   ├── optional CLAMP_RIGHT
│   │   └── possible PRISMATIC_X
│   │
│   └── ARM_BASE_COLUMN
│       └── FIXED
│           └── A1 : REVOLUTE(axis≈Y)
│               └── ARM_LINK_1
│                   └── A2 : REVOLUTE(axis≈Y)
│                       └── ARM_LINK_2
│                           └── A3 : REVOLUTE(axis≈Y)
│                               └── ARM_TERMINAL_LINK
│                                   └── A4 : REVOLUTE(local longitudinal axis)
│                                       └── BOX_1
│
└── BUOY_ASSEMBLY
    │
    ├── BUOY_MAIN_BODY
    ├── BUOY_CAPTURE_NECK ≈ Ø1 m
    └── BOX_2
        └── FIXED relative to BUOY
```

Interfaces temporaires :

```text
PLATFORM_2 / CLAMPS <---- detachable capture ----> BUOY_CAPTURE_NECK
BOX_1               <---- detachable docking ----> BOX_2
```

---

# 47. Matrice des liaisons

| Parent | Enfant | Type de liaison | Axe / DOF | Statut |
|---|---|---|---|---|
| `PLATFORM_1` | `LONGERON` | Encastrement | 0 DOF | très probable |
| `PLATFORM_1` | `LONGERON_SUPPORTS` | Encastrement | 0 DOF | visible |
| `PLATFORM_1` | `CYLINDER_1_BODY` | articulation `C1_UP` | pivot Y en 2D / rotule-cardan possible en 3D | visible |
| `CYLINDER_1_BODY` | `CYLINDER_1_ROD` | glissière `C1_PRISMATIC` | axe local du vérin | visible/fonctionnel |
| `CYLINDER_1_ROD` | `PLATFORM_2` | articulation `C1_LOW` | pivot Y en 2D / rotule-cardan possible en 3D | visible |
| `PLATFORM_1` | `CYLINDER_2_BODY` | articulation `C2_UP` | pivot Y en 2D / rotule-cardan possible en 3D | visible |
| `CYLINDER_2_BODY` | `CYLINDER_2_ROD` | glissière `C2_PRISMATIC` | axe local du vérin | visible/fonctionnel |
| `CYLINDER_2_ROD` | `PLATFORM_2` | articulation `C2_LOW` | pivot Y en 2D / rotule-cardan possible en 3D | visible |
| `PLATFORM_1` | `CYLINDER_3_BODY` | articulation `C3_UP` | inconnu | existence certaine, géométrie inconnue |
| `CYLINDER_3_BODY` | `CYLINDER_3_ROD` | glissière `C3_PRISMATIC` | axe local du vérin | fonctionnellement nécessaire |
| `CYLINDER_3_ROD` | `PLATFORM_2` | articulation `C3_LOW` | inconnu | existence probable |
| `PLATFORM_2` | `ARM_BASE_COLUMN` | Encastrement | 0 DOF | visible/probable |
| `ARM_BASE_COLUMN` | `ARM_LINK_1` | Pivot `A1` | axe ≈ Y | visible |
| `ARM_LINK_1` | `ARM_LINK_2` | Pivot `A2` | axe ≈ Y | visible |
| `ARM_LINK_2` | `ARM_TERMINAL_LINK` | Pivot `A3` | axe ≈ Y | visible |
| `ARM_TERMINAL_LINK` | `TOOL_ROTATOR` | Pivot `A4` | axe longitudinal local | visible via flèches |
| `TOOL_ROTATOR` | `BOX_1` | Encastrement | 0 DOF | probable |
| `BUOY_MAIN_BODY` | `BOX_2` | Encastrement | 0 DOF | visible |
| `PLATFORM_2` | `CLAMP_LEFT` | glissière possible | X | suggérée, non prouvée |
| `PLATFORM_2` | `CLAMP_RIGHT` | glissière possible | X | suggérée, non prouvée |
| `CLAMPS/PLATFORM_2` | `BUOY_CAPTURE_NECK` | capture désaccouplable | DOF résiduels inconnus | fonctionnellement suggéré |
| `BOX_1` | `BOX_2` | docking désaccouplable | DOF résiduels inconnus | fonctionnellement suggéré |

---

# 48. Symboles d'articulation visibles

## Suspension

1. `C1_UP` : cercle d'articulation supérieur du vérin gauche ;
2. `C1_LOW` : cercle inférieur du vérin gauche ;
3. `C2_UP` : cercle supérieur du vérin droit ;
4. `C2_LOW` : cercle inférieur du vérin droit ;
5. glissière télescopique interne visible sur chaque vérin ;
6. troisième vérin explicitement annoncé mais non visible individuellement.

## Bras

7. `A1` : cercle au sommet de la colonne d'embase ;
8. `A2` : cercle au point haut du bras ;
9. `A3` : cercle au-dessus du poignet terminal ;
10. `A4` : rotation axiale terminale indiquée par deux flèches courbes.

## Capture

11. deux flèches horizontales opposées au niveau de la bouée, indiquant une action de centrage/serrage, mais pas un type de joint certain.

---

# 49. Éléments qui ne sont PAS automatiquement des articulations

Ne pas interpréter comme joints sans preuve supplémentaire :

- les doubles contours des bras ;
- les doubles contours des vérins hors interface corps/tige ;
- les supports du longeron ;
- les intersections de traits dues à la projection ;
- les traits pointillés traversant la zone centrale ;
- les contours de la bouée ;
- les bords gauche et droit visibles de `PLATFORM_2` autour de la bouée ;
- la jonction graphique entre `BOX_2` et la bouée ;
- la jonction entre l'embase du bras et `PLATFORM_2` ;
- les changements de section du corps de la bouée.

---

# 50. Contraintes importantes de reconstruction 3D

## 50.1 Ne pas rendre la suspension entièrement plane

Le troisième vérin doit produire une structure réellement spatiale.

## 50.2 Ne pas faire traverser la bouée par `PLATFORM_2`

Les deux côtés visibles doivent être reconstruits comme les parties d'un cadre entourant la bouée ou comme des mâchoires latérales.

## 50.3 Préserver l'ouverture centrale

Le diamètre utile de l'ouverture doit être compatible avec la zone de bouée de `Ø ≈ 1 m` et avec le jeu nécessaire au docking.

## 50.4 Conserver le bras solidaire de `PLATFORM_2`

L'embase du bras se déplace avec la plateforme de capture.

## 50.5 Conserver les quatre DOF visibles du bras

```text
A1, A2, A3, A4
```

Aucun autre DOF ne doit être ajouté comme certitude.

## 50.6 Ne pas confondre capture et docking fin

La saisie de la bouée par `PLATFORM_2` et le verrouillage de `BOX_1/BOX_2` sont deux interfaces temporaires différentes.

---

# 51. Contraintes de portée du bras

Le bras doit pouvoir amener `BOX_1` depuis sa zone de repos jusqu'à `BOX_2` lorsque la bouée est capturée.

Conditions fonctionnelles :

```text
reachable(BOX_2.position) = true
```

et au contact :

```text
position_error(BOX_1, BOX_2) -> small
orientation_error(BOX_1, BOX_2) -> small
```

La géométrie doit éviter les collisions avec :

- la bouée ;
- `PLATFORM_2` ;
- les vérins ;
- `PLATFORM_1` ;
- le longeron ;
- les propres segments du bras.

---

# 52. Séquence fonctionnelle de docking recommandée

Cette séquence constitue une interprétation cohérente du croquis.

```text
STATE_0_FREE
    PLATFORM_1 assembly and BUOY independent
    cylinders in safe configuration
    arm retracted / clear

STATE_1_APPROACH
    buoy enters region below PLATFORM_1
    LOWER_CAPTURE_FRAME positioned above/around target zone

STATE_2_COARSE_VERTICAL_POSITIONING
    CYLINDER_1..3 adjust lengths
    PLATFORM_2 approaches BUOY_CAPTURE_NECK

STATE_3_COARSE_ORIENTATION
    differential cylinder lengths reduce tilt/alignment error

STATE_4_CAPTURE_ENTRY
    BUOY_CAPTURE_NECK enters central opening of PLATFORM_2

STATE_5_CENTERING
    opposed side contacts / optional jaws approach the buoy

STATE_6_CAPTURE_LOCK
    PLATFORM_2 <-> BUOY coarse capture engaged
    relative lateral motion strongly reduced

STATE_7_ARM_APPROACH
    A1-A3 move BOX_1 toward BOX_2

STATE_8_FINE_ORIENTATION
    A4 rotates BOX_1 around terminal axis

STATE_9_INTERFACE_CONTACT
    BOX_1 contacts BOX_2

STATE_10_DOCKED
    BOX_1 <-> BOX_2 locking engaged
    coarse capture remains engaged if mechanically required
```

L'ordre exact des étapes peut varier dans le système réel.

---

# 53. Niveaux de certitude

## `CERTAIN_FROM_DRAWING`

- existence de `PLATFORM_1` ;
- longueur annotée d'environ `5 m` ;
- existence du longeron ;
- supports reliant longeron et plateforme ;
- mention explicite de `3 vérins` ;
- deux vérins visibles ;
- présence de corps et tiges télescopiques ;
- articulations circulaires visibles en haut et en bas des vérins visibles ;
- présence de l'angle `α` sur les deux branches visibles ;
- existence de `PLATFORM_2` ;
- extensions latérales annotées `1 m` à gauche et à droite ;
- partie supérieure de la bouée annotée `Ø 1 m` ;
- cote verticale `3–4 m` ;
- présence de deux flèches de centrage/serrage dirigées vers la bouée ;
- existence du bras articulé sur la partie droite ;
- trois articulations circulaires du bras ;
- rotation terminale indiquée par flèches courbes ;
- `BOX_1` portée par le bras ;
- `BOX_2` portée par la bouée ;
- existence de la bouée.

## `HIGH_CONFIDENCE_3D_INTERPRETATION`

- longeron cylindrique suivant `Y` ;
- trois vérins distribués spatialement ;
- `PLATFORM_2` entourant la zone supérieure de la bouée plutôt que la traversant ;
- axes `A1-A3` approximativement perpendiculaires au plan du dessin ;
- `A4` autour de l'axe longitudinal du poignet ;
- `BOX_1` et `BOX_2` constituant une interface d'accouplement ;
- bras rigidement fixé à `PLATFORM_2` ;
- troisième vérin occulté par la projection.

## `PLAUSIBLE_BUT_NOT_PROVEN`

- extrémités de vérins montées sur rotules ou cardans en 3D ;
- répartition approximativement triangulaire des trois vérins ;
- trois actionneurs contrôlant hauteur + roulis + tangage ;
- présence de guidages supplémentaires empêchant X/Y/yaw ;
- deux mâchoires mobiles dans `PLATFORM_2` ;
- glissières de serrage suivant `X` ;
- verrouillage rigide complet de la bouée lors de la capture ;
- verrouillage rigide complet `BOX_1/BOX_2`.

---

# 54. Informations explicitement inconnues

Ne pas halluciner les paramètres suivants :

- largeur de `PLATFORM_1` suivant `Y` ;
- longueur réelle du longeron suivant `Y` ;
- diamètre exact du longeron ;
- position exacte du troisième vérin ;
- angles réels des trois vérins dans l'espace ;
- valeur numérique de `α` ;
- longueurs minimales/maximales des vérins ;
- courses utiles des vérins ;
- forces nominales ;
- type hydraulique/électrique/pneumatique des vérins ;
- nature exacte des articulations 3D aux extrémités ;
- nombre et nature des guidages supplémentaires ;
- largeur suivant `Y` de `PLATFORM_2` ;
- forme exacte du cadre autour de la bouée ;
- existence certaine de mâchoires indépendantes ;
- course de serrage latéral ;
- actionneurs de serrage ;
- matériau/compliance des surfaces de contact ;
- longueurs des segments du bras ;
- limites angulaires `A1-A4` ;
- couples des moteurs du bras ;
- présence d'un moteur de rotation de base ;
- nature exacte de `BOX_1` et `BOX_2` ;
- tolérances de docking ;
- degré de liberté résiduel après capture grossière ;
- degré de liberté résiduel après verrouillage fin ;
- forme hydrodynamique complète de la bouée.

---

# 55. Modèle machine-oriented proposé

```yaml
system:
  frame:
    X: drawing_right
    Y: out_of_drawing_plane
    Z: drawing_up

  dimensions_from_drawing:
    platform_1_length_m:
      value: 5
      confidence: high
    platform_1_to_capture_level_m:
      value_range: [3, 4]
      confidence: medium_high
    platform_2_left_extension_m:
      value: 1
      confidence: high
    platform_2_right_extension_m:
      value: 1
      confidence: high
    buoy_capture_diameter_m:
      value: 1
      confidence: high

  rigid_bodies:
    - PLATFORM_1
    - LONGERON
    - LONGERON_SUPPORTS
    - CYLINDER_1_BODY
    - CYLINDER_1_ROD
    - CYLINDER_2_BODY
    - CYLINDER_2_ROD
    - CYLINDER_3_BODY
    - CYLINDER_3_ROD
    - PLATFORM_2_FRAME
    - ARM_BASE_COLUMN
    - ARM_LINK_1
    - ARM_LINK_2
    - ARM_TERMINAL_LINK
    - TOOL_ROTATOR
    - BOX_1
    - BUOY_MAIN_BODY
    - BUOY_CAPTURE_NECK
    - BOX_2

  optional_rigid_bodies:
    - CLAMP_LEFT
    - CLAMP_RIGHT

  fixed_joints:
    - parent: PLATFORM_1
      child: LONGERON
      type: FIXED
      confidence: high

    - parent: PLATFORM_1
      child: LONGERON_SUPPORTS
      type: FIXED
      confidence: high

    - parent: PLATFORM_2_FRAME
      child: ARM_BASE_COLUMN
      type: FIXED
      confidence: high

    - parent: TOOL_ROTATOR
      child: BOX_1
      type: FIXED
      confidence: medium_high

    - parent: BUOY_MAIN_BODY
      child: BUOY_CAPTURE_NECK
      type: FIXED
      confidence: high

    - parent: BUOY_CAPTURE_NECK
      child: BOX_2
      type: FIXED
      confidence: high

  suspension:
    branch_count: 3
    branch_count_confidence: high

    branch_1:
      upper_joint:
        id: C1_UP
        observed_2d_type: REVOLUTE
        observed_axis: Y
        preferred_3d_type: SPHERICAL_OR_UNIVERSAL
        exact_type_confidence: low
      actuator:
        id: C1_PRISMATIC
        type: PRISMATIC
        axis: LOCAL_CYLINDER_AXIS
        confidence: high
      lower_joint:
        id: C1_LOW
        observed_2d_type: REVOLUTE
        observed_axis: Y
        preferred_3d_type: SPHERICAL_OR_UNIVERSAL
        exact_type_confidence: low

    branch_2:
      upper_joint:
        id: C2_UP
        observed_2d_type: REVOLUTE
        observed_axis: Y
        preferred_3d_type: SPHERICAL_OR_UNIVERSAL
        exact_type_confidence: low
      actuator:
        id: C2_PRISMATIC
        type: PRISMATIC
        axis: LOCAL_CYLINDER_AXIS
        confidence: high
      lower_joint:
        id: C2_LOW
        observed_2d_type: REVOLUTE
        observed_axis: Y
        preferred_3d_type: SPHERICAL_OR_UNIVERSAL
        exact_type_confidence: low

    branch_3:
      visibility: hidden_or_out_of_plane
      existence_confidence: high
      upper_joint:
        id: C3_UP
        type: UNKNOWN
      actuator:
        id: C3_PRISMATIC
        type: PRISMATIC
        axis: LOCAL_CYLINDER_AXIS
        confidence: medium_high
      lower_joint:
        id: C3_LOW
        type: UNKNOWN

    inclination_parameter:
      name: alpha
      interpretation: projected_cylinder_angle_relative_to_vertical
      numeric_value: UNKNOWN

  lower_capture_frame:
    body: PLATFORM_2_FRAME
    central_opening_required: true
    target_body: BUOY_CAPTURE_NECK
    must_not_penetrate_buoy_solid: true

    possible_clamping_system:
      confidence: medium
      indication: opposed_inward_arrows
      left:
        body: CLAMP_LEFT
        possible_joint: PRISMATIC_X
      right:
        body: CLAMP_RIGHT
        possible_joint: PRISMATIC_X

  arm:
    base:
      body: ARM_BASE_COLUMN
      fixed_to: PLATFORM_2_FRAME

    joints:
      - id: A1
        parent: ARM_BASE_COLUMN
        child: ARM_LINK_1
        type: REVOLUTE
        axis: Y
        confidence: high

      - id: A2
        parent: ARM_LINK_1
        child: ARM_LINK_2
        type: REVOLUTE
        axis: Y
        confidence: high

      - id: A3
        parent: ARM_LINK_2
        child: ARM_TERMINAL_LINK
        type: REVOLUTE
        axis: Y
        confidence: high

      - id: A4
        parent: ARM_TERMINAL_LINK
        child: TOOL_ROTATOR
        type: REVOLUTE
        axis: LOCAL_LONGITUDINAL
        confidence: high

    visible_dof_count: 4

  temporary_constraints:
    - id: BUOY_CAPTURE
      body_a: PLATFORM_2_FRAME_OR_CLAMPS
      body_b: BUOY_CAPTURE_NECK
      states: [FREE, CENTERING, ENGAGED]
      exact_locked_dof: UNKNOWN

    - id: BOX_DOCK
      body_a: BOX_1
      body_b: BOX_2
      states: [OPEN, CONTACT, LOCKED]
      preferred_initial_model_when_locked: FIXED
      exact_locked_dof: UNKNOWN

  geometric_constraints:
    - PLATFORM_2_FRAME must surround rather than penetrate BUOY_CAPTURE_NECK
    - third cylinder must not be deleted because it is explicitly annotated
    - three cylinder branches should not all be coplanar in the final 3D model
    - ARM_BASE_COLUMN moves rigidly with PLATFORM_2_FRAME
    - BOX_1 must be reachable from the arm and alignable with BOX_2
    - BOX_1 and BOX_2 docking normals should oppose each other at contact
    - LONGERON circular view should be interpreted as cylinder cross-section rather than sphere
    - capture interface and BOX docking interface are separate temporary constraints
```

---

# 56. Contrôle final des éléments visibles

Après inspection détaillée du croquis, les points suivants doivent être conservés dans toute reconstruction :

1. **`PLATFORM_1` est cotée à environ 5 m**.
2. **Le longeron circulaire sous la partie gauche est maintenu par plusieurs supports**.
3. **L'annotation indique explicitement trois vérins**, même si seulement deux sont visibles dans cette projection.
4. **Les deux vérins visibles possèdent un corps large, une tige télescopique et un cercle d'articulation à chaque extrémité**.
5. **Le paramètre `α` est indiqué près de chacun des deux vérins visibles**.
6. **La structure inférieure est annotée `plateforme 2`**.
7. **La partie gauche visible de cette plateforme est cotée à 1 m**.
8. **La partie droite visible est également cotée à 1 m**.
9. **La zone de bouée située entre elles est annotée `Ø 1 m`**.
10. **Deux flèches horizontales pointent vers la bouée depuis les côtés**, ce qui doit être conservé comme indication de capture/centrage.
11. **Les traits interrompus au centre ne doivent pas être transformés en une pièce rigide traversant la bouée**.
12. **Le bras articulé est monté sur la partie droite de `PLATFORM_2`**, pas sur `PLATFORM_1`.
13. **Le bras présente trois pivots circulaires distincts `A1-A3`**.
14. **Une rotation axiale terminale supplémentaire `A4` est explicitement indiquée par des flèches courbes**.
15. **`BOX_1` est portée par le bras**.
16. **`BOX_2` est fixée à la bouée**.
17. **`BOX_1` et `BOX_2` sont deux pièces séparées formant une interface temporaire**.
18. **La cote verticale `3–4 m` relie fonctionnellement la plateforme supérieure à la zone de docking**, sans préciser la course exacte des actionneurs.
19. **La bouée reste indépendante avant capture**.
20. **Le docking grossier par `PLATFORM_2` et le docking fin par `BOX_1/BOX_2` sont deux opérations différentes**.

---

# 57. Résumé minimal à transmettre à un générateur 3D

Créer une plateforme supérieure rigide `PLATFORM_1` d'environ 5 m de longueur, portant un longeron cylindrique sous sa partie gauche. Suspendre sous cette plateforme un cadre de capture `PLATFORM_2` à l'aide de **trois vérins télescopiques articulés**, dont deux sont visibles sur le dessin et un troisième doit être placé hors du plan de projection. Le cadre inférieur se trouve environ 3–4 m sous la plateforme principale et entoure la partie supérieure d'une bouée de diamètre d'environ 1 m. Les extensions visibles du cadre mesurent environ 1 m de chaque côté de la bouée. Deux flèches opposées vers la bouée indiquent une fonction de centrage/serrage latéral ; des mâchoires coulissantes peuvent être utilisées dans une première maquette mais doivent être marquées comme hypothèse. Sur la partie droite de `PLATFORM_2`, fixer un bras série comportant trois pivots coplanaires `A1-A3`, terminé par une rotation axiale `A4` portant `BOX_1`. La bouée porte `BOX_2`. Après positionnement grossier de `PLATFORM_2` par les trois vérins et capture de la bouée, le bras doit pouvoir positionner et orienter `BOX_1` pour l'accoupler à `BOX_2`. Les interfaces `PLATFORM_2/BUOY` et `BOX_1/BOX_2` sont temporaires et désaccouplables. Ne pas forcer les trois vérins dans le même plan et ne pas faire pénétrer la structure de capture dans le volume solide de la bouée.
