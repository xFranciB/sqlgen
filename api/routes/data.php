<?php
namespace Routes;
use \Utils\Sanitize;

require_once 'middleware/session.php';

class Data {
  public static function handle(string $method, array $payload): ?\Utils\HTTPResponse {
    switch ($method) {
      case 'GET': {
        return Data::get($payload);
      }

      case 'POST': {
        return Data::set($payload);
      }
    }
  }

  public static function get(array $payload): \Utils\HTTPResponse {
    $conn = \Database\connect();
    $session = \Middleware\Session::getAuth($conn, $payload);

    if ($session === null) {
      return new \Utils\HTTPResponse(\Utils\HTTPStatus::Unauthorized);
    }

    $user = \Models\User::fromID($conn, $session->user_id);

    if ($user === null) {
      return new \Utils\HTTPResponse(\Utils\HTTPStatus::Unauthorized);
    }

    return \Utils\HTTPResponse::JSON(\Utils\HTTPStatus::OK, $user->dati);
  }

  public static function set(array $payload): \Utils\HTTPResponse {
    $conn = \Database\connect();
    $session = \Middleware\Session::getAuth($conn, $payload);

    if ($session === null) {
      return new \Utils\HTTPResponse(\Utils\HTTPStatus::Unauthorized);
    }

    $user = \Models\User::fromID($conn, $session->user_id);

    if ($user === null) {
      return new \Utils\HTTPResponse(\Utils\HTTPStatus::Unauthorized);
    }

    $res = Sanitize\check($payload['post'], [
      'dati' => [Sanitize\SPEC::Required, Sanitize\SPEC::JSON]
    ]);

    if (!$res->status) {
      return \Utils\HTTPResponse::JSON(\Utils\HTTPStatus::BadRequest, $res->error);
    }

    $user->updateDati($conn, $payload['post']['dati']);
    return new \Utils\HTTPResponse(\Utils\HTTPStatus::OK);
  }
}

