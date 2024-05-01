<?php
namespace Utils\Sanitize;

require_once 'lib/database.php';

/**
 * Used as a response to the functions defined below.
 */
class Response {
  public bool $status;
  public string $error;
}

/**
 * Array holding the functions that check the validity
 * of input values. Functions can be added by the
 * `SPEC` class in case of checks that require
 * more information.
 */
$spec_function = [];

abstract class SPEC {
  const Required = 0;
  const String = 1;
  const Integer = 2;
  const Email = 3;
  const JSON = 4;

  // This functions assumes a safe `$table` and `$row` value
  public static function UniqueStr(\mysqli $conn, string $table, string $row): string {
    global $spec_function;

    $spec_function["uniquestr:$table->$row"] = function(mixed &$value) use ($spec_function, $conn, $table, $row): Response {
      unset($spec_function["uniquestr:$table->$row"]);

      $stmt = $conn->prepare("SELECT * FROM $table WHERE $row = ?");
      $stmt->bind_param('s', $value);
      
      if (!$stmt->execute()) {
        // TODO: Make custom exception for MySQLi errors
        throw new \Exception();
      }

      $res = new Response();

      if ($stmt->get_result()->num_rows > 0) {
        $res->status = false;
        $res->error = 'alreadyused';
      } else {
        $res->status = true;
      }

      return $res;
    };
    
    return "uniquestr:$table->$row";
  }
}

$spec_function[SPEC::String] = function(mixed &$str): Response {
  $res = new Response();

  if (!is_string($str)) {
    $res->error = 'invalid';
    $res->status = false;
    return $res;
  }

  $str = trim($str);
  $res->status = true;
  return $res;
};

$spec_function[SPEC::Integer] = function(mixed &$int): Response {
  $res = new Response();

  if (is_int($int)) {
    $res->status = true; 
  } else {
    $res->status = false;
    $res->error = 'invalid';
  }

  return $res;
};

$spec_function[SPEC::Email] = function(mixed &$str) use ($spec_function): Response {
  $res = $spec_function[SPEC::String]($str);
  if (!$res->status) return $res;

  if (!filter_var($str, FILTER_VALIDATE_EMAIL)) {
    $res->status = false;
    $res->error = 'invalid';
  }

  return $res;
};

$spec_function[SPEC::JSON] = function (mixed &$str): Response {
  $res = new Response();

  if (is_array($str)) {
    $res->status = true;
  } else {
    $res->status = false;
    $res->error = 'invalid';
  }

  return $res;
};

/**
 * Used as a response to the `check` function defined below.
 */
class CheckResponse {
  public bool $status;
  public array $error;

  public function __construct() {
    $this->status = true;
    $this->error = [];
  }

  public function add_error(string $key, string $value): void {
    $this->status = false;
    $this->error[$key] = $value;
  }
}

/**
 * Automatically checks the validity of the inputs by using
 * the functions defined earlier in this file.
 *  
 * This function expects an array $source and an array $spec
 * defined in the following way:
 *
 * $source = [
 *   <name> => <value>
 *   ...
 * ]
 *
 * $spec = [
 *  <name> => SPEC[],
 *   ...
 * ]
 */
function check(array $source, array $spec): CheckResponse {
  global $spec_function;

  $res = new CheckResponse();

  foreach ($spec as $name => $reqs) {
    if (!isset($source[$name])) {
      if (in_array(SPEC::Required, $reqs)) {
        $res->add_error($name, 'empty');
      }

      continue;
    }

    foreach ($reqs as $req) {
      if ($req == SPEC::Required) continue;
      if (!array_key_exists($req, $spec_function)) {
        throw new \ValueError($req);
      }

      $tmp = $spec_function[$req]($source[$name]);
      
      if (!$tmp->status) {
        $res->add_error($name, $tmp->error);
        break;
      }
    }
  }

  return $res;
}
