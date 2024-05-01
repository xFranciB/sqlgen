<?php
namespace Models;

require_once 'lib/env.php';
require_once 'lib/password.php';

class Session {
  public string $token;
  public \DateTime $expire;
  public int $user_id;

  public function __construct(array $row) {
    $this->token = $row['token'];
    $this->expire = \DateTime::createFromFormat('Y-m-d H:i:s', $row['expire'], new \DateTimeZone('UTC'));
    $this->user_id = $row['user_id'];
  }

  public static function create(\mysqli $conn, User $user): Session {
    $token = \Utils\random_token();
    $date = new \DateTime('now', new \DateTimeZone('UTC'));
    $date->add(new \DateInterval('PT' . $_ENV['SESSION_DURATION'] . 'S'));
    $date = $date->format('Y-m-d H:i:s');

    $stmt = $conn->prepare('INSERT INTO sessions (token, expire, user_id) VALUES (?, ?, ?)');
    $stmt->bind_param('ssi', $token, $date, $user->id);

    if (!$stmt->execute()) {
      // TODO: Make custom exception for MySQLi errors
      throw new \Exception();
    }

    if ($stmt->errno != 0) {
      // TODO: Make custom exceptions for MySQLi errors
      throw new \Exception();
    }

    return new Session(['token' => $token, 'expire' => $date, 'user_id' => $user->id]);
  }

  public static function fromToken(\mysqli $conn, string $token): ?Session {
    $stmt = $conn->prepare("SELECT * FROM sessions WHERE token = ?");
    $stmt->bind_param('s', $token);
    
    if (!$stmt->execute()) {
      return null;
    }
    
    if ($stmt->errno != 0) {
      return null;
    }

    $result = $stmt->get_result();

    if ($result->num_rows != 1) {
      return null;
    }

    return new Session($result->fetch_assoc());
  }

  public function isExpired(): bool {
    return $this->expire < new \DateTime();
  }

  public function updateExpire(\mysqli $conn): bool {
    $date = new \DateTime('now', new \DateTimeZone('UTC'));
    $date->add(new \DateInterval('PT' . $_ENV['SESSION_DURATION'] . 'S'));
    $this->expire = $date;

    if (!$conn->query(
      'UPDATE sessions SET expire = "' . $date->format('Y-m-d H:i:s') . '" ' .
      'WHERE token = "' . $this->token . '"'
    )) {
      return false;
    };

    return true;
  }

  public function remove(\mysqli $conn) {
    echo 'reached target remove';
    // $conn->query('DELETE FROM sessions WHERE token = "' . $this->token . '"');
  }
}
