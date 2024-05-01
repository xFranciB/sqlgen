<?php
namespace Routes;
use \Utils\Sanitize;

require_once 'lib/sanitizer.php';
require_once 'lib/database.php';
require_once 'models/users.php';
require_once 'lib/response.php';
require_once 'middleware/session.php';

class Users {
  public static function handle(string $method, array $payload): ?\Utils\HTTPResponse {
    switch ($method) {
      case 'POST': {
        return Users::create($payload);
      }
    }

    return null;
  }

  public static function create(array $payload): \Utils\HTTPResponse {
    $conn = \Database\connect();

    $res = Sanitize\check($payload['post'], [
      'username' => [Sanitize\SPEC::Required, Sanitize\SPEC::String, Sanitize\SPEC::UniqueStr($conn, 'users', 'username')],
      'password' => [Sanitize\SPEC::Required, Sanitize\SPEC::String]
    ]);

    if (!$res->status) {
      return \Utils\HTTPResponse::JSON(\Utils\HTTPStatus::BadRequest, $res->error);
    }
    
    \Models\User::create($conn,
      $payload['post']['username'],
      $payload['post']['password']
    );

    return new \Utils\HTTPResponse(\Utils\HTTPStatus::Created);
  }
}
