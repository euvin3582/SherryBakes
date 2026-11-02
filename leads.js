// Lead capture: every ad opens the quote form in a pop-up; submissions are POSTed as JSON to LEAD_ENDPOINT,
// which saves them to Mid Atlantic Insurance's leads table. After saving, the visitor can book a call on
// Mid Atlantic's calendar. Ported from the Fight Cancer site's js/leads.js (same checks, same endpoints),
// using a native <dialog> instead of Bootstrap.
var LEAD_ENDPOINT = 'api/lead.php';
var CLICK_ENDPOINT = 'api/click.php';             // logs each time the form opens, to compare ads by clicks
var CITY_DATA_URL = 'data/cities/';              // {STATE}.json: every city and town in that state
var APPOINTMENT_ENDPOINT = 'api/appointment.php'; // free call times, and booking one (Mid Atlantic's calendar)

(function () {
  var modalEl = document.getElementById('lead-modal');
  var form = document.getElementById('leadForm');
  if (!modalEl || !form) return;
  var source = document.getElementById('lead-source');
  var phone = document.getElementById('lead-phone');
  var email = document.getElementById('lead-email');
  var errorBox = document.getElementById('lead-error');
  var submit = document.getElementById('lead-submit');
  var toastEl = document.getElementById('lead-toast');
  var toastTimer;
  function showSentToast() {
    if (!toastEl) return;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 6000);
  }
  if (toastEl) toastEl.querySelector('button').addEventListener('click', function () { toastEl.hidden = true; });
  var showSentToastAfterClose = false;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // ---- After the lead is saved: booking a call, shown in place of the form ----
  var nextEl = document.getElementById('lead-next');
  var nextStatus = document.getElementById('lead-next-status');
  var titleEl = document.getElementById('leadTitle');
  var formTitle = titleEl ? titleEl.textContent : '';
  var money0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  function resetNext() {
    if (!nextEl) return;
    nextEl.hidden = true;
    nextStatus.textContent = '';
    if (titleEl) titleEl.textContent = formTitle;
    resetBooking();
  }

  // ---- Booking a call with an agent: a month calendar, the picked day's times, then "Book" ----
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var bookEl = document.getElementById('book-call');
  var bookStatus = document.getElementById('book-status');
  var bookCal = document.getElementById('book-cal');
  var bookMonth = document.getElementById('book-month');
  var bookPrev = document.getElementById('book-prev');
  var bookNext = document.getElementById('book-next');
  var bookGrid = document.getElementById('book-grid');
  var bookTimesWrap = document.getElementById('book-times-wrap');
  var bookDay = document.getElementById('book-day');
  var bookTimes = document.getElementById('book-times');
  var bookConfirm = document.getElementById('book-confirm');
  var bookDone = document.getElementById('book-done');
  var bookMinutes = document.getElementById('book-minutes');
  var booking = { token: null, days: [], date: '', slot: '', month: 0, saving: false };
  var CALL_US = 'A licensed agent will call you, or call us at (888) 804-2592.';

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function todayIso() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function bookMonths() {
    var seen = [];
    booking.days.forEach(function (d) { var m = d.date.slice(0, 7); if (seen.indexOf(m) < 0) seen.push(m); });
    return seen;
  }
  function pickedDay() { return booking.days.filter(function (d) { return d.date === booking.date; })[0]; }
  function longDate(iso) {
    var p = iso.split('-').map(Number);
    return p[0] ? new Date(p[0], p[1] - 1, p[2]).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : '';
  }

  function resetBooking() {
    if (!bookEl) return;
    bookEl.hidden = true;
    bookCal.hidden = true;
    bookTimesWrap.hidden = true;
    bookDone.hidden = true;
    bookStatus.hidden = false;
    bookStatus.textContent = '';
    booking = { token: null, days: [], date: '', slot: '', month: 0, saving: false };
  }
  function renderCalendar() {
    var months = bookMonths(), month = months[booking.month] || todayIso().slice(0, 7);
    var y = Number(month.slice(0, 4)), m = Number(month.slice(5, 7)), today = todayIso();
    var open = booking.days.map(function (d) { return d.date; });
    bookMonth.textContent = MONTHS[m - 1] + ' ' + y;
    bookGrid.setAttribute('aria-label', MONTHS[m - 1] + ' ' + y);
    bookPrev.disabled = booking.month === 0;
    bookNext.disabled = booking.month >= months.length - 1;
    bookGrid.replaceChildren();
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(function (w) { bookGrid.appendChild(el('span', 'wd', w)); });
    for (var b = new Date(y, m - 1, 1).getDay(); b > 0; b--) bookGrid.appendChild(el('span'));
    var count = new Date(y, m, 0).getDate();
    for (var d = 1; d <= count; d++) {
      (function (iso, day) {
        var isOpen = open.indexOf(iso) >= 0;
        var btn = el('button', 'd' + (isOpen ? ' open' : '') + (iso === booking.date ? ' on' : '') + (iso === today ? ' today' : ''), String(day));
        btn.type = 'button';
        btn.disabled = !isOpen;
        btn.setAttribute('aria-pressed', iso === booking.date ? 'true' : 'false');
        btn.setAttribute('aria-label', longDate(iso) + (isOpen ? '' : ', no times'));
        btn.addEventListener('click', function () { booking.date = iso; booking.slot = ''; renderCalendar(); renderTimes(); });
        bookGrid.appendChild(btn);
      })(month + '-' + pad(d), d);
    }
  }
  function renderTimes() {
    var day = pickedDay();
    bookDay.textContent = longDate(booking.date);
    bookTimes.replaceChildren();
    (day ? day.times : []).forEach(function (t) {
      var b = el('button', 't' + (t.value === booking.slot ? ' on' : ''), t.label);
      b.type = 'button';
      b.disabled = booking.saving;
      b.setAttribute('aria-pressed', t.value === booking.slot ? 'true' : 'false');
      b.addEventListener('click', function () { booking.slot = t.value; bookStatus.hidden = true; renderTimes(); });
      bookTimes.appendChild(b);
    });
    var picked = day && day.times.filter(function (t) { return t.value === booking.slot; })[0];
    bookConfirm.disabled = !picked || booking.saving;
    bookConfirm.textContent = booking.saving ? 'Booking…' : picked ? 'Book ' + longDate(booking.date) + ' at ' + picked.label : 'Pick a time to book';
  }
  function showBooked(label, calendar) {
    bookCal.hidden = true;
    bookTimesWrap.hidden = true;
    bookStatus.hidden = true;
    var tick = el('span', 'tick');
    tick.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
    bookDone.replaceChildren(tick, el('strong', null, 'You’re booked'), el('p', 'when', label),
      el('p', null, 'A licensed agent will call you then. Add the call to your calendar:'));
    if (calendar) {
      var links = el('div', 'add-cal');
      [['google', 'Google Calendar'], ['outlook', 'Outlook'], ['ics', 'Apple / other']].forEach(function (c) {
        if (!calendar[c[0]]) return;
        var a = el('a', 'cal-btn', c[1]);
        a.href = calendar[c[0]];
        a.target = '_blank';
        a.rel = 'noopener';
        links.appendChild(a);
      });
      bookDone.appendChild(links);
    }
    bookDone.appendChild(el('p', 'small', 'We’ve also emailed you the calendar invite.'));
    bookDone.hidden = false;
  }
  function loadBooking(message) {
    bookEl.hidden = false;
    bookStatus.hidden = false;
    bookStatus.classList.toggle('err', !!message);
    bookStatus.textContent = message || 'Loading available times…';
    fetch(APPOINTMENT_ENDPOINT + '?t=' + encodeURIComponent(booking.token), { headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res || !res.ok) throw new Error((res && res.error) || 'Could not load the times.');
        if (res.minutes && bookMinutes) bookMinutes.textContent = res.minutes + ' min';
        if (res.booked) return showBooked(res.booked, res.calendar);
        booking.days = res.days || [];
        if (!booking.days.length) {
          bookStatus.textContent = 'There are no times left in the next few weeks. ' + CALL_US;
          return;
        }
        if (!pickedDay()) booking.date = booking.days[0].date;
        booking.month = Math.max(bookMonths().indexOf(booking.date.slice(0, 7)), 0);
        if (!message) bookStatus.hidden = true;
        bookCal.hidden = false;
        bookTimesWrap.hidden = false;
        renderCalendar();
        renderTimes();
      })
      .catch(function () {
        bookStatus.classList.add('err');
        bookStatus.textContent = 'We couldn’t load the open times. ' + CALL_US;
      });
  }
  if (bookPrev) bookPrev.addEventListener('click', function () { booking.month = Math.max(booking.month - 1, 0); renderCalendar(); });
  if (bookNext) bookNext.addEventListener('click', function () { booking.month = Math.min(booking.month + 1, bookMonths().length - 1); renderCalendar(); });
  if (bookConfirm) bookConfirm.addEventListener('click', function () {
    if (!booking.slot || booking.saving) return;
    booking.saving = true;
    renderTimes();
    fetch(APPOINTMENT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ t: booking.token, slot: booking.slot })
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        booking.saving = false;
        if (res && res.booked) return showBooked(res.booked, res.calendar);
        booking.slot = '';
        loadBooking((res && res.error) || 'That time is no longer open. Please pick another.');
      })
      .catch(function () {
        booking.saving = false;
        renderTimes();
        bookStatus.hidden = false;
        bookStatus.classList.add('err');
        bookStatus.textContent = 'We couldn’t book that time. Please try again or call us at (888) 804-2592.';
      });
  });

  function showBooking(lead, token) {
    form.hidden = true;
    nextEl.hidden = false;
    nextStatus.textContent = 'Thank you, ' + lead.firstName + '! Pick a time for a short call, and a licensed agent will go over your ' +
      money0.format(lead.coverage) + ' coverage options with you.';
    if (titleEl) titleEl.textContent = 'Book your call';
    booking.token = token;
    loadBooking();
  }

  // ---- Opening and closing the form ----
  var adLayout = null;
  var adPhoto = null;

  // Called by ads.js (and any [data-lead-open] button) with the element that was clicked
  function openLeadForm(trigger) {
    source.value = (trigger && trigger.getAttribute && trigger.getAttribute('data-ad-source')) || 'direct';
    adLayout = trigger && trigger.classList && trigger.classList.contains('ad-feature') ? 'banner' : null;
    adPhoto = (trigger && trigger.getAttribute && trigger.getAttribute('data-photo')) || null;
    if (CLICK_ENDPOINT && navigator.sendBeacon) {
      try {
        navigator.sendBeacon(CLICK_ENDPOINT, JSON.stringify({
          source: source.value, adLayout: adLayout, adPhoto: adPhoto, page: location.href
        }));
      } catch (err) {} // click logging must never block the form
    }
    form.hidden = false;
    errorBox.hidden = true;
    resetNext();
    if (!modalEl.open) modalEl.showModal();
    modalEl.querySelector('.lead-body').scrollTop = 0;
  }
  window.openLeadForm = openLeadForm;

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-lead-open]');
    if (t) { e.preventDefault(); openLeadForm(t); }
  });
  modalEl.querySelector('.lead-close').addEventListener('click', function () { modalEl.close(); });
  modalEl.addEventListener('close', function () {
    if (!showSentToastAfterClose) return;
    showSentToastAfterClose = false;
    showSentToast();
  });

  // Links to "#quote" open the form
  function openFromHash() {
    if (location.hash !== '#quote') return;
    history.replaceState(null, '', location.pathname + location.search);
    openLeadForm(null);
  }
  window.addEventListener('hashchange', openFromHash);
  openFromHash();

  // ---- Date of birth: Month / Day / Year dropdowns, ages 18 to 85, stored as YYYY-MM-DD ----
  var dobMonth = document.getElementById('lead-dob-month');
  var dobDay = document.getElementById('lead-dob-day');
  var dobYear = document.getElementById('lead-dob-year');
  var dobField = document.getElementById('lead-dob');
  var now = new Date();
  for (var y = now.getFullYear() - 18; y >= now.getFullYear() - 85; y--) {
    var opt = document.createElement('option');
    opt.value = opt.textContent = String(y);
    dobYear.appendChild(opt);
  }
  function checkDob() {
    dobField.value = '';
    dobYear.setCustomValidity('');
    if (!dobMonth.value || !dobDay.value || !dobYear.value) return;
    var y = +dobYear.value, m = +dobMonth.value, d = +dobDay.value;
    var date = new Date(y, m - 1, d);
    var age = now.getFullYear() - y - ((now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) ? 1 : 0);
    if (date.getMonth() !== m - 1) dobYear.setCustomValidity('That date doesn’t exist.');
    else if (age < 18 || age > 85) dobYear.setCustomValidity('Ages 18 to 85 only.');
    else dobField.value = dobYear.value + '-' + dobMonth.value + '-' + dobDay.value;
  }
  [dobMonth, dobDay, dobYear].forEach(function (s) { s.addEventListener('change', checkDob); });

  // ---- Phone: a real US number (same rules as api/lead.php) ----
  function phoneDigits(v) {
    var d = v.replace(/\D/g, '');
    return d.length === 11 && d.charAt(0) === '1' ? d.slice(1) : d;
  }
  var AREA_CODES = ('201 202 203 205 206 207 208 209 210 212 213 214 215 216 217 218 219 220 223 224 225 227 228 229 231 234 235 ' +
    '239 240 248 251 252 253 254 256 260 262 267 269 270 272 274 276 279 281 283 301 302 303 304 305 307 308 309 ' +
    '310 312 313 314 315 316 317 318 319 320 321 323 324 325 326 327 329 330 331 332 334 336 337 339 340 341 346 ' +
    '347 350 351 352 353 357 360 361 363 364 369 380 385 386 401 402 404 405 406 407 408 409 410 412 413 414 415 ' +
    '417 419 423 424 425 430 432 434 435 436 440 442 443 445 447 448 457 458 463 464 465 469 470 471 472 475 478 ' +
    '479 480 483 484 500 501 502 503 504 505 507 508 509 510 512 513 515 516 517 518 520 521 522 523 524 525 526 ' +
    '527 528 529 530 531 532 533 534 538 539 540 541 542 543 544 551 557 559 561 562 563 564 566 567 570 571 572 ' +
    '573 574 575 577 580 582 585 586 588 601 602 603 605 606 607 608 609 610 612 614 615 616 617 618 619 620 621 ' +
    '623 624 626 628 629 630 631 636 640 641 645 646 650 651 656 657 659 660 661 662 667 669 670 671 678 679 680 ' +
    '681 682 684 686 689 701 702 703 704 706 707 708 710 712 713 714 715 716 717 718 719 720 724 725 726 727 728 ' +
    '729 730 731 732 734 737 738 740 743 747 748 754 757 760 762 763 765 769 770 771 772 773 774 775 779 781 785 ' +
    '786 787 800 801 802 803 804 805 806 808 810 812 813 814 815 816 817 818 820 821 826 828 830 831 832 833 835 ' +
    '837 838 839 840 843 844 845 847 848 850 854 855 856 857 858 859 860 861 862 863 864 865 866 870 872 877 878 ' +
    '888 901 903 904 906 907 908 909 910 912 913 914 915 916 917 918 919 920 924 925 928 929 930 931 934 936 937 ' +
    '938 939 940 941 943 945 947 948 949 951 952 954 956 959 970 971 972 973 975 978 979 980 983 984 985 986 989').split(' ');
  var RUNS = '01234567890 09876543210';
  function realPhone(d) {
    if (!/^\d{10}$/.test(d) || AREA_CODES.indexOf(d.slice(0, 3)) < 0) return false;
    var rest = d.slice(3);
    return /^[2-9](?!11)\d{2}\d{4}$/.test(rest) && !/^(\d)\1{6}$/.test(rest) && RUNS.indexOf(rest) < 0 && !/^55501\d{2}$/.test(rest);
  }
  var phoneFeedback = phone.parentNode.querySelector('.invalid-feedback');
  function checkPhone() {
    var d = phoneDigits(phone.value);
    var msg = d.length !== 10 ? 'Enter a 10-digit phone number.' : realPhone(d) ? '' : 'Enter a real phone number where an agent can reach you.';
    phone.setCustomValidity(msg);
    if (msg && phoneFeedback) phoneFeedback.textContent = msg;
  }
  phone.addEventListener('input', checkPhone);

  // ---- Email: real-looking, not a placeholder, with typo suggestions ----
  var EMAIL_RE = /^[A-Za-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;
  var FAKE_DOMAINS = ['example.com', 'example.org', 'example.net', 'test.com', 'email.com', 'domain.com', 'mailinator.com'];
  var TYPOS = { 'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gnail.com': 'gmail.com',
    'gmail.co': 'gmail.com', 'gmail.con': 'gmail.com', 'gmail.cm': 'gmail.com', 'yaho.com': 'yahoo.com', 'yahooo.com': 'yahoo.com',
    'yahoo.con': 'yahoo.com', 'hotmial.com': 'hotmail.com', 'hotmal.com': 'hotmail.com', 'hotmail.con': 'hotmail.com',
    'outlok.com': 'outlook.com', 'outlook.con': 'outlook.com', 'iclod.com': 'icloud.com', 'icloud.con': 'icloud.com', 'aol.con': 'aol.com' };
  var emailFeedback = email.parentNode.querySelector('.invalid-feedback');
  function checkEmail() {
    var v = email.value.trim(), domain = v.split('@').pop().toLowerCase(), msg = '';
    if (!EMAIL_RE.test(v) || v.length > 120) msg = 'Enter a valid email, like name@gmail.com.';
    else if (TYPOS[domain]) msg = 'Did you mean ' + v.slice(0, v.lastIndexOf('@') + 1) + TYPOS[domain] + '?';
    else if (FAKE_DOMAINS.indexOf(domain) >= 0) msg = 'Enter the email address you actually use.';
    email.setCustomValidity(msg);
    if (msg && emailFeedback) emailFeedback.textContent = msg;
  }
  email.addEventListener('input', checkEmail);

  // ---- City: must be a real place in the chosen state, with suggestions as you type ----
  var city = document.getElementById('lead-city');
  var cityList = document.getElementById('lead-city-list');
  var stateSel = document.getElementById('lead-state');
  var cityFeedback = city.closest('.city-box').parentNode.querySelector('.invalid-feedback');
  var cities = {}; // state -> { key: name }, or 'loading' / 'failed'
  function cityKey(n) {
    n = n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    n = n.replace(/[.'’]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
    return n.replace(/^saint /, 'st ').replace(/ saint /g, ' st ').replace(/^fort /, 'ft ').replace(/^mount /, 'mt ');
  }
  function loadCities(state) {
    if (!state || cities[state]) return;
    cities[state] = 'loading';
    fetch(CITY_DATA_URL + state + '.json')
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (names) {
        var byKey = {};
        names.forEach(function (n) { byKey[cityKey(n)] = n; });
        cities[state] = byKey;
        if (city.value.trim()) checkCity();
      })
      .catch(function () { cities[state] = 'failed'; }); // the server still checks it
  }
  function checkCity() {
    var v = city.value.trim(), state = stateSel.value, list = cities[state], msg = '';
    if (!v) msg = 'Enter your city.';
    else if (typeof list === 'object' && !list[cityKey(v)]) {
      msg = 'We couldn’t find “' + v + '” in ' + stateSel.options[stateSel.selectedIndex].text + '. Pick your city from the list as you type, or enter the nearest city.';
    }
    city.setCustomValidity(msg);
    if (msg && cityFeedback) cityFeedback.textContent = msg;
  }
  var cityActive = -1;
  function closeCities() {
    cityList.hidden = true;
    cityList.replaceChildren();
    cityActive = -1;
    city.setAttribute('aria-expanded', 'false');
    city.removeAttribute('aria-activedescendant');
  }
  function pickCity(name) {
    city.value = name;
    closeCities();
    checkCity();
  }
  function markActive(i) {
    var items = cityList.children;
    if (!items.length) return;
    cityActive = (i + items.length) % items.length;
    for (var j = 0; j < items.length; j++) items[j].setAttribute('aria-selected', j === cityActive ? 'true' : 'false');
    city.setAttribute('aria-activedescendant', items[cityActive].id);
    items[cityActive].scrollIntoView({ block: 'nearest' });
  }
  // Keeps the list on screen above a phone's keyboard
  function fitCityList() {
    var view = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    var scroller = city.closest('.lead-body');
    cityList.style.maxHeight = '';
    if (scroller && cityList.getBoundingClientRect().bottom > view - 8) {
      scroller.scrollTop += city.getBoundingClientRect().top - Math.max(scroller.getBoundingClientRect().top, 0) - 12;
    }
    var room = view - city.getBoundingClientRect().bottom - 16;
    if (room < cityList.offsetHeight) cityList.style.maxHeight = Math.max(room, 96) + 'px';
  }
  function suggestCities() {
    var list = cities[stateSel.value], k = cityKey(city.value);
    closeCities();
    if (typeof list !== 'object' || k.length < 2) return;
    var starts = [], inside = [];
    for (var key in list) {
      if (key.indexOf(k) === 0) starts.push(list[key]);
      else if (key.indexOf(' ' + k) > 0) inside.push(list[key]);
      if (starts.length >= 8) break;
    }
    var names = starts.concat(inside).slice(0, 8);
    if (!names.length || (names.length === 1 && cityKey(names[0]) === k)) return;
    names.forEach(function (n, i) {
      var li = el('li', 'city-option', n);
      li.id = 'lead-city-opt-' + i;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      li.addEventListener('pointerdown', function (e) { e.preventDefault(); pickCity(n); });
      cityList.appendChild(li);
    });
    cityList.hidden = false;
    city.setAttribute('aria-expanded', 'true');
    fitCityList();
  }
  stateSel.addEventListener('change', function () {
    loadCities(stateSel.value);
    city.placeholder = 'Start typing your city';
    if (city.value.trim()) checkCity();
  });
  city.addEventListener('input', function () { suggestCities(); checkCity(); });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', function () { if (!cityList.hidden) fitCityList(); });
  city.addEventListener('keydown', function (e) {
    if (cityList.hidden) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); markActive(cityActive + (e.key === 'ArrowDown' ? 1 : -1)); }
    else if (e.key === 'Enter' && cityActive >= 0) { e.preventDefault(); pickCity(cityList.children[cityActive].textContent); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeCities(); }
  });
  city.addEventListener('blur', function () {
    closeCities();
    var list = cities[stateSel.value], match = typeof list === 'object' && list[cityKey(city.value)];
    if (match) city.value = match;
  });
  // Escape closes the city list first, not the whole pop-up
  modalEl.addEventListener('cancel', function (e) { if (!cityList.hidden) { e.preventDefault(); closeCities(); } });

  // ---- Names: a capital at the start of each part (same as name_case in api/lead.php) ----
  function nameCase(v) {
    return v.trim().replace(/\s+/g, ' ').replace(/(^|[\s\-'’])(\p{Ll})/gu, function (m, sep, c) { return sep + c.toUpperCase(); });
  }
  ['lead-first', 'lead-last'].forEach(function (id) {
    var input = document.getElementById(id);
    input.addEventListener('blur', function () { input.value = nameCase(input.value); });
  });
  phone.addEventListener('blur', function () {
    var d = phoneDigits(phone.value);
    if (d.length === 10) phone.value = '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6);
  });

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.hidden = false;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errorBox.hidden = true;
    checkPhone();
    checkEmail();
    checkCity();
    checkDob();
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      // Name the missing fields right above the button, so it never looks like nothing happened
      var missing = [], problems = [];
      form.querySelectorAll('input:invalid, select:invalid').forEach(function (f) {
        var name;
        if ((f === phone || f === email || f === city) && f.value.trim()) { problems.push(f.validationMessage); return; }
        if (f.id && f.id.indexOf('lead-dob') === 0) name = 'Date of birth';
        else if (f.type === 'checkbox') name = 'the consent checkbox';
        else {
          var label = form.querySelector('label[for="' + f.id + '"]');
          name = label ? label.textContent.trim() : f.name;
        }
        if (missing.indexOf(name) === -1) missing.push(name);
      });
      showError([missing.length ? 'Please complete: ' + missing.join(', ') + '.' : ''].concat(problems).join(' ').trim());
      var bad = form.querySelector('input:invalid, select:invalid');
      if (bad) bad.focus();
      return;
    }

    var fd = new FormData(form);
    var lead = {
      firstName: nameCase(fd.get('firstName')),
      lastName: nameCase(fd.get('lastName')),
      gender: fd.get('gender'),
      phone: phoneDigits(fd.get('phone')),
      email: fd.get('email').trim(),
      city: fd.get('city').trim(),
      state: fd.get('state'),
      dob: fd.get('dob'),             // YYYY-MM-DD
      tobacco: fd.get('tobacco'),     // "yes" or "no"
      health: fd.get('health'),       // Compulife health class: PP, P, RP or R
      coverage: Number(fd.get('coverage')),
      consent: fd.get('consent') === 'yes',
      websiteCheck: fd.get('websiteCheck'),
      source: fd.get('source'),
      adLayout: adLayout,
      adPhoto: adPhoto,
      page: location.href,
      submittedAt: new Date().toISOString()
    };

    submit.disabled = true;
    submit.textContent = 'Sending…';
    fetch(LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(lead)
    })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (res) {
          if (r.status === 400 && res && res.error) { var err = new Error(res.error); err.shown = true; throw err; }
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return res;
        });
      })
      .then(function (res) {
        form.reset();
        form.classList.remove('was-validated');
        showSentToastAfterClose = true; // the "sent" message shows when the pop-up closes
        var token = res && res.bookingToken;
        if (nextEl && token) showBooking(lead, token);
        else modalEl.close();
      })
      .catch(function (err) {
        showError(err && err.shown ? err.message.replace('Missing or invalid:', 'Please check:') + '.'
          : 'We couldn’t send your information. Check your connection and try again.');
      })
      .finally(function () {
        submit.disabled = false;
        submit.textContent = 'Get my free quote';
      });
  });
})();
