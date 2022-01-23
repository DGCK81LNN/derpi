#! /usr/bin/env bash
if [ $# -eq 0 -o "$1" == '--help' ]; then
  echo "\
Usage: $(basename $0) html-file
  or:  $(basename $0) --rm html-file
Update or remove dummy query strings in stylesheet and script URLs in HTML
files.

For each <link rel=stylesheet> or <script> element to add a dummy query on, add
this comment after as its href or src attribute (on the same line):

    <!--?_=-->

Example:

    <script src=\"path/to/script.js\"></script><!--?_=-->

This, when a dummy query is added, will become something like:

    <script src=\"path/to/script.js?_=1642956761\"></script><!--?_=-->" >&2
elif [ "$1" == '--rm' ]
then vim -Ens $2 <<'END'
:%substitute/\(href\|src\)\(=".\+\.\)\(js\|css\)\(?_=\d*\)\?\(".\+<!--?_=-->\)/\1\2\3\5/g
wq
END
else vim -Ens $1 <<'END'
execute ':%substitute/\(href\|src\)\(=".\+\.\)\(js\|css\)\(?_=\d*\)\?\(".\+<!--?_=-->\)/\1\2\3?_=' .. strftime("%s") .. '\5/g'
wq
END
fi
