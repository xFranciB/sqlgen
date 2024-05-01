<?php
namespace Middleware;
use \Utils\Sanitize;

require_once 'lib/database.php';
require_once 'lib/sanitizer.php';
require_once 'models/session.php';

class Session {
  public static function getAuth(\mysqli $conn, array $payload): ?\Models\Session {
    $res = Sanitize\check($payload['headers'], [
      'authorization' => [Sanitize\SPEC::Required, Sanitize\SPEC::String]
    ]);

    if (!$res->status) {
      return null;
    }

    $token = substr($payload['headers']['authorization'], strlen('Bearer '));

    $session = \Models\Session::fromToken($conn, $token);

    if ($session === null) {
      return null;
    }

    if ($session->isExpired()) {
      $session->remove($conn);
      return null;
    }

    if (!$session->updateExpire($conn)) {
      throw new \Exception();
    }

    // TODO: Make this better
    header('Expires: ' . $session->expire->format('Y-m-d H:i:s'));

    return $session;
  }
}
