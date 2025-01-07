git add --all;
$commitMsg = $args[0];
git commit -m $commitMsg;
git push; 
gh release delete v2 -y --cleanup-tag;  
gh release create v2 -n "";
gh workflow run -R 'joharasmus/moreFairStats' 'morefairstats.yml';
gh run list -R 'joharasmus/moreFairStats' --workflow=morefairstats.yml --json databaseId -q '.[0].databaseId';