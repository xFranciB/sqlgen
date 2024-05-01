<?php
namespace Utils;

abstract class HTTPStatus {
  const OK = 200;
  const Created = 201;
  const NoContent = 204;

  const BadRequest = 400;
  const Unauthorized = 401;
  const NotFound = 404;
  const MethodNotAllowed = 405;

  const InternalServerError = 500;
  const NotImplemented = 501;
}

class HTTPResponse {
  public int $status_code;
  public string $body;

  public function __construct(int $status_code, string $body = '') {
    $this->status_code = $status_code;
    $this->body = $body;
  }

  public static function JSON(int $status_code, array $body, int $flags = 0): HTTPResponse {
    self::header('Content-Type', 'application/json');
    return new self($status_code, json_encode($body, $flags));
  }

  public static function header(string $key, string $value): void {
    header("$key: $value");
  }

  public function send(): never {
    http_response_code($this->status_code);
    echo $this->body;
    exit;
  }
}
