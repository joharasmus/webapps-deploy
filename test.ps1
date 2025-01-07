git add --all;
$commitMsg = $args[0];
git commit -m $commitMsg;
git push; 
gh release delete v2 -y --cleanup-tag;  
gh release create v2 -n "";