// Rotating ads between sections. Every slot shows a different ad, and all slots advance every AD_ROTATE_MS.
// Clicking an ad opens the quote form (leads.js); the lead records which slot and ad were clicked,
// e.g. "between-recipes:loved-ones", plus the photo shown.
// To add or change an ad, edit the ADS list. In a title, \n starts a new line on wide screens.
var AD_ROTATE_MS = 2 * 60 * 1000; // 2 minutes

var ADS = [
  {
    id: 'loved-ones',
    kicker: 'For the people you love',
    title: 'You take care of your health.\nWho takes care of them?',
    body: 'Life insurance helps make sure the people you love are never left with the bills.',
    list: ['Replace your income', 'Pay off the mortgage', 'Cover school and everyday costs'],
    cta: 'Protect my family'
  },
  {
    id: 'living-benefits',
    kicker: 'Living benefits',
    title: 'Coverage you can use\nwhile you’re still living.',
    body: 'Some policies let you access part of your benefit if you face a serious illness, so you can focus on getting well.',
    list: ['Medical bills and copays', 'Time off work', 'Help at home'],
    cta: 'See if you qualify'
  },
  {
    id: 'healthy-rates',
    kicker: 'Healthy habits pay off',
    title: 'Eating well could mean\nlower life insurance rates.',
    body: 'Healthier people often qualify for better prices. Lock in a rate while you’re feeling your best.',
    list: ['Free, no-obligation quote', 'Compare top-rated insurers', 'Takes about a minute'],
    cta: 'Get my free quote'
  },
  {
    id: 'bake-for-them',
    kicker: 'Peace of mind',
    title: 'Bake for them today.\nProtect them tomorrow.',
    body: 'The sweetest thing you can leave your family is a future without money worries.',
    list: ['Coverage that fits your budget', 'Benefits paid directly to your family', 'Talk to a licensed agent'],
    cta: 'Protect my family'
  },
  {
    id: 'before',
    kicker: 'Plan ahead',
    title: 'The best time to get covered\nis before you need it.',
    body: 'Coverage is usually easier to qualify for, and costs less, while you’re young and healthy.',
    list: ['Lock in today’s rate', 'Simple questions, no pressure', 'Answers in plain English'],
    cta: 'Start my free quote'
  },
  {
    id: 'moms',
    kicker: 'For moms & families',
    title: 'Your family runs on you.\nMake sure it always can.',
    body: 'If something happened to you, could your family keep the house, the routines, the dreams?',
    list: ['Protect your family’s income', 'Coverage for you and your spouse', 'Cash to use however they need'],
    cta: 'Compare my options'
  },
  {
    id: 'save-money',
    kicker: 'Save money',
    title: 'Let us help you find\ncoverage that fits your budget.',
    body: 'A licensed agent compares policies side by side, including ones with living benefits, at no cost to you.',
    list: ['Compare policies side by side', 'No cost to talk', 'No obligation'],
    cta: 'Compare my options'
  }
];

// Photos: families and healthy, happy moments. Each render picks one that isn't showing in another slot.
var AD_PHOTO_POOL = [
  { src: 'images/ads/family-field.jpg', alt: 'Family holding hands and walking through a meadow' },
  { src: 'images/ads/grandma-hug.jpg', alt: 'Grandmother hugging her granddaughter' },
  { src: 'images/ads/mom-daughter.jpg', alt: 'Mother hugging her laughing daughter' },
  { src: 'images/ads/dad-hug.jpg', alt: 'Father hugging his laughing daughter' },
  { src: 'images/ads/baking-together.jpg', alt: 'Mother and daughter baking together in the kitchen' },
  { src: 'images/ads/grandpa-baby.jpg', alt: 'Grandfather smiling at the baby in his arms' },
  { src: 'images/ads/beach-family.jpg', alt: 'Family laughing together at the beach' },
  { src: 'images/ads/garden-family.jpg', alt: 'Smiling family standing in their garden' },
  { src: 'images/ads/healthy-walk.jpg', alt: 'Woman out for a walk on a sunny day' }
];

(function () {
  var slots = Array.prototype.slice.call(document.querySelectorAll('[data-ad-slot]'));
  if (!slots.length) return;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function pickPhoto(button) {
    var inUse = slots.filter(function (b) { return b !== button; })
                     .map(function (b) { return b.getAttribute('data-photo'); });
    var choices = AD_PHOTO_POOL.filter(function (p) { return inUse.indexOf(p.src) === -1; });
    return choices[Math.floor(Math.random() * choices.length)];
  }

  function render(button, ad) {
    var chosen = pickPhoto(button);
    var photo = el('img', 'ad-photo');
    photo.src = chosen.src;
    photo.alt = chosen.alt;
    photo.loading = 'lazy';
    button.setAttribute('data-photo', chosen.src);

    var title = el('span', 'ad-title');
    ad.title.split('\n').forEach(function (line) { title.appendChild(el('span', 'ad-line', line)); });
    var list = el('span', 'ad-list');
    ad.list.forEach(function (item) { list.appendChild(el('span', '', item)); });

    var text = el('span', 'ad-text');
    text.append(el('span', 'ad-kicker', ad.kicker), title, el('span', 'ad-body', ad.body), list, el('span', 'ad-cta', ad.cta + ' →'));
    button.replaceChildren(el('span', 'ad-label', 'Sponsored'), photo, text);
    button.setAttribute('data-ad-source', button.getAttribute('data-ad-slot') + ':' + ad.id);
    button.setAttribute('aria-label', ad.title.replace('\n', ' ') + ' ' + ad.cta);
  }

  // Start each visit at a random ad, so every ad gets seen
  var offset = Math.floor(Math.random() * ADS.length);
  function show(animate) {
    slots.forEach(function (button, i) {
      var ad = ADS[(offset + i) % ADS.length];
      if (!animate) { render(button, ad); return; }
      if (button.matches(':hover') || button.matches(':focus-within')) return; // don't swap it out from under someone
      button.classList.add('ad-swapping');
      setTimeout(function () {
        render(button, ad);
        button.classList.remove('ad-swapping');
      }, 300);
    });
  }

  slots.forEach(function (button) {
    button.addEventListener('click', function () { if (window.openLeadForm) window.openLeadForm(button); });
  });

  show(false);
  setInterval(function () {
    if (document.hidden) return;
    offset = (offset + 1) % ADS.length;
    show(true);
  }, AD_ROTATE_MS);
})();
