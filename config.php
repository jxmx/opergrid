<?php

/**
 *
 *    Copyright 2026 Jason D. McCormick
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      https://github.com/jxmx/opergrid/blob/main/LICENSE
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 * ~~~~~
 *
 * config.php holds the basic configuration for the PHP part of the
 * application. The actual event data and storage are JSON files in
 * the data/ directory. This prevents the config.php from needing to
 * be writable by the webserver.
 *
 */


// Uncomment these for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// These are the root locations for the configuration and signup
// files. This directory must have read/write access by the
// user of the webserver.
define('DATA_BASE', __DIR__ . '/data');

// Page Title
// This is the text used in the <head><title>
define('PAGE_TITLE', "Field Day Signup");

// Logo file
// This can be a relative or abosolute URL. If relative, the
// relative path is relative to index.php NOT the root of the
// application.
define('LOGO_URL', 'img/opergrid_logo_75.webp');

// Favicons block
define('FAVICON_LINKS',<<<EOT
<!-- Favicons -->
<link rel="icon" type="image/png" sizes="32x32" href="img/opergrid_logo_32.png?v=1">
<link rel="apple-touch-icon" sizes="180x180" href="img/opergrid_logo_180.png?v=1">
<link rel="icon" type="image/png" sizes="192x192" href="img/opergrid_logo_192.png?v=1">
<link rel="icon" type="image/png" sizes="512x512" href="img/opergrid_logo_512.png?v=1">
EOT
);