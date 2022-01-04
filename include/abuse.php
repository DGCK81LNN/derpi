<?php
define('ABUSE_FILE', APP_ROOT . '/abuse');
define('ABUSE_HALFLIFE', 10);

function abuse() {
  $handle = fopen(ABUSE_FILE, 'c+');
  if ($handle === false) {
    http_response_code(409);
    include APP_ROOT . '/include/409.html';
    die;
  }
  if (!flock($handle, LOCK_EX)) {
    http_response_code(503);
    include APP_ROOT . '/include/503.html';
    die;
  }
  [ $lastcall, $value, $lock ] = fscanf($handle, '%f%f%d');

  if ($lock === 0) {
    $now = microtime(true);
    $deltatime = $now - $lastcall;
    $value /= 2**($deltatime / ABUSE_HALFLIFE);
    $value += 1;
  }
  if ($value <= 5) $lock = 0;
  else if ($value >= 50) $lock = 1;

  ftruncate($handle, 0);
  fseek($handle, 0);
  fprintf($handle, '%f %g %d', $now, $value, $lock);
  fclose($handle);

  return $value;
}
?>