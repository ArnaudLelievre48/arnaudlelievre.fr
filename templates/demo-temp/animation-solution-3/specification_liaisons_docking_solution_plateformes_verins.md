# Spécification cinématique et géométrique du mécanisme de docking
## Nouvelle solution — plateforme suspendue et fermeture de P2 sur la bouée par vérins

> **But du document** : fournir à un modèle de génération/reconstruction 3D une description aussi non ambiguë que possible des corps rigides, articulations, degrés de liberté, contacts, occultations et incertitudes visibles sur le croquis fourni.
>
> **Important** : le dessin est une **projection 2D d'un mécanisme destiné à être tridimensionnel**. Les éléments qui semblent superposés dans le plan du croquis peuvent être décalés suivant la profondeur. Les liaisons explicitement dessinées, les cotes et les annotations manuscrites doivent être privilégiées par rapport aux interprétations mécaniques supposées.

---

> **Correction de conception confirmée** : une fois au bon niveau, `PLATFORM_2` se referme sur la bouée au moyen de **vérins de fermeture/centrage supplémentaires**. Cette fermeture centre la bouée sur `PLATFORM_2` et, par la liaison rigide des montants, sur `PLATFORM_3`. La fermeture intervient **avant** l’approche fine de `BOX_1` et son verrouillage sur `BOX_2`. Elle remplace les anciennes interprétations de simple passage avec jeu et de contact optionnel. Le nombre, la disposition et les courses des vérins de fermeture ne sont pas fournis par cette correction.

> **Correction du mouvement vertical** : pendant l’approche et le docking, la bouée **conserve son altitude**. Ce sont les trois vérins de suspension qui **s’étendent et abaissent le bâti P2/P3 jusqu’au niveau de la bouée**. Le centrage horizontal par fermeture de P2 intervient ensuite. Lors de la libération, la rétraction des vérins remonte le bâti ; la bouée ne monte ni ne descend dans le cycle illustratif.

---

# 1. Convention de repère

Utiliser le repère global suivant :

- `X` : horizontal dans le plan du dessin, positif vers la droite ;
- `Z` : vertical dans le plan du dessin, positif vers le haut ;
- `Y` : perpendiculaire au dessin, positif vers l'observateur.

Le croquis doit être compris comme une vue latérale/projetée dans le plan `XZ`.

Conséquences :

1. les positions suivant `Y` ne sont pas directement données ;
2. les trois vérins ne doivent pas nécessairement être reconstruits dans un même plan ;
3. la géométrie des plateformes `PLATFORM_2` et `PLATFORM_3` doit posséder une largeur réelle suivant `Y` ;
4. le troisième vérin annoncé par l'annotation « 3 vérins » peut être totalement ou partiellement occulté en projection ;
5. les traits doubles représentant un vérin correspondent au corps et à la tige télescopique du même actionneur, pas à deux bielles indépendantes.

---

# 2. Inventaire des sous-ensembles

Le système visible contient au minimum six sous-ensembles fonctionnels :

1. `MAIN_PLATFORM_ASSEMBLY`
   - `PLATFORM_1` ;
   - longeron sous la partie gauche ;
   - supports entre le longeron et la plateforme.

2. `THREE_CYLINDER_SUSPENSION`
   - trois vérins reliant la plateforme supérieure à la structure mobile inférieure ;
   - deux vérins sont visibles dans la projection ;
   - le troisième est explicitement annoncé mais non distinguable comme branche indépendante sur la vue.

3. `LOWER_MOVING_FRAME`
   - `PLATFORM_2`, située autour du niveau supérieur de la bouée ;
   - montants verticaux ;
   - `PLATFORM_3`, située au-dessus de `PLATFORM_2` ;
   - cadre porteur de `PLATFORM_2`, montants et `PLATFORM_3` solidaires ;
   - organes de fermeture mobiles sur `PLATFORM_2`, distincts du cadre porteur.

4. `FINE_DOCKING_STAGE`
   - mécanisme vertical central monté sous `PLATFORM_3` ;
   - translation verticale indiquée par des flèches haut/bas ;
   - rotation axiale indiquée par une flèche courbe ;
   - `BOX_1` portée par ce mécanisme.

5. `BUOY_ASSEMBLY`
   - corps principal de bouée ;
   - partie supérieure cylindrique ou prismatique d'environ `Ø 1 m` selon l'annotation ;
   - `BOX_2` au sommet ;
   - corps flottant indépendant avant la fermeture de `PLATFORM_2` ;
   - centré et maintenu radialement par `PLATFORM_2` après fermeture, avant même le verrouillage des boîtes.

6. `PLATFORM2_CENTERING_STAGE`
   - vérins supplémentaires de fermeture/centrage, distincts des trois vérins de suspension ;
   - éléments mobiles de `PLATFORM_2` venant au contact de la bouée ;
   - ouverture pour l’entrée et la libération, fermeture pour le centrage commun P2/P3/bouée.

---

# 3. `PLATFORM_1`

`PLATFORM_1` est le grand corps horizontal occupant la partie supérieure du croquis.

Géométrie visible :

- poutre/plaque longue et mince ;
- axe principal approximativement parallèle à `X` ;
- faible épaisseur suivant `Z` ;
- largeur suivant `Y` non représentée ;
- supporte les ancrages supérieurs des trois vérins ;
- supporte également le longeron situé sous sa partie gauche.

Aucune articulation interne n'est dessinée dans `PLATFORM_1`.

Pour la reconstruction :

```text
PLATFORM_1 = rigid body
```

---

# 4. Longeron sous `PLATFORM_1`

Sous la partie gauche de `PLATFORM_1` apparaît un grand cercle annoté **« longeron »**.

Interprétation 3D recommandée :

- le cercle représente très probablement la section d'un élément cylindrique ;
- son axe est donc approximativement parallèle à `Y` ;
- il peut correspondre à un flotteur tubulaire ou à un longeron structurel vu en coupe ;
- il ne doit pas être reconstruit comme une sphère.

La liaison avec la plateforme ne comporte aucun symbole d'articulation.

```text
PLATFORM_1 --FIXED--> LONGERON
```

Des entretoises/supports verticaux ou inclinés relient visiblement le longeron à la plateforme.

Ces supports doivent être considérés comme rigides sauf information supplémentaire.

---

# 5. Supports du longeron

Plusieurs traits relient la face inférieure de `PLATFORM_1` à la périphérie du longeron.

Interprétation :

- jambes ou consoles structurelles ;
- probablement réparties suivant `Y` ;
- aucune articulation circulaire explicite à leurs extrémités ;
- fonction de reprise d'effort et de maintien géométrique.

Modèle recommandé :

```text
PLATFORM_1 --FIXED--> LONGERON_SUPPORTS --FIXED--> LONGERON
```

ou assemblage rigide composite unique.

---

# 6. Vue d'ensemble de la suspension par vérins

Le croquis comporte l'annotation **« 3 vérins »**.

Deux vérins sont clairement visibles en projection :

- un vérin côté gauche ;
- un vérin côté droit.

La troisième branche est supposée exister car le nombre `3` est explicitement annoté, mais sa position exacte suivant `Y` n'est pas visible.

Définir :

```text
CYLINDER_1
CYLINDER_2
CYLINDER_3
```

Chaque vérin relie :

```text
PLATFORM_1 <-> PLATFORM_2 / LOWER_MOVING_FRAME
```

Le dessin suggère que les vérins peuvent modifier leur longueur.

Chaque vérin doit donc contenir au minimum :

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

# 7. Vérin gauche `CYLINDER_1`

Le vérin gauche est visible entre un point d'ancrage haut sur `PLATFORM_1` et un point d'ancrage bas sur `PLATFORM_2`.

Configuration dessinée :

- axe presque vertical ;
- légère inclinaison possible ;
- ancrage supérieur situé à droite du longeron ;
- ancrage inférieur situé sur la partie gauche de `PLATFORM_2`.

Le corps large du vérin est situé dans la partie supérieure de la branche ; la tige plus fine descend vers `PLATFORM_2`.

### Articulation supérieure gauche `C1_UP`

Un cercle est dessiné au niveau de l'ancrage supérieur.

En projection 2D :

```text
C1_UP.type = REVOLUTE
C1_UP.axis ≈ Y
```

Pour une reconstruction 3D réaliste, une rotule ou un cardan est mécaniquement plus plausible si le vérin doit accepter des variations d'orientation hors du plan :

```text
3D_PREFERRED = SPHERICAL or UNIVERSAL
```

Le type exact n'est pas donné.

### Glissière interne `C1_PRISMATIC`

```text
C1_PRISMATIC.type = PRISMATIC
C1_PRISMATIC.axis = cylinder_local_axis
```

Cette liaison modifie la longueur du vérin.

### Articulation inférieure gauche `C1_LOW`

Un cercle est dessiné au niveau de la connexion avec `PLATFORM_2`.

Même hiérarchie d'interprétation :

```text
OBSERVED_2D = REVOLUTE(axis≈Y)
3D_PREFERRED = SPHERICAL or UNIVERSAL
```

---

# 8. Vérin droit `CYLINDER_2`

Le vérin droit relie le bord supérieur droit de `PLATFORM_1` à l'extrémité droite de `PLATFORM_2`.

Configuration dessinée :

```text
from top to bottom:
ΔX < 0
ΔZ < 0
```

Il est nettement plus incliné que le vérin gauche dans la configuration représentée.

Il possède les mêmes éléments cinématiques :

```text
C2_UP
C2_PRISMATIC
C2_LOW
```

avec :

```text
C2_PRISMATIC.axis = local cylinder axis
```

Les cercles supérieur et inférieur indiquent des articulations permettant au vérin de changer d'orientation lorsque sa longueur varie.

Pour une maquette strictement 2D : pivots d'axe `Y`.

Pour une maquette 3D : rotules/cardans recommandés comme hypothèse de conception.

---

# 9. Troisième vérin `CYLINDER_3`

Le troisième vérin est explicitement indiqué par le texte **« 3 vérins »**, mais n'est pas isolable sur la projection.

Il doit donc être conservé dans le modèle conceptuel.

Définir :

```text
C3_UP
C3_PRISMATIC
C3_LOW
```

Le croquis ne permet pas de connaître :

- son azimut autour de la structure ;
- sa position exacte suivant `Y` ;
- l'écartement exact entre les trois ancrages ;
- si les trois vérins sont identiques ;
- si les ancrages sont répartis à `120°`.

Une distribution approximativement symétrique à `120°` autour de l'axe de la bouée est **plausible**, mais elle n'est pas prouvée par la vue.

Ne pas présenter `120°` comme une information certaine.

---

# 10. Fonction cinématique probable des trois vérins

La présence de trois vérins reliant `PLATFORM_1` au bâti mobile suggère un système destiné à corriger la position/orientation de la structure inférieure.

Hypothèse fonctionnelle forte :

- déplacement vertical global de la structure mobile ;
- inclinaison autour de deux axes horizontaux ;
- compensation de l'assiette relative entre plateforme et bouée.

On peut décrire l'intention par :

```text
controlled_coordinates ≈ [heave, pitch, roll]
```

Cependant, ceci est une **interprétation fonctionnelle**, pas une cinématique complètement déterminée par le dessin.

Point important : trois jambes de type rotule-glissière-rotule (`SPS`) ne suffisent pas, à elles seules, à supprimer les six degrés de liberté d'un solide dans l'espace.

Ainsi, si les vérins sont réellement reliés par des rotules aux deux extrémités, il faut probablement un ou plusieurs éléments supplémentaires non représentés pour empêcher :

- la dérive suivant `X` ;
- la dérive suivant `Y` ;
- une rotation parasite autour de `Z`.

Ces éléments peuvent être :

- guides ;
- bielles passives ;
- glissières ;
- géométrie contrainte des liaisons ;
- structure non représentée sur la vue.

**Ne pas considérer automatiquement le mécanisme 3-vérins comme intégralement contraint en 6 DOF.**

---

# 11. `PLATFORM_2`

`PLATFORM_2` est la structure inférieure entourant la partie supérieure de la bouée. Elle possède désormais deux fonctions confirmées : passage ouvert pendant l’approche, puis fermeture par vérins sur la bouée pour assurer le centrage.

Distinguer :

- `PLATFORM_2_FRAME` : cadre porteur rigide recevant les trois vérins de suspension et les montants de `PLATFORM_3` ;
- `P2_CLOSING_MEMBERS` : organes mobiles de fermeture, guidés par le cadre porteur ;
- `P2_CENTERING_CYLINDERS` : vérins actionnant ces organes, supplémentaires aux trois vérins de suspension.

Les parties gauche et droite du croquis ne doivent pas devenir deux bâtis indépendants. Elles appartiennent à un système de fermeture solidaire d’un cadre commun. Le nombre d’éléments mobiles, leur forme et leur guidage exact sont inconnus.

Pour l’animation, deux demi-colliers coulissant horizontalement et deux vérins opposés sont une **hypothèse de représentation**, pas une donnée certaine de conception.

---

# 12. Dimensions visibles de `PLATFORM_2`

Deux cotes horizontales `1 m` sont visibles :

- environ `1 m` depuis le bord gauche de la zone centrale de bouée jusqu'à l'extrémité gauche de `PLATFORM_2` ;
- environ `1 m` depuis le bord droit de la zone centrale jusqu'à l'extrémité droite de `PLATFORM_2`.

Interprétation recommandée :

```text
left_radial_extension  ≈ 1 m
right_radial_extension ≈ 1 m
```

Ces cotes sont dessinées dans la vue `XZ`.

Elles ne renseignent pas directement la largeur suivant `Y`.

---

# 13. Passage et fermeture de `PLATFORM_2`

Les trois vérins de suspension s’étendent pour faire descendre le bâti P2/P3 autour de la partie supérieure de la bouée, qui reste à altitude constante. `PLATFORM_2` est ouverte pendant cette descente et conserve un dégagement sans pénétration. L’entrée de la bouée dans le passage est donc un mouvement **relatif provoqué par la descente de P2**, pas par une montée de la bouée.

Une fois `PLATFORM_2` au bon niveau et son assiette réglée, les vérins de fermeture rapprochent les éléments mobiles jusqu’au contact radial avec la bouée.

```text
PLATFORM2_CAPTURE.state = OPEN | CLOSING | CENTERED | OPENING
OPEN: buoy can enter or leave the central passage
CLOSING: centering cylinders move the closing members toward buoy
CENTERED: P2 / P3 / buoy centerlines coincide; radial centering maintained
OPENING: closing members retract to release buoy
```

Cette interface est **commandée et réversible**. Elle est distincte de `BOX_DOCK`, qui relie temporairement `BOX_1` et `BOX_2` plus tard dans le cycle. La fermeture sur la bouée est confirmée ; une liaison fixe complète bloquant aussi la translation axiale et le lacet ne doit pas être déduite sans information supplémentaire.

---

# 14. `PLATFORM_3`

`PLATFORM_3` est une plateforme horizontale située au-dessus de `BOX_1`, sous `PLATFORM_1`.

Elle est plus courte que `PLATFORM_1` dans la vue.

Son rôle visible est de supporter le mécanisme fin de docking vertical.

Aucune liaison articulée n'est dessinée entre `PLATFORM_3` et les montants qui descendent vers `PLATFORM_2`.

L'interprétation par défaut est donc :

```text
PLATFORM_2 --FIXED FRAME--> PLATFORM_3
```

---

# 15. Montants entre `PLATFORM_2` et `PLATFORM_3`

Plusieurs traits verticaux sont visibles entre les deux plateformes.

Ils doivent être interprétés comme des montants structurels sauf preuve contraire.

Ils semblent former une sorte de portique/cage entourant la zone de docking.

Caractéristiques :

- orientation approximative `Z` ;
- liaison supérieure rigide à `PLATFORM_3` ;
- liaison inférieure rigide à `PLATFORM_2` ;
- nombre exact en 3D non donné ;
- disposition suivant `Y` non donnée.

Pour une première reconstruction :

```text
LOWER_MOVING_FRAME = rigid assembly(
    PLATFORM_2_FRAME,
    FRAME_UPRIGHTS,
    PLATFORM_3
)
```

---

# 16. Relation entre `PLATFORM_2` et `PLATFORM_3`

Le **cadre porteur** de `PLATFORM_2`, les montants et `PLATFORM_3` forment un même bâti rigide. Ils se déplacent ensemble sous l’action des trois vérins de suspension.

```text
PLATFORM_2_FRAME --FIXED--> FRAME_UPRIGHTS --FIXED--> PLATFORM_3
```

Les organes mobiles de fermeture se déplacent relativement à ce cadre. Ce mouvement interne ne crée aucune articulation entre le cadre de P2 et P3.

Lorsque P2 se referme sur la bouée, le centrage réalisé dans son passage central aligne aussi P3 avec la bouée, car l’axe de P3 est solidaire de celui du cadre de P2.

---

# 17. Distance verticale entre `PLATFORM_1` et la structure inférieure

Une cote verticale approximative **`3–4 m`** est visible au centre du dessin.

Le tracé de la cote ne permet pas d'identifier avec certitude ses deux références exactes.

Elle semble indiquer l'ordre de grandeur de la distance verticale disponible entre la plateforme principale et la zone de docking/mécanisme inférieur.

Pour la reconstruction :

```text
main_vertical_scale ≈ 3 to 4 m
```

mais ne pas imposer cette valeur comme une distance précise entre deux faces particulières sans validation.

---

# 18. Mécanisme de docking fin sous `PLATFORM_3`

Sous le centre de `PLATFORM_3` apparaît un petit mécanisme vertical directement au-dessus de `BOX_1`.

Deux mouvements sont explicitement suggérés :

1. déplacement vertical, par des flèches opposées haut/bas ;
2. rotation autour de l'axe vertical, par une flèche courbe.

Il faut donc représenter au minimum deux degrés de liberté indépendants ou un joint cylindrique équivalent.

---

# 19. Translation verticale `FINE_Z`

Définir :

```text
FINE_Z.type = PRISMATIC
FINE_Z.axis ≈ Z
```

Cette liaison permet de rapprocher ou d'éloigner `BOX_1` de `BOX_2` suivant l'axe vertical.

Fonctions probables :

- approche finale ;
- compensation d'une petite erreur de hauteur ;
- insertion/retrait d'un connecteur ;
- application d'un effort axial contrôlé.

Seule l'existence du mouvement vertical est directement suggérée par le dessin ; la course exacte est inconnue.

---

# 20. Rotation axiale `FINE_RZ`

Définir :

```text
FINE_RZ.type = REVOLUTE
FINE_RZ.axis ≈ Z
```

Cette rotation permet à `BOX_1` de tourner autour de l'axe local vertical.

Fonctions probables :

- alignement azimutal ;
- orientation d'un connecteur ;
- mise en correspondance de détrompeurs ;
- verrouillage par rotation.

Le dessin ne donne pas l'amplitude angulaire disponible.

---

# 21. Joint cylindrique équivalent

Les deux liaisons précédentes peuvent être implémentées de deux manières équivalentes dans une maquette simplifiée :

### Option A — deux joints en série

```text
PLATFORM_3
  -> PRISMATIC_Z
  -> REVOLUTE_Z
  -> BOX_1
```

### Option B — joint cylindrique

```text
CYLINDRICAL_JOINT(axis=Z)
DOF = [translation_Z, rotation_Z]
```

Le croquis ne permet pas de savoir si les deux mouvements sont réalisés par un seul organe mécanique ou par deux actionneurs séparés.

---

# 22. `BOX_1`

`BOX_1` est le volume rectangulaire situé sous le mécanisme fin de `PLATFORM_3`.

Relation mécanique :

```text
FINE_DOCKING_STAGE_OUTPUT --FIXED--> BOX_1
```

`BOX_1` se déplace donc :

- verticalement avec `FINE_Z` ;
- en rotation autour de `Z` avec `FINE_RZ`.

Aucun mouvement interne propre à `BOX_1` n'est dessiné.

---

# 23. `BOX_2`

`BOX_2` est le volume rectangulaire immédiatement sous `BOX_1`, fixé au sommet de la bouée.

Relation mécanique :

```text
BUOY_UPPER_BODY --FIXED--> BOX_2
```

Dans la configuration représentée :

- `BOX_1` et `BOX_2` sont coaxiales ou presque coaxiales ;
- leurs faces de contact sont horizontales ;
- `BOX_1` est au-dessus de `BOX_2` ;
- la translation verticale permet théoriquement de les mettre en contact.

---

# 24. Interface temporaire `BOX_1 <-> BOX_2`

Créer une interface de docking à deux états :

```text
BOX_DOCK.state = OPEN | LOCKED
```

## État `OPEN`

```text
BOX_1 independent from BOX_2
```

Le bâti mobile peut se repositionner et le mécanisme fin peut déplacer `BOX_1`.

## État `LOCKED`

Une liaison temporaire est créée entre les deux boîtes.

Le type exact de verrouillage n'est pas indiqué.

Pour une première maquette :

```text
BOX_1 <-> BOX_2 = DETACHABLE_FIXED_JOINT
```

à marquer comme **hypothèse de modélisation**.

Le système réel pourrait conserver du jeu ou certains degrés de liberté.

---

# 25. Bouée

La bouée est un corps flottant indépendant situé sous le mécanisme de docking **avant la fermeture de P2**. Après fermeture, ses flancs sont en contact avec les organes de centrage de P2 ; `BOX_2` reste solidaire de la bouée.

Sa géométrie visible comporte :

1. une partie supérieure approximativement verticale ;
2. une zone de largeur approximativement constante autour du niveau de `PLATFORM_2` ;
3. une transition évasée/conique vers une partie inférieure plus étroite ;
4. une partie inférieure verticale.

L'axe principal de la bouée est :

```text
BUOY_AXIS ≈ Z
```

Aucune articulation interne n'est dessinée.

---

# 26. Diamètre supérieur de la bouée

Une annotation `D Ø 1 m` / `Ø 1 m` apparaît sous la zone centrale.

L'interprétation la plus probable est que la partie supérieure de la bouée située au voisinage de `PLATFORM_2` possède un diamètre de l'ordre de :

```text
BUOY_UPPER_DIAMETER ≈ 1 m
```

La notation manuscrite doit toutefois être validée si cette cote est critique pour la CAO finale.

---

# 27. Centrage commandé `PLATFORM_2` / bouée

La fonction de centrage est confirmée par la correction de conception : **P2 se referme sur la bouée par vérins une fois au bon niveau**.

Séquence nécessaire :

1. bouée à altitude constante, P2 ouverte et suspendue au-dessus ;
2. extension des trois vérins de suspension pour abaisser P2/P3 et régler l’assiette jusqu’au niveau de la bouée ;
3. fermeture des organes de P2 par les vérins de centrage ;
4. contacts radiaux et centrage commun de P2, P3 et de la bouée ;
5. maintien du centrage pendant les mouvements fins de `BOX_1` ;
6. après déverrouillage des boîtes et remontée de `BOX_1`, ouverture de P2 pour libérer la bouée.

```text
PLATFORM_2_FRAME -> P2_CENTERING_CYLINDERS -> P2_CLOSING_MEMBERS
P2_CLOSING_MEMBERS <-> BUOY_UPPER_BODY = CONTROLLED_RADIAL_CENTERING_CONTACT
centerline(PLATFORM_2_FRAME) ≈ centerline(PLATFORM_3) ≈ centerline(BUOY)
```

Le centrage dans les deux directions horizontales est recherché. La géométrie réelle des contacts, le nombre de vérins, le maintien axial, la reprise d’effort et le blocage du lacet restent à préciser. Ne pas assimiler ce contact radial à un encastrement complet en six degrés de liberté.

---

# 28. Géométrie 3D de `PLATFORM_2` et de sa fermeture

P2 doit comporter une structure porteuse entourant la bouée de diamètre voisin de `1 m`, des organes mobiles de fermeture et leurs vérins.

Le principe de fermeture est confirmé, mais plusieurs réalisations restent possibles : demi-colliers coulissants, demi-cadres articulés ou mors répartis autour du passage. Le croquis et la correction ne permettent pas de choisir la réalisation réelle.

Pour l’animation :

- cadre porteur annulaire fixe avec passage initial suffisamment large ;
- deux demi-colliers à surfaces intérieures semi-circulaires ;
- deux glissières horizontales opposées suivant X local ;
- deux vérins horizontaux commandant une fermeture synchronisée ;
- contact radial avec la partie supérieure de la bouée lorsque les demi-colliers sont fermés.

Ce choix permet de montrer le centrage dans le plan horizontal sans modifier la liaison rigide P2/P3. Les dimensions et la fermeture synchronisée sont des **hypothèses d’animation**. La bouée est recentrée **horizontalement** pendant la fermeture et conserve son altitude ; son mouvement radial réel dépendrait des efforts et de la flottabilité, non simulés.

```text
P2 closing members may contact BUOY_UPPER_BODY without penetration
P2 frame / uprights / P3 remain rigidly connected
centering cylinders are additional to the 3 suspension cylinders
```

---

# 29. Répartition spatiale des trois vérins

Le dessin montre deux vérins dans le plan `XZ` et annonce un total de trois.

La reconstruction 3D doit donc éviter de placer arbitrairement trois vérins strictement superposés dans le même plan.

Une géométrie raisonnable consiste à distribuer les points d'ancrage autour de l'axe vertical du système.

Exemple de paramétrage, uniquement comme hypothèse :

```text
azimuth(CYLINDER_1) = 0°
azimuth(CYLINDER_2) ≈ 120°
azimuth(CYLINDER_3) ≈ 240°
```

Mais le croquis n'impose pas ces angles.

Il est également possible que deux vérins soient placés d'un côté et un troisième de l'autre, ou selon une géométrie triangulaire non équilatérale.

---

# 30. Types d'articulation des vérins en 3D

Les cercles visibles aux extrémités des vérins sont compatibles avec des pivots dans la vue 2D.

Cependant, si la plateforme mobile peut prendre du roulis et du tangage, des pivots simples tous parallèles seraient probablement insuffisants.

Pour une reconstruction fonctionnelle 3D, utiliser par défaut :

```text
upper_joint_i = SPHERICAL or UNIVERSAL
lower_joint_i = SPHERICAL or UNIVERSAL
```

jusqu'à obtention d'informations plus précises.

Alternative simplifiée pour une animation 2D :

```text
upper_joint_i = REVOLUTE(axis=Y)
lower_joint_i = REVOLUTE(axis=Y)
```

---

# 31. Degrés de liberté intentionnels du bâti mobile

Le mécanisme semble vouloir déplacer `LOWER_MOVING_FRAME` par rapport à `PLATFORM_1`.

Intention fonctionnelle plausible :

```text
DOF_controlled_by_3_cylinders ≈
    Z translation
    rotation about X
    rotation about Y
```

soit :

```text
[heave, roll, pitch]
```

Cette interprétation est cohérente avec un système de compensation de houle/orientation.

Elle ne doit pas être confondue avec la mobilité réelle d'un modèle de trois jambes SPS non guidées.

---

# 32. Degrés de liberté du mécanisme fin

En plus du mouvement grossier du bâti :

```text
FINE_STAGE_DOF = [translation_Z, rotation_Z]
```

Le système possède donc trois fonctions successives :

### Niveau grossier

Trois vérins :

- hauteur ;
- assiette ;
- maintien de la cage de docking autour de la bouée.

### Centrage intermédiaire confirmé

Fermeture de `PLATFORM_2` par vérins supplémentaires :

- contact radial sur la bouée ;
- centrage commun de P2, P3 et de la bouée ;
- maintien de ce centrage pendant le docking fin.

### Niveau fin

Mécanisme sous `PLATFORM_3` :

- translation axiale ;
- rotation azimutale ;
- mise en contact précise de `BOX_1` et `BOX_2`.

---

# 33. Graphe cinématique synthétique

```text
WORLD
│
├── PLATFORM_1
│   │
│   ├── LONGERON_SUPPORTS
│   │   └── FIXED
│   │
│   ├── LONGERON
│   │   └── FIXED relative to PLATFORM_1
│   │
│   ├── C1_UP
│   │   └── CYLINDER_1_BODY
│   │       └── C1_PRISMATIC
│   │           └── CYLINDER_1_ROD
│   │               └── C1_LOW
│   │                   └── LOWER_MOVING_FRAME
│   │
│   ├── C2_UP
│   │   └── CYLINDER_2_BODY
│   │       └── C2_PRISMATIC
│   │           └── CYLINDER_2_ROD
│   │               └── C2_LOW
│   │                   └── LOWER_MOVING_FRAME
│   │
│   └── C3_UP
│       └── CYLINDER_3_BODY
│           └── C3_PRISMATIC
│               └── CYLINDER_3_ROD
│                   └── C3_LOW
│                       └── LOWER_MOVING_FRAME
│
├── LOWER_MOVING_FRAME
│   │
│   ├── PLATFORM_2_FRAME
│   │   └── P2_CENTERING_CYLINDERS
│   │       └── P2_CLOSING_MEMBERS
│   │           └── controlled radial contact with BUOY_UPPER_BODY
│   ├── FRAME_UPRIGHTS
│   └── PLATFORM_3
│       │
│       └── FINE_Z : PRISMATIC(axis=Z)
│           └── FINE_RZ : REVOLUTE(axis=Z)
│               └── BOX_1
│
└── BUOY_ASSEMBLY
    │
    ├── BUOY_MAIN_BODY
    ├── BUOY_UPPER_BODY
    └── BOX_2
        └── FIXED relative to BUOY
```

Interface temporaire :

```text
BOX_1 <---- detachable docking ----> BOX_2
```

Interface commandée de fermeture/centrage, confirmée par correction de conception :

```text
P2_CLOSING_MEMBERS <---- OPEN / CENTERED radial contact ----> BUOY_UPPER_BODY
```

---

# 34. Matrice des liaisons

| Parent | Enfant | Type de liaison | Axe / DOF | Statut |
|---|---|---|---|---|
| `PLATFORM_1` | `LONGERON_SUPPORTS` | Encastrement | 0 DOF | visible/probable |
| `LONGERON_SUPPORTS` | `LONGERON` | Encastrement | 0 DOF | visible/probable |
| `PLATFORM_1` | `CYLINDER_1_BODY` | articulation `C1_UP` | pivot Y en 2D / rotule-cardan en 3D | visible |
| `CYLINDER_1_BODY` | `CYLINDER_1_ROD` | glissière `C1_PRISMATIC` | axe local vérin | visible par géométrie télescopique |
| `CYLINDER_1_ROD` | `PLATFORM_2` | articulation `C1_LOW` | pivot Y en 2D / rotule-cardan en 3D | visible |
| `PLATFORM_1` | `CYLINDER_2_BODY` | articulation `C2_UP` | pivot Y en 2D / rotule-cardan en 3D | visible |
| `CYLINDER_2_BODY` | `CYLINDER_2_ROD` | glissière `C2_PRISMATIC` | axe local vérin | visible par géométrie télescopique |
| `CYLINDER_2_ROD` | `PLATFORM_2` | articulation `C2_LOW` | pivot Y en 2D / rotule-cardan en 3D | visible |
| `PLATFORM_1` | `CYLINDER_3_BODY` | articulation `C3_UP` | inconnu | existence certaine, géométrie cachée |
| `CYLINDER_3_BODY` | `CYLINDER_3_ROD` | glissière `C3_PRISMATIC` | axe local vérin | existence suggérée par « 3 vérins » |
| `CYLINDER_3_ROD` | `PLATFORM_2` | articulation `C3_LOW` | inconnu | existence certaine, géométrie cachée |
| `PLATFORM_2` | `FRAME_UPRIGHTS` | Encastrement | 0 DOF | très probable |
| `FRAME_UPRIGHTS` | `PLATFORM_3` | Encastrement | 0 DOF | très probable |
| `PLATFORM_3` | `FINE_STAGE_SLIDER` | Glissière `FINE_Z` | Z | visible via flèches |
| `FINE_STAGE_SLIDER` | `FINE_STAGE_ROTATOR` | Pivot `FINE_RZ` | Z | visible via flèche courbe |
| `FINE_STAGE_ROTATOR` | `BOX_1` | Encastrement | 0 DOF | probable |
| `BUOY_MAIN_BODY` | `BOX_2` | Encastrement | 0 DOF | visible/probable |
| `BOX_1` | `BOX_2` | liaison désaccouplable | exact DOF verrouillé inconnu | fonctionnellement suggéré |
| `PLATFORM_2_FRAME` | `P2_CLOSING_MEMBERS` | guidage commandé par vérins supplémentaires | fermeture / ouverture, axes exacts inconnus | fonction confirmée ; géométrie illustrative |
| `P2_CLOSING_MEMBERS` | `BUOY_UPPER_BODY` | contact radial commandé | centrage X/Y ; maintien axial et lacet inconnus | confirmé par correction de conception |

---

# 35. Symboles de liaison visibles

## Suspension principale

1. cercle d'ancrage supérieur du vérin gauche ;
2. cercle d'ancrage inférieur du vérin gauche ;
3. cercle d'ancrage supérieur du vérin droit ;
4. cercle d'ancrage inférieur du vérin droit ;
5. troisième vérin annoncé mais ses articulations ne sont pas séparément visibles.

## Mécanisme fin

6. flèches verticales indiquant un mouvement de translation sous `PLATFORM_3` ;
7. flèche courbe indiquant une rotation axiale du même ensemble terminal.

## Interface terminale

8. proximité/coaxialité `BOX_1` / `BOX_2`, suggérant une interface temporaire de docking.

---

# 36. Éléments qui ne sont PAS automatiquement des articulations

Ne pas interpréter comme joints :

- les bords doubles de `PLATFORM_1` ;
- les bords doubles de `PLATFORM_2` ;
- les bords doubles de `PLATFORM_3` ;
- les montants verticaux entre plateformes 2 et 3 ;
- les supports du longeron ;
- les intersections graphiques avec la bouée ;
- les contours du corps de bouée ;
- la ligne d'axe pointillée centrale ;
- les traits de cote `1 m`, `3–4 m` et `Ø 1 m`.

---

# 37. Contraintes importantes de reconstruction 3D

## 37.1 Ne pas rendre les trois vérins coplanaires par défaut

Le croquis est une projection.

Le système réel doit être capable de reprendre des efforts tridimensionnels.

Le troisième vérin doit donc être placé suivant une géométrie spatiale cohérente.

## 37.2 Ne pas faire pénétrer `PLATFORM_2` dans la bouée

Prévoir un dégagement central lorsque P2 est ouverte. Lors de la fermeture, les organes mobiles atteignent les flancs de la bouée sans les pénétrer. Le contact est intentionnel et assure le centrage.

## 37.3 Conserver la rigidité `PLATFORM_2` / `PLATFORM_3`

Le cadre porteur de P2, les montants et P3 forment un bâti rigide commun. Les organes de fermeture de P2 restent mobiles relativement à ce cadre.

## 37.4 Conserver les deux DOF du mécanisme fin

`BOX_1` doit pouvoir :

- se déplacer suivant `Z` ;
- tourner autour de `Z`.

## 37.5 Ne pas sur-contraindre les vérins

Si les extrémités sont modélisées comme pivots simples, vérifier que les axes et mouvements sont compatibles avec les inclinaisons nécessaires.

Pour une géométrie spatiale, des rotules/cardans sont préférables.

---

# 38. Contraintes géométriques d'alignement des boîtes

Avant contact :

```text
centerline(BOX_1) ≈ centerline(BOX_2)
normal(contact_face_BOX_1) ≈ -normal(contact_face_BOX_2)
```

Les trois vérins de suspension s’étendent pour abaisser P2 au niveau de la bouée, dont l’altitude reste constante, et règlent l’assiette. Les vérins de fermeture de P2 réalisent ensuite le centrage radial sur la bouée, ce qui centre également P3. Le mécanisme fin peut alors absorber l’erreur axiale et azimutale résiduelle.

Puis :

```text
FINE_Z -> close axial gap
FINE_RZ -> match azimuthal orientation
```

---

# 39. Séquence fonctionnelle de docking corrigée

La fermeture de P2 est une étape confirmée, préalable au docking fin. Les durées restent libres.

```text
STATE_0_FREE
    PLATFORM_2 open above buoy; buoy altitude constant
STATE_1_FRAME_DESCENT
    3 suspension cylinders extend and lower P2 / P3 toward stationary-height buoy
STATE_2_COARSE_POSITIONING
    extend suspension cylinders to reach buoy level and correct frame attitude
STATE_3_PLATFORM2_CLOSING
    additional centering cylinders close PLATFORM_2 around buoy
STATE_4_CENTERED
    radial contacts maintained; P2 / P3 / buoy centerlines coincide
STATE_5_FINE_VERTICAL_APPROACH
    FINE_Z moves BOX_1 toward BOX_2 while P2 remains closed
STATE_6_FINE_ROTATIONAL_ALIGNMENT
    FINE_RZ matches BOX_1 orientation to BOX_2
STATE_7_INTERFACE_CONTACT
    mating faces of BOX_1 and BOX_2 contact
STATE_8_DOCKED
    BOX_DOCK temporary lock engaged; P2 centering maintained
STATE_9_BOX_UNLOCK
    release BOX_DOCK; keep P2 closed
STATE_10_BOX_RETRACTION
    retract BOX_1 fully before releasing buoy centering
STATE_11_PLATFORM2_OPENING
    centering cylinders open P2 and release buoy
STATE_12_FRAME_CLEARANCE
    retract suspension cylinders to raise frame after full opening of P2
    buoy altitude remains constant throughout the cycle
```

Dans l’animation, empêcher la fermeture avant le bon niveau et la bonne assiette, la descente de `BOX_1` avant le centrage, et l’ouverture de P2 tant que `BOX_1` n’est pas remontée. Les commandes de hauteur du bâti sont immobilisées pendant la fermeture pour conserver le contact choisi. La hauteur de la bouée est constante, sans commande verticale dans l’animation ; ces choix ne certifient pas un blocage axial réel du dispositif.

---

# 40. Niveaux de certitude

## `CONFIRMED_BY_DESIGN_CLARIFICATION`

- les trois vérins de suspension s’étendent pour abaisser P2/P3 jusqu’à la bouée ;
- la bouée conserve son altitude pendant tout le cycle illustratif ;
- P2 se referme sur la bouée au moyen de vérins supplémentaires ;
- la fermeture intervient une fois P2 au bon niveau ;
- elle assure le centrage commun de P2, P3 et de la bouée avant le docking fin ;
- le contact P2/bouée est fonctionnel et commandé, il n’est plus optionnel ;
- le nombre, la disposition et les courses des vérins de centrage restent inconnus.

## `CERTAIN_FROM_DRAWING`

- existence de `PLATFORM_1` ;
- existence du longeron ;
- présence de supports du longeron ;
- existence de `PLATFORM_2` ;
- existence de `PLATFORM_3` ;
- présence de montants entre plateformes 2 et 3 ;
- présence de deux vérins visibles ;
- annotation indiquant un total de trois vérins ;
- présence d'articulations circulaires aux extrémités des deux vérins visibles ;
- caractère télescopique des vérins ;
- mécanisme vertical central sous `PLATFORM_3` ;
- translation verticale indiquée par flèches ;
- rotation axiale indiquée par flèche courbe ;
- existence de `BOX_1` ;
- existence de `BOX_2` ;
- existence de la bouée ;
- cote horizontale `1 m` de part et d'autre de la zone centrale ;
- ordre de grandeur vertical `3–4 m` indiqué ;
- annotation de diamètre voisin de `1 m` sur la partie supérieure de la bouée.

## `HIGH_CONFIDENCE_3D_INTERPRETATION`

- longeron cylindrique suivant `Y` ;
- `PLATFORM_2` et `PLATFORM_3` forment un bâti rigide commun ;
- le troisième vérin est décalé suivant `Y` et donc occulté dans la projection ;
- les vérins permettent un positionnement grossier du bâti inférieur ;
- le mécanisme fin réalise une translation `Z` et une rotation `Z` ;
- `BOX_1` et `BOX_2` constituent une interface d'accouplement ;
- la bouée reste indépendante avant la fermeture de P2, puis radialement centrée avant le docking des boîtes.

## `PLAUSIBLE_BUT_NOT_PROVEN`

- trois vérins répartis à environ `120°` ;
- articulations de vérins réalisées par rotules ou cardans ;
- contrôle principal `[heave, roll, pitch]` ;
- réalisation de la fermeture par deux demi-colliers et deux vérins opposés ;
- mécanisme fin réalisé par un joint cylindrique unique ;
- verrouillage rigide complet de `BOX_1` sur `BOX_2` ;
- présence d'un guide passif caché supprimant les DOF parasites du bâti mobile.

---

# 41. Informations explicitement inconnues

Ne pas halluciner les paramètres suivants :

- longueur exacte de `PLATFORM_1` ;
- largeur suivant `Y` de chaque plateforme ;
- diamètre exact du longeron ;
- longueur du longeron suivant `Y` ;
- coordonnées 3D des ancrages des trois vérins ;
- angle azimutal exact entre vérins ;
- course des vérins ;
- diamètre des tiges de vérin ;
- angle maximal des articulations ;
- type exact des articulations supérieures et inférieures ;
- présence ou absence d'un guidage passif supplémentaire ;
- course de `FINE_Z` ;
- amplitude de `FINE_RZ` ;
- nature de l'actionneur du mécanisme fin ;
- géométrie exacte des organes de fermeture de `PLATFORM_2` ;
- nombre et disposition des vérins de fermeture/centrage ;
- course et effort de ces vérins ;
- maintien axial, frottement et blocage du lacet au contact P2/bouée ;
- jeu radial entre la bouée et `PLATFORM_2` ;
- nature mécanique/électrique de `BOX_1` et `BOX_2` ;
- type exact de verrouillage ;
- masses ;
- centres de gravité ;
- rigidités ;
- amortissements ;
- efforts admissibles ;
- ordre exact des opérations de docking.

---

# 42. Modèle machine-oriented proposé

```yaml
system:
  frame:
    X: drawing_right
    Y: out_of_drawing_plane
    Z: drawing_up

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
    - P2_CLOSING_MEMBER_i
    - P2_CENTERING_CYLINDER_BODY_i
    - P2_CENTERING_CYLINDER_ROD_i
    - FRAME_UPRIGHTS
    - PLATFORM_3
    - FINE_STAGE_SLIDER
    - FINE_STAGE_ROTATOR
    - BOX_1
    - BUOY_MAIN_BODY
    - BUOY_UPPER_BODY
    - BOX_2

  dimensions_from_sketch:
    lower_platform_left_extension_m: 1.0
    lower_platform_right_extension_m: 1.0
    buoy_upper_diameter_m: 1.0
    main_vertical_clearance_m:
      min: 3.0
      max: 4.0
      exact_reference_points: UNKNOWN

  permanent_joints:
    - parent: PLATFORM_1
      child: LONGERON_SUPPORTS
      type: FIXED
      confidence: high

    - parent: LONGERON_SUPPORTS
      child: LONGERON
      type: FIXED
      confidence: high

    - parent: PLATFORM_2_FRAME
      child: FRAME_UPRIGHTS
      type: FIXED
      confidence: high

    - parent: FRAME_UPRIGHTS
      child: PLATFORM_3
      type: FIXED
      confidence: high

    - parent: FINE_STAGE_ROTATOR
      child: BOX_1
      type: FIXED
      confidence: medium_high

    - parent: BUOY_MAIN_BODY
      child: BUOY_UPPER_BODY
      type: FIXED
      confidence: high

    - parent: BUOY_UPPER_BODY
      child: BOX_2
      type: FIXED
      confidence: high

  suspension_cylinders:
    count: 3
    count_confidence: certain_from_annotation

    cylinder_1:
      visible: true
      upper_joint:
        observed_2d_type: REVOLUTE
        observed_axis: Y
        preferred_3d_type: SPHERICAL_OR_UNIVERSAL
      actuator:
        type: PRISMATIC
        axis: LOCAL_CYLINDER_AXIS
      lower_joint:
        observed_2d_type: REVOLUTE
        observed_axis: Y
        preferred_3d_type: SPHERICAL_OR_UNIVERSAL

    cylinder_2:
      visible: true
      upper_joint:
        observed_2d_type: REVOLUTE
        observed_axis: Y
        preferred_3d_type: SPHERICAL_OR_UNIVERSAL
      actuator:
        type: PRISMATIC
        axis: LOCAL_CYLINDER_AXIS
      lower_joint:
        observed_2d_type: REVOLUTE
        observed_axis: Y
        preferred_3d_type: SPHERICAL_OR_UNIVERSAL

    cylinder_3:
      visible: false_or_occluded
      existence: certain_from_annotation
      geometry: UNKNOWN
      upper_joint:
        preferred_3d_type: SPHERICAL_OR_UNIVERSAL
      actuator:
        type: PRISMATIC
        axis: LOCAL_CYLINDER_AXIS
      lower_joint:
        preferred_3d_type: SPHERICAL_OR_UNIVERSAL

    azimuth_distribution:
      exact: UNKNOWN
      symmetric_120deg_option:
        allowed_as_design_hypothesis: true
        confidence: low_to_medium

  lower_moving_frame:
    members:
      - PLATFORM_2_FRAME
      - FRAME_UPRIGHTS
      - PLATFORM_3
    frame_internal_motion: none
    frame_treated_as_rigid: true
    closing_members_move_relative_to_frame: true

  vertical_approach:
    moving_body: LOWER_MOVING_FRAME
    lowering_action: EXTEND_THREE_SUSPENSION_CYLINDERS
    raising_action: RETRACT_THREE_SUSPENSION_CYLINDERS
    buoy_altitude_during_cycle: CONSTANT
    animation_start_frame_height_above_capture_m: 1.2
    animation_suspension_stroke_max_m: 1.5
    animation_suspension_stroke_at_capture_m: 1.3
    dimensions_status: ILLUSTRATIVE_NOT_CERTIFIED

  intended_coarse_motion:
    probable_controlled_dof:
      - translation_Z
      - rotation_X
      - rotation_Y
    confidence: medium
    warning: >-
      Three SPS-type legs alone do not necessarily fully constrain a 6-DOF rigid body.
      Additional passive constraints or guides may be required but are not shown.

  fine_stage:
    parent: PLATFORM_3
    joints:
      - id: FINE_Z
        type: PRISMATIC
        axis: Z
        confidence: high
      - id: FINE_RZ
        type: REVOLUTE
        axis: Z
        confidence: high
    equivalent_joint_option:
      type: CYLINDRICAL
      axis: Z
      dof:
        - translation_Z
        - rotation_Z

  temporary_constraints:
    - id: BOX_DOCK
      body_a: BOX_1
      body_b: BOX_2
      states:
        - OPEN
        - LOCKED
      preferred_initial_locked_model: FIXED
      exact_locked_dof: UNKNOWN

  platform2_centering_stage:
    function: CONFIRMED_BY_DESIGN_CLARIFICATION
    parent: PLATFORM_2_FRAME
    actuator_type: ADDITIONAL_CYLINDERS
    actual_cylinder_count: UNKNOWN
    actual_geometry: UNKNOWN
    states: [OPEN, CLOSING, CENTERED, OPENING]
    prerequisites:
      - correct_height_relative_to_buoy
      - suitable_frame_attitude
    centered_result:
      - common_centerline_PLATFORM_2_PLATFORM_3_BUOY
      - maintained_radial_contact
    axial_restraint: UNKNOWN
    yaw_restraint: UNKNOWN
    animation_hypothesis:
      closing_members: TWO_TRANSLATING_SEMICOLLARS
      cylinders: TWO_OPPOSED_HORIZONTAL_CYLINDERS
      synchronized: true
      stroke_m: 0.16
      release_after: BOX_1_FULL_RETRACTION

  controlled_contacts:
    - id: PLATFORM2_BUOY_CAPTURE
      body_a: P2_CLOSING_MEMBER_i
      body_b: BUOY_UPPER_BODY
      status: CONFIRMED_RADIAL_CENTERING
      active_when: PLATFORM2_CAPTURE_CENTERED
      full_fixed_joint: NOT_PROVEN

  geometric_constraints:
    - PLATFORM_2 must not penetrate BUOY_MAIN_BODY
    - PLATFORM_2 must be open for buoy entry and release
    - PLATFORM_2 must close by additional cylinders after coarse positioning
    - PLATFORM_2_PLATFORM_3_BUOY must share a centerline before fine docking
    - PLATFORM_2 must remain centered until BOX_1 is retracted
    - PLATFORM_2 closing members contact buoy without penetration
    - CYLINDER_3 should not be placed coplanar by default merely because the source is 2D
    - BOX_1 must be vertically alignable with BOX_2
    - BOX_1 must be rotatable about Z relative to PLATFORM_3
    - BOX_1 and BOX_2 mating normals must oppose at docking contact
    - LOWER_MOVING_FRAME load-bearing frame must stay rigid while P2 closing members move
    - LONGERON circular view should be interpreted as cylinder cross-section, not sphere
```

---

# 43. Contrôle final des éléments visibles

Avant de générer une maquette 3D, vérifier explicitement que les éléments suivants sont présents :

1. `PLATFORM_1` en partie supérieure ;
2. longeron cylindrique sous sa partie gauche ;
3. supports entre longeron et plateforme ;
4. trois vérins de suspension dans le modèle, même si seulement deux sont visibles en projection, en plus des vérins de fermeture de P2 ;
5. articulation supérieure et inférieure de chaque vérin ;
6. glissière interne pour chaque vérin ;
7. `PLATFORM_2` autour de la zone supérieure de la bouée ;
8. environ `1 m` d'extension latérale visible de chaque côté de la zone centrale ;
9. montants rigides entre `PLATFORM_2` et `PLATFORM_3` ;
10. `PLATFORM_3` au-dessus des boîtes ;
11. mécanisme central de translation verticale ;
12. mécanisme central de rotation autour de l'axe vertical ;
13. `BOX_1` mobile avec le mécanisme fin ;
14. `BOX_2` solidaire de la bouée ;
15. partie supérieure de bouée de diamètre indiqué proche de `1 m` ;
16. ordre de grandeur vertical `3–4 m` conservé comme cote approximative ;
17. ouverture ou dégagement de `PLATFORM_2` autour de la bouée ;
18. organes mobiles et vérins supplémentaires fermant P2 sur la bouée au bon niveau ;
19. interface `BOX_1/BOX_2` modélisée comme liaison temporaire ;
20. troisième dimension `Y` réellement utilisée pour disposer les trois vérins et la structure ;
21. centrage commun de P2, P3 et de la bouée après fermeture de P2 ;
22. maintien de P2 fermée pendant le docking fin ;
23. retrait de BOX_1 puis réouverture de P2 avant le dégagement du bâti ;
24. altitude constante de la bouée, descente de P2/P3 par extension des vérins ;
25. remontée du bâti par rétraction des vérins après ouverture de P2.

---

# 44. Résumé minimal à transmettre à un générateur 3D

Créer une grande `PLATFORM_1` rigide portant un longeron cylindrique sous sa partie gauche. Le bâti mobile inférieur comprend le cadre porteur de `PLATFORM_2`, des montants rigides et `PLATFORM_3`. Trois vérins télescopiques de suspension, articulés aux deux extrémités, **s’étendent pour abaisser P2/P3 jusqu’à la bouée dont l’altitude reste constante**, et règlent son assiette ; le troisième vérin doit être placé hors du plan de projection. Les rotules/cardans sont une hypothèse 3D recommandée et les guides passifs réels restent inconnus.

**Une fois au bon niveau, P2 se referme sur la bouée au moyen de vérins supplémentaires de fermeture/centrage.** Ces vérins sont distincts des trois vérins de suspension. Le contact radial centre la bouée d’environ `Ø 1 m` avec P2 et P3, cette dernière étant solidaire du cadre de P2 par les montants. Le nombre, le guidage, la disposition et la course des organes de fermeture ne sont pas connus. Pour l’animation, deux demi-colliers coulissants et deux vérins horizontaux opposés sont un choix illustratif. Ne pas assimiler le centrage radial à un encastrement complet non confirmé.

P2 reste fermée pendant les mouvements fins sous P3 : translation locale `FINE_Z` et rotation locale `FINE_RZ` de `BOX_1`. `BOX_2` reste fixée à la bouée. Après alignement, les deux boîtes entrent en contact et se verrouillent temporairement. Pour la libération : déverrouiller les boîtes, remonter BOX_1, ouvrir P2 puis rétracter les vérins de suspension pour remonter le bâti, la bouée restant à altitude constante. Conserver environ `1 m` d’extension latérale depuis chaque flanc de bouée et l’ordre de grandeur vertical `3–4 m`, en distinguant les cotes du croquis des dimensions choisies pour l’animation.
