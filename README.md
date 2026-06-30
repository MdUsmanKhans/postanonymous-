# Unsigned

**Live:** [https://postanonymous.netlify.app/](https://postanonymous.netlify.app/)

An anonymous post board. Anyone can browse without an account; posting requires a quick sign-up but never reveals who posted what. Posts are shown with nothing but a timestamp — no names, no avatars, no identifiers.

## Overview

Unsigned is a minimal social board built around one idea: content without identity. Every post is text-only, image-only, or both, and once it's pinned to the board it's indistinguishable from any other user's post. The only context shown is when it was posted.

## Features

| Feature | Description |
|---|---|
| Open browsing | The board is visible to everyone, no login required to read posts. |
| Gated posting | Creating a post requires a signed-in account, used purely for spam control. |
| Flexible post types | Text only, image only, or text + image — all supported in one composer. |
| Anonymous by design | No username, email, or user ID is ever attached to a post or shown on the board. |
| Timestamp only | Each post displays just the date and time it was pinned. |
| Realtime feed | New posts appear instantly for all users via live Firestore listeners. |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, vanilla JavaScript |
| Database | Firebase Firestore — post text and metadata |
| Image hosting | Cloudinary — image uploads and delivery |
| Authentication | Firebase Authentication (Email/Password) |

## Architecture

```
┌─────────────┐        text + metadata         ┌────────────────────┐
│   Browser   │ ──────────────────────────────▶│ Firebase Firestore  │
│  (composer) │                                 └────────────────────┘
│             │        image file               ┌────────────────────┐
│             │ ──────────────────────────────▶│     Cloudinary      │
│             │ ◀──────────────────────────────│     image URL       │
│             │                                 └────────────────────┘
│             │        sign up / log in         ┌────────────────────┐
│             │ ──────────────────────────────▶│   Firebase Auth     │
└─────────────┘                                 └────────────────────┘
```

When a post includes an image, the image is uploaded directly to Cloudinary from the browser and the returned URL is stored alongside the post's text in Firestore. No image data ever touches Firestore directly.

## Project Structure

```
MEMES_POST/
├── index.html              # Page structure — board, composer, auth modal
├── style.css                # Visual design
├── app.js                   # Composer logic, auth gating, realtime feed
├── firebase-config.js       # Firebase project configuration
├── cloudinary-config.js     # Cloudinary upload configuration
└── README.md
```

## How It Works

### Browsing
On load, the app subscribes to a live Firestore query over the `posts` collection, ordered by creation time. Any post added anywhere appears on the board immediately, for every visitor, with no login required.

### Posting
1. The user taps the **+** button.
2. If signed out, a login/signup form appears first.
3. Once authenticated, the composer opens, accepting text, an image, or both.
4. On submit, any attached image is uploaded to Cloudinary; the resulting URL plus the post's text and a server timestamp are written to Firestore.
5. The new post appears on the board in real time for all visitors.

### Identity
Authentication exists solely to gate who can publish. The signed-in user's identity (email, UID) is never written into a post document and never rendered in the UI — posts remain anonymous to every other visitor regardless of who created them.

## Data Model

**Firestore — `posts` collection**

| Field | Type | Description |
|---|---|---|
| `text` | string \| null | Post body text, or null for image-only posts |
| `imageUrl` | string \| null | Cloudinary image URL, or null for text-only posts |
| `createdAt` | timestamp | Server-generated time the post was pinned |

## Roadmap

- Rate limiting on posting frequency
- A report/moderation flow for inappropriate content
- Pagination for boards with a large post history
- Password reset flow