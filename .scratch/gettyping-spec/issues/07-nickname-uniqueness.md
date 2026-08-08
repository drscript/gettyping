# Decide nickname uniqueness & identity persistence handling

Type: grilling

## Question

Nicknames are the only identity credential (no password, per [0001-nickname-only-identity.md](../../../docs/adr/0001-nickname-only-identity.md)). Must a Nickname be globally unique, or can two Players share one (and if so, how does the Leaderboard disambiguate them)? What happens when a Player's local browser storage/token is cleared — do they lose their history and have to start over under a new identity, or is there any recovery path (e.g. a recovery code) within the no-password constraint?
