<?php
namespace Routes;
use \Utils\Sanitize;

require_once 'lib/sanitizer.php';
require_once 'lib/database.php';
require_once 'lib/response.php';
require_once 'lib/password.php';

require_once 'models/users.php';
require_once 'models/session.php';

class Auth {
  public static function handle(string $method, array $payload): ?\Utils\HTTPResponse {
    switch ($method) {
      case 'POST': {
        return Auth::authenticate($payload);
      }

      case 'DELETE': {
        return Auth::logout($payload);
      }
    }

    return null;
  }

  public static function authenticate(array $payload): \Utils\HTTPResponse {
    $conn = \Database\connect();

    $res = Sanitize\check($payload['post'], [
      'username' => [Sanitize\SPEC::Required, Sanitize\SPEC::String],
      'password' => [Sanitize\SPEC::Required, Sanitize\SPEC::String]
    ]);

    if (!$res->status) {
      return \Utils\HTTPResponse::JSON(\Utils\HTTPStatus::BadRequest, $res->error);
    }
    
    $user = \Models\User::auth($conn,
      $payload['post']['username'],
      $payload['post']['password']
    );

    if ($user === null) {
        return new \Utils\HTTPResponse(\Utils\HTTPStatus::Unauthorized);
    }

    $session = \Models\Session::create($conn, $user);

    // TODO: Make this better
    header('Expires: ' . $session->expire->format('Y-m-d H:i:s'));

    return \Utils\HTTPResponse::JSON(\Utils\HTTPStatus::OK, [
      'token' => $session->token
    ]);
  }

  public static function logout(array $payload): \Utils\HTTPResponse {
    $conn = \Database\connect();

    $session = \Middleware\Session::getAuth($conn, $payload);

    if ($session === null) {
      return new \Utils\HTTPResponse(\Utils\HTTPStatus::Unauthorized);
    }

    $session->remove($conn);
    return new \Utils\HTTPResponse(\Utils\HTTPStatus::OK);
  }
}
