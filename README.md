RegExr (modernized)
===================

# About

[RegExr (modernized)](https://regexr-modernized.giladgd.com/) is an online tool for learning, building, and testing regular expressions. This is a fork of the [original RegExr](https://github.com/gskinner/regexr) modernized by [Gilad S.](https://x.com/giladgd) with a cleaner design and persistent history saved in your browser.

The [original RegExr](https://github.com/gskinner/regexr) was created by [Grant Skinner](http://twitter.com/gskinner) and the nice people at [gskinner.com](http://gskinner.com/).

# Features

* Results update in real-time as you type.
* Supports JavaScript RegEx.
* Roll over a match or expression for details.
* Edits automatically save your expression, text, tests, and Replace and List inputs to History in this browser. Pin, rename, or share an entry from the sidebar. Use New to start a separate entry, and Back or Forward to revisit one.
* Use Tools to explore your results.
* Browse the Reference for help & examples.
* Undo & Redo with cmd-Z / Y in editors.

# Issues & Feature Requests

Please report issues & feature requests on [GitHub](https://github.com/giladgd/regexr-modernized/issues). Please do not post questions about regular expressions (use Stack Overflow instead).

# Contributing

Pull requests for the modernized fork are welcome on [GitHub](https://github.com/giladgd/regexr-modernized).

Please make sure they are well formatted and follow the style specified out in the existing files.

# License

Original RegExr code (C) 2017 gskinner.com, inc. Modifications (C) 2026 Gilad S.

This version of RegExr is licensed under [GPL v3](LICENSE). It comes without warranty. Third-party components retain their own licenses. See the [copyright notices](public/NOTICE.txt) for details.

# Development

Use Node.js 24+ and install dependencies with `npm ci`.
Run `npm start` to start the dev server.
Run `npm run build` to generate the GitHub Pages site in `dist/`.
