<?php
namespace Models;

require_once 'lib/env.php';
require_once 'lib/password.php';

class User {
  public int $id;
  public string $username;
  public string $password;
  public array $dati;

  public function __construct(array $row) {
    $this->id = $row['ID'];
    $this->username = $row['username'];
    $this->password = $row['password'];
    $this->dati = json_decode($row['dati'], true);
  }

  public static function create(\mysqli $conn, string $username, string $password): void {
    $password = \Utils\hash_password($password);

    $stmt = $conn->prepare('INSERT INTO users (username, password, dati) VALUES (?, ?, "{databases: []}")');
    $stmt->bind_param('ss', $username, $password);

    if (!$stmt->execute()) {
      // TODO: Make custom exception for MySQLi errors
      throw new \Exception();
    }

    if ($stmt->errno != 0) {
      // TODO: Make custom exceptions for MySQLi errors
      throw new \Exception();
    }
  }

  public static function auth(\mysqli $conn, string $username, string $password): ?User {
    $stmt = $conn->prepare('SELECT * FROM users WHERE username = ?');
    $stmt->bind_param('s', $username);

    if (!$stmt->execute()) {
      // TODO: Make custom exception for MySQLi errors
      throw new \Exception();
    }

    if ($stmt->errno != 0) {
      // TODO: Make custom exceptions for MySQLi errors
      throw new \Exception();
    }

    $row = $stmt->get_result();

    if ($row->num_rows != 1) {
      return null;
    }

    $row = $row->fetch_assoc();

    if (!\Utils\verify_password($row['password'], $password)) {
      return null;
    }

    return new User($row);
  }

  public static function fromID(\mysqli $conn, int $id): ?User {
    $stmt = $conn->prepare('SELECT * FROM users WHERE ID = ?');
    $stmt->bind_param('i', $id);

    if (!$stmt->execute()) {
      return null;
    }

    $result = $stmt->get_result();

    if ($result->num_rows !== 1) {
      return null;
    }

    return new User($result->fetch_assoc());
  }

  public function updateDati(\mysqli $conn, array $newdati): void {
    $stmt = $conn->prepare('UPDATE users SET dati = ? WHERE ID = ?');
    $newdati = json_encode($newdati);
    $stmt->bind_param('si', $newdati, $this->id);

    if (!$stmt->execute()) {
      throw new \Exception();
    }
  }
}
