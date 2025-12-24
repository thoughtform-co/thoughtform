# /docs - Fetch Library Documentation

Fetch up-to-date documentation for a library using Context7.

## Arguments

- `$ARGUMENTS` - The library name or specific topic to get docs for

## Instructions

1. Parse the library name from $ARGUMENTS
2. Use the Context7 skill to fetch documentation
3. If the library name is ambiguous, search for it first
4. Return a summary of the relevant documentation

## Example Usage

```
/docs next.js app router
/docs supabase authentication
/docs framer-motion gestures
```

## Implementation

When this command is invoked:

1. Extract the library name (first word of $ARGUMENTS)
2. Fetch docs using: `curl -s "https://context7.com/api/v1/{library_id}/llms.txt?tokens=5000"`
3. If topic is specified (remaining words), focus the response on that topic
4. Summarize the key points relevant to the query
