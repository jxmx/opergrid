# OperGrid

A flat-file PHP signup grid for amateur radio operating events.

This tool is intended to be a "quick and dirty" signup method for
integration into a larger online ecosystem for a radio club or
similar organization. As such, it does not have any form of
real security, accounts, abuse-protection, etc. Please be thoughtful
when deploying this.

## Main Files

```
opergrid/
├── public                ← root/DocumentRoot for webserver
      ├── index.php       ← Main UI (the grid)
      ├── api.php         ← REST API (read/write signups)
├── data
      ├── config.json     ← Event config: stations + schedule
      ├── signups.json    ← Signup data (auto-created / editable)
└── config.php            ← Core configuration
```

## Requirements

- PHP 8.x-enabled webserver write permission to the directory `data/`

## Setup

1. Copy all files to a reasonable location (e.g. `/var/www/opergrid/`)
2. Make sure the `data` directory is writable by the same userver as
   the webserver. For example on Debian the user is `www-data`:
   ```bash
   chmod 755 /var/www/opergrid/data
   chmod 664 /var/www/opergrid/data/*.json
   chown -R www-data:www-data /var/www/opergrid/data/
   ```
3. Edit **config.json** to set your event details, stations, and hours.
4. Edit your webserver configuration to serve the contents of
   /var/www/opergrid/public either as the root of the site or
   using an appropriate sub-director rewrite/Location. Restart
   when complete.
5. Open the location in your browser.

## config.json Reference

```json
{
  "event": {
    "name": "Your Event Name"
  },
  "stations": [
    { "id": "sta1", "name": "Station 1", "band": "20m", "mode": "SSB" }
    // add as many stations as you like
  ],
  "schedule": {
    "start": "2026-06-27 08:00",   // "YYYY-MM-DD HH:MM" — 24-hour local time
    "end":   "2026-06-28 20:00"    // can span multiple days; one row per hour generated
    "tz":    "EST (UTC-4)"         // this is a DISPLAY ONLY representation of the timezone you want to use
  }
}
```

Day boundaries are automatically highlighted in the grid with an amber divider line and a date label (e.g. "Sat 6/28") in the time column.

The ID must be no more than 10 characters.

## signups.json Format

Keys are `stationId|HH:MM`. Written automatically by api.php.

```json
{
  "sta1|08:00": {
    "name": "Jane Smith",
    "callsign": "W1XYZ",
    "email": "jane@example.com",
    "claimed_at": "2026-04-01T10:23:00+00:00"
  }
}
```

These fields are limited to 30 characters each except `callsign` which is limited
to 10 characters. Fields will be auto-truncated as necessary.

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `api.php?action=config[&event=ID]` | Returns config.json |
| GET | `api.php?action=signups[&event=ID]` | Returns all signups |
| POST | `api.php?action=claim[&event=ID]` | Claim a slot |

### POST claim body
```json
{
  "station": "sta1",
  "timeslot": "08:00",
  "name": "Jane Smith",
  "callsign": "W1XYZ",
  "email": "jane@example.com"
}
```

## Resetting Signups

Simply replace `signups.json` with `{}` to clear all signups.

## Multiple Events

OperGrid can handle multiple events at the same time. By default,
the system uses an event name of "default" internally which uses
the `config.js` and `signups.js` files listed above.

However, the URIs can have an `event=` parameter which will cause
the system to ouse a different set of files, thus effectively
creating a separate event. For example `event=foo` will cause
the use of `config_foo.js` and `signups_foo.js` (Note that
the underscore `_` is added automatically). One can create as many
arbitrary `config_$event.js` files as needed. There is no main menu
to find/select events however as, again, this is intended to be
used within a large web ecosystem.
