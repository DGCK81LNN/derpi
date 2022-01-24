<?php
define('APP_ROOT', __DIR__);

if ($_COOKIE['lnndebug']) {
  error_reporting(E_ALL);
  ini_set('log_errors', '1');
  ini_set('error_log', APP_ROOT . '/debug.log');
}

require_once(APP_ROOT . '/include/derpi.php');


/**
 * Searches for byte `$needle` in string `$haystack`;
 * returns `$default` (default -1) when `$needle` is not one byte or is not found
 */
function charPos(string $needle, string $haystack, int $default = -1): int {
  if ($needle === '') return $default;
  $haystackArr = str_split($haystack);
  $key = array_search($needle, $haystackArr, true);
  return $key === false ? $default : $key;
}

function filterFields(array $src, array $fields) {
  $dest = [];
  foreach ($fields as $field) {
    $dest[$field] = $src[$field];
  }
  return $dest;
}


$passthruFields = [
  'id', 'score', 'upvotes', 'downvotes', 'wilson_score', 'width', 'height',
  'size', 'format', 'animated', 'tags', 'spoilered', 'representations', 'source_url'
];

if (isset($_GET['id'])) {
  $id = (int)$_GET['id'];

  $searchResult = derpi("images/$id");

  $returns = filterFields($searchResult['image'], $passthruFields);
}
else {
  $seed = isset($_GET['seed'])
    ? (int)$_GET['seed'] & 0xffffffff
    : unpack('L', random_bytes(4))[1];
  $tags = $_GET['tags'] ?? '';

  $r34     = charPos($_GET['r34'] ?? '',     'nsqe', 0);
  $dark    = charPos($_GET['dark'] ?? '',    'nsa',  0);
  $grotesq = charPos($_GET['grotesq'] ?? '', 'ny',   0);

  $query = [ 'wilson_score.gte:0.93', '-original_format:webm' ];
  if ($tags) $query[] = $tags;

  if ($r34 === 0 && $dark === 0 && $grotesq === 0) $query[] = 'safe';
  else {
    switch ($r34) {
      case 0: $query[] = '-suggestive';
      case 1: $query[] = '-questionable';
      case 2: $query[] = '-explicit';
    }
    switch ($dark) {
      case 0: $query[] = '-semi-grimdark';
      case 1: $query[] = '-grimdark';
    }
    if (!$grotesq) $query[] = '-grotesque';
  }
  $q = implode(',', $query);

  $searchResult = derpi('search/images', [
    'q' => $q,
    'sf' => "random:$seed",
    'sd' => 'desc',
  ]);

  $returns = [
    'seed' => $seed,
    'tags' => $tags,
    'q' => $q,
  ];
  foreach ($searchResult['images'] as $image)
    $returns['images'][] = filterFields($image, $passthruFields);
}

if (headers_sent()) die();

header('Content-Type: application/json; charset=UTF-8');
echo json_encode($returns, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
