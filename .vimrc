" Question-Mark UnderScore EQuals
command QmUsEq {
  execute ':%substitute/\(href\|src\)\(=".\+\.\)\(js\|css\)\(?_=\d*\)\?\(".\+<!--?_=-->\)/\1\2\3?_=' .. strftime("%s") .. '\5/g'
}
command Q QmUsEq
command QmUsEqRm {
  :%substitute/\(href\|src\)\(=".\+\.\)\(js\|css\)\(?_=\d*\)\?\(".\+<!--?_=-->\)/\1\2\3\5/g
}

