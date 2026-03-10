# AI Agent Rules

This repository hosts small browser-based tools for real estate operations.

AI coding agents (such as Codex) should follow the rules below when modifying or adding features.

---

# Project Structure

Each tool must live inside the `/tools` directory.

Example:

/tools
/trouble-diagnosis
index.html
styles.css
script.js

The root `/tools/index.html` is a **tool directory page** that links to all tools.

Agents should automatically add new tools to this page.

---

# Tool Requirements

All tools must follow these constraints:

• Must run as **static web apps**
• No backend required
• Must work on **GitHub Pages**
• Only use **HTML / CSS / JavaScript**

No frameworks unless explicitly requested.

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

meta description

Example:

<meta name="description" content="Free real estate tool for property management.">

Use Japanese language.

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

1. create new folder under `/tools`
2. generate index.html
3. generate styles.css
4. generate script.js
5. update `/tools/index.html` to add a card link

Example link:

<a href="./rent-calculator/">家賃計算ツール</a>

---

# Target Users

Japanese property managers
Real estate agencies
Landlords

Tools should solve **practical real estate problems**.

Examples:

rent increase simulation
repair responsibility checker
lease risk diagnosis
trouble diagnosis

---

# Development Philosophy

Tools should be:

small
fast
simple
useful

Prefer **practical utility** over complex architecture.

This repository is a **collection of lightweight tools**, not a large web application.
