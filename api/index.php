<?php
set_include_path('.');
require_once 'vendor/autoload.php';

require_once 'lib/response.php';
require_once 'lib/env.php';

require_once 'routes/users.php';
require_once 'routes/auth.php';
require_once 'routes/data.php';

$payload = [
  'get' => $_GET?? [],

  // Stupid workaround for JSON
  'post' => json_decode(file_get_contents('php://input'), true)?? [],
  'headers' => getallheaders()
];

$res = null;

try {
  if (!str_starts_with($_SERVER['REQUEST_URI'], $_ENV['API_ROOT'])) {
    throw new Exception('API root mismatch');
  }

  $root = substr($_SERVER['REQUEST_URI'], strlen($_ENV['API_ROOT']));

  switch ($root) {
  case '/users':
    $res = \Routes\Users::handle($_SERVER['REQUEST_METHOD'], $payload);
    break;

  case '/auth':
    $res = \Routes\Auth::handle($_SERVER['REQUEST_METHOD'], $payload);
    break;

  case '/data':
    $res = \Routes\Data::handle($_SERVER['REQUEST_METHOD'], $payload);
    break;

  default:
    $res = new \Utils\HTTPResponse(\Utils\HTTPStatus::NotFound);
    break;
  }

} catch (Throwable $e) {
  $res = new \Utils\HTTPResponse(\Utils\HTTPStatus::InternalServerError);

  if ($_ENV['DEBUG']) {
    $res->body = 'ERROR: An unhandled exception was thrown<br>' . PHP_EOL .
      get_class($e) . ': ' . $e->getMessage() . '<br><br>' . PHP_EOL . PHP_EOL .
      'Stack trace:<br>' . PHP_EOL;

    foreach ($e->getTrace() as $index => $entry) {
      $res->body .= "#$index: " . $entry['file'] . ':' .$entry['line'] . ' in function ' . $entry['function'] . '<br>' . PHP_EOL;
    }
  }
}

if (is_null($res)) {
  $res = new \Utils\HTTPResponse(\Utils\HTTPStatus::MethodNotAllowed);
}

$res->send();
