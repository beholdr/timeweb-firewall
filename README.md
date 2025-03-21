# Timeweb firewall

Github action for temporarily whitelisting IP of the current runner in the
[Timeweb firewall](https://timeweb.cloud).

## Usage

1. Create [API token](https://timeweb.cloud/my/api-keys) with a Network manage
   access.
2. [Create new Firewall](https://timeweb.cloud/my/firewalls/create) and apply it
   to your resorce(s)
3. Add this action to your workflow:

```yml
jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: beholdr/timeweb-firewall@v0.1.0
        with:
          firewall: <GUID-OF-THE-FIREWALL>
          token: ${{ secrets.TIMEWEB_FIREWALL_TOKEN }}
```

### Inputs

- `firewall` — ID of the firewall (GUID in the URL on the firewall’s page)
- `token` — Timeweb API token (recommend to use a secret)
- `protocol` — protocol of the rule, default: `tcp`
- `port` — port of the rule, default: `22`
