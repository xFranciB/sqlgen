<?php

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    // TODO: error
}

if (!isset($_POST['email']) || !isset($_POST['email'])) {
    // TODO: error
}

$email = filter_var($_POST['email'], FILTER_VALIDATE_EMAIL);

if (!$email) {
    // TODO: error
}

$password = $_POST['password'];

require_once 'db.php';

$db = db_conn();

if (is_null($db)) {
    // TODO: error
}
