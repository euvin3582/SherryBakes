<?php
// Receives quote-form submissions from js/leads.js and saves them to the leads table shared with
// Mid Atlantic Insurance (the same table the Fight Cancer site writes to). Each lead's `page` column holds
// the Sherry Bakes URL it came from, and `source` the ad that was clicked (e.g. "between-recipes:loved-ones").
// Database settings and shared helpers are in db.php.

require __DIR__ . '/db.php';
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['ok' => false, 'error' => 'Method not allowed']);
}

$raw = file_get_contents('php://input', false, null, 0, 10000); // ignore anything oversized
$d = json_decode($raw, true);
if (!is_array($d)) {
    respond(400, ['ok' => false, 'error' => 'Invalid data']);
}

// A capital at the start of each part of a name ("mary-jane o'brien" -> "Mary-Jane O'Brien"); letters already
// capitalized stay as typed ("McDonald"). Same as nameCase in js/leads.js.
function name_case($name) {
    return preg_replace_callback("/(^|[\s\-'\x{2019}])(\p{Ll})/u", fn($m) => $m[1] . mb_strtoupper($m[2]), $name);
}

// Honeypot: real visitors never see or fill this hidden field.
// Pretend success so bots don't learn that they were caught.
if (!empty($d['websiteCheck'])) {
    respond(200, ['ok' => true]);
}

$firstName = name_case(text($d['firstName'] ?? '', 50));
$lastName  = name_case(text($d['lastName'] ?? '', 50));
$gender    = $d['gender'] ?? '';
$phone     = preg_replace('/\D/', '', (string) ($d['phone'] ?? ''));
if (strlen($phone) === 11 && $phone[0] === '1') {
    $phone = substr($phone, 1);
}
$email     = strtolower(text($d['email'] ?? '', 120));
$city      = text($d['city'] ?? '', 80);
$state     = strtoupper(text($d['state'] ?? '', 2));
// This site doesn't ask about Cancer; the column is nullable (Mid Atlantic's 003_quotes.sql), so it's stored as NULL
$diagnosed = $d['diagnosedWithCancer'] ?? null;
$dob       = text($d['dob'] ?? '', 10);
$tobacco   = $d['tobacco'] ?? '';
$health    = $d['health'] ?? '';
$coverage  = $d['coverage'] ?? null;
$consent   = ($d['consent'] ?? false) === true;
$source    = text($d['source'] ?? '', 60);
$adLayout  = ad_layout($d['adLayout'] ?? '');
$adPhoto   = text($d['adPhoto'] ?? '', 80);
$page      = text($d['page'] ?? '', 255);

$states = ['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY',
           'LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH',
           'OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

$age = age_from_dob($dob);

// A real US number (same rules as js/leads.js): an area code in service in the US (NANPA's list, plus the
// toll-free codes), an exchange that starts with 2-9 and isn't N11 (411, 911...), and the last seven digits not
// one digit over and over (000-0000), not a straight run (123-4567), and not 555-01xx (set aside for movies and TV).
const AREA_CODES = '201 202 203 205 206 207 208 209 210 212 213 214 215 216 217 218 219 220 223 224 225 227 228 229 231 234 ' .
    '235 239 240 248 251 252 253 254 256 260 262 267 269 270 272 274 276 279 281 283 301 302 303 304 305 307 ' .
    '308 309 310 312 313 314 315 316 317 318 319 320 321 323 324 325 326 327 329 330 331 332 334 336 337 339 ' .
    '340 341 346 347 350 351 352 353 357 360 361 363 364 369 380 385 386 401 402 404 405 406 407 408 409 410 ' .
    '412 413 414 415 417 419 423 424 425 430 432 434 435 436 440 442 443 445 447 448 457 458 463 464 465 469 ' .
    '470 471 472 475 478 479 480 483 484 500 501 502 503 504 505 507 508 509 510 512 513 515 516 517 518 520 ' .
    '521 522 523 524 525 526 527 528 529 530 531 532 533 534 538 539 540 541 542 543 544 551 557 559 561 562 ' .
    '563 564 566 567 570 571 572 573 574 575 577 580 582 585 586 588 601 602 603 605 606 607 608 609 610 612 ' .
    '614 615 616 617 618 619 620 621 623 624 626 628 629 630 631 636 640 641 645 646 650 651 656 657 659 660 ' .
    '661 662 667 669 670 671 678 679 680 681 682 684 686 689 701 702 703 704 706 707 708 710 712 713 714 715 ' .
    '716 717 718 719 720 724 725 726 727 728 729 730 731 732 734 737 738 740 743 747 748 754 757 760 762 763 ' .
    '765 769 770 771 772 773 774 775 779 781 785 786 787 800 801 802 803 804 805 806 808 810 812 813 814 815 ' .
    '816 817 818 820 821 826 828 830 831 832 833 835 837 838 839 840 843 844 845 847 848 850 854 855 856 857 ' .
    '858 859 860 861 862 863 864 865 866 870 872 877 878 888 901 903 904 906 907 908 909 910 912 913 914 915 ' .
    '916 917 918 919 920 924 925 928 929 930 931 934 936 937 938 939 940 941 943 945 947 948 949 951 952 954 ' .
    '956 959 970 971 972 973 975 978 979 980 983 984 985 986 989';
function real_phone($d) {
    if (!preg_match('/^\d{10}$/', $d) || !in_array(substr($d, 0, 3), explode(' ', AREA_CODES), true)) return false;
    $rest = substr($d, 3);
    return preg_match('/^[2-9](?!11)\d{2}\d{4}$/', $rest) && !preg_match('/^(\d)\1{6}$/', $rest)
        && strpos('01234567890 09876543210', $rest) === false && !preg_match('/^55501\d{2}$/', $rest);
}

// A city name written the way the lists compare them (same as cityKey in js/leads.js): no capitals, accents
// or punctuation, and "Saint"/"Fort"/"Mount" as "st"/"ft"/"mt".
function city_key($name) {
    $n = strtr($name, ['À' => 'a', 'Á' => 'a', 'Â' => 'a', 'Ã' => 'a', 'Ä' => 'a', 'Å' => 'a', 'à' => 'a', 'á' => 'a', 'â' => 'a',
        'ã' => 'a', 'ä' => 'a', 'å' => 'a', 'Ç' => 'c', 'ç' => 'c', 'È' => 'e', 'É' => 'e', 'Ê' => 'e', 'Ë' => 'e', 'è' => 'e',
        'é' => 'e', 'ê' => 'e', 'ë' => 'e', 'Ì' => 'i', 'Í' => 'i', 'Î' => 'i', 'Ï' => 'i', 'ì' => 'i', 'í' => 'i', 'î' => 'i',
        'ï' => 'i', 'Ñ' => 'n', 'ñ' => 'n', 'Ò' => 'o', 'Ó' => 'o', 'Ô' => 'o', 'Õ' => 'o', 'Ö' => 'o', 'ò' => 'o', 'ó' => 'o',
        'ô' => 'o', 'õ' => 'o', 'ö' => 'o', 'Ù' => 'u', 'Ú' => 'u', 'Û' => 'u', 'Ü' => 'u', 'ù' => 'u', 'ú' => 'u', 'û' => 'u',
        'ü' => 'u', 'Ý' => 'y', 'ý' => 'y', 'ÿ' => 'y', '’' => '']);
    $n = strtolower($n);
    $n = trim(preg_replace('/[^a-z0-9]+/', ' ', str_replace(['.', "'"], '', $n)));
    $n = preg_replace(['/^saint /', '/ saint /', '/^fort /', '/^mount /'], ['st ', ' st ', 'ft ', 'mt '], $n);
    return $n;
}

// True when $city is a place in $state: data/cities/{STATE}.json, every city and town in the state (built from
// the Census Bureau's place list and GeoNames' postal place names). Without the file, the city isn't checked.
function real_city($city, $state) {
    $file = dirname(__DIR__) . "/data/cities/$state.json";
    $names = is_file($file) ? json_decode((string) file_get_contents($file), true) : null;
    if (!is_array($names)) {
        error_log("city list missing: $file");
        return true;
    }
    $key = city_key($city);
    foreach ($names as $n) {
        if (city_key($n) === $key) return true;
    }
    return false;
}

// A real-looking address on a domain that can receive mail: name@domain.tld with a 2-24 letter ending, not a
// placeholder domain, and the domain has mail (MX) or address (A) records.
function real_email($email) {
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) return false;
    $domain = substr(strrchr($email, '@'), 1);
    if (!preg_match('/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/', $domain)) return false;
    if (in_array($domain, ['example.com', 'example.org', 'example.net', 'test.com', 'email.com', 'domain.com', 'mailinator.com'], true)) return false;
    return checkdnsrr($domain, 'MX') || checkdnsrr($domain, 'A');
}
// Coverage amounts the form offers
$coverageOptions = [25000, 50000, 100000, 250000, 500000, 1000000];

$errors = [];
if ($firstName === '') $errors[] = 'first name';
if ($lastName === '')  $errors[] = 'last name';
if (!in_array($gender, ['female', 'male'], true)) $errors[] = 'gender';
if (!real_phone($phone)) $errors[] = 'phone';
if (!real_email($email)) $errors[] = 'email';
if ($city === '' || (in_array($state, $states, true) && !real_city($city, $state))) $errors[] = 'city';
if (!in_array($state, $states, true)) $errors[] = 'state';
if ($diagnosed !== null && !in_array($diagnosed, ['yes', 'no'], true)) $errors[] = 'diagnosis answer';
if ($age === null || $age < 18 || $age > 85) $errors[] = 'date of birth';
if (!in_array($tobacco, ['yes', 'no'], true)) $errors[] = 'tobacco';
if (!in_array($health, ['PP', 'P', 'RP', 'R'], true)) $errors[] = 'health';
if (!in_array($coverage, $coverageOptions, true)) $errors[] = 'coverage';
if (!$consent) $errors[] = 'consent';

if ($errors) {
    respond(400, ['ok' => false, 'error' => 'Missing or invalid: ' . implode(', ', $errors)]);
}

try {
    $stmt = db()->prepare(
        'INSERT INTO leads (first_name, last_name, gender, dob, phone, email, city, state,
                            diagnosed_with_cancer, tobacco, health, coverage,
                            consent, source, ad_layout, ad_photo, page)
         VALUES (:first_name, :last_name, :gender, :dob, :phone, :email, :city, :state,
                 :diagnosed, :tobacco, :health, :coverage,
                 :consent, :source, :ad_layout, :ad_photo, :page)'
    );
    $stmt->execute([
        ':first_name' => $firstName,
        ':last_name'  => $lastName,
        ':gender'     => $gender,
        ':dob'        => $dob,
        ':phone'      => $phone,
        ':email'      => $email,
        ':city'       => $city,
        ':state'      => $state,
        ':diagnosed'  => $diagnosed,
        ':tobacco'    => $tobacco === 'yes' ? 1 : 0,
        ':health'     => $health,
        ':coverage'   => $coverage,
        ':consent'    => 1,
        ':source'     => $source !== '' ? $source : null,
        ':ad_layout'  => $adLayout,
        ':ad_photo'   => $adPhoto !== '' ? $adPhoto : null,
        ':page'       => $page !== '' ? $page : null,
    ]);
    $leadId = (int) db()->lastInsertId();
} catch (Throwable $e) {
    error_log('lead save failed: ' . $e->getMessage()); // details go to the server log, not the visitor
    respond(500, ['ok' => false, 'error' => 'Could not save']);
}

// One-time link for booking a call with an agent, in the appointments table shared with the Mid Atlantic
// Insurance site (same as its booking.php: only a hash of the token is stored). api/appointment.php uses it.
// Best effort: if the appointments table isn't there yet, the lead is still saved and an agent calls instead.
$bookingToken = null;
try {
    $token = bin2hex(random_bytes(32));
    db()->prepare('INSERT INTO appointments (lead_id, booking_token) VALUES (?, ?)')->execute([$leadId, hash('sha256', $token)]);
    $bookingToken = $token;
} catch (Throwable $e) {
    error_log("lead $leadId: no booking link: " . $e->getMessage());
}

// The id lets the form ask quote.php for prices and link them to this lead; the token lets it book a call
respond(200, ['ok' => true, 'leadId' => $leadId, 'bookingToken' => $bookingToken]);
