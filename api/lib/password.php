<?php
namespace Utils;

require_once 'lib/env.php';

function hash_password(string $password): string {
    return \password_hash(
        $password,
        PASSWORD_DEFAULT,
        ['cost' => $_ENV['HASH_COST']]
    );
}

function verify_password(string $db_password, string $to_verify): bool {
    return password_verify(
        $to_verify,
        $db_password
    );
}

function random_token(): string {
    return bin2hex(random_bytes(32));
}
