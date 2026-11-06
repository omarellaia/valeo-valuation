# Valeo SE — rapport de valorisation

Valorisation au {{valuation_date}} · cours de référence {{price}} au {{price_date}} · montants en M€ sauf mention. Projet de cours, fondé sur les documents publiés par Valeo ; non audité, pas un conseil en investissement. Tous les chiffres de ce rapport sont insérés depuis le modèle.

## Synthèse

**Recommandation : {{verdict}}.**

Dans le scénario base, le DCF donne **{{base_ps}} par action**, contre un cours de {{price}} et un prix d'offre de {{offer}} (prime de contrôle de {{control_premium}}). Le DCF base {{dcf_passes}} le seuil de la règle de décision ({{hurdle}}). Les trois scénarios encadrent la valeur entre {{bear_ps}} (baisse) et {{bull_ps}} (hausse) ; la valeur pondérée par les probabilités est de {{weighted_ps}}.

Trois raisons :

1. La valeur intrinsèque du scénario base dépasse le cours de {{base_vs_price}} : le marché valorise Valeo autour de {{exit_mult}} l'EBITDA (hypothèse du modèle, proche du multiple actuel), un niveau bas pour le secteur.
2. La génération de trésorerie est réelle : FCF 2025 de {{fcf25_before}} avant restructuration et {{fcf25_after}} après intérêts, recoupé au communiqué FY2025.
3. Le levier est maîtrisé : dette nette / EBITDA de {{nd_ebitda_25}} en 2025, dette nette ramenée à {{net_debt_h1}} au 30/06/2026.

Trois risques :

1. Une fois la prime de contrôle payée, la valeur base ne laisse aucune marge ({{base_vs_offer}} vs l'offre).
2. Le levier global du pont (dette, minoritaires, retraites, affacturage : {{claims}}) dépasse la capitalisation ({{market_cap}}) : une baisse modeste de la VE efface les capitaux propres, comme dans le scénario baisse ({{bear_ps}}).
3. La valeur dépend de la valeur terminale ({{base_tv_share}} de la VE) et du CMPC : la grille va de {{grid_low}} à {{grid_high}}.

## Société et secteur

Valeo est un équipementier automobile de premier rang coté sur Euronext Paris. *À compléter depuis le Document d'enregistrement universel 2025 : pôles d'activité tels que définis dans le URD, principaux clients et part du premier client, répartition géographique, position dans le cycle de production automobile.* Aucun chiffre n'est cité ici tant qu'il n'est pas dans `data/clean/`.

## Analyse historique

{{table:history}}

- **Croissance** : le chiffre d'affaires recule depuis 2023 ; le premier semestre 2026 ({{h1_sales}}) ne montre pas de rebond net.
- **Marges** : la marge d'EBITDA progresse chaque année malgré la baisse des volumes ; la marge opérationnelle (définition Valeo) atteint {{h1_om_pct}} au S1 2026 ({{h1_om}}).
- **Endettement** : la dette nette reste entre {{nd_min}} et {{nd_max}} sur la période, et le ratio dette nette / EBITDA baisse avec la hausse de l'EBITDA.

Du EBITDA au free cash flow en 2025 :

{{table:fcf_bridge}}

> Données manquantes pour compléter cette section comme prévu : investissements et R&D capitalisée par année, FCF 2023-2024, ROIC, et un historique sur 5 ans (2021-2022). À ajouter dans `data/clean/valeo_financials.csv`.

## Prévisions et hypothèses

{{table:drivers}}

L'année 2026 sert d'année de base (guidance), non actualisée ; 2027 à 2033 sont actualisées sur 1 à 7 ans. La restructuration est une ligne de coût récurrente, pas un « non récurrent » : elle est déduite chaque année avant l'EBIT. Les investissements incluent la R&D capitalisée. Le BFR, négatif, reste à {{nwc_note}} du CA dans les trois scénarios.

## Coût du capital

{{table:wacc_inputs}}

Le bêta désendetté ({{beta_u}}) est réendetté par la formule de Hamada. Au levier de marché (D/E {{de_market}}), le bêta endetté vaut {{beta_l_market}} et le CMPC {{wacc_market}}. Le modèle remplace ensuite la capitalisation boursière par la valeur DCF des capitaux propres et itère ({{iterations}} itérations) jusqu'à convergence : D/E {{de}}, bêta endetté {{beta_l}}, coût des capitaux propres {{ke}}, coût de la dette après IS {{kd_at}}, **CMPC retenu {{wacc}}**.

> À faire : recouper avec le bêta de régression de Valeo (60 rendements mensuels contre le STOXX Europe 600) et avec une structure cible égale à la médiane des pairs.

## Résultat du DCF

{{table:fcff}}

Somme des FCF actualisés {{base_pv_fcf}}, valeur terminale actualisée {{base_pv_tv}} (g = {{base_g}}), soit une **valeur d'entreprise de {{base_ev}}**. La valeur terminale pèse {{base_tv_share}} de la VE, {{base_tv_comment}}. Elle implique un multiple VE/EBITDA de sortie de {{base_implied_mult}}, cohérent avec le multiple actuel de Valeo.

{{table:bridge}}

La dette nette à la date de valorisation ({{net_debt_val}}) est celle du 30/06/2026 ({{net_debt_h1}}) diminuée du FCF attendu au second semestre ({{fcf_h2}}). Les loyers IFRS 16 sont déduits dans le FCFF, ils ne figurent donc pas une seconde fois dans le pont.

Recoupement par multiple de sortie : à {{exit_mult}} l'EBITDA 2033, la valeur est de {{exit_ps}} par action (croissance perpétuelle implicite {{exit_implied_g}}) ; à {{exit_mult_high}}, {{exit_ps_high}}.

## Comparables

{{comps_status}} Pairs prévus : Forvia, Continental (vérifier l'entité après la scission de 2025), Schaeffler, Aptiv, Autoliv, Lear, Magna. Les multiples seront calculés à partir du cours, du nombre d'actions et de la dette nette, avec la même définition de dette que pour Valeo.

## Sensibilité et scénarios

Valeur par action, scénario base :

{{table:sensitivity}}

{{table:scenarios}}

{{table:football}}

## Risques

- **Cycle de production automobile** : une baisse des volumes agit sur le CA et sur la marge par l'effet de levier opérationnel ; c'est le scénario baisse ({{bear_ps}}).
- **Rythme de l'électrification** : un retard pèse sur la croissance et sur le retour de la R&D capitalisée.
- **Concentration clients** : *à chiffrer depuis le URD*.
- **Levier** : avec {{claims}} de passifs dans le pont, chaque milliard de VE en moins retire {{per_bn_ev}} par action.
- **Droits de douane** : risque sur les volumes et les marges des flux transfrontaliers ; il se lit dans la ligne CMPC × g de la grille.

## Recommandation

Règle fixée avant de lire le résultat : acheter seulement si le DCF base et le point médian des comparables dépassent le prix de référence (prix d'offre {{offer}}) d'au moins {{margin_of_safety}}, soit {{hurdle}}, et si la perte en scénario baisse reste sous {{bear_max_loss}}.

Application : le DCF base ({{base_ps}}) {{dcf_passes}} le seuil ; la perte en scénario baisse ({{bear_loss}}) {{bear_passes}} la limite. {{decision_comment}}

**{{verdict}}.** Ce qui ferait changer d'avis : un prix d'offre plus bas (le seuil baisse avec la prime), un CMPC inférieur d'un point (voir la grille), ou une marge d'EBITDA durablement proche du scénario hausse.

## Annexe

Sources : communiqués de résultats Valeo FY2023, FY2024, FY2025 (p. 10 pour le pont de FCF) et H1 2026 ; notes 5.2, 6.2-6.3 du rapport annuel 2025 ; MarketScreener pour le cours au {{price_date}}. Le détail des sources et des définitions est sur la page Méthode. Modèle de référence : `model/valeo_model.xlsx`.
