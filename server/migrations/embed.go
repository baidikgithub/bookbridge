// Package migrations embeds the SQL schema files so the API can apply them on startup.
package migrations

import "embed"

//go:embed *.sql
var FS embed.FS
