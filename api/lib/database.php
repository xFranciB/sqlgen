<?php
namespace Database;

require_once 'lib/env.php';

function connect(): ?\mysqli {
  try {
    $conn = mysqli_connect(
      $_ENV['DB_HOSTNAME'],
      $_ENV['DB_USERNAME'],
      $_ENV['DB_PASSWORD'],
      $_ENV['DB_DATABASE']
    );
  } catch (Exception $e) {
    goto conn_error;
  }

  return $conn;

conn_error:
  // TODO: Error handling
  error_log('ERROR while connecting to Database: ' . mysqli_connect_error());
  return null;
}