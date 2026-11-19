# Security policy

## Reporting a vulnerability

Report a security problem through GitHub private vulnerability reporting: open the
[Security tab](https://github.com/yangjun9095/zebrafish-3D-atlas/security/advisories/new) of this
repository and file a draft advisory. The report stays private until a fix is published. Do not
open a public issue for a security problem, because the issue text is visible to everyone as soon
as you save it.

Include the version or commit you tested, the steps that reproduce the problem, and what an
attacker gains. I aim to acknowledge a report within five working days and to say within fifteen
working days whether I will fix it and when. I publish the fix in this repository and name the
problem in the release notes and in `CHANGELOG.md`. I credit the reporter unless the reporter
asks me not to.

There is no bounty. This is a personal project and it has no budget for one. I fix what I can
and I say so when I cannot.

## Scope

The atlas is a static web page. It has no backend, no server-side code, no accounts, no
authentication and no database. It sends no data to any server: every anatomy record ships in the
page, and the only state that leaves the browser is the state the reader puts in a link or copies
by hand. It runs no analytics and sets no cookie. It keeps the reader's own settings, panel
layout and slide kits in `localStorage` under keys that start with `zfatlas`, and that data stays
in the reader's browser.

Reports about the following are in scope: code in this repository that mishandles a URL parameter
or a pasted link, a build step that could execute untrusted input, a dependency in the
`dependencies` block of `package.json` with a known vulnerability that reaches the built page, and
the response headers in `public/_headers` and `vercel.json`.

Reports about a deployment I do not control are out of scope. So is any finding that needs the
reader to run hostile code in their own browser console.
