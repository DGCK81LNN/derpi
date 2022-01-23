#! /usr/bin/env bash

if [ $# -eq 0 -o "$1" == "--help" ]; then
  echo "\
Usage: `basename $0` [file]... [--ls [directory]...]
Sync files to server, and/or list files on server

Set environment variable LNNDERPI_FTP_PASSWD to avoid having to enter password
every time" >&2
  exit
fi

if [ "$LNNDERPI_FTP_PASSWD" ]; then
  password="$LNNDERPI_FTP_PASSWD"
else
  echo -en "\e[0;30;46m ***? \e[36;49m\e[m "
  read -s password
  echo
  if [ ! "$password" ]; then
    exit 1
  fi
fi

if [ -t 1 ]; then # stdout is opened on a terminal
  echo -en "\e[?1049h\e[H"
fi

declare -a commands
commands+=("user p0ny_29522786 \$password")
commands+=("cd htdocs/derpi/")

ls_mode=0
for file; do
  escaped_file=$(printf '%q' "$file")
  if [ "$file" == "--ls" ]; then
    ls_mode=2
  elif [ $ls_mode -eq 0 ]; then
    if [ -f "$file" ]; then
      commands+=("put $(realpath $escaped_file) ./$escaped_file")
    else
      commands+=("del $escaped_file")
    fi
  else
    ls_mode=1
    commands+=("ls $escaped_file")
  fi
done
if [ $ls_mode -eq 2 ]; then
  commands+=("ls")
fi

input=""
echo -e "Commands to run:"
for cmd in "${commands[@]}"; do
  echo " > $cmd"
  input+="$cmd"$'\n'
done
echo "Invoking ftp..."

ftp -v -n ftpupload.net <<< ${input/\$password/$password}

echo
if [ -t 1 ]; then # stdout is opened on a terminal
  read -e -p "Done, press Enter to return"
  echo -en "\e[?1049l"
else
  echo "Done"
fi

