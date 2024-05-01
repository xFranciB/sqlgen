<?php
namespace Utils;

\Dotenv\Dotenv::createImmutable(__DIR__ . '/..')->load();

$_ENV['DEBUG'] = filter_var($_ENV['DEBUG'], FILTER_VALIDATE_BOOLEAN);
