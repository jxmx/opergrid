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
 */

require_once(__DIR__ . "/../config.php");
?>

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo PAGE_TITLE; ?></title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Barlow+Condensed:wght@400;600;700;900&family=Barlow:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/main.css">
    <?php echo FAVICON_LINKS; ?>
  </head>
<body>

<header class="site-header">
  <div class="logo"><img src="<?php echo LOGO_URL; ?>"></div>
  <div class="event-info">
    <h1 id="event-name">Loading…</h1>
    <div class="meta" id="event-meta"></div>
  </div>
  <div class="legend">
    <div class="legend-item">
      <div class="legend-swatch" style="background:var(--surface);border:1px dashed var(--border)"></div>
      Open
    </div>
    <div class="legend-item">
      <div class="legend-swatch" style="background:var(--accent-dim);border:1px solid var(--accent)"></div>
      Claimed
    </div>
  </div>
</header>

<main>
  <div class="grid-wrapper">
    <table class="schedule-grid" id="grid">
      <thead><tr id="grid-head"></tr></thead>
      <tbody id="grid-body"></tbody>
    </table>
  </div>
</main>

<!-- Modal -->
<div class="modal-overlay" id="modal-overlay">
  <div class="modal" id="modal">
    <button class="modal-close" id="modal-close" aria-label="Close">&times;</button>
    <h2 id="modal-title"></h2>
    <div class="slot-info" id="modal-slot-info"></div>
    <div id="modal-body"></div>
  </div>
</div>

<!-- Toast -->
<div class="toast" id="toast"></div>

<script src="js/opergrid.js" defer></script>
</body>
</html>
