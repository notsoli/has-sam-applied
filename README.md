# has sam applied to a job today?

a piece of zero-dependency job application log accountability art. any less than one job application per weekday will keep me unemployed. any more and i will explode.

## how it works

- log job applications in `src/log.json` with date, time, and company info
- a deno script (`src/build.ts`) reads the log and builds a static html page
- updates daily at 5am edt via github actions or on commits to main branch

## local development

build the site:
```
deno run --allow-read --allow-write src/build.ts
```

then open `www/index.html` in your browser.

## adding entries

edit `src/log.json`:

```json
{
    "timezone": "America/New_York",
    "days": {
        "2025-12-31": [
            { "time": "13:30", "message": "design engineer @ adobe" }
        ]
    }
}
```

- dates use `YYYY-MM-DD` format
- times use 24-hour `HH:MM` format
- the site will convert them to human-readable formats
