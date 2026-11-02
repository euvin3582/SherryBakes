// Recipe data. Add an image at images/<id>.jpg for each recipe.
const RECIPES = [
  {
    id: "avocado-banana-bread",
    title: "Avocado Banana Bread",
    blurb: "Avocado stands in for butter, so this loaf comes out impossibly moist.",
    tags: ["avocado", "bread", "sweet", "gluten-free"],
    time: "70 min", serves: "10 slices",
    nutrition: { kcal: 210, protein: "5g", fiber: "4g", sugar: "11g" },
    ingredients: [
      "1 large ripe avocado (about 150g flesh)",
      "3 very ripe bananas, mashed",
      "2 eggs",
      "1/3 cup maple syrup or honey",
      "1 tsp vanilla extract",
      "1 3/4 cups oat flour (certified gluten-free) or almond flour",
      "1 tsp baking soda",
      "1 tsp cinnamon",
      "1/4 tsp salt",
      "1/2 cup walnuts or dark chocolate chips (optional)"
    ],
    steps: [
      "Heat the oven to 175°C / 350°F and line a 9×5\" loaf pan with parchment.",
      "Blend the avocado until completely smooth, then whisk in the bananas, eggs, maple syrup and vanilla.",
      "In another bowl, mix the oat flour, baking soda, cinnamon and salt.",
      "Fold the dry ingredients into the wet until just combined, then fold in the nuts or chips.",
      "Pour into the pan and bake 50–60 minutes, until a skewer comes out clean.",
      "Cool 15 minutes in the pan, then lift out and cool fully before slicing."
    ],
    tip: "Blend the avocado completely smooth. Any lumps will show up as green flecks."
  },
  {
    id: "brown-rice-sandwich-loaf",
    title: "Brown Rice Sandwich Loaf",
    blurb: "A soft, sliceable gluten-free bread with real structure, thanks to psyllium.",
    tags: ["rice", "bread", "gluten-free"],
    time: "3 hrs", serves: "1 loaf",
    nutrition: { kcal: 150, protein: "3g", fiber: "5g", sugar: "2g" },
    ingredients: [
      "300g brown rice flour",
      "100g tapioca starch",
      "100g potato starch",
      "25g whole psyllium husk (or 20g powder)",
      "2 1/4 tsp (7g) instant yeast",
      "1 1/2 tsp salt",
      "1 tbsp honey or maple syrup",
      "2 tbsp olive oil",
      "1 tsp apple cider vinegar",
      "520ml warm water (about 38°C)"
    ],
    steps: [
      "Whisk the psyllium into the warm water with the honey and yeast. Let it sit 10 minutes until it thickens into a gel.",
      "In a large bowl, whisk the rice flour, both starches and the salt.",
      "Add the gel, oil and vinegar. Mix 3–4 minutes with a stand mixer or a sturdy spatula until you have a thick, cohesive dough.",
      "Shape it into a log with wet hands and place it in an oiled 9×5\" loaf pan.",
      "Cover and let rise 60–75 minutes, until it crowns just above the pan.",
      "Bake at 220°C / 425°F for 15 minutes, then drop to 200°C / 400°F for 40–45 minutes more. Internal temperature should hit 98°C / 208°F.",
      "Cool completely (at least 2 hours) before slicing. Gluten-free bread keeps setting as it cools."
    ],
    tip: "Weigh your flours. Gluten-free baking is far less forgiving of cup measurements."
  },
  {
    id: "avocado-brownies",
    title: "Fudgy Avocado Brownies",
    blurb: "Rich, dark and glossy, with no butter and no flour.",
    tags: ["avocado", "sweet", "gluten-free"],
    time: "40 min", serves: "16 squares",
    nutrition: { kcal: 160, protein: "4g", fiber: "3g", sugar: "12g" },
    ingredients: [
      "2 ripe avocados (about 300g flesh)",
      "1/2 cup coconut sugar",
      "1/3 cup maple syrup",
      "2 eggs",
      "1 tsp vanilla",
      "1/2 cup unsweetened cocoa powder",
      "1/2 cup almond flour",
      "1/2 tsp baking soda",
      "1/4 tsp salt",
      "1/2 cup 70% dark chocolate chips, plus extra for the top",
      "Flaky sea salt, to finish"
    ],
    steps: [
      "Heat the oven to 175°C / 350°F and line an 8×8\" pan.",
      "Blend the avocado, coconut sugar, maple syrup, eggs and vanilla until silky.",
      "Add the cocoa, almond flour, baking soda and salt. Pulse until just combined.",
      "Stir in the chocolate chips, spread the batter in the pan and scatter extra chips on top.",
      "Bake 25–30 minutes. The center should look just set.",
      "Finish with flaky salt. Chill 1 hour before cutting for the cleanest, fudgiest squares."
    ],
    tip: "Nobody will taste the avocado. The cocoa completely takes over."
  },
  {
    id: "mochi-muffins",
    title: "Coconut Mochi Muffins",
    blurb: "Crisp caramelized edges with a bouncy, chewy center. Naturally gluten-free.",
    tags: ["rice", "sweet", "gluten-free"],
    time: "50 min", serves: "12 muffins",
    nutrition: { kcal: 190, protein: "3g", fiber: "1g", sugar: "10g" },
    ingredients: [
      "2 cups (300g) glutinous rice flour (such as Mochiko; naturally gluten-free)",
      "1/2 cup coconut sugar",
      "1 1/2 tsp baking powder",
      "1/4 tsp salt",
      "1 can (400ml) light coconut milk",
      "2 eggs",
      "2 tbsp melted coconut oil",
      "1 tsp vanilla",
      "Toasted sesame seeds or shredded coconut, for the tops"
    ],
    steps: [
      "Heat the oven to 175°C / 350°F and grease a 12-cup muffin tin well.",
      "Whisk the rice flour, sugar, baking powder and salt.",
      "In a second bowl, whisk the coconut milk, eggs, coconut oil and vanilla.",
      "Combine the two into a smooth, pourable batter.",
      "Fill the cups about 3/4 full and sprinkle sesame or coconut on top.",
      "Bake 40–45 minutes, until deeply golden. Cool 10 minutes before unmolding."
    ],
    tip: "Don't underbake them. The deep golden crust is where all the flavor lives."
  },
  {
    id: "avocado-lime-muffins",
    title: "Avocado Lime Muffins",
    blurb: "Bright, zesty, naturally green, and lightly sweet.",
    tags: ["avocado", "sweet", "gluten-free"],
    time: "35 min", serves: "12 muffins",
    nutrition: { kcal: 175, protein: "5g", fiber: "3g", sugar: "9g" },
    ingredients: [
      "1 ripe avocado",
      "1/2 cup Greek yogurt (or coconut yogurt)",
      "1/3 cup honey",
      "2 eggs",
      "Zest and juice of 2 limes",
      "2 cups almond flour",
      "1/2 cup tapioca starch",
      "1 tsp baking soda",
      "1/4 tsp salt",
      "Glaze: 1/2 cup yogurt + 1 tbsp honey + lime zest"
    ],
    steps: [
      "Heat the oven to 175°C / 350°F and line a muffin tin.",
      "Blend the avocado, yogurt, honey, eggs, lime zest and juice until smooth.",
      "Whisk the almond flour, tapioca, baking soda and salt, then fold them into the wet mix.",
      "Divide among the cups and bake 20–22 minutes.",
      "Cool, then spoon the glaze over the tops and finish with extra zest."
    ],
    tip: "The lime juice keeps the avocado's green color vivid as the muffins bake."
  },
  {
    id: "rice-flour-focaccia",
    title: "Rosemary Rice Flour Focaccia",
    blurb: "Golden, dimpled and olive-oil-drenched, with zero gluten.",
    tags: ["rice", "bread", "gluten-free"],
    time: "2 hrs", serves: "1 tray (12 pieces)",
    nutrition: { kcal: 170, protein: "3g", fiber: "3g", sugar: "1g" },
    ingredients: [
      "250g white rice flour",
      "100g brown rice flour",
      "150g tapioca starch",
      "20g psyllium husk powder",
      "7g instant yeast",
      "1 tsp honey",
      "1 1/2 tsp salt",
      "500ml warm water",
      "60ml extra virgin olive oil, divided",
      "Fresh rosemary, cherry tomatoes and flaky salt for topping"
    ],
    steps: [
      "Whisk the psyllium, yeast and honey into the warm water. Rest 10 minutes.",
      "Mix in the flours, starch, salt and 2 tbsp of the olive oil until you have a sticky, thick dough.",
      "Pour 2 tbsp oil into a 9×13\" pan, add the dough and press it to the edges with oiled hands.",
      "Cover and rise 45–60 minutes, until puffy.",
      "Drizzle the remaining oil, dimple deeply with your fingertips and top with rosemary, tomatoes and flaky salt.",
      "Bake at 220°C / 425°F for 30–35 minutes, until deeply golden. Cool 20 minutes before cutting."
    ],
    tip: "Don't be shy with the olive oil. It gives you crisp edges and a tender interior."
  },
  {
    id: "sweet-potato-rice-rolls",
    title: "Sweet Potato Dinner Rolls",
    blurb: "Pillowy gluten-free rolls with a golden glow and a gentle sweetness.",
    tags: ["rice", "bread", "gluten-free"],
    time: "2 hrs", serves: "10 rolls",
    nutrition: { kcal: 165, protein: "3g", fiber: "4g", sugar: "3g" },
    ingredients: [
      "1 cup mashed roasted sweet potato",
      "200g brown rice flour",
      "120g tapioca starch",
      "50g sorghum flour",
      "15g psyllium husk powder",
      "7g instant yeast",
      "1 tbsp maple syrup",
      "1 tsp salt",
      "300ml warm milk (any kind)",
      "2 tbsp olive oil + 1 egg for wash"
    ],
    steps: [
      "Whisk the psyllium, yeast and maple syrup into the warm milk. Rest 10 minutes.",
      "Add the sweet potato, oil, flours, starch and salt. Mix into a soft, slightly sticky dough.",
      "With oiled hands, shape 10 balls and nestle them in a lined 9\" round pan.",
      "Cover and rise 45–60 minutes.",
      "Brush with beaten egg and bake at 200°C / 400°F for 25–30 minutes.",
      "Brush with a little olive oil or honey butter while they're still warm."
    ],
    tip: "Roast the sweet potato rather than boiling it. You get more flavor and less water."
  },
  {
    id: "avocado-pistachio-cake",
    title: "Avocado Pistachio Olive Oil Cake",
    blurb: "A tender rice flour cake with a pale green crumb and a crackly top.",
    tags: ["avocado", "rice", "sweet", "gluten-free"],
    time: "60 min", serves: "10 slices",
    nutrition: { kcal: 230, protein: "5g", fiber: "3g", sugar: "13g" },
    ingredients: [
      "1 ripe avocado",
      "1/3 cup extra virgin olive oil",
      "1/2 cup honey",
      "3 eggs",
      "Zest of 1 lemon",
      "1 1/4 cups white rice flour",
      "1/2 cup finely ground pistachios",
      "2 tsp baking powder",
      "1/4 tsp salt",
      "Chopped pistachios + a drizzle of honey for the top"
    ],
    steps: [
      "Heat the oven to 170°C / 340°F and line an 8\" round pan.",
      "Blend the avocado, olive oil, honey, eggs and lemon zest until silky and pale.",
      "Whisk the rice flour, ground pistachios, baking powder and salt, then fold them into the wet mix.",
      "Pour into the pan and scatter chopped pistachios on top.",
      "Bake 40–45 minutes, until golden and springy.",
      "Drizzle with warm honey while the cake is still hot."
    ],
    tip: "Rice flour gives this cake a fine, almost velvety crumb, a lot like a classic Italian torta."
  }
];
