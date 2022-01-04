<?php
define('DERPI_FILTER', 191275);

function derpi(string $path, array $query = []) {
  if (DERPI_FILTER)
    $query['filter_id'] = DERPI_FILTER;

  $queryParts = array_map(fn ($k, $v) => urlencode($k) . '=' . urlencode($v), array_keys($query), array_values($query));
  $queryStr = '?' . implode('&', $queryParts);
  $url = 'https://derpibooru.org/api/v1/json/' . $path . $queryStr;

  $resultStr = file_get_contents($url);
  $result = json_decode($resultStr, true);

  return $result;
}
