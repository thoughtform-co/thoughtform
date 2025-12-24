# /stack - Get Project Stack Documentation

Fetch documentation for all major libraries used in this project.

## Instructions

This project uses the following stack. Fetch Context7 docs for each as needed:

| Library       | Context7 ID                | Use Case      |
| ------------- | -------------------------- | ------------- |
| Next.js       | `vercel/next.js`           | Framework     |
| React         | `facebook/react`           | UI            |
| Supabase      | `supabase/supabase-js`     | Database      |
| Tailwind      | `tailwindlabs/tailwindcss` | Styling       |
| Three.js      | `mrdoob/three.js`          | 3D            |
| R3F           | `pmndrs/react-three-fiber` | React + Three |
| Framer Motion | `framer/motion`            | Animation     |
| Zustand       | `pmndrs/zustand`           | State         |
| GSAP          | `greensock/gsap`           | Animation     |

## Usage

```
/stack           # List available libraries
/stack next.js   # Get specific library docs
/stack 3d        # Get Three.js + R3F + Drei docs
```

## Implementation

1. If no argument, list the stack with brief descriptions
2. If argument matches a library, fetch its Context7 docs
3. If argument is a category (like "3d"), fetch related libraries
