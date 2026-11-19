#!/bin/bash
# Checks every movie in the output folder (or the files given as arguments): container, size,
# duration, frame count, and that the frame at 19.6 s is neither black nor blank. With no
# arguments it also writes <out>/SHA256SUMS. Exit status is the number of files with a problem.
#
#   scripts/movies/check-movies.sh                      # every movie in the output folder
#   scripts/movies/check-movies.sh path/to/one.mp4 ...  # a subset, no SHA256SUMS
#
# ffmpeg and ffprobe come from $FFMPEG and $FFPROBE, else the static 7.0 build under /hpc/apps,
# else the path. The luma bound (Y above 17 on the 16 to 235 scale) tells a rendered frame from
# a black one; the dark preview ground alone measures about 18 to 20.
M="${ATLAS_MOVIE_OUT:-/hpc/projects/data.science/yangjoon.kim/github_repos/zebrafish-3D-atlas-movies}"
F="${FFMPEG:-$([ -x /hpc/apps/ffmpeg/7.0/bin/ffmpeg ] && echo /hpc/apps/ffmpeg/7.0/bin/ffmpeg || echo ffmpeg)}"
P="${FFPROBE:-$([ -x /hpc/apps/ffmpeg/7.0/bin/ffprobe ] && echo /hpc/apps/ffmpeg/7.0/bin/ffprobe || echo ffprobe)}"
nargs=$#
files=("$M"/*.mp4); [ $nargs -gt 0 ] && files=("$@")
bad=0; n=0
printf "%-38s %6s %8s %6s %10s %8s %8s %s\n" file MB seconds frames size codec/pix Y@19.6s note
for f in "${files[@]}"; do
  n=$((n+1)); name=$(basename "$f"); note=""
  bytes=$(stat -c %s "$f"); mb=$(awk -v b="$bytes" 'BEGIN{printf "%.2f", b/1e6}')
  line=$($P -v error -select_streams v:0 -count_frames -show_entries stream=codec_name,width,height,pix_fmt,nb_read_frames -show_entries format=duration -of default=nw=1:nk=1 "$f" | tr '\n' ' ')
  set -- $line; codec=$1; w=$2; h=$3; pix=$4; frames=$5; dur=$6
  y=$($F -hide_banner -ss 19.6 -i "$f" -frames:v 1 -vf "signalstats,metadata=print:key=lavfi.signalstats.YAVG" -f null - 2>&1 | grep -oE "YAVG=[0-9.]+" | head -1 | cut -d= -f2)
  [ "$w" = 1920 ] && [ "$h" = 1080 ] || note="$note size"
  [ "$codec" = h264 ] && [ "$pix" = yuv420p ] || note="$note codec"
  [ "$frames" = 600 ] || note="$note frames=$frames"
  awk -v d="$dur" 'BEGIN{exit !(d>19.9 && d<20.1)}' || note="$note duration=$dur"
  awk -v b="$bytes" 'BEGIN{exit !(b>1500000 && b<12000000)}' || note="$note bytes"
  awk -v y="${y:-0}" 'BEGIN{exit !(y>17)}' || note="$note dark-frame"
  [ -n "$note" ] && bad=$((bad+1))
  printf "%-38s %6s %8s %6s %10s %8s %8s %s\n" "$name" "$mb" "$dur" "$frames" "${w}x${h}" "$codec/$pix" "${y:-?}" "${note:-ok}"
done
echo "checked $n files, $bad with a problem"
if [ $nargs -eq 0 ]; then (cd "$M" && sha256sum ./*.mp4 | sed 's|^\([0-9a-f]*\)  ./|\1  |' > SHA256SUMS) && echo "sha256 sums in $M/SHA256SUMS"; fi
exit $bad
