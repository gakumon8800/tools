# AI Agent Rules

This repository hosts small browser-based tools for real estate operations.

AI coding agents (such as Codex) should follow the rules below when modifying or adding features.

---

# Repository Structure

Each tool must live in its own folder **at the repository root**.

Example structure:

/
index.html
trouble-diagnosis/
 index.html
 styles.css
 script.js

rent-increase-check/
 index.html
 styles.css
 script.js

The root **/index.html** is the tool directory page.

Agents must update **/index.html** when adding new tools.

---

# Tool Requirements

All tools must follow these constraints:

• Must run as **static web apps**
• No backend required
• Must work on **GitHub Pages**
• Only use **HTML / CSS / JavaScript**

Avoid:

React
Next.js
Node servers
Build pipelines

---

# Design Rules

UI should be simple and readable.

Preferred design:

• light background
• card style layout
• mobile friendly
• minimal dependencies

Accent color:

#008080

---

# Code Rules

Keep files small and readable.

Use this structure:

index.html
UI structure

styles.css
visual design

script.js
logic

Avoid putting logic directly inside HTML.

---

# SEO Rules

Every tool page should include:

title
meta description

Example:

<meta name="description" content="Free real estate tool for property management.">

Language:

Japanese

---

# GitHub Pages Compatibility

Agents must ensure:

relative paths only

Example:

correct

<link rel="stylesheet" href="styles.css">

wrong

<link rel="stylesheet" href="/styles.css">

---

# When Creating New Tools

Steps:

1. create a new folder at repository root
2. generate index.html
3. generate styles.css
4. generate script.js
5. update /index.html to add a card link

Example link:

<a href="./rent-increase-check/">家賃値上げ診断ツール</a>

---

# Target Users

Japanese property managers
Landlords
Tenants
